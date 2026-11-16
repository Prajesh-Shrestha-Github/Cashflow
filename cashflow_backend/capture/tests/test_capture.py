"""SMS parser and ingest endpoint. Plan: docs/PLAN.md. Today is 22 Nov 2026."""
from datetime import date, time
from decimal import Decimal as D
from unittest.mock import patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from accounts.models import User
from capture.parser import parse_sms
from transactions.models import Transaction
from workspaces.models import Account, personal_workspace

INGEST = "/api/capture/ingest/"
TOKEN = "/api/capture/token/"
TODAY = date(2026, 11, 22)
SMS = "Dear user, Your account ##1769 is debited by NPR 1140 on 2026-11-12 14:25:44 by:FonePay:FPQR:1406231943"


class ParserTests(SimpleTestCase):
    def test_the_sample_debit(self):
        sms = parse_sms(SMS, TODAY)
        self.assertEqual((sms.date, sms.amount, sms.direction), (date(2026, 11, 12), D("1140"), "out"))
        self.assertEqual((sms.description, sms.reference, sms.account, sms.time),
                         ("Fonepay QR payment", "1406231943", "1769", time(14, 25, 44)))

    def test_a_credit_with_commas_and_paisa(self):
        sms = parse_sms("Your account ##1769 is credited by NPR 1,25,000.50 on 2026-11-01 09:00:00 by:Salary Nov", TODAY)
        self.assertEqual((sms.amount, sms.direction), (D("125000.50"), "in"))
        self.assertEqual((sms.description, sms.reference), ("Salary Nov", ""))

    def test_no_remark_or_time_still_gets_a_name(self):
        sms = parse_sms("Your account 1769 is debited by NPR 50 on 2026-11-12", TODAY)
        self.assertEqual((sms.description, sms.time), ("Bank debit", None))

    def test_what_is_not_a_trustworthy_alert_is_none(self):
        for text in (
            "Recharge NPR 100 and get 1GB free!",
            "",
            SMS.replace("2026-11-12", "2026-11-23"),      # tomorrow
            SMS.replace("2026-11-12", "2026-13-40"),      # not a date
            SMS.replace("14:25:44", "25:99:99"),          # not a time
            SMS.replace("NPR 1140", "NPR 0"),
            SMS.replace("NPR 1140", "NPR 99999999999"),   # larger than the column holds
        ):
            self.assertIsNone(parse_sms(text, TODAY), text)


class IngestTests(TestCase):
    def setUp(self):
        cache.clear()                                     # the throttle counts in the cache
        self.user = User.objects.create_user("sms_user", password="x")
        self.web = APIClient()
        self.web.force_authenticate(self.user)
        key = self.web.post(TOKEN).data["token"]
        self.phone = APIClient()
        self.phone.credentials(HTTP_AUTHORIZATION=f"Token {key}")
        patcher = patch("capture.service._today", return_value=TODAY)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_the_sample_becomes_one_uncategorized_expense(self):
        r = self.phone.post(INGEST, {"text": SMS}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["transaction"]["amount"], "1140.00")
        self.assertEqual(r.data["transaction"]["direction"], "out")
        t = Transaction.objects.get(user=self.user)
        self.assertEqual((t.date, t.amount, t.category.name, t.category.type), (date(2026, 11, 12), D("1140"), "Uncategorized", "expense"))
        self.assertEqual((t.time, t.reference, t.description), (time(14, 25, 44), "1406231943", "Fonepay QR payment"))
        self.assertEqual((t.account.identifier, t.account.workspace, t.workspace), ("1769", personal_workspace(self.user), personal_workspace(self.user)))

    def test_messages_for_one_account_share_one_account_row(self):
        self.phone.post(INGEST, {"text": SMS}, format="json")
        self.phone.post(INGEST, {"text": SMS.replace("1406231943", "1406239999")}, format="json")
        self.assertEqual((Transaction.objects.count(), Account.objects.count()), (2, 1))

    def test_a_statement_does_not_bring_a_captured_payment_in_again(self):
        self.phone.post(INGEST, {"text": SMS}, format="json")
        statement = ("date,description,amount\n"
                     "2026-11-12,FPQR 1406231943 BHATBHATENI,-1140\n"      # the captured payment, in the bank's words
                     "2026-11-12,ATM WITHDRAWAL,-1140\n")                  # same day and amount, but a different payment
        with patch("statements.service._today", return_value=TODAY):
            r = self.web.post("/api/statements/import/", {"file": SimpleUploadedFile("s.csv", statement.encode())})
        self.assertEqual((r.data["imported"], r.data["duplicates"]), (1, 1))
        self.assertEqual(Transaction.objects.count(), 2)

    def test_the_same_message_twice_is_saved_once(self):
        self.phone.post(INGEST, {"text": SMS}, format="json")
        r = self.phone.post(INGEST, {"text": SMS}, format="json")
        self.assertEqual((r.status_code, r.data), (200, {"status": "duplicate"}))
        self.assertEqual(Transaction.objects.count(), 1)

    def test_two_payments_of_the_same_amount_on_one_day_are_both_kept(self):
        self.phone.post(INGEST, {"text": SMS}, format="json")
        self.phone.post(INGEST, {"text": SMS.replace("1406231943", "1406239999").replace("14:25:44", "18:02:10")}, format="json")
        self.assertEqual(Transaction.objects.count(), 2)

    def test_other_messages_are_ignored_and_not_stored(self):
        r = self.phone.post(INGEST, {"text": "Recharge NPR 100 and get 1GB free!"}, format="json")
        self.assertEqual((r.status_code, r.data), (200, {"status": "ignored"}))
        self.assertEqual(Transaction.objects.count(), 0)

    def test_bad_input_is_refused(self):
        for body in ({}, {"text": ""}, {"text": 5}, {"text": "x" * 1001}):
            self.assertEqual(self.phone.post(INGEST, body, format="json").status_code, 400, body)

    def test_no_token_or_a_revoked_token_gets_nothing(self):
        self.assertEqual(APIClient().post(INGEST, {"text": SMS}, format="json").status_code, 401)
        self.assertEqual(self.web.delete(TOKEN).status_code, 204)
        self.assertEqual(self.phone.post(INGEST, {"text": SMS}, format="json").status_code, 401)
        self.assertEqual(Transaction.objects.count(), 0)

    def test_the_capture_token_opens_nothing_else(self):
        self.assertEqual(self.phone.get("/api/transactions/").status_code, 401)
        self.assertEqual(self.phone.post(TOKEN).status_code, 401)
        self.assertEqual(self.phone.delete(TOKEN).status_code, 401)

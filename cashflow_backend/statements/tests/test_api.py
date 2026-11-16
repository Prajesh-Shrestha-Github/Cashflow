"""Preview and import. Spec: cashflow-product/docs/specs/statement-import.md (SI-07..SI-14). Today is 22 Nov 2026."""
from datetime import date
from decimal import Decimal as D
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from transactions.models import Category, Transaction

PREVIEW = "/api/statements/preview/"
IMPORT = "/api/statements/import/"
TODAY = date(2026, 11, 22)

STATEMENT = (
    "date,description,amount,balance\n"
    "2026-11-03,Salary,100000,100000\n"
    "2026-11-03,Rent,-40000,60000\n"
    "2026-11-10,Momo,-250.50,59749.50\n"
)


def upload(text, name="statement.csv"):
    return {"file": SimpleUploadedFile(name, text.encode("utf-8"), content_type="text/csv")}


def assert_no_floats(testcase, value, path="response"):
    if isinstance(value, float):
        testcase.fail(f"float at {path}: {value!r}")
    if isinstance(value, dict):
        for k, v in value.items():
            assert_no_floats(testcase, v, f"{path}.{k}")
    if isinstance(value, list):
        for i, v in enumerate(value):
            assert_no_floats(testcase, v, f"{path}[{i}]")


class Base(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("stmt_user", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        patcher = patch("statements.service._today", return_value=TODAY)
        patcher.start()
        self.addCleanup(patcher.stop)

    def preview(self, text, **kw):
        return self.client.post(PREVIEW, upload(text), format="multipart", **kw)

    def do_import(self, text, client=None):
        return (client or self.client).post(IMPORT, upload(text), format="multipart")

    def mine(self, user=None):
        return Transaction.objects.filter(user=user or self.user)


class PreviewTests(Base):
    def test_si13_preview_saves_nothing(self):
        r = self.preview(STATEMENT)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.mine().count(), 0)
        self.assertEqual(Category.objects.count(), 0)

    def test_preview_lists_every_row_with_its_status_and_string_money(self):
        body = self.preview(STATEMENT).json()
        self.assertEqual(body["summary"], {"new": 3, "duplicates": 0, "errors": 0})
        first = body["rows"][0]
        self.assertEqual((first["row"], first["date"], first["description"], first["amount"], first["direction"], first["status"]),
                         (1, "2026-11-03", "Salary", "100000.00", "in", "new"))
        self.assertEqual(body["rows"][2]["amount"], "250.50")
        assert_no_floats(self, body)

    def test_si06_bad_rows_are_reported_with_their_numbers_good_rows_still_shown(self):
        body = self.preview("date,amount\n2026-11-10,-5\nnope,-6\n").json()
        self.assertEqual(body["summary"], {"new": 1, "duplicates": 0, "errors": 1})
        self.assertEqual(body["errors"][0]["row"], 2)
        self.assertTrue(body["errors"][0]["message"])

    def test_si05_an_unusable_file_is_a_400_with_a_plain_message(self):
        r = self.preview("date,description\n2026-11-10,x\n")
        self.assertEqual(r.status_code, 400)
        self.assertIn("amount", r.json()["error"])

    def test_no_file_is_a_400(self):
        self.assertEqual(self.client.post(PREVIEW, {}, format="multipart").status_code, 400)

    def test_si13_login_is_required(self):
        anon = APIClient()
        self.assertEqual(anon.post(PREVIEW, upload(STATEMENT), format="multipart").status_code, 401)
        self.assertEqual(anon.post(IMPORT, upload(STATEMENT), format="multipart").status_code, 401)


class ImportTests(Base):
    def test_a_statement_is_imported_with_the_right_direction_amount_and_date(self):
        r = self.do_import(STATEMENT)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["imported"], 3)
        got = sorted((t.date, t.amount, t.category.type, t.description) for t in self.mine())
        self.assertEqual(got, [
            (date(2026, 11, 3), D("40000.00"), "expense", "Rent"),
            (date(2026, 11, 3), D("100000.00"), "income", "Salary"),
            (date(2026, 11, 10), D("250.50"), "expense", "Momo"),
        ])

    def test_si11_preview_and_import_agree(self):
        promised = self.preview(STATEMENT).json()["summary"]
        done = self.do_import(STATEMENT).json()
        self.assertEqual((done["imported"], done["duplicates"], len(done["errors"])), (promised["new"], promised["duplicates"], promised["errors"]))

    def test_si08_importing_the_same_file_twice_changes_nothing(self):
        self.do_import(STATEMENT)
        r = self.do_import(STATEMENT)
        self.assertEqual(r.status_code, 200)
        self.assertEqual((r.json()["imported"], r.json()["duplicates"]), (0, 3))
        self.assertEqual(self.mine().count(), 3)

    def test_si07_the_preview_marks_known_rows_as_duplicates(self):
        self.do_import(STATEMENT)
        body = self.preview(STATEMENT).json()
        self.assertEqual(body["summary"], {"new": 0, "duplicates": 3, "errors": 0})
        self.assertTrue(all(r["status"] == "duplicate" for r in body["rows"]))

    def test_si07_a_row_added_by_hand_counts_as_known(self):
        cat = Category.objects.create(name="Food", type="expense")
        Transaction.objects.create(user=self.user, date=date(2026, 11, 10), amount=D("250.50"), category=cat, description="momo")
        self.assertEqual(self.do_import(STATEMENT).json()["duplicates"], 1)      # case-insensitive description

    def test_si07_a_different_date_amount_direction_or_description_is_not_a_duplicate(self):
        self.do_import("date,description,amount\n2026-11-10,Momo,-250.50\n")
        for row in ("2026-11-11,Momo,-250.50", "2026-11-10,Momo,-250.51", "2026-11-10,Momo,250.50", "2026-11-10,Pizza,-250.50"):
            body = self.preview(f"date,description,amount\n{row}\n").json()
            self.assertEqual(body["summary"]["new"], 1, row)

    def test_si08_two_identical_coffees_on_one_day_are_both_real(self):
        two = "date,description,amount\n2026-11-10,Coffee,-100\n2026-11-10,Coffee,-100\n"
        self.assertEqual(self.do_import(two).json()["imported"], 2)
        self.assertEqual(self.mine().count(), 2)

    def test_si08_counting_only_the_missing_ones_are_added(self):
        self.do_import("date,description,amount\n2026-11-10,Coffee,-100\n")                 # I already have 1
        three = "date,description,amount\n" + "2026-11-10,Coffee,-100\n" * 3                 # the file says 3
        r = self.do_import(three).json()
        self.assertEqual((r["imported"], r["duplicates"]), (2, 1))
        self.assertEqual(self.mine().count(), 3)

    def test_si09_another_users_transactions_never_count_as_duplicates(self):
        other = User.objects.create_user("someone_else", password="x")
        theirs = APIClient()
        theirs.force_authenticate(other)
        self.do_import(STATEMENT, client=theirs)
        r = self.do_import(STATEMENT).json()
        self.assertEqual((r["imported"], r["duplicates"]), (3, 0))
        self.assertEqual(self.mine(other).count(), 3)           # untouched

    def test_si10_an_income_and_an_expense_with_the_same_category_name_get_separate_categories(self):
        self.do_import("date,amount,category\n2026-11-10,-50,Gift\n2026-11-11,70,Gift\n")
        types = sorted(Category.objects.filter(name="Gift").values_list("type", flat=True))
        self.assertEqual(types, ["expense", "income"])

    def test_si10_an_existing_category_is_reused_case_insensitively_not_duplicated(self):
        Category.objects.create(name="Food", type="expense")
        self.do_import("date,amount,category\n2026-11-10,-50,food\n2026-11-11,-60,FOOD\n")
        self.assertEqual(Category.objects.filter(name__iexact="food").count(), 1)

    def test_si10_no_category_column_means_uncategorized_of_the_right_type(self):
        self.do_import("date,amount\n2026-11-10,-50\n2026-11-11,70\n")
        got = sorted((t.category.name, t.category.type) for t in self.mine())
        self.assertEqual(got, [("Uncategorized", "expense"), ("Uncategorized", "income")])

    def test_si12_it_is_all_or_nothing_if_saving_fails_midway(self):
        real = Transaction.objects.bulk_create
        def boom(objs, *a, **k):
            real(objs[:1], *a, **k)
            raise RuntimeError("disk full")
        self.client.raise_request_exception = False          # we want to see the 500, not the exception
        with patch("statements.service.Transaction.objects.bulk_create", side_effect=boom):
            r = self.do_import(STATEMENT)
        self.assertEqual(r.status_code, 500)
        self.assertEqual(self.mine().count(), 0)

    def test_si06_error_rows_are_skipped_good_rows_are_saved_and_the_errors_come_back(self):
        r = self.do_import('date,amount\n2026-11-10,-5\nnope,-6\n2026-11-12,"$7"\n').json()
        self.assertEqual(r["imported"], 1)
        self.assertEqual([e["row"] for e in r["errors"]], [2, 3])
        self.assertEqual(self.mine().count(), 1)

    def test_nothing_new_is_a_200_not_a_201(self):
        self.do_import(STATEMENT)
        self.assertEqual(self.do_import(STATEMENT).status_code, 200)

    def test_si14_no_floats_in_the_import_response(self):
        assert_no_floats(self, self.do_import(STATEMENT).json())

    def test_imported_rows_are_not_recurring_and_not_linked_to_goals(self):
        self.do_import(STATEMENT)
        self.assertFalse(any(t.is_recurring or t.financial_goal_id for t in self.mine()))

    def test_a_dr_cr_statement_from_a_bank_round_trips(self):
        text = "Txn Date,Particulars,Debit,Credit\n10/11/2026,ATM withdrawal,5000.00,\n11/11/2026,Salary,,\"1,00,000.00\"\n"
        self.assertEqual(self.do_import(text).json()["imported"], 2)
        self.assertEqual(sorted((t.date, t.amount) for t in self.mine()), [(date(2026, 11, 10), D("5000.00")), (date(2026, 11, 11), D("100000.00"))])

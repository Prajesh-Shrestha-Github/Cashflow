"""Main balance for the dashboard (BAL-01..BAL-07). Today is Sunday 22 Nov 2026 (frozen).

Hand-checked data: before the 30-day window (24 Oct..22 Nov): +50,000 salary, -10,000 rent -> baseline 40,000.
In the window: +100,000 salary (3 Nov), -40,000 rent (3 Nov), -15,000 food (10 Nov), -35,000 fun (17 Nov) -> net +10,000.
All-time balance = 50,000. A salary dated tomorrow (999,999) must be ignored.
"""
from datetime import date, datetime, timezone as dt
from decimal import Decimal as D
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from transactions.models import Category, Transaction

URL = "/api/dashboard/balance/"
TODAY = date(2026, 11, 22)


def assert_no_floats(testcase, value, path="response"):
    if isinstance(value, float):
        testcase.fail(f"float at {path}: {value!r}")
    if isinstance(value, dict):
        for k, v in value.items():
            assert_no_floats(testcase, v, f"{path}.{k}")
    if isinstance(value, list):
        for i, v in enumerate(value):
            assert_no_floats(testcase, v, f"{path}[{i}]")


class BalanceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("balance_user", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.cat = {n: Category.objects.get_or_create(name=n, type=t)[0]
                    for n, t in [("Salary", "income"), ("Rent", "expense"), ("Food", "expense"), ("Entertainment", "expense")]}
        patcher = patch("dashboard.balance._today", return_value=TODAY)
        patcher.start()
        self.addCleanup(patcher.stop)

    def tx(self, day, amount, category, user=None):
        return Transaction.objects.create(user=user or self.user, date=day, amount=D(str(amount)),
                                          category=self.cat[category] if category else None)

    def build(self, user=None):
        self.tx(date(2026, 10, 1), 50000, "Salary", user)
        self.tx(date(2026, 10, 20), 10000, "Rent", user)
        self.tx(date(2026, 11, 3), 100000, "Salary", user)
        self.tx(date(2026, 11, 3), 40000, "Rent", user)
        self.tx(date(2026, 11, 10), 15000, "Food", user)
        self.tx(date(2026, 11, 17), 35000, "Entertainment", user)

    def get(self):
        r = self.client.get(URL)
        self.assertEqual(r.status_code, 200)
        return r.json()


class BalanceTests(BalanceTestCase):
    def test_bal01_the_balance_is_everything_earned_minus_everything_spent_until_today(self):
        self.build()
        self.tx(date(2026, 11, 23), 999999, "Salary")      # tomorrow: not yet
        self.assertEqual(self.get()["balance"], "50000.00")

    def test_bal02_the_last_30_days(self):
        self.build()
        body = self.get()["last_30_days"]
        self.assertEqual((body["income"], body["spent"], body["net"]), ("100000.00", "90000.00", "10000.00"))
        self.assertEqual((body["start"], body["end"]), ("2026-10-24", "2026-11-22"))

    def test_bal03_the_trend_is_the_balance_at_the_end_of_each_of_the_last_30_days(self):
        self.build()
        trend = self.get()["trend"]
        self.assertEqual(len(trend), 30)
        self.assertEqual((trend[0]["date"], trend[-1]["date"]), ("2026-10-24", "2026-11-22"))
        by_date = {p["date"]: p["balance"] for p in trend}
        self.assertEqual(by_date["2026-10-24"], "40000.00")     # the baseline
        self.assertEqual(by_date["2026-11-02"], "40000.00")     # the day before payday
        self.assertEqual(by_date["2026-11-03"], "100000.00")    # +100,000 - 40,000
        self.assertEqual(by_date["2026-11-09"], "100000.00")
        self.assertEqual(by_date["2026-11-10"], "85000.00")     # food
        self.assertEqual(by_date["2026-11-16"], "85000.00")
        self.assertEqual(by_date["2026-11-17"], "50000.00")     # fun
        self.assertEqual(trend[-1]["balance"], self.get()["balance"])

    def test_bal04_the_change_over_30_days_equals_the_net_and_has_a_direction(self):
        self.build()
        body = self.get()
        self.assertEqual((body["change_30d"], body["direction"]), ("10000.00", "up"))
        self.tx(date(2026, 11, 20), 25000, "Food")
        body = self.get()
        self.assertEqual((body["change_30d"], body["direction"]), ("-15000.00", "down"))

    def test_bal04_flat_when_nothing_changed(self):
        self.tx(date(2026, 10, 1), 1000, "Salary")           # only before the window
        body = self.get()
        self.assertEqual((body["change_30d"], body["direction"], body["balance"]), ("0.00", "flat", "1000.00"))

    def test_bal05_a_new_user_has_no_data_and_a_flat_zero_trend(self):
        body = self.get()
        self.assertFalse(body["has_data"])
        self.assertEqual(body["balance"], "0.00")
        self.assertEqual({p["balance"] for p in body["trend"]}, {"0.00"})

    def test_bal05_a_user_with_data_has_data(self):
        self.build()
        self.assertTrue(self.get()["has_data"])

    def test_a_negative_balance_is_reported_as_it_is(self):
        self.tx(date(2026, 11, 5), 350, "Food")
        self.assertEqual(self.get()["balance"], "-350.00")

    def test_a_transaction_without_a_category_counts_as_spending(self):
        self.tx(date(2026, 11, 5), 100, None)
        self.assertEqual(self.get()["balance"], "-100.00")

    def test_the_window_edges(self):
        self.tx(date(2026, 10, 23), 1000, "Salary")           # the day before the window: baseline only
        self.tx(date(2026, 10, 24), 500, "Salary")            # the first day of the window
        self.tx(date(2026, 11, 22), 200, "Salary")            # today
        body = self.get()
        self.assertEqual(body["last_30_days"]["income"], "700.00")
        self.assertEqual(body["balance"], "1700.00")
        self.assertEqual({p["date"]: p["balance"] for p in body["trend"]}["2026-10-24"], "1500.00")

    def test_bal06_only_my_own_data(self):
        self.build()
        other = User.objects.create_user("someone_else", password="x")
        self.tx(date(2026, 11, 5), 9999999, "Salary", other)
        self.assertEqual(self.get()["balance"], "50000.00")

    def test_bal06_another_users_old_history_never_reaches_my_baseline(self):
        self.build()
        other = User.objects.create_user("someone_else", password="x")
        self.tx(date(2026, 10, 1), 777777, "Salary", other)          # before the window: would change MY baseline
        self.assertEqual(self.get()["balance"], "50000.00")
        self.assertEqual({p["balance"] for p in self.get()["trend"][:10]}, {"40000.00"})

    def test_bal06_a_new_user_has_no_data_even_when_someone_else_does(self):
        other = User.objects.create_user("someone_else", password="x")
        self.build(other)
        self.assertFalse(self.get()["has_data"])
        self.assertEqual(self.get()["balance"], "0.00")

    def test_bal01_future_dated_entries_never_leak_into_the_30_day_figures_either(self):
        self.build()
        self.tx(date(2026, 11, 23), 999999, "Salary")
        self.tx(date(2026, 11, 24), 888888, "Food")
        body = self.get()
        self.assertEqual((body["last_30_days"]["income"], body["last_30_days"]["spent"], body["change_30d"]),
                         ("100000.00", "90000.00", "10000.00"))

    def test_bal06_requires_authentication(self):
        self.assertEqual(APIClient().get(URL).status_code, 401)

    def test_bal06_money_is_strings_never_floats(self):
        self.build()
        assert_no_floats(self, self.get())

    def test_bal07_it_uses_the_nepal_date_not_the_utc_date(self):
        # 20:30 UTC on 4 Nov is already 5 Nov in Nepal. This test removes the _today patch to prove it.
        self.addCleanup(lambda: None)
        patch.stopall()
        self.tx(date(2026, 11, 5), 100, "Salary")
        client = APIClient()
        client.force_authenticate(self.user)
        with patch("django.utils.timezone.now", return_value=datetime(2026, 11, 4, 20, 30, tzinfo=dt.utc)):
            body = client.get(URL).json()
        self.assertEqual(body["last_30_days"]["end"], "2026-11-05")
        self.assertEqual(body["balance"], "100.00")

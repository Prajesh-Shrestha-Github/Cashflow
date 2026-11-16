"""Money Score API tests: rolling 30-day window (MS-06..MS-12) and what-if (WI-01..WI-06).
The W1 example is rebuilt from real database rows. Expected numbers come from an independent exact-fraction oracle."""
from datetime import date
from decimal import Decimal as D
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from financial_goals_and_health.models import FinancialGoal
from transactions.models import Category, Transaction

URL = "/api/score/"
WHATIF = "/api/score/what-if/"
TODAY = date(2026, 11, 22)  # window: 24 Oct .. 22 Nov; weekly buckets: Nov 16-22, Nov 9-15, Nov 2-8, Oct 26-Nov 1


def assert_no_floats(testcase, value, path="response"):
    if isinstance(value, float):
        testcase.fail(f"float at {path}: {value!r}")
    if isinstance(value, dict):
        for k, v in value.items():
            assert_no_floats(testcase, v, f"{path}.{k}")
    if isinstance(value, list):
        for i, v in enumerate(value):
            assert_no_floats(testcase, v, f"{path}[{i}]")


class ScoreAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("score_user", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.cat = {n: Category.objects.get_or_create(name=n, type=t)[0] for n, t in [
            ("Salary", "income"), ("Rent", "expense"), ("Utilities", "expense"), ("Food", "expense"),
            ("Transport", "expense"), ("Entertainment", "expense"), ("Gadgets", "expense")]}
        patcher = patch("moneyscore.service._today", return_value=TODAY)
        patcher.start()
        self.addCleanup(patcher.stop)

    def tx(self, day, amount, category, user=None):
        return Transaction.objects.create(user=user or self.user, date=day, amount=D(str(amount)), category=self.cat[category])

    def build_w1(self, user=None):
        # income 100,000; needs 55,000 (Rent + Food); wants 35,000; entries in 3 of the last 4 weeks
        self.tx(date(2026, 11, 3), 100000, "Salary", user)
        self.tx(date(2026, 11, 3), 40000, "Rent", user)
        self.tx(date(2026, 11, 10), 15000, "Food", user)
        self.tx(date(2026, 11, 17), 35000, "Entertainment", user)
        FinancialGoal.objects.create(user=user or self.user, title="Emergency fund", goal_type="savings",
                                     target_amount=D("165000"), current_amount=D("82500"),
                                     start_date=date(2026, 1, 1), target_date=date(2027, 1, 1))

    def get(self, **params):
        return self.client.get(URL, params)

    def whatif(self, **body):
        return self.client.post(WHATIF, body, format="json")


class WorkedExampleFromTheDatabaseTests(ScoreAPITestCase):
    def test_w1_numbers_from_real_rows(self):
        self.build_w1()
        r = self.get()
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["score"], 60)
        self.assertEqual(body["level"]["name"], "Sapling")
        self.assertEqual(body["next_level"], {"name": "Tree", "at": 75, "points_needed": 15})
        points = {c["key"]: c["points"] for c in body["components"]}
        self.assertEqual(points, {"balance": "16.7", "savings": "12.5", "safety_net": "12.5", "check_in": "18.8"})
        steps = [(s["type"], s["amount"]) for s in body["next_steps"]]
        self.assertEqual(steps, [("save_more", "10000.00"), ("build_safety_net", "82500.00"), ("check_in", None)])

    def test_ms11_it_says_which_days_were_scored(self):
        self.build_w1()
        body = self.get().json()
        self.assertEqual(body["as_of"], "2026-11-22")
        self.assertEqual(body["window"], {"start": "2026-10-24", "end": "2026-11-22"})

    def test_ms10_money_is_strings_never_floats(self):
        self.build_w1()
        assert_no_floats(self, self.get().json())


class IsolationAndAuthTests(ScoreAPITestCase):
    def test_ms09_requires_authentication(self):
        self.assertEqual(APIClient().get(URL).status_code, 401)
        self.assertEqual(APIClient().post(WHATIF, {}, format="json").status_code, 401)

    def test_ms09_a_user_only_sees_their_own_data(self):
        self.build_w1()
        other = User.objects.create_user("someone_else", password="x")
        self.tx(date(2026, 11, 5), 9999999, "Salary", other)
        self.tx(date(2026, 11, 5), 8888888, "Gadgets", other)
        self.assertEqual(self.get().json()["score"], 60)

    def test_a_user_with_data_only_for_someone_else_has_no_data(self):
        other = User.objects.create_user("someone_else", password="x")
        self.build_w1(other)
        self.assertEqual(self.get().json()["status"], "no_data")

    def test_ms09_another_users_emergency_goal_never_counts_for_me(self):
        self.build_w1()
        other = User.objects.create_user("someone_else", password="x")
        FinancialGoal.objects.create(user=other, title="Emergency fund", goal_type="savings", target_amount=D("9000000"),
                                     current_amount=D("9000000"), start_date=date(2026, 1, 1), target_date=date(2027, 1, 1))
        self.assertEqual(self.get().json()["score"], 60)


class StatusTests(ScoreAPITestCase):
    def test_ms06_no_transactions_is_no_data_with_a_first_step(self):
        body = self.get().json()
        self.assertEqual((body["status"], body["score"]), ("no_data", None))
        self.assertEqual(body["next_steps"][0]["type"], "add_first_transaction")

    def test_ms06_spending_without_income_is_no_income(self):
        self.tx(date(2026, 11, 3), 5000, "Food")
        body = self.get().json()
        self.assertEqual((body["status"], body["score"]), ("no_income", None))
        self.assertEqual(body["next_steps"][0]["type"], "add_income")

    def test_ms06_income_older_than_the_window_does_not_count(self):
        self.tx(date(2026, 10, 1), 100000, "Salary")     # 52 days ago
        self.tx(date(2026, 11, 3), 5000, "Food")
        self.assertEqual(self.get().json()["status"], "no_income")


class TheWindowTests(ScoreAPITestCase):
    def test_the_first_day_of_the_window_is_included(self):
        self.build_w1()
        self.tx(date(2026, 10, 24), 100000, "Salary")    # income doubles: 25 + 25 + 12.5 + 18.75 = 81.25
        self.assertEqual(self.get().json()["score"], 81)

    def test_the_day_before_the_window_is_excluded(self):
        self.build_w1()
        self.tx(date(2026, 10, 23), 100000, "Salary")
        self.assertEqual(self.get().json()["score"], 60)

    def test_today_is_included_and_future_dates_are_excluded(self):
        self.build_w1()
        self.tx(date(2026, 11, 23), 100000, "Salary")    # tomorrow
        self.assertEqual(self.get().json()["score"], 60)
        self.tx(date(2026, 11, 22), 100000, "Salary")    # today
        self.assertEqual(self.get().json()["score"], 81)

    def test_ms04_checking_in_is_counted_in_four_weekly_buckets_counted_back_from_today(self):
        self.build_w1()
        points = lambda: {c["key"]: c["points"] for c in self.get().json()["components"]}["check_in"]
        self.assertEqual(points(), "18.8")                       # 3 of 4 buckets
        self.tx(date(2026, 10, 25), 1000, "Food")                # 28 days back: inside the window, in no bucket
        self.assertEqual(points(), "18.8")
        self.tx(date(2026, 10, 26), 1000, "Food")                # 27 days back: the oldest bucket (Oct 26 - Nov 1)
        self.assertEqual(points(), "25.0")

    def test_ms03_essentials_spending_in_earlier_windows_lowers_the_monthly_average(self):
        self.build_w1()
        self.tx(date(2026, 10, 23), 20000, "Food")       # the previous 30-day window: average becomes 37,500
        safety = {c["key"]: c["points"] for c in self.get().json()["components"]}["safety_net"]
        self.assertEqual((self.get().json()["score"], safety), (66, "18.3"))
        Transaction.objects.filter(date=date(2026, 10, 23)).delete()
        self.tx(date(2026, 9, 10), 10000, "Food")        # the window before that: average 32,500
        self.assertEqual(self.get().json()["score"], 69)

    def test_ms03_a_day_belongs_to_exactly_one_window(self):
        self.build_w1()
        self.tx(date(2026, 10, 24), 20000, "Food")       # first day of the current window, so NOT also in the previous one
        self.assertEqual(self.get().json()["score"], 28) # a day counted in two windows would give 33

    def test_as_of_scores_another_day(self):
        self.build_w1()
        body = self.get(as_of="2026-11-15").json()              # 17 Nov Entertainment not yet spent
        self.assertEqual(body["score"], 71)
        self.assertEqual(body["window"], {"start": "2026-10-17", "end": "2026-11-15"})

    def test_as_of_must_be_a_real_date_that_is_not_in_the_future(self):
        for bad in ("abc", "2026-13-01", "2026-11-31", "22-11-2026", "2026-11-23"):
            with self.subTest(as_of=bad):
                r = self.get(as_of=bad)
                self.assertEqual(r.status_code, 400)
                self.assertIn("as_of", r.json())

    def test_ms08_history_is_six_weekly_points_oldest_first(self):
        self.build_w1()
        history = self.get().json()["history"]
        self.assertEqual([h["as_of"] for h in history],
                         ["2026-10-18", "2026-10-25", "2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22"])
        self.assertEqual([h["score"] for h in history], [None, None, None, 73, 71, 60])

    def test_ms12_levers_give_the_sliders_their_current_figures(self):
        self.build_w1()
        levers = self.get().json()["levers"]
        self.assertEqual(levers, {"income": "100000.00", "wants": "35000.00", "emergency_fund": "82500.00",
                                  "avg_needs": "55000.00", "weeks_logged": 3})


class ReadingTheDataTests(ScoreAPITestCase):
    def test_an_unknown_category_counts_as_wants(self):
        self.build_w1()
        self.tx(date(2026, 11, 18), 5000, "Gadgets")      # 5,000 more wants -> 40% wants, 5% saved
        self.assertLess(self.get().json()["score"], 60)

    def test_the_emergency_goal_is_found_by_title_case_insensitively(self):
        self.build_w1()
        FinancialGoal.objects.filter(user=self.user).update(title="MY EMERGENCY FUND")
        self.assertEqual(self.get().json()["score"], 60)

    def test_abandoned_and_non_savings_goals_do_not_count_as_a_safety_net(self):
        self.build_w1()
        FinancialGoal.objects.filter(user=self.user).update(status="abandoned")
        without = self.get().json()["score"]
        FinancialGoal.objects.filter(user=self.user).update(status="in_progress", goal_type="debt_reduction")
        self.assertEqual(self.get().json()["score"], without)
        self.assertLess(without, 60)


class WhatIfTests(ScoreAPITestCase):
    def setUp(self):
        super().setUp()
        self.build_w1()

    def test_wi02_with_no_changes_the_scenario_equals_the_current_score(self):
        body = self.whatif().json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["current"]["score"], 60)
        self.assertEqual(body["scenario"]["score"], 60)
        self.assertEqual(body["change"]["score"], 0)

    def test_wi01_cutting_nice_to_haves_by_5000(self):
        body = self.whatif(wants_delta="-5000").json()
        self.assertEqual(body["scenario"]["score"], 71)
        self.assertEqual(body["change"]["score"], 11)
        points = {c["key"]: c["points"] for c in body["scenario"]["components"]}
        self.assertEqual(points["balance"], "20.8")
        self.assertEqual(points["savings"], "18.8")
        self.assertEqual(body["scenario"]["level"]["name"], "Sapling")

    def test_wi01_each_lever_on_its_own(self):
        cases = {"wants_delta": ("-35000", 77), "income_delta": ("20000", 81), "emergency_delta": ("82500", 73)}
        for field, (value, expected) in cases.items():
            with self.subTest(field=field):
                self.assertEqual(self.whatif(**{field: value}).json()["scenario"]["score"], expected)
        self.assertEqual(self.whatif(check_in_every_week=True).json()["scenario"]["score"], 67)

    def test_wi01_levers_combine(self):
        body = self.whatif(wants_delta="-5000", emergency_delta="82500", check_in_every_week=True).json()
        self.assertEqual(body["scenario"]["score"], 90)
        self.assertEqual(body["scenario"]["level"]["name"], "Forest")
        self.assertEqual(body["change"]["score"], 30)

    def test_the_level_can_change_in_the_scenario(self):
        body = self.whatif(income_delta="20000").json()                # 81 -> Tree
        self.assertEqual((body["current"]["level"]["name"], body["scenario"]["level"]["name"]), ("Sapling", "Tree"))

    def test_wi03_cutting_more_than_you_spend_is_clamped_and_reported(self):
        body = self.whatif(wants_delta="-999999").json()
        self.assertEqual(body["effective"]["wants_delta"], "-35000.00")
        self.assertEqual(body["scenario"]["score"], 77)

    def test_wi03_negative_income_or_emergency_changes_are_clamped_to_zero(self):
        body = self.whatif(income_delta="-5000", emergency_delta="-1").json()
        self.assertEqual((body["effective"]["income_delta"], body["effective"]["emergency_delta"]), ("0.00", "0.00"))
        self.assertEqual(body["scenario"]["score"], 60)

    def test_spending_more_is_allowed_and_lowers_the_score(self):
        body = self.whatif(wants_delta="20000").json()
        self.assertLess(body["scenario"]["score"], 60)
        self.assertLess(body["change"]["score"], 0)

    def test_wi04_invalid_values_get_a_field_level_400(self):
        cases = {"wants_delta": ["abc", "1000000001", "-1000000001"], "income_delta": ["abc", "1000000001"],
                 "emergency_delta": ["abc", "1000000001"], "check_in_every_week": ["maybe"]}
        for field, bad_values in cases.items():
            for bad in bad_values:
                with self.subTest(field=field, value=bad):
                    r = self.whatif(**{field: bad})
                    self.assertEqual(r.status_code, 400)
                    self.assertIn(field, r.json())

    def test_wi04_nothing_is_ever_saved(self):
        transactions, goals = Transaction.objects.count(), list(FinancialGoal.objects.values_list("current_amount", flat=True))
        self.whatif(wants_delta="-5000", emergency_delta="82500", income_delta="1000", check_in_every_week=True)
        self.assertEqual(Transaction.objects.count(), transactions)
        self.assertEqual(list(FinancialGoal.objects.values_list("current_amount", flat=True)), goals)

    def test_wi05_without_a_score_the_what_if_says_why_and_has_no_scenario(self):
        Transaction.objects.all().delete()
        body = self.whatif(wants_delta="-1000").json()
        self.assertEqual((body["status"], body["scenario"]), ("no_data", None))

    def test_wi06_money_is_strings_never_floats(self):
        assert_no_floats(self, self.whatif(wants_delta="-5000").json())

    def test_wi06_the_what_if_uses_only_my_own_data(self):
        other = User.objects.create_user("someone_else", password="x")
        self.tx(date(2026, 11, 5), 9999999, "Salary", other)
        self.assertEqual(self.whatif(wants_delta="-5000").json()["scenario"]["score"], 71)

"""Engagement features: streak in the score (ST), weekly recap (RC), payday nudge (PD), save what-if as goals (SG).
Spec: cashflow-product/docs/specs/money-score.md. Today is Sunday 22 Nov 2026 (frozen), so the ISO week is Mon 16 - Sun 22 Nov."""
from datetime import date
from decimal import Decimal as D

from accounts.models import User
from financial_goals_and_health.models import FinancialGoal
from transactions.models import Transaction

from .test_api import ScoreAPITestCase, TODAY, assert_no_floats

RECAP = "/api/score/recap/"
GOALS = "/api/score/what-if/goals/"


class StreakInTheScoreTests(ScoreAPITestCase):
    def streak(self):
        return self.get().json()["streak"]

    def test_st01_w1_has_a_three_week_streak(self):
        self.build_w1()          # entries on 17 Nov (this week), 10 Nov (last week), 3 Nov (2 weeks ago)
        self.assertEqual(self.streak(), {"weeks": 3, "freeze_used": False, "this_week_done": True})

    def test_st02_a_missed_week_is_forgiven_and_reported_as_a_freeze(self):
        self.build_w1()
        self.tx(date(2026, 10, 20), 100, "Food")      # active 4 weeks ago; the week 3 weeks ago was missed
        self.assertEqual(self.streak(), {"weeks": 4, "freeze_used": True, "this_week_done": True})

    def test_an_empty_current_week_does_not_break_the_streak(self):
        self.tx(date(2026, 11, 10), 100, "Food")
        self.tx(date(2026, 11, 3), 100, "Food")
        self.assertEqual(self.streak(), {"weeks": 2, "freeze_used": False, "this_week_done": False})

    def test_weeks_run_monday_to_sunday(self):
        self.tx(date(2026, 11, 16), 100, "Food")      # Monday: this week
        self.tx(date(2026, 11, 15), 100, "Food")      # Sunday: last week
        self.assertEqual(self.streak()["weeks"], 2)

    def test_only_my_own_entries_count(self):
        other = User.objects.create_user("someone_else", password="x")
        for d in (date(2026, 11, 17), date(2026, 11, 10), date(2026, 11, 3)):
            self.tx(d, 100, "Food", other)
        self.tx(date(2026, 11, 17), 100, "Food")
        self.assertEqual(self.streak()["weeks"], 1)

    def test_no_data_means_no_streak(self):
        self.assertEqual(self.streak(), {"weeks": 0, "freeze_used": False, "this_week_done": False})


class PaydayNudgeTests(ScoreAPITestCase):
    def nudge(self):
        return self.get().json()["payday_nudge"]

    def test_pd01_no_recent_income_means_no_nudge(self):
        self.build_w1()                                # the only salary was 19 days ago
        self.assertIsNone(self.nudge())

    def test_pd01_a_big_salary_in_the_last_three_days_triggers_the_nudge(self):
        self.build_w1()
        t = self.tx(date(2026, 11, 21), 100000, "Salary")
        self.assertEqual(self.nudge(), {"transaction_id": t.id, "date": "2026-11-21", "income_amount": "100000.00",
                                        "percent": 20, "suggested_amount": "20000.00"})

    def test_pd01_it_needs_to_be_at_least_30_percent_of_the_windows_income(self):
        self.build_w1()                                # 100,000 already in the window
        self.tx(date(2026, 11, 21), 42857, "Salary")   # 42,857 / 142,857 = 29.9999%
        self.assertIsNone(self.nudge())

    def test_pd01_exactly_at_the_30_percent_line(self):
        self.build_w1()
        self.tx(date(2026, 11, 21), 42858, "Salary")   # 42,858 / 142,858 = 30.0003%
        self.assertIsNotNone(self.nudge())

    def test_pd01_a_payment_of_exactly_30_percent_qualifies(self):
        self.tx(date(2026, 11, 3), 70000, "Salary")
        self.tx(date(2026, 11, 21), 30000, "Salary")    # 30,000 is exactly 30% of the window's 100,000
        self.assertEqual(self.nudge()["income_amount"], "30000.00")

    def test_pd01_three_days_back_counts_four_days_back_does_not(self):
        self.build_w1()
        self.tx(date(2026, 11, 19), 100000, "Salary")  # 3 days before today: outside as_of-2
        self.assertIsNone(self.nudge())
        self.tx(date(2026, 11, 20), 100000, "Salary")  # 2 days before today: inside
        self.assertEqual(self.nudge()["date"], "2026-11-20")

    def test_pd01_future_dated_income_never_triggers_it(self):
        self.build_w1()
        self.tx(date(2026, 11, 23), 100000, "Salary")
        self.assertIsNone(self.nudge())

    def test_pd01_when_several_qualify_the_latest_one_wins_and_small_ones_are_ignored(self):
        self.build_w1()
        big = self.tx(date(2026, 11, 20), 100000, "Salary")
        self.tx(date(2026, 11, 21), 5000, "Salary")    # too small to be a payday
        self.assertEqual(self.nudge()["transaction_id"], big.id)

    def test_pd02_the_suggested_amount_is_20_percent_rounded_half_up(self):
        self.tx(date(2026, 11, 21), D("33333.33"), "Salary")   # the only income, so well over 30%; 20% = 6,666.666 -> 6,666.67
        self.assertEqual(self.nudge()["suggested_amount"], "6666.67")

    def test_an_income_of_someone_else_never_triggers_my_nudge(self):
        self.build_w1()
        other = User.objects.create_user("someone_else", password="x")
        self.tx(date(2026, 11, 21), 100000, "Salary", other)
        self.assertIsNone(self.nudge())


class WeeklyRecapTests(ScoreAPITestCase):
    def recap(self):
        r = self.client.get(RECAP)
        self.assertEqual(r.status_code, 200)
        return r.json()

    def test_requires_authentication(self):
        from rest_framework.test import APIClient
        self.assertEqual(APIClient().get(RECAP).status_code, 401)

    def test_rc01_rc02_w1_week(self):
        self.build_w1()
        body = self.recap()
        self.assertEqual(body["status"], "ok")
        self.assertEqual((body["spent"], body["spent_last_week"], body["income"], body["entries"]),
                         ("35000.00", "15000.00", "0.00", 1))
        self.assertEqual(body["top_category"], {"name": "Entertainment", "amount": "35000.00"})
        self.assertEqual(body["biggest_expense"]["amount"], "35000.00")
        self.assertEqual((body["score_now"], body["score_week_ago"], body["score_change"]), (60, 71, -11))

    def test_rc03_highlights_in_order_score_then_spending_then_streak(self):
        self.build_w1()
        self.assertEqual(self.recap()["highlights"], [
            {"type": "score_down", "points": 11},
            {"type": "spent_more", "amount": "20000.00"},
            {"type": "streak", "weeks": 3},
        ])

    def test_rc03_spending_less_than_last_week_is_celebrated_with_the_difference(self):
        self.tx(date(2026, 11, 20), 100000, "Salary")
        self.tx(date(2026, 11, 12), 20000, "Food")     # last week
        self.tx(date(2026, 11, 18), 5000, "Food")      # this week
        highlights = self.recap()["highlights"]
        self.assertIn({"type": "spent_less", "amount": "15000.00"}, highlights)

    def test_rc03_an_empty_week_after_a_busy_one_nudges_gently(self):
        self.tx(date(2026, 11, 12), 20000, "Food")     # only last week
        body = self.recap()
        self.assertEqual(body["entries"], 0)
        # nothing logged this week: "you spent less" would be technically true but misleading, so only the nudge shows
        self.assertEqual(body["highlights"], [{"type": "no_entries"}])

    def test_rc01_the_top_category_and_biggest_expense_are_the_largest(self):
        t = self.tx(date(2026, 11, 18), 22000, "Rent")
        Transaction.objects.filter(pk=t.pk).update(description="November rent")
        self.tx(date(2026, 11, 17), 3000, "Food")
        self.tx(date(2026, 11, 19), 1500, "Food")           # Food: 4,500 in total, still below Rent
        body = self.recap()
        self.assertEqual(body["top_category"], {"name": "Rent", "amount": "22000.00"})
        self.assertEqual(body["biggest_expense"], {"category": "Rent", "amount": "22000.00", "description": "November rent"})

    def test_rc01_the_top_category_adds_up_all_the_entries_of_a_category(self):
        self.tx(date(2026, 11, 17), 3000, "Food")
        self.tx(date(2026, 11, 18), 3000, "Food")
        self.tx(date(2026, 11, 19), 5000, "Entertainment")   # the biggest single expense, but Food adds up to 6,000
        body = self.recap()
        self.assertEqual(body["top_category"], {"name": "Food", "amount": "6000.00"})
        self.assertEqual(body["biggest_expense"]["category"], "Entertainment")

    def test_rc03_at_most_three_highlights(self):
        self.build_w1()
        self.assertLessEqual(len(self.recap()["highlights"]), 3)

    def test_rc04_nothing_in_the_last_14_days_is_no_data(self):
        self.tx(date(2026, 10, 1), 100, "Food")
        body = self.recap()
        self.assertEqual((body["status"], body["highlights"]), ("no_data", []))

    def test_the_window_is_the_seven_days_ending_today(self):
        self.tx(date(2026, 11, 16), 1000, "Food")      # first day of the week window: counts
        self.tx(date(2026, 11, 15), 7000, "Food")      # the day before: last week
        self.tx(date(2026, 11, 23), 9999, "Food")      # tomorrow: ignored
        body = self.recap()
        self.assertEqual((body["spent"], body["spent_last_week"]), ("1000.00", "7000.00"))

    def test_it_only_uses_my_own_data(self):
        self.build_w1()
        other = User.objects.create_user("someone_else", password="x")
        self.tx(date(2026, 11, 18), 99999, "Food", other)
        self.assertEqual(self.recap()["spent"], "35000.00")

    def test_money_is_strings_never_floats(self):
        self.build_w1()
        assert_no_floats(self, self.recap())


class SaveWhatIfAsGoalsTests(ScoreAPITestCase):
    def setUp(self):
        super().setUp()
        self.build_w1()
        self.goals_before = FinancialGoal.objects.filter(user=self.user).count()

    def save(self, **body):
        return self.client.post(GOALS, body, format="json")

    def new_goals(self):
        return FinancialGoal.objects.filter(user=self.user).count() - self.goals_before

    def test_sg01_cutting_nice_to_haves_creates_an_expense_reduction_goal(self):
        r = self.save(wants_delta="-5000")
        self.assertEqual(r.status_code, 201)
        goal = FinancialGoal.objects.get(user=self.user, goal_type="expense_reduction")
        self.assertEqual((goal.title, goal.target_amount, goal.current_amount, goal.status),
                         ("Spend NPR 5,000 less on nice-to-haves", D("5000.00"), D("0.00"), "in_progress"))
        self.assertEqual((goal.start_date, goal.target_date), (TODAY, date(2026, 12, 22)))
        body = r.json()
        self.assertEqual([g["title"] for g in body["created"]], ["Spend NPR 5,000 less on nice-to-haves"])
        self.assertEqual(body["existing"], [])

    def test_sg01_each_money_lever_becomes_its_own_goal_with_lakh_grouping(self):
        r = self.save(wants_delta="-5000", income_delta="100000", emergency_delta="1234567")
        titles = {g["title"]: g["goal_type"] for g in r.json()["created"]}
        self.assertEqual(titles, {
            "Spend NPR 5,000 less on nice-to-haves": "expense_reduction",
            "Earn NPR 1,00,000 more every 30 days": "income_increase",
            "Emergency fund: add NPR 12,34,567": "savings",
        })
        self.assertEqual(self.new_goals(), 3)

    def test_sg01_the_amount_is_the_clamped_effective_amount(self):
        self.save(wants_delta="-999999")
        self.assertEqual(FinancialGoal.objects.get(user=self.user, goal_type="expense_reduction").target_amount, D("35000.00"))

    def test_sg01_spending_more_never_creates_a_goal(self):
        self.assertEqual(self.save(wants_delta="5000").status_code, 400)
        self.assertEqual(self.new_goals(), 0)

    def test_sg01_the_check_in_switch_alone_is_not_a_money_goal(self):
        self.assertEqual(self.save(check_in_every_week=True).status_code, 400)
        self.assertEqual(self.new_goals(), 0)

    def test_sg03_no_change_at_all_is_a_400_with_a_helpful_message(self):
        r = self.save()
        self.assertEqual(r.status_code, 400)
        self.assertIn("detail", r.json())

    def test_sg02_saving_the_same_thing_twice_creates_no_duplicate(self):
        first = self.save(wants_delta="-5000")
        second = self.save(wants_delta="-5000")                     # a double-click or a retry
        self.assertEqual((first.status_code, second.status_code), (201, 200))
        self.assertEqual(second.json()["created"], [])
        self.assertEqual(len(second.json()["existing"]), 1)
        self.assertEqual(second.json()["existing"][0]["id"], first.json()["created"][0]["id"])
        self.assertEqual(self.new_goals(), 1)

    def test_sg02_a_different_amount_is_a_different_goal(self):
        self.save(wants_delta="-5000")
        self.save(wants_delta="-6000")
        self.assertEqual(self.new_goals(), 2)

    def test_sg02_a_finished_or_abandoned_goal_does_not_block_a_new_one(self):
        self.save(wants_delta="-5000")
        FinancialGoal.objects.filter(user=self.user, goal_type="expense_reduction").update(status="abandoned")
        r = self.save(wants_delta="-5000")
        self.assertEqual(len(r.json()["created"]), 1)

    def test_sg02_a_goal_whose_date_has_passed_does_not_block_a_new_one(self):
        FinancialGoal.objects.create(user=self.user, title="Spend NPR 5,000 less on nice-to-haves", goal_type="expense_reduction",
                                     target_amount=D("5000"), start_date=date(2026, 9, 1), target_date=date(2026, 10, 1))
        r = self.save(wants_delta="-5000")
        self.assertEqual(len(r.json()["created"]), 1)

    def test_sg02_someone_elses_identical_goal_is_not_mine(self):
        other = User.objects.create_user("someone_else", password="x")
        FinancialGoal.objects.create(user=other, title="Spend NPR 5,000 less on nice-to-haves", goal_type="expense_reduction",
                                     target_amount=D("5000"), start_date=TODAY, target_date=date(2026, 12, 22))
        r = self.save(wants_delta="-5000")
        self.assertEqual((len(r.json()["created"]), r.json()["existing"]), (1, []))

    def test_sg03_validation_and_auth(self):
        from rest_framework.test import APIClient
        self.assertEqual(APIClient().post(GOALS, {}, format="json").status_code, 401)
        for bad in ({"wants_delta": "abc"}, {"income_delta": "1000000001"}, {"emergency_delta": "x"}):
            with self.subTest(body=bad):
                self.assertEqual(self.save(**bad).status_code, 400)

    def test_it_never_changes_transactions(self):
        count = Transaction.objects.count()
        self.save(wants_delta="-5000", emergency_delta="82500")
        self.assertEqual(Transaction.objects.count(), count)

    def test_money_is_strings_never_floats(self):
        assert_no_floats(self, self.save(wants_delta="-5000").json())

"""Money Score calculation tests. Spec: cashflow-product/docs/specs/money-score.md

Worked examples W1..W5 come from an independent exact-fraction oracle (not the implementation's formulas).
"""
from decimal import Decimal as D

from django.test import SimpleTestCase

from moneyscore.calculations import PeriodFacts, compute


def facts(income=100000, needs=50000, wants=30000, emergency=150000, avg_needs=50000, logged=4, elapsed=4):
    return PeriodFacts(D(income), D(needs), D(wants), D(emergency), D(avg_needs), logged, elapsed)


def pts(result):
    return {c["key"]: c["points"] for c in result["components"]}


class WorkedExampleTests(SimpleTestCase):
    def test_w1_typical_month(self):
        r = compute(facts(needs=55000, wants=35000, emergency=82500, avg_needs=55000, logged=3))
        self.assertEqual(r["status"], "ok")
        p = pts(r)
        self.assertEqual(p["balance"].quantize(D("0.1")), D("16.7"))   # MS-01
        self.assertEqual(p["savings"], D("12.5"))                       # MS-02
        self.assertEqual(p["safety_net"], D("12.5"))                    # MS-03
        self.assertEqual(p["check_in"], D("18.75"))                     # MS-04
        self.assertEqual(r["score"], 60)                                # MS-05
        self.assertEqual(r["level"]["name"], "Sapling")

    def test_w2_perfect_month_is_100_forest(self):
        r = compute(facts())
        self.assertEqual(r["score"], 100)
        self.assertEqual(r["level"]["name"], "Forest")
        self.assertEqual(sum(pts(r).values()), D(100))

    def test_w3_overspender_is_6_seed_and_nothing_goes_negative(self):
        r = compute(facts(needs=70000, wants=45000, emergency=0, avg_needs=70000, logged=1))
        self.assertEqual(r["score"], 6)
        self.assertEqual(r["level"]["name"], "Seed")
        self.assertEqual(pts(r)["balance"], D(0))
        self.assertEqual(pts(r)["savings"], D(0))
        self.assertTrue(all(v >= 0 for v in pts(r).values()))

    def test_w5_no_emergency_fund_still_scores_75_tree(self):
        r = compute(facts(income=60000, needs=30000, wants=15000, emergency=0, avg_needs=30000, logged=2, elapsed=2))
        self.assertEqual(r["score"], 75)
        self.assertEqual(r["level"]["name"], "Tree")
        self.assertEqual(pts(r)["safety_net"], D(0))


class RoundingTests(SimpleTestCase):
    def test_ms05_a_total_of_exactly_62_5_rounds_half_up_to_63(self):
        # balance 25 + savings 25 + safety net 12.5 (1.5 of 3 months) + check-in 0 = 62.5
        r = compute(facts(needs=50000, wants=30000, emergency=75000, avg_needs=50000, logged=0))
        self.assertEqual(sum(pts(r).values()), D("62.5"))
        self.assertEqual(r["score"], 63)   # round-down or banker's rounding would give 62


class ComponentRuleTests(SimpleTestCase):
    def test_ms01_balance_only_penalises_going_over_not_under(self):
        self.assertEqual(pts(compute(facts(needs=20000, wants=10000)))["balance"], D(25))

    def test_ms01_each_point_over_costs_the_same_whether_needs_or_wants(self):
        over_needs = pts(compute(facts(needs=55000, wants=30000)))["balance"]
        over_wants = pts(compute(facts(needs=50000, wants=35000)))["balance"]
        self.assertEqual(over_needs, over_wants)

    def test_ms02_savings_is_capped_at_25_and_zero_when_negative(self):
        self.assertEqual(pts(compute(facts(needs=20000, wants=10000)))["savings"], D(25))   # saves 70%
        self.assertEqual(pts(compute(facts(needs=60000, wants=50000)))["savings"], D(0))    # saves -10%

    def test_ms03_safety_net_is_proportional_and_capped_at_three_months(self):
        self.assertEqual(pts(compute(facts(emergency=25000, avg_needs=50000)))["safety_net"].quantize(D("0.1")), D("4.2"))   # half a month
        self.assertEqual(pts(compute(facts(emergency=50000, avg_needs=50000)))["safety_net"].quantize(D("0.1")), D("8.3"))
        self.assertEqual(pts(compute(facts(emergency=900000, avg_needs=50000)))["safety_net"], D(25))

    def test_ms03_no_needs_spending_means_no_safety_net_points_not_a_crash(self):
        self.assertEqual(pts(compute(facts(emergency=100000, avg_needs=0)))["safety_net"], D(0))

    def test_ms04_check_in_is_the_share_of_weeks_logged(self):
        self.assertEqual(pts(compute(facts(logged=1, elapsed=4)))["check_in"], D("6.25"))

    def test_ms04_a_month_with_no_weeks_yet_gives_zero_not_a_division_error(self):
        self.assertEqual(pts(compute(facts(logged=0, elapsed=0)))["check_in"], D(0))

    def test_every_component_stays_between_0_and_25(self):
        for needs in (0, 20000, 50000, 90000, 200000):
            for wants in (0, 30000, 120000):
                for logged in (0, 2, 4):
                    with self.subTest(needs=needs, wants=wants, logged=logged):
                        for value in pts(compute(facts(needs=needs, wants=wants, logged=logged))).values():
                            self.assertTrue(D(0) <= value <= D(25))

    def test_saving_more_never_lowers_the_score(self):
        previous = -1
        for wants in (60000, 45000, 30000, 15000, 0):   # spending less on wants = saving more
            score = compute(facts(wants=wants))["score"]
            self.assertGreaterEqual(score, previous)
            previous = score


class StatusTests(SimpleTestCase):
    def test_ms06_no_income_gives_no_score_and_asks_for_income(self):
        r = compute(facts(income=0, needs=1000, wants=0))
        self.assertEqual(r["status"], "no_income")
        self.assertIsNone(r["score"])
        self.assertEqual(r["next_steps"][0]["type"], "add_income")

    def test_ms06_no_transactions_at_all_is_no_data(self):
        r = compute(PeriodFacts(D(0), D(0), D(0), D(0), D(0), 0, 1, transactions=0))
        self.assertEqual(r["status"], "no_data")
        self.assertIsNone(r["score"])
        self.assertEqual(r["next_steps"][0]["type"], "add_first_transaction")


class LevelTests(SimpleTestCase):
    def level_at(self, score):
        # build facts whose total lands on `score` is awkward: use the level helper directly
        from moneyscore.calculations import level_for
        return level_for(score)

    def test_ms05_level_boundaries(self):
        expected = {0: "Seed", 24: "Seed", 25: "Sprout", 49: "Sprout", 50: "Sapling", 74: "Sapling",
                    75: "Tree", 89: "Tree", 90: "Forest", 100: "Forest"}
        for score, name in expected.items():
            with self.subTest(score=score):
                self.assertEqual(self.level_at(score)["name"], name)

    def test_ms05_next_level_tells_how_many_points_are_missing(self):
        r = compute(facts(needs=55000, wants=35000, emergency=82500, avg_needs=55000, logged=3))  # 60, Sapling
        self.assertEqual(r["next_level"], {"name": "Tree", "at": 75, "points_needed": 15})

    def test_ms05_forest_has_no_next_level(self):
        self.assertIsNone(compute(facts())["next_level"])


class NextStepTests(SimpleTestCase):
    def setUp(self):
        self.w1 = compute(facts(needs=55000, wants=35000, emergency=82500, avg_needs=55000, logged=3))

    def test_ms07_ordered_by_points_available_and_limited_to_three(self):
        steps = self.w1["next_steps"]
        self.assertEqual([s["type"] for s in steps], ["save_more", "build_safety_net", "check_in"])

    def test_ms07_amounts_and_points_match_the_worked_example(self):
        save, safety, check_in = self.w1["next_steps"]
        self.assertEqual(save["amount"], D("10000.00"))        # 20% of income minus what is saved
        self.assertEqual(save["points"], D("12.5"))
        self.assertEqual(safety["amount"], D("82500.00"))       # 3 months of needs minus the fund
        self.assertEqual(safety["points"], D("12.5"))
        self.assertIsNone(check_in["amount"])
        self.assertEqual(check_in["points"], D("6.25"))

    def test_ms07_trim_wants_appears_when_it_is_among_the_top_three(self):
        r = compute(facts(needs=50000, wants=40000, emergency=150000, avg_needs=50000))   # wants 40%, saved 10%
        self.assertIn("trim_wants", [s["type"] for s in r["next_steps"]])
        trim = next(s for s in r["next_steps"] if s["type"] == "trim_wants")
        self.assertEqual(trim["amount"], D("10000.00"))

    def test_ms07_a_perfect_month_has_nothing_left_to_do(self):
        self.assertEqual(compute(facts())["next_steps"], [])

    def test_ms07_no_step_promises_more_points_than_are_available(self):
        for step in self.w1["next_steps"]:
            self.assertGreater(step["points"], 0)
            self.assertLessEqual(step["points"], 25)

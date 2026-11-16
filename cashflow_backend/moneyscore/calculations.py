"""Money Score maths. Pure functions, Decimal only (ADR-0003). Spec: cashflow-product/docs/specs/money-score.md

Four habits, 25 points each: spending balance (50/30), savings rate (20%), safety net (3 months),
weekly check-in. Nothing here touches the database; service.py gathers the facts.
"""
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

MAX = Decimal(25)
NEEDS_TARGET, WANTS_TARGET, SAVINGS_TARGET, SAFETY_MONTHS = Decimal(50), Decimal(30), Decimal(20), Decimal(3)
LEVELS = [("Seed", 0, 24), ("Sprout", 25, 49), ("Sapling", 50, 74), ("Tree", 75, 89), ("Forest", 90, 100)]
CENT = Decimal("0.01")


@dataclass(frozen=True)
class PeriodFacts:
    income: Decimal
    needs: Decimal
    wants: Decimal
    emergency_fund: Decimal
    avg_needs: Decimal  # mean needs over recent 30-day windows that have needs spending
    weeks_logged: int
    weeks_elapsed: int
    transactions: int = 1


def level_for(score):
    for name, low, high in LEVELS:
        if low <= score <= high:
            return {"name": name, "min": low, "max": high}
    raise ValueError(f"score out of range: {score}")


def _next_level(score):
    for name, low, _ in LEVELS:
        if low > score:
            return {"name": name, "at": low, "points_needed": low - score}
    return None  # already a Forest


def _clamp(points):
    return max(Decimal(0), min(MAX, points))


def _empty(status, step_type):
    return {"status": status, "score": None, "level": None, "next_level": None, "components": [],
            "next_steps": [{"type": step_type, "points": None, "amount": None}]}


def compute(facts):
    if facts.transactions == 0:
        return _empty("no_data", "add_first_transaction")
    if facts.income <= 0:
        return _empty("no_income", "add_income")

    income = facts.income
    needs_pct = facts.needs / income * 100
    wants_pct = facts.wants / income * 100
    saved = income - facts.needs - facts.wants
    saved_pct = saved / income * 100

    # MS-01 spending balance: only going OVER the 50/30 targets costs points
    overshoot = max(Decimal(0), needs_pct - NEEDS_TARGET) + max(Decimal(0), wants_pct - WANTS_TARGET)
    balance = _clamp(MAX - MAX * overshoot / WANTS_TARGET)
    # MS-02 savings rate against 20%
    savings = MAX * min(Decimal(1), saved_pct / SAVINGS_TARGET) if saved_pct > 0 else Decimal(0)
    # MS-03 safety net against 3 months of essentials
    months = facts.emergency_fund / facts.avg_needs if facts.avg_needs > 0 and facts.emergency_fund > 0 else None
    safety = MAX * min(Decimal(1), months / SAFETY_MONTHS) if months else Decimal(0)
    # MS-04 weekly check-in
    check_in = _clamp(MAX * facts.weeks_logged / facts.weeks_elapsed) if facts.weeks_elapsed > 0 else Decimal(0)

    total = balance + savings + safety + check_in
    score = int(total.quantize(Decimal(1), ROUND_HALF_UP))

    components = [
        {"key": "balance", "points": balance, "max": 25, "detail": {"needs_pct": needs_pct, "wants_pct": wants_pct}},
        {"key": "savings", "points": savings, "max": 25, "detail": {"saved_pct": saved_pct}},
        {"key": "safety_net", "points": safety, "max": 25, "detail": {"months": months or Decimal(0)}},
        {"key": "check_in", "points": check_in, "max": 25,
         "detail": {"weeks_logged": facts.weeks_logged, "weeks_elapsed": facts.weeks_elapsed}},
    ]

    # MS-07 next steps, biggest gain first; ties keep the component order above
    candidates = []
    wants_over = max(Decimal(0), wants_pct - WANTS_TARGET)
    trim_gain = min(MAX * wants_over / WANTS_TARGET, MAX - balance)
    if trim_gain > 0:
        candidates.append((trim_gain, 0, "trim_wants", (facts.wants - income * WANTS_TARGET / 100).quantize(CENT)))
    if MAX - savings > 0:
        need = max(Decimal(0), income * SAVINGS_TARGET / 100 - saved)
        candidates.append((MAX - savings, 1, "save_more", need.quantize(CENT)))
    if MAX - safety > 0:
        gap = (max(Decimal(0), SAFETY_MONTHS * facts.avg_needs - facts.emergency_fund).quantize(CENT)
               if facts.avg_needs > 0 else None)
        candidates.append((MAX - safety, 2, "build_safety_net", gap))
    if MAX - check_in > 0:
        candidates.append((MAX - check_in, 3, "check_in", None))
    candidates.sort(key=lambda c: (-c[0], c[1]))
    steps = [{"type": kind, "points": gain, "amount": amount} for gain, _, kind, amount in candidates[:3]]

    return {"status": "ok", "score": score, "level": level_for(score), "next_level": _next_level(score),
            "components": components, "next_steps": steps}

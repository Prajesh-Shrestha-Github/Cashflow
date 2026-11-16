"""Money Score API. A self-check, not financial advice. Money as strings (ADR-0003)."""
import re
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import service

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DISCLAIMER = "This is a self-check, not financial advice."
MAX_DELTA = Decimal("1000000000")


def _q(value, places):
    return format(value.quantize(Decimal(1).scaleb(-places), ROUND_HALF_UP), "f")


def _plain(value):
    return _q(value, 1) if isinstance(value, Decimal) else value


def _components(components):
    return [{"key": c["key"], "points": _q(c["points"], 1), "max": c["max"],
             "detail": {k: _plain(v) for k, v in c["detail"].items()}} for c in components]


def _parse_as_of(raw):
    """Returns (date or None, error response or None)."""
    if raw is None:
        return None, None
    try:
        if not DATE_RE.match(raw):
            raise ValueError
        day = date.fromisoformat(raw)
    except ValueError:
        return None, Response({"as_of": ["Use the format YYYY-MM-DD, for example 2026-11-22."]}, status=400)
    if day > service._today():
        return None, Response({"as_of": ["The date cannot be in the future."]}, status=400)
    return day, None


class ScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        as_of, error = _parse_as_of(request.query_params.get("as_of"))
        if error:
            return error

        data = service.build_score(request.user, as_of)
        data["components"] = _components(data["components"])
        data["next_steps"] = [
            {"type": s["type"],
             "points": None if s["points"] is None else _q(s["points"], 1),
             "amount": None if s["amount"] is None else _q(s["amount"], 2)}
            for s in data["next_steps"]
        ]
        lv = data["levers"]
        data["levers"] = {"income": _q(lv["income"], 2), "wants": _q(lv["wants"], 2),
                          "emergency_fund": _q(lv["emergency_fund"], 2), "avg_needs": _q(lv["avg_needs"], 2),
                          "weeks_logged": lv["weeks_logged"]}
        nudge = data["payday_nudge"]
        if nudge:
            data["payday_nudge"] = {**nudge, "income_amount": _q(nudge["income_amount"], 2),
                                    "suggested_amount": _q(nudge["suggested_amount"], 2)}
        data["disclaimer"] = DISCLAIMER
        return Response(data)


class WhatIfInputSerializer(serializers.Serializer):
    def _delta():
        return serializers.DecimalField(max_digits=14, decimal_places=2, min_value=-MAX_DELTA, max_value=MAX_DELTA, required=False)

    wants_delta = _delta()
    income_delta = _delta()
    emergency_delta = _delta()
    check_in_every_week = serializers.BooleanField(required=False, default=False)


class WhatIfView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = WhatIfInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        result = service.what_if(request.user, s.validated_data)

        def brief(r):
            return {"score": r["score"], "level": r["level"]}

        eff = result["effective"]
        body = {
            "status": result["status"],
            "as_of": result["as_of"],
            "current": brief(result["current"]),
            "scenario": None,
            "change": None,
            "effective": {"wants_delta": _q(eff["wants_delta"], 2), "income_delta": _q(eff["income_delta"], 2),
                          "emergency_delta": _q(eff["emergency_delta"], 2), "check_in_every_week": eff["check_in_every_week"]},
            "disclaimer": DISCLAIMER,
        }
        if result["scenario"]:
            sc = result["scenario"]
            body["scenario"] = {**brief(sc), "next_level": sc["next_level"], "components": _components(sc["components"])}
            body["change"] = {"score": sc["score"] - result["current"]["score"]}
        return Response(body)


class RecapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = service.recap(request.user)
        for key in ("spent", "spent_last_week", "income"):
            if key in data:
                data[key] = _q(data[key], 2)
        if data.get("top_category"):
            data["top_category"] = {**data["top_category"], "amount": _q(data["top_category"]["amount"], 2)}
        if data.get("biggest_expense"):
            b = data["biggest_expense"]
            data["biggest_expense"] = {**b, "amount": _q(b["amount"], 2)}
        data["highlights"] = [{**h, **({"amount": _q(h["amount"], 2)} if "amount" in h else {})} for h in data["highlights"]]
        data["disclaimer"] = DISCLAIMER
        return Response(data)


class SaveWhatIfGoalsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = WhatIfInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            created, existing = service.save_what_if_as_goals(request.user, s.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=400)

        def goal(g):
            return {"id": g.id, "title": g.title, "goal_type": g.goal_type, "target_amount": _q(g.target_amount, 2),
                    "target_date": g.target_date.isoformat()}

        return Response({"created": [goal(g) for g in created], "existing": [goal(g) for g in existing]},
                        status=201 if created else 200)

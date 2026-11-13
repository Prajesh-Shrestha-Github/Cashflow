"""Read one bank alert SMS into clean fields. Plan: docs/PLAN.md ("SMS parsing and categorising").

Pure functions: no database, no clock (today is passed in), money is Decimal.
"""
import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from statements.parser import MAX_AMOUNT

MAX_TEXT = 1000

# shortcut: built from one real debit SMS; the credit wording is assumed to mirror it. Add a pattern per bank as samples arrive.
_ALERT = re.compile(
    r"account\s+#*(?P<account>\w{1,20})\s+is\s+(?P<kind>debited|credited)\s+by\s+NPR\s*(?P<amount>\d[\d,]{0,15}(?:\.\d{1,2})?)"
    r"\s+on\s+(?P<date>\d{4}-\d{2}-\d{2})(?:\s+(?P<time>\d{2}:\d{2}:\d{2}))?(?:\s+by:\s*(?P<remark>\S[^\n]{0,119}))?",
    re.I,
)
_FONEPAY_QR = re.compile(r"^fonepay:fpqr:(\w+)$", re.I)


@dataclass(frozen=True)
class ParsedSms:
    date: date
    amount: Decimal        # always positive; `direction` says which way the money went
    direction: str         # "in" | "out"
    description: str       # carries the reference, account and time, so a re-sent SMS matches exactly


def _label(remark, direction):
    remark = re.sub(r"\s+", " ", (remark or "").strip())
    qr = _FONEPAY_QR.match(remark)
    if qr:
        return f"Fonepay QR payment · ref {qr.group(1)}"
    return remark or ("Bank credit" if direction == "in" else "Bank debit")


def parse_sms(text, today):
    """-> ParsedSms, or None when the text is not a transaction alert we can trust."""
    m = _ALERT.search(text or "")
    if not m:
        return None
    try:
        when = datetime.strptime(m["date"], "%Y-%m-%d").date()
    except ValueError:
        return None
    amount = Decimal(m["amount"].replace(",", ""))
    if when > today or amount == 0 or amount > MAX_AMOUNT:
        return None
    direction = "in" if m["kind"].lower() == "credited" else "out"
    parts = [_label(m["remark"], direction), f"a/c {m['account']}"] + ([m["time"]] if m["time"] else [])
    return ParsedSms(date=when, amount=amount, direction=direction, description=" · ".join(parts))

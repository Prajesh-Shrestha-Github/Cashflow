"""Read a bank/wallet statement CSV into clean rows. Spec: cashflow-product/docs/specs/statement-import.md (SI-01..SI-06).

Pure functions: no database, no clock (today is passed in), money is Decimal.
"""
import csv
import io
import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

MAX_BYTES = 2 * 1024 * 1024
MAX_ROWS = 5000
MAX_AMOUNT = Decimal("9999999999.99")  # Transaction.amount is max_digits=12, decimal_places=2

DESCRIPTION = ("description", "narration", "particulars", "remarks")
AMOUNT = ("amount",)
DEBIT = ("debit", "withdrawal", "dr")
CREDIT = ("credit", "deposit", "cr")
CATEGORY = ("category", "category_name")


class StatementError(Exception):
    """The whole file is unusable. The message is safe to show to the user."""


@dataclass(frozen=True)
class ParsedRow:
    row: int               # 1 = first data row
    date: date
    description: str
    amount: Decimal        # always positive; `direction` says which way the money went
    direction: str         # "in" | "out"
    category: str | None


@dataclass(frozen=True)
class RowError:
    row: int
    message: str


def _clean(text):
    return re.sub(r"\s+", " ", (text or "").strip())


def _find(headers, names):
    for name in names:
        if name in headers:
            return headers[name]
    return None


_CURRENCY = re.compile(r"^(?:npr|nrs|rs\.?|रू\.?|रु\.?)\s*", re.I)
_NUMBER = re.compile(r"^\d[\d,]*(\.\d{1,2})?$|^\.\d{1,2}$")


def _parse_money(text):
    """-> (positive Decimal, sign) where sign is -1, +1, or 0 when the text carries no direction. Raises ValueError."""
    t = _clean(text)
    sign = 0
    if re.search(r"\bdr\.?$", t, re.I):
        sign, t = -1, re.sub(r"\s*dr\.?$", "", t, flags=re.I)
    elif re.search(r"\bcr\.?$", t, re.I):
        sign, t = 1, re.sub(r"\s*cr\.?$", "", t, flags=re.I)
    if t.startswith("(") and t.endswith(")"):
        sign, t = -1, t[1:-1].strip()
    if t.startswith("-"):
        sign, t = -1, t[1:].strip()
    elif t.startswith("+"):
        sign, t = 1, t[1:].strip()
    t = _CURRENCY.sub("", t)
    if not _NUMBER.match(t):
        raise ValueError(f"'{text}' is not an amount I understand (use digits, like 1,500.00 or NPR 1500)")
    value = Decimal(t.replace(",", ""))
    if value == 0:
        raise ValueError("the amount is zero")
    if value > MAX_AMOUNT:
        raise ValueError("the amount is too large")
    return value, sign


_DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d %B %Y")


def _parse_date(text, today):
    t = _clean(text)
    if not t:
        raise ValueError("the date is missing")
    found = None
    for fmt in _DATE_FORMATS:
        try:
            found = datetime.strptime(t, fmt).date()
            break
        except ValueError:
            continue
    if found is None:
        m = re.match(r"^(20\d\d)[-/]\d{1,2}[-/]\d{1,2}$", t)
        if m and 2000 <= int(m.group(1)) <= 2099 and int(m.group(1)) > today.year + 1:
            raise ValueError("this looks like a Bikram Sambat date; please export the statement with English (AD) dates")
        raise ValueError(f"'{t}' is not a date I understand (use 2026-11-10 or 10/11/2026, day first)")
    if found.year > today.year + 1 and found.year >= 2070:
        raise ValueError("this looks like a Bikram Sambat date; please export the statement with English (AD) dates")
    if found > today:
        raise ValueError("this date is in the future")
    return found


def parse_statement(raw, today):
    """-> (list[ParsedRow], list[RowError]). Raises StatementError when the whole file is unusable."""
    if len(raw) > MAX_BYTES:
        raise StatementError("This file is too big (the limit is 2 MB). Please export a shorter period.")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise StatementError("I could not read this file. Please save it as a UTF-8 CSV and try again.")
    if not text.strip():
        raise StatementError("This file is empty.")

    reader = csv.reader(io.StringIO(text))
    try:
        header = next(reader)
    except StopIteration:
        raise StatementError("This file is empty.")
    headers = {_clean(h).lower(): i for i, h in enumerate(header) if _clean(h)}

    date_col = _find(headers, ("date", "txn date", "transaction date"))
    amount_col = _find(headers, AMOUNT)
    debit_col = _find(headers, DEBIT)
    credit_col = _find(headers, CREDIT)
    desc_col = _find(headers, DESCRIPTION)
    cat_col = _find(headers, CATEGORY)

    missing = []
    if date_col is None:
        missing.append("date")
    if amount_col is None and debit_col is None and credit_col is None:
        missing.append("amount (or debit and credit)")
    if missing:
        raise StatementError(f"This file is missing: {' and '.join(missing)}. The columns I found are: {', '.join(header)}.")

    def cell(row, col):
        return row[col] if col is not None and col < len(row) else ""

    rows, errors, n = [], [], 0
    for record in reader:
        if not any(c.strip() for c in record):
            continue                                    # blank line
        n += 1
        if n > MAX_ROWS:
            raise StatementError("This file has more than 5,000 rows. Please export a shorter period.")
        try:
            when = _parse_date(cell(record, date_col), today)
            direction, amount = _direction_and_amount(cell(record, amount_col), cell(record, debit_col), cell(record, credit_col),
                                                      amount_col, debit_col, credit_col)
        except ValueError as exc:
            errors.append(RowError(n, str(exc)))
            continue
        category = _clean(cell(record, cat_col)) or None
        rows.append(ParsedRow(n, when, _clean(cell(record, desc_col)), amount, direction, category))
    if n == 0:
        raise StatementError("This file has a header but no transactions.")
    return rows, errors


def _direction_and_amount(amount_text, debit_text, credit_text, amount_col, debit_col, credit_col):
    debit, credit = _clean(debit_text), _clean(credit_text)
    if debit or credit:
        if debit and credit:
            raise ValueError("this row has both a debit and a credit; I do not know which way the money went")
        value, _ = _parse_money(debit or credit)
        return ("out" if debit else "in"), value
    if amount_col is None:
        raise ValueError("this row has no debit or credit amount")
    if not _clean(amount_text):
        raise ValueError("the amount is missing")
    try:
        value, sign = _parse_money(amount_text)
    except InvalidOperation:  # pragma: no cover - guarded by _NUMBER
        raise ValueError(f"'{amount_text}' is not an amount I understand")
    return ("out" if sign < 0 else "in"), value

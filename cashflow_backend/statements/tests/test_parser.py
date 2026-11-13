"""Reading a statement file. Spec: cashflow-product/docs/specs/statement-import.md (SI-01..SI-06). Today is 22 Nov 2026."""
from datetime import date
from decimal import Decimal as D

from django.test import SimpleTestCase

from statements.parser import StatementError, parse_statement

TODAY = date(2026, 11, 22)


def parse(text, **kw):
    raw = text.encode("utf-8") if isinstance(text, str) else text
    return parse_statement(raw, today=TODAY, **kw)


def one(text):
    rows, errors = parse(text)
    assert not errors, errors
    assert len(rows) == 1, rows
    return rows[0]


class ColumnTests(SimpleTestCase):
    def test_si01_columns_are_found_by_name_in_any_order_and_case(self):
        r = one("Amount,DATE,Narration\n-500,2026-11-10,Momo\n")
        self.assertEqual((r.date, r.description, r.amount, r.direction), (date(2026, 11, 10), "Momo", D("500"), "out"))

    def test_si01_description_synonyms(self):
        for name in ("description", "narration", "particulars", "remarks"):
            self.assertEqual(one(f"date,amount,{name}\n2026-11-10,-5,Tea\n").description, "Tea", name)

    def test_si01_extra_columns_such_as_balance_are_ignored(self):
        r = one("date,description,amount,balance,ref\n2026-11-10,Salary,50000,75000,TX9\n")
        self.assertEqual((r.amount, r.direction), (D("50000"), "in"))

    def test_si01_category_column_is_read_when_present(self):
        self.assertEqual(one("date,amount,category\n2026-11-10,-5,Food\n").category, "Food")

    def test_si01_no_category_column_means_no_category(self):
        self.assertIsNone(one("date,amount\n2026-11-10,-5\n").category)

    def test_si05_missing_columns_are_named(self):
        with self.assertRaises(StatementError) as cm:
            parse("date,description\n2026-11-10,x\n")
        self.assertIn("amount", str(cm.exception))
        with self.assertRaises(StatementError) as cm:
            parse("description,amount\nx,5\n")
        self.assertIn("date", str(cm.exception))


class DirectionTests(SimpleTestCase):
    def test_si02_single_amount_column_negative_is_out_positive_is_in(self):
        rows, _ = parse("date,amount\n2026-11-10,-100\n2026-11-10,100\n")
        self.assertEqual([r.direction for r in rows], ["out", "in"])

    def test_si02_debit_credit_columns(self):
        rows, errors = parse("date,description,debit,credit\n2026-11-10,Rent,20000,\n2026-11-11,Salary,,90000\n")
        self.assertEqual(errors, [])
        self.assertEqual([(r.direction, r.amount) for r in rows], [("out", D("20000")), ("in", D("90000"))])

    def test_si02_withdrawal_deposit_names_and_sign_does_not_matter(self):
        rows, _ = parse("date,withdrawal,deposit\n2026-11-10,-300,\n2026-11-11,,-400\n")
        self.assertEqual([(r.direction, r.amount) for r in rows], [("out", D("300")), ("in", D("400"))])

    def test_si02_a_row_with_both_debit_and_credit_is_an_error(self):
        rows, errors = parse("date,debit,credit\n2026-11-10,5,5\n")
        self.assertEqual(rows, [])
        self.assertEqual(errors[0].row, 1)


class AmountTests(SimpleTestCase):
    def amount(self, text):
        return one(f'date,amount\n2026-11-10,"{text}"\n')

    def test_si03_lakh_grouping(self):
        self.assertEqual(self.amount("1,00,000.50").amount, D("100000.50"))

    def test_si03_currency_words_and_symbols(self):
        for text in ("NPR 500", "Rs. 500", "Rs 500", "रू 500", "रू500", "nrs 500"):
            self.assertEqual(self.amount(text).amount, D("500"), text)

    def test_si03_parentheses_mean_negative(self):
        r = self.amount("(500.00)")
        self.assertEqual((r.amount, r.direction), (D("500.00"), "out"))

    def test_si03_dr_and_cr_suffixes(self):
        self.assertEqual(self.amount("500 Dr").direction, "out")
        self.assertEqual(self.amount("500 Cr").direction, "in")

    def test_si03_amounts_are_decimals_with_exact_cents(self):
        self.assertEqual(self.amount("0.10").amount + self.amount("0.20").amount, D("0.30"))
        self.assertIsInstance(self.amount("5").amount, D)

    def test_si03_dollar_sign_is_an_error_row(self):
        rows, errors = parse('date,amount\n2026-11-10,"$500"\n')
        self.assertEqual((rows, errors[0].row), ([], 1))
        self.assertIn("amount", errors[0].message.lower())

    def test_si03_zero_garbage_and_overlarge_amounts_are_error_rows(self):
        for text in ("0", "0.00", "abc", "12.345", "1e5", "NaN", "Infinity", "9999999999999"):
            rows, errors = parse(f'date,amount\n2026-11-10,"{text}"\n')
            self.assertEqual((rows, len(errors)), ([], 1), text)


class DateTests(SimpleTestCase):
    def d(self, text):
        return one(f'date,amount\n"{text}",-5\n').date

    def test_si04_accepted_formats(self):
        self.assertEqual(self.d("2026-11-10"), date(2026, 11, 10))
        self.assertEqual(self.d("10-11-2026"), date(2026, 11, 10))
        self.assertEqual(self.d("10 Nov 2026"), date(2026, 11, 10))
        self.assertEqual(self.d("10 November 2026"), date(2026, 11, 10))

    def test_si04_slash_dates_are_day_first(self):
        self.assertEqual(self.d("03/04/2026"), date(2026, 4, 3))      # 3 April, not 4 March

    def test_si04_impossible_dates_are_error_rows(self):
        for text in ("31/02/2026", "2026-13-01", "yesterday", ""):
            rows, errors = parse(f'date,amount\n"{text}",-5\n')
            self.assertEqual((rows, len(errors)), ([], 1), text)

    def test_si04_the_future_is_an_error_row_but_today_is_fine(self):
        self.assertEqual(self.d("2026-11-22"), TODAY)
        rows, errors = parse("date,amount\n2026-11-23,-5\n")
        self.assertEqual((rows, len(errors)), ([], 1))

    def test_si04_bikram_sambat_years_are_refused_not_guessed(self):
        rows, errors = parse("date,amount\n2083-07-25,-5\n")
        self.assertEqual(rows, [])
        self.assertIn("Bikram Sambat", errors[0].message)


class FileTests(SimpleTestCase):
    def test_si05_a_utf8_bom_is_fine(self):
        self.assertEqual(one("﻿date,amount\n2026-11-10,-5\n").amount, D("5"))

    def test_si05_windows_line_endings_and_blank_lines(self):
        rows, errors = parse("date,amount\r\n2026-11-10,-5\r\n\r\n2026-11-11,-6\r\n")
        self.assertEqual((len(rows), errors), (2, []))

    def test_si05_not_utf8_is_refused_kindly(self):
        with self.assertRaises(StatementError) as cm:
            parse("date,amount\n2026-11-10,-5\n".encode("utf-16"))
        self.assertIn("UTF-8", str(cm.exception))

    def test_si05_empty_or_header_only_files_are_refused(self):
        for text in ("", "date,amount\n"):
            with self.assertRaises(StatementError, msg=repr(text)):
                parse(text)

    def test_si05_too_big_is_refused(self):
        with self.assertRaises(StatementError):
            parse(b"date,amount\n" + b"2026-11-10,-5\n" * 200000)
        rows = "date,amount\n" + "2026-11-10,-5\n" * 5001
        with self.assertRaises(StatementError) as cm:
            parse(rows)
        self.assertIn("5,000", str(cm.exception))

    def test_si05_exactly_5000_rows_is_fine(self):
        rows, errors = parse("date,amount\n" + "2026-11-10,-5\n" * 5000)
        self.assertEqual((len(rows), errors), (5000, []))

    def test_si06_a_bad_row_never_blocks_the_good_ones_and_is_numbered(self):
        rows, errors = parse("date,amount\n2026-11-10,-5\nnonsense,-6\n2026-11-12,-7\n,-8\n")
        self.assertEqual([r.row for r in rows], [1, 3])
        self.assertEqual([e.row for e in errors], [2, 4])

    def test_description_is_trimmed_and_spaces_collapsed_for_matching(self):
        self.assertEqual(one("date,amount,description\n2026-11-10,-5,  Momo   shop \n").description, "Momo shop")

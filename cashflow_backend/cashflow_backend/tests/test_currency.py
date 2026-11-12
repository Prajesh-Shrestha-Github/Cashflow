"""Cashflow is for Nepal: money in text we generate (AI prompts, emails, insights) is NPR, never "$"."""
from pathlib import Path

from django.test import SimpleTestCase

BACKEND = Path(__file__).resolve().parents[2]
SKIP = ("tests", "test_", "migrations", ".venv", "venv", "site-packages")


class NoDollarsTests(SimpleTestCase):
    def test_no_python_source_writes_dollar_amounts(self):
        hits = []
        for path in BACKEND.rglob("*.py"):
            rel = path.relative_to(BACKEND).as_posix()
            if any(part in rel for part in SKIP):
                continue
            for n, line in enumerate(path.read_text().splitlines(), 1):
                if "${" in line or "USD" in line:
                    hits.append(f"{rel}:{n}: {line.strip()}")
        self.assertEqual(hits, [])

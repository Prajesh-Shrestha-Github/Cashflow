from django.test import SimpleTestCase
from datetime import date
from financial_goals_and_health.serializers import FinancialGoalSerializer, FinancialHealthSerializer


class FinancialGoalSerializerTests(SimpleTestCase):
    def test_missing_required_fields(self):
        serializer = FinancialGoalSerializer(data={})
        self.assertFalse(serializer.is_valid())
        # Required fields
        for field in ('title', 'goal_type', 'target_amount', 'target_date'):
            self.assertIn(field, serializer.errors)
        # Optional fields should not error
        for field in ('description', 'start_date', 'status'):
            self.assertNotIn(field, serializer.errors)

    def test_read_only_fields(self):
        serializer = FinancialGoalSerializer()
        for field in ('current_amount', 'created_at', 'updated_at', 'completion_percentage', 'days_remaining', 'transaction_count'):
            self.assertTrue(serializer.fields[field].read_only)

    def test_transaction_count_method(self):
        class DummyObj: pass
        obj = DummyObj()
        obj.transactions = type('T', (), {'count': lambda self: 5})()
        serializer = FinancialGoalSerializer()
        self.assertEqual(serializer.get_transaction_count(obj), 5)


class FinancialHealthSerializerTests(SimpleTestCase):
    def test_missing_required_fields(self):
        serializer = FinancialHealthSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('month', serializer.errors)
        # Other fields default or read-only
        for field in ('total_income', 'total_expenses', 'savings_rate', 'income_expense_ratio', 'health_status'):
            self.assertNotIn(field, serializer.errors)

    def test_read_only_fields(self):
        serializer = FinancialHealthSerializer()
        for field in ('savings_rate', 'income_expense_ratio', 'health_status', 'created_at', 'updated_at'):
            self.assertTrue(serializer.fields[field].read_only)

    def test_month_display_method(self):
        dummy = type('D', (), {'month': date(2025, 4, 27)})()
        serializer = FinancialHealthSerializer()
        self.assertEqual(serializer.get_month_display(dummy), 'April 2025')

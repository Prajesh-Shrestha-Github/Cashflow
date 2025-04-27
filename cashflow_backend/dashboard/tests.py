from django.test import SimpleTestCase
from decimal import Decimal
from dashboard.serializers import DashboardStatSerializer

class DashboardStatSerializerTests(SimpleTestCase):
    def test_fields_not_required(self):
        serializer = DashboardStatSerializer()
        for field in ('total_income', 'total_expense', 'balance', 'active_goals'):
            self.assertFalse(serializer.fields[field].required)

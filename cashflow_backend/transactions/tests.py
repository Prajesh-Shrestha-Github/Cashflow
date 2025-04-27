from django.test import SimpleTestCase
from transactions.serializers import TransactionSerializer, CategorySerializer, CSVUploadSerializer

class CategorySerializerTests(SimpleTestCase):
    def test_missing_required_fields(self):
        serializer = CategorySerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        self.assertIn('type', serializer.errors)

    def test_fields_configuration(self):
        serializer = CategorySerializer()
        self.assertTrue(serializer.fields['name'].required)
        self.assertTrue(serializer.fields['type'].required)
        self.assertFalse(serializer.fields['description'].required)
        self.assertTrue(serializer.fields['id'].read_only)

class TransactionSerializerTests(SimpleTestCase):
    def test_missing_required_fields(self):
        serializer = TransactionSerializer(data={})
        self.assertFalse(serializer.is_valid())
        # Only 'amount' is required
        self.assertIn('amount', serializer.errors)
        self.assertNotIn('category', serializer.errors)
        self.assertNotIn('date', serializer.errors)

    def test_fields_configuration(self):
        serializer = TransactionSerializer()
        # Required fields
        for field in ('amount',):
            self.assertTrue(serializer.fields[field].required)
        # Optional fields
        for field in ('date', 'category', 'description', 'is_recurring', 'frequency', 'next_due_date', 'send_email_reminder', 'financial_goal'):
            self.assertFalse(serializer.fields[field].required)
        for field in ('id', 'category_name', 'category_type', 'goal_title', 'created_at', 'updated_at'):
            self.assertTrue(serializer.fields[field].read_only)
        # Field options
        self.assertFalse(serializer.fields['send_email_reminder'].required)
        self.assertFalse(serializer.fields['frequency'].required)
        self.assertTrue(serializer.fields['frequency'].allow_null)

class CSVUploadSerializerTests(SimpleTestCase):
    def test_missing_file_field(self):
        serializer = CSVUploadSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)

    def test_fields_configuration(self):
        serializer = CSVUploadSerializer()
        self.assertTrue(serializer.fields['file'].required)
        self.assertFalse(serializer.fields['file'].read_only)

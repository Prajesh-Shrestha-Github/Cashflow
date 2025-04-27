from django.test import SimpleTestCase
from recommendations.serializers import RecommendationSerializer, RecommendationRequestSerializer

class RecommendationSerializerTests(SimpleTestCase):
    def test_missing_query_field(self):
        serializer = RecommendationSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('query', serializer.errors)

    def test_valid_data(self):
        data = {'query': 'Sample query', 'sarcasm_level': 3}
        serializer = RecommendationSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        validated = serializer.validated_data
        self.assertEqual(validated['query'], 'Sample query')
        self.assertEqual(validated.get('sarcasm_level'), 3)

class RecommendationRequestSerializerTests(SimpleTestCase):
    def test_missing_query_field(self):
        serializer = RecommendationRequestSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('query', serializer.errors)

    def test_valid_data(self):
        data = {'query': 'hello', 'sarcasm_level': 2}
        serializer = RecommendationRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        validated = serializer.validated_data
        self.assertEqual(validated['query'], 'hello')
        self.assertEqual(validated['sarcasm_level'], 2)

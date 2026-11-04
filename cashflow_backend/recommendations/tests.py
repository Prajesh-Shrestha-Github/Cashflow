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


# ---------------------------------------------------------------------------
# AI service and view tests. All OpenRouter calls are mocked: no real requests,
# no free-tier quota used.
# ---------------------------------------------------------------------------
import os
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from recommendations.models import DailyRequestCounter, Recommendation
from recommendations.services import (
    AIRecommendationService, AIServiceError, DEFAULT_MODELS, get_models,
)

ENV = {"ROUTER_API_KEY": "test-key", "OPENROUTER_MODELS": "m/one:free,m/two:free"}


def fake_response(status=200, content="Save 20% of your income."):
    r = MagicMock()
    r.status_code = status
    r.text = "body"
    r.json.return_value = {"choices": [{"message": {"content": content}}]}
    return r


@patch("recommendations.services.load_dotenv", lambda **kw: None)
@patch.dict(os.environ, ENV)
class AIServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("svc_user", password="x")
        self.svc = AIRecommendationService()

    @patch("recommendations.services.requests.post")
    def test_first_model_answers_and_request_is_counted(self, post):
        post.return_value = fake_response()
        text = self.svc.generate_recommendation(self.user, "How do I save?")
        self.assertEqual(text, "Save 20% of your income.")
        self.assertEqual(post.call_args.kwargs["json"]["model"], "m/one:free")
        self.assertEqual(post.call_args.kwargs["json"]["temperature"], 0.3)
        self.assertEqual(DailyRequestCounter.objects.get(user=self.user).count, 1)

    @patch("recommendations.services.requests.post")
    def test_falls_back_to_next_model_when_one_is_gone(self, post):
        post.side_effect = [fake_response(404), fake_response(200, "From model two")]
        text = self.svc.generate_recommendation(self.user, "Hi")
        self.assertEqual(text, "From model two")
        self.assertEqual([c.kwargs["json"]["model"] for c in post.call_args_list], ["m/one:free", "m/two:free"])

    @patch("recommendations.services.requests.post")
    def test_all_models_failing_raises_and_does_not_use_a_request(self, post):
        post.return_value = fake_response(429)
        with self.assertRaises(AIServiceError):
            self.svc.generate_recommendation(self.user, "Hi")
        self.assertFalse(DailyRequestCounter.objects.filter(user=self.user, count__gt=0).exists())

    @patch("recommendations.services.requests.post")
    def test_rejected_key_stops_at_once_with_a_clear_message(self, post):
        post.return_value = fake_response(401)
        with self.assertRaises(AIServiceError) as ctx:
            self.svc.generate_recommendation(self.user, "Hi")
        self.assertIn("ROUTER_API_KEY", ctx.exception.user_message)
        self.assertEqual(post.call_count, 1)

    @patch("recommendations.services.requests.post")
    def test_empty_answer_falls_through_to_next_model(self, post):
        post.side_effect = [fake_response(200, "   "), fake_response(200, "Real answer")]
        self.assertEqual(self.svc.generate_recommendation(self.user, "Hi"), "Real answer")

    @patch.dict(os.environ, {"ROUTER_API_KEY": ""})
    def test_missing_key_gives_a_clear_error_not_a_crash(self):
        with self.assertRaises(AIServiceError) as ctx:
            self.svc.generate_recommendation(self.user, "Hi")
        self.assertIn("ROUTER_API_KEY", ctx.exception.user_message)

    @patch.dict(os.environ, {"OPENROUTER_MODELS": ""})
    def test_default_model_chain_starts_with_gemma_and_ends_with_router(self):
        self.assertEqual(get_models(), DEFAULT_MODELS)
        self.assertTrue(DEFAULT_MODELS[0].startswith("google/gemma-4-31b"))
        self.assertEqual(DEFAULT_MODELS[-1], "openrouter/free")


@patch("recommendations.services.load_dotenv", lambda **kw: None)
@patch.dict(os.environ, ENV)
class RecommendationViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("view_user", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    @patch("recommendations.services.requests.post")
    def test_success_saves_history_and_reports_remaining(self, post):
        post.return_value = fake_response()
        r = self.client.post("/api/recommendations/ask/", {"query": "Help", "sarcasm_level": 0}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["requests_remaining"], 2)
        self.assertEqual(Recommendation.objects.filter(user=self.user).count(), 1)

    @patch("recommendations.services.requests.post")
    def test_ai_failure_is_an_error_status_and_is_not_saved(self, post):
        post.return_value = fake_response(503)
        r = self.client.post("/api/recommendations/ask/", {"query": "Help", "sarcasm_level": 0}, format="json")
        self.assertEqual(r.status_code, 503)
        self.assertIn("detail", r.json())
        # regression: the apology text used to be saved as if it were an answer
        self.assertEqual(Recommendation.objects.filter(user=self.user).count(), 0)
        self.assertFalse(DailyRequestCounter.objects.filter(user=self.user, count__gt=0).exists())

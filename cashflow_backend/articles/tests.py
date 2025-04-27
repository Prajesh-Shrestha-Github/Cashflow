from django.test import SimpleTestCase
from articles.serializers import ArticleSerializer, BookmarkSerializer

class ArticleSerializerTests(SimpleTestCase):
    def test_missing_required_fields(self):
        serializer = ArticleSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)
        self.assertIn('content', serializer.errors)
        self.assertNotIn('summary', serializer.errors)

class BookmarkSerializerTests(SimpleTestCase):
    def test_missing_article_field(self):
        serializer = BookmarkSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn('article', serializer.errors)

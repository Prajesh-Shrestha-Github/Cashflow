from rest_framework import serializers
from .models import Article, Bookmark

class ArticleSerializer(serializers.ModelSerializer):
    is_bookmarked = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'content', 'summary', 'image_url', 
                 'created_at', 'updated_at', 'is_published', 'is_bookmarked']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, article=obj).exists()
        return False

class BookmarkSerializer(serializers.ModelSerializer):
    article_title = serializers.ReadOnlyField(source='article.title')
    
    class Meta:
        model = Bookmark
        fields = ['id', 'article', 'article_title', 'created_at']
        read_only_fields = ['id', 'created_at']
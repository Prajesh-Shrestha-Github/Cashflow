from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Article, Bookmark
from .serializers import ArticleSerializer, BookmarkSerializer

class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit articles.
    """
    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS requests for any user
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only allow admin users to perform write operations
        return request.user and request.user.is_staff

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.filter(is_published=True).order_by('-created_at')
    serializer_class = ArticleSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content', 'summary']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Article.objects.all().order_by('-created_at')
        return super().get_queryset()
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, slug=None):
        article = self.get_object()
        user = request.user
        
        bookmark, created = Bookmark.objects.get_or_create(
            user=user,
            article=article
        )
        
        if created:
            return Response({'status': 'article bookmarked'}, status=status.HTTP_201_CREATED)
        return Response({'status': 'article already bookmarked'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_bookmark(self, request, slug=None):
        article = self.get_object()
        user = request.user
        
        try:
            bookmark = Bookmark.objects.get(user=user, article=article)
            bookmark.delete()
            return Response({'status': 'bookmark removed'}, status=status.HTTP_204_NO_CONTENT)
        except Bookmark.DoesNotExist:
            return Response({'status': 'bookmark not found'}, status=status.HTTP_404_NOT_FOUND)

class BookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).order_by('-created_at')
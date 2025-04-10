from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, BookmarkViewSet

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')

urlpatterns = [
    path('', include(router.urls)),
]
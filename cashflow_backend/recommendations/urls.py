from django.urls import path
from .views import RecommendationView, RecommendationHistoryView

urlpatterns = [
    path('ask/', RecommendationView.as_view(), name='ask_recommendation'),
    path('history/', RecommendationHistoryView.as_view(), name='recommendation_history'),
]
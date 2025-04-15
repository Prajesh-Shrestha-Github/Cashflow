# financial_goals/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinancialGoalViewSet, FinancialHealthViewSet

router = DefaultRouter()
router.register(r'goals', FinancialGoalViewSet, basename='financial-goals')
router.register(r'health', FinancialHealthViewSet, basename='financial-health')

urlpatterns = [
    path('', include(router.urls)),
]
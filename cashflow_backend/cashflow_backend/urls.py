# cashflow/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/financial/', include('financial_goals_and_health.urls')),
    path('api/recommendations/', include('recommendations.urls')),
    path('api/articles/', include('articles.urls')),
    path('api/reminders/', include('reminders.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
# dashboard/urls.py

from django.urls import path
from .views import DashboardView, AdminDashboardView, AdminActionsView
from .balance import BalanceView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('balance/', BalanceView.as_view(), name='dashboard-balance'),
    path('admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/actions/', AdminActionsView.as_view(), name='admin-actions'),
]
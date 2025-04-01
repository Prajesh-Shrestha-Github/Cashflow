# accounts/urls.py

from django.urls import path, include
from .views import (
    RegisterView,
    LoginView,
    UserDetailsView,
    ChangePasswordView,
    LogoutView,
    ResetPasswordView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', UserDetailsView.as_view(), name='user-details'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    path('password-reset/confirm/', ResetPasswordView.as_view(), name='password_reset_confirm'),
]

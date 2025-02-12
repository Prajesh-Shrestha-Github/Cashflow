from django.urls import path
from .views import RegisterView, LoginView, PasswordResetWithSecurityView, GetSecurityQuestionView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("reset-password/", PasswordResetWithSecurityView.as_view(), name="reset-password"),
    path("get-security-question/", GetSecurityQuestionView.as_view(), name="get-security-question"),
]

"""Rutas de autenticación y de preferencias (bajo `/api/v1/`)."""

from django.urls import path

from apps.accounts.api import (
    CsrfView,
    CurrentUserView,
    LoginView,
    LogoutView,
    RegisterView,
    UserPreferenceView,
)

app_name = "accounts"

urlpatterns = [
    path("auth/csrf/", CsrfView.as_view(), name="csrf"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", CurrentUserView.as_view(), name="me"),
    path("preferences/", UserPreferenceView.as_view(), name="preferences"),
]

"""Permisos reutilizables por las apps de dominio."""

from typing import Any

from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsAdminUserOrReadOnly(BasePermission):
    """Lectura pública; escritura solo para personal (``is_staff``).

    Se usa en recursos que son *configuración* y no contenido de usuario (p. ej. `Source`).
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if request.method in SAFE_METHODS:
            return True
        user: Any = request.user
        return bool(user and user.is_staff)

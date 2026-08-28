"""Vistas transversales: comprobación de estado del servicio."""

from django.db import DatabaseError, connection
from drf_spectacular.utils import OpenApiExample, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Comprueba que la API responde y que hay conexión con la base de datos."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    @extend_schema(
        operation_id="health",
        summary="Estado del servicio",
        description=(
            "Devuelve `200` con `status=ok` si el servicio y la base de datos responden. "
            "Devuelve `503` con `status=degraded` si la base de datos no está disponible."
        ),
        responses=inline_serializer(
            name="Health",
            fields={
                "status": serializers.CharField(),
                "database": serializers.CharField(),
            },
        ),
        examples=[
            OpenApiExample("OK", value={"status": "ok", "database": "ok"}),
        ],
    )
    def get(self, request: Request) -> Response:
        database_ok = self._database_ok()
        payload = {
            "status": "ok" if database_ok else "degraded",
            "database": "ok" if database_ok else "error",
        }
        http_status = status.HTTP_200_OK if database_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=http_status)

    @staticmethod
    def _database_ok() -> bool:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            return False
        return True

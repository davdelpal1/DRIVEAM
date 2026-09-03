"""API de autenticación y de preferencias de compra.

Autenticación por **sesión de Django** (cookie ``sessionid`` httpOnly). El navegador obtiene el
token CSRF en ``GET /api/v1/auth/csrf/`` y lo envía en la cabecera ``X-CSRFToken`` en las
peticiones que modifican estado. Ver `docs/decisions/0007-autenticacion-y-sesion.md`.
"""

from typing import Any, cast

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import serializers, status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.accounts.models import User as UserModel
from apps.accounts.models import UserPreference

User = get_user_model()

_MODEL_BACKEND = "django.contrib.auth.backends.ModelBackend"

WEIGHT_FIELDS = (
    "weight_price",
    "weight_mileage",
    "weight_age",
    "weight_reliability",
    "weight_consumption",
    "weight_financing",
    "weight_warranty",
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "date_joined")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_email(self, value: str) -> str:
        value = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este email.")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data: dict[str, Any]) -> Any:
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        exclude = ("user",)
        read_only_fields = ("id", "created_at", "updated_at")
        extra_kwargs = {name: {"min_value": 0, "max_value": 100} for name in WEIGHT_FIELDS}

    def _validate_string_list(self, value: Any) -> list[str]:
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError("Debe ser una lista de cadenas de texto.")
        return value

    def validate_fuel_types(self, value: Any) -> list[str]:
        return self._validate_string_list(value)

    def validate_body_types(self, value: Any) -> list[str]:
        return self._validate_string_list(value)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """Establece la cookie ``csrftoken`` para las peticiones de escritura del frontend."""

    permission_classes = [AllowAny]

    @extend_schema(responses=OpenApiResponse(description="Cookie CSRF establecida."))
    def get(self, request: Request) -> Response:
        return Response({"detail": "Cookie CSRF establecida."})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth-register"

    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request: Request) -> Response:
        if not settings.REGISTRATION_ENABLED:
            return Response(
                {"detail": "El registro de nuevas cuentas está deshabilitado."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user, backend=_MODEL_BACKEND)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth-login"

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            # Mensaje genérico: no revelamos si el email existe.
            raise serializers.ValidationError({"detail": ["Email o contraseña incorrectos."]})
        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={204: OpenApiResponse(description="Sesión cerrada.")})
    def post(self, request: Request) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CurrentUserView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            200: UserSerializer,
            401: OpenApiResponse(description="No autenticado."),
        }
    )
    def get(self, request: Request) -> Response:
        if not request.user.is_authenticated:
            return Response({"detail": "No autenticado."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(UserSerializer(request.user).data)


class UserPreferenceView(RetrieveUpdateAPIView):
    """`GET·PUT·PATCH /api/v1/preferences/` — preferencias del usuario autenticado (singleton)."""

    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> UserPreference:
        preference, _ = UserPreference.objects.get_or_create(user=self.request.user)
        return preference

    def perform_update(self, serializer: Any) -> None:
        super().perform_update(serializer)
        # Los pesos y umbrales cambian el Car Score de todos los candidatos del usuario.
        from apps.scoring.services import recalculate_for_user

        recalculate_for_user(cast(UserModel, self.request.user))

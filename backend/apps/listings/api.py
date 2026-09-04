"""API REST de anuncios.

`ListingSerializer` acepta `vehicle`/`source`/`seller` por clave primaria en escritura y
devuelve además su representación anidada (`*_detail`) y las ofertas de financiación, para que
el frontend pueda pintar un anuncio sin encadenar peticiones.

`CandidateViewSet` es el flujo "Nuevo candidato" de la FASE 3: un endpoint plano por usuario
(`/api/v1/candidates/`) que crea/edita a la vez el `Vehicle` normalizado y su `Listing`, con
acciones para archivar y marcar favorito. La lógica vive en `apps.listings.services`.
"""

from typing import Any, cast

from django.db.models import Prefetch
from django.utils import timezone
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.favorites.models import Favorite
from apps.finance.api import (
    FinanceOfferSerializer,
    FinanceOfferWriteSerializer,
    breakdown_for_offer,
)
from apps.finance.models import FinanceOffer
from apps.listings import services
from apps.listings.enums import TrackingStatus
from apps.listings.models import Listing
from apps.scoring.engine import SCORE_VERSION
from apps.scoring.models import Score
from apps.scoring.services import recalculate_score
from apps.sources.adapters import ListingImportError, import_listing
from apps.sources.api import SellerSerializer, SourceSerializer
from apps.vehicles.api import VehicleSerializer
from apps.vehicles.enums import FuelType


class ListingSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source="vehicle", read_only=True)
    source_detail = SourceSerializer(source="source", read_only=True)
    seller_detail = SellerSerializer(source="seller", read_only=True)
    finance_offers = FinanceOfferSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class ListingFilter(filters.FilterSet):
    price_cash_min = filters.NumberFilter(field_name="price_cash", lookup_expr="gte")
    price_cash_max = filters.NumberFilter(field_name="price_cash", lookup_expr="lte")
    mileage_max = filters.NumberFilter(field_name="mileage_km", lookup_expr="lte")
    year_min = filters.NumberFilter(
        field_name="vehicle__first_registration_year", lookup_expr="gte"
    )
    fuel_type = filters.CharFilter(field_name="vehicle__fuel_type", lookup_expr="exact")

    class Meta:
        model = Listing
        fields = ["status", "source", "province"]


class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.select_related("vehicle", "source", "seller").prefetch_related(
        "finance_offers"
    )
    serializer_class = ListingSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_class = ListingFilter
    search_fields = ["title", "description"]
    ordering_fields = ["price_cash", "mileage_km", "registration_date", "created_at"]
    ordering = ["-created_at"]


# --- Candidatos (alta manual, FASE 3) -------------------------------------------------


class CandidateSerializer(serializers.Serializer):
    """Vista plana de un candidato: campos de `Vehicle` y de `Listing` en un solo objeto."""

    id = serializers.IntegerField(read_only=True)
    vehicle_id = serializers.IntegerField(read_only=True)

    make = serializers.CharField(max_length=80)
    model = serializers.CharField(max_length=120)
    version = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    fuel_type = serializers.ChoiceField(
        choices=FuelType.choices, required=False, default=FuelType.UNKNOWN
    )
    power_cv = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    year = serializers.IntegerField(min_value=1900, max_value=2100, required=False, allow_null=True)
    fuel_consumption = serializers.DecimalField(
        max_digits=4, decimal_places=1, min_value=0, required=False, allow_null=True
    )

    mileage_km = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    price_cash = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, required=False, allow_null=True
    )
    price_financed = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0, required=False, allow_null=True
    )
    seller_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default=""
    )
    warranty_months = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    location = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")
    url = serializers.URLField(max_length=500, required=False, allow_blank=True, default="")
    # Cuando el candidato se da de alta desde la importación por URL (FASE 8): marca la fuente
    # como `datos-estructurados` y guarda la procedencia en `Listing.raw_data`.
    import_url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, default="", write_only=True
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    tracking_status = serializers.ChoiceField(
        choices=TrackingStatus.choices, required=False, default=TrackingStatus.NEW
    )

    is_favorite = serializers.SerializerMethodField()
    is_archived = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    def get_is_favorite(self, obj: Listing) -> bool:
        user = self.context["request"].user
        return any(fav.user_id == user.id for fav in obj.favorited_by.all())

    def get_is_archived(self, obj: Listing) -> bool:
        return obj.archived_at is not None

    @staticmethod
    def _money(value: Any) -> str | None:
        return None if value is None else f"{value:.2f}"

    def _score_row(self, instance: Listing) -> Score | None:
        user = self.context["request"].user
        row = next(
            (
                s
                for s in instance.scores.all()
                if s.user_id == user.id and s.version == SCORE_VERSION
            ),
            None,
        )
        if row is None:
            # Red de seguridad: candidato sin Car Score todavía (dato antiguo). Lo calcula y guarda.
            row = recalculate_score(listing=instance, user=user)
        return row

    def to_representation(self, instance: Listing) -> dict[str, Any]:
        vehicle = instance.vehicle
        user_id = self.context["request"].user.id
        note = next((n for n in instance.notes.all() if n.user_id == user_id), None)
        offer = next(iter(instance.finance_offers.all()), None)
        finance_breakdown = breakdown_for_offer(offer) if offer is not None else None
        score_row = self._score_row(instance)
        return {
            "id": instance.id,
            "vehicle_id": vehicle.id,
            "make": vehicle.make,
            "model": vehicle.model,
            "version": vehicle.version,
            "fuel_type": vehicle.fuel_type,
            "power_cv": vehicle.power_cv,
            "year": vehicle.first_registration_year,
            "fuel_consumption": (
                None if vehicle.fuel_consumption is None else f"{vehicle.fuel_consumption:.1f}"
            ),
            "mileage_km": instance.mileage_km,
            "price_cash": self._money(instance.price_cash),
            "price_financed": self._money(instance.price_financed),
            "seller_name": instance.seller.name if instance.seller else "",
            "warranty_months": instance.warranty_months,
            "location": instance.city,
            "url": instance.url,
            "notes": note.text if note else "",
            "tracking_status": instance.tracking_status,
            "source": instance.source.slug,
            "source_label": instance.source.name,
            "score": score_row.score if score_row is not None else None,
            "score_breakdown": score_row.breakdown if score_row is not None else None,
            "finance_total_cost": (
                self._money(finance_breakdown.total_financed_cost)
                if finance_breakdown is not None
                else None
            ),
            "finance_difference_vs_cash": (
                self._money(finance_breakdown.difference_vs_cash)
                if finance_breakdown is not None
                else None
            ),
            "is_favorite": self.get_is_favorite(instance),
            "is_archived": self.get_is_archived(instance),
            "created_at": instance.created_at,
        }

    def _to_service_data(self, validated: dict[str, Any]) -> dict[str, Any]:
        """Renombra las claves de formulario a las de los modelos que espera el servicio."""
        data = dict(validated)
        if not data.get("import_url"):
            data.pop("import_url", None)
        if "year" in data:
            data["first_registration_year"] = data.pop("year")
        if "location" in data:
            data["city"] = data.pop("location")
        return data

    def create(self, validated_data: dict[str, Any]) -> Listing:
        owner = cast(User, self.context["request"].user)
        return services.create_candidate(owner=owner, data=self._to_service_data(validated_data))

    def update(self, instance: Listing, validated_data: dict[str, Any]) -> Listing:
        return services.update_candidate(instance, self._to_service_data(validated_data))


class CandidateFilter(filters.FilterSet):
    is_archived = filters.BooleanFilter(
        field_name="archived_at", lookup_expr="isnull", exclude=True
    )
    price_min = filters.NumberFilter(field_name="price_cash", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price_cash", lookup_expr="lte")
    year_min = filters.NumberFilter(
        field_name="vehicle__first_registration_year", lookup_expr="gte"
    )
    year_max = filters.NumberFilter(
        field_name="vehicle__first_registration_year", lookup_expr="lte"
    )
    mileage_max = filters.NumberFilter(field_name="mileage_km", lookup_expr="lte")
    fuel_type = filters.CharFilter(field_name="vehicle__fuel_type", lookup_expr="exact")
    tracking_status = filters.CharFilter(lookup_expr="exact")
    is_favorite = filters.BooleanFilter(method="filter_is_favorite")

    class Meta:
        model = Listing
        fields: list[str] = []

    def filter_is_favorite(self, queryset: Any, name: str, value: bool) -> Any:
        user = self.request.user
        favorited = queryset.filter(favorited_by__user=user)
        return favorited if value else queryset.exclude(pk__in=favorited)


class CandidateViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = CandidateFilter
    ordering_fields = [
        "price_cash",
        "mileage_km",
        "created_at",
        "archived_at",
        "vehicle__first_registration_year",
    ]
    ordering = ["-created_at"]

    def get_queryset(self) -> Any:
        return (
            Listing.objects.filter(owner=cast(User, self.request.user))
            .select_related("vehicle", "seller", "source")
            .prefetch_related(
                "favorited_by",
                "notes",
                "finance_offers",
                Prefetch(
                    "scores",
                    queryset=Score.objects.filter(
                        user=cast(User, self.request.user), version=SCORE_VERSION
                    ),
                ),
            )
        )

    def perform_destroy(self, instance: Listing) -> None:
        services.delete_candidate(instance)

    def _set_archived(self, request: Request, value: Any) -> Response:
        listing = self.get_object()
        listing.archived_at = value
        listing.save(update_fields=["archived_at"])
        return Response(self.get_serializer(listing).data)

    @action(detail=True, methods=["post"])
    def archive(self, request: Request, pk: str | None = None) -> Response:
        return self._set_archived(request, timezone.now())

    @action(detail=True, methods=["post"])
    def unarchive(self, request: Request, pk: str | None = None) -> Response:
        return self._set_archived(request, None)

    @extend_schema(
        request=FinanceOfferWriteSerializer,
        responses=FinanceOfferSerializer,
    )
    @action(detail=True, methods=["get", "put", "delete"], url_path="finance")
    def finance(self, request: Request, pk: str | None = None) -> Response:
        """Oferta de financiación del candidato (una por candidato manual) + su desglose."""
        listing = self.get_object()
        offer = listing.finance_offers.first()

        if request.method == "GET":
            if offer is None:
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response(FinanceOfferSerializer(offer).data)

        if request.method == "DELETE":
            if offer is not None:
                offer.delete()
            recalculate_score(listing=listing, user=cast(User, request.user), offer=None)
            return Response(status=status.HTTP_204_NO_CONTENT)

        write = FinanceOfferWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        offer, _ = FinanceOffer.objects.update_or_create(
            listing=listing, defaults=write.validated_data
        )
        recalculate_score(listing=listing, user=cast(User, request.user), offer=offer)
        return Response(FinanceOfferSerializer(offer).data)

    @action(detail=True, methods=["post"])
    def favorite(self, request: Request, pk: str | None = None) -> Response:
        listing = self.get_object()
        Favorite.objects.get_or_create(user=cast(User, request.user), listing=listing)
        return Response(self.get_serializer(self.get_queryset().get(pk=listing.pk)).data)

    @action(detail=True, methods=["post"])
    def unfavorite(self, request: Request, pk: str | None = None) -> Response:
        listing = self.get_object()
        Favorite.objects.filter(user=cast(User, request.user), listing=listing).delete()
        return Response(self.get_serializer(self.get_queryset().get(pk=listing.pk)).data)


# --- Importación por URL (FASE 8) ----------------------------------------------------


class ListingImportRequestSerializer(serializers.Serializer):
    url = serializers.URLField(max_length=2000)


class ListingImportView(APIView):
    """`POST /api/v1/listings/import/` — lee una URL y devuelve un candidato **para revisar**.

    No persiste nada: el usuario revisa/corrige y luego guarda con `POST /api/v1/candidates/`
    (enviando `import_url` para conservar la procedencia). Errores estructurados:
    `{"code": ..., "detail": ...}` con 4xx/502 según el fallo.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "listings-import"

    @extend_schema(request=ListingImportRequestSerializer, responses=None)
    def post(self, request: Request) -> Response:
        payload = ListingImportRequestSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        url = payload.validated_data["url"]

        try:
            adapter, raw = import_listing(url)
        except ListingImportError as exc:
            return Response({"code": exc.code, "detail": exc.detail}, status=exc.status_code)

        return Response(
            {
                "source": {"slug": adapter.slug, "name": adapter.source_defaults.get("name", "")},
                "source_url": raw.source_url,
                "title": raw.title,
                "warnings": raw.warnings,
                "raw": raw.raw,
                "candidate": {**raw.to_candidate_payload(), "import_url": raw.source_url},
            }
        )

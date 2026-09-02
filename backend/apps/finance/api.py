"""API de ofertas de financiación y calculadora del coste real (FASE 6).

- `FinanceOfferSerializer` es escribible y añade `breakdown`, el desglose calculado por
  `apps.finance.calculator` a partir de la oferta y del precio al contado del anuncio.
- La oferta se gestiona por candidato en `CandidateViewSet` (`/api/v1/candidates/{id}/finance/`).
- `FinanceCalculateView` (`POST /api/v1/finance/calculate/`) calcula sin persistir nada, para
  la previsualización en vivo del formulario.
"""

from dataclasses import asdict
from decimal import Decimal
from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.finance.calculator import FinanceBreakdown, compute_breakdown
from apps.finance.models import FinanceOffer

_TERM_FIELDS = (
    "deposit",
    "amount_financed",
    "monthly_payment",
    "number_of_payments",
    "final_payment",
    "opening_fee",
    "tin",
    "tae",
    "mandatory_products_cost",
    "total_cost",
)


def _money(value: Decimal | None) -> str | None:
    return None if value is None else f"{value:.2f}"


def serialize_breakdown(breakdown: FinanceBreakdown) -> dict[str, str | None]:
    return {key: _money(value) for key, value in asdict(breakdown).items()}


def breakdown_for_offer(offer: FinanceOffer) -> FinanceBreakdown:
    """Desglose de una oferta usando el precio al contado de su anuncio."""
    return compute_breakdown(
        price_cash=offer.listing.price_cash,
        deposit=offer.deposit,
        amount_financed=offer.amount_financed,
        monthly_payment=offer.monthly_payment,
        number_of_payments=offer.number_of_payments,
        final_payment=offer.final_payment,
        opening_fee=offer.opening_fee,
        mandatory_products_cost=offer.mandatory_products_cost,
        tin=offer.tin,
        tae=offer.tae,
    )


class FinanceOfferSerializer(serializers.ModelSerializer):
    breakdown = serializers.SerializerMethodField()

    class Meta:
        model = FinanceOffer
        fields = (
            "id",
            "listing",
            *_TERM_FIELDS,
            "source_text",
            "breakdown",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "listing", "created_at", "updated_at")

    def get_breakdown(self, obj: FinanceOffer) -> dict[str, str | None]:
        return serialize_breakdown(breakdown_for_offer(obj))


class FinanceTermsSerializer(serializers.Serializer):
    """Condiciones sueltas para la calculadora sin persistencia."""

    price_cash = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal(0), required=False, allow_null=True
    )
    deposit = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal(0), required=False, allow_null=True
    )
    amount_financed = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal(0), required=False, allow_null=True
    )
    monthly_payment = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal(0), required=False, allow_null=True
    )
    number_of_payments = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    final_payment = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal(0), required=False, allow_null=True
    )
    opening_fee = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal(0), required=False, allow_null=True
    )
    tin = serializers.DecimalField(
        max_digits=6, decimal_places=3, min_value=Decimal(0), required=False, allow_null=True
    )
    tae = serializers.DecimalField(
        max_digits=6, decimal_places=3, min_value=Decimal(0), required=False, allow_null=True
    )
    mandatory_products_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal(0), required=False, allow_null=True
    )

    def to_breakdown(self) -> FinanceBreakdown:
        data: dict[str, Any] = self.validated_data
        return compute_breakdown(**data)


class _BreakdownFieldsSerializer(serializers.Serializer):
    amount_financed = serializers.CharField(allow_null=True)
    total_payments = serializers.CharField(allow_null=True)
    total_financed_cost = serializers.CharField(allow_null=True)
    difference_vs_cash = serializers.CharField(allow_null=True)
    annual_cost_approx = serializers.CharField(allow_null=True)


class BreakdownResponseSerializer(serializers.Serializer):
    breakdown = _BreakdownFieldsSerializer()


class FinanceCalculateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=FinanceTermsSerializer,
        responses=BreakdownResponseSerializer,
    )
    def post(self, request: Request) -> Response:
        serializer = FinanceTermsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"breakdown": serialize_breakdown(serializer.to_breakdown())})


class FinanceOfferWriteSerializer(serializers.ModelSerializer):
    """Datos escribibles de la oferta (sin `listing`, que se fija desde la URL)."""

    class Meta:
        model = FinanceOffer
        fields = (*_TERM_FIELDS, "source_text")
        extra_kwargs = {field: {"required": False} for field in _TERM_FIELDS}

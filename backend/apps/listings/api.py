"""API REST de anuncios.

`ListingSerializer` acepta `vehicle`/`source`/`seller` por clave primaria en escritura y
devuelve además su representación anidada (`*_detail`) y las ofertas de financiación, para que
el frontend pueda pintar un anuncio sin encadenar peticiones.
"""

from django_filters import rest_framework as filters
from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from apps.finance.api import FinanceOfferSerializer
from apps.listings.models import Listing
from apps.sources.api import SellerSerializer, SourceSerializer
from apps.vehicles.api import VehicleSerializer


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

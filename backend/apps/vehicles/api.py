"""API REST de vehículos normalizados."""

from django_filters import rest_framework as filters
from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from apps.vehicles.models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

    def get_display_name(self, obj: Vehicle) -> str:
        return str(obj)


class VehicleFilter(filters.FilterSet):
    class Meta:
        model = Vehicle
        fields = {
            "make": ["exact", "icontains"],
            "model": ["exact", "icontains"],
            "fuel_type": ["exact"],
            "transmission": ["exact"],
            "first_registration_year": ["exact", "gte", "lte"],
        }


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_class = VehicleFilter
    search_fields = ["make", "model", "version"]
    ordering_fields = ["make", "model", "first_registration_year", "created_at"]
    ordering = ["make", "model"]

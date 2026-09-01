"""API REST de fuentes y vendedores.

Permisos provisionales (`IsAuthenticatedOrReadOnly`): mientras no exista autenticación
(FASE 2), el catálogo es de lectura pública y la escritura requiere sesión de superusuario
(admin de Django o API navegable de DRF).
"""

from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from apps.sources.models import Seller, Source


class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class SellerSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True)

    class Meta:
        model = Seller
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class SourceViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all()
    serializer_class = SourceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["integration_type", "enabled"]
    search_fields = ["name", "slug"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class SellerViewSet(viewsets.ModelViewSet):
    queryset = Seller.objects.select_related("source")
    serializer_class = SellerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["source", "type"]
    search_fields = ["name", "location"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

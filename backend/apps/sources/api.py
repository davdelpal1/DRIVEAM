"""API REST de fuentes y vendedores.

Permisos (revisados en la FASE 2, ver ADR 0007): lectura pública. `Source` es configuración del
sistema, no contenido de usuario: solo el personal (`is_staff`) la crea o edita. `Seller` lo puede
alimentar cualquier usuario autenticado (llega con la ingesta de anuncios).
"""

from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from apps.core.permissions import IsAdminUserOrReadOnly
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
    permission_classes = [IsAdminUserOrReadOnly]
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

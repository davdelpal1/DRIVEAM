"""Serializador de ofertas de financiación.

En la FASE 1 solo se expone **anidado de solo lectura** dentro de `Listing`. El endpoint
escribible (`/api/v1/finance/…`) y la calculadora de coste real llegan en la FASE 6.
"""

from rest_framework import serializers

from apps.finance.models import FinanceOffer


class FinanceOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceOffer
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")

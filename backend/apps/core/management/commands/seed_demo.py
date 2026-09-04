"""Siembra un usuario de demostración con datos realistas para probar el MVP.

    docker compose exec backend python manage.py seed_demo

Recrea el usuario `demo@driveam.test` (borra el anterior si existe), sus preferencias de
compra y cinco candidatos con Car Score, consumo, estados de seguimiento, notas y —en dos de
ellos— una oferta de financiación. Uno se marca como importado por URL (fuente
`datos-estructurados`). Pensado para desarrollo y para el recorrido de
`frontend/scripts/demo-navegador.mjs`. **No usar en producción.**
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import UserPreference
from apps.favorites.models import Favorite
from apps.finance.models import FinanceOffer
from apps.listings import services
from apps.scoring.services import recalculate_score

EMAIL = "demo@driveam.test"
PASSWORD = "driveam-demo-2026"

PREFERENCES: dict[str, Any] = {
    "budget_target": Decimal("15000"),
    "budget_max": Decimal("18000"),
    "min_year": 2018,
    "max_mileage": 120000,
    "fuel_types": ["gasolina", "hibrido"],
    "body_types": ["compacto", "familiar"],
    "weight_price": 30,
    "weight_mileage": 20,
    "weight_age": 15,
    "weight_consumption": 12,
    "weight_financing": 13,
    "weight_warranty": 10,
    "weight_reliability": 0,
}

CANDIDATES: list[dict[str, Any]] = [
    {
        "make": "Volkswagen",
        "model": "Golf",
        "version": "1.5 TSI Life 130 CV",
        "fuel_type": "gasolina",
        "power_cv": 130,
        "first_registration_year": 2021,
        "fuel_consumption": Decimal("5.4"),
        "mileage_km": 48200,
        "price_cash": Decimal("18990.00"),
        "warranty_months": 12,
        "city": "Sevilla",
        "seller_name": "Automoción Guadalquivir",
        "url": "https://www.example-motor.es/vw-golf-1-5-tsi-life-2021",
        "import_url": "https://www.example-motor.es/vw-golf-1-5-tsi-life-2021",
        "tracking_status": "interesado",
        "notes": "Importado del anuncio. Un solo propietario, libro de revisiones al día. "
        "Preguntar por la garantía extendida y si acepta rebaja a 18.200.",
        "favorite": True,
    },
    {
        "make": "SEAT",
        "model": "León",
        "version": "2.0 TDI 150 CV Style",
        "fuel_type": "diesel",
        "power_cv": 150,
        "first_registration_year": 2019,
        "fuel_consumption": Decimal("4.6"),
        "mileage_km": 92000,
        "price_cash": Decimal("15500.00"),
        "price_financed": Decimal("16900.00"),
        "warranty_months": 24,
        "city": "Sevilla",
        "seller_name": "Particular (Marta)",
        "url": "https://www.example-anuncios.es/seat-leon-2-0-tdi-style",
        "tracking_status": "contactado",
        "notes": "Cadena de distribución cambiada a los 80.000 km (factura). "
        "Revisar estado de inyectores en la ITV.",
        "finance": {
            "deposit": Decimal("3000.00"),
            "amount_financed": Decimal("12500.00"),
            "monthly_payment": Decimal("305.00"),
            "number_of_payments": 48,
            "final_payment": Decimal("0.00"),
            "opening_fee": Decimal("300.00"),
            "tin": Decimal("7.950"),
            "tae": Decimal("9.100"),
        },
    },
    {
        "make": "Toyota",
        "model": "Corolla",
        "version": "1.8 125H Active Tech",
        "fuel_type": "hibrido",
        "power_cv": 122,
        "first_registration_year": 2020,
        "fuel_consumption": Decimal("4.3"),
        "mileage_km": 61000,
        "price_cash": Decimal("17800.00"),
        "warranty_months": 12,
        "city": "Dos Hermanas",
        "seller_name": "Toyota Nimo Ocasión",
        "url": "https://www.example-motor.es/toyota-corolla-125h-active-tech",
        "tracking_status": "nuevo",
        "notes": "Híbrido, ideal ciudad. Batería con garantía del fabricante hasta 2025.",
        "favorite": True,
        "finance": {
            "deposit": Decimal("2000.00"),
            "amount_financed": Decimal("15800.00"),
            "monthly_payment": Decimal("289.00"),
            "number_of_payments": 60,
            "final_payment": Decimal("4500.00"),
            "opening_fee": Decimal("350.00"),
            "tin": Decimal("8.490"),
            "tae": Decimal("9.700"),
        },
    },
    {
        "make": "Kia",
        "model": "Ceed",
        "version": "1.0 T-GDi 120 CV Drive",
        "fuel_type": "gasolina",
        "power_cv": 120,
        "first_registration_year": 2018,
        "fuel_consumption": Decimal("5.8"),
        "mileage_km": 78000,
        "price_cash": Decimal("13900.00"),
        "warranty_months": 6,
        "city": "Mairena del Aljarafe",
        "seller_name": "Particular (Javier)",
        "url": "https://www.example-anuncios.es/kia-ceed-1-0-tgdi-drive",
        "tracking_status": "visita",
        "notes": "Visita el sábado. Llevar OBD y comprobar historial de km. "
        "Motor 1.0: vigilar consumo de aceite.",
    },
    {
        "make": "Renault",
        "model": "Mégane",
        "version": "1.3 TCe 140 CV Zen",
        "fuel_type": "gasolina",
        "power_cv": 140,
        "first_registration_year": 2017,
        "fuel_consumption": Decimal("6.1"),
        "mileage_km": 110000,
        "price_cash": Decimal("11200.00"),
        "warranty_months": 0,
        "city": "Utrera",
        "seller_name": "Particular (Antonio)",
        "url": "https://www.example-anuncios.es/renault-megane-1-3-tce-zen",
        "tracking_status": "descartado",
        "notes": "Descartado: demasiados km para el año y sin garantía.",
        "archived": True,
    },
]


class Command(BaseCommand):
    help = "Crea el usuario de demostración demo@driveam.test con datos de ejemplo."

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        user_model = get_user_model()
        user_model.objects.filter(email=EMAIL).delete()
        user = user_model.objects.create_user(email=EMAIL, password=PASSWORD)

        pref, _ = UserPreference.objects.get_or_create(user=user)
        for field, value in PREFERENCES.items():
            setattr(pref, field, value)
        pref.save()

        for spec in CANDIDATES:
            spec = dict(spec)
            favorite = spec.pop("favorite", False)
            archived = spec.pop("archived", False)
            finance = spec.pop("finance", None)

            listing = services.create_candidate(owner=user, data=spec)
            if favorite:
                Favorite.objects.get_or_create(user=user, listing=listing)
            if archived:
                listing.archived_at = timezone.now()
                listing.save(update_fields=["archived_at"])
            if finance:
                offer, _ = FinanceOffer.objects.update_or_create(listing=listing, defaults=finance)
                recalculate_score(listing=listing, user=user, offer=offer)

            score = listing.scores.filter(user=user).first()
            self.stdout.write(
                f"  · {spec['make']} {spec['model']} — score {score.score if score else '—'}"
            )

        self.stdout.write(self.style.SUCCESS(f"\nUsuario: {EMAIL} / {PASSWORD}"))

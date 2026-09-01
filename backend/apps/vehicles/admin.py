from django.contrib import admin

from apps.vehicles.models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = (
        "make",
        "model",
        "version",
        "fuel_type",
        "transmission",
        "first_registration_year",
    )
    list_filter = ("fuel_type", "transmission", "body_type")
    search_fields = ("make", "model", "version", "generation")
    readonly_fields = ("created_at", "updated_at")

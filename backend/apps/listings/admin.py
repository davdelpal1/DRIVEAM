from django.contrib import admin

from apps.finance.models import FinanceOffer
from apps.listings.models import Listing, ListingSnapshot


class FinanceOfferInline(admin.StackedInline):
    model = FinanceOffer
    extra = 0
    readonly_fields = ("created_at", "updated_at")


class ListingSnapshotInline(admin.TabularInline):
    model = ListingSnapshot
    extra = 0
    fields = ("captured_at", "price_cash", "price_financed", "mileage_km", "status")


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("__str__", "source", "status", "price_cash", "mileage_km", "created_at")
    list_filter = ("status", "source", "province")
    search_fields = ("title", "description", "url", "external_id")
    autocomplete_fields = ("vehicle", "source", "seller")
    readonly_fields = ("created_at", "updated_at")
    inlines = (FinanceOfferInline, ListingSnapshotInline)


@admin.register(ListingSnapshot)
class ListingSnapshotAdmin(admin.ModelAdmin):
    list_display = ("listing", "captured_at", "price_cash", "mileage_km", "status")
    list_filter = ("status",)
    autocomplete_fields = ("listing",)

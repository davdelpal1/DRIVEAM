from django.contrib import admin

from apps.finance.models import FinanceOffer


@admin.register(FinanceOffer)
class FinanceOfferAdmin(admin.ModelAdmin):
    list_display = ("listing", "monthly_payment", "number_of_payments", "tae", "total_cost")
    search_fields = ("listing__title", "source_text")
    autocomplete_fields = ("listing",)
    readonly_fields = ("created_at", "updated_at")

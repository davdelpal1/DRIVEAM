from django.contrib import admin

from apps.sources.models import Seller, Source


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "integration_type", "enabled", "commercial_use_allowed")
    list_filter = ("integration_type", "enabled", "commercial_use_allowed", "images_allowed")
    search_fields = ("name", "slug", "website")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display = ("name", "source", "type", "location")
    list_filter = ("type", "source")
    search_fields = ("name", "external_id", "location", "phone")
    autocomplete_fields = ("source",)
    readonly_fields = ("created_at", "updated_at")

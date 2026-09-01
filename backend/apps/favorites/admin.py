from django.contrib import admin

from apps.favorites.models import Favorite, UserVehicleNote


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "listing", "created_at")
    search_fields = ("user__username", "user__email", "listing__title")
    autocomplete_fields = ("user", "listing")
    readonly_fields = ("created_at",)


@admin.register(UserVehicleNote)
class UserVehicleNoteAdmin(admin.ModelAdmin):
    list_display = ("user", "listing", "updated_at")
    search_fields = ("user__username", "user__email", "listing__title", "text")
    autocomplete_fields = ("user", "listing")
    readonly_fields = ("created_at", "updated_at")

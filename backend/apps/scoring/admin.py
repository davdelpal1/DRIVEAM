from django.contrib import admin

from apps.scoring.models import Score


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ("listing", "user", "score", "version", "calculated_at")
    list_filter = ("version",)
    search_fields = ("listing__title", "user__username")
    autocomplete_fields = ("listing", "user")
    readonly_fields = ("calculated_at",)

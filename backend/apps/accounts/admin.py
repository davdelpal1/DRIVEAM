from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.accounts.models import User, UserPreference


class UserPreferenceInline(admin.StackedInline):
    model = UserPreference
    can_delete = False
    readonly_fields = ("created_at", "updated_at")


@admin.register(User)
class DriveamUserAdmin(UserAdmin):
    inlines = (UserPreferenceInline,)


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "budget_target", "budget_max", "max_mileage", "min_year")
    search_fields = ("user__username", "user__email")
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")

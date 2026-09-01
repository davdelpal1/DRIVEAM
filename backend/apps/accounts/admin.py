from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import User, UserPreference


class UserPreferenceInline(admin.StackedInline):
    model = UserPreference
    can_delete = False
    readonly_fields = ("created_at", "updated_at")


@admin.register(User)
class DriveamUserAdmin(UserAdmin):
    """Admin del `User` con login por email (sin ``username``)."""

    inlines = (UserPreferenceInline,)
    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "is_staff")
    list_filter = ("is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("email", "first_name", "last_name")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Datos personales"), {"fields": ("first_name", "last_name")}),
        (
            _("Permisos"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Fechas"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "budget_target", "budget_max", "max_mileage", "min_year")
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at")

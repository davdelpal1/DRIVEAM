import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import UserPreference

User = get_user_model()


def test_el_usuario_se_identifica_por_email() -> None:
    assert User.USERNAME_FIELD == "email"
    assert "username" not in [field.name for field in User._meta.get_fields()]


@pytest.mark.django_db
def test_create_user_exige_email() -> None:
    with pytest.raises(ValueError):
        User.objects.create_user(email="", password="clave-de-prueba-123")


@pytest.mark.django_db
def test_create_superuser_es_staff_y_superuser() -> None:
    admin = User.objects.create_superuser(
        email="admin@example.test", password="clave-de-prueba-123"
    )
    assert admin.is_staff
    assert admin.is_superuser


@pytest.mark.django_db
def test_preferencia_es_uno_a_uno_con_el_usuario() -> None:
    user = User.objects.create_user(email="ana@example.test", password="secreta-123")
    pref = UserPreference.objects.create(user=user)
    user.refresh_from_db()
    assert user.preference == pref


@pytest.mark.django_db
def test_pesos_por_defecto_y_ausencias_no_son_cero() -> None:
    user = User.objects.create_user(email="ana@example.test", password="secreta-123")
    pref = UserPreference.objects.create(user=user)
    assert pref.weight_price == 25
    assert pref.weight_financing == 10
    assert pref.fuel_types == []
    assert pref.body_types == []
    assert pref.budget_max is None
    assert pref.min_year is None

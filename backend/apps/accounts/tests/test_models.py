import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import UserPreference

User = get_user_model()


@pytest.mark.django_db
def test_preferencia_es_uno_a_uno_con_el_usuario() -> None:
    user = User.objects.create_user("ana", password="secreta-123")
    pref = UserPreference.objects.create(user=user)
    user.refresh_from_db()
    assert user.preference == pref


@pytest.mark.django_db
def test_pesos_por_defecto_y_ausencias_no_son_cero() -> None:
    user = User.objects.create_user("ana", password="secreta-123")
    pref = UserPreference.objects.create(user=user)
    assert pref.weight_price == 25
    assert pref.weight_financing == 10
    assert pref.fuel_types == []
    assert pref.body_types == []
    assert pref.budget_max is None
    assert pref.min_year is None

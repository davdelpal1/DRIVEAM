import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIClient

User = get_user_model()

REGISTER_URL = "/api/v1/auth/register/"
LOGIN_URL = "/api/v1/auth/login/"
LOGOUT_URL = "/api/v1/auth/logout/"
ME_URL = "/api/v1/auth/me/"

STRONG_PASSWORD = "un-coche-de-ocasion-2026"


@pytest.mark.django_db
def test_registro_crea_usuario_e_inicia_sesion(api_client: APIClient) -> None:
    response = api_client.post(
        REGISTER_URL, {"email": "nuevo@example.test", "password": STRONG_PASSWORD}
    )

    assert response.status_code == 201, response.content
    assert response.json()["email"] == "nuevo@example.test"
    assert "password" not in response.json()
    # La respuesta deja sesión iniciada: /auth/me/ ya responde con el usuario.
    assert api_client.get(ME_URL).status_code == 200


@pytest.mark.django_db
def test_registro_rechaza_contrasena_debil(api_client: APIClient) -> None:
    response = api_client.post(REGISTER_URL, {"email": "nuevo@example.test", "password": "1234"})

    assert response.status_code == 400
    assert "password" in response.json()
    assert not User.objects.filter(email="nuevo@example.test").exists()


@pytest.mark.django_db
def test_registro_rechaza_email_duplicado(api_client: APIClient) -> None:
    User.objects.create_user(email="ya@example.test", password=STRONG_PASSWORD)

    response = api_client.post(
        REGISTER_URL, {"email": "ya@example.test", "password": STRONG_PASSWORD}
    )

    assert response.status_code == 400
    assert "email" in response.json()


@override_settings(REGISTRATION_ENABLED=False)
@pytest.mark.django_db
def test_registro_deshabilitado_por_flag(api_client: APIClient) -> None:
    response = api_client.post(
        REGISTER_URL, {"email": "nuevo@example.test", "password": STRONG_PASSWORD}
    )

    assert response.status_code == 403
    assert not User.objects.filter(email="nuevo@example.test").exists()


@pytest.mark.django_db
def test_login_correcto_devuelve_el_usuario(api_client: APIClient) -> None:
    User.objects.create_user(email="ana@example.test", password=STRONG_PASSWORD)

    response = api_client.post(
        LOGIN_URL, {"email": "ana@example.test", "password": STRONG_PASSWORD}
    )

    assert response.status_code == 200, response.content
    assert response.json()["email"] == "ana@example.test"
    assert api_client.get(ME_URL).status_code == 200


@pytest.mark.django_db
def test_login_con_credenciales_malas_da_error_generico(api_client: APIClient) -> None:
    User.objects.create_user(email="ana@example.test", password=STRONG_PASSWORD)

    response = api_client.post(LOGIN_URL, {"email": "ana@example.test", "password": "otra-cosa"})

    assert response.status_code == 400
    # No revela si el email existe: mensaje genérico, sin errores por campo `email`/`password`.
    body = response.json()
    assert "detail" in body
    assert "email" not in body and "password" not in body
    assert api_client.get(ME_URL).status_code == 401


@pytest.mark.django_db
def test_login_esta_limitado_por_intentos(api_client: APIClient) -> None:
    User.objects.create_user(email="ana@example.test", password=STRONG_PASSWORD)
    payload = {"email": "ana@example.test", "password": "mal"}

    statuses = [api_client.post(LOGIN_URL, payload).status_code for _ in range(11)]

    assert statuses.count(429) >= 1
    assert statuses[-1] == 429


@pytest.mark.django_db
def test_logout_cierra_la_sesion(api_client: APIClient) -> None:
    User.objects.create_user(email="ana@example.test", password=STRONG_PASSWORD)
    api_client.post(LOGIN_URL, {"email": "ana@example.test", "password": STRONG_PASSWORD})

    response = api_client.post(LOGOUT_URL)

    assert response.status_code == 204
    assert api_client.get(ME_URL).status_code == 401


@pytest.mark.django_db
def test_me_anonimo_devuelve_401(api_client: APIClient) -> None:
    assert api_client.get(ME_URL).status_code == 401

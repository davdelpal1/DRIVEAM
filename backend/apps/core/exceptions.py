"""Manejador de excepciones de DRF.

Django ya traduce los mensajes de DRF (`LANGUAGE_CODE = "es-es"`), pero la traducción de
`Throttled` ("Solicitud fue regulada (throttled)…") es literal y poco natural. Se reescribe aquí
para los endpoints con `ScopedRateThrottle` (login, registro); el resto de excepciones se dejan
tal cual las produce DRF.
"""

from typing import Any

from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = drf_exception_handler(exc, context)

    if response is not None and isinstance(exc, Throttled):
        wait: float | None = getattr(exc, "wait", None)
        if wait is not None:
            segundos = max(1, round(wait))
            unidad = "segundo" if segundos == 1 else "segundos"
            detalle = f"Demasiados intentos. Vuelve a intentarlo en {segundos} {unidad}."
        else:
            detalle = "Demasiados intentos. Vuelve a intentarlo más tarde."
        response.data = {"detail": detalle}

    return response

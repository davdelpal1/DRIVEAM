"""Router central de la API v1.

Cada app de dominio registra aquí sus viewsets. Los modelos con dueño (favoritos, notas,
preferencias) y las capturas de anuncio se registran en su fase correspondiente
(FASES 2, 3 y 9). Desde la FASE 6 la financiación se gestiona por candidato en
`CandidateViewSet` (`/candidates/{id}/finance/`) y la calculadora sin estado vive en
`config.urls` (`/finance/calculate/`). Desde la FASE 7 el Car Score se persiste en el modelo
`Score` y se expone dentro de `CandidateSerializer` (`score` + `score_breakdown`), sin
endpoint propio.
"""

from rest_framework.routers import DefaultRouter

from apps.listings.api import CandidateViewSet, ListingViewSet
from apps.sources.api import SellerViewSet, SourceViewSet
from apps.vehicles.api import VehicleViewSet

router = DefaultRouter()
router.register("sources", SourceViewSet, basename="source")
router.register("sellers", SellerViewSet, basename="seller")
router.register("vehicles", VehicleViewSet, basename="vehicle")
router.register("listings", ListingViewSet, basename="listing")
router.register("candidates", CandidateViewSet, basename="candidate")

app_name = "api"
urlpatterns = router.urls

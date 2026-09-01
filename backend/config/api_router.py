"""Router central de la API v1.

Cada app de dominio registra aquí sus viewsets. Los modelos con dueño (favoritos, notas,
preferencias, score) y las capturas de anuncio se registrarán en su fase correspondiente
(FASES 2, 3, 7 y 9); `finance` expone su serializador solo anidado en `listings` hasta la FASE 6.
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

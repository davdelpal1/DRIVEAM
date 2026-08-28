"""Router central de la API v1.

Cada app de dominio registrará aquí sus viewsets en fases posteriores, p. ej.::

    from apps.listings.api import ListingViewSet
    router.register("listings", ListingViewSet)
"""

from rest_framework.routers import DefaultRouter

router = DefaultRouter()

app_name = "api"
urlpatterns = router.urls

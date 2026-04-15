"""
    Url_Shortner URL configuration
"""
from django.urls import path

from apps.url_shortner.views import UrlShortnerViewset


urlpatterns = [
    path('<id>/', UrlShortnerViewset.as_view()),
]

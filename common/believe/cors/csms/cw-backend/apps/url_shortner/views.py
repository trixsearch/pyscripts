from rest_framework.permissions import AllowAny
from rest_framework.generics import RetrieveAPIView
from django.utils.translation import gettext as _
from django.shortcuts import redirect
from django.http import HttpResponse
from django.utils import timezone

from apps.url_shortner.serializers import UrlShortnerSerializer
from apps.url_shortner.models import UrlShortner
from utils.loggerwrapper import Logger, getMessage
from .internal_errors import url_shortner_errors

logger = Logger(__name__)
class UrlShortnerViewset(RetrieveAPIView):
    """ Url shortner Viewset """
    # FOR SHORT URL, 'linkexpiry' should be given in minutes

    serializer_class = UrlShortnerSerializer
    queryset = UrlShortner.objects.all()
    permission_classes = (AllowAny,)
    model= UrlShortner


    def get(self, request, id, *args, **kwargs):
        try:
            obj = self.model.objects.get(short_url=id)
        except Exception as error:
            internal_error = 25001
            logger.exception(getMessage(url_shortner_errors, internal_error).format(error), internal_error)
            return redirect('/candidate/404')
        if obj.expiration is not None and obj.expiration < timezone.now():
            logger.warning("Link Expired!")
            return HttpResponse('<html><body>This link is expired.</body></html>')
        logger.info("redirected successfully.")
        return redirect(obj.long_url)

from rest_framework import serializers
from apps.url_shortner import models


class UrlShortnerSerializer(serializers.ModelSerializer):
    """ serializer for url shortner """

    class Meta:
        model = models.UrlShortner
        fields = ('id','short_url','long_url','expiration')
        extra_kwargs = {
            'short_url': { 'read_only': True },
            'expiration' : { 'read_only': True }
        }

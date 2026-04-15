# Third-Party imports
from rest_framework import serializers

# Application imports
from .models import License

class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = License
        fields = ('name', 'transactions')

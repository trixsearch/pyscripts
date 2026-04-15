from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (ExternalUserLogin, ExternalUserOTP, ExternalUserViewSet,
                    OrganisationUserViewSet ,GetCredentialsView, SendOtpViewSet, OpenExternalUserOTP, ExternalUserOpenLogin,
                    PlatformPolicyViewset
                )

app_name = 'users'

router = DefaultRouter(trailing_slash=False)

router.register('org_users/platform_policies', PlatformPolicyViewset, basename='platform_policies')
router.register('org_users', OrganisationUserViewSet, basename='org_users')
router.register('external_users', ExternalUserViewSet, basename='external_users')
router.register('open_external_users', OpenExternalUserOTP, basename='open_external_users')


urlpatterns = [
    path('external_users/otp', ExternalUserOTP.as_view(), name='external_users_otp'),
    path('external_users/login', ExternalUserLogin.as_view(), name='external_users_login'),
    path('external_users/open/login', ExternalUserOpenLogin.as_view(), name='external_users_open_login'),
    path('otp', SendOtpViewSet.as_view(),name='otp'),
    path('org_users/get_credentials', GetCredentialsView.as_view(),name='get_credentials'),

    *router.urls
]

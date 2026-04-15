"""ezedox URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework_jwt.views import (refresh_jwt_token,
                                      verify_jwt_token)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from ezedox.settings import SWAGGER_VIEW
from ezedox.settings import STATIC_ROOT, STATIC_URL
from django.conf.urls.static import static
from ezedox.health import health_check

admin.autodiscover()
admin.site.enable_nav_sidebar = False


urlpatterns = [
    path('cw/admin/', admin.site.urls),
    path('cw/api-token-verify', verify_jwt_token),
    path('cw/api-token-refresh', refresh_jwt_token),
    path('cw/organisations/', include('apps.organisations.urls')),
    path('cw/<slug:tenant>/users/', include('apps.org_users.urls')),
    path('cw/<slug:tenant>/apps/', include('apps.org_apps.urls')),
    path('cw/<slug:tenant>/locations/', include('apps.org_location.urls')),
    path('cw/<slug:tenant>/groups/', include('apps.org_group.urls')),
    path('cw/<slug:tenant>/forms/', include('apps.org_form.urls')),
    path('cw/<slug:tenant>/config/', include('apps.org_config.urls')),
    path('cw/<slug:tenant>/lists/', include('apps.org_lists.urls')),
    path('cw/<slug:tenant>/sequence/', include('apps.org_sequences.urls')),
    path('cw/<slug:tenant>/proxy-bpm/', include('apps.proxy_bpm.urls')),
    path('cw/<slug:tenant>/proxy-apps/', include('apps.org_third_party.urls')),
    path('cw/<slug:tenant>/internal/', include('apps.org_internal.urls')),
    path('cw/<slug:tenant>/portal/', include('apps.org_portals.urls'), name='portals'),
    path('cw/<slug:tenant>/imports/', include('apps.org_import.urls')),
    path('cw/<slug:tenant>/entity/', include('apps.org_entity.urls')),
    path('cw/<slug:tenant>/bff/', include('apps.org_bff.urls')),
    path('cw/proxy/bff/', include('apps.org_bff.urls', namespace="bff_vision_path")),
    path('cw/url/', include('apps.url_shortner.urls')),
    path('cw/admin/drishti/', include(('apps.drishti.urls',"drishti"), namespace="drishti")),
    path('cw/health/', health_check, name='health_check'),

]+ static(STATIC_URL, document_root=STATIC_ROOT)



#swagger docs of django is dependent on env
if SWAGGER_VIEW:
    to_exclude = ['records']
    swagger_urls = [item for item in urlpatterns if hasattr(item,"namespace") and item.namespace not in to_exclude]
    schema_view = get_schema_view(
    openapi.Info(
        title="Snippets API",
        default_version='v1',
        description="Test description",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@snippets.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    patterns=swagger_urls,
    )
    urlpatterns += [
            path('cw/swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
            path('cw/swagger.yaml', schema_view.without_ui(cache_timeout=0), name='schema-yaml'),
            path('cw/swagger-docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
            path('cw/swagger-redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    ]
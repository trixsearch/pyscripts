from django.conf import settings
from django.template import Library
from django.template.defaulttags import URLNode
from django.template.defaulttags import url as default_url

register = Library()


class SchemaURLNode(URLNode):
    def __init__(self, url_node):
        super().__init__(url_node.view_name, url_node.args, url_node.kwargs, url_node.asvar)

    def render(self, context):
        url = super().render(context)
        return url


@register.tag
def url(parser, token):
    return SchemaURLNode(default_url(parser, token))


@register.simple_tag
def public_schema():
    return 'public'


@register.simple_tag()
def is_tenant_app(app):
    return app['app_label'] in [tenant_app.split('.')[-1] for tenant_app in settings.TENANT_APPS]


@register.simple_tag()
def is_shared_app(app):
    return app['app_label'] in [tenant_app.split('.')[-1] for tenant_app in settings.SHARED_APPS]


@register.simple_tag(takes_context=True)
def is_public_schema(context, app):
    return context.request.tenant.schema_name == 'public'

# set TENANT_COLOR_ADMIN_APPS to false in settings to disable color in admin
@register.simple_tag()
def colour_admin_apps():
    if hasattr(settings, 'TENANT_COLOR_ADMIN_APPS'):
        return settings.TENANT_COLOR_ADMIN_APPS
    return True

from channels.routing import ProtocolTypeRouter, URLRouter
from django.conf.urls import url

from apps.notifications.consumers import NotificationAndUpdatesConsumer
from apps.notifications.auth import TokenJwtTokenAuthMiddleware
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter([
            # url(r'^ws/$', consumers.NotificationConsumer),
            url(r'^ws/$', NotificationAndUpdatesConsumer.as_asgi()),
        ])
    ),
})

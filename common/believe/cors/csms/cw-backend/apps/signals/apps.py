from django.apps import AppConfig


class SignalsConfig(AppConfig):
    name = 'apps.signals'
    verbose_name = "Signals"

    def ready(self):
        import apps.signals.receivers #pylint: disable=unused-import, import-outside-toplevel

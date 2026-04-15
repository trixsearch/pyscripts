from django.dispatch import Signal

invitation_email = Signal(providing_args=["user"])
reset_password_email = Signal(providing_args=["request", "user"])

organisations_groups_permissions_setup = Signal(providing_args=['tenant'])

add_user_as_admin = Signal(providing_args=["request", "user"])

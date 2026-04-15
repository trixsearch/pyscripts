from django.contrib.auth.models import (AbstractBaseUser, BaseUserManager,
                                        PermissionsMixin)
from django.db import models
from apps.app_registry.models import MyBaseModel
from apps.organisations.models import Organisation

class UserManager(BaseUserManager):
    """
    Custom model manager

    Arguments:
        BaseUserManager -- To define a custom manager that extends BaseUserManager
                                providing two additional methods

    Raises:
        TypeError -- It raises if the password is not provided while creating the users.

    Returns:
        user_object -- This will override the default model manager and returns user object.
    """

    def create_user(self, email, password=None):
        if email is None:
            raise TypeError('Users must have an email address.')

        user = self.model(email=email, password=password)
        user.set_password(password)
        # user.is_active = True     Defualt value is True
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        if password is None:
            raise TypeError('Superusers must have a password.')
        user = self.create_user(email=email, password=password)
        # user.is_active = True     Defualt value is True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, MyBaseModel):
    """
    Class to create Custom Auth User Model

    Arguments:
        AbstractBaseUser -- Here we are subclassing the Django AbstractBaseUser,
                                which comes with only three fields:
                                1 - password
                                2 - last_login
                                3 - is_active
                            It provides the core implementation of a user model,
                                including hashed passwords and tokenized password resets.

        PermissionsMixin -- The PermissionsMixin is a model that helps you implement
                                permission settings as-is or
                                modified to your requirements.

    """
    email = models.EmailField()
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    tenant = models.ForeignKey(Organisation, null=True, blank=True, on_delete=models.CASCADE)
    userId = models.CharField(max_length=100, null=False, blank=False, unique=True)

    REQUIRED_FIELDS = []
    USERNAME_FIELD = 'userId'

    objects = UserManager()

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        unique_together = (('userId', 'tenant'),)
    
    def has_perms(self, perm, obj=None):
        return self.is_superuser
    
    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        super(User, self).save(*args, **kwargs)

    def __str__(self):
        return self.email

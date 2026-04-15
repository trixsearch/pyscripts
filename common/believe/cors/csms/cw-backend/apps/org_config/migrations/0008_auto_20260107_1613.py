from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('org_config', '0007_auto_20251208_1525'),
    ]

    operations = [
        migrations.AddField(
            model_name='processinstancecleanupconfig',
            name='batch_limit',
            field=models.IntegerField(default=150000),
        ),
    ]

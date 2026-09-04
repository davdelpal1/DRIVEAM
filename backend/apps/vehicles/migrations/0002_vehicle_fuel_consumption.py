import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vehicles", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="vehicle",
            name="fuel_consumption",
            field=models.DecimalField(
                blank=True,
                decimal_places=1,
                help_text="Consumo medio combinado; llega con la importación por URL (FASE 8).",
                max_digits=4,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                verbose_name="consumo medio (L/100 km)",
            ),
        ),
    ]

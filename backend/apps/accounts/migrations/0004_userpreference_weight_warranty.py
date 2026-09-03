from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_email_login'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreference',
            name='weight_warranty',
            field=models.PositiveSmallIntegerField(default=5, verbose_name='peso · garantía'),
        ),
    ]

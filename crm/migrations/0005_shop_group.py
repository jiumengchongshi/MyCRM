# Generated by Django 3.1.4 on 2021-06-11 13:42

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0004_auto_20210603_1049'),
    ]

    operations = [
        migrations.AddField(
            model_name='shop',
            name='group',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.DO_NOTHING, to='crm.group'),
        ),
    ]

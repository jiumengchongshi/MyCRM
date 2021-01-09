from django.contrib import admin
from crm.models import Group, Role, User, Announcement, Order, Comment, Handover
# Register your models here.


@admin.register(Group, Role, User, Announcement, Order, Comment, Handover)
class MyCRMAdmin(admin.ModelAdmin):
    pass

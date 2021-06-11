from django.contrib import admin
from crm.models import Group, Role, User, Announcement, Order, Comment, Handover, PausedDistrict, Shop
import hashlib
# Register your models here.


def hash_pwd(s, salt='hb1n5i8u'):
    h = hashlib.sha256()
    s += salt
    h.update(s.encode())
    return h.hexdigest()


@admin.register(Group, Role, Announcement, Order, Comment, Handover, PausedDistrict, Shop)
class MyCRMAdmin(admin.ModelAdmin):
    pass


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    def save_model(self, request, obj, form, change):
        obj.password = hash_pwd(obj.password)
        super().save_model(request, obj, form, change)

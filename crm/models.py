from django.db import models


# Create your models here.
class Group(models.Model):
    group_name = models.CharField(max_length=30, unique=True)
    address = models.CharField(max_length=200, default='保定')

    def __str__(self):
        return self.group_name


class Role(models.Model):

    class RolePermission(models.TextChoices):
        CUSTOMER = 'C', '客户'
        C_MANAGER = 'CM', '客户经理'
        SERVICE = 'S', '客服'
        S_MANAGER = 'SM', '客服经理'

    name = models.CharField(max_length=2, choices=RolePermission.choices, primary_key=True)

    def __str__(self):
        return self.name


class User(models.Model):
    name = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=256)
    phone = models.CharField(max_length=11)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True)
    status = models.CharField(max_length=50, default="启用")
    role = models.ForeignKey(Role, on_delete=models.DO_NOTHING)
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Shop(models.Model):
    shop_name = models.CharField(max_length=30, unique=True)
    shopkeeper = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    group = models.ForeignKey(Group, on_delete=models.DO_NOTHING, default=1)

    def __str__(self):
        return self.shop_name


class Announcement(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    title = models.CharField(max_length=100, default="通知")
    notice = models.TextField()
    pub_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        get_latest_by = 'pub_date'


class Order(models.Model):

    class QuestionTypes(models.TextChoices):
        INTERCEPT = 'LJ', '拦截'
        CHANGE_ADDRESS = 'GDZ', '改地址'
        HASTEN = 'CP', '催派'
        LOST = 'YS', '签收未收到'
        CONSULT = 'CX', '查询'
        CANCEL_THE_INTERCEPT = 'CTI', '取消改地址'

    class Status(models.IntegerChoices):
        WAITING = 1, '待处理'
        PROCESSING = 2, '处理中'
        FINISH = 3, '待审核'
        CLOSE = 4, '已关闭'

    class Emergency(models.IntegerChoices):
        URGENT = 1, '加急'
        WAIT_FOR_REPLY = 2, '待回复'
        REPLIED = 3, '已回复'

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer')
    service = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='service')
    zto_number = models.CharField(max_length=30, unique=True, db_index=True)
    question_types = models.CharField(max_length=3, choices=QuestionTypes.choices)
    question_text = models.TextField(max_length=300)
    create_time = models.DateTimeField(auto_now_add=True)
    order_status = models.IntegerField(choices=Status.choices, default=Status.WAITING)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    order_emergency = models.IntegerField(choices=Emergency.choices, default=Emergency.WAIT_FOR_REPLY)
    reply_time = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.zto_number


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    comment_text = models.TextField(max_length=300)
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order.zto_number


class Handover(models.Model):
    title = models.CharField(max_length=100)
    handover_text = models.TextField()
    recipient = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='recipient')
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='the_handover')
    pub_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        get_latest_by = 'pub_date'


class PausedDistrict(models.Model):
    province = models.CharField(max_length=30)
    area = models.TextField(blank=True, null=True)
    date_updated = models.DateTimeField(auto_now=True)
    redactor = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.province


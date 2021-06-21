from django.shortcuts import render, redirect
from django.http.response import JsonResponse
from django.views.generic import View
from django.utils.decorators import method_decorator
import logging
from django.db.models import Q
from . import models
import hashlib

# Create your views here.

visit_logger = logging.getLogger("visit")
server_logger = logging.getLogger("server")


def hash_pwd(s, salt='hb1n5i8u'):
    h = hashlib.sha256()
    s += salt
    h.update(s.encode())
    return h.hexdigest()


def allocation(request, password=hash_pwd('123456')):
    if password == hash_pwd('123456'):
        username = request.session.get('user_name')
        group_name = request.session.get('group_name')
        return render(request, 'crm/change_pwd.html', locals())
    else:
        role = request.session.get('user_role')
        if role == 'C':
            return redirect('/crm/customer/')
        elif role == 'CM':
            return redirect('/crm/customermanager/')
        elif role == 'S':
            return redirect('/crm/service/')
        elif role == 'SM':
            return redirect('/crm/servicemanager/')
        else:
            return freeze(request)


def my_not_login(function):
    def new_function(request, *args, **kwargs):
        if not request.session.get('is_login', None):
            return redirect('/crm/')
        return function(request, *args, **kwargs)

    return new_function


def comment_list(order):
    the_comments = models.Comment.objects.filter(order__zto_number=order)
    comments_list = []
    if len(the_comments) != 0:
        for i in the_comments:
            temp = {
                'speaker': i.user.name,
                'role': i.user.role.name,
                'comment': i.comment_text,
                'create_time': i.create_time.strftime('%Y-%m-%d %H:%M:%S')
            }
            comments_list.append(temp)
    return comments_list


def order_modal(order):
    if order.service:
        service_name = order.service.name
    else:
        service_name = '-'
    order_content = {
        'zto_number': order.zto_number,
        'question_types': order.get_question_types_display(),
        'question_text': order.question_text,
        'create_time': order.create_time.strftime('%Y-%m-%d %H:%M:%S'),
        'customer': order.customer.name,
        'service': service_name,
        'order_status': order.order_status,
    }

    comments_list = comment_list(order)
    context = {
        'message': 'success',
        'order': order_content,
        'comments': comments_list
    }
    return context


@my_not_login
def customer(request):
    username = request.session.get('user_name')
    group_name = request.session.get('group_name')
    try:
        notice = models.Announcement.objects.filter(group__group_name=group_name).latest()
    except models.Announcement.DoesNotExist:
        notice = {}
    return render(request, 'crm/customer.html', locals())


@my_not_login
def service(request):
    username = request.session.get('user_name')
    group_name = request.session.get('group_name')
    try:
        notice = models.Handover.objects.latest()
    except models.Handover.DoesNotExist:
        notice = {}
    return render(request, 'crm/service.html', locals())


@my_not_login
def customer_manager(request):
    username = request.session.get('user_name')
    group_name = request.session.get('group_name')
    try:
        notice = models.Announcement.objects.filter(group__group_name=group_name).latest()
    except models.Announcement.DoesNotExist:
        notice = {}
    return render(request, 'crm/customermanager.html', locals())


@my_not_login
def service_manager(request):
    username = request.session.get('user_name')
    group_name = request.session.get('group_name')
    try:
        notice = models.Handover.objects.latest()
    except models.Handover.DoesNotExist:
        notice = {}
    return render(request, 'crm/servicemanager.html', locals())


def login(request):
    if request.session.get('is_login', None):  # Prohibit repeat login.
        return allocation(request)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        message = '用户名或密码错误！'
        if username.strip() and password:
            try:
                user = models.User.objects.get(name=username)
            except models.User.DoesNotExist:
                return render(request, 'crm/login.html', {'message': message})
            if user.status != '启用':
                return freeze(request)
            else:
                if user.password == hash_pwd(password):
                    request.session['is_login'] = True
                    request.session['user_name'] = user.name
                    request.session['user_role'] = user.role.name
                    request.session['group_name'] = user.group.group_name
                    request.session['user_id'] = user.id
                    request.session['group_id'] = user.group_id
                    request.session['phone'] = user.phone
                    request.session['address'] = user.group.address
                    return allocation(request, user.password)
                else:
                    return render(request, 'crm/login.html', {'message': message})
    return render(request, 'crm/login.html')


@my_not_login
def logout(request):
    request.session.flush()
    return redirect('/crm/')


def freeze(request):
    request.session.flush()
    message = '该用户已被冻结，请联系管理员！'
    return render(request, 'crm/login.html', {'message': message})


@my_not_login
def announcements(request):
    if request.method == 'GET':
        group_id = request.session.get('group_id')
        notices = models.Announcement.objects.filter(group_id=group_id).order_by('-pub_date')
        notice_list = []
        for i in notices:
            temp = {
                'id': i.id,
                'group': i.group.group_name,
                'user': i.user.name,
                'title': i.title,
                'notice': i.notice,
                'pub_date': i.pub_date.strftime('%Y-%m-%d %H:%M:%S')
            }
            notice_list.append(temp)
        return JsonResponse(notice_list, safe=False)
    elif request.method == 'POST':
        role = request.session.get('user_role')
        if role == 'CM':
            user_id = request.session.get('user_id')
            group_id = request.session.get('group_id')
            announcement_id = request.POST.get('announcement_id')
            title = request.POST.get('title').replace('<', '')
            notice = request.POST.get('notice').replace('<', '')
            if announcement_id:
                models.Announcement.objects.update_or_create(
                    id=announcement_id,
                    defaults={
                        'user_id': user_id,
                        'group_id': group_id,
                        'title': title,
                        'notice': notice
                    }
                )
            else:
                models.Announcement.objects.create(
                    user_id=user_id,
                    group_id=group_id,
                    title=title,
                    notice=notice
                )
            return JsonResponse({'message': 'success'}, safe=False)
        else:
            return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)


@my_not_login
def handover(request):
    if request.method == 'GET':
        notices = models.Handover.objects.all().order_by('-pub_date')
        notice_list = []
        for i in notices:
            notice = {
                'title': i.title,
                'handover_text': i.handover_text,
                'recipient': i.recipient.name,
                'user': i.user.name,
                'pub_date': i.pub_date
            }
            notice_list.append(notice)
        return JsonResponse(notice_list, safe=False)
    elif request.method == 'POST':
        user_id = request.session.get('user_id')
        title = request.POST.get('handoverTitle')
        handover_text = request.POST.get('handoverText')
        recipient = request.POST.get('recipient')
        models.Handover.objects.create(
            title=title,
            handover_text=handover_text,
            recipient_id=recipient,
            user_id=user_id,
        )
        models.Order.objects.filter(service=user_id, order_status=2).update(service=recipient)
        return JsonResponse({'message': 'success'}, safe=False)


@my_not_login
def group(request):
    if request.method == 'GET':
        role = request.session.get('user_role')
        if role == 'SM':
            groups = models.Group.objects.all()
            group_list = []
            for g in groups:
                temp = {
                    'id': g.id,
                    'group_name': g.group_name,
                    'address': g.address,
                    'members_total': g.user_set.count()
                }
                group_list.append(temp)
            return JsonResponse(group_list, safe=False)
        else:
            return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)

    elif request.method == 'POST':
        role = request.session.get('user_role')
        if role == 'SM':
            action = request.POST.get('action')
            if action == 'create':
                name = request.POST.get('group_name')
                address = request.POST.get('address')
                obj, created = models.Group.objects.get_or_create(
                    group_name=name,
                    defaults={
                        'group_name': name,
                        'address': address
                    }
                )
                if created:
                    return JsonResponse({'message': 'success'}, safe=False)
                else:
                    return JsonResponse({'message': '群组名称已存在，不能重复创建。'}, safe=False)
        else:
            return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)
    else:
        return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)


@method_decorator(my_not_login, name='dispatch')
class Shops(View):

    def get(self, request):
        role = request.session.get('user_role')
        group_id = request.session.get('group_id')
        if role == 'CM':
            shops = models.Shop.objects.filter(group_id=group_id)
            shop_list = []
            for i in shops:
                temp = {
                    'id': i.id,
                    'shop_name': i.shop_name,
                    'shopkeeper': i.shopkeeper.name if i.shopkeeper else '-'
                }
                shop_list.append(temp)
            return JsonResponse(shop_list, safe=False)
        else:
            return JsonResponse({'message': '权限异常！'}, safe=False)

    def post(self, request):
        role = request.session.get('user_role')
        group_id = request.session.get('group_id')
        if role == 'CM':
            new_shop_name = request.POST.get('shop_name')
            new_shopkeeper_name = request.POST.get('shopkeeper')
            try:
                new_shopkeeper = models.User.objects.get(name=new_shopkeeper_name)
            except models.User.DoesNotExist:
                return JsonResponse({'message': '客户不存在，请检查客户姓名或先创建客户。'}, safe=False)
            models.Shop.objects.update_or_create(
                shop_name=new_shop_name,
                defaults={
                    'shop_name': new_shop_name,
                    'shopkeeper': new_shopkeeper,
                    'group_id': group_id
                }
            )
            return JsonResponse({'message': 'success'}, safe=False)


@method_decorator(my_not_login, name='dispatch')
class Users(View):

    def get(self, request, role='all'):
        username = request.session.get('user_name')
        user_role = request.session.get('user_role')
        group_name = request.session.get('group_name')
        context = {}
        if role == 'S':
            if user_role == 'S':
                users = models.User.objects.filter(role='S', status='启用').exclude(name=username).values_list(
                    'id',
                    'name',
                    'phone',
                    'group__group_name',
                    'role')
                context['message'] = 'success'
                context['user_list'] = [i for i in users]
            elif user_role == 'SM':
                users = models.User.objects.filter(role_id='S')
                user_list = []
                for i in users:
                    temp = {
                        'id': i.id,
                        'name': i.name,
                        'phone': i.phone,
                        'status': i.status
                    }
                    user_list.append(temp)
                return JsonResponse(user_list, safe=False)
            else:
                context['message'] = 'access denied!'
        elif role == 'C':
            if user_role == 'CM':
                users = models.User.objects.filter(Q(group__group_name=group_name) & Q(role__name='C'))
                user_list = []
                for i in users:
                    temp = {
                        'id': i.id,
                        'name': i.name,
                        'phone': i.phone,
                        'shop': [n for n in i.shop_set.all().values_list('shop_name')],
                        'status': i.status,
                        'group': i.group.group_name
                    }
                    user_list.append(temp)
                context = user_list
            else:
                context['message'] = 'access denied!'
        else:
            context['message'] = 'access denied!'
        return JsonResponse(context, safe=False)

    def post(self, request):
        username = request.session.get('user_name')
        user_id = request.session.get('user_id')
        role = request.session.get('user_role')
        group_id = request.session.get('group_id')
        action = request.POST.get('action')
        if action == 'create':
            if role in ['CM', 'SM']:
                new_username = request.POST.get('new_username')
                check_user = models.User.objects.filter(name=new_username).exists()
                if check_user:
                    message = '用户名已存在！'
                else:
                    new_phone = request.POST.get('new_phone')
                    new_role = role[0]
                    new_user = models.User.objects.create(
                        name=new_username,
                        phone=new_phone,
                        role_id=new_role,
                        password=hash_pwd('123456'),
                        group_id=group_id
                    )
                    message = 'success'
                    visit_logger.info("{user} create the new user named {new_username}".format(
                        user=username,
                        new_username=new_user)
                    )
            else:
                message = '权限异常！'
            return JsonResponse({'message': message}, safe=False)

        elif action == 'update':
            new_username = request.POST.get('new_username')
            if username == new_username or role in ['CM', 'SM']:
                try:
                    check_user = models.User.objects.get(name=new_username)
                except models.User.DoesNotExist:
                    return JsonResponse({'message': '用户不存在'}, safe=False)
                new_phone = request.POST.get('new_phone')
                check_user.phone = new_phone
                check_user.save()
                message = 'success'
            else:
                message = '权限异常！'
            return JsonResponse({'message': message}, safe=False)

        elif action == 'freeze':
            freeze_user_id = request.POST.get('freeze_user_id')
            freeze_action = request.POST.get('freeze_action')
            if role in ['CM', 'SM']:
                try:
                    check_user = models.User.objects.get(id=freeze_user_id)
                except models.User.DoesNotExist:
                    return JsonResponse({'message': '用户不存在！'}, safe=False)
                if check_user.role in ['CM', 'SM']:
                    return JsonResponse({'message': '权限异常！'}, safe=False)
                else:
                    if freeze_action == 'freeze':
                        check_user.status = '冻结'
                        check_user.save()
                    elif freeze_action == 'unfreeze':
                        check_user.status = '启用'
                        check_user.save()
                    return JsonResponse({'message': 'success'}, safe=False)
            else:
                return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)

        elif action == 'change_pwd':
            user = models.User.objects.get(pk=user_id)
            original_pwd = request.POST.get('original_pwd')
            new_pwd = request.POST.get('new_pwd')
            if user.password == hash_pwd(original_pwd):
                user.password = hash_pwd(new_pwd)
                user.save()
                request.session.flush()
                return JsonResponse({'message': 'success'}, safe=False)
            else:
                return JsonResponse({'message': '原密码错误！'}, safe=False)


@method_decorator(my_not_login, name='dispatch')
class Orders(View):

    def get(self, request, z_number=0):
        username = request.session.get('user_name')
        role = request.session.get('user_role')
        if z_number == 0:  # Respond the order list based on the user role.
            group_name = request.session.get('group_name')
            order_status = request.GET.get('order_status')
            if role == "C":
                if order_status == 'processing':
                    orders = models.Order.objects.filter(Q(customer__name=username) & Q(order_status__in=[1, 2]))
                elif order_status == 'finished':
                    orders = models.Order.objects.filter(Q(customer__name=username) & Q(order_status__in=[3, 4]))
                else:
                    orders = models.Order.objects.filter(customer__name=username)
            elif role == "CM":
                if order_status == 'processing':
                    orders = models.Order.objects.filter(Q(group__group_name=group_name) & Q(order_status__in=[1, 2]))
                elif order_status == 'finished':
                    orders = models.Order.objects.filter(Q(group__group_name=group_name) & Q(order_status__in=[3, 4]))
                else:
                    orders = models.Order.objects.filter(group__group_name=group_name)
            elif role == "S":
                if order_status == 'processing':
                    orders = models.Order.objects.filter(Q(service__name=username) & Q(order_status=2))
                elif order_status == 'finished':
                    orders = models.Order.objects.filter(Q(service__name=username) & Q(order_status__in=[3, 4]))
                else:
                    orders = models.Order.objects.filter(service__name=username)
            elif role == "SM":
                if order_status == 'processing':
                    orders = models.Order.objects.filter(order_status__in=[1, 2])
                elif order_status == 'finished':
                    orders = models.Order.objects.filter(order_status__in=[3, 4])
                else:
                    orders = models.Order.objects.all()
            else:
                message = '权限异常！'
                return JsonResponse({'message': message}, safe=False)
            order_list = []
            for i in orders:
                if i.service:
                    service_name = i.service.name
                else:
                    service_name = '<span class="badge badge-success">waiting</span>'
                temp = {
                    'id': i.id,
                    'customer': i.customer.name,
                    'service': service_name,
                    'zto_number': i.zto_number,
                    'question_types': i.get_question_types_display(),
                    'question_text': i.question_text,
                    'update_time': i.reply_time.strftime('%Y-%m-%d %H:%M:%S'),
                    'order_emergency_text': i.get_order_emergency_display(),
                    'order_emergency': i.order_emergency,
                    'order_status': i.get_order_status_display(),
                    'group': i.group.group_name,
                }
                order_list.append(temp)
            return JsonResponse(order_list, safe=False)
        else:  # respond the order and comments.
            try:
                the_order = models.Order.objects.get(zto_number=z_number)
            except models.Order.DoesNotExist:
                return JsonResponse({'message': '您查询的单号还没有在本系统提交过问题件！'}, safe=False)
            if username == the_order.customer.name or role != 'C':
                return JsonResponse(order_modal(the_order), safe=False)
            else:
                return JsonResponse({'message': '权限异常，您没有权限查看此单号的详情！'}, safe=False)

    def post(self, request):
        role = request.session.get('user_role')
        action = request.POST.get('action')

        if action == 'create':  # for customer create order
            if role in ["C", 'CM']:
                zto_number = request.POST.get('zto_number')
                same_order = models.Order.objects.filter(zto_number=zto_number).exists()
                if same_order:
                    context = {
                        'message': '问题已存在：',
                        'zto_number': zto_number,
                    }
                else:
                    question_types = request.POST.get('question_types')
                    question_text = request.POST.get('question_text').replace('<', '')
                    user_id = request.session.get('user_id')
                    group_id = request.session.get('group_id')
                    models.Order.objects.create(
                        customer_id=user_id,
                        zto_number=zto_number,
                        question_types=question_types,
                        question_text=question_text,
                        group_id=group_id
                    )
                    context = {
                        'message': '创建成功！',
                    }
            else:
                context = {
                    'message': '权限异常！'
                }
            return JsonResponse(context, safe=False)

        elif action == 'take':  # for service role get order
            if role == 'S':
                username = request.session.get('user_name')
                user = models.User.objects.get(name=username)
                orders = models.Order.objects.filter(order_status=1)
                if orders.exists():
                    one_order = orders.earliest('create_time')
                    one_order.service = user
                    one_order.order_status = 2
                    one_order.save()
                    waiting_orders_quantity = orders.count() - 1
                    context = order_modal(one_order)
                    context['quantity'] = waiting_orders_quantity
                else:
                    context = {
                        'message': 'null',
                    }
            else:
                context = {
                    'message': 'access denied!'
                }
            return JsonResponse(context, safe=False)

        elif action == 'finish':  # for service finish the order.
            username = request.session.get('user_name')
            if role in ['S', 'SM', 'CM']:
                zto_number = request.POST.get('z_number')
                try:
                    order = models.Order.objects.get(zto_number=zto_number)
                except models.Order.DoesNotExist:
                    return JsonResponse({'message': 'Order does not exist.'}, safe=False)
                order.order_status = 3
                order.save()
                visit_logger.info("{user} finished the order {order}".format(user=username, order=order))
                return JsonResponse({'message': 'success'}, safe=False)
        elif action == 'close':
            username = request.session.get('user_name')
            group_id = request.session.get('group_id')
            zto_number = request.POST.get('z_number')
            try:
                order = models.Order.objects.get(zto_number=zto_number)
            except models.Order.DoesNotExist:
                return JsonResponse({'message': 'Order does not exist.'}, safe=False)
            if (role == 'CM' and group_id == order.group_id) or username == order.customer.name:
                order.order_status = 4
                order.save()
                visit_logger.info("{user} closed the order {order}".format(user=username, order=order))
                return JsonResponse({'message': 'success'}, safe=False)
            else:
                return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)
        elif action == 'intercept':
            if role == 'C' or role == 'CM':
                user_id = request.session.get('user_id')
                username = request.session.get('user_name')
                phone = request.session.get('phone')
                address = request.session.get('address')
                order_list = request.POST.get('orderList').split(',')
                group_id = request.session.get('group_id')
                question_text = '新地址为：%s LJ,%s,%s' % (username, phone, address)
                repeat_list = []
                success_total = 0
                for i in order_list:
                    if i != '':
                        if models.Order.objects.filter(zto_number=i).exists():
                            repeat_list.append(i)
                        else:
                            new_order = models.Order.objects.create(
                                customer_id=user_id,
                                zto_number=i,
                                question_types='GDZ',
                                question_text=question_text,
                                group_id=group_id
                            )
                            new_order.save()
                            success_total += 1
                context = {
                    'message': 'success',
                    'repeat_list': repeat_list,
                    'success_total': success_total
                }
            else:
                context = {
                    'message': '权限异常！',
                }
            return JsonResponse(context, safe=False)
        elif action == 'restart':
            user_id = request.session.get('user_id')
            group_id = request.session.get('group_id')
            zto_number = request.POST.get('z_number')
            try:
                order = models.Order.objects.get(zto_number=zto_number)
            except models.Order.DoesNotExist:
                return JsonResponse({'message': 'Order does not exist.'}, safe=False)
            if role == 'CM' and group_id == order.group_id or user_id == order.customer_id:
                order.order_status = 1
                order.save()
                visit_logger.info("user id {user} restart the order {order}".format(user=user_id, order=order))
                return JsonResponse({'message': 'success'}, safe=False)
            else:
                return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)
        elif action == 'cancel_intercept':
            user_id = request.session.get('user_id')
            zto_number = request.POST.get('z_number')
            group_id = request.session.get('group_id')
            try:
                order = models.Order.objects.get(zto_number=zto_number)
            except models.Order.DoesNotExist:
                return JsonResponse({'message': 'Order does not exist.'}, safe=False)
            if role == 'CM' and group_id == order.group_id or user_id == order.customer_id:
                order.question_types = 'CTI'
                order.order_emergency = 2
                order.save()
                comment_text = '取消改地址/拦截，请按原地址派送，谢谢！'
                new_comment = models.Comment.objects.create(
                    user_id=user_id,
                    order=order,
                    comment_text=comment_text
                )
                new_comment.save()
                return JsonResponse({'message': 'success'}, safe=False)
            else:
                return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)
        elif action == 'emergency':
            zto_number = request.POST.get('z_number')
            group_id = request.session.get('group_id')
            user_id = request.session.get('user_id')
            try:
                order = models.Order.objects.get(zto_number=zto_number)
            except models.Order.DoesNotExist:
                return JsonResponse({'message': 'Order does not exist.'}, safe=False)
            if role == 'CM' and group_id == order.group_id or user_id == order.customer_id:
                order.order_emergency = 1
                order.save()
                return JsonResponse({'message': 'success'}, safe=False)
            else:
                return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)

        elif action == 'allot':
            zto_number = request.POST.get('z_number')
            service_id = request.POST.get('service_id')
            if role == 'SM':
                try:
                    order = models.Order.objects.get(zto_number=zto_number)
                except models.Order.DoesNotExist:
                    return JsonResponse({'message': '订单不存在！'}, safe=False)
                try:
                    user = models.User.objects.get(id=service_id)
                except models.User.DoesNotExist:
                    return JsonResponse({'message': '用户不存在！'}, safe=False)
                order.service = user
                order.save()
                return JsonResponse({'message': 'success'}, safe=False)
            else:
                return JsonResponse({'message': '权限异常，禁止访问！'}, safe=False)


@my_not_login
def comments(request):
    # This view used to processing comments.
    if request.method == 'POST':
        # Create a comment.
        role = request.session.get('user_role')
        user_id = request.session.get('user_id')
        z_number = request.POST.get('z_number')
        try:
            order = models.Order.objects.get(zto_number=z_number)
        except models.Order.DoesNotExist:
            return JsonResponse({'message': 'The order does not exist.'}, safe=False)
        comment_text = request.POST.get('commentText').replace('<', '')
        new_comment = models.Comment.objects.create(
            user_id=user_id,
            order=order,
            comment_text=comment_text
        )
        new_comment.save()
        if role in ['S', 'SM']:
            order.order_emergency = 3
            order.save()
        elif role in ['C', 'CM']:
            order.order_emergency = 2
            order.save()
        comments_list = comment_list(order)
        context = {
            'message': 'success',
            'comments': comments_list
        }
        return JsonResponse(context, safe=False)


@method_decorator(my_not_login, name='dispatch')
class PausedDistricts(View):

    def get(self, request):
        areas = models.PausedDistrict.objects.all()
        area_list = []
        for i in areas:
            temp = {
                'province': i.province,
                'area': i.area,
                'date_updated': i.date_updated.strftime('%Y-%m-%d %H:%M:%S'),
                'redactor': i.redactor.name
            }
            area_list.append(temp)
        return JsonResponse(area_list, safe=False)

    def post(self, request):
        role = request.session.get('user_role')
        if role in ['S', 'SM', 'CM']:
            user_id = request.session.get('user_id')
            province = request.POST.get('province')
            area = request.POST.get('area').replace('<', '')
            try:
                paused_district = models.PausedDistrict.objects.get(province=province)
            except models.PausedDistrict.DoesNotExist:
                return JsonResponse({'message': '省份不存在'}, safe=False)
            paused_district.area = area
            paused_district.redactor_id = user_id
            paused_district.save()
            return JsonResponse({'message': 'success'}, safe=False)

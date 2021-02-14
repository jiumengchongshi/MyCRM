from django.shortcuts import render, redirect
from django.http.response import JsonResponse
from django.views.generic import View
from django.utils.decorators import method_decorator
from django.db.models import Q, F
from datetime import datetime
from . import models
import hashlib
# Create your views here.


def hash_pwd(s, salt='hb1n5i8u'):
    h = hashlib.sha256()
    s += salt
    h.update(s.encode())
    return h.hexdigest()


def allocation(request):
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


@my_not_login
def customer(request):
    username = request.session.get('user_name')
    group_name = request.session.get('group_name')
    notice = models.Announcement.objects.filter(group__group_name=group_name).latest()
    return render(request, 'crm/customer.html', locals())


@my_not_login
def service(request):
    username = request.session.get('user_name')
    group_name = request.session.get('group_name')
    notice = models.Handover.objects.filter(group__group_name=group_name).latest()
    return render(request, 'crm/service.html', locals())


@my_not_login
def customer_manager(request):
    username = request.session.get('user_name')
    return render(request, 'crm/customermanager.html', locals())


@my_not_login
def service_manager(request):
    username = request.session.get('user_name')
    return render(request, 'crm/servicemanager.html', locals())


def login(request):
    if request.session.get('is_login', None):  # Prohibit repeat login.
        return allocation(request)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        message = '用户名或密码错误！'
        try:
            user = models.User.objects.get(name=username)
        except:
            return render(request, 'crm/login.html', {'message': message})
        if user.password == password:
            request.session['is_login'] = True
            request.session['user_name'] = user.name
            request.session['user_role'] = user.role.name
            request.session['group_name'] = user.group.group_name
            request.session['user_id'] = user.id
            request.session['group_id'] = user.group_id
            return allocation(request)
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
    group_name = request.session.get('group_name')
    notices = models.Announcement.objects.filter(group__group_name=group_name).order_by('-pub_date')
    return JsonResponse(list(notices.values()), safe=False)


@my_not_login
def handover(request):
    group_name = request.session.get('group_name')
    notices = models.Handover.objects.filter(group__group_name=group_name).order_by('-pub_date')
    return JsonResponse(list(notices.values()), safe=False)


@method_decorator(my_not_login, name='dispatch')
class Orders(View):

    def get(self, request):
        username = request.session.get('user_name')
        group_name = request.session.get('group_name')
        role = request.session.get('user_role')
        if role == "C":
            orders = models.Order.objects.filter(customer__name=username)
        elif role == "CM":
            orders = models.Order.objects.filter(group__group_name=group_name)
        elif role == "S":
            order_status = request.GET.get('order_status')
            if order_status == 'processing':
                orders = models.Order.objects.filter(Q(service__name=username) & Q(order_status=2))
            elif order_status == 'finished':
                orders = models.Order.objects.filter(Q(service__name=username) & Q(order_status=3))
            else:
                orders = models.Order.objects.filter(service__name=username)
        elif role == "SM":
            orders = models.Order.objects.filter(service__group__group_name=group_name)
        else:
            message = '权限异常！'
            return JsonResponse({'message': message}, safe=False)
        order_list = []
        for i in orders:
            temp = {
                'id': i.id,
                'customer': i.customer.name,
                'service': i.service.name,
                'zto_number': i.zto_number,
                'question_types': i.get_question_types_display(),
                'question_text': i.question_text,
                'create_time': i.create_time.strftime('%Y-%m-%d %H:%M:%S'),
                'order_status': i.get_order_status_display(),
                'group': i.group.group_name
            }
            order_list.append(temp)
        return JsonResponse(order_list, safe=False)

    def post(self, request):
        role = request.session.get('user_role')
        action = request.POST.get('action')

        if action == 'create':  # for customer create order
            if role == "C":
                zto_number = request.POST.get('zto_number')
                same_order = models.Order.objects.filter(zto_number=zto_number)
                if same_order:
                    context = {
                        'message': '问题已存在：',
                        'zto_number': zto_number,
                    }
                else:
                    question_types = request.POST.get('question_types')
                    question_text = request.POST.get('question_text')
                    user_id = request.session.get('user_id')
                    user = models.User.objects.get(pk=user_id)
                    group_id = request.session.get('group_id')
                    group = models.Group.objects.get(pk=group_id)
                    new_order = models.Order.objects.create(
                        customer=user,
                        zto_number=zto_number,
                        question_types=question_types,
                        question_text=question_text,
                        group=group
                    )
                    new_order.save()
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
                if orders:
                    order = orders[0]
                    order.service = user
                    order.order_status = 2
                    order.save()
                    waiting_orders_quantity = len(orders) - 1
                    zto_number = order.zto_number
                    question_types = order.get_question_types_display()
                    question_text = order.question_text
                    context = {
                        'message': 'success',
                        'zto_number': zto_number,
                        'question_types': question_types,
                        'question_text': question_text,
                        'quantity': waiting_orders_quantity,
                    }
                else:
                    context = {
                        'message': 'null',
                    }
            else:
                context = {
                    'message': 'access denied!'
                }
            return JsonResponse(context, safe=False)


@my_not_login
def order(request, z_number):
    number = z_number
    return render(request, 'crm/service.html', locals())


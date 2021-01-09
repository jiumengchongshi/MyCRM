from django.shortcuts import render, redirect
from django.http.response import JsonResponse
from . import models
from . import forms
import hashlib
import datetime
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


def customer(request):
    username = request.session.get('user_name')
    group_name = request.session.get('group_name')
    notice = models.Announcement.objects.filter(group__group_name=group_name).latest()
    return render(request, 'crm/customer.html', locals())


def service(request):
    username = request.session.get('user_name')
    return render(request, 'crm/service.html', locals())


def customer_manager(request):
    username = request.session.get('user_name')
    return render(request, 'crm/customermanager.html', locals())


def service_manager(request):
    username = request.session.get('user_name')
    return render(request, 'crm/servicemanager.html', locals())


def login(request):
    if request.session.get('is_login', None):#Prohibit repeat login.
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
            return allocation(request)
        else:
            return render(request, 'crm/login.html', {'message': message})
    return render(request, 'crm/login.html')


def logout(request):
    if not request.session.get('is_login', None):
        return redirect('/crm/')
    request.session.flush()
    return redirect('/crm/')


def freeze(request):
    request.session.flush()
    message = '该用户已被冻结，请联系管理员！'
    return render(request, 'crm/login.html', {'message': message})


def announcements(request):
    group_name = request.session.get('group_name')
    notices = models.Announcement.objects.filter(group__group_name=group_name).order_by('-pub_date')
    return JsonResponse(list(notices.values()), safe=False)

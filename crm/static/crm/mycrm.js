// Basic functions
function freeze_user(action, user_id) {
    $.post(
        '/crm/api/users/',
        {
            'action': 'freeze',
            'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
            'freeze_action': action,
            'freeze_user_id': user_id,
        },
        function (data) {
            let message = data.message;
            if (message == 'success') {
                $('table[name="usersTable"]').bootstrapTable('refresh');
            } else {
                alert(message);
            }

        }
    );
}


function emergencyStyle(value) {
    let a = "";
    if (value == '加急') {
        a = '<span class="badge badge-danger">' + value + '</span>';
    } else if (value == '待回复') {
        a = '<span class="badge badge-primary">' + value + '</span>';
    } else {
        a = value;
    }
    return a

}

//Load the comments list.
function loadCommentList(data) {
    let comments = data.comments;
    //Empty the comment list.
    $('#orderModalCommentList').text("");
    $('#orderModalCommentList').removeClass('alert alert-dark');

    //Loads the comment list through a loop.
    if (comments.length != 0) {
        $('#orderModalCommentList').addClass('alert alert-dark');
        for (let i in comments) {
            let speaker = comments[i].speaker;
            let role = comments[i].role;
            let comment = comments[i].comment;
            let create_time = comments[i].create_time;
            if (role === "C") {  //Render user names in different colors for different roles.
                $('#orderModalCommentList').append("<div><span class=\"text-right text-primary\">客户：" + speaker + "</span><span class=\"text-right font-italic text-black-50\">" + create_time + "</span><pre>" + comment + "</pre></div>")
            } else if (role === 'CM'){
                $('#orderModalCommentList').append("<div><span class=\"text-right text-danger\">客户经理：" + speaker + "</span><span class=\"text-right font-italic text-black-50\">" + create_time + "</span><pre>" + comment + "</pre></div>")
            }else{
                $('#orderModalCommentList').append("<div><span class=\"text-right text-success\">客服：" + speaker + "</span><span class=\"text-right font-italic text-black-50\">" + create_time + "</span><pre>" + comment + "</pre></div>")
            }
        }
    }
}


// Load the orderModal box.
function loadOrderModal(data) {
    let order = data.order;
    //Loads order information for the order modal box.
    $('#orderModalNumber').text(order.zto_number);
    $('#orderModalQuestionType').text(order.question_types);
    $('#orderModalQuestionText').text(order.question_text);
    $('#orderModalCustomer').text(order.customer);
    $('#orderModalCreateTime').text(order.create_time);
    $('#orderModalServiceName').text(order.service);

}


// Get order.
function getOrder(number) {
    $.get(
        "/crm/api/orders/" + number + "/",
        function (data) {
            if (data.message == "success") {
                loadOrderModal(data);
                loadCommentList(data);
                let orderStatus = data.order.order_status;
                if (orderStatus > 2) {
                    $('#commentForm').hide();
                } else {
                    $('#commentForm').show();
                }

                $('#order-modal').modal();

            } else {
                alert(data.message);
            }
        }
    );

}


//  The end of basic functions.


// Define the processing logic for the main buttons
$("#orderModalSubmit").click(function () {
    let z_number = $('#orderModalNumber').text();
    let commentText = $('#orderModalCommentText').val();
    if (commentText.trim().length == 0) {
        alert('处理意见不能为空！')
    } else {
        $.post(
            "/crm/api/comments/",
            {
                'z_number': z_number,
                'commentText': commentText,
                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
            },
            function (data) {
                if (data.message === 'success') {
                    loadCommentList(data);
                    $('#orderModalCommentText').val('');
                    $('table[name="orderTable"]').bootstrapTable('refresh');
                } else {
                    alert(data.message)
                }

            }
        );
    }
});


window.onload = function () {
    // customer page function
    if (document.getElementById("announcements")) {
        let announcements = new Vue({
            el: "#announcements",
            delimiters: ["[[", "]]"],
            data: {
                announcement: []
            },
            mounted: function () {
                this.fetchData();
            },
            methods: {
                fetchData() {
                    axios.get("/crm/api/announcements/").then(response => {
                        this.announcement = response.data;
                    }), err => {
                        console.log(err);
                    };
                },
                notice: function (i) {
                    return "notice" + i

                },
                collapse: function (i) {
                    return "collapse" + i

                },
                co: function (i) {
                    return "#collapse" + i

                },
                date: function (str) {
                    return str.substr(0, 10) + " " + str.substr(11, 8)

                }
            },
        });
    }


    $('#createOrderModalSubmit').click(function () {
        $('#create_zto_number_danger').text('');
        $('#create_zto_number_result').text('');
        if ($('#createOrderNumber').val().toString().length != 14) {
            alert('请输入正确的快递单号！');
        } else if ($('#questionTextForModal').val().trim() == '') {
            alert('问题描述不能为空！');
        } else if ($('#questionTypesForModal').val() == null) {
            $('#questionTypesForModal').focus();
        } else {
            $.post(
                "/crm/api/orders/",
                {
                    'action': 'create',
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'zto_number': $('#createOrderNumber').val(),
                    'question_types': $('#questionTypesForModal').val(),
                    'question_text': $('#questionTextForModal').val(),
                },
                function (data) {
                    let message = data.message;
                    if (message == "问题已存在：") {
                        $('#create_zto_number_danger').text(message);
                    } else if (message == "创建成功！") {
                        $('#create_zto_number_result').addClass('text-success').text(message);
                        $('#createOrderNumber').val("");
                        $('#questionTextForModal').val("");
                        $('#questionTypesForModal').val(null);
                        $('#customerOrdersTable').bootstrapTable('refresh');
                    } else {
                        $('#create_zto_number_result').addClass('text-warning').text(message);
                    }

                });
        }

    });


    // service page function
    if (document.getElementById("handover")) {
        let handover = new Vue({
            el: "#handover",
            delimiters: ["[[", "]]"],
            data: {
                handover: []
            },
            mounted: function () {
                this.fetchData();
            },
            methods: {
                fetchData() {
                    axios.get("/crm/api/handover/").then(response => {
                        this.handover = response.data;
                    }), err => {
                        console.log(err);
                    };
                },
                notice: function (i) {
                    return "notice" + i

                },
                collapse: function (i) {
                    return "collapse" + i

                },
                co: function (i) {
                    return "#collapse" + i

                },
                date: function (str) {
                    return str.substr(0, 10) + " " + str.substr(11, 8)

                }
            },
        });
    }


    $('#service-waiting').click(function () {
        // sent a POST request to the service and get waiting orders.
        $.post(
            '/crm/api/orders/',
            {
                'action': 'take',
                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
            },
            function (data) {
                let message = data.message;
                if (message == "access denied!") {
                    alert('权限异常！');
                } else if (message == "null") {
                    alert("问题都被处理完了，暂时还没有新问题O(∩_∩)O~~");
                    $('#waiting-orders-quantity').text(0);
                } else if (message == "success") {
                    // Load the modal box
                    let quantity = data.quantity;
                    $('#waiting-orders-quantity').text(quantity);
                    loadOrderModal(data);
                    loadCommentList(data);
                    $('#order-modal').modal();

                    //refresh the question-list table
                    $('#serviceProcessingOrders').bootstrapTable('refresh');
                }
            }
        )

    });


    $('table[name="orderTable"]').on('dbl-click-row.bs.table', function (e, row) {
        getOrder(row.zto_number);

    });


    $('#service-handover').click(function () {
        // Clicking the handover button triggers the handoverModal.
        $.get(
            '/crm/api/users/S/',
            function (data) {
                if (data.message == 'success') {
                    let userList = data.user_list;
                    if (userList.length == 0) {
                        alert('没有可以交接的客服！')
                    } else {
                        $('#recipientSelect').text('');  //Empty the list.
                        $('#recipientSelect').append('<option disabled="disabled" selected>请选择要交接的客服</option>');
                        for ( i in userList) {
                            $('#recipientSelect').append('<option value=' + userList[i][0] + '>' + userList[i][1] + '</option>');
                        }
                        $('#handover-modal').modal();
                    }
                } else {
                    alert(data.message);
                }

            }
        );

    });


    //load the allot modal
    if (document.getElementById("allotModal")) {
        $.get(
            '/crm/api/users/S/',
            function (data) {
                for ( u in data){
                    let user = data[u];
                    console.log(user);
                    if (user.status == '启用'){
                        $('#allotUsername').append('<option value=' + user.id + '>' + user.name + '</option>');
                    }

                }

            }
        );
    }


    $('#allotModalSubmit').click(function () {
        let z_number = $('#allotModalNumber').text();
        let service_id = $('#allotUsername').val();
        if (service_id){
            $.post(
                '/crm/api/orders/',
                {
                    'action': 'allot',
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'z_number': z_number,
                    'service_id': service_id
                },
                function (data) {
                    let message = data.message;
                    if (message == 'success'){
                        $('#allotModal').modal('hide');
                        $('#unsettledOrders').bootstrapTable('refresh');
                    }else{
                        alert(message);
                    }
                }
            );
        }else{
            alert('请选择要分配的客服！');
        }

    });


    $('#handoverModalSubmit').click(function () {
        let recipient = $('#recipientSelect').val();
        let handoverText = $('#handoverModalText').val();
        let handoverTitle = $('#handoverTitle').val();
        if (handoverText.trim().length == 0) {
            alert('交接内容不能为空！')
        } else if (recipient == null) {
            alert('请选择要交接的客服！')
        } else if (handoverTitle.trim().length == 0) {
            alert('标题不能为空！')
        } else {
            $.post(
                '/crm/api/handover/',
                {
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'recipient': recipient,
                    'handoverTitle': handoverTitle,
                    'handoverText': handoverText,
                },
                function (data) {
                    if (data.message == 'success') {
                        $('#serviceProcessingOrders').bootstrapTable('refresh');
                        $('#handover-modal').modal('hide');
                        alert('提交成功！');
                    }
                }
            );
        }

    });

    $('#baseSearchBar').keyup(function (event) {
        if (event.which == 13) {
            let z_number = $('#baseSearchBar').val();
            if (z_number.length != 14) {
                alert('请输入正确的运单号！');
            } else {
                getOrder(z_number);
            }
        }
    });


    // Initialize the customerOrdersTable.
    $('#customerOrdersTable').bootstrapTable({
        url: '/crm/api/orders/?order_status=processing',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'order_emergency',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            title: '序号',
            align: 'center',
            formatter: function (value, row, index) {
                return index + 1;
            }
        }, {
            field: "zto_number",
            title: "快递单号",
            align: 'center',
        }, {
            field: "question_types",
            title: "问题类型",
            align: 'center',
            sortable: true,
        }, {
            field: "question_text",
            title: "问题描述",
            align: 'center',
            class: "text-truncate",
        }, {
            field: "order_emergency",
            title: "emergency",
            visible: false,
        }, {
            title: "状态",
            align: 'center',
            formatter: function (e, row, value) {
                let a = row.order_emergency_text;
                return emergencyStyle(a);
            }
        }, {
            field: "update_time",
            title: "更新时间",
            align: 'center',
            sortable: true,
        }, {
            field: "service",
            title: "客服",
            align: 'center',
        }, {
            title: "操作",
            align: 'center',
            formatter: function (value, row, index) {
                let button_str = '<button class="btn btn-success btn-sm" title="评论">评论</button> ';
                if (row.question_types == "拦截" || row.question_types == "改地址") {
                    let str = row.question_types;
                    button_str = button_str + '<button class="btn btn-danger btn-sm" title="取消改地址">取消' + str + '</button> ';
                } else {
                    button_str = button_str + '<button class="btn btn-danger btn-sm" title="关闭问题">关闭问题</button> ';
                }
                if (row.order_emergency_text != '加急') {
                    button_str = button_str + '<button class="btn btn-warning btn-sm" title="加急">加急</button>';
                }
                return button_str;
            },
            events: {
                'click button[title=评论]': function (e, value, row, index) {
                    getOrder(row.zto_number);
                },
                'click button[title=关闭问题]': function (e, value, row, index) {
                    let finish = confirm('您确定要关闭问题吗？');
                    if (finish == true) {
                        $.post(
                            '/crm/api/orders/',
                            {
                                'action': 'close',
                                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                                'z_number': row.zto_number,
                            },
                            function (data) {
                                if (data.message == 'success') {
                                    alert("关闭成功，您可以在已完成的问题页面查看被关闭的问题，被关闭的问题将在数据库中保留1个月。")
                                    $('#customerOrdersTable').bootstrapTable('refresh');
                                    $('#customerFinishedOrdersTable').bootstrapTable('refresh');
                                } else {
                                    alert(data.message);
                                }

                            }
                        )
                    }

                },
                'click button[title=取消改地址]': function (e, value, row) {
                    let cancel = confirm('您确定要取消改地址或拦截，并按原地址派送吗？');
                    if (cancel == true) {
                        $.post(
                            '/crm/api/orders/',
                            {
                                'action': 'cancel_intercept',
                                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                                'z_number': row.zto_number,
                            },
                            function (data) {
                                if (data.message == 'success') {
                                    $('#customerOrdersTable').bootstrapTable('refresh');
                                } else {
                                    alert(data.message);
                                }

                            }
                        )
                    }

                },
                'click button[title=加急]': function (e, value, row) {
                    let emergency = confirm('确认加急客服将在24小时内给您回复。');
                    if (emergency == true) {
                        $.post(
                            '/crm/api/orders/',
                            {
                                'action': 'emergency',
                                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                                'z_number': row.zto_number,
                            },
                            function (data) {
                                if (data.message == 'success') {
                                    $('#customerOrdersTable').bootstrapTable('refresh');
                                } else {
                                    alert(data.message);
                                }

                            }
                        )
                    }

                }
            }
        }]
    });


    $('#customerFinishedOrdersTable').bootstrapTable({
        url: '/crm/api/orders/?order_status=finished',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'order_status',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            title: '序号',
            align: 'center',
            formatter: function (value, row, index) {
                return index + 1;
            }
        }, {
            field: "zto_number",
            title: "快递单号",
            align: 'center',
        }, {
            field: "question_types",
            title: "问题类型",
            align: 'center',
            sortable: true,
        }, {
            field: "question_text",
            title: "问题描述",
            align: 'center',
            class: "text-truncate",
        }, {
            field: "order_status",
            title: "处理状态",
            align: 'center',
            sortable: true,
        }, {
            field: "update_time",
            title: "更新时间",
            align: 'center',
            sortable: true,
        }, {
            field: "service",
            title: "客服",
            align: 'center',
        }, {
            title: "操作",
            align: 'center',
            formatter: function (value, row, index) {
                if (row.order_status == '待审核') {
                    return '<button class="btn btn-success btn-sm" title="查看">查看</button> '
                        + '<button class="btn btn-warning btn-sm" title="审核">审核</button>'
                } else if (row.order_status == '已关闭') {
                    return '<button class="btn btn-success btn-sm" title="查看">查看</button> '
                        + '<button class="btn btn-danger btn-sm" title="重开">重开</button>'
                }
            },
            events: {
                'click button[title=审核]': function (e, value, row, index) {
                    let closed = confirm('请确认问题已解决，确认关闭问题。')
                    if (closed == true) {
                        $.post(
                            '/crm/api/orders/',
                            {
                                'action': 'close',
                                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                                'z_number': row.zto_number,
                            },
                            function (data) {
                                if (data.message == 'success') {
                                    alert("关闭成功，您可以在已完成的问题页面查看被关闭的问题，被关闭的问题将在数据库中保留1个月。")
                                    $('#customerFinishedOrdersTable').bootstrapTable('refresh');
                                } else {
                                    alert(data.message);
                                }

                            }
                        )
                    }
                },
                'click button[title=重开]': function (e, value, row, index) {
                    let restart = confirm('确认要重新开启这个问题吗？');
                    if (restart == true) {
                        $.post(
                            '/crm/api/orders/',
                            {
                                'action': 'restart',
                                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                                'z_number': row.zto_number,
                            },
                            function (data) {
                                if (data.message == 'success') {
                                    alert("问题已重新开启，等待客服处理，您可以在工作台中查看此问题的最新进展。")
                                    $('#customerFinishedOrdersTable').bootstrapTable('refresh');
                                    $('#customerOrdersTable').bootstrapTable('refresh');
                                } else {
                                    alert(data.message);
                                }
                            }
                        )
                    }
                },
                'click button[title=查看]': function (e, value, row, index) {
                    getOrder(row.zto_number);
                }
            }
        }]
    });


    $('#interceptModalSubmit').click(function () {
        let numberList = [...new Set($('#interceptOrdersForModal').val().trim().split(/\D/))];
        let inspect = true;
        $('#interceptOrdersForModal').val('');
        $('#interceptWarning').text('');
        for (let n in numberList) {
            if (numberList[n] == '') {
                continue;
            } else if (numberList[n].toString().length != 14) {
                inspect = false;
            }
            let str = $('#interceptOrdersForModal').val() + numberList[n] + '\n';
            $('#interceptOrdersForModal').val(str);
        }
        if (inspect) {
            let orderList = $('#interceptOrdersForModal').val().split(/\D/).toString();
            $.post(
                '/crm/api/orders/',
                {
                    'action': 'intercept',
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'orderList': orderList,
                },
                function (data) {
                    // 返回的数据中应该说明哪些提交成功，哪些存在异常（主要是单号已存在的问题）
                    let message = data.message;
                    if (message == 'success') {
                        let successTotal = data.success_total;
                        let repeatList = data.repeat_list;
                        $('#messageModalLabel').text('批量拦截');
                        $('#messageModalBody').text('');
                        let str = '<p class="text-info"><span class="text-success">' + successTotal + '</span>条提交成功，<span class="text-danger">' + repeatList.length + '</span>条提交失败.</p>';
                        $('#messageModalBody').append(str);
                        if (repeatList.length > 0) {
                            let str = '<p class="alert alert-danger">以下单号提交失败：<br />' + repeatList.join("<br />") + '</p>';
                            $('#messageModalBody').append(str);
                        }
                        $('#interceptModal').modal("hide");
                        $('#customerOrdersTable').bootstrapTable('refresh');
                        $('#messageModal').modal();
                    } else {
                        $('#messageModalLabel').text('批量拦截');
                        $('#messageModalBody').text(message);
                        $('#interceptModal').modal("hide");
                        $('#messageModal').modal();
                    }

                }
            );
        } else {
            $('#interceptWarning').text('单号格式异常或错误，请检查！');
        }
    });

    $("table[name='pausedDistrictsCT']").bootstrapTable({
        url: '/crm/api/paused_districts/',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'province',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            title: '序号',
            align: 'center',
            formatter: function (value, row, index) {
                return index + 1;
            }
        }, {
            field: "province",
            title: "省份",
            align: 'center',
            sortable: true,
        }, {
            field: "area",
            title: "停发地区",
        }, {
            field: "date_updated",
            title: "更新时间",
            align: 'center',
        }, {
            field: "redactor",
            title: "修订人",
            align: 'center',
        }]
    });


    $("table[name='pausedDistrictsST']").bootstrapTable({
        url: '/crm/api/paused_districts/',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'province',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            title: '序号',
            align: 'center',
            formatter: function (value, row, index) {
                return index + 1;
            }
        }, {
            field: "province",
            title: "省份",
            align: 'center',
            sortable: true,
        }, {
            field: "area",
            title: "停发地区",
        }, {
            field: "date_updated",
            title: "更新时间",
            align: 'center',
        }, {
            field: "redactor",
            title: "修订人",
            align: 'center',

        }, {
            title: "操作",
            align: 'center',
            formatter: function () {
                return '<button class="btn btn-success btn-sm" title="编辑">编辑</button>'
            },
            events: {
                'click button[title=编辑]': function (e, value, row, index) {
                    $('#pausedDistrictProvince').text(row.province);
                    $('#pausedDistrictForModal').html('<textarea class="form-control" id="pausedArea" cols="50" rows="10" required>' + row.area + '</textarea>');
                    $('#pausedDistrictModal').modal();
                }
            }
        }]
    });


    $('#pausedDistrictModalSubmit').click(function () {
        let province = $('#pausedDistrictProvince').text();
        let area = $('#pausedArea').val();
        $.post(
            '/crm/api/paused_districts/',
            {
                'province': province,
                'area': area,
                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
            },
            function (data) {
                let message = data.message;
                if (message == 'success') {
                    $('#pausedDistrictModal').modal('hide');
                    $("table[name='pausedDistrictsST']").bootstrapTable('refresh');
                } else {
                    alert(message);
                }
            }
        );

    });


    $('#customersTable').bootstrapTable({
        url: '/crm/api/users/C/',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'status',           //默认排序字段
        sortOrder: "desc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            field: "id",
            title: 'ID',
            align: 'center',
        }, {
            field: "name",
            title: "客户姓名",
            align: 'center',
            sortable: true,
        }, {
            field: "phone",
            title: "手机号",
        }, {
            field: "shop",
            title: "店铺名",
            align: 'center',
            sortable: true,
        }, {
            field: "group",
            title: "群组",
            align: 'center',

        }, {
            field: "status",
            title: "状态",
            align: 'center',
            sortable: true,
        }, {
            title: "操作",
            align: 'center',
            formatter: function (e, value) {
                if (value.status == '启用') {
                    return '<button class="btn btn-success btn-sm" title="编辑用户">编辑</button> '
                        + '<button class="btn btn-danger btn-sm" title="冻结用户">冻结用户</button>'
                } else {
                    return '<button class="btn btn-success btn-sm" title="编辑用户">编辑</button> '
                        + '<button class="btn btn-warning btn-sm" title="解除冻结">解除冻结</button>'
                }

            },
            events: {
                'click button[title=编辑用户]': function (e, value, row, index) {
                    $('#newUserName').val(row.name);
                    $('#newUserName').attr("readonly", true);
                    $('#newUserPhone').val(row.phone);
                    $('#userModal').modal();

                },
                'click button[title=冻结用户]': function (e, value, row) {
                    let str = '确认要冻结 ' + row.name + ' 吗？冻结之后此用户将无法登陆系统。';
                    let freeze = confirm(str);
                    if (freeze) {
                        freeze_user('freeze', row.id);
                    }
                },
                'click button[title=解除冻结]': function (e, value, row, index) {
                    let str = '确认要解除 ' + row.name + ' 的冻结状态吗？';
                    let freeze = confirm(str);
                    if (freeze) {
                        freeze_user('unfreeze', row.id);
                    }
                },
            }
        }]
    });


    $('#serviceProcessingOrders').bootstrapTable({
        url: '/crm/api/orders/?order_status=processing',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'order_emergency',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            title: '序号',
            align: 'center',
            formatter: function (value, row, index) {
                return index + 1;
            }
        }, {
            field: "zto_number",
            title: "快递单号",
            align: 'center',
        }, {
            field: "question_types",
            title: "问题类型",
            align: 'center',
            sortable: true,
        }, {
            field: "question_text",
            title: "问题描述",
            align: 'center',
            class: "text-truncate",
        }, {
            field: "order_emergency",
            title: "emergency",
            visible: false,
        }, {
            title: "状态",
            align: 'center',
            formatter: function (e, row, value) {
                let a = row.order_emergency_text;
                return emergencyStyle(a);
            }
        }, {
            field: "update_time",
            title: "更新时间",
            align: 'center',
            sortable: true,
        }, {
            field: "customer",
            title: "客户",
            align: 'center',
        }, {
            field: "group",
            title: "客户组",
            align: 'center',
        }, {
            title: "操作",
            align: 'center',
            formatter: function (value, row, index) {
                return '<button class="btn btn-success btn-sm" title="处理">处理</button> '
                    + '<button class="btn btn-danger btn-sm" title="处理完毕">处理完毕</button>';

            },
            events: {
                'click button[title=处理]': function (e, value, row) {
                    getOrder(row.zto_number);
                },
                'click button[title=处理完毕]': function (e, value, row) {
                    let finish = confirm('请确认问题已经处理完毕');
                    if (finish == true) {
                        $.post(
                            '/crm/api/orders/',
                            {
                                'action': 'finish',
                                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                                'z_number': row.zto_number,
                            },
                            function (data) {
                                if (data.message == 'success') {
                                    $('#processingQuestionList').bootstrapTable('refresh');
                                } else {
                                    alert(data.message);
                                }

                            }
                        )
                    }

                }
            }
        }]
    });


    $('#unsettledOrders').bootstrapTable({
        url: '/crm/api/orders/?order_status=processing',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'order_emergency',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            field: "zto_number",
            title: "快递单号",
            align: 'center',
        }, {
            field: "question_types",
            title: "问题类型",
            align: 'center',
            sortable: true,
        }, {
            field: "question_text",
            title: "问题描述",
            align: 'center',
            class: "text-truncate",
        }, {
            field: "order_emergency",
            title: "emergency",
            visible: false,
        }, {
            title: "状态",
            align: 'center',
            formatter: function (e, row, value) {
                let a = row.order_emergency_text;
                return emergencyStyle(a);
            }
        }, {
            field: "update_time",
            title: "更新时间",
            align: 'center',
            sortable: true,
        }, {
            field: "service",
            title: "客服",
            align: 'center',
        }, {
            field: "group",
            title: "客户组",
            align: 'center',
        }, {
            title: "操作",
            align: 'center',
            formatter: function (value, row, index) {
                return '<button class="btn btn-success btn-sm" title="分配">分配</button> '
                    + '<button class="btn btn-danger btn-sm" title="关闭问题">关闭问题</button>';

            },
            events: {
                'click button[title=分配]': function (e, value, row) {
                    $('#allotModalNumber').text(row.zto_number);
                    $('#allotModalType').text(row.question_types);
                    $('#allotModal').modal();
                },
                'click button[title=关闭问题]': function (e, value, row) {
                    let finish = confirm('请确认问题已经处理完毕');
                    if (finish == true) {
                        $.post(
                            '/crm/api/orders/',
                            {
                                'action': 'finish',
                                'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                                'z_number': row.zto_number,
                            },
                            function (data) {
                                if (data.message == 'success') {
                                    $('#processingQuestionList').bootstrapTable('refresh');
                                } else {
                                    alert(data.message);
                                }

                            }
                        )
                    }

                }
            }
        }]
    });


    $('#change_pwdSubmit').click(function () {
        let original_pwd = $('#originalPassword');
        let new_pwd = $('#newPassword1');
        let new_pwd2 = $('#newPassword2');
        if (original_pwd.val() && new_pwd.val() && new_pwd2.val()) {
            if (original_pwd.val().length > 5 && new_pwd.val().length > 5 && new_pwd2.val().length > 5) {
                if (new_pwd.val() === new_pwd2.val()) {
                    $.post(
                        '/crm/api/users/',
                        {
                            'action': 'change_pwd',
                            'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                            'original_pwd': original_pwd.val(),
                            'new_pwd': new_pwd.val()
                        },
                        function (data) {
                            let message = data.message;
                            if (message == 'success') {
                                alert('密码修改成功，请重新登录！');
                                window.location.reload();
                            } else {
                                alert(message);
                            }

                        }
                    );
                } else {
                    alert('两次新密码输入不一致，请检查并重新输入！');
                }

            } else {
                alert('密码长度应在6-14位！');
            }
        } else {
            alert('密码不能为空！');
        }
    });


    $('#createUserBtn').click(function () {
        $('#newUserName').val('');
        $('#newUserName').attr("readonly", false);
        $('#newUserPhone').val('');
        $('#userModal').modal();
    });

    $('#createShopBtn').click(function () {
        $('#newShopName').val('');
        $('#newShopName').attr("readonly", false);
        $('#newShopkeeper').val('');
        $('#shopModal').modal();
    });

    $('#userModalSubmit').click(function () {
        let new_username = $('#newUserName');
        let new_user_phone = $('#newUserPhone');
        let sta = new_username.attr("readonly");
        console.log(sta);
        if (new_username.val().trim().length == 0) {
            alert('用户名不能为空！');
        } else if (new_user_phone.val().toString().length != 11) {
            alert('请输入正确的联系方式！');
        } else {
            let action = 'create';
            if (sta) {
                action = 'update';
            }
            $.post(
                '/crm/api/users/',
                {
                    'action': action,
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'new_username': new_username.val().trim(),
                    'new_phone': new_user_phone.val().trim()
                },
                function (data) {
                    let message = data.message;
                    if (message == 'success') {
                        $('table[name="usersTable"]').bootstrapTable('refresh');
                        $('#userModal').modal('hide');
                    } else {
                        alert(message);
                    }
                }
            );
        }
    });


    $('#shopsTable').bootstrapTable({
        url: '/crm/api/shops/',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'shop_name',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            field: "shop_name",
            title: "店铺名称",
            align: 'center',
            sortable: true
        }, {
            field: "shopkeeper",
            title: "客户名称",
            align: 'center',
            sortable: true,
        }, {
            title: "操作",
            align: 'center',
            formatter: function (value, row, index) {
                return '<button class="btn btn-success btn-sm" title="编辑">编辑</button>';

            },
            events: {
                'click button[title=编辑]': function (e, value, row) {
                    $('#newShopName').val(row.shop_name);
                    $('#newShopName').attr("readonly", true);
                    $('#newShopkeeper').val(row.shopkeeper);
                    $('#shopModal').modal();
                },

            }
        }]
    });

    $('#shopModalSubmit').click(function () {
        let shop_name = $('#newShopName');
        let shopkeeper = $('#newShopkeeper');
        if (shop_name.val().trim() && shopkeeper.val().trim()) {
            $.post(
                '/crm/api/shops/',
                {
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'shop_name': shop_name.val().trim(),
                    'shopkeeper': shopkeeper.val().trim()
                },
                function (data) {
                    let message = data.message;
                    if (message == 'success') {
                        $('#shopModal').modal('hide');
                        $('table[name="shopsTable"]').bootstrapTable('refresh');
                    } else {
                        alert(message);
                    }

                }
            );
        } else {
            alert('店铺名称、客户名称不能为空！');
        }

    });


    $('#servicesTable').bootstrapTable({
        url: '/crm/api/users/S/',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'status',           //默认排序字段
        sortOrder: "desc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            field: "id",
            title: 'ID',
            align: 'center',
        }, {
            field: "name",
            title: "客服姓名",
            align: 'center',
            sortable: true,
        }, {
            field: "phone",
            title: "手机号",
        }, {
            field: "status",
            title: "状态",
            align: 'center',
            sortable: true,
        }, {
            title: "操作",
            align: 'center',
            formatter: function (e, value) {
                if (value.status == '启用') {
                    return '<button class="btn btn-success btn-sm" title="编辑用户">编辑</button> '
                        + '<button class="btn btn-danger btn-sm" title="冻结用户">冻结用户</button>'
                } else {
                    return '<button class="btn btn-success btn-sm" title="编辑用户">编辑</button> '
                        + '<button class="btn btn-warning btn-sm" title="解除冻结">解除冻结</button>'
                }

            },
            events: {
                'click button[title=编辑用户]': function (e, value, row, index) {
                    $('#newUserName').val(row.name);
                    $('#newUserName').attr("readonly", true);
                    $('#newUserPhone').val(row.phone);
                    $('#userModal').modal();

                },
                'click button[title=冻结用户]': function (e, value, row) {
                    let str = '确认要冻结 ' + row.name + ' 吗？冻结之后此用户将无法登陆系统。';
                    let freeze = confirm(str);
                    if (freeze) {
                        freeze_user('freeze', row.id);
                    }
                },
                'click button[title=解除冻结]': function (e, value, row, index) {
                    let str = '确认要解除 ' + row.name + ' 的冻结状态吗？';
                    let freeze = confirm(str);
                    if (freeze) {
                        freeze_user('unfreeze', row.id);
                    }
                },
            }
        }]
    });


    $('#announcementsTable').bootstrapTable({
        url: '/crm/api/announcements/',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'pub_date',           //默认排序字段
        sortOrder: "desc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            field: "id",
            title: 'ID',
            align: 'center',
        }, {
            field: "title",
            title: "标题",
            align: 'center',
            sortable: true,
        }, {
            field: "notice",
            title: "内容",
            class: "text-truncate",
        }, {
            field: "user",
            title: "发布者",
            align: 'center',
            sortable: true,
        }, {
            field: "pub_date",
            title: "更新时间",
            align: 'center',
            sortable: true,
        }, {
            title: "操作",
            align: 'center',
            formatter: function () {
                    return '<button class="btn btn-success btn-sm" title="编辑通知">编辑</button>'
            },
            events: {
                'click button[title=编辑通知]': function (e, value, row, index) {
                    $('#announcementID').text(row.id);
                    $('#announcementTitle').val(row.title);
                    $('#announcementText').val(row.notice);
                    $('#announcementModal').modal();
                },
            }
        }]
    });


    $('#createAnnouncement').click(function () {
        $('#announcementID').text('');
        $('#announcementTitle').val('');
        $('#announcementText').val('');
        $('#announcementModal').modal();
    });


    $('#announcementModalSubmit').click(function () {
        let announcement_id = $('#announcementID');
        let title = $('#announcementTitle');
        let noticeText = $('#announcementText');
        if (title.val().trim() && noticeText.val().trim()){
            $.post(
                '/crm/api/announcements/',
                {
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'announcement_id': announcement_id.text(),
                    'title': title.val().trim(),
                    'notice': noticeText.val()
                },
                function (data) {
                    let message = data.message;
                    if (message == 'success'){
                        $('#announcementModal').modal('hide');
                        $('#announcementsTable').bootstrapTable('refresh');
                    }else{
                        alert(message);
                    }

                }
            );
        }else {
            alert('标题或公告内容不能为空！')
        }

    });

    $('[data-toggle="tooltip"]').tooltip()

    $('#groupsTable').bootstrapTable({
        url: '/crm/api/groups/',
        method: 'get',                      //请求方式（*）
        toolbar: '#toolbar',                //工具按钮用哪个容器
        striped: true,                      //是否显示行间隔色
        cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true,                   //是否显示分页（*）
        sortable: true,                     //是否启用排序
        sortName: 'id',           //默认排序字段
        sortOrder: "asc",                   //排序方式
        sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1,                       //初始化加载第一页，默认第一页
        pageSize: 10,                       //每页的记录行数（*）
        search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
        strictSearch: false,                //是否精确匹配
        showColumns: true,                  //是否显示所有的列
        showRefresh: true,                  //是否显示刷新按钮
        minimumCountColumns: 2,             //最少允许的列数
        clickToSelect: true,                //是否启用点击选中行
        detailView: false,                   //是否显示父子表
        columns: [{
            field: "id",
            title: 'ID',
            align: 'center',
        }, {
            field: "group_name",
            title: "群组名称",
            align: 'center',
            sortable: true,
        }, {
            field: "address",
            title: "群组地址",
            class: "text-truncate",
        }, {
            field: "members_total",
            title: "成员总数",
            align: 'center',
        }]
    });


    $('#createGroupBtn').click(function () {
        $('#groupModalAction').val('create');
        $('#groupModal').modal();
    });

    $('#groupModalSubmit').click(function () {
        let action = $('#groupModalAction').val().trim();
        let group_name = $('#newGroupName').val().trim();
        let address = $('#newAddress').val();
        if (group_name && address){
            $.post(
                '/crm/api/groups/',
                {
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'action': action,
                    'group_name': group_name,
                    'address': address
                },
                function (data) {
                    let message = data.message;
                    if (message == 'success'){
                        $('#groupModal').modal('hide');
                        $('table[name=groupsTable]').bootstrapTable('refresh');
                    }else{
                        alert(message);
                    }
                }
            );

        }else {
            alert('群组名称或地址不能为空！');
        }
    });
}

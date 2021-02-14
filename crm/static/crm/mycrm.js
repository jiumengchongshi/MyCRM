function tableIndex(value, row, index) {
    return index + 1;

}


//service page bootstrap-table formatter and events functions
function serviceAction(value, row, index) {
    return '<button class="btn btn-success btn-sm update">处理</button> '
        + '<button class="btn btn-danger btn-sm delete">关闭</button>';
}

function processOrder(order){
    $('#orderModalNumber').text(order);
    $('#order-modal').modal();
}

window.actionEvents = {
    'click .update': function (e, value, row, index) {
        //点击处理按钮触发的事件
        processOrder(row.zto_number);

    },
    'click .delete': function (e, value, row, index) {
        alert('删除按钮被点击')

    }
};



window.onload = function () {
    // customer page function
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


    let c_orders = new Vue({
        el: "#nav-co-list",
        delimiters: ["[[", "]]"],
        data: {
            orders: [],
            waiting: [],
            processing: [],
            finish: [],
            closes: [],

        },
        mounted() {
            this.fetchData();
        },
        methods: {
            fetchData() {
                axios.get("/crm/api/orders/").then(response => {
                    this.orders = response.data;
                    for (let n in this.orders) {
                        switch (this.orders[n].order_status) {
                            case '待处理':
                                this.waiting.push(this.orders[n]);
                                break;
                            case '处理中':
                                this.processing.push(this.orders[n]);
                                break;
                            case '处理完毕，待审核':
                                this.finish.push(this.orders[n]);
                                break;
                            case '审核完毕（关闭问题）':
                                this.closes.push(this.orders[n]);
                                break;

                        }
                    }

                }), err => {
                    console.log(err);

                };
            },
        },
    });


    $('#createOrdersC').click(function () {
        //待添加内容：需要先清除提示文本内容，然后再进行后续判断。
        $('#create_zto_number_danger').text("");
        $('#create_zto_number_result').text("");
        if ($('#create_zto_number').val().length != 14) {
            $('#create_zto_number_danger').text("快递单号错误！");
        } else if ($('#createQuestionText').val() == '') {
            $('#create_zto_number_danger').text('问题描述不能为空！');
        } else {
            $.post(
                "/crm/api/orders/",
                {
                    'action': 'create',
                    'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
                    'zto_number': $('#create_zto_number').val(),
                    'question_types': $('input[name="questionTypes"]:checked').val(),
                    'question_text': $('#createQuestionText').val(),
                },
                function (data) {
                    let message = data.message;
                    let zto_number = data.zto_number;
                    if (message == "问题已存在：") {
                        $('#create_zto_number_danger').text(message);
                        $('#create_zto_number_danger').append("<a href=\"javascript:void(0);\" id=\"create_zto_number_exist\"></a>");
                        $('#create_zto_number_exist').text(zto_number);
                    } else if (message == "创建成功！") {
                        $('#create_zto_number_result').addClass('text-success').text(message);
                        $('#create_zto_number').val("");
                        $('#createQuestionText').val("");
                    } else {
                        $('#create_zto_number_result').addClass('text-warning').text(message);
                    }

                });
        }

    });


    // service page function
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
                    let number = data.zto_number;
                    let types = data.question_types;
                    let question_text = data.question_text;
                    let quantity = data.quantity;
                    $('#waiting-orders-quantity').text(quantity);
                    $('#orderModalNumber').text(number);
                    $('#orderModalQuestionType').text(types);
                    $('#orderModalQuestionText').text(question_text);
                    $('#order-modal').modal();
                }
            }
        )

    });
}

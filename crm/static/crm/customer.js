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

                    switch (this.orders[n].question_types) {
                        case "LJ":
                            this.orders[n].question_types = "拦截";
                            break;
                        case "GDZ":
                            this.orders[n].question_types = "改地址";
                            break;
                        case "CP":
                            this.orders[n].question_types = "催派";
                            break;
                        case "YW":
                            this.orders[n].question_types = "延误";
                            break;
                        case "ZL":
                            this.orders[n].question_types = "查询重量";
                            break;
                        case "YS":
                            this.orders[n].question_types = "遗失";
                            break;

                    }
                    let t = this.orders[n].create_time;
                    this.orders[n].create_time = t.substr(0, 10) + " " + t.substr(11, 8);
                    switch (this.orders[n].order_status) {
                        case 1:
                            this.waiting.push(this.orders[n]);
                            break;
                        case 2:
                            this.processing.push(this.orders[n]);
                            break;
                        case 3:
                            this.finish.push(this.orders[n]);
                            break;
                        case 4:
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
    if($('#create_zto_number').val().length != 14 ){
        $('#create_zto_number_danger').text("快递单号错误！");
    }
    else if ($('#createQuestionText').val() == ''){
        $('#create_zto_number_danger').text('问题描述不能为空！');
    }
    else{
        $.post(
        "/crm/api/orders/",
        {
            'action': 'create',
            'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
            'zto_number': $('#create_zto_number').val(),
            'question_types': $('input[name="questionTypes"]:checked').val(),
            'question_text': $('#createQuestionText').val(),
        },
        function(data){
            let message = data.message;
            let zto_number = data.zto_number;
            if(message == "问题已存在："){
                $('#create_zto_number_danger').text(message);
                $('#create_zto_number_danger').append("<a href=\"javascript:void(0);\" id=\"create_zto_number_exist\"></a>");
                $('#create_zto_number_exist').text(zto_number);
            }
            else if (message == "创建成功！"){
                $('#create_zto_number_result').addClass('text-success').text(message);
                $('#create_zto_number').val("");
                $('#createQuestionText').val("");
            }
            else{
                $('#create_zto_number_result').addClass('text-warning').text(message);
            }

        });
    }

});

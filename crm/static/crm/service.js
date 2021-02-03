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
    console.log("按钮被点击！")
    $.post(
        '/crm/api/orders/',
        {
            'action': 'take',
            'csrfmiddlewaretoken': $('[name="csrfmiddlewaretoken"]').val(),
        },
        function(data){
            console.log("post方法被调用")
            let message = data.message;
            if(message == "access denied!"){
                alert('权限异常！');
            }
            else if (message == "null"){
                alert("问题都被处理完了，暂时还没有新问题O(∩_∩)O~~");
                $('#waiting-orders-quantity').text(0);
            }
            else if (message == "success"){
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

})
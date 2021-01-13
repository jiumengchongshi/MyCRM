
let announcements = new Vue({
    el: "#announcements",
    delimiters: ["[[", "]]"],
    data: {
        announcements: []
    },
    mounted: function(){
        this.fetchData();
    },
    methods: {
        fetchData(){
            axios.get("/crm/api/announcements/").then(response=>{
                this.announcements = response.data;
            }), err=>{
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
            return str.substr(0,10) + " " + str.substr(11,8)

        }
    },
})

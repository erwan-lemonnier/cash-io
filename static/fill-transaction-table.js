$(document).ready(function() {
    $.ajax({
        type: 'GET',
        url: 'http://127.0.0.1:8080/api/v0/transactions/get/2014-08'
    }).then(function(data) {
        $('.state-log').append('started<br>')
        $('.state-log').append('got '+data.transactions.length+' rows<br>')
        if(data){
            transactions = data.transactions;
            var len = transactions.length;
            var txt = "";
            if(len > 0){
                for(var i=0;i<len;i++){
                    t = transactions[i]
                    txt += "<tr><td>"+i+"</td><td>"+t.date+"</td><td>"+t.amount+"</td><td>"+t.target+"</td><td>"+t.owner+"</td><td>"+t.category+"</td></tr>";
                }
            }
            if(txt != ""){
                $('.table-content').append(txt);
            }
        }
    });
});
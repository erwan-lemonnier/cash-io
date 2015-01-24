$(document).ready(function() {
    $.ajax({
        url: "http://127.0.0.1:8080/learning/jquery"
    }).then(function(data) {
       $('.greeting-id').append(data.id);
       $('.greeting-content').append(data.content);
    });
});

$(document).ready(function() {
    $.ajax({
        type: 'GET',
        url: 'http://127.0.0.1:8080/transactions/get/2014-12'
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
                    txt += "<tr><td>"+i+"</td><td>"+t.date+"</td><td>"+t.amount+"</td><td>"+t.target+"</td><td>"+t.owner+"</td></tr>";
                }
            }
            if(txt != ""){
                $('.table-content').append(txt);
            }
        }
    });
});
function load_monthly_transactions(year, month) {
    $(document).ready(function() {
        $.ajax({
            type: 'GET',
            url: 'http://127.0.0.1:8080/api/v0/transactions/get/' + year + '-' + month
        }).then(function(data) {
            $('.state-log').append('started<br>')
            $('.state-log').append('got '+data.transactions.length+' rows<br>')
            if(data){
                var transactions = data.transactions;
                var len = transactions.length;
                var txt = "";
                if(len > 0){
                    for(var i=0;i<len;i++){
                        t = transactions[i]
                        txt += "<tr><td>"+i+"</td><td>"+t.date+"</td><td>"+t.amount+"</td><td>"+t.target+"</td><td>"+t.owner+"</td><td>"+t.category+"</td></tr>";
                    }
                }
                if(txt != ""){
                    $('.table-content').empty().append(txt);
                }

                // Build input data for the polar area chart
                var sums = data.categories;
                var chartdata = new Array();
                $('.table-content').empty();
                for (var cat in sums) {
                    amount = sums[cat]
                    $('.table-content').append('checking ' + cat + ' ' + amount + '<br>');
                    if (amount <= 0) {
                        var d = {
                            value: Math.abs(Math.round(amount)),
                            label: cat,
                            color:"#F7464A",
                            highlight:"#F7464A",
                        }
                        chartdata.push(d)
                    }
                }

                var output = '';
                for (var property in chartdata) {
                    output += chartdata[property]['label'] + ': ' + chartdata[property]['value'] +'; ';
                }
                $('.table-content').empty().append('chartdata: ' + output);
                var ctx = $("#monthly_transactions").get(0).getContext("2d");
                var chart = new Chart(ctx).PolarArea(chartdata, {animationSteps : 5});
            }
        });
    });
}
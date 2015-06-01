function load_monthly_transactions(year, month) {
    $(document).ready(function() {
        $.ajax({
            type: 'GET',
            url: 'http://127.0.0.1:8080/api/v0/transactions/get/' + year + '-' + month
        }).then(function(data) {
            if(data){
                // Fill the table with transactions
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

                // Build a linechart showing amount spent for each category
                var sums = data.categories;
                var mylabels = [];
                var mydatas = [];

                var keys = [];
                for (var k in sums) {
                    keys.push(k);
                }
                keys = keys.sort();

                for (var i in keys) {
                    var cat = keys[i];
                    amount = sums[cat];
                    if (amount <= 0) {
                        mylabels.push(cat);
                        mydatas.push(Math.abs(amount));
                    }
                }

                var chartdata = {
                    labels: mylabels,
                    datasets: [
                        {
                            label: "Spent by category",
                            fillColor: "rgba(151,187,205,0.5)",
                            strokeColor: "rgba(151,187,205,0.8)",
                            highlightFill: "rgba(151,187,205,0.75)",
                            highlightStroke: "rgba(151,187,205,1)",
                            data: mydatas,
                        }
                    ],
                }

                var ctx1 = $("#spendings").get(0).getContext("2d");
                var chart1 = new Chart(ctx1).Bar(chartdata, {animationSteps: 1});

                // And a linechart showing the earned vs. spent balance
                balancedata = {
                    labels: ['earned', 'spent'],
                    datasets: [
                        {
                            label: "Balance",
                            fillColor: "rgba(151,187,205,0.5)",
                            strokeColor: "rgba(151,187,205,0.8)",
                            highlightFill: "rgba(151,187,205,0.75)",
                            highlightStroke: "rgba(151,187,205,1)",
                            data: [Math.abs(data.total_earned), Math.abs(data.total_spent)],
                        }
                    ],
                }
                var ctx2 = $("#balance").get(0).getContext("2d");
                var chart2 = new Chart(ctx2).Bar(balancedata, {animationSteps: 1});
            }
        });
    });
}
function set_title(context, title) {
    context.empty().append("<h1>"+title+"</h1>");
}

function show_sum_by_category_chart(context, sum_by_category) {
    // Build a linechart showing amount spent for each category
    var mylabels = [];
    var mydatas = [];

    // Ugly dance to build a sorted array of all category strings
    var keys = [];
    for (var k in sum_by_category) {
        keys.push(k);
    }
    keys = keys.sort();

    // Fill the label and data arrays in order of sorted category
    for (var i in keys) {
        var cat = keys[i];
        amount = sum_by_category[cat];
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

    // Display barchart
    new Chart(context).Bar(chartdata, {animationSteps: 1});
}

function show_balance_chart(context, total_earned, total_spent) {
    // Display a barchart showing the earned vs. spent balance
   balancedata = {
       labels: ['earned/spent'],
        datasets: [
            {
                label: "Balance",
                fillColor: "#46BFBD",
                strokeColor: "#46BFBD",
                highlightFill: "#5AD3D1",
                highlightStroke: "#5AD3D1",
                data: [Math.abs(total_earned)],
            },
            {
                label: "Balance",
                fillColor: "#F7464A",
                strokeColor: "#F7464A",
                highlightFill: "#FF5A5E",
                highlightStroke: "#FF5A5E",
                data: [Math.abs(total_spent)],
            }
       ],
   };
//     balancedata = [
//         {
//             value: Math.abs(total_earned),
//             color: "#46BFBD",
//             highlight: "#5AD3D1",
//             label: "Green",
//         },
//         {
//             value: Math.abs(total_spent),
//             color:"#F7464A",
//             highlight: "#FF5A5E",
//             label: "Red",
//         },
//     ];

    new Chart(context).Bar(balancedata, {animationSteps: 1});
    //new Chart(context).Doughnut(balancedata, {animationSteps: 1});
}

function fill_transaction_table(table, transactions) {
    var len = transactions.length;
    var txt = "";
    if(len > 0){
        for(var i=0;i<len;i++){
            t = transactions[i]
            txt += "<tr><td>"+t.date+"</td><td>"+t.amount+"</td><td>"+t.target+"</td><td>"+t.owner+"</td><td>"+t.category+"</td></tr>";
        }
    }
    if(txt != ""){
        table.empty().append(txt);
    }
}

function load_monthly_transactions(year, month) {
    $(document).ready(function() {
        $.ajax({
            type: 'GET',
            url: 'http://127.0.0.1:8080/api/v0/transactions/get/' + year + '-' + month
        }).then(function(data) {
            set_title($('.page-header'), "Transactions for " + year + "-" + month);
            if(data){
                // Fill the table with transactions
                fill_transaction_table($('.table-content'), data.transactions);

                var ctx1 = $("#spendings").get(0).getContext("2d");
                show_sum_by_category_chart(ctx1, data.categories);

                var ctx2 = $("#balance").get(0).getContext("2d");
                show_balance_chart(ctx2, data.total_earned, data.total_spent);
            }
        });
    });
}
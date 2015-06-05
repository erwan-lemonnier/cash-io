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

function show_balance_chart(elem_name, total_earned, total_spent) {

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Type');
    data.addColumn('number', 'Amount');
    data.addRows([
        ['Earned', Math.abs(total_earned)],
        ['Spent', Math.abs(total_spent)],
    ]);

    var options = {'title':'Earned/Spent'};
    var chart = new google.visualization.PieChart(document.getElementById(elem_name));
    chart.draw(data, options);
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

function show_repartition_by_year(elem_name, year, sum_by_category) {
    titles = ["Year"]
    values = [year]
    for(var cat in sum_by_category) {
        titles.push(cat);
        values.push(sum_by_category[cat]);
    }

    var data = google.visualization.arrayToDataTable([titles, values]);

    //TODO: set colors to fix values, in same order as categories, to assign color to cats
    var options = {
        title: 'Spendings by year',
        isStacked: true,
        connectSteps: false,
        legend: {
            //position: 'bottom',
            position: 'top',
            maxLines: 5,
        },
        height: 1000,
        vAxis: {
            title: 'Money spent',
            format: 'currency',
        }
    };

    var chart = new google.visualization.SteppedAreaChart(document.getElementById(elem_name));
    chart.draw(data, options);
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

                show_balance_chart('chart_balance', data.total_earned, data.total_spent);
            }
        });
    });
}

function load_yearly_transactions(year) {
    $(document).ready(function() {
        $.ajax({
            type: 'GET',
            url: 'http://127.0.0.1:8080/api/v0/transactions/get/' + year
        }).then(function(data) {
            set_title($('.page-header'), year);
            if(data){
                show_repartition_by_year('repartition', year, data.categories);

                var ctx1 = $("#spendings").get(0).getContext("2d");
                show_sum_by_category_chart(ctx1, data.categories);

                show_balance_chart('chart_balance', data.total_earned, data.total_spent);
            }
        });
    });
}

function load_many_years_transactions(years) {
    //load_yearly_transactions(years[0]);
    set_title($('.page-header'), years);
    // TODO: and now, get transactions for multiple years in one shot!!
    // see http://stackoverflow.com/questions/17719344/multiple-rest-calls-best-practise
}
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

function show_repartition_by_year(elem_name, sum_by_category_by_year) {

    var datatable = [];

    // We need to convert a hash of hash table into a matrix...

    // List all categories across multiple sum_by_category/year
    // all_categories is a hash of category to unique index
    category_names = [];
    category_to_index = {};
    for(var year in sum_by_category_by_year) {
        sum_by_category = sum_by_category_by_year[year];
        index = 0;
        for(var cat in sum_by_category) {
            set_title($('.page-header'), "setting cat" + cat);
            if (cat in category_to_index) {
                // pass
            } else {
                category_to_index[cat] = index;
                category_names.push(cat);
                index = index + 1;
            }
        }
    }

    //set_title($('.page-header'), "categories: " + all_categories);

    // Fill a default row in datatable with zeroes
    zeroed_row = []
    for(var j in category_to_index) {
        zeroed_row.push(0);
    }

    // Category names
    titles = ["Year"];
    for (var i in category_names) {
        titles.push(category_names[i]);
    }

    datatable = [];
    datatable.push(titles);

    // Fill datatable year by year
    for(var year in sum_by_category_by_year) {
        sum_by_category = sum_by_category_by_year[year];
        year_row = [year];
        year_row = year_row.concat(zeroed_row);
        for(var cat in sum_by_category) {
            i = category_to_index[cat];
            year_row[i] = sum_by_category[cat]
        }
    }

    var data = google.visualization.arrayToDataTable(datatable);

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
                sums_by_year = {};
                sums_by_year[year] = data.categories;
                show_repartition_by_year('repartition', sums_by_year);

                var ctx1 = $("#spendings").get(0).getContext("2d");
                show_sum_by_category_chart(ctx1, data.categories);

                show_balance_chart('chart_balance', data.total_earned, data.total_spent);
            }
        });
    });
}

function load_many_years_transactions(years) {
    var calls = [];

    yearly_data = {};
    for(var i in years) {
        if(years[i] != "") {
            var call = $.ajax({
                type: 'GET',
                url: 'http://127.0.0.1:8080/api/v0/transactions/get/' + years[i],
            }).then(function(data) {
                if(data){
                    yearly_data[years[i]] = data.categories;
                }
            });

            calls.push(call);
        }
    }

    $.when.apply($, calls).done(function() {
        show_repartition_by_year('repartition', yearly_data);
    });
}

function assign_target_category(cleantarget, category, id) {
    // TODO: resetting categories in html page fails, maybe because id field contains spaces?
    $("."+id).empty().append(category)
    // TODO: implement rest api call and use it
}
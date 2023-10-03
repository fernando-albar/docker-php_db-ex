storedData = []

document.getElementById("mapg-search-by-range-btn").addEventListener("click", function () {
    if (($("#mapg-startDate-first").val() >= $("#mapg-finalDate-first").val())) {
        $(".message-top-center").text("Invalid dates");
        $("#message").addClass('faceinout');
    } else {
        $(".content-header").addClass('invisible')
        $(".content-body").addClass('invisible')
        $(".loading-container").removeClass('d-none')
        $("canvas").remove();
        $("#power-legend").remove();
        $("#rotor-legend").remove();
        $('#wsd-legend').remove();
        $('#ws-legend').remove();
        $('#power').append("<canvas id='power-graph'></canvas>")
        $('#rotor').append("<canvas id='rotorSpeed-graph'></canvas>")
        $('#mp-graph-wsDistribution').append("<canvas id='wsDistribution-graph'></canvas>")
        $('#mp-graph-windSpeed').append("<canvas id='windSpeed-graph'></canvas>")
        loadPerformanceMachineGraph($("#mapg-startDate-first").val(), $("#mapg-finalDate-first").val());
    }
});

$('#wtg').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#wf').text(WINDFARM.name)

$('#wf').click(function(){
    pageChange('windfarm')
})

document.getElementById("mapg-range-comparer-btn").addEventListener("click", function () {
    if (($("#mapg-startDate-first").val() >= $("#mapg-finalDate-first").val() || $("#mapg-startDate-second").val() >= $("#mapg-finalDate-second").val())) {
        $(".message-top-center").text("Invalid dates");
        $("#message").addClass('faceinout');
    } else {
        $("#mapg-range-comparer-btn .text").addClass("d-none");
        $("#mapg-range-comparer-btn .load-btn").removeClass("d-none");
        $("canvas").remove();
        $("#power-legend").remove();
        $("#rotor-legend").remove();
        $('#wsd-legend').remove();
        $('#ws-legend').remove();
        $('#power').append("<canvas id='power-graph'></canvas>")
        $('#rotor').append("<canvas id='rotorSpeed-graph'></canvas>")
        $('#mp-graph-wsDistribution').append("<canvas id='wsDistribution-graph'></canvas>")
        $('#mp-graph-windSpeed').append("<canvas id='windSpeed-graph'></canvas>")
        compareRanges($("#mapg-startDate-first").val(), $("#mapg-finalDate-first").val(), $("#mapg-startDate-second").val(), $("#mapg-finalDate-second").val());
    }
});

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

today = yyyy + '-' + mm + '-' + dd;

$('#mapg-startDate-first').attr('max', today)
$('#mapg-finalDate-first').attr('max', today)
$('#mapg-startDate-second').attr('max', today)
$('#mapg-finalDate-second').attr('max', today)

var myChartP;
function loadPerformanceMachineGraph(startdate, finaldate) {
    //Clear and show performance graphs
    $("#machines-compared-graphs").empty();
    //Gets graphs info for each machine

    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': WINDFARM.idPark, 'machine': MACHINE, 'startdate': startdate, 'finaldate': finaldate },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            //Creates a graph for each type
            json.forEach(component => {
                if(component.comp != 'original_power' && component.comp != 'original_rotorSpeed'){
                    let id = component.comp+'-graph';
                    var invisible = ""
                    if (component.comp == 'wsDistribution') {
                        invisible = ' invisible'
                    }

                    storedData[id] = [];
                    
                    if (component.comp == 'wsDistribution') {
                        storedData[id][component.comp] = component.values;
                        var myChartD = new Chart(document.getElementById(id), {
                            type: 'bar',
                            data: {
                                labels: Object.keys(component.values),
                                datasets: [{
                                    backgroundColor: '#FDA872',
                                    data: Object.values(component.values),
                                    borderRadius: 5,
                                }]
                            },
                            options: {
                                plugins: {
                                    legend: { display: false }
                                },
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Wind speed [m/s]'
                                        }
                                    },
                                    y: {
                                        title: {
                                            display: true,
                                            text: 'Counts'
                                        }
                                    }
                                }
                            }
                        });

                    } else if (component.comp == 'windSpeed') {
                        storedData[id][component.comp] = $.parseJSON("[" + component.values + "]");
                        var myChartW = new Chart(document.getElementById(id), {
                            plugins: [{
                                afterDraw: chart => {
                                    if (chart.tooltip?._active?.length) {
                                        let x = chart.tooltip._active[0].element.x;
                                        let yAxis = chart.scales.y;
                                        let ctx = chart.ctx;
                                        ctx.save();
                                        ctx.beginPath();
                                        ctx.moveTo(x, yAxis.top);
                                        ctx.lineTo(x, yAxis.bottom);
                                        ctx.lineWidth = 1;
                                        ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
                                        ctx.stroke();
                                        ctx.restore();
                                    }
                                }
                            }],
                            type: 'line',
                            data: {
                                datasets: [
                                    {
                                        label: 'Wind Speed',
                                        pointRadius: 1,
                                        fill: false,
                                        borderColor: '#FDA872',
                                        backgroundColor: '#FDA872',
                                        data: $.parseJSON("[" + component.values + "]")
                                    }
                                ]
                            },
                            options: {
                                elements: {
                                    line: {
                                        tension: .1
                                    }
                                },
                                plugins: {
                                    legend: { display: false },
                                    zoom: {
                                        zoom: {
                                            drag: {
                                                enabled: true,
                                                animationDuration: 1000,
                                                borderColor: 'rgba(225,225,225,0.3)',
                                                borderWidth: 5,
                                                backgroundColor: 'rgb(225,225,225)'
                                            },
                                            mode: 'x',
                                            onZoomComplete() {
                                                $("#windSpeed-graph-reset").show()
                                              }
                                        }
                                    }
                                },
                                title: {
                                    display: false
                                },
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        type: 'time',
                                        time: {
                                            displayFormats: {
                                                'millisecond': 'MMM dd',
                                                'second': 'MMM dd',
                                                'minute': 'MMM dd',
                                                'hour': 'MMM dd',
                                                'day': 'MMM dd',
                                                'week': 'MMM dd',
                                                'month': 'MMM dd',
                                                'quarter': 'MMM dd',
                                                'year': 'MMM dd',
                                            }
                                        }
                                    },
                                    y: {
                                        title: {
                                            display: true,
                                            text: 'Wind speed [m/s]'
                                        }
                                    }
                                }
                            }
                        });
                        document.getElementById(id + "-reset").addEventListener("click", () => {
                            myChartW.resetZoom();
                            $("#windSpeed-graph-reset").hide()
                        })

                    } else{
                        values = $.parseJSON("[" + component.values + "]");
                        values.sort(function (a, b) {
                            return parseFloat(a.x) - parseFloat(b.x);
                        });
    
                        var last = null;
                        var ad = [];
                        var avg = [];
                        values.forEach(s => {
                            var x = Math.round(s.x)
                            if (last != null && x != last) {
                                avg.push({ x: x - 0.5, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                                ad = [];
                                ad.push(s.y);
                            }
                            ad.push(s.y);
                            last = x;
                        });
                        storedData[id][component.comp] = avg;
    
                        var xlabel = 'Wind speed [m/s]';
                        if (component.comp == 'rotorSpeed') {
                            xlabel = 'Angular rotor speed [rpm]';
                        }
                        if(id == 'power-graph'){

                            $.ajax({
                                url: 'php/getData.php',
                                data: { 'callFunc': 'getPowerCurveModels', 'model': TURBINEMODEL},
                                type: 'POST',
                                dataType: 'json',
                                async: true,
                        
                                success: function (json) {
                                    array_power_curve = []
                                    json.forEach(result => {
                                        array_power_curve.push({x: result['wind_speed'], y: result['power']})
                                    });  
                                },

                                error: function (xhr, status) {
                                    console.log('There is an error -> ' + xhr.responseText);
                                    //window.location.href = "Error";
                                }
                            });



                            myChartP = new Chart(document.getElementById(id), {
                                plugins: [{
                                    afterDraw: chart => {
                                        if (chart.tooltip?._active?.length) {
                                            let x = chart.tooltip._active[0].element.x;
                                            let yAxis = chart.scales.y;
                                            let ctx = chart.ctx;
                                            ctx.save();
                                            ctx.beginPath();
                                            ctx.moveTo(x, yAxis.top);
                                            ctx.lineTo(x, yAxis.bottom);
                                            ctx.lineWidth = 1;
                                            ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
                                            ctx.stroke();
                                            ctx.restore();
                                        }
                                    }
                                }],
                                data: {
                                    datasets: [
                                        {
                                            type: 'line',
                                            label: 'OEM',
                                            data: array_power_curve,
                                            pointRadius: 0,
                                            borderColor: '#262840',
                                            backgroundColor: '#262840',
                                            fill: false
                                        },
                                        {
                                        type: 'line',
                                        label: 'Average',
                                        data: avg,
                                        pointRadius: 0,
                                        borderColor: '#9798B1',
                                        backgroundColor: '#9798B1',
                                        fill: false
                                    },
                                    {
                                        type: 'scatter',
                                        label: 'Data',
                                        data: $.parseJSON("[" + component.values + "]"),
                                        backgroundColor: '#FDA872'
                                    }]
                                },
                                options: {
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            display: false
                                        },
                                        zoom: {
                                            zoom: {
                                                drag: {
                                                    enabled: true,
                                                    animationDuration: 1000,
                                                    borderColor: 'rgba(225,225,225,0.3)',
                                                    borderWidth: 5,
                                                    backgroundColor: 'rgb(225,225,225)'
                                                },
                                                mode: 'x',
                                                onZoomComplete() {
                                                    $("#power-graph-reset").show()
                                                  }
                                            }
                                        }
                                    },
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: {
                                            type: 'linear',
                                            title: {
                                                display: true,
                                                text: xlabel
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Power [kW]'
                                            }
                                        }
                                    }
                                }
                            });
                        }

                        if(id == 'rotorSpeed-graph'){
                            var myChartR = new Chart(document.getElementById(id), {
                                plugins: [{
                                    afterDraw: chart => {
                                        if (chart.tooltip?._active?.length) {
                                            let x = chart.tooltip._active[0].element.x;
                                            let yAxis = chart.scales.y;
                                            let ctx = chart.ctx;
                                            ctx.save();
                                            ctx.beginPath();
                                            ctx.moveTo(x, yAxis.top);
                                            ctx.lineTo(x, yAxis.bottom);
                                            ctx.lineWidth = 1;
                                            ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
                                            ctx.stroke();
                                            ctx.restore();
                                        }
                                    }
                                }],
                                data: {
                                    datasets: [{
                                        type: 'line',
                                        label: 'Average',
                                        data: avg,
                                        pointRadius: 0,
                                        borderColor: '#9798B1',
                                        backgroundColor: '#9798B1',
                                        fill: false
                                    },
                                    {
                                        type: 'scatter',
                                        label: 'Data',
                                        data: $.parseJSON("[" + component.values + "]"),
                                        backgroundColor: '#FDA872'
                                    }]
                                },
                                options: {
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            display: false
                                        },
                                        zoom: {
                                            zoom: {
                                                drag: {
                                                    enabled: true,
                                                    animationDuration: 1000,
                                                    borderColor: 'rgba(225,225,225,0.3)',
                                                    borderWidth: 5,
                                                    backgroundColor: 'rgb(225,225,225)'
                                                },
                                                mode: 'x',
                                                onZoomComplete() {
                                                    $("#rotorSpeed-graph-reset").show()
                                                  }
                                            }
                                        }
                                    },
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        x: {
                                            type: 'linear',
                                            title: {
                                                display: true,
                                                text: xlabel
                                            }
                                        },
                                        y: {
                                            title: {
                                                display: true,
                                                text: 'Power [kW]'
                                            }
                                        }
                                    }
                                }
                            });
                        }

                        if(id == 'power-graph'){
                            $('#power').append("<div class='graph-legend' id='power-legend'><div id='legend-OEM'><img src='images/icons/check_box.svg' alt='' value=0><span>OEM</span></div><div id='legend-scada-avg'><img src='images/icons/check_box.svg' alt='' value=1><span>Scada AVG</span></div><div id='legend-scada'><img src='images/icons/check_box.svg' alt='' value=2><span>Scada</span></div></div>")

                            if(myChartP.data.datasets[0].type == 'scatter'){
                                $('#power-legend> #legend-scada-avg > span').css('border-bottom', 'dotted');
                            }
                            if(myChartP.data.datasets[1].type == 'scatter'){
                                $('#power-legend> #legend-scada > span').css('border-bottom', 'dotted');
                            }

                            $('#power-legend> #legend-OEM > span').css('border-bottom-color', myChartP.data.datasets[0].borderColor);
                            $('#power-legend> #legend-scada-avg > span').css('border-bottom-color', myChartP.data.datasets[1].borderColor);
                            $('#power-legend> #legend-scada > span').css('border-bottom-color', myChartP.data.datasets[2].backgroundColor);

                            
                            document.getElementById(id + "-reset").addEventListener("click", () => {
                                myChartP.resetZoom();
                                $("#power-graph-reset").hide()
                            })

                            $('#power-legend > div > img').click(function(){
                                var src = ($(this).attr("src") === "images/icons/check_box.svg")
                                ? "images/icons/empty_box.svg" 
                                : "images/icons/check_box.svg";
                                $(this).attr("src", src);
                                toggleData($(this).attr('value'), myChartP)
                            })
                    
                        
                        }
                        if(id == 'rotorSpeed-graph'){
                            $('#rotor').append("<div class='graph-legend' id='rotor-legend'><div id='legend-scada-avg'><img src='images/icons/check_box.svg' alt='' value=0><span>Scada AVG</span></div><div id='legend-scada'><img src='images/icons/check_box.svg' alt='' value=1><span>Scada</span></div></div>")
                            
                            if(myChartR.data.datasets[0].type == 'scatter'){
                                $('#rotor-legend> #legend-scada-avg > span').css('border-bottom', 'dotted');
                            }
                            if(myChartR.data.datasets[1].type == 'scatter'){
                                $('#rotor-legend> #legend-scada > span').css('border-bottom', 'dotted');
                            }

                            $('#rotor-legend> #legend-scada-avg > span').css('border-color', myChartR.data.datasets[0].borderColor);
                            $('#rotor-legend> #legend-scada > span').css('border-color', myChartR.data.datasets[1].backgroundColor);


                            document.getElementById(id + "-reset").addEventListener("click", () => {
                                myChartR.resetZoom();
                                $("#rotorSpeed-graph-reset").hide()
                            })

                            $('#rotor-legend > div > img').click(function(){
                                var src = ($(this).attr("src") === "images/icons/check_box.svg")
                                ? "images/icons/empty_box.svg" 
                                : "images/icons/check_box.svg";
                                $(this).attr("src", src);
                                toggleData($(this).attr('value'), myChartR)
                            })
                        }

                    }                  
                }
            })

/*             var myChart2 = new Chart(document.getElementById("graph-mp-graph-realpoweroutput-"+ machine.number), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Energy production',
                            data: [],
                            borderColor: '#ff8000',
                            backgroundColor: '#ff8000',
                            type: 'line',
                            pointRadius: 6,
                            borderWidth: 4,
                            pointStyle: 'rectRot'
                        }
                    ]
                },
                options: {
                    plugins: {
                        legend: {
                            position: 'bottom',
                            display: false
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Turbine'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Energy [GWh]'
                            }
                        }
                    }
                }
            });

            $.ajax({
                url: 'php/getData.php',
                data: { 'callFunc': 'getKpis', 'windFarm': WINDFARM.idPark, 'machine': machine.number, 'range': 0 },
                type: 'POST',
                dataType: 'json',
                async: false,
            
                success: function (json) {
                    myChart2.data.labels.push("WTG" + machine.number)
                    myChart2.data.datasets[0].data.push(parseFloat(json.production))
                    myChart2.update()
                },
            
                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText)
                    //window.location.href = "Error"
                }
            })

            //On load finish hide loading container
            if(machine.number == MACHINE[MACHINE.length - 1].number){
                $(".content-header").removeClass('invisible')
                $(".content-body").removeClass('invisible')
                $(".loading-container").addClass('d-none')
            } */

        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}


function compareRanges(startDate1, finalDate1, startDate2, finalDate2) {
    var myChart;
    var myChart2;
    var myChart3;
    var myChart4;
    //Clear and show comparison graphs
/*     $("#machines-comparer-graphs").empty();
    $("#machines-comparer-container").removeClass('d-none') */
    //Gets data of the first range
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': WINDFARM.idPark, 'machine': MACHINE, 'startdate': startDate1, 'finaldate': finalDate1 },
        type: 'POST',
        dataType: 'json',

        success: function (range1) {
            //Gets data of the second range
            $.ajax({
                url: 'php/getDashboardData.php',
                data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': WINDFARM.idPark, 'machine': MACHINE, 'startdate': startDate2, 'finaldate': finalDate2 },
                type: 'POST',
                dataType: 'json',

                success: function (range2) {
                    //Generate graphs for all the data of the two ranges
/*                     let graphName = 'mp-graph-comparison-power-wtg' + MACHINE[0].number;
                    var cardName = 'Power Curve: ' + WINDFARM.idPark + "-" + MACHINE[0].number; */
/*                     $(".machines-comparer-graphs").append('<!-- Card -->'
                        +'<div id="' + graphName + '-graph" class="w-50"><div class="card m-1">'
                        +'    <!-- Card header -->'
                        +'    <div class="card-header d-flex space-between align-center">'
                        +'        <h6 class="w-66">' + cardName + '</h6>'
                        +"        <div class='w-33'><button id='"+ graphName + "-reset' class='btn btn-primary graph_refresh_btn f-right cursor-pointer'><svg class='bi' width='28' height='28' fill='currentColor'><use xlink:href='images/icons/bootstrap-icons.svg#arrow-repeat'></use></svg></button></div>"
                        +'    </div>'
                        +'    <!-- Card body -->'
                        +'    <div class="card-body pr-1 pl-1">'
                        + '     <canvas id="'+ graphName +'" width="400" height="400"></canvas>'
                        +'    </div>'
                        +'</div></div>'); */

                    values = $.parseJSON("[" + range1[0].values[0] + "]");
                    values.sort(function (a, b) {
                        return parseFloat(a.x) - parseFloat(b.x);
                    });

                    var last = null;
                    var ad = [];
                    var avg1 = [];
                    values.forEach(s => {
                        var x = Math.round(s.x)
                        if (last != null && x != last) {
                            avg1.push({ x: x - 0.5, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                            ad = [];
                            ad.push(s.y);
                        }
                        ad.push(s.y);
                        last = x;
                    });

                    values = $.parseJSON("[" + range2[0].values[0] + "]");
                    values.sort(function (a, b) {
                        return parseFloat(a.x) - parseFloat(b.x);
                    });

                    last = null;
                    ad = [];
                    var avg2 = [];
                    values.forEach(s => {
                        var x = Math.round(s.x)
                        if (last != null && x != last) {
                            avg2.push({ x: x - 0.5, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                            ad = [];
                            ad.push(s.y);
                        }
                        ad.push(s.y);
                        last = x;
                    });

                    myChart = new Chart(document.getElementById('power-graph'), {
                        plugins: [{
                            afterDraw: chart => {
                                if (chart.tooltip?._active?.length) {
                                    let x = chart.tooltip._active[0].element.x;
                                    let yAxis = chart.scales.y;
                                    let ctx = chart.ctx;
                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.moveTo(x, yAxis.top);
                                    ctx.lineTo(x, yAxis.bottom);
                                    ctx.lineWidth = 1;
                                    ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
                                    ctx.stroke();
                                    ctx.restore();
                                }
                            }
                        }],
                        data: {
                            datasets: [{
                                type: 'line',
                                label: 'Range 1',
                                data: avg1,
                                pointRadius: 0,
                                borderColor: 'rgb(255, 128, 0)',
                                backgroundColor: 'rgb(255, 128, 0)',
                                fill: false
                            },
                            {
                                type: 'line',
                                label: 'Range 2',
                                data: avg2,
                                pointRadius: 0,
                                borderColor: '#262840',
                                backgroundColor: '#262840',
                                fill: false
                            }]
                        },
                        options: {
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    display: false
                                },
                                zoom: {
                                    zoom: {
                                        drag: {
                                            enabled: true,
                                            animationDuration: 1000,
                                            borderColor: 'rgba(225,225,225,0.3)',
                                            borderWidth: 5,
                                            backgroundColor: 'rgb(225,225,225)'
                                        },
                                        mode: 'x',
                                        onZoomComplete() {
                                            $("#power-graph-reset").show()
                                          }
                                    }
                                }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    type: 'linear',
                                    title: {
                                        display: true,
                                        text: 'Wind speed [m/s]'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Power [kW]'
                                    }
                                }
                            }
                        }
                    });

                    $('#power').append("<div class='graph-legend' id='power-legend'><div id='legend-scada-avg'><img src='images/icons/check_box.svg' alt='' value=0><span>Range 1</span></div><div id='legend-scada'><img src='images/icons/check_box.svg' alt='' value=1><span>Range 2</span></div></div>")
                    $('#power-legend> #legend-scada-avg > span').css('border-color', myChart.data.datasets[0].borderColor);
                    $('#power-legend> #legend-scada > span').css('border-color', myChart.data.datasets[1].backgroundColor);
        
                    if(myChart.data.datasets[0].type == 'scatter'){
                        $('#power-legend> #legend-scada-avg > span').css('border-bottom', 'dotted');
                    }
                    if(myChart.data.datasets[1].type == 'scatter'){
                        $('#power-legend> #legend-scada > span').css('border-bottom', 'dotted');
                    }
        
                    $('#power-legend > div > img').click(function(){
                        var src = ($(this).attr("src") === "images/icons/check_box.svg")
                        ? "images/icons/empty_box.svg" 
                        : "images/icons/check_box.svg";
                        $(this).attr("src", src);
                        toggleData($(this).attr('value'), myChart)
                    })
                    document.getElementById("power-graph-reset").addEventListener("click", () => {
                        myChart.resetZoom();
                        $("#power-graph-reset").hide()
                    })

/*                     graphName = 'mp-graph-comparison-rotorSpeed-wtg' + MACHINE[0].number;
                    cardName = 'Angular rotor Speed: ' + WINDFARM.idPark + "-" + MACHINE[0].number; */
/*                     $(".machines-comparer-graphs").append('<!-- Card -->'
                        +'<div id="' + graphName + '-graph" class="w-50"><div class="card m-1">'
                        +'    <!-- Card header -->'
                        +'    <div class="card-header d-flex space-between align-center">'
                        +'        <h6 class="w-66">' + cardName + '</h6>'
                        +"        <div class='w-33'><button id='"+ graphName + "-reset' class='btn btn-primary graph_refresh_btn f-right cursor-pointer'><svg class='bi' width='28' height='28' fill='currentColor'><use xlink:href='images/icons/bootstrap-icons.svg#arrow-repeat'></use></svg></button></div>"
                        +'    </div>'
                        +'    <!-- Card body -->'
                        +'    <div class="card-body pr-1 pl-1">'
                        + '     <canvas id="'+ graphName +'" width="400" height="400"></canvas>'
                        +'    </div>'
                        +'</div></div>'); */

                    values = $.parseJSON("[" + range1[1].values[0] + "]");
                    values.sort(function (a, b) {
                        return parseFloat(a.x) - parseFloat(b.x);
                    });

                    last = null;
                    ad = [];
                    avg1 = [];
                    values.forEach(s => {
                        var x = Math.round(s.x)
                        if (last != null && x != last) {
                            avg1.push({ x: x - 0.5, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                            ad = [];
                            ad.push(s.y);
                        }
                        ad.push(s.y);
                        last = x;
                    });

                    values = $.parseJSON("[" + range2[1].values[0] + "]");
                    values.sort(function (a, b) {
                        return parseFloat(a.x) - parseFloat(b.x);
                    });

                    last = null;
                    ad = [];
                    avg2 = [];
                    values.forEach(s => {
                        var x = Math.round(s.x)
                        if (last != null && x != last) {
                            avg2.push({ x: x - 0.5, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                            ad = [];
                            ad.push(s.y);
                        }
                        ad.push(s.y);
                        last = x;
                    });

                    myChart2 = new Chart(document.getElementById('rotorSpeed-graph'), {
                        plugins: [{
                            afterDraw: chart => {
                                if (chart.tooltip?._active?.length) {
                                    let x = chart.tooltip._active[0].element.x;
                                    let yAxis = chart.scales.y;
                                    let ctx = chart.ctx;
                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.moveTo(x, yAxis.top);
                                    ctx.lineTo(x, yAxis.bottom);
                                    ctx.lineWidth = 1;
                                    ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
                                    ctx.stroke();
                                    ctx.restore();
                                }
                            }
                        }],
                        data: {
                            datasets: [{
                                type: 'line',
                                label: 'Range 1',
                                data: avg1,
                                pointRadius: 0,
                                borderColor: '#FDA872',
                                backgroundColor: '#FDA872',
                                fill: false
                            },
                            {
                                type: 'line',
                                label: 'Range 2',
                                data: avg2,
                                pointRadius: 0,
                                borderColor: '#262840',
                                backgroundColor: '#262840',
                                fill: false
                            }]
                        },
                        options: {
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    display: false
                                },
                                zoom: {
                                    zoom: {
                                        drag: {
                                            enabled: true,
                                            animationDuration: 1000,
                                            borderColor: 'rgba(225,225,225,0.3)',
                                            borderWidth: 5,
                                            backgroundColor: 'rgb(225,225,225)'
                                        },
                                        mode: 'x',
                                        onZoomComplete() {
                                            $("#rotorSpeed-graph-reset").show()
                                          }
                                    }
                                }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    type: 'linear',
                                    title: {
                                        display: true,
                                        text: 'Angular rotor speed [rpm]'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Power [kW]'
                                    }
                                }
                            }
                        }
                    });

                    $('#rotor').append("<div class='graph-legend' id='rotor-legend'><div id='legend-scada-avg'><img src='images/icons/check_box.svg' alt='' value=0><span>Range 1</span></div><div id='legend-scada'><img src='images/icons/check_box.svg' alt='' value=1><span>Range 2</span></div></div>")
                    $('#rotor-legend> #legend-scada-avg > span').css('border-color', myChart2.data.datasets[0].borderColor);
                    $('#rotor-legend> #legend-scada > span').css('border-color', myChart2.data.datasets[1].backgroundColor);
        
                    if(myChart2.data.datasets[0].type == 'scatter'){
                        $('#rotor-legend> #legend-scada-avg > span').css('border-bottom', 'dotted');
                    }
                    if(myChart2.data.datasets[1].type == 'scatter'){
                        $('#rotor-legend> #legend-scada > span').css('border-bottom', 'dotted');
                    }
        
                    $('#rotor-legend > div > img').click(function(){
                        var src = ($(this).attr("src") === "images/icons/check_box.svg")
                        ? "images/icons/empty_box.svg" 
                        : "images/icons/check_box.svg";
                        $(this).attr("src", src);
                        toggleData($(this).attr('value'), myChart2)
                    })

                    document.getElementById("rotorSpeed-graph-reset").addEventListener("click", () => {
                        myChart2.resetZoom();
                        $("#rotorSpeed-graph-reset").hide()
                    })

/*                     graphName = 'mp-graph-comparison-wsDistribution-wtg' + MACHINE[0].number;
                    cardName = 'Wind Speed Distibution: ' + WINDFARM.idPark + "-" + MACHINE[0].number; */
/*                     $(".machines-comparer-graphs").append('<!-- Card -->'
                        +'<div id="' + graphName + '-graph" class="w-50"><div class="card m-1">'
                        +'    <!-- Card header -->'
                        +'    <div class="card-header d-flex space-between align-center">'
                        +'        <h6 class="w-66">' + cardName + '</h6>'
                        +"        <div class='w-33'><button id='"+ graphName + "-reset' class='btn btn-primary invisible graph_refresh_btn f-right cursor-pointer'><svg class='bi' width='28' height='28' fill='currentColor'><use xlink:href='images/icons/bootstrap-icons.svg#arrow-repeat'></use></svg></button></div>"
                        +'    </div>'
                        +'    <!-- Card body -->'
                        +'    <div class="card-body pr-1 pl-1">'
                        + '     <canvas id="'+ graphName +'" width="400" height="400"></canvas>'
                        +'    </div>'
                        +'</div></div>'); */
                    
                    myChart3 = new Chart(document.getElementById('wsDistribution-graph'), {
                        type: 'bar',
                        data: {
                            labels: Object.keys(range1[4].values),
                            datasets: [{
                                label: 'Range 1',
                                labels: Object.keys(range1[4].values),
                                backgroundColor: '#FDA872',
                                data: Object.values(range1[4].values),
                                borderRadius: 5,
                            },
                            {
                                label: 'Range 2',
                                labels: Object.keys(range2[4].values),
                                backgroundColor: '#262840',
                                data: Object.values(range2[4].values),
                                borderRadius: 5,
                            }]
                        },
                        options: {
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    display: false
                                }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Wind speed [m/s]'
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Counts'
                                    }
                                }
                            }
                        }
                    });

                    $('#mp-graph-wsDistribution').append("<div class='graph-legend' id='wsd-legend'><div id='legend-scada-avg'><img src='images/icons/check_box.svg' alt='' value=0><span>Range 1</span></div><div id='legend-scada'><img src='images/icons/check_box.svg' alt='' value=1><span>Range 2</span></div></div>")
                    $('#wsd-legend > #legend-scada-avg > span').css('border-color', myChart3.data.datasets[0].backgroundColor);
                    $('#wsd-legend > #legend-scada > span').css('border-color', myChart3.data.datasets[1].backgroundColor);
        
                    if(myChart3.data.datasets[0].type == 'scatter'){
                        $('#wsd-legend > #legend-scada-avg > span').css('border-bottom', 'dotted');
                    }
                    if(myChart3.data.datasets[1].type == 'scatter'){
                        $('#wsd-legend > #legend-scada > span').css('border-bottom', 'dotted');
                    }

        
                    $('#wsd-legend > div > img').click(function(){
                        var src = ($(this).attr("src") === "images/icons/check_box.svg")
                        ? "images/icons/empty_box.svg" 
                        : "images/icons/check_box.svg";
                        $(this).attr("src", src);
                        toggleData($(this).attr('value'), myChart3)
                    })

/*                     graphName = 'mp-graph-comparison-windSpeed-wtg' + MACHINE[0].number;
                    cardName = 'Wind Speed: ' + WINDFARM.idPark + "-" + MACHINE[0].number; */
/*                     $(".machines-comparer-graphs").append('<!-- Card -->'
                        +'<div id="' + graphName + '-graph" class="w-50"><div class="card m-1">'
                        +'    <!-- Card header -->'
                        +'    <div class="card-header d-flex space-between align-center">'
                        +'        <h6 class="w-66">' + cardName + '</h6>'
                        +"        <div class='w-33'><button id='"+ graphName + "-reset' class='btn btn-primary graph_refresh_btn f-right cursor-pointer'><svg class='bi' width='28' height='28' fill='currentColor'><use xlink:href='images/icons/bootstrap-icons.svg#arrow-repeat'></use></svg></button></div>"
                        +'    </div>'
                        +'    <!-- Card body -->'
                        +'    <div class="card-body pr-1 pl-1">'
                        + '     <canvas id="'+ graphName +'" width="400" height="400"></canvas>'
                        +'    </div>'
                        +'</div></div>'); */

                    myChart4 = new Chart(document.getElementById('windSpeed-graph'), {
                        plugins: [{
                            afterDraw: chart => {
                                if (chart.tooltip?._active?.length) {
                                    let x = chart.tooltip._active[0].element.x;
                                    let yAxis = chart.scales.y;
                                    let ctx = chart.ctx;
                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.moveTo(x, yAxis.top);
                                    ctx.lineTo(x, yAxis.bottom);
                                    ctx.lineWidth = 1;
                                    ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)';
                                    ctx.stroke();
                                    ctx.restore();
                                }
                            }
                        }],
                        data: {
                            datasets: [{
                                type: 'line',
                                label: 'Range 1',
                                data: $.parseJSON("[" + range1[5].values + "]"),
                                pointRadius: 0,
                                borderColor: '#FDA872',
                                backgroundColor: '#FDA872',
                                fill: false
                            },
                            {
                                type: 'line',
                                label: 'Range 2',
                                data: $.parseJSON("[" + range2[5].values + "]"),
                                pointRadius: 0,
                                borderColor: '#262840',
                                backgroundColor: '#262840',
                                fill: false
                            }]
                        },
                        options: {
                            elements: {
                                line: {
                                    tension: 0
                                }
                            },
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    display: false
                                },
                                zoom: {
                                    zoom: {
                                        drag: {
                                            enabled: true,
                                            animationDuration: 1000,
                                            borderColor: 'rgba(225,225,225,0.3)',
                                            borderWidth: 5,
                                            backgroundColor: 'rgb(225,225,225)'
                                        },
                                        mode: 'x',
                                        onZoomComplete() {
                                            $("#windSpeed-graph-reset").show()
                                          }
                                    }
                                }
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    type: 'time',
                                    title: {
                                        display: false
                                    },
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Wind speed [m/s]'
                                    }
                                }
                            }
                        }
                    });

                    $('#mp-graph-windSpeed').append("<div class='graph-legend' id='ws-legend'><div id='legend-scada-avg'><img src='images/icons/check_box.svg' alt='' value=0><span>Range 1</span></div><div id='legend-scada'><img src='images/icons/check_box.svg' alt='' value=1><span>Range 2</span></div></div>")
                    $('#ws-legend > #legend-scada-avg > span').css('border-color', myChart4.data.datasets[0].borderColor);
                    $('#ws-legend > #legend-scada > span').css('border-color', myChart4.data.datasets[1].backgroundColor);
        
                    if(myChart4.data.datasets[0].type == 'scatter'){
                        $('#ws-legend > #legend-scada-avg > span').css('border-bottom', 'dotted');
                    }
                    if(myChart4.data.datasets[1].type == 'scatter'){
                        $('#ws-legend > #legend-scada > span').css('border-bottom', 'dotted');
                    }

                    document.getElementById("windSpeed-graph-reset").addEventListener("click", () => {
                        myChart4.resetZoom();
                        $("#windSpeed-graph-reset").hide()
                    })
        
                    $('#ws-legend > div > img').click(function(){
                        var src = ($(this).attr("src") === "images/icons/check_box.svg")
                        ? "images/icons/empty_box.svg" 
                        : "images/icons/check_box.svg";
                        $(this).attr("src", src);
                        toggleData($(this).attr('value'), myChart4)
                    })

/*                     document.getElementById(graphName + "-reset").addEventListener("click", () => {
                        myChart4.resetZoom();
                    }) */

                    $(".load-btn").addClass('d-none')
                    $(".text").removeClass('d-none')
                },

                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText);
                    //window.location.href = "Error";
                }
            });   
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

function toggleData(value, chart){
    const visibilityData = chart.isDatasetVisible(value);
    if(visibilityData == true){
        chart.hide(value);
    }
    else{
        chart.show(value)
    }
}

loadPerformanceMachineGraph(null, null);

if(WINDFARM.idPark == 'CCROES' || WINDFARM.idPark == 'OUROL'){
    $('#rotor').hide()
}

$('.reload-graph').hide()
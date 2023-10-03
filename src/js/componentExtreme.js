document.getElementById("maeg-search-by-range-btn").addEventListener("click", function () {
    $("#maeg-search-by-range-btn .load-btn").removeClass('d-none')
    $("#maeg-search-by-range-btn .text").addClass('d-none')
    if(MACHINE != null){
        //Check if the dates are correct
        if($("#maeg-startDate").val() >= $("#maeg-finalDate").val()){
            $(".message-top-center").text("Invalid dates");
            $("#message").addClass('faceinout');
        }else{
            //Load machines graph extreme info by selected range
            loadExtremeMachineGraphByDate();
            }
    }
    else{
        $(".message-top-center").text("There is no machine to show");
        $("#message").addClass('faceinout');
    }
});

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

today = yyyy + '-' + mm + '-' + dd;

$('#maeg-startDate').attr('max', today)
$('#maeg-startDate').attr('max', today)

$('#wtg').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#component').text(COMPONENT[1])
$('#wf').text(WINDFARM.name)

$('#wf').click(function(){
    pageChange('windfarm')
})


function loadExtremeMachineGraph(){
    //Clear graphs and radar buttons
    $("#content").empty();
    $("#extreme_radar_chart").empty();
    $("#extreme_radar_btns").empty();

    //Generate data foreach machine

    //Set machine number as string
    var number = MACHINE.wtg_number;
    if(number < 10){
        number = "0" + MACHINE.wtg_number;
    }
    
    //Get machine extreme data by component
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getExtremeComponentsByComponent', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'idCell': MACHINE.idcell, 'component': COMPONENT[0], 'turbineType': TURBINEMODEL },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            json = Object.values(json);
            var radardata = [[],[[],[],[],[],[],[],[],[]]];

            json.forEach(val => {
                //Set radar graph data for the components that need it and if is selected only one machine
                if(COMPONENT[0] == "root_j_bolts" || COMPONENT[0] == "tower_top_j_bolts" || COMPONENT[0] == "foundation_j_bolts"){
                    radardata[0].push(val.name);
                    radardata[1][0].push(Math.round(val.last[0][1], -1));
                    radardata[1][1].push(Math.round(val.last[1][1], -1));
                    radardata[1][2].push(Math.round(val.day[0][1], -1));
                    radardata[1][3].push(Math.round(val.day[1][1], -1));
                    radardata[1][4].push(Math.round(val.week[0][1], -1));
                    radardata[1][5].push(Math.round(val.week[1][1], -1));
                    radardata[1][6].push(Math.round(val.month[0][1], -1));
                    radardata[1][7].push(Math.round(val.month[1][1], -1));
                }

                var component = val.name.replace(/\s+/g, '').replace(".","");
                if(val.name == "22.5"){component = "2250"}

                var button = document.createElement("button");
                button.innerHTML = val.name;
                button.addEventListener ("click", function() {
                    $("#"+component + "posGraph").toggleClass('d-none');
                    $("#"+component + "negGraph").toggleClass('d-none');

                    if($("#"+component + "posGraph").hasClass('d-none')){
                        $("div[name=drawChart"+component + "pos]").addClass('d-none');
                    }else{
                        $("div[name=drawChart"+component + "pos]").removeClass('d-none');
                    }
                    if($("#"+component + "negGraph").hasClass('d-none')){
                        $("div[name=drawChart"+component + "neg]").addClass('d-none');
                    }else{
                        $("div[name=drawChart"+component + "neg]").removeClass('d-none');
                    }
                    
                    this.classList.toggle("btn-secondary");
                    this.classList.toggle("btn-primary");
                });
                button.classList.add("btn");
                button.classList.add("btn-secondary");
                button.classList.add("life_radar_btn");
                button.classList.add("ml-1");
                button.classList.add("mr-1");
                $("#extreme_radar_btns").append(button);

                $("#content").append('<!-- Card -->'
                +'<div class="card" id="' + component + 'posGraph"><div>'
                +'    <!-- Card header -->'
                +'    <div">'
                +'        <h6>' + val.name + ' Positive Envelope</h6>'
                +'    </div>'
                +'    <!-- Card body -->'
                +'    <div>'
                + '     <canvas id="graph-'+ component +'pos" height="400"></canvas>'
                +'    </div>'
                +'</div></div>');
                
                colorL = getColor(val.last[0][1]);
                colorD = getColor(val.day[0][1]);
                colorW = getColor(val.week[0][1]);
                colorM = getColor(val.month[0][1]);

                new Chart(document.getElementById("graph-" + component + "pos"), {
                    type: 'bar',
                    plugins: [ChartDataLabels],
                    data: {
                        labels: [["Last Record:", val.last[0][0]], ["Max at last 24h:", val.day[0][0]], ["Max at last week:", val.week[0][0]], ["Max at last month:", val.month[0][0]]],
                        datasets: [{
                            backgroundColor: [colorL, colorD, colorW, colorM],
                            borderRadius: 10,
                            data: [Math.round(val.last[0][1], -1), Math.round(val.day[0][1], -1), Math.round(val.week[0][1], -1), Math.round(val.month[0][1], -1)]
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        plugins: {
                            legend: {
                                display: false
                            },
                            datalabels: {
                                formatter: function(value) {
                                    if (value === 0) {
                                        return '';
                                    } else {
                                        return value;
                                    }
                                },
                                align: 'start',
                                anchor: 'end',
                                labels: {
                                    value: {
                                        color: 'black',
                                        offset: function(context) {
                                            if (context.dataset.data[context.dataIndex] === 0) {
                                                return -20;
                                            } else {
                                                return 0;
                                            }
                                        },
                                        padding: function(context) {
                                            var currentValue = context.dataset.data[context.dataIndex];
                                            var paddingDefault = 6;
                                            var maxThreshold = 45;
                                            var hasValueOne = context.dataset.data.some(function(data) {
                                                return data === 1;
                                            });
                                            var hasValueAboveThreshold = context.dataset.data.some(function(data) {
                                                return data > maxThreshold;
                                            });
                
                                            if (hasValueAboveThreshold) {
                                                if(currentValue === 1){
                                                    return 0;
                                                }
                                                else if(currentValue === 2){
                                                    return 2;
                                                }
                                                else {
                                                    return paddingDefault;
                                                }
                                            } else {
                                                return paddingDefault;
                                            }
                                        }
                                    }
                                },
                                padding: 6,
                                font: {
                                    size: 16
                                }
                            },
                            tooltip: {
                                enabled: false
                           },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: false
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Extreme Load (%)',
                                    font: {
                                        size: 15,
                                    }
                                },
                                ticks: {
                                    align: 'end',
                                    color: 'black',
                                    font: {
                                        size: 14
                                    }
                                }
                            }
                        }
                    }
                });
                
                if(val.last[1] != null){
                    $("#content").append('<!-- Card -->'
                    +'<div class="card" id="' + component + 'negGraph"><div>'
                    +'    <!-- Card header -->'
                    +'    <div>'
                    +'        <h6>' + val.name + ' Negative Envelope</h6>'
                    +'    </div>'
                    +'    <!-- Card body -->'
                    +'    <div>'
                    + '     <canvas id="graph-'+ component +'neg" height="400"></canvas>'
                    +'    </div>'
                    +'</div></div>');

                    colorL = getColor(val.last[1][1]);
                    colorD = getColor(val.day[1][1]);
                    colorW = getColor(val.week[1][1]);
                    colorM = getColor(val.month[1][1]);

                    new Chart(document.getElementById("graph-" + component + "neg"), {
                        type: 'bar',
                        plugins: [ChartDataLabels],
                        data: {
                            labels: [["Last Record:", val.last[1][0]], ["Max at last 24h:", val.day[1][0]], ["Max at last week:", val.week[1][0]], ["Max at last month:", val.month[1][0]]],
                            datasets: [{
                                backgroundColor: [colorL, colorD, colorW, colorM],
                                borderRadius: 10,
                                data: [Math.round(val.last[1][1], -1), Math.round(val.day[1][1], -1), Math.round(val.week[1][1], -1), Math.round(val.month[1][1], -1)]
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            plugins: {
                                legend: {
                                    display: false
                                },
                                datalabels: {
                                    formatter: function(value) {
                                        if (value === 0) {
                                            return '';
                                        } else {
                                            return value;
                                        }
                                    },
                                    align: 'start',
                                    anchor: 'end',
                                    labels: {
                                        value: {
                                            color: 'black',
                                            offset: function(context) {
                                                if (context.dataset.data[context.dataIndex] === 0) {
                                                    return -20;
                                                } else {
                                                    return 0;
                                                }
                                            },
                                            padding: function(context) {
                                                var currentValue = context.dataset.data[context.dataIndex];
                                                var paddingDefault = 6;
                                                var maxThreshold = 45;
                                                var hasValueOne = context.dataset.data.some(function(data) {
                                                    return data === 1;
                                                });
                                                var hasValueAboveThreshold = context.dataset.data.some(function(data) {
                                                    return data > maxThreshold;
                                                });
                    
                                                if (hasValueAboveThreshold) {
                                                    if(currentValue === 1){
                                                        return 0;
                                                    }
                                                    else if(currentValue === 2){
                                                        return 2;
                                                    }
                                                    else {
                                                        return paddingDefault;
                                                    }
                                                } else {
                                                    return paddingDefault;
                                                }
                                            }
                                        }
                                    },
                                    padding: 6,
                                    font: {
                                        size: 16
                                    }
                                },
                                tooltip: {
                                    enabled: false
                               },
                            },
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    title: {
                                        display: false
                                    }
                                },
                                y: {
                                    title: {
                                        display: true,
                                        text: 'Extreme Load (%)',
                                        font: {
                                            size: 15,
                                        }
                                    },
                                    ticks: {
                                        align: 'end',
                                        color: 'black',
                                        font: {
                                            size: 14
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            })
            
            //Set radar chart info for the components that need it and if is selected only one machine
            if(COMPONENT[0] == "root_j_bolts" || COMPONENT[0] == "tower_top_j_bolts" || COMPONENT[0] == "foundation_j_bolts"){
                $("#extreme_radar_container").append('<canvas id="extreme_radar_chart" width="400" height="400" style="max-height: 400px" class="max-w-100"></canvas>');
                new Chart(document.getElementById("extreme_radar_chart"), {
                    type: 'radar',
                    data: {
                        labels: radardata[0],
                        datasets: [{
                            label: 'Last Positive Envelope',
                            data: radardata[1][0],
                            backgroundColor: 'rgb(131, 178, 243)',
                            borderColor: 'rgb(131, 178, 243)',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: 'Last Negative Envelope',
                            data: radardata[1][1],
                            backgroundColor: 'rgb(71, 114, 206)',
                            borderColor: 'rgb(71, 114, 206)',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: '24h Positive Envelope',
                            data: radardata[1][2],
                            backgroundColor: 'rgb(213, 113, 30)',
                            borderColor: 'rgb(213, 113, 30)',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: '24h Negative Envelope',
                            data: radardata[1][3],
                            backgroundColor: 'rgb(244, 216, 94)',
                            borderColor: 'rgb(244, 216, 94)',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: 'Week Positive Envelope',
                            data: radardata[1][4],
                            backgroundColor: 'rgb(76, 89, 99)',
                            borderColor: 'rgb(76, 89, 99)',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: 'Week Negative Envelope',
                            data: radardata[1][5],
                            backgroundColor: 'rgb(155, 166, 166)',
                            borderColor: 'rgb(155, 166, 166)',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: 'Month Positive Envelope',
                            data: radardata[1][6],
                            backgroundColor: 'rgb(192, 55, 98)',
                            borderColor: 'rgb(192, 55, 98)',
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: 'Month Negative Envelope',
                            data: radardata[1][7],
                            backgroundColor: 'rgb(71, 130, 142)',
                            borderColor: 'rgb(71, 130, 142)',
                            fill: false,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels:{
                                    boxWidth: 14,
                                    font: {
                                        size: 14
                                    }
                                }
                            }
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                display: false
                            },
                            y: {
                                display: false
                            }
                        },
                        elements: {
                            line: {
                                borderWidth: 1.5
                            }
                        }
                    }
                });

                $("#extreme_radar_container").removeClass('d-none');
                $("#extreme_radar_btns").removeClass('d-none');
                $("#content > div").addClass('d-none');
            }else{
                //Hide radar chart and buttons
                $("#extreme_radar_container").addClass('d-none');
                $("#extreme_radar_btns").addClass('d-none');
            }

            /*if(MACHINE.length > 1){
                //Create a common graph por all the component variables of each machine
                var graph_by = 'years'
                if(RANGE == 0){
                    graph_by = 'all life'
                }
                id = machine.number;
                $(".machines-graphs").append('<!-- Card -->'
                +'<div id="' + id + '"><div class="card m-1">'
                +'    <!-- Card header -->'
                +'    <div class="card-header d-flex space-between align-center">'
                +'        <h6 class="w-33">' + WINDFARM.idPark + '-' + machine.number + '</h6>'
                +'        <button class="info-btn border-none w-33 cursor-pointer" href="#" data-toggle="modal" data-target="#materialsModal">info</button>'
                +"        <div class='w-33'><button id='graph-"+ id + "-reset' class='btn btn-primary graph_refresh_btn f-right cursor-pointer'><svg class='bi' width='28' height='28' fill='currentColor'><use xlink:href='images/icons/bootstrap-icons.svg#arrow-repeat'></use></svg></button></div>"
                +'    </div>'
                +'    <!-- Card body -->'
                +'    <div class="card-body pr-1 pl-1">'
                + '     <canvas id="graph-'+ id +'" width="400" height="400"></canvas>'
                +'    </div>'
                +'</div></div>');
                
                //Set graph
                myChart = new Chart(document.getElementById("graph-"+ id), {
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
                        datasets: []
                    },
                    options: {
                        elements: {
                            line: {
                                tension: .1
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: 'Life Expectancy for '+ WINDFARM.idPark +'-' + number,
                                align: 'start',
                                color: 'black',
                                font: {
                                    size: 16
                                },
                                padding: 20
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
                                    mode: 'x'
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
                                    text: 'Life Expectancy (' + graph_by + ')'
                                },
                                min: json.calcs[0].fatigue[Object.keys(json.calcs[0].fatigue)[0]][1][0][0],
                                max: json.calcs[0].fatigue[Object.keys(json.calcs[0].fatigue)[0]][1][json.calcs[0].fatigue[Object.keys(json.calcs[0].fatigue)[0]][1].length - 1][0]
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Fatigue(%)'
                                }
                            }
                        }
                    }
                });
            }*/

            //Scroll up
            $('html, body').animate({ scrollTop: 0 }, 'fast');
            $(".content-header").removeClass('invisible')
            $(".content-body").removeClass('invisible')
            $(".loading-container").addClass('d-none')
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

function loadExtremeMachineGraphByDate(){
    $('#maeg-search-by-range-btn').prop('disabled', true);
    $('#maeg-search-by-range-btn').addClass('button--loading')
    //Remove previous graphs
   $(".dategraph").remove();
   //Get components data by range
   $.ajax({
       url: 'php/getDashboardData.php',
       data: { 'callFunc': 'getExtremeComponentsByDate', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'idCell': MACHINE.idcell, 'component': COMPONENT[0], 'startD': $("#maeg-startDate").val(), 'endD': $("#maeg-finalDate").val(), 'turbineType': TURBINEMODEL },
       type: 'POST',
       dataType: 'json',

       success: function (json) {
        try{
            var mogoData = Object.values(json);

            //Generate graphs for each component
            mogoData.forEach(val => {
                var positive = [];
                var negative = [];

                //Generate graph line
                val[1].forEach(data => {
                    positive.push({ x: data[0], y: data[1]});
                    if(data[2] != null){
                        negative.push({ x: data[0], y: data[2]});
                    }
                })

                var component = val[0][1].replace(/\s+/g, '').replace(".","");
                if(val[0][1] == "22.5"){component = "2250"}

                //Generate positive graph
                $("#"+component+"posGraph").after('<!-- Card -->'
                    +'<div id="drawChart' + component + 'pos" class="dategraph"><div class="card m-1 graph">'
                    +'    <!-- Card header -->'
                    +'    <div class="card-header d-flex space-between align-center">'
                    +'        <h6 class="w-40">' + val[0][1] + ' Positive Envelope</h6>'
                    +"        <div class='reload-graph' id='graph-"+ component + "pos-date-reset'></div>"
                    +'    </div>'
                    +'    <!-- Card body -->'
                    +'    <div class="card-body pr-1 pl-1">'
                    + '     <canvas id="graph-'+ component +'pos-date" width="400" height="400"></canvas>'
                    +'    </div>'
                    +'</div></div>');

                const myChart = new Chart(document.getElementById("graph-"+ component +"pos-date"), {
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
                            label: val[0][1] + " Positive Envelope",
                            data: positive,
                            pointRadius: 0,
                            borderColor: '#FDA872',
                            backgroundColor: '#FDA872',
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
                                    $("#graph-"+ component + "pos-date-reset").show()
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        var line = [];
                                        line.push("Positive Envelope: " + Math.round(context.dataset.data[context.dataIndex].y * 100) / 100)

                                        const loadCase = val[1][context.dataIndex][3].split('_')
                                        line.push("Status: " + loadCase[1].toUpperCase())
                                        line.push("Wind Sector: " + loadCase[2].toUpperCase())
                                        line.push("Speed: " + loadCase[3].toUpperCase())
                                        if(WINDFARM.name != 'Ourol'){
                                        line.push("Turbulence: " + loadCase[6].toUpperCase())
                                        }
                                        line.push("Yaw: " + loadCase[4].toUpperCase())
                                        line.push("Density: " + loadCase[5].toUpperCase())
                                        return line;
                                    }
                                },
                                displayColors: false
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
                                    text: 'Extreme Load (%)'
                                }
                            }
                        }
                    }
                });

                //Set graph refresh button action
                document.getElementById("graph-"+ component +"pos-date-reset").addEventListener("click", () => {
                    myChart.resetZoom();
                    $("#graph-"+ component +"pos-date-reset").hide()
                })

                //Generate negative graph if necessary
                if(negative.length > 0){
                    $("#"+component+"negGraph").after('<!-- Card -->'
                    +'<div id="drawChart' + component + 'neg" class="dategraph"><div class="card m-1 graph">'
                    +'    <!-- Card header -->'
                    +'    <div class="card-header d-flex space-between align-center">'
                    +'        <h6 class="w-40">' + val[0][1] + ' Negative Envelope</h6>'
                    +"        <div class='reload-graph' id='graph-"+ component + "neg-date-reset'></div>"
                    +'    </div>'
                    +'    <!-- Card body -->'
                    +'    <div class="card-body pr-1 pl-1">'
                    + '     <canvas id="graph-'+ component +'neg-date" width="400" height="400"></canvas>'
                    +'    </div>'
                    +'</div></div>');

                    const myChart2 = new Chart(document.getElementById("graph-"+ component +"neg-date"), {
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
                                label: val[0][1] + " Negative Envelope",
                                data: negative,
                                pointRadius: 0,
                                borderColor: '#FDA872',
                                backgroundColor: '#FDA872',
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
                                        $("#graph-"+ component + "neg-date-reset").show()
                                        }
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            var line = [];
                                            line.push("Negative Envelope: " + Math.round(context.dataset.data[context.dataIndex].y * 100) / 100)

                                            const loadCase = val[1][context.dataIndex][3].split('_')
                                            line.push("Status: " + loadCase[1].toUpperCase())
                                            line.push("Wind Sector: " + loadCase[2].toUpperCase())
                                            line.push("Speed: " + loadCase[3].toUpperCase())
                                            if(WINDFARM.name != 'Ourol'){
                                            line.push("Turbulence: " + loadCase[6].toUpperCase())
                                            }
                                            line.push("Yaw: " + loadCase[4].toUpperCase())
                                            line.push("Density: " + loadCase[5].toUpperCase())
                                            return line;
                                        }
                                    },
                                    displayColors: false
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
                                        text: 'Extreme Load (%)'
                                    }
                                }
                            }
                        }
                    });

                    //Set graph refresh button action
                    document.getElementById("graph-"+ component +"neg-date-reset").addEventListener("click", () => {
                        myChart2.resetZoom();
                        $("#graph-"+ component +"neg-date-reset").hide()
                    })
                }
            })
            $('html, body').animate({ scrollTop: 0 }, 'fast');
            $(".load-btn").addClass('d-none')
            $(".text").removeClass('d-none')
            $('#maeg-search-by-range-btn').prop('disabled', false);
            $('#maeg-search-by-range-btn').removeClass('button--loading')
            $('.reload-graph').hide()
        }
        catch (e){
            console.log(e)
            $('#maeg-search-by-range-btn').prop('disabled', false);
            $('#maeg-search-by-range-btn').removeClass('button--loading')
        }
       },

       error: function (xhr, status, error) {
           //loadExtremeMachineGraphByDate();
           $('#maeg-search-by-range-btn').prop('disabled', false);
           $('#maeg-search-by-range-btn').removeClass('button--loading')
           console.log('There is an error -> ' + xhr.responseText);
           //window.location.href = "Error";
       }
   });
}

/* function getColor(d) {
    if (d < 90) {
        return "#5BD700";
    } else if (d >= 90 && d < 100) {
        return "yellow";
    } else if (d >= 100 && d < 110) {
        return "#ff8000";
    } else if (d >= 110) {
        return "red";
    }
    return "grey";
} */


function getColor(value) {
    if (value >= 100) {
      return "#FF6A45";
    } else if (value >= 85) {
      return "#FF9330";
    } else if (value >= 70) {
      return "#FFD600";
    } else {
      return "#79E569";
    }
  }

loadExtremeMachineGraph()
document.getElementById("mapg-search-by-range-btn").addEventListener("click", function () {
    //Check if the dates are correct
    if(($("#malg-startDate").val() >= $("#malg-finalDate").val())){
        $(".message-top-center").text("Invalid dates");
        $("#message").addClass('faceinout');
    }else{
        //Load machines graph life info by selected range
        $("#malg-search-by-range-btn .load-btn").removeClass('d-none')
        $("#malg-search-by-range-btn .text").addClass('d-none')
        $('.reload-graph').hide()
        loadLifeMachineGraphByDate();
    }
});

$('#wtg').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#component').text(COMPONENT[1])
$('#wf').text(WINDFARM.name)

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();

today = yyyy + '-' + mm + '-' + dd;

$('#malg-startDate').attr('max', today)
$('#malg-finalDate').attr('max', today)

$('#wf').click(function(){
    pageChange('windfarm')
})

switch(RANGE){
    case '0':
        $("#malg-lastYear").val("false")
    break;
    case '1':
        $("#malg-lastYear").val("true")
    break;
}

document.getElementById("malg-lastYear").addEventListener("change", function () {
    //Set selected range
    if($("#malg-lastYear").val() == "true"){
        RANGE = 1
    }else if($("#malg-lastYear").val() == "false"){
        RANGE = 0
    }else if($("#malg-lastYear").val() == "compare"){
        RANGE = 2
    }

    //Reload graph depending on the range selected
    loadLifeMachineGraph()
});

function loadLifeMachineGraph(){
    //Clear graphs and radar buttons
    $("#content").empty();
    $(".single-chart").empty();
    $("#life_radar_btns").empty();
    $(".machines-life .card-body").empty();

    //Generate data foreach machine

    //Set machine number as string
    var number = MACHINE.wtg_number;
    if(number < 10){
        number = "0" + MACHINE.wtg_number;
    }
    
    //Get machine fatigue data by component
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getFatigeCalcs', 'windFarm': WINDFARM.idPark, 'component': COMPONENT[0], 'model': MACHINE.wtg_number, 'range': RANGE},
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            $('#installation-date').text('Component installation date: '+json.calcs[0].installdate)

            var design_check = true
            var data = [[],[],[],[],[]];
            var id = ""
            var myChart = ""

/*                 if(MACHINE.length > 1){
                //Create a common graph por all the component variables of each machine
                var graph_by = 'years'
                if(RANGE == 0){
                    graph_by = 'all life'
                }
                id = MACHINE.wtg_number;
                $(".machines-graphs").append('<!-- Card -->'
                +'<div id="' + id + '"><div class="card">'
                +'    <!-- Card header -->'
                +'    <div>'
                +'        <h6>' + WINDFARM.idPark + '-' + MACHINE.wtg_number + '</h6>'
                +'        <button class="info-btn border-none w-33 cursor-pointer" href="#" data-toggle="modal" data-target="#materialsModal">info</button>'
                +"        <div class='w-33'><button id='graph-"+ id + "-reset' class='btn btn-primary graph_refresh_btn f-right cursor-pointer'><svg class='bi' width='28' height='28' fill='currentColor'><use xlink:href='images/icons/bootstrap-icons.svg#arrow-repeat'></use></svg></button></div>"
                +'    </div>'
                +'    <!-- Card body -->'
                +'    <div>'
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
            } */

            var cont = 0
            var charts = {}
            var charts2 = {}
            var charts3 = {}

            json.calcs.forEach(calc => {
                Object.keys(calc.fatigue).forEach(key => {
                    //Set radar graph data for the components that need it and if is selected only one machine
                    if((COMPONENT[0] == "root_j_bolts" || COMPONENT[0] == "tower_top_j_bolts" || COMPONENT[0] == "foundation_j_bolts")){
                        if(RANGE == 0 || (RANGE == 2 && calc.fatigue[key][1][0].length < 3)){
                            if(key == 3){
                                data[2].push(parseInt(calc.fatigue[key][0][0][1]));
                            }else if(key == 5){
                                data[3].push(parseInt(calc.fatigue[key][0][0][1]));
                            }
                            if(!data[4].includes(calc.fatigue[key][0][0][0])){
                                data[4].push(calc.fatigue[key][0][0][0]);
                            }
                        }else if(RANGE == 1){
                            if(key == 3){
                                data[0].push(parseInt(calc.fatigue[key][0][1][1]));
                            }else if(key == 5){
                                data[1].push(parseInt(calc.fatigue[key][0][1][1]));
                            }
                            if(!data[4].includes(calc.fatigue[key][0][1][0])){
                                data[4].push(calc.fatigue[key][0][1][0]);
                            }
                        }else if(RANGE == 2){
                            if(key == 3){
                                data[0].push(parseInt(calc.fatigue[key][0][1][1]));
                                data[2].push(parseInt(calc.fatigue[key][0][0][1]));
                            }else if(key == 5){
                                data[1].push(parseInt(calc.fatigue[key][0][1][1]));
                                data[3].push(parseInt(calc.fatigue[key][0][0][1]));
                            }
                            if(!data[4].includes(calc.fatigue[key][0][0][0])){
                                data[4].push(calc.fatigue[key][0][0][0]);
                            }
                        }
                    }

                    //Set initial life
                    var ygl = 40;
                    var agl = 40;
                    var nameVal = calc.vars[1];
                    if(calc.vars[1] == "22.5"){calc.vars[1] = "22.50"}
                    if(calc.vars[1] == "22.50"){nameVal = "22.5"}

                    if(key == 3){
                        var button = document.createElement("button");
                        button.innerHTML = nameVal;
                        button.addEventListener ("click", function() {
                            $("#"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x3").toggleClass('d-none');
                            $("#"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x5").toggleClass('d-none');

                            if($("#"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x3").hasClass("d-none")){
                                $("#d"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x3").addClass("d-none");
                            }else{
                                $("#d"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x3").removeClass("d-none");
                            }
                            if($("#"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x5").hasClass("d-none")){
                                $("#d"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x5").addClass("d-none");
                            }else{
                                $("#d"+calc.vars[1].replace(/\s/g, '').replace('.','') + "x5").removeClass("d-none");
                            }
                            
                            this.classList.toggle("btn-secondary");
                            this.classList.toggle("btn-primary");
                        });
                        button.classList.add("btn");
                        button.classList.add("btn-secondary");
                        button.classList.add("life_radar_btn");
                        $("#life_radar_btns").append(button);
                    }

                    id = calc.vars[1].replace(/\s/g, '').replace('.','') + "x" + key;
                    $("#content").append('<!-- Card -->'
                    +'<div id="' + id + '"><div class="card graph">'
                    +'    <!-- Card header -->'
                    +'    <div>'
                    +'   ' + nameVal + ' m=' + key + ''
/*                     +'        <button>info</button>' */
                    +"        <div id='graph-"+ id + "-reset' class='reload-graph'></div>"
                    +'    </div>'
                    +'    <!-- Card body -->'
                    +'    <div>'
                    + '     <canvas id="graph-'+ id +'" width="400" height="400"></canvas>'
                    +'    </div>'
                    +'<div class=graph-legend id='+id+'></div></div>');

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
                                    position: 'bottom',
                                    display: false
                                },
/*                                 title: {
                                    display: true,
                                    text: 'Life Expectancy for '+ WINDFARM.idPark +'-' + number,
                                    align: 'start',
                                    color: 'black',
                                    font: {
                                        size: 16
                                    },
                                    padding: 20
                                }, */
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
                                        onZoomComplete({chart}) {
                                            $("#"+chart.canvas.id+"-reset").show()
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
                                        text: 'Life Expectancy (years)'
                                    },
                                    min: calc.fatigue[key][1][0][0],
                                    max: calc.fatigue[key][1][calc.fatigue[key][1].length - 1][0]
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

                    var prev1 = -40;
                    var prev2 = -40;
                    
                    //Set graphs info by range selected
                    if(RANGE == 0 || (RANGE == 2 && calc.fatigue[key][1][0].length < 3)){
                        var design = {
                            label: 'Design',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#FDA872',
                            backgroundColor: '#FDA872',
                            data: [
                                {x: calc.fatigue[key][1][0][0], y: 0},
                                {x: calc.fatigue[key][1][calc.fatigue[key][1].length - 1][0], y: 0}
                            ]
                        };

                        var dd = ""

                        dd = {
                            label: 'All wtg life based calc',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#888AA6',
                            backgroundColor: '#888AA6',
                            data: []
                        };
                        calc.fatigue[key][1].forEach(val =>{
                            dd.data.push({x: val[0], y: val[1]});
                            if(prev2 < 0 && val[1] >= 0 && val[0] < 40){
                                agl = val[0];
                            }
                            prev2 = val[1];
                        })
                        if(design_check){
                            myChart.data.datasets.push(design);
/*                             design_check = false */
                        }
                        myChart.data.datasets.push(dd);
                        charts2[id] = myChart
                        $('.graph-legend#'+id+'').append("<div id=" + id + "d><img id =" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Design</span></div>")
                        $('.graph-legend#'+id+'').append("<div id=" + id + "><img id =" + id + " src='images/icons/check_box.svg' alt='' value=1><span>All life based calc</span></div>")
                        $('#'+id+'d > span').css('border-color', myChart.data.datasets[0].borderColor);
                        $('#'+id+' > span').css('border-color', myChart.data.datasets[1].borderColor);


    

                    }else if(RANGE == 1){
                        var design = {
                            label: 'Design',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#FDA872',
                            backgroundColor: '#FDA872',
                            data: [
                                {x: calc.fatigue[key][1][0][0], y: 0},
                                {x: calc.fatigue[key][1][calc.fatigue[key][1].length - 1][0], y: 0}
                            ]
                        };

                        var dd = ""

                        dd = {
                            label: 'Last year based calc',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#888AA6',
                            backgroundColor: '#888AA6',
                            data: []
                        };
                        calc.fatigue[key][1].forEach(val =>{
                            dd.data.push({x: val[0], y: val[1]});
                            if(prev1 < 0 && val[1] >= 0 && val[0] < 40){
                                ygl = val[0];
                            }
                            prev1 = val[1];
                        })
                        if(design_check){
                            myChart.data.datasets.push(design);
/*                             design_check = false */
                        }
                        myChart.data.datasets.push(dd);
                        charts[id] = myChart


                        $('.graph-legend#'+id+'').append("<div id=" + id + "d><img id =" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Design</span></div>")
                        $('.graph-legend#'+id+'').append("<div id=" + id + "><img id =" + id + " src='images/icons/check_box.svg' alt='' value=1><span>Last year based calc</span></div>")
                        $('#'+id+'d > span').css('border-color', myChart.data.datasets[0].borderColor);
                        $('#'+id+' > span').css('border-color', myChart.data.datasets[1].borderColor);

                        
/*                         if(cont == 0){
                            $('.graph-legend#'+id+'').append("<div id=" + id + "d><img id =" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Design</span></div>")
                            $('.graph-legend#'+id+'').append("<div id=" + id + "><img id =" + id + " src='images/icons/check_box.svg' alt='' value=1><span>Last year based calc</span></div>")
                            $('#'+id+'d > span').css('border-color', myChart.data.datasets[0].borderColor);
                            $('#'+id+' > span').css('border-color', myChart.data.datasets[1].borderColor);
                        }
                        else{
                            $('.graph-legend#'+id+'').append("<div id=" + id + "><img id =" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Last year based calc</span></div>")
                            $('#'+id+' > span').css('border-color', myChart.data.datasets[0].borderColor);
                        } */


                    }else if(RANGE == 2){
                        var design = {
                            label: 'Design',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#FDA872',
                            backgroundColor: '#FDA872',
                            data: [
                                {x: calc.fatigue[key][1][0][0], y: 0},
                                {x: calc.fatigue[key][1][calc.fatigue[key][1].length - 1][0], y: 0}
                            ]
                        };
                        var dd1 = {
                            label: 'Last year based calc',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#888AA6',
                            backgroundColor: '#888AA6',
                            data: []
                        };
                        var dd2 = {
                            label: 'All wtg life based calc',
                            pointRadius: 1,
                            fill: false,
                            borderColor: 'rgb(220, 57, 18)',
                            backgroundColor: 'rgb(220, 57, 18)',
                            data: []
                        };
                        calc.fatigue[key][1].forEach(val =>{
                            dd1.data.push({x: val[0], y: val[2]});
                            dd2.data.push({x: val[0], y: val[1]});
                            if(prev1 < 0 && val[1] >= 0 && val[0] < 40){
                                ygl = val[0];
                            }
                            if(prev2 < 0 && val[2] >= 0 && val[0] < 40){
                                agl = val[0];
                            }
                            prev1 = val[1];
                            prev2 = val[2];
                        })

                        if(design_check){
                            myChart.data.datasets.push(design);
/*                             design_check = false */
                        }

                        myChart.data.datasets.push(dd1);
                        myChart.data.datasets.push(dd2);
                        charts3[id] = myChart


                        $('.graph-legend#'+id+'').append("<div id=" + id + "d><img id =" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Design</span></div>")
                        $('.graph-legend#'+id+'').append("<div id=" + id + "l><img id =" + id + " src='images/icons/check_box.svg' alt='' value=1><span>Last year based calc</span></div>")
                        $('.graph-legend#'+id+'').append("<div id=" + id + "a><img id =" + id + " src='images/icons/check_box.svg' alt='' value=2><span>All life based calc</span></div>")
                        $('#'+id+'d > span').css('border-color', myChart.data.datasets[0].borderColor);
                        $('#'+id+'l > span').css('border-color', myChart.data.datasets[1].borderColor);
                        $('#'+id+'a > span').css('border-color', myChart.data.datasets[2].borderColor);
/*                         if(cont == 0){
                            $('.graph-legend#'+id+'').append("<div id=" + id + "d><img id =" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Design</span></div>")
                            $('.graph-legend#'+id+'').append("<div id=" + id + "l><img id =" + id + " src='images/icons/check_box.svg' alt='' value=1><span>Last year based calc</span></div>")
                            $('.graph-legend#'+id+'').append("<div id=" + id + "a><img id =" + id + " src='images/icons/check_box.svg' alt='' value=2><span>All wtg based calc</span></div>")
                            $('#'+id+'d > span').css('border-color', myChart.data.datasets[0].borderColor);
                            $('#'+id+'l > span').css('border-color', myChart.data.datasets[1].borderColor);
                            $('#'+id+'a > span').css('border-color', myChart.data.datasets[2].borderColor);
                        }
                        else{
                            $('.graph-legend#'+id+'').append("<div id=" + id + "l><img id =" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Last year based calc</span></div>")
                            $('.graph-legend#'+id+'').append("<div id=" + id + "a><img id =" + id + " src='images/icons/check_box.svg' alt='' value=1><span>All wtg based calc</span></div>")
                            $('#'+id+'l > span').css('border-color', myChart.data.datasets[0].borderColor);
                            $('#'+id+'a > span').css('border-color', myChart.data.datasets[1].borderColor);
                        } */
                    }
                    myChart.update();
                    cont++

                    /* $('#mp-graph-windSpeed').append("<div class='graph-legend' id='ws-legend'><div id='legend-scada-avg'><img src='images/icons/check_box.svg' alt='' value=0><span>Range 1</span></div><div id='legend-scada'><img src='images/icons/check_box.svg' alt='' value=1><span>Range 2</span></div></div>")
 */

/*                     cont++;

                    if(Object.keys(legend3).length == machine.data.length){
                        $('#real-legend > div > img').click(function(){
                            var src = ($(this).attr("src") === "images/icons/check_box.svg")
                            ? "images/icons/empty_box.svg" 
                            : "images/icons/check_box.svg";
                            $(this).attr("src", src);
                            toggleData($(this).attr('value'), myChart3)
                        }) 
                    } */

                    //Set graph zoom refresh button action

                });
            });

            //Set action for each materials button
            document.querySelectorAll('.info-btn').forEach(element => {
                element.addEventListener("click", function() {
                    $(".materials-container").addClass("d-flex")
                    $(".materials-container").removeClass("d-none")
                })
            })

            if(RANGE == 1){
                chartsDef = charts
            }
            else if(RANGE == 0){
                chartsDef = charts2
            }
            else if(RANGE == 2 ){
                chartsDef = charts3
            }

/*             console.log(myChart.data.datasets, 'datasets')
            console.log(charts)
            console.log(cont+'cont')
            console.log(RANGE, 'range') */


            Object.keys(chartsDef).forEach(key => {
                document.getElementById("graph-"+ key + "-reset").addEventListener("click", () => {
                    chartsDef[key].resetZoom();
                    $("#graph-"+ key + "-reset").hide()
                })
            });

            $('.graph-legend > div > img').click(function(){
                var src = ($(this).attr("src") === "images/icons/check_box.svg")
                ? "images/icons/empty_box.svg" 
                : "images/icons/check_box.svg";
                $(this).attr("src", src);
                toggleData($(this).attr('value'), chartsDef[$(this).attr('id')])
            })

            //Set radar chart info for the components that need it and if is selected only one machine
            if((COMPONENT[0] == "root_j_bolts" || COMPONENT[0] == "tower_top_j_bolts" || COMPONENT[0] == "foundation_j_bolts")){
                var d = [];
                if(data[0].length > 0){
                    d.push({
                        label: 'Year m3',
                        data: data[0],
                        backgroundColor: 'rgb(131, 178, 243)',
                        borderColor: 'rgb(131, 178, 243)',
                        fill: false,
                        pointRadius: 0
                    })
                }
                if(data[1].length > 0){
                    d.push({
                        label: 'Year m5',
                        data: data[1],
                        backgroundColor: 'rgb(131, 178, 243)',
                        borderColor: 'rgb(131, 178, 243)',
                        fill: false,
                        pointRadius: 0
                    })
                }
                if(data[2].length > 0){
                    d.push({
                        label: 'All m3',
                        data: data[2],
                        backgroundColor: 'rgb(131, 178, 243)',
                        borderColor: 'rgb(131, 178, 243)',
                        fill: false,
                        pointRadius: 0
                    })
                }
                if(data[3].length > 0){
                    d.push({
                        label: 'All m5',
                        data: data[3],
                        backgroundColor: 'rgb(131, 178, 243)',
                        borderColor: 'rgb(131, 178, 243)',
                        fill: false,
                        pointRadius: 0
                    })
                }
                
                //Remove radar chart
                $("#life_radar_container").empty()
                //Create radar chart container
                $("#life_radar_container").append('<canvas id="life_radar_chart" width="400" height="400" style="max-height: 400px"></canvas>');
                //Set radar chart
                new Chart(document.getElementById("life_radar_chart"), {
                    type: 'radar',
                    data: {
                        labels: data[4],
                        datasets: d
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
                                },
                                display: false
                            }
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                suggestedMin: 0
                            }
                        },
                        elements: {
                            line: {
                                borderWidth: 1.5
                            }
                        }
                    }
                });

                //Show radar chart and buttons
                $("#life_radar_chart").removeClass('d-none');
                $("#life_radar_btns").removeClass('d-none');
                setTimeout(() => {  $(".machines-graphs > div").addClass('d-none'); }, 200);
            }else{
                //Hide radar chart and buttons
                $("#life_radar_chart").addClass('d-none');
                $("#life_radar_btns").addClass('d-none');
            }

            //Chose life bars color
            var val = Math.trunc(json.life)
            if (val < 20) {
                color = "red";
            } else if (val < 25) {
                color = "orange";
            } else {
                color = "green";
            }

            if (val < 0) {
                val = 0
            }
            styleCalculating = ''

            if(json.reset_fatigue){
                val = 'Calculating'
                progress = 40
                color = 'green'
                styleCalculating = 'font-size: 0.2em'
            }

            if(COMPONENT[0] == 'gearbox'){
                val = '-'
                progress = 40
                color = 'green'
            }


            //Create life bars for each machine
            progress = (Math.trunc(val)*100)/40
            $("#life-chart").append('<div class="single-chart">'
                +'<div id="expectancyInfo"></div>'
                +'<img id="expectancyInfoHover" src="images/icons/infobox.svg" alt="" class="infobox">'
                +'          <svg viewBox="0 0 36 36" class="circular-chart '+ color +'">'
                +'            <path class="circle-bg"'
                +'              d="M18 2.0845'
                +'                a 15.9155 15.9155 0 0 1 0 31.831'
                +'                a 15.9155 15.9155 0 0 1 0 -31.831"'
                +'            />'
                +'            <path class="circle"'
                +'              stroke-dasharray="'+ progress +', 100"'
                +'              d="M18 2.0845'
                +'                a 15.9155 15.9155 0 0 1 0 31.831'
                +'                a 15.9155 15.9155 0 0 1 0 -31.831"'
                +'            />'
                +'            <text x="18" y="20.35" class="percentage" style="'+styleCalculating+'">'+ (val) + '</text>'
                +'            <text x="18" y="23.35" class="subline">years</text>'
                +'          </svg>'
                +'        </div>');

            var ttdiff = (Date.now() - new Date(json.calcs[0].installdate.substring(3,5) + "/" + json.calcs[0].installdate.substring(0,2) + "/" + json.calcs[0].installdate.substring(6,10)).getTime()) / 31536000000
           
            if(ttdiff < 1){
                $("#expectancyInfoHover").show()
            }

            $('#expectancyInfo').text("This component has been replaced in a period of less than 1 year. Life expectancy calculation needs at least 1 year of data, therefore standard 20-years lifespan basis (OEM certification) will be applied for this component's life calculation until 1 year of data has been gathered.")
  
            $('#expectancyInfoHover').hover(
                function() {
                  $('#expectancyInfo').show();
                }, function() {
                    $('#expectancyInfo').hide();
                }
              );
  
  
            /*               '<div class="data text-center p-1 miw-content">'
                +'    <h5>' + WINDFARM.idPark + ' - ' + WINDFARM.name + ': ' + WINDFARM.idPark + '-' + number + '</h5>'
                +'    <p class="card-text m-0">' + json.life + ' years</p>'
                +'    <div class="progress-bar b-bar-grey">'
                +'        <div class="progress loadbar-background-' + color + '" data-done="' + val + '"></div>'
                +'    </div>'
                +'</div>'); */

            //Set component life
            $("#component-life-text-" + MACHINE.wtg_number).text(json.life + " years");
            //Set life bar value
            document.querySelectorAll(".progress").forEach(element => {
                element.style.width = element.getAttribute('data-done') + "%"
                element.style.backgroundColor = element.getAttribute('data-color')
            })

            //Scroll up
            $('html, body').animate({ scrollTop: 0 }, 'fast');
            $(".content-header").removeClass('invisible')
            $(".content-body").removeClass('invisible')
            $(".loading-container").addClass('d-none')

            $('.reload-graph').hide()

            if(WINDFARM.name == 'Ourol' && (COMPONENT[0] == 'main_f' || COMPONENT[0] == 'mounting')){
                var expectancyInfo = document.createElement('span')
                expectancyInfo.setAttribute('id', 'titleInfo')
                expectancyInfo.innerHTML = 'Main Frame/Mounting lowest life expectancy';
                $('#title').append(expectancyInfo)
            }
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

function loadLifeMachineGraphByDate(){
    $('#mapg-search-by-range-btn').prop('disabled', true);
    $('#mapg-search-by-range-btn').addClass('button--loading')
    //Remove previous graphs
    $(".lifeConsuption").remove();
    //Get data by range info
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getFatigeCalcsRange', 'windFarm': WINDFARM.idPark, 'component': COMPONENT[0], 'model': MACHINE.wtg_number, 'strDate': $("#malg-startDate").val(), 'fnlDate': $("#malg-finalDate").val()},
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            try{
                //Generates graphs for each component
                var chartsDate = {}
                json.calcs.forEach(calcs => {
                    var installDate = calcs.installdate.split('-')
                    installDate = `${installDate[2]}-${installDate[1]}-${installDate[0]}`
                    calcs.fatigue.forEach(fatigue => {
                        var nameVal = calcs.vars[1];
                        if(calcs.vars[1] == "22.5"){calcs.vars[1] = "22.50"}
                        if(calcs.vars[1] == "22.50"){nameVal = "22.5"}

                        //Create graph
                        const id = calcs.vars[1].replace(/\s/g, '').replace('.','') + "x" + fatigue[0];
                        $("#d" + id).remove();
                        $("#" + id).after('<!-- Card -->'
                        +'<div id="d'+ id +'"><div class="card graph">'
                        +'    <!-- Card header -->'
                        +'    <div class="pb-5">'
                        +'        <div>' + nameVal + ' m=' + fatigue[0]
                        +'<p>Life Consumption on ' + $("#malg-startDate").val() + ' to ' + $("#malg-finalDate").val()+'</p>'
                        +'         </div>'
    /*                     +'        <button>info</button>' */
                        +"        <div id='canvas_d"+ id + "-reset' class='reload-graph'></div>"                    +'    </div>'
                        +'    <!-- Card body -->'
                        +'    <div>'
                        + '     <canvas id="canvas_d'+ id +'" width="400" height="400" style="max-height: 400px"></canvas>'
                        +'    </div>'
                        +'<div class=graph-legend id=d'+id+'>'
                        +'</div></div>');

                        //Set graph options
                        var myChart = new Chart(document.getElementById("canvas_d" + id), {
                            plugins: [{
                                beforeDraw: chart => {
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
                                plugins:{
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
                                            onZoomComplete({chart}) {
                                                $("#"+chart.canvas.id+"-reset").show()
                                            }
                                        }
                                    },
                                    annotation: {
                                        annotations: {
                                        line1: {
                                            type: 'line',
                                            xMin: installDate,
                                            xMax: installDate,
                                            label: {
                                            enabled: false,
                                            content: ['Installation date:', installDate]
                                            },
                                            enter({chart}, event) {
                                                toggleLabel(chart, event, id);
                                            },
                                            leave({chart}, event) {
                                                toggleLabel(chart, event, id);
                                            }, 
                                            borderColor: '#F5671B',
                                            borderWidth: 3
                                        }
                                        }
                                    }
                                },
                                elements: {
                                    line: {
                                        tension: .1
                                    }
                                },
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        scaleLabel: {
                                            display: false
                                        },
                                        type: 'time',
                                        time: {
                                            displayFormats: {
                                                'millisecond': 'yyyy MMM dd',
                                                'second': 'yyyy MMM dd',
                                                'minute': 'yyyy MMM dd',
                                                'hour': 'yyyy MMM dd',
                                                'day': 'yyyy MMM dd',
                                                'week': 'yyyy MMM dd',
                                                'month': 'yyyy MMM dd',
                                                'quarter': 'yyyy MMM dd',
                                                'year': 'yyyy MMM dd',
                                            }
                                        }
                                    },
                                    y: {
                                        title: {
                                            display: true,
                                            text: 'Life Consumption(%)'
                                        }
                                    }
                                },
                                //Set point click action
                                onClick(e) {
                                    const activePoints = myChart.getElementsAtEventForMode(e, 'nearest', {
                                        intersect: true
                                    }, false)
                                    const [{
                                        index
                                    }] = activePoints;
        
                                    if(activePoints.length){
                                        const firstPoint = activePoints[0];
                                        loadDataByMinute(COMPONENT[0], calcs.vars[0], id, nameVal, fatigue[0], myChart.data.datasets[firstPoint.datasetIndex].data[firstPoint.index].x);
                                    }
                                }
                            }
                        });

                        //Set graph data
                        var design = {
                            label: "Design",
                            pointRadius: 1,
                            fill: false,
                            borderColor: "#FDA872",
                            data: [
                                {x: fatigue[1][0][0], y: 100},
                                {x: fatigue[1][fatigue[1].length - 1][0], y: 100}
                            ],
                            order: 2
                        };
                        var dd = {
                            label: 'Consumption',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#888AA6',
                            backgroundColor: '#888AA6',
                            data: [],
                            order: 3
                        };
                        var avg = {
                            label: 'Average',
                            pointRadius: 1,
                            fill: false,
                            borderColor: '#262840',
                            backgroundColor: '#262840',
                            data: [],
                            order: 1
                        };

                        var cont = 1;
                        var sum = 0;
                        var date = "";
                        fatigue[1].forEach(data => {
                            dd.data.push({x: data[0], y: data[1]});
                            if(cont < 7){
                                sum += data[1];
                                cont++;
                                if(cont == 4){
                                    date = data[0];
                                }
                            }else{
                                cont = 1;
                                avg.data.push({x: date, y: sum / 7});
                                sum = data[1];
                            }
                        })
                        
                        if(cont > 1){
                            avg.data.push({x: fatigue[1][fatigue[1].length - 1][0], y: (sum / cont)});
                        }else{
                            avg.data.push({x: fatigue[1][fatigue[1].length - 1][0], y: sum});
                        }                    
                        
                        myChart.data.datasets.push(design);
                        myChart.data.datasets.push(dd);
                        myChart.data.datasets.push(avg);

                        chartsDate['d'+id] = myChart


                        if(installDate < $("#malg-startDate").val()){
                            myChart.options.plugins.annotation.annotations.line1.display = false
                        }

                        myChart.update()


                        $('.graph-legend#d'+id+'').append("<div id=d" + id + "d><img id =d" + id + " src='images/icons/check_box.svg' alt='' value=0><span>Design</span></div>")
                        $('.graph-legend#d'+id+'').append("<div id=d" + id + "c><img id =d" + id + " src='images/icons/check_box.svg' alt='' value=1><span>Consumption</span></div>")
                        $('.graph-legend#d'+id+'').append("<div id=d" + id + "a><img id =d" + id + " src='images/icons/check_box.svg' alt='' value=2><span>Average</span></div>")
                        $('#d'+id+'d > span').css('border-color', myChart.data.datasets[0].borderColor);
                        $('#d'+id+'c > span').css('border-color', myChart.data.datasets[1].borderColor);
                        $('#d'+id+'a > span').css('border-color', myChart.data.datasets[2].borderColor);


                        //Set graph zoom refresh button action
                        document.getElementById('canvas_d'+ id + '-reset').addEventListener("click", () => {
                            myChart.resetZoom();
                            $("#canvas_d"+id+"-reset").hide()
                        })
                    })
                });

    /*             document.querySelectorAll('.info-btn').forEach(element => {
                    element.addEventListener("click", function() {
                        $(".materials-container").addClass("d-flex")
                        $(".materials-container").removeClass("d-none")
                    })
                }) */

                $('.graph-legend > div > img').click(function(){
                    var src = ($(this).attr("src") === "images/icons/check_box.svg")
                    ? "images/icons/empty_box.svg" 
                    : "images/icons/check_box.svg";
                    $(this).attr("src", src);
                    toggleData($(this).attr('value'), chartsDate[$(this).attr('id')])
                })

                if(MACHINE.length == 1 && (COMPONENT[0] == "root_j_bolts" || COMPONENT[0] == "tower_top_j_bolts" || COMPONENT[0] == "foundation_j_bolts")){
                    $(".life_radar_btn").removeClass("btn-primary")
                    $(".life_radar_btn").addClass("btn-secondary")
                    setTimeout(() => {  $(".machines-graphs > div").addClass('d-none'); }, 200);
                }

                $(".load-btn").addClass('d-none')
                $(".text").removeClass('d-none')
                $('#mapg-search-by-range-btn').prop('disabled', false);
                $('#mapg-search-by-range-btn').removeClass('button--loading')
                $('.reload-graph').hide()
            }
            catch (e){
                console.log(e)
                $('#mapg-search-by-range-btn').prop('disabled', false);
                $('#mapg-search-by-range-btn').removeClass('button--loading')
            }
        },

        error: function (xhr, status) {
            $('#mapg-search-by-range-btn').prop('disabled', false);
            $('#mapg-search-by-range-btn').removeClass('button--loading')
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

function loadDataByMinute(component, variable, name, nameVal, wohler, date){
    //Hide all loading gifs
    $(".loadGif").addClass('d-none');
    //Show loading gif
    $("#load"+name).removeClass('d-none');
    //Get tenminute data
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getFatigueByMinutes', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'date': date, 'turbine': TURBINEMODEL, 'component': component, 'variable': variable, 'wohler': wohler },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            //Remove previous graphs
            $("#m" + name).remove();
            //Generate new graph
            $("#" + name).after('<!-- Card -->'
            +'<div id="m'+ name +'"><div class="card m-1 graph pb-50">'
            +'    <!-- Card header -->'
            +'    <div class="card-header d-flex space-between align-center">'
            +'        <div>' + nameVal + ' m=' + wohler + ' | ' + date
            +'<p>Ten-minutely Life Consumption</p>'
            +'</div>'
            +'        <img src="images/icons/x-close.svg" onclick="closeDataByMinute(`'+ name +'`)"></img>'
            +'    </div>'
            +'    <!-- Card body -->'
            +'    <div class="card-body pr-1 pl-1">'
            + '     <canvas id="canvas_d'+ name +'_normal" width="400" height="400"></canvas>'
            +'    </div>'
            +'</div></div>');

            //Set graph info
            var myChart = new Chart(document.getElementById("canvas_d"+ name + "_normal"), {
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
                    plugins:{
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var line = [];
                                    line.push(context.dataset.label + ": " + Math.round(context.dataset.data[context.dataIndex].y * 100) / 100)
                                    line.push("Status: " + json.data[context.dataIndex].status.toUpperCase())
                                    line.push("Wind Sector: " + json.data[context.dataIndex].windSector.toUpperCase())
                                    line.push("Speed: " + json.data[context.dataIndex].speed.toUpperCase())
                                    line.push("Turbulence: " + json.data[context.dataIndex].turbulence.toUpperCase())
                                    line.push("Yaw: " + json.data[context.dataIndex].yaw.toUpperCase())
                                    line.push("Density: " + json.data[context.dataIndex].density.toUpperCase())
                                    return line;
                                }
                            },
                            displayColors: false
                        },
                        legend: {display: false},
                    },
                    elements: {
                        line: {
                            tension: .1
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            scaleLabel: {
                                display: false
                            },
                            type: 'time',
                            time: {
                                displayFormats: {
                                    'millisecond': 'HH:MM',
                                    'second': 'HH:MM',
                                    'minute': 'HH:MM',
                                    'hour': 'HH:MM',
                                    'day': 'HH:MM',
                                    'week': 'HH:MM',
                                    'month': 'HH:MM',
                                    'quarter': 'HH:MM',
                                    'year': 'HH:MM',
                                }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Life Consumption(%)'
                            }
                        }
                    }
                }
            });

            //Set graphs data
            var design = {
                label: "Design",
                pointRadius: 1,
                fill: false,
                borderColor: "#FDA872",
                data: [
                    {x: json.data[0].time, y: 100},
                    {x: json.data[json.data.length - 1].time, y: 100}
                ]
            };
            var dd = {
                label: 'Life Consumption',
                pointRadius: 1,
                fill: false,
                borderColor: '#888AA6',
                backgroundColor: '#888AA6',
                data: []
            };

            json.data.forEach(line => {
                dd.data.push({x: line.time, y: line.valueP})
            })

            myChart.data.datasets.push(dd);
            myChart.data.datasets.push(design);
            myChart.update()

            //Show graph and hide load gif
            $("#d"+name).addClass('d-none');
            $("#m"+name).removeClass('d-none');
            $(".loadGif").addClass('d-none');
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

function closeDataByMinute(name){
    $("#m"+name).css('display','none');
    $("#d"+name).css('display', 'block');
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

function toggleLabel(chart, event) {
    const annotation = chart.config._config.options.plugins.annotation.annotations.line1.label;
    annotation.enabled = !annotation.enabled;
    //annotation.position = (event.x / chart.chartArea.width * 100) + '%';
    chart.update();
  }

/* MACHINE = [MACHINE] */
loadLifeMachineGraph()

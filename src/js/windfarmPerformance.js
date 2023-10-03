var graph_colors = []
$('#wf').text(WINDFARM.name)

$('#periods').change(function(){
    PERFORMANCE_KPI_RANGE = this.value
    $("#performance-table thead").empty()
    $("#performance-table tbody").empty()
    loadPerformanceKPIs()
});

$('#periods_real').change(function(){
    PERFORMANCE_KPI_RANGE = this.value
    $("#energy-production-graph").remove();
    $('#real-legend').remove();
    $('#real').append("<canvas id='energy-production-graph'></canvas>")
    loadEnergyProductionGraph()
});

$('#periods_power').change(function(){
    PERFORMANCE_KPI_RANGE = this.value
    $("#power-curve-graph").remove();
    $('#power-legend').remove();
    $('#power').append("<canvas id='power-curve-graph'></canvas>")
    $('#power-curve-reset').hide()
    loadPowerCurve()
});

$('#periods_rotor').change(function(){
    PERFORMANCE_KPI_RANGE = this.value
    $("#rotor-speed-graph").remove();
    $('#rotor-legend').remove();
    $('#rotor').append("<canvas id='rotor-speed-graph'></canvas>")
    $('#rotor-speed-reset').hide()
    loadAngularRotorSpeed()
});

/* $("#title").css('display', 'block')
$("#content").css('display', 'block')
$(".loading-container").css('display', 'none') */
setTimeout(() => {
    $("#title").css('display', 'flex')
    $("#content").css('display', 'block')
    $(".loading-container").css('display', 'none')
    dispatchEvent(new Event('load'))
}, "50")

function loadPerformanceKPIs(){
    $('#performance-table thead').empty()
    $('#performance-table tbody').empty()
    //Get table data
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWT', 'windFarm': WINDFARM.idPark, 'wtg': null, 'range': PERFORMANCE_KPI_RANGE },
        type: 'POST',
        dataType: 'json',
        async: false,
    
        success: function (machine) {
            //Generate headers
            var table_head = "<tr class='head'><th></th>"
            var hide = "<tr id='first-row'><td></td>"
            var power = "<td><span>Power</span><span> [MW]</span></td>"
            var model = "<td><span>Turbine Model</span></td>"
            var twr = "<td><span>TWR</span><span> [m]</span></td>"
            var startup = "<td><span>Start-Up</span><span> [year]</span></td>"
            var speed = "<td><span>Average Wind Speed</span><span> [m/s]</span></td>"
            var availability = "<td><span>Availability</span><span> [%]</span></td>"
            var cont = 1

            MACHINE = machine.data
            //Generate body for each machine
            machine.data.forEach(wtg => {
                var pwr = wtg.power
                var strup = '-'
                pwr = Math.round(pwr * 1000) / 1000
                if(wtg.wtg_startup != null){
                    strup = wtg.wtg_startup.substring(0,4)
                }
    
                $.ajax({
                    url: 'php/getData.php',
                    data: { 'callFunc': 'getKpis', 'windFarm': WINDFARM.idPark, 'machine': wtg.wtg_number, 'range': PERFORMANCE_KPI_RANGE },
                    type: 'POST',
                    dataType: 'json',
                    async: false,
                
                    success: function (json) {
                        table_head += "<th>" + WINDFARM.wtg_code + "" + wtg.wtg_number + "</th>"
                        hide += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'><img src='images/icons/ocultar.svg'></td>"
                        power += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `mp`)'>" + pwr + "</td>"
                        model += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `mp`)'>" + wtg.turbine_model + "</td>"
                        twr += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `mp`)'>" + wtg.twr + "</td>"
                        startup += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `mp`)'>" + strup + "</td>"
                        speed += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `mp`)'>" + parseFloat(json.wind_speed) + "</td>"
                        availability += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `mp`)'>" + parseFloat(json.availability) + "</td>"
                        cont++

                        if(wtg == machine.data[machine.data.length - 1]){
                            table_head += "</tr>"
                            hide += "</tr>"
                            $("#performance-table thead").append(table_head)
/*                             $("#performance-table tbody").append(hide) */
                            $("#performance-table tbody").append("<tr>" + power + "</tr>")
                            $("#performance-table tbody").append("<tr>" + model + "</tr>")
                            $("#performance-table tbody").append("<tr>" + twr + "</tr>")
                            $("#performance-table tbody").append("<tr>" + startup + "</tr>")
                            $("#performance-table tbody").append("<tr>" + speed + "</tr>")
                            $("#performance-table tbody").append("<tr>" + availability + "</tr>")
                        }
                    },
                
                    error: function (xhr, status) {
                        console.log('There is an error -> ' + xhr.responseText)
                        //window.location.href = "Error"
                    }
                })
            });
    
            //Load performance data graphs
/*             loadPerformanceMachineGraph(0); */
        },
    
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

/**
 * Loads selected machines performance data in an specific range
 */
function loadPerformanceMachineGraph() {
    //Set range dates
    var startdate = null
    var finaldate = null
    var months = 0

    switch(PERFORMANCE_KPI_RANGE+''){
        case '0':
            finaldate = TODAY
            months = 1
            break;
        case '1':
            finaldate = TODAY
            months = 3
            break;
        case '2':
            finaldate = TODAY
            months = 6
            break;
        case '3':
            finaldate = TODAY
            months = 12
            break;
    }

    startdate = new Date()
    startdate = new Date(startdate.setMonth(startdate.getMonth() - months));
    var dd = startdate.getDate()
    var mm = startdate.getMonth() + 1 //January is 0!
    var yyyy = startdate.getFullYear()

    if (dd < 10) {
    dd = '0' + dd
    }
    if (mm < 10) {
    mm = '0' + mm
    }

    startdate = yyyy + '-' + mm + '-' + dd
    
    //Clear and show performance graphs
    //Generate canvas
    
    var myChart = new Chart(document.getElementById('power-curve-graph'), {
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
            plugins: {
                legend: {
                    position: 'bottom',
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
                        text: 'Wind speed [m/s]'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Power [kW]'
                    }
                }
            },
            //Set point click action
            onClick(e) {
                const activePoints = myChart.getElementsAtEventForMode(e, 'nearest', {
                    intersect: true
                }, false)
                console.log(activePoints)
                const [{
                    index
                }] = activePoints;

                if(activePoints.length){
                    const firstPoint = activePoints[0];
                    analytics2smartdata(myChart.data.datasets[firstPoint.datasetIndex].label.split('-')[1], 'mp')
                }
            }
        }
    });

        //Power curve of models
        $.ajax({
            url: 'php/getData.php',
            data: { 'callFunc': 'getWindfarmModels', 'windFarm': WINDFARM.idPark},
            type: 'POST',
            dataType: 'json',
            async: true,
            
            success: function (json) {
    
                json.forEach(model => {
                    $.ajax({
                        url: 'php/getData.php',
                        data: { 'callFunc': 'getPowerCurveModels', 'model': model},
                        type: 'POST',
                        dataType: 'json',
                        async: true,
                        
                        success: function (json) {
                            array_power_curve = []
                            json.forEach(result => {
                                array_power_curve.push({x: result['wind_speed'], y: result['power']})
                            });
                            var data = {
                                type: 'line',
                                label: 'OEM-' + model,
                                data: array_power_curve,
                                pointRadius: 0,
                                borderColor: generateRandomColor(model),
                                backgroundColor: generateRandomColor(model),
                                fill: false,
                                hidden: false,
                                order: '11'
                            }
                            myChart.data.datasets.push(data);
                            myChart.update();
                        },
                        error: function (xhr) {
                            console.log('There is an error -> ' + xhr.responseText);
                            //window.location.href = "Error";
                        }
                    });
                })
            },
            error: function (xhr) {
                console.log('There is an error -> ' + xhr.responseText);
                //window.location.href = "Error";
            }
        });

    var myChart2 = new Chart(document.getElementById('rotor-speed-graph'), {
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
            plugins: {
                legend: {
                    position: 'bottom',
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
                        text: 'Angular rotor speed [rpm]'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Power [kW]'
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
                    analytics2smartdata(myChart.data.datasets[firstPoint.datasetIndex].label.split('-')[1], 'mp')
                }
            }
        }
    });

/*     document.getElementById("power-curve-reset").addEventListener("click", () => {
        myChart.resetZoom();
    })
    document.getElementById("rotor-speed-reset").addEventListener("click", () => {
        myChart2.resetZoom();
    })
 */
    var cont = 0;
    //Gets graphs info for each machine
    MACHINE.forEach(machine => {
        var data = {
            type: 'line',
            label: WINDFARM.wtg_code + '' + machine.number,
            data: [],
            pointRadius: 0,
            borderColor: generateRandomColor(machine.number),
            backgroundColor: generateRandomColor(machine.number),
            fill: false,
            hidden: false,
            order: machine.number
        }
        var data2 = {
            type: 'line',
            label:  WINDFARM.wtg_code + '' + machine.number,
            data: [],
            pointRadius: 0,
            borderColor: generateRandomColor(machine.number),
            backgroundColor: generateRandomColor(machine.number),
            fill: false,
            hidden: false,
            order: machine.number
        }
        
        $.ajax({
            url: 'php/getDashboardData.php',
            data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': WINDFARM.idPark, 'machine': machine, 'startdate': startdate, 'finaldate': finaldate },
            type: 'POST',
            dataType: 'json',
            async: true,
    
            success: function (json) {
                cont++;
        
                //Load loadbars
                document.querySelectorAll(".progress").forEach(element => {
                    element.style.width = (cont * 100 / MACHINE.length) + "%"
                    element.style.backgroundColor = element.getAttribute('data-color')
                })

                //Creates a graph for each type
                json.forEach(component => {
                    if(component.comp == 'power' || component.comp == 'rotorSpeed'){
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

                        if(component.comp == 'power'){
                            data.data = avg;
                        }else if(component.comp == 'rotorSpeed'){
                            data2.data = avg;
                        }
                    }
                })

                myChart.data.datasets.push(data)
                myChart2.data.datasets.push(data2)
                myChart.update();
                myChart2.update();

                if(machine == MACHINE[MACHINE.length - 1]){
                    $("#second-container").css('display', 'block')
                    $(".loading-container").css('display', 'none')
                }
            },
    
            error: function (xhr, status) {
                console.log('There is an error -> ' + xhr.responseText);
                //window.location.href = "Error";
            }
        });
    })


    document.getElementById('power-curve-data-hide').addEventListener('click', () => {
        for(var i = 0; i < myChart.data.datasets.length; i++){
            myChart.hide(i)
        }
        $("#power-curve-data-hide-container").addClass('d-none')
        $("#power-curve-data-show-container").removeClass('d-none')
        myChart.update();
    })
    document.getElementById('power-curve-data-show').addEventListener('click', () => {
        for(var i = 0; i < myChart.data.datasets.length; i++){
            myChart.show(i)
        }
        $("#power-curve-data-show-container").addClass('d-none')
        $("#power-curve-data-hide-container").removeClass('d-none')
        myChart.update();
    })

    document.getElementById('rotor-speed-data-hide').addEventListener('click', () => {
        for(var i = 0; i < myChart2.data.datasets.length; i++){
            myChart2.hide(i)
        }
        $("#rotor-speed-data-hide-container").addClass('d-none')
        $("#rotor-speed-data-show-container").removeClass('d-none')
        myChart2.update();
    })
    document.getElementById('rotor-speed-data-show').addEventListener('click', () => {
        for(var i = 0; i < myChart2.data.datasets.length; i++){
            myChart2.show(i)
        }
        $("#rotor-speed-data-show-container").addClass('d-none')
        $("#rotor-speed-data-hide-container").removeClass('d-none')
        myChart2.update();
    })
}

/**
 * Generates a random hex color
 * @param {name} var Variable of the color to generate
 * @returns {Stirng} hexadecimal color
 */
 function generateRandomColor(variable){
    if (!(variable in graph_colors)){
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        graph_colors[variable] = color
    }
    
    return graph_colors[variable]
}

function loadEnergyProductionGraph(){
    var myChart3 = new Chart(document.getElementById('energy-production-graph'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [                
                {
                label: 'Energy production',
                data: [],
                backgroundColor: ["#FEDFCB", "#FDA872"],
                type: 'bar',
                pointRadius: 6,
                pointStyle: 'rectRot',
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
    var legend3 = {}
    var cont = 0
    $('#real').append("<div class='graph-legend' id='real-legend'></div>")
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWT', 'windFarm': WINDFARM.idPark, 'wtg':null,'range': PERFORMANCE_KPI_RANGE },
        type: 'POST',
        dataType: 'json',
        async: false,
    
        success: function (machine) {
            MACHINE = machine.data
            //Generate body for each machine
            machine.data.forEach(wtg => {
                var pwr = wtg.power
                var strup = '-'
                pwr = Math.round(pwr * 1000) / 1000
                if(wtg.wtg_startup != null){
                    strup = wtg.wtg_startup.substring(0,4)
                }
    
                $.ajax({
                    url: 'php/getData.php',
                    data: { 'callFunc': 'getKpis', 'windFarm': WINDFARM.idPark, 'machine': wtg.wtg_number, 'range': PERFORMANCE_KPI_RANGE },
                    type: 'POST',
                    dataType: 'json',
                    async: false,
                
                    success: function (json) {
                        var data3 = {
                            label: WINDFARM.wtg_code + '' + wtg.wtg_number,
                            data: [parseFloat(json.production)],   
                            backgroundColor: ["#FEDFCB", "#FDA872"],
                            type: 'bar',
                            pointRadius: 6,
                            borderRadius: 5,
                            pointStyle: 'rectRot',
                            lineWidth: 7
                        }

                        myChart3.data.labels.push( WINDFARM.wtg_code + '' + wtg.wtg_number)
                        myChart3.data.datasets[0].data.push(parseFloat(json.production))
                        myChart3.update()
                        legend3[wtg.wtg_number] = parseFloat(json.production)

/*                         $('#real-legend').append("<div id=" + wtg.wtg_number + "><img src='images/icons/check_box.svg' alt='' value=" + cont + "><span>RM- " +  wtg.wtg_number  +"</span></div>")
                        $('#real-legend> #'+ wtg.wtg_number +' > span').css('border-color', legend3[wtg.wtg_number].borderColor);
                        cont++; */

                        if(Object.keys(legend3).length == machine.data.length){
                            $('#real-legend > div > img').click(function(){
                                var src = ($(this).attr("src") === "images/icons/check_box.svg")
                                ? "images/icons/empty_box.svg" 
                                : "images/icons/check_box.svg";
                                $(this).attr("src", src);
                                toggleData($(this).attr('value'), myChart3)
                            }) 
                        }
                    },
                
                    error: function (xhr, status) {
                        console.log('There is an error -> ' + xhr.responseText)
                        //window.location.href = "Error"
                    }
                })
            });
        },
    
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function loadPowerCurve(){
    var legend = {}
        //Set range dates
        var startdate = null
        var finaldate = null
        var months = 0
    
        switch(PERFORMANCE_KPI_RANGE+''){
            case '0':
                finaldate = TODAY
                months = 1
                break;
            case '1':
                finaldate = TODAY
                months = 3
                break;
            case '2':
                finaldate = TODAY
                months = 6
                break;
            case '3':
                finaldate = TODAY
                months = 12
                break;
        }
    
        startdate = new Date()
        startdate = new Date(startdate.setMonth(startdate.getMonth() - months));
        var dd = startdate.getDate()
        var mm = startdate.getMonth() + 1 //January is 0!
        var yyyy = startdate.getFullYear()
    
        if (dd < 10) {
        dd = '0' + dd
        }
        if (mm < 10) {
        mm = '0' + mm
        }
    
        startdate = yyyy + '-' + mm + '-' + dd
        
        //Clear and show performance graphs
        //Generate canvas
        
        var myChart = new Chart(document.getElementById('power-curve-graph'), {
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
                                $('#power-curve-reset').show()
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
                },
                //Set point click action
                onClick(e) {
                    const activePoints = myChart.getElementsAtEventForMode(e, 'nearest', {
                        intersect: true
                    }, false)
                    console.log(activePoints)
                    const [{
                        index
                    }] = activePoints;
    
                    if(activePoints.length){
                        const firstPoint = activePoints[0];
                        analytics2smartdata(myChart.data.datasets[firstPoint.datasetIndex].label.split('-')[1], 'mp')
                    }
                }
            }
        });

        $('#power').append("<div class='graph-legend' id='power-legend'><div class='select-all'><img src='images/icons/check_box.svg' alt=''><span>Select all</span></div><div id='power-legend2'></div></div>")
        var cont = 0;
    
            //Power curve of models
            $.ajax({
                url: 'php/getData.php',
                data: { 'callFunc': 'getWindfarmModels', 'windFarm': WINDFARM.idPark},
                type: 'POST',
                dataType: 'json',
                async: true,
                
                success: function (json) {
        
                    json.forEach(model => {
                        $.ajax({
                            url: 'php/getData.php',
                            data: { 'callFunc': 'getPowerCurveModels', 'model': model},
                            type: 'POST',
                            dataType: 'json',
                            async: true,
                            
                            success: function (json) {
                                array_power_curve = []
                                json.forEach(result => {
                                    array_power_curve.push({x: result['wind_speed'], y: result['power']})
                                });
                                var dataOEM = {
                                    type: 'line',
                                    label: 'OEM-' + model,
                                    data: array_power_curve,
                                    pointRadius: 0,
                                    borderColor: '#bcbcbc',
                                    backgroundColor: '#bcbcbc',
                                    fill: false,
                                    hidden: false
                                }
                                myChart.data.datasets.push(dataOEM);
                                myChart.update();
                                legend[model.split(" ").join("").split(".").join("")] = dataOEM
                                legend[model.split(" ").join("").split(".").join("")].value = cont


/*                                 $('#power-legend2').append("<div id='OEM'><img src='images/icons/check_box.svg' alt='' value=" + cont + "><span>" + legend['OEM'].label + "</span></div>")
                                $('#power-legend2> #OEM > span').css('border-bottom', 'solid 3px');
                                $('#power-legend2> #OEM > span').css('border-color', legend['OEM'].borderColor); */
                                
                                cont++;

                            },
                            error: function (xhr) {
                                console.log('There is an error -> ' + xhr.responseText);
                                //window.location.href = "Error";
                            }
                        });
                    })

                    //Gets graphs info for each machine
                    MACHINE.forEach(machine => {
                        var data = {
                            type: 'line',
                            label:  WINDFARM.wtg_code + '' + machine.number,
                            data: [],
                            pointRadius: 0,
                            borderColor: generateRandomColor(machine.number),
                            backgroundColor: generateRandomColor(machine.number),
                            fill: false,
                            hidden: false
                        }
                        
                        $.ajax({
                            url: 'php/getDashboardData.php',
                            data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': WINDFARM.idPark, 'machine': machine, 'startdate': startdate, 'finaldate': finaldate },
                            type: 'POST',
                            dataType: 'json',
                            async: true,
                    
                            success: function (json) {
                        
                                //Load loadbars
                                document.querySelectorAll(".progress").forEach(element => {
                                    element.style.width = (cont * 100 / MACHINE.length) + "%"
                                    element.style.backgroundColor = element.getAttribute('data-color')
                                })
                
                                //Creates a graph for each type
                                json.forEach(component => {
                                    if(component.comp == 'power'){
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
                
                                        if(component.comp == 'power'){
                                            data.data = avg;
                                        }
                                    }
                                })
                                myChart.data.datasets.push(data)
                                myChart.update();
                                
                                legend[machine.number] = data
                                legend[machine.number].value = cont

                                cont++;
                                if(Object.keys(legend).length == MACHINE.length+1){
                                    Object.keys(legend).forEach(key => {
                                        $('#power-legend2').append("<div id=" + key + "><img src='images/icons/check_box.svg' alt='' value=" + legend[key].value + "><span>" + legend[key].label +"</span></div>")
                                        $('#power-legend2> #'+ key +' > span').css('border-bottom', 'solid 3px');
                                        $('#power-legend2> #'+ key +' > span').css('border-color', legend[key].borderColor);
                                    });

                                    $('#power-legend2 > div > img').click(function(){
                                        var src = ($(this).attr("src") === "images/icons/check_box.svg")
                                        ? "images/icons/empty_box.svg" 
                                        : "images/icons/check_box.svg";
                                        $(this).attr("src", src);
                                        toggleData($(this).attr('value'), myChart)
                                    }) 
                                    
                                    $('#power-legend > .select-all > img').click(function(){
                                        var src;
                                        var value;
                                        if($(this).attr("src") == "images/icons/check_box.svg"){
                                            src = "images/icons/empty_box.svg"
                                            value = 'hide' 
                                            for (let index = 0; index < MACHINE.length+1; index++) {
                                                myChart.hide(index)
                                            }
                                        }
                                        else{
                                            src = "images/icons/check_box.svg"
                                            value = 'show'
                                            for (let index = 0; index < MACHINE.length+1; index++) {
                                                myChart.show(index)
                                            }
                                        }
                                        $(this).attr("src", src);
                                        $('#power-legend2 > div > img').attr("src", src);   
                                    }) 

                                }  
            
                                if(machine == MACHINE[MACHINE.length - 1]){
                                }
                            },
                    
                            error: function (xhr, status) {
                                console.log('There is an error -> ' + xhr.responseText);
                                //window.location.href = "Error";
                            }
                        });
                    })
                },
                error: function (xhr) {
                    console.log('There is an error -> ' + xhr.responseText);
                    //window.location.href = "Error";
                }
            });
    
        document.getElementById("power-curve-reset").addEventListener("click", () => {
            myChart.resetZoom();
            $("#power-curve-reset").hide()
        })
    
    
/*         document.getElementById('power-curve-data-hide').addEventListener('click', () => {
            for(var i = 0; i < myChart.data.datasets.length; i++){
                myChart.hide(i)
            }
            $("#power-curve-data-hide-container").addClass('d-none')
            $("#power-curve-data-show-container").removeClass('d-none')
            myChart.update();
        })
        document.getElementById('power-curve-data-show').addEventListener('click', () => {
            for(var i = 0; i < myChart.data.datasets.length; i++){
                myChart.show(i)
            }
            $("#power-curve-data-show-container").addClass('d-none')
            $("#power-curve-data-hide-container").removeClass('d-none')
            myChart.update();
        }) */
}

function loadAngularRotorSpeed() {
    var legend2 = {}
    //Set range dates
    var startdate = null
    var finaldate = null
    var months = 0

    switch(PERFORMANCE_KPI_RANGE+''){
        case '0':
            finaldate = TODAY
            months = 1
            break;
        case '1':
            finaldate = TODAY
            months = 3
            break;
        case '2':
            finaldate = TODAY
            months = 6
            break;
        case '3':
            finaldate = TODAY
            months = 12
            break;
    }

    startdate = new Date()
    startdate = new Date(startdate.setMonth(startdate.getMonth() - months));
    var dd = startdate.getDate()
    var mm = startdate.getMonth() + 1 //January is 0!
    var yyyy = startdate.getFullYear()

    if (dd < 10) {
    dd = '0' + dd
    }
    if (mm < 10) {
    mm = '0' + mm
    }

    startdate = yyyy + '-' + mm + '-' + dd
    
    //Clear and show performance graphs
    //Generate canvas
    

    var myChart2 = new Chart(document.getElementById('rotor-speed-graph'), {
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
                            $('#rotor-speed-reset').show()
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
                    analytics2smartdata(myChart.data.datasets[firstPoint.datasetIndex].label.split('-')[1], 'mp')
                }
            }
        }
    });

/*     document.getElementById("power-curve-reset").addEventListener("click", () => {
        myChart.resetZoom();
    })

 */
    $('#rotor').append("<div class='graph-legend' id='rotor-legend'><div class='select-all'><img src='images/icons/check_box.svg' alt=''><span>Select all</span></div><div id='rotor-legend2'></div></div></div>")
    var cont = 0;
    //Gets graphs info for each machine
    MACHINE.forEach(machine => {
        var data2 = {
            type: 'line',
            label: WINDFARM.wtg_code + '' + machine.number,
            data: [],
            pointRadius: 0,
            borderColor: generateRandomColor(machine.number),
            backgroundColor: generateRandomColor(machine.number),
            fill: false,
            hidden: false,
        }
        
        $.ajax({
            url: 'php/getDashboardData.php',
            data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': WINDFARM.idPark, 'machine': machine, 'startdate': startdate, 'finaldate': finaldate },
            type: 'POST',
            dataType: 'json',
            async: true,
    
            success: function (json) {
        
                //Load loadbars
                document.querySelectorAll(".progress").forEach(element => {
                    element.style.width = (cont * 100 / MACHINE.length) + "%"
                    element.style.backgroundColor = element.getAttribute('data-color')
                })

                //Creates a graph for each type
                json.forEach(component => {
                    if(component.comp == 'rotorSpeed'){
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

                        data2.data = avg;
                        
                    }
                })

                myChart2.data.datasets.push(data2)
                myChart2.update();

                legend2[machine.number] = data2
                legend2[machine.number].value = cont
                cont++;
                if(Object.keys(legend2).length == MACHINE.length){

                    Object.keys(legend2).forEach(key => {
                        $('#rotor-legend2').append("<div id=" + key + "><img src='images/icons/check_box.svg' alt='' value=" + legend2[key].value + "><span>" + legend2[key].label  +"</span></div>")
                        $('#rotor-legend2> #'+ key +' > span').css('border-bottom', 'solid 3px');
                        $('#rotor-legend2> #'+ key +' > span').css('border-color', legend2[key].borderColor);
                    });


                    $('#rotor-legend2 > div > img').click(function(){
                        var src = ($(this).attr("src") === "images/icons/check_box.svg")
                        ? "images/icons/empty_box.svg" 
                        : "images/icons/check_box.svg";
                        $(this).attr("src", src);
                        toggleData($(this).attr('value'), myChart2)
                    }) 

                    $('#rotor-legend > .select-all > img').click(function(){
                        var src;
                        var value;
                        if($(this).attr("src") == "images/icons/check_box.svg"){
                            src = "images/icons/empty_box.svg"
                            value = 'hide' 
                            for (let index = 0; index < MACHINE.length; index++) {
                                myChart2.hide(index)
                            }
                        }
                        else{
                            src = "images/icons/check_box.svg"
                            value = 'show'
                            for (let index = 0; index < MACHINE.length; index++) {
                                myChart2.show(index)
                            }
                        }
                        $(this).attr("src", src);
                        $('#rotor-legend2 > div > img').attr("src", src);   
                    }) 
                }  

                if(machine == MACHINE[MACHINE.length - 1]){
                    $(".content-header").removeClass('invisible')
                    $(".content-body").removeClass('invisible')
                    $(".loading-container").addClass('d-none')
                }
            },
    
            error: function (xhr, status) {
                console.log('There is an error -> ' + xhr.responseText);
                //window.location.href = "Error";
            }
        });
    })

    document.getElementById("rotor-speed-reset").addEventListener("click", () => {
        myChart2.resetZoom();
        $("#rotor-speed-reset").hide()
    })

/*     document.getElementById('rotor-speed-data-hide').addEventListener('click', () => {
        for(var i = 0; i < myChart2.data.datasets.length; i++){
            myChart2.hide(i)
        }
        $("#rotor-speed-data-hide-container").addClass('d-none')
        $("#rotor-speed-data-show-container").removeClass('d-none')
        myChart2.update();
    })
    document.getElementById('rotor-speed-data-show').addEventListener('click', () => {
        for(var i = 0; i < myChart2.data.datasets.length; i++){
            myChart2.show(i)
        }
        $("#rotor-speed-data-show-container").addClass('d-none')
        $("#rotor-speed-data-hide-container").removeClass('d-none')
        myChart2.update();
    }) */
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

loadPerformanceKPIs()
loadPowerCurve()
loadAngularRotorSpeed()
loadEnergyProductionGraph()

if(WINDFARM.idPark == 'CCROES' || WINDFARM.idPark == 'OUROL'){
    $('#subview').css('grid-template-areas', '"power power" "real real"')
    $('#rotor').hide()
}

$('.reload-graph').hide()
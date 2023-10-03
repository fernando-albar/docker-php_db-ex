document.getElementById("dashboards").classList.add("panel-selected")

if(USER_EMAIL == 'demo.user@nablawindhub.com'){
    $('#map-nav #performance_map').show()
}

var loadWFlist = true
$('#periods').change(function(){
    $("#windfarms-list").empty()
    wfList = {}
    KPI_RANGE = this.value
    loadWFlist = true
    loadKPIs(null)
    loadMainAnalyticsMap()
});

$('.kpi-card').hover(function(){
    $(this).children('p').last().show()
    }, function () {
        $(this).children('p').last().hide()
});

document.getElementById('fatigue_map').addEventListener('click', () => {
    $("#fatigue_map").toggleClass('cn-orange')
    $("#fatigue_map").toggleClass('nav-map-selected')
    $('#extreme_map').removeClass('cn-orange')
    $('#extreme_map').removeClass('nav-map-selected')
    $('#performance_map').removeClass('cn-orange')
    $('#performance_map').removeClass('nav-map-selected')
    loadWFlist = false
    loadMainAnalyticsMap()
})

document.getElementById('extreme_map').addEventListener('click', () => {
    $("#extreme_map").toggleClass('cn-orange')
    $("#extreme_map").toggleClass('nav-map-selected')
    $('#fatigue_map').removeClass('cn-orange')
    $('#fatigue_map').removeClass('nav-map-selected')
    $('#performance_map').removeClass('cn-orange')
    $('#performance_map').removeClass('nav-map-selected')
    loadWFlist = false
    loadMainAnalyticsMap()
})

document.getElementById('performance_map').addEventListener('click', () => {
    $("#performance_map").toggleClass('cn-orange')
    $("#performance_map").toggleClass('nav-map-selected')
    $('#fatigue_map').removeClass('cn-orange')
    $('#fatigue_map').removeClass('nav-map-selected')
    $('#extreme_map').removeClass('cn-orange')
    $('#extreme_map').removeClass('nav-map-selected')
    loadWFlist = false
    loadMainAnalyticsMap()
})

$('.kpi-img').hover(function(){
    $('.cardK').css('transition', '1s ease-in-out')
    $(this).parents('.cardK').css('transform', 'rotateY(0.5turn)')
    img = $(this)
},
function(){
    $(img.parents('.cardK')).hover(function(){

    },
    function(){
        $(this).css('transform', 'none')
    });
});


var models = []
var wfList = {}
var wfs;
function loadKPIs(wf){
    if(wf == null){
        idPark = null
    }
    else{
        idPark = wf.idPark
    }
    
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getKpis', 'windFarm': idPark, 'machine': null, 'range': KPI_RANGE },
        type: 'POST',
        dataType: 'json',
    
        success: function (json) {
            if(wf == null){
                $("#power-kpis").text(parseFloat(json.capacity) + "MW")
                $("#availability-kpis").text((Math.round(json.availability * 100) / 100) + "%")
                $("#availability-ratio-kpis").text((Math.round((json.availability / 97) * 100)) + "%")
                $("#performance-kpis").text((Math.round(json.performance * 100) / 100) + "%")
                $("#production-kpis").text((Math.round(json.production * 100) / 100) + "GWh")
                $("#extreme_1-kpis").text(json.extreme_1)
                $("#extreme_2-kpis").text(json.extreme_2)
                $("#extreme_3-kpis").text(json.extreme_3)
                $("#failures-kpis").text(json.failures)
                $("#opex-kpis").text((Math.round(json.opex)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "k€")
            }
            else{
                wfList[wf.idPark] = {
                    'kpi': {},
                    'info': {}
                }
                wfList[wf.idPark]['kpi'] = json
                wfList[wf.idPark]['info'] = wf
                /* $("#windfarms-list").append("<div class='windfarm-card'><div><p class='fn-600 fs-20 fh-26'>" + wf.name + "</p><p class='fn-400 fs-12 fh-15 mt-10'>WTG model: V90 2MW<br>COD:" + wf.startUp + "</p><p class='fn-700 fs-15 fh-22 color-orange mt-20'>GENERAL WIND FARM KPIS</p><p class='fn-400 fs-15 fh-18 mt-10'>Total Capacity</p><p class='fn-700 fs-15 fh-18'>" + parseFloat(json.capacity) + "MW</p><p class='fn-400 fs-15 fh-18 mt-10'>Average Availability</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(json.availability * 100) / 100) + "%</p><p class='fn-400 fs-15 fh-18 mt-10'>Real Performance Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(json.performance * 100) / 100) + "%</p><p class='fn-400 fs-15 fh-18 mt-10'>Real Production</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(json.production * 100) / 100) + "GWh</p><p class='fn-400 fs-15 fh-18 mt-10'>Extreme Loads</p><div id='cards-extremes' class='fn-700 fs-15 fh-18'><div>" + json.extreme_1 + "<img src='images/icons/Vector-yellow.svg'></div><div>" + json.extreme_2 + "<img src='images/icons/Vector-orange.svg'></div><div>" + json.extreme_3 + "<img src='images/icons/Vector-red.svg'></div></div><p class='fn-400 fs-15 fh-18 mt-10'>Real availability Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round((json.availability / 97) * 100)) + "%</p></div><div><img src='images/farm_card.png'><div class='kpi'><p class='fn-500 fs-15 fh-18 color-white'>Forecast 2 years</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Failures</p><p class='fn-700 fs-15 fh-18'>" + json.failures + "</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Preventive OPEX</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(json.opex)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "k€</p></div></div></div>")
 */            
                if(Object.keys(wfList).length == Object.keys(wfs).length){
                    loadWFList(wfList)
                }
            }
/*             console.log(wfList)
            console.log(Object.keys(wfList).length, wfs) */

/*             $('.windfarm-card').click(function(){
                WINDFARM = wf
                pageChange('windfarm')
            }); */
        },
    
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function loadMainAnalyticsMap(){
    //Get windfarms data
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWindFarms' },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            //Get windfarms latitude and longitude max and min
            wfs = json.windFarms
            var la = [100,-100]
            var lo = [100,-100]
            Object.keys(wfs).forEach(wf => {
                if(wfs[wf].lat < la[0]){
                    la[0] = wfs[wf].lat;
                }
                if(wfs[wf].lng < lo[0]){
                    lo[0] = wfs[wf].lng;
                }

                if(wfs[wf].lat > la[1]){
                    la[1] = wfs[wf].lat;
                }
                if(wfs[wf].lng > lo[1]){
                    lo[1] = wfs[wf].lng;
                }
            })
            
            //Set the map options with the center in the middle of the windfarms
/*             var mapOptions = {
                center: {lat: parseFloat(la[0]) + (la[1]-la[0])/2, lng: parseFloat(lo[0]) + (lo[1]-lo[0])/2},
                clickableIcons: true,
                disableDoubleClickZoom: false,
                draggable: true,
                fullscreenControl: false,
                keyboardShortcuts: true,
                mapMaker: false,
                mapTypeControl: false,
                mapTypeControlOptions: {text: "Default (depends on viewport size etc.)", style: 0},
                mapTypeId: "hybrid",
                rotateControl: true,
                scaleControl: true,
                scrollwheel: true,
                streetViewControl: false,
                styles: false,
                zoom: 4.5,
                zoomControl: true,
            }; */

            var mapOptions = {
                center: {lat: parseFloat(la[0]) + (la[1]-la[0])/2, lng: parseFloat(lo[0]) + (lo[1]-lo[0])/2},
                clickableIcons: true,
                disableDoubleClickZoom: false,
                draggable: true,
                fullscreenControl: false,
                keyboardShortcuts: true,
                mapMaker: false,
                mapTypeControl: false,
                mapTypeControlOptions: {text: "Default (depends on viewport size etc.)", style: 0},
                rotateControl: true,
                scaleControl: true,
                scrollwheel: true,
                streetViewControl: false,
                zoom: 3,
                mapId: '732fe30f7c7c7473'
            }
            var mapElement = document.getElementById('map');
            var map = new google.maps.Map(mapElement, mapOptions);

            var markers = [];

            //Set windfarms as markers
            Object.keys(wfs).forEach(wf => {
                if(loadWFlist){
                    loadKPIs(wfs[wf])
                }
                //Set machines color if the lens are selected
                var aero_color = "dot-white";
                if($("#fatigue_map").hasClass("cn-orange")){
                    if(wfs[wf].analytics[KPI_RANGE][5] < 2){
                        aero_color = "dot-red";
                    }else if(wfs[wf].analytics[KPI_RANGE][5] < 5){
                        aero_color = "dot-orange";
                    }else{
                        aero_color = "dot-green";
                    }
                }

                if($("#extreme_map").hasClass("cn-orange")){
                    if(wfs[wf].analytics[KPI_RANGE][4] > 0){
                        aero_color = "dot-red";
                    }else if(wfs[wf].analytics[KPI_RANGE][3] > 0){
                        aero_color = "dot-orange";
                    }else if(wfs[wf].analytics[KPI_RANGE][2] > 0){
                        aero_color = "dot-yellow";
                    }else{
                        aero_color = "dot-green";
                    }
                }

                if($("#performance_map").hasClass("cn-orange")){
                    if(wfs[wf].analytics[KPI_RANGE][1] < 75){
                        aero_color = "dot-red";
                    }else if(wfs[wf].analytics[KPI_RANGE][1] < 90){
                        aero_color = "dot-orange";
                    }else{
                        aero_color = "dot-green";
                    }
                }

/*                 var markerPos = new L.LatLng(wfs[wf].lat, wfs[wf].lng);
                var pinAnchor = new L.Point(23, 47);
                var pin = new L.Icon({ iconUrl: "images/aeros/"+ aero_color +".gif", iconAnchor: pinAnchor });
                L.marker(markerPos, { icon: pin }).addTo(map); */

                var marker = new google.maps.Marker({
                    title: "WindFarm " + wfs[wf].name,
                    icon: {
                        url: "images/aeros/"+ aero_color +".gif",
                        anchor: new google.maps.Point(23, 23)
                    },
                    position: new google.maps.LatLng(wfs[wf].lat, wfs[wf].lng),
                    map: map

                });

                markers.push(marker)

                //Set machines actions
                markers[markers.length - 1].addListener('click', function () {
                    WINDFARM = wfs[wf]
                    $.ajax({
                        url: 'php/getDashboardData.php',
                        data: { 'callFunc': 'loadWfMachines', 'windFarm': WINDFARM.idPark },
                        type: 'POST',
                        dataType: 'json',
                    
                        success: function (json) {
                            WINDFARM.machines = json.machines
                            if($("#fatigue_map").hasClass("cn-orange")){
                                pageChange("windfarmFatigue")
                            }else if($("#extreme_map").hasClass("cn-orange")){
                                pageChange("windfarmExtreme")
                            }else if($("#performance_map").hasClass("cn-orange")){
                                pageChange("windfarmPerformance")
                            }else{
                                pageChange("windfarm")
                            }
                        },
                    
                        error: function (xhr, status) {
                            console.log('There is an error -> ' + xhr.responseText)
                            //window.location.href = "Error"
                        }
                    })
                });
            })

            google.maps.event.addDomListener(window, "resize", function () {
                var center = map.getCenter();
                google.maps.event.trigger(map, "resize");
                map.setCenter(center);
            });
			
			$(".content-header").removeClass('invisible')
			$(".content-body").removeClass('invisible')
			$(".loading-container").addClass('d-none')
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function loadWFList(wfList){

    Object.keys(wfList).forEach(key => {

        $.ajax({
            url: 'php/getDashboardData.php',
            data: { 'callFunc': 'loadWfMachines', 'windFarm': key },
            type: 'POST',
            dataType: 'json',
        
            success: function (json) {
                wfList[key]['info'].models = []
                wfList[key]['info'].machines = json.machines
                Object.keys(wfList[key]['info']['machines']).forEach(wtg => {
                    if(!wfList[key]['info'].models.includes(wfList[key]['info']['machines'][wtg].turbineType)){
                        wfList[key]['info'].models.push(wfList[key]['info']['machines'][wtg].turbineType)
                    }
                })

                $('#windfarms-list').append("<div class='windfarm-card' id='wf-"+key+"'><div><p class='fn-600 fs-20 fh-26'>" + wfList[key]['info'].name + "</p><p class='fn-400 fs-12 fh-15 mt-10'>WTG model: " + wfList[key]['info']['models'] + "<br>COD: " + wfList[key]['info'].startUp + "</p><p class='fn-700 fs-15 fh-22 color-orange mt-20'>GENERAL WIND FARM KPIS</p><p class='fn-400 fs-15 fh-18 mt-10'>Total Capacity</p><p class='fn-700 fs-15 fh-18'>" + parseFloat(wfList[key]['kpi'].capacity) + "MW</p><p class='fn-400 fs-15 fh-18 mt-10'>Average Availability</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(wfList[key]['kpi'].availability * 100) / 100) + "%</p><p class='fn-400 fs-15 fh-18 mt-10'>Real Performance Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(wfList[key]['kpi'].performance * 100) / 100) + "%</p><p class='fn-400 fs-15 fh-18 mt-10'>Real Production</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(wfList[key]['kpi'].production * 100) / 100) + "GWh</p><p class='fn-400 fs-15 fh-18 mt-10'>Extreme Loads</p><div id='cards-extremes' class='fn-700 fs-15 fh-18'><div>" + wfList[key]['kpi'].extreme_1 + "<img src='images/icons/Vector-yellow.svg'></div><div>" + wfList[key]['kpi'].extreme_2 + "<img src='images/icons/Vector-orange.svg'></div><div>" + wfList[key]['kpi'].extreme_3 + "<img src='images/icons/Vector-red.svg'></div></div><p class='fn-400 fs-15 fh-18 mt-10'>Real Availability Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round((wfList[key]['kpi'].availability / 97) * 100)) + "%</p></div><div><img src='images/farm_card.png'><div class='kpi'><p class='fn-500 fs-15 fh-18 color-white'>Forecast 2 years</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Failures</p><p class='fn-700 fs-15 fh-18'>" + wfList[key]['kpi'].failures + "</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Preventive OPEX</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(wfList[key]['kpi'].opex)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "k€</p></div></div></div>")
                $('#wf-'+key).click(function(){
                    WINDFARM = wfList[key]['info']
                    pageChange('windfarm')
                });
            },
        
            error: function (xhr, status) {
                console.log('There is an error -> ' + xhr.responseText)
                //window.location.href = "Error"
            }
        })
    });
}


loadKPIs(null)
loadMainAnalyticsMap()


var loadWTGlist = true

if(USER_EMAIL == 'demo.user@nablawindhub.com'){
    $('#map-nav #performance_map').show()
}

$('#windfarm-nav li').off('click')
$('#periods').change(function(){
    $("#wtgs-list").empty()
    KPI_RANGE = this.value
    wtgList = {}
    loadKPIs(null)
    loadWTGlist = true
    loadWindfarmAnalyticsMap()
});

$('.kpi-card').hover(function(){
    $(this).children('p').last().show()
    }, function () {
        $(this).children('p').last().hide()
});

$('#windfarm-nav #portfolio').click(function(){
    pageChange('mainAnalytics')
});

$('#windfarm-nav #overview').click(function(){
    pageChange('windfarm')
});

$('#windfarm-nav #fatigue').click(function(){
    pageChange('windfarmFatigue')
});

$('#windfarm-nav #extreme').click(function(){
    pageChange('windfarmExtreme')
});

$('#windfarm-nav #performance').click(function(){
    pageChange('windfarmPerformance')
});

$('.wtg-card').click(function(){
    pageChange('wtg')
});

if(USER_EMAIL != 'ops@nablawindhub.com' && USER_EMAIL != 'demo.user@nablawindhub.com'  && USER_EMAIL != 'ecoener@nablawindhub.com' && USER_EMAIL != 'vector4@nablawindhub.com'){
    $('#btn-repairs').hide()
}

$('#btn-repairs').click(function(){
    $('#repairs').css('display', 'flex')
    $('html, body').animate({   
        scrollTop: $("#repairs").offset().top
    });
    $('body').css('overflow', 'hidden')
});

$('#repairs-close-btn').click(function(){
    $("#repairs").css({'display': 'none'})
    $('body').css('overflow', 'initial')
})

$('#repairs-components-close-btn').click(function(){
    $("#repairs-components").css({'display': 'none'})
})

$('#repairs li span').click(function(){
    $(this).parent('li').children('p').toggle()
});


$('#title #wf').text(WINDFARM.name)
$("#wtgs-list").empty()

document.getElementById('fatigue_map').addEventListener('click', () => {
    $("#fatigue_map").toggleClass('cn-orange')
    $("#fatigue_map").toggleClass('nav-map-selected')
    $('#extreme_map').removeClass('cn-orange')
    $('#extreme_map').removeClass('nav-map-selected')
    $('#performance_map').removeClass('cn-orange')
    $('#performance_map').removeClass('nav-map-selected')
    loadWTGlist = false
    loadWindfarmAnalyticsMap()
})

document.getElementById('extreme_map').addEventListener('click', () => {
    $("#extreme_map").toggleClass('cn-orange')
    $("#extreme_map").toggleClass('nav-map-selected')
    $('#fatigue_map').removeClass('cn-orange')
    $('#fatigue_map').removeClass('nav-map-selected')
    $('#performance_map').removeClass('cn-orange')
    $('#performance_map').removeClass('nav-map-selected')
    loadWTGlist = false
    loadWindfarmAnalyticsMap()
})

document.getElementById('performance_map').addEventListener('click', () => {
    $("#performance_map").toggleClass('cn-orange')
    $("#performance_map").toggleClass('nav-map-selected')
    $('#fatigue_map').removeClass('cn-orange')
    $('#fatigue_map').removeClass('nav-map-selected')
    $('#extreme_map').removeClass('cn-orange')
    $('#extreme_map').removeClass('nav-map-selected')
    loadWTGlist = false
    loadWindfarmAnalyticsMap()
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
var wtgList = {}
function loadKPIs(wtg){
    if(wtg == null){
        wtg_number = null
    }
    else{
        var wtg_number = wtg.wtg_number
    }
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getKpis', 'windFarm': WINDFARM.idPark, 'machine': wtg_number, 'range': KPI_RANGE },
        type: 'POST',
        dataType: 'json',
    
        success: function (json) {
            if(wtg == null){
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
                json['turbine_model'] = wtg.turbine_model
                json['wtg_startup'] = wtg.wtg_startup
                json['wtg_number'] = wtg_number
                json['twr'] = wtg.twr
                json['idcell'] = wtg.idcell

                wtgList[wtg_number]=json
                //$('#wtgs-list').append("<div class='wtg-card'><div><p class='fn-600 fs-20 fh-26'>" + WINDFARM.idPark + "-"+wtg_number+"</p><p class='fn-400 fs-12 fh-15 mt-10'>WTG model: " + wtg.turbine_model.split(' ')[0] + ' 2MW' + "<br>COD: " + wtg.wtg_startup + "</p><p class='fn-700 fs-15 fh-22 color-orange mt-10'>WTG KPIS</p><p class='fn-400 fs-15 fh-18 mt-10'>Total Capacity</p><p class='fn-700 fs-15 fh-18'>" + parseFloat(json.capacity) + "MW</p><p class='fn-400 fs-15 fh-18 mt-10'>Average Availability</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(json.availability * 100) / 100) + "%<p class='fn-400 fs-15 fh-18 mt-10'>Real Performance Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(json.performance * 100) / 100) + "%</p><p class='fn-400 fs-15 fh-18 mt-10'>Real Production</p><p class='fn-700 fs-15 fh-18'>" +(Math.round(json.production * 100) / 100) + "GWh</p><p class='fn-400 fs-15 fh-18 mt-10'>Extreme Loads</p><p class='fn-700 fs-15 fh-18'>" + json.extreme_1 + "" + json.extreme_1 + "" + json.extreme_1 + "<hr></p><p class='fn-400 fs-15 fh-18 mt-10'>Real availability Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round((json.availability / 97) * 100)) + "%</p></div><div><img src='images/aero.svg'><div class='kpi'><p class='fn-500 fs-15 fh-18 color-white'>Forecast 2 years</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Preventive OPEX</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(json.opex)*1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "€</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Failures</p><p class='fn-700 fs-15 fh-18'>" + json.failures + "</p></div></div></div>")
                if(!models.includes(wtg.turbine_model)){
                    models.push(wtg.turbine_model)
                }
            }
            
            if(Object.keys(wtgList).length == Object.keys(WINDFARM.machines).length){
                $('#model').text('WTG model: ') 
                models.forEach(model => {
                    $('#model').append(model+ ' ')
                })

                $('#cod').text('COD: '+WINDFARM.startUp)
                loadWTGList(wtgList)
            }
        },
    
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function loadWindfarmAnalyticsMap(){
    //Get windfarms data
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWT', 'windFarm': WINDFARM.idPark, 'wtg': null, 'range': KPI_RANGE },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            //Get machines latitude and longitude max and min
            var la = [100,-100]
            var lo = [100,-100]
            json.data.forEach(wtg => {
                if(wtg.lat < la[0]){
                    la[0] = wtg.lat;
                }
                if(wtg.lng < lo[0]){
                    lo[0] = wtg.lng;
                }

                if(wtg.lat > la[1]){
                    la[1] = wtg.lat;
                }
                if(wtg.lng > lo[1]){
                    lo[1] = wtg.lng;
                }
            });

            //Set the map options with the center in the middle of the windfarm
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
                zoom: 13,
                zoomControl: true
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
                zoom: 13,
                mapId: '732fe30f7c7c7473'
            }

            var mapElement = document.getElementById('map');
            var map = new google.maps.Map(mapElement, mapOptions);

            var markers = [];

            //Set machines as markers
            json.data.forEach(wtg => {
                if(loadWTGlist){
                    loadKPIs(wtg)
                }
                var aero_color = "dot-white";
                if($("#fatigue_map").hasClass("cn-orange")){
                    if(wtg.expectancy < 2){
                        aero_color = "dot-red";
                    }else if(wtg.expectancy < 5){
                        aero_color = "dot-orange";
                    }else{
                        aero_color = "dot-green";
                    }
                }

                if($("#extreme_map").hasClass("cn-orange")){
                    if(wtg.extreme_3 > 0){
                        aero_color = "dot-red";
                    }else if(wtg.extreme_2 > 0){
                        aero_color = "dot-orange";
                    }else if(wtg.extreme_1 > 0){
                        aero_color = "dot-yellow";
                    }else{
                        aero_color = "dot-green";
                    }
                }

                if($("#performance_map").hasClass("cn-orange")){
                    if(wtg.performance < 75){
                        aero_color = "dot-red";
                    }else if(wtg.performance < 90){
                        aero_color = "dot-orange";
                    }else{
                        aero_color = "dot-green";
                    }
                }

                markers.push(new google.maps.Marker({
                    title: "WTG " + wtg.wtg_number,
                    icon: {
                        url: "images/aeros/"+ aero_color +".gif",
                        anchor: new google.maps.Point(23, 23)
                    },
                    position: new google.maps.LatLng(wtg.lat, wtg.lng),
                    map: map
                }));

                //Set machines actions
                markers[markers.length - 1].addListener('click', function () {
                    MACHINE = wtg
/*                     setMachineSelectByNumber(wtg.number) */
                    TURBINEMODEL = wtg.turbine_model
                    if($("#fatigue_map").hasClass("cn-orange")){
                        pageChange("wtgFatigueMap")
                    }else if($("#extreme_map").hasClass("cn-orange")){
                        pageChange("wtgExtremeMap")
                    }else if($("#performance_map").hasClass("cn-orange")){
                        pageChange("wtgPerformanceMap")
                    }else{
                        pageChange("wtg")
                    }
                });
            });

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

function loadWTGList(wtgList){
    Object.keys(wtgList).forEach(key => {
        $('#repairs-wtgs ul').append('<li id='+key+'>'+ WINDFARM.wtg_code + ' ' +key + '</li>')
        $('#repairs-wtgs ul li#'+key).click(function(){
            repairs(wtgList[key]);
        });
        $('#wtgs-list').append("<div class='wtg-card' id='wtg-"+key+"'><div><p class='fn-600 fs-20 fh-26'>" + WINDFARM.wtg_code + ""+key+"</p><p class='fn-400 fs-12 fh-15 mt-10'>WTG model: " + wtgList[key].turbine_model + "<br>COD: " + wtgList[key].wtg_startup + "</p><p class='fn-700 fs-15 fh-22 color-orange mt-20'>WTG KPIS</p><p class='fn-400 fs-15 fh-18 mt-10'>Total Capacity</p><p class='fn-700 fs-15 fh-18'>" + parseFloat(wtgList[key].capacity) + "MW</p><p class='fn-400 fs-15 fh-18 mt-10'>Average Availability</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(wtgList[key].availability * 100) / 100) + "%<p class='fn-400 fs-15 fh-18 mt-10'>Real Performance Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(wtgList[key].performance * 100) / 100) + "%</p><p class='fn-400 fs-15 fh-18 mt-10'>Real Production</p><p class='fn-700 fs-15 fh-18'>" +((wtgList[key].production * 100) / 100).toFixed(3) + "GWh</p><p class='fn-400 fs-15 fh-18 mt-10'>Extreme Loads</p><div id='cards-extremes' class='fn-700 fs-15 fh-18'><div>" + wtgList[key].extreme_1 + "<img src='images/icons/Vector-yellow.svg'></div><div>" + wtgList[key].extreme_2 + "<img src='images/icons/Vector-orange.svg'></div><div>" + wtgList[key].extreme_3 + "<img src='images/icons/Vector-red.svg'></div></div><p class='fn-400 fs-15 fh-18 mt-10'>Real Availability Ratio</p><p class='fn-700 fs-15 fh-18'>" + (Math.round((wtgList[key].availability / 97) * 100)) + "%</p></div><div><img src='images/aero.svg'><div class='kpi'><p class='fn-500 fs-15 fh-18 color-white'>Forecast 2 years</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Failures</p><p class='fn-700 fs-15 fh-18'>" + wtgList[key].failures + "</p><p class='fn-400 fs-15 fh-22 mt-10'>Short Term Preventive OPEX</p><p class='fn-700 fs-15 fh-18'>" + (Math.round(wtgList[key].opex)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "k€</p></div></div></div>")
        $('#wtg-'+key).click(function(){
            MACHINE = wtgList[key]
            TURBINEMODEL = wtgList[key].turbine_model
            pageChange('wtg')
        });
    });
}

function repairs(wtg){
    $('#repairs-components ul li').remove()
    $('#repairs-components').show()

    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getFatigueComponents', 'windFarm': WINDFARM.idPark, 'machine': wtg.wtg_number, 'idCell': wtg.idcell, 'turbineType': wtg.turbine_model, 'range': 0},
        type: 'POST',
        dataType: 'json',
     
        success: function (json) {
            $('#repairs-components #wtg_number').text(WINDFARM.wtg_code+''+wtg.wtg_number)
            //Set each one of the components
            json.components.forEach(component => {
                $('#repairs-components ul#'+component[0].position+'').append('<li id='+component[0].component+'><p>'+ component[0].name +'</p></li>')
            })

            $.ajax({
                url: 'php/getDashboardData.php',
                data: { 'callFunc': 'getComponentInstallationsRecord', 'windFarm': WINDFARM.idPark, 'wtg': wtg.wtg_number},
                type: 'POST',
                dataType: 'json',
             
                success: function (json) {
                    for(let component in json[0]){
                        $('#repairs-components ul #'+component).append('<div id='+component+' style=display:none></div>')
                        json[0][component].forEach(date => {
                            $('#repairs-components ul #'+component+' div#'+component).append('<div class=date id='+date+'><span>'+date+'</span><div id="icons"><i id = "edit" class="fa-solid fa-pen-to-square"></i><i id="remove" class="fa-solid fa-trash"></i></div>')
                            $('#repairs-components ul #'+component+' div#'+component).append('<div class=edit_date id=edit_'+date+' style=display:none><input id='+date+' type=date value='+date+'> <button id=accept>Accept</button></div>')
                            if(json[1] == date){
                                $('<p>Installation date:</p>').insertBefore($('#repairs-components ul #'+component+' div#'+date+' span'))
                                $('<p>Replacements:</p>').insertAfter($('#repairs-components ul #'+component+' div#'+date+' span'))
                                $('#repairs-components ul #'+component+' div#'+component+' div#'+date).css('display', 'initial')
                                $('#repairs-components ul #'+component+' div#'+component+' div#icons').css('display', 'none')
                            }
                            $('#repairs-components ul #'+component+' div#'+date+' i#edit').click(function(){
                                $(this).parents('div.date').toggleClass('editing')
                                $(this).parents('div.date').toggle()
                                $(this).parents('div.date').next('.edit_date').toggle()
                            })
                            $('#repairs-components ul #'+component+' div#edit_'+date+' button#accept').click(function(){
                                addComponentInstallationDate(wtg, component, $(this).siblings('input')[0].value, true,  $(this), false)
                            })
                            $('#repairs-components ul #'+component+' div#'+date+' i#remove').click(function(){
                                removeComponentInstallationDate(wtg, component, $(this).parents('div.date').attr('id'))
                            })
                        })
                        $('#repairs-components ul #'+component+' div#'+component).append('<p id=new>New:</p>')
                        $('#repairs-components ul #'+component+' div#'+component).append('<input id=addDate type=date>')
                        $('#repairs-components ul #'+component+' div#'+component).append('<button id=addDate_'+component+'>Add</button>')

                        $('#repairs-components ul #'+component+' #addDate_'+component).click(function(){
                            addComponentInstallationDate(wtg, component, $('#repairs-components ul #'+component+' input#addDate')[0].value, false, null, false)
                        })

                        $('#repairs-components ul #'+component+' p').first().click(function(){
                            $(this).toggleClass('fn-700')
                            $(this).next('div#'+component).toggle()
        /*                     $(this).nextAll('input').toggle()
                            $(this).nextAll('button').toggle() */
                        })
                    }
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

function addComponentInstallationDate(wtg, component, date, edit, e, confirm){
    var now = new Date();
    var then = new Date(date);
    var diffInYears = Math.round((now-then) / (1000*60*60*24))/365.25;

    if(diffInYears < 1 && !confirm){
        $('#repairs-components > #lessYearDateConfirmation').css('display', 'flex')
        $('#repairs-components ul, #repairs-components-close-btn').css('pointer-events', 'none');
        $('#repairs-components > #lessYearDateConfirmation #confirm').off()
        $('#repairs-components > #lessYearDateConfirmation #confirm').click(function(){
            $('#repairs-components > #lessYearDateConfirmation').hide()
            $('#repairs-components ul, #repairs-components-close-btn').css('pointer-events', 'auto');
            addComponentInstallationDate(wtg, component, date, edit, e, true)
        })
        
        $('#repairs-components > #lessYearDateConfirmation #cancel').click(function(){
            $('#repairs-components ul, #repairs-components-close-btn').css('pointer-events', 'auto');
            $('#repairs-components > #lessYearDateConfirmation').hide()
        })
        return;
    }

    if(edit){
        lastDate = e.parent('div').siblings('div.editing').children('span')[0].innerHTML
        e.parent('div').siblings('div.editing').children('span').text(date)
        e.parent('div').siblings('div.editing').attr("id", date)
        e.parent('div').attr("id", 'edit_'+date)
        e.parent('div').siblings('div.editing').toggle()
        e.parent('div').siblings('div.editing').toggleClass('editing')
        e.parent('div').toggle()
        removeComponentInstallationDate(wtg, component, lastDate)
    }

    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'addComponentInstallationDate', 'windFarm': WINDFARM.idPark, 'wtg': wtg.wtg_number, 'component': component, 'date': date},
        type: 'POST',
        dataType: 'json',
     
        success: function (json) {
            if(json){
                if(!edit){
                    $('<div class=date id='+date+'><span>'+date+'</span><div id="icons"><i id = "edit" class="fa-solid fa-pen-to-square"></i><i id="remove" class="fa-solid fa-trash"></i></div>').insertBefore('#repairs-components ul #'+component+' > div > p#new')
                    $('<div class=edit_date id=edit_'+date+' style=display:none><input type=date value='+date+'> <button id=accept>Accept</button></div>').insertBefore('#repairs-components ul #'+component+' > div > p#new')
    
                    $('#repairs-components ul #'+component+' div#'+date+' i#edit').click(function(){
                        $(this).parents('div.date').toggleClass('editing')
                        $(this).parents('div.date').toggle()
                        $(this).parents('div.date').next('.edit_date').css('display', 'block')
                    })
    
                    $('#repairs-components ul #'+component+' div#edit_'+date+' button#accept').click(function(){
                        addComponentInstallationDate(wtg, component, $(this).siblings('input')[0].value, true, $(this), false)
                    })

                    $('#repairs-components ul #'+component+' #'+date+' i#remove').click(function(){
                        removeComponentInstallationDate(wtg, component, $(this).parents('div.date').attr('id'))
                    })
                }
                $('#repairs-components ul #'+component+' input#addDate')[0].value = ""
            }
            else{
                alert('Invalid date')
            }
         },
     
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}


function removeComponentInstallationDate(wtg, component, date){
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'removeComponentInstallationDate', 'windFarm': WINDFARM.idPark, 'wtg': wtg.wtg_number, 'component': component, 'date': date},
        type: 'POST',
        dataType: 'json',
     
        success: function (json) {
            if(json.deleted){
                $('#repairs-components ul #'+component+' div#'+date).remove()
                $('#repairs-components ul #'+component+' div#edit_'+date).remove()
            }
            else{
                alert('Not deleted')
            }
         },
     
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

loadKPIs(null)
loadWindfarmAnalyticsMap()
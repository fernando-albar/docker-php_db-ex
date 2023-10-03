$('#wtg-nav li').off('click')
$('#periods').change(function(){
    KPI_RANGE = this.value
    loadKPIs()
});

$('.kpi-card').hover(function(){
    $(this).children('p').last().show()
    }, function () {
        $(this).children('p').last().hide()
});

$('#periods_power').change(function(){
    PERFORMANCE_KPI_RANGE = this.value
    $("#power-curve-graph").remove();
    $('#power-legend').remove()
    $('#power').append("<canvas id='power-curve-graph'></canvas>")
    $('#power-reset').hide()
    loadMachinePerformanceAnalytics(PERFORMANCE_KPI_RANGE, 0)
});

$('#periods_rotor').change(function(){
    PERFORMANCE_KPI_RANGE = this.value
    $("#rotor-speed-graph").remove();
    $('#rotor-legend').remove()
    $('#rotor').append("<canvas id='rotor-speed-graph'></canvas>")
    $('#rotor-reset').hide()
    loadMachinePerformanceAnalytics(PERFORMANCE_KPI_RANGE, 1)
});

$('#periods_extreme').change(function(){
    KPI_RANGE = this.value
/*     if(KPI_RANGE == 4){
        KPI_RANGE = 3
    } */
    loadMachineExtremeAnalytics(KPI_RANGE)
});

$('#wtg-nav #windfarm-back').click(function(){
    pageChange('windfarm')
});

$('#wtg-nav #overview').click(function(){
    if(CURRENTPAGE != 'wtg'){
        pageChange('wtg')
    }
});

$('#wtg-nav #fatigue').click(function(){
    if(CURRENTPAGE != 'wtgFatigue'){
        pageChange('wtgFatigue')
    }
});

$('#wtg-nav #extreme').click(function(){
    if(CURRENTPAGE != 'wtgExtreme'){
        pageChange('wtgExtreme')
    }
});

$('#wtg-nav #performance').click(function(){
    if(CURRENTPAGE != 'wtgPerformance'){
        pageChange('wtgPerformance')
    }
});

$('#wtg').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#wf').text(WINDFARM.name)

$('#wtg-nav #overview p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#wtg-nav #fatigue p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#wtg-nav #performance p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#wtg-nav #extreme p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)

$('#wf').click(function(){
    pageChange('windfarm')
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

function loadWtgInfo(){
    $("#turbine_model").text(TURBINEMODEL.split(' ')[0])
    $("#twr").text(MACHINE.twr)
    $("#startup").text(MACHINE.wtg_startup.split('-')[0])
}

function loadKPIs(){
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getKpis', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'range': KPI_RANGE },
        type: 'POST',
        dataType: 'json',
    
        success: function (json) {
            $("#power-kpis").text(parseFloat(json.capacity) + "MW")
            $("#availability-kpis").text((Math.round(json.availability * 100) / 100) + "%")
            $("#availability-ratio-kpis").text((Math.round((json.availability / 97) * 100)) + "%")
            $("#performance-kpis").text((Math.round(json.performance * 100) / 100) + "%")
            $("#production-kpis").text(((json.production * 100) / 100).toFixed(3) + "GWh")
            $("#extreme_1-kpis").text(json.extreme_1)
            $("#extreme_2-kpis").text(json.extreme_2)
            $("#extreme_3-kpis").text(json.extreme_3)
            $("#failures-kpis").text(json.failures)
            $("#opex-kpis").text((Math.round(json.opex)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "k€")
        },
    
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function loadMachineLifeAnalytics(range){
    $("#components-table tbody").empty()
/*     $("#components-table-mobile tbody").empty() */
    $("#life-components-table tbody").empty()
 /*    $("#life-components-table-mobile tbody").empty() */
    //Load life per component
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getFatigueComponents', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'idCell': MACHINE.idcell, 'turbineType': TURBINEMODEL, 'range': range},
        type: 'POST',
        dataType: 'json',
     
        success: function (json) {
            //Set info for the time to failure, fatigue and extreme resumes
            var rowF = ""
            var cont = false
            var bld_min = 41
            var twr_min = 41
            var lifeColor;
            var component_ttf = {}
            var bldNDTColor
            var bldPreventiveColor
            var bldTtfColor
            var twr_color = 'green'
            var bld_color = 'green'
            var designExpectancy;
            var designExpectancyBld = '';

            //Set each one of the components
            json.components.forEach(component => {
                designExpectancy = '';
                var ttdiff = (Date.now() - new Date(component[0].installdate.substring(3,5) + "/" + component[0].installdate.substring(0,2) + "/" + component[0].installdate.substring(6,10)).getTime()) / 31536000000
                if(ttdiff < 1){
                    designExpectancy = '<div id="expectancyInfo"></div>'
                    +'<img id="expectancyInfoHover" src="images/icons/infobox.svg" alt="" class="infobox">'
                    $('#lifespan-table > p').show()
                }
                var name = component[0].name
                if(name.startsWith("Section R")){
                    name = "Blade - " + name
                }
                if(name.startsWith("Section H")){
                    name = "Tower - " + name
                }
                if(component[0].component == 'bld_00'){
                    name = 'Blade - Composite Root'
                }
/*                  if(component[0].component == 'twr_01'){
                    name = 'Tower'
                } */
                 
                //Fill tables
                comp_failure = Math.trunc(Math.round((component[0].fatigue[0] - ttdiff) * 10) / 10)
                comp_preventive = Math.trunc(Math.round((component[0].fatigue[0] - ttdiff - component[0].fatigue[3]) * 10) / 10)
                comp_ndt = Math.trunc(Math.round((component[0].fatigue[0] - ttdiff - component[0].fatigue[3] - component[0].fatigue[4]) * 10) / 10)

                if(comp_failure < 0){
                comp_failure = '0'
                }
                if(comp_preventive < 0){
                comp_preventive = '0'
                }
                if(comp_ndt < 0){
                comp_ndt = '0'
                }

                lifeColor = 'green'
                if(component[0].fatigue[0] < 25){
                    lifeColor = 'orange'
                } 
                if(component[0].fatigue[0] < 20){
                    lifeColor = 'red'
                } 

                ndtColor = '#76CC69'
                if(comp_ndt < 6){
                    ndtColor = '#FF9330'
                } 
                if(comp_ndt < 3){
                    ndtColor = '#FF6A45'
                }

                preventiveColor = '#76CC69'
                if(comp_preventive < 6){
                    preventiveColor = '#FF9330'
                } 
                if(comp_preventive < 3){
                    preventiveColor = '#FF6A45'
                }

                ttfColor = '#76CC69'
                if(comp_failure < 6){
                    ttfColor = '#FF9330'
                } 
                if(comp_failure < 3){
                    ttfColor = '#FF6A45'
                }

                if(component[3]){
                    comp_ndt = 'Calculating'
                    comp_preventive = 'Calculating'
                    comp_failure = 'Calculating'
                    ndtColor = '#76CC69'
                    preventiveColor = '#76CC69'
                    ttfColor = '#76CC69'
                    lifeColor = 'green'
                    bld_min = 'Calculating'
                }

                if(component[0].component == 'gearbox'){
                    comp_ndt = '-'
                    comp_preventive = '-'
                    comp_failure = '-'
                    ndtColor = '#76CC69'
                    preventiveColor = '#76CC69'
                    ttfColor = '#76CC69'
                    lifeColor = 'green'
                }

                if(!component[0].component.startsWith('bld_')){
                    $("#components-table tbody").append("<tr id='" + component[0].component + "'><td>" + name + "</td><td class='manual-data' style='color:"+ndtColor+"'>" + comp_ndt + "</td><td class='manual-data' style='color:"+preventiveColor+"'>" + comp_preventive + "</td><td class='' style='color:"+ttfColor+"'>" + comp_failure + "</td><td><img src='images/icons/infobox.svg' alt='' class='infobox'></td></tr>")
                    component_ttf[component[0].component] = {'name': name, 'ndt': comp_ndt, 'preventive': comp_preventive, 'failure': comp_failure, 'colorNDT': ndtColor, 'colorPreventive': preventiveColor, 'colorTtf': ttfColor}
                }
                if(component[0].component.startsWith('bld_')){
                    if(component[0].fatigue[0] < bld_min){
                        bld_min = Math.trunc(component[0].fatigue[0])
                        failure_min = comp_failure
                        preventive_min = comp_preventive
                        ndt_min = comp_ndt
                        min_component = component[0]
/*                         min_component.name = "Blade" */
                        bldNDTColor = ndtColor
                        bldPreventiveColor = preventiveColor
                        bldTtfColor = ttfColor
                        bld_color = lifeColor
                    }
                }

                if(component[3]){
                    bld_min = 'Calculating'
                }
                if(component[0].component.startsWith('twr_') && component[0].component != 'twr_00'){
                    if(component[0].fatigue[0] < twr_min){
                        twr_min = Math.trunc(component[0].fatigue[0])
                        twr_color = lifeColor
                    }
                }


                if(!(component[0].component.startsWith('bld_') || component[0].component.startsWith('twr_')) || component[0].component == ('twr_00')){
                        if(component[0].component != 'gearbox'){
                            if(!component[3]){
                                if(component[0].fatigue[0] < 0){
                                    rowF = "<tr><td>" + component[0].name + "</td><td id="+component[0].component+" class="+lifeColor+">0</td></tr>"
                                }else{
                                    rowF = "<tr><td>" + component[0].name + "</td><td id="+component[0].component+" class="+lifeColor+">" + Math.trunc(component[0].fatigue[0]) + designExpectancy + "</td></tr>"
                                }
                            }
                            else{
                                rowF = "<tr><td>" + component[0].name + "</td><td id="+component[0].component+" class="+lifeColor+">Calculating</td></tr>"
                            }
                        }
                        else{
                            lifeColor = "green"
                            rowF = "<tr><td>" + component[0].name + "</td><td id="+component[0].component+" class="+lifeColor+">-" + designExpectancy + "</td></tr>"
                        }
                    
                    $("#life-components-table tbody").append(rowF)
                }

                if(component[0].component == 'bld_00'){
                    rowF = "<tr><td>Blade</td><td id=blade class="+lifeColor+">" + Math.trunc(component[0].fatigue[0]) + designExpectancy + "</td></tr>"
                    $("#life-components-table tbody").append(rowF)
                    designExpectancyBld = designExpectancy
                    if(designExpectancyBld != ''){
                        $("#life-components-table tbody tr td#blade").addClass('designExpectancy')
                    }
                }

                if(component[0].component == 'twr_01'){
                    rowF = "<tr><td>Tower</td><td id=tower class="+lifeColor+">" + Math.trunc(component[0].fatigue[0])  + designExpectancy +"</td></tr>"
                    $("#life-components-table tbody").append(rowF)
                }

                if(designExpectancy != ''){
                    $("#life-components-table tbody tr td#"+component[0].component+"").addClass('designExpectancy')
                }


                $('#expectancyInfo').text("This component has been replaced in a period of less than 1 year. Life expectancy calculation needs at least 1 year of data, therefore standard 20-years lifespan basis (OEM certification) will be applied for this component's life calculation until 1 year of data has been gathered.")
                $('#expectancyInfoHover').hover(
                    function() {
                      $('#expectancyInfo').show();
                    }, function() {
                        $('#expectancyInfo').hide();
                    }
                  );
































/*                 if(component[0].component.startsWith('twr_') && component[0].component != 'twr_00'){
                    if(component[0].fatigue[0] < twr_min){
                        twr_min = Math.trunc(component[0].fatigue[0])
                        twr_color = lifeColor
                    }
                }
     
                if(!(name.startsWith('Blade - S') || name.startsWith('Tower - S'))){
                    var id = ""
                    if(component[0].component == 'bld_00'){
                        id = ' id=\'bld_00_l\''
                        name = 'Blade'
                    }
                    if(component[0].component == 'twr_01'){
                        id = ' id=\'twr_01_l\''
                        name = 'Tower'
                    }
    
                    if(cont){
                        if(component[0].fatigue[0] < 0){
                            rowF += "<tr><td>" + name + "</td><td "+id+">0</td></tr>"
                        }else{
                            rowF += "<tr id="+component[0].component+"><td>" + name + "</td><td "+id+" class="+lifeColor+">" + Math.trunc(component[0].fatigue[0]) + "</td></tr>"
                        }
                        $("#life-components-table tbody").append(rowF)
                        rowF = ""
                        cont = false
                    }
                    else{
                        if(component[0].fatigue[0] < 0){
                            rowF = "<tr><td>" + name + "</td><td "+id+">0</td></tr>"
                        }
                        else{
                            rowF = "<tr><td>" + name + "</td><td "+id+" class="+lifeColor+">" + Math.trunc(component[0].fatigue[0]) + "</td></tr>"
                        }
                        cont = true
                    }
                } */
            })

            $("#blade").text(bld_min)
            $("#blade").append(designExpectancyBld)
            $('#life-components-table tbody tr td#blade #expectancyInfo').text("This component has been replaced in a period of less than 1 year. Life expectancy calculation needs at least 1 year of data, therefore standard 20-years lifespan basis (OEM certification) will be applied for this component's life calculation until 1 year of data has been gathered.")
  
            $('#life-components-table tbody tr td#blade #expectancyInfoHover').hover(
                function() {
                  $('#life-components-table tbody tr td#blade #expectancyInfo').show();
                }, function() {
                    $('#life-components-table tbody tr td#blade #expectancyInfo').hide();
                }
              );
            $("#tower").text(twr_min+designExpectancy)
/*             openComponent = [min_component.component, "Blade - " + min_component.name] */
            $("#components-table tbody").append("<tr id='bld_00' onclick='openComponentOpex([`" + min_component.component + "`,`Blade`])'><td> Blade </td><td class='manual-data' style='color:"+bldNDTColor+"'>" + ndt_min + "</td><td class='manual-data' style='color:"+bldPreventiveColor+"'>" + preventive_min + "</td><td class='' style='color:"+bldTtfColor+"'>" + failure_min + "</td><td><img src='images/icons/infobox.svg' alt='' class='infobox'></td></tr>")
            component_ttf['bld_00'] = {'name': 'Blade', 'ndt': ndt_min, 'preventive': preventive_min, 'failure': failure_min, 'colorNDT': bldNDTColor, 'colorPreventive': bldPreventiveColor, 'colorTtf': bldTtfColor}
            
/*             if(cont){
                rowF += "<td></td><td></td></tr>"
                $("#life-components-table tbody").append(rowF)
            }
     
            if(bld_min < 0){
            bld_min = '0'
            }
            $("#bld_00_l").text(bld_min)
            if(twr_min < 0){
                twr_min = '0'
            }
            $("#twr_01_l").text(twr_min) */

            $('#components-table tbody tr').hover(function (){

                if(this.id.includes('twr') && this.id != 'twr_00'){
                    $('#wtg-info img').attr("src", "images/components/tower_segment.png");
                }
                else{
                    $('#wtg-info img').attr("src", "images/components/" + this.id +".png");
                }
                
                var ndt = (component_ttf[this.id].ndt * 100) / 40 
                var preventive = (component_ttf[this.id].preventive * 100) / 40 
                var failure = (component_ttf[this.id].failure * 100) / 40 
                var colorNDT = component_ttf[this.id].colorNDT
                var colorPreventive = component_ttf[this.id].colorPreventive
                var colorFailure = component_ttf[this.id].colorTtf

                $('#wtg-info img').css("height", "25.65vh");
                $('#wtg-info #model-twr-cod').css('display', 'none')
                $('#wtg-info #ttf').empty()
                $('#wtg-info #ttf').css('display', 'block')
                $('#wtg-info #ttf').append('<div>'
                +'        <span class="fn-700 fh-30 fs-20">'+ component_ttf[this.id].name +'</span>'
                +'    </div>'
                +'    <span class="fn-400 fh-22 fs-15">NDT [years]</span>' 
                +'    <div class="bar-num">'
                +'        <div class="extreme-bar">'
                +'            <div class="progress-bar" style="width:' + ndt +'%; background-color:' + colorNDT + '">'
                +'            </div>' 
                +'        </div>'
                +'        <span class="fn-400 fh-22 fs-15">'+ component_ttf[this.id].ndt +'</span>'
                +'</div>'
                +'<div>'
                +'    </div>'
                +'    <span class="fn-400 fh-22 fs-15">Preventive [years]</span>' 
                +'    <div class="bar-num">'
                +'        <div class="extreme-bar">'
                +'            <div class="progress-bar" style="width:' + preventive +'%; background-color:' + colorPreventive + '">'
                +'            </div>' 
                +'        </div>'
                +'        <span class="fn-400 fh-22 fs-15">'+ component_ttf[this.id].preventive +'</span>'
                +'</div>'
                +'<div>'
                +'    </div>'
                +'    <span class="fn-400 fh-22 fs-15">Failure [years]</span>' 
                +'    <div class="bar-num">'
                +'        <div class="extreme-bar">'
                +'            <div class="progress-bar" style="width:' + failure +'%; background-color:' + colorFailure + '">'
                +'            </div>' 
                +'        </div>'
                +'        <span class="fn-400 fh-22 fs-15">'+ component_ttf[this.id].failure +'</span>'
                +'</div>'
                )
            }, function () {
                $('#wtg-info #ttf').css('display', 'none')
                $('#wtg-info #model-twr-cod').css('display', 'block')
                $('#wtg-info img').attr("src", "images/aero2.png");
                $('#wtg-info img').css("height", "40vh");
            }
            );

            /* document.getElementById.addEventListener("mouseout", myScript); */


            json.components.forEach(component => {
                var name = component[0].name
                if(name.startsWith("Section R")){
                    name = "Blade - " + name
                }
                if(name.startsWith("Section H")){
                    name = "Tower - " + name
                }
                if(component[0].component == 'bld_00'){
                    name = 'Blade - Composite Root'
                }
                $('#components-table #'+component[0].component+' .infobox').click(function(){
                    openComponentOpex([component[0].component, name])
                });
            })
         },
     
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

function loadMachineExtremeAnalytics(range){
    $("#extreme-components-table tbody").empty()
 /*    $("#extreme-components-table-mobile tbody").empty() */
    //Load extreme per component
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getExtremeComponents', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'idCell': MACHINE.idcell, 'turbineType': TURBINEMODEL },
        type: 'POST',
        dataType: 'json',
    
        success: function (json) {
            //Set info for the time to failure, fatigue and extreme resumes
            var rowE = ""
            var cont = false
            var bld_max = [0,'-']
            var twr_max = [0,'-']
            bld_colorp = 'c-green'
            bld_colorn = 'c-green'
    
            //Set each one of the components
            Object.values(json.data.data).forEach(component => {
                var name = component.name
                if(name.startsWith("Section R")){
                    name = "Blade - " + name
                }
                if(name.startsWith("Section H")){
                    name = "Tower - " + name
                }
                if(component.component == 'bld_00'){
                    name = 'Blade'
                }
                if(component.component == 'twr_01'){
                    name = 'Tower'
                }
                var colorp = "c-green"
                var colorn = "c-green"

                valuep = null
                valuen = null
                switch(range+''){
                    case '0':
                        valuep = component.extreme.dpv
                        valuen = component.extreme.dnv
                        break;
                    case '1':
                        valuep = component.extreme.mpv
                        valuen = component.extreme.mnv
                        break;
                    case '2':
                        valuep = component.extreme.tpv
                        valuen = component.extreme.tnv
                        break;
                    case '3':
                        valuep = component.extreme.spv
                        valuen = component.extreme.snv
                        break;
                    case '4':
                        valuep = component.extreme.ypv
                        valuen = component.extreme.ynv
                        break;
                }

                if(valuep >= 70){
                    colorp = "c-yellow"
                }
                if(valuep >= 85){
                    colorp = "c-orange"
                }
                if(valuep >= 100){
                    colorp = "c-red"
                }

                if(valuen >= 70){
                    colorn = "c-yellow"
                }
                if(valuen >= 85){
                    colorn = "c-orange"
                }
                if(valuen >= 100){
                    colorn = "c-red"
                }
    
                //Fill tables
                //$("#extreme-components-table-mobile tbody").append("<tr><td>" + name + "</td><td class='manual-data'>0</td><td class='manual-data'>0</td></tr>")
                if(component.component.startsWith('bld_')){
                    if(valuep > bld_max[0]){
                        bld_max[0] = valuep
                        bld_colorp = colorp 
                    }
                    if(valuen != null && (bld_max[1] == '-' || valuen > bld_max[1])){
                        bld_max[1] = valuen
                        bld_colorn = colorn
                    }
                }
                if(component.component.startsWith('twr_') && component.component != 'twr_00'){
                    if(valuep > twr_max[0]){
                        twr_max[0] = valuep
                    }
                    if(valuen != null && (twr_max[1] == '-' || valuen > twr_max[1])){
                        twr_max[1] = valuen
                    }
                }
    
                if(!(name.startsWith('Blade -') || name.startsWith('Tower -'))){
                    var idp = ""
                    var idn = ""
                    var idp_m = ""
                    var idn_m = ""
                    if(component.component == 'bld_00'){
                        idp = ' id=\'bld_00_ep\''
                        idn = ' id=\'bld_00_en\''
                        idp_m = ' id=\'bld_00_ep_m\''
                        idn_m = ' id=\'bld_00_en_m\''
                    }
                    if(component.component == 'twr_01'){
                        idp = ' id=\'twr_01_ep\''
                        idn = ' id=\'twr_01_en\''
                        idp_m = ' id=\'twr_01_ep_m\''
                        idn_m = ' id=\'twr_01_en_m\''
                    }
    
                    var ndata = '-'
                    if(valuen != null){
                        ndata = valuen
                    }
                    if(cont){
                        rowE += "<td>" + name + "</td><td " + idp + " class='" + colorp + "'>"+ valuep +"</td><td " + idn + " class='" + colorn + "'>" + ndata +"</td></tr>"
                        $("#extreme-components-table tbody").append(rowE)
                        rowE = ""
                        cont = false
                    }else{
                        rowE = "<tr><td>" + name + "</td><td " + idp + " class='" + colorp + "'>"+ valuep +"</td><td " + idn + " class='table-divider " + colorn + "'>" + ndata +"</td>"
                        cont = true
                    }
    
                    /* $("#extreme-components-table-mobile tbody").append("<tr><td>" + name + "</td><td " + idp_m + " class='" + colorp + "'>"+ valuep +"</td><td " + idn_m + " class='" + colorn + "'>" + ndata +"</td></tr>")
 */                }
            })
    
            if(cont){
                rowE += "<td></td><td></td><td></td></tr>"
                $("#extreme-components-table tbody").append(rowE)
            }
    
            $("#bld_00_ep").text(bld_max[0])
            $("#bld_00_en").text(bld_max[1])
            $("#twr_01_ep").text(twr_max[0])
            $("#twr_01_en").text(twr_max[1])
            $("#bld_00_ep_m").text(bld_max[0])
            $("#bld_00_en_m").text(bld_max[1])
            $("#twr_01_ep_m").text(twr_max[0])
            $("#twr_01_en_m").text(twr_max[1])

            $("#bld_00_ep").addClass(bld_colorp)
            $("#bld_00_en").addClass(bld_colorn)

/*             if(bld_max[0] >= 70){
                colorp = "c-yellow"
                $("#bld_00_ep_m").addClass(bld_colorp)
                $("#bld_00_ep").addClass(colorp)
            }
            if(valuep >= 85){
                colorp = "c-orange"
            }
            if(valuep >= 100){
                colorp = "c-red"
            }

            if(valuen >= 70){
                colorn = "c-yellow"
            }
            if(valuen >= 85){
                colorn = "c-orange"
            }
            if(valuen >= 100){
                colorn = "c-red"
            } */

        },
    
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

/* function loadMachinePerformanceAnalytics(range, graph){
    var startdate = null
    var finaldate = null
    var months = 0
    switch(range+''){
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

    var data
    var data2
    if(graph == 0 || graph == 2){
        //Clear and show performance graphs
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
                }
            }
        });


        data = [
            {
                type: 'line',
                label: 'OEM',
                data: [],
                pointRadius: 0,
                borderColor: '#bcbcbc',
                backgroundColor: '#bcbcbc',
                fill: false
            },
            {
                type: 'line',
                label: 'i-Spin AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#ff8000',
                backgroundColor: '#ff8000',
                fill: false
            },
            {
                type: 'line',
                label: 'Scada AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#ffb061',
                backgroundColor: '#ffb061',
                fill: false
            },
            {
                type: 'scatter',
                label: 'i-Spin',
                data: "",
                backgroundColor: 'rgb(44, 44, 44)'
            },
            {
                type: 'scatter',
                label: 'Scada',
                data: "",
                backgroundColor: 'rgb(114, 114, 114)'
            }
        ]
    }
    if(graph == 1 || graph == 2){
        //Clear and show performance graphs
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
                }
            }
        });

        data2 = [
            {
                type: 'line',
                label: 'i-Spin AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#ff8000',
                backgroundColor: '#ff8000',
                fill: false
            },
            {
                type: 'line',
                label: 'Scada AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#ffb061',
                backgroundColor: '#ffb061',
                fill: false
            },
            {
                type: 'scatter',
                label: 'i-Spin',
                data: "",
                backgroundColor: 'rgb(44, 44, 44)'
            },
            {
                type: 'scatter',
                label: 'Scada',
                data: "",
                backgroundColor: 'rgb(114, 114, 114)'
            }
        ]
    }
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getPowerCurveModels', 'model': 'V9020'},
        type: 'POST',
        dataType: 'json',
        async: true,

        success: function (json) {
            array_power_curve = []
            json.forEach(result => {
                array_power_curve.push({x: result['wind_speed'], y: result['power']})
            });
            if(graph!=1){
                data[0].data = array_power_curve
            }
            $.ajax({
                url: 'php/getDashboardData.php',
                data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': 'RM', 'machine': MACHINE, 'startdate': startdate, 'finaldate': finaldate },
                type: 'POST',
                dataType: 'json',
        
                success: function (json) {
                    //Creates a graph for each type
                    if(graph == 0 || graph == 2 && json[0].comp == 'original_power'){
                        values = $.parseJSON("[" + json[0].values[1] + "]");
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
                        data[1].data = avg;
        
                        values = $.parseJSON("[" + json[0].values[0] + "]");
                        values.sort(function (a, b) {
                            return parseFloat(a.x) - parseFloat(b.x);
                        });
                        last = null;
                        ad = [];
                        avg = [];
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
                        data[2].data = avg;
        
                        data[3].data = $.parseJSON("[" + json[0].values[1] + "]");
                        data[4].data = $.parseJSON("[" + json[0].values[0] + "]");
                    }
                    if(graph == 1 || graph == 2 && json[1].comp == 'original_rotorSpeed'){
                        values = $.parseJSON("[" + json[1].values[1] + "]");
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
                        data2[0].data = avg;
        
                        values = $.parseJSON("[" + json[1].values[0] + "]");
                        values.sort(function (a, b) {
                            return parseFloat(a.x) - parseFloat(b.x);
                        });
                        last = null;
                        ad = [];
                        avg = [];
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
                        data2[1].data = avg;
        
                        data2[2].data = $.parseJSON("[" + json[1].values[1] + "]");
                        data2[3].data = $.parseJSON("[" + json[1].values[0] + "]");
                    }
        
                    if((graph == 0 || graph == 2) && json[0].values[1].length == 0){
                        data.splice(3, 1)
                        data.splice(1, 1)
                    }
                    if((graph == 1 || graph == 2) && json[0].values[1].length == 0){
                        data2.splice(2, 1)
                        data2.splice(0, 1)
                    }
        
                    if(graph == 0 || graph == 2){
                        myChart.data.datasets = data
                        myChart.update();
                    }
                    if(graph == 1 || graph == 2){
                        myChart2.data.datasets = data2
                        myChart2.update();
                    }
                },
        
                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText);
                    //window.location.href = "Error";
                }
            });
        },
        error: function (xhr) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
} */



function openComponentOpex(component){
    $('html, body').animate({   
        scrollTop: $(".component-opex-container").offset().top
    });
    $('body').css('overflow', 'hidden')
    $(".component-opex-container h6").text(component[1])
    if(component[0].startsWith('bld_0')){
        component[0] = 'bld_00'
    }
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getComponentPreventive', 'component': component[0]},
        type: 'POST',
        dataType: 'json',
    
        success: function (json) {
            $(".component-opex-container .card-body .preventives").empty()
            $(".component-opex-container .card-body .costs").empty()

            if(component[0].startsWith('twr') && component[0] != 'twr_00'){
                $(".component-opex-container .card-body > .preventives").append('<div id="img"><img src="images/components/tower_segment.png" class="component_img"></div>')
            }else if(component[0].startsWith('bld') && component[0] != 'bld_00'){
                $(".component-opex-container .card-body > .preventives").append('<div id="img"><img src="images/components/blade_segment.png" class="component_img"></div>')
            }else{
                $(".component-opex-container .card-body > .preventives").append('<div id="img"><img src="images/components/' + component[0] + '.png" class="component_img"></div>')
            }
            num_total = 0
            num_total2 = 0
            total = false
            json.forEach(preventive => {

                if(preventive.type == '0'){
                    $(".component-opex-container .card-body > .preventives").append(''
                    + '<div>'
                    + '   <h3 class="modal_title">' + preventive.name + '</h3>'
                    + '   <p class="modal_body">' + preventive.description + '</p>'
                    + '   <div id=' + preventive.name.replace(/\s+/g, '') + ' class="costs price_box"></div>'
                    + '   <div class="separator"></div>'
                    + '</div>')
                    if(preventive.orden > 1 && preventive.orden < 5){
                        $("#" + preventive.name.replace(/\s+/g, '') + "").addClass('costs')
                    }
                }

                else if(preventive.type == '2'){
                    $("#Recommendedpreventiveaction").addClass('costs').append('<div class="d-flex space-between align-center modal_box_text"><span>' + preventive.name + '</span><span>' + preventive.description + '</span></div>')
                    if((preventive.name == 'AMP(OPEX)' || preventive.name == 'Focus Inspection (OPEX)') && !component[1].startsWith('Tower - S')){
                        $("#Recommendedpreventiveaction").addClass('costs').append('<div class="d-flex space-between align-center font-weight-bold total modal_box_total"><span>Total:</span><span>' + preventive.description + '</span></div>')
                        total = true
                    }
                    if(preventive.name == 'AMP Bolts (OPEX)' && component[1].startsWith('Tower - S')){
                        $("#Recommendedpreventiveaction").addClass('costs').append('<div class="d-flex space-between align-center font-weight-bold total modal_box_total"><span>Total:</span><span>50k€/component [ROM]</span></div>')
                        total = true
                    }
                    if(total){
                        if(component[0] == 'yaw_b' || component[0] == 'yaw_b_supports' || component[0] == 'main_b_supports' || component[0] == 'main_f' || component[0] == 'mounting' || component[0] == 'pitch_act' || component[0] == 'hub' && num_total == 0){
/*                             $("#Recommendedpreventiveaction").append('<br>') */
                            total = false
                        }
                    }
                    if(preventive.name == 'Total:'){
                        $("#Recommendedpreventiveaction div:last-child").addClass('font-weight-bold total modal_box_text')
                    }
                }
                else if(preventive.type == '3'){
                    $("#Recommendedcorrectiveaction").addClass('costs').append('<div class="d-flex space-between align-center"><span>' + preventive.name + '</span><span>' + preventive.description + '</span></div>')
                    if(preventive.name == 'Total:'){
                        $("#Recommendedcorrectiveaction div:last-child").addClass('font-weight-bold total')
                        if(component[1].startsWith('Tower - S') && num_total2 == 0){
                            $("#Recommendedcorrectiveaction").append('<br>')
                            num_total2 = 1
                        }
                    }
                }
                
                /* else if(preventive.type == '3'){
                    $(".component-opex-container .card-body .preventives > div> .costs").append('<div class="d-flex space-between align-center "><span>' + preventive.name + '</span><span>' + preventive.description + '</span></div>')
                }else if(preventive.type == '4'){
                    $(".component-opex-container .card-body > .costs").append('<div class="d-flex space-between align-center font-weight-bold"><span>' + preventive.name + '</span><span>' + preventive.description + '</span></div>')
                } */
            })


            switch (component[0]){
                case 'yaw_b':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Ultrasonic testing</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Grease sampling testing</span><span>1k€/turbine [ROM]</span></div>')        
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>2k€/turbine [ROM]</span></div>')
                    break
                case 'yaw_b_supports':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>1k€/turbine [ROM]</span></div>')
                    break
                case 'main_b':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Ultrasonic testing</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Videoscope</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Grease sampling testing</span><span>1k€/turbine [ROM]</span></div>')        
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>3k€/turbine [ROM]</span></div>')
                    break
                case 'main_b_supports':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>1k€/turbine [ROM]</span></div>')
                    break
                case 'main_f':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>2k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>2k€/turbine [ROM]</span></div>')
                    break
                case 'main_s':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>1k€/turbine [ROM]</span></div>')
                    break
                case 'mounting':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>2k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>2k€/turbine [ROM]</span></div>')
                    break
                case 'pitch_act':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>1k€/turbine [ROM]</span></div>')
                    break
                case 'pitch_b':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Ultrasonic testing</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Videoscope</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Grease sampling testing</span><span>1k€/turbine [ROM]</span></div>')        
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>3k€/turbine [ROM]</span></div>')
                    break
                case 'hub':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>1k€/turbine [ROM]</span></div>')
                case 'gearbox':
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Oil sampling</span><span>1k€/turbine [ROM]</span></div>')
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Videoscope</span><span>1k€/turbine [ROM]</span></div>')  
                    $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>2k€/turbine [ROM]</span></div>')
                    break
                }

            if(component[0].startsWith('bld')){
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Thermographic test</span><span>1k€/turbine [ROM]</span></div>')
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Anti-Lightning System test</span><span>1k€/turbine [ROM]</span></div>')
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Drone Based inspection</span><span>1k€/turbine [ROM]</span></div>')        
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>3k€/turbine [ROM]</span></div>')

            }

            if(component[0].startsWith('twr')){
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Ultrasonic testing</span><span>1k€/turbine [ROM]</span></div>')
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Drone Based inspection</span><span>1k€/turbine [ROM]</span></div>')
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center"><span>Penetrant liquids</span><span>1k€/turbine [ROM]</span></div>')        
                $("#NonDestructiveTestandInspections").append('<div class="d-flex space-between align-center font-weight-bold total"><span>Total:</span><span>3k€/turbine [ROM]</span></div>')

            }
            $('#component-close-btn').click(function(){
                $(".component-opex-container").css({'display': 'none'})
                $('body').css('overflow', 'initial')
            })

            $('div.preventives.w-100.text-center > div > p').addClass('modal_body')
            if(!(component[0].startsWith('gearbox') || component[0].startsWith('hub') || component[0].startsWith('pitch_act')))
            $('.component-opex-container .preventives').append('<div class="pt-1">'
            + '<button>Activate ageing management plan</button>'
            + '</div>')
        },
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
    $(".component-opex-container").css({'display': 'flex'})
}

function loadMachinePerformanceAnalytics(range, graph){
    //Set range dates
    var startdate = null
    var finaldate = null
    var months = 0

    switch(range+''){
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

    var data
    var data2
    if(graph == 0 || graph == 2){
        //Clear and show performance graphs
        $("#power-curve-container .card-body").empty();

        //Generate canvas
        $("#power-curve-container .card-body").append('<img id="load-power-circle" src="images/loadCircle.gif" class="loadGif"><canvas id="power-curve-graph" class="mh-400" width="400" height="400"></canvas>');
        $('#power').append('<div class="graph-legend" id="power-legend">'
        +'<div id="legend-oem">'
        +'    <img src="images/icons/check_box.svg" alt="" value=0>'
        +'    <span>OEM</span>'
        +'</div>'
        +'<div id="legend-scada-avg">'
        +'    <img src="images/icons/check_box.svg" alt="" value=1>'
        +'    <span>Scada AVG</span>'
        +'</div>'
        +'<div id="legend-scada">'
        +'    <img src="images/icons/check_box.svg" alt="" value=2>'
        +'    <span>Scada</span>'
        +'</div>'
        +'</div>'

        )

        Chart.defaults.font.size = 12;
        Chart.defaults.font.family = 'Poppins';
        Chart.defaults.font.weight = 500;
        Chart.defaults.font.height = 18;
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
                        display: false,
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
                                $('#power-reset').show()
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
                            text: 'Wind speed [m/s]',
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Power [kW]',
                        }
                    }
                }
            }
        });

        document.getElementById("power-reset").addEventListener("click", () => {
            myChart.resetZoom();
            $('#power-reset').hide()
        })

        data = [
            {
                type: 'line',
                label: 'OEM',
                data: [],
                pointRadius: 0,
                borderColor: '#262840',
                backgroundColor: '#262840',
                fill: false
            },
            {
                type: 'line',
                label: 'i-Spin AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#ff8000',
                backgroundColor: '#ff8000',
                fill: false
            },
            {
                type: 'line',
                label: 'Scada AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#888AA6',
                backgroundColor: '#888AA6',
                fill: false
            },
            {
                type: 'scatter',
                label: 'i-Spin',
                data: "",
                backgroundColor: 'rgb(44, 44, 44)'
            },
            {
                type: 'scatter',
                label: 'Scada',
                data: "",
                backgroundColor: '#FDA872'
            }
        ]
    }
    if(graph == 1 || graph == 2){
        //Clear and show performance graphs
        $("#rotor-speed-container .card-body").empty();

        //Generate canvas
        $("#rotor-speed-container .card-body").append('<img id="load-angular-circle" src="images/loadCircle.gif" class="loadGif"><canvas id="rotor-speed-graph" class="mh-400" width="400" height="400"></canvas>');
        $('#rotor').append('<div class="graph-legend" id="rotor-legend">'
        +'<div id="legend-scada-avg">'
        +'<img src="images/icons/check_box.svg" alt="" value=0>'
        +'<span>Scada AVG</span>'
        +'</div>'
        +'<div id="legend-scada">'
        +'<img src="images/icons/check_box.svg" alt="" value=1>'
        +'<span>Scada</span>'
        +'</div>'
        +'</div>'
        )
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
                        display: false,
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
                                $('#rotor-reset').show()
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

        document.getElementById("rotor-reset").addEventListener("click", () => {
            myChart2.resetZoom();
            $('#rotor-reset').hide()
        })

        data2 = [
            {
                type: 'line',
                label: 'i-Spin AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#ff8000',
                backgroundColor: '#ff8000',
                fill: false
            },
            {
                type: 'line',
                label: 'Scada AVG',
                data: [],
                pointRadius: 0,
                borderColor: '#888AA6',
                backgroundColor: '#888AA6',
                fill: false
            },
            {
                type: 'scatter',
                label: 'i-Spin',
                data: "",
                backgroundColor: 'rgb(44, 44, 44)'
            },
            {
                type: 'scatter',
                label: 'Scada',
                data: "",
                backgroundColor: '#FDA872'
            }
        ]
    }
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
            if(graph!=1){
                data[0].data = array_power_curve
            }
            $.ajax({
                url: 'php/getDashboardData.php',
                data: { 'callFunc': 'getPerformanceCalcsByDate', 'windFarm': WINDFARM.idPark, 'machine': MACHINE, 'startdate': startdate, 'finaldate': finaldate },
                type: 'POST',
                dataType: 'json',
        
                success: function (json) {
                    //Creates a graph for each type
                    if(graph == 0 || graph == 2 && json[0].comp == 'original_power'){
                        values = $.parseJSON("[" + json[0].values[1] + "]");
                        values.sort(function (a, b) {
                            return parseFloat(a.x) - parseFloat(b.x);
                        });
                        var last = null;
                        var ad = [];
                        var avg = [];
                        values.forEach(s => {
                            var x = Math.round(s.x)
                            if (last != null && x != last) {
                                avg.push({ x: x - 1, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                                ad = [];
                                ad.push(s.y);
                            }
                            ad.push(s.y);
                            last = x;
                        });
                        data[1].data = avg;
        
                        values = $.parseJSON("[" + json[0].values[0] + "]");
                        values.sort(function (a, b) {
                            return parseFloat(a.x) - parseFloat(b.x);
                        });
                        last = null;
                        ad = [];
                        avg = [];
                        values.forEach(s => {
                            var x = s.x
                            if (last != null && x != last) {
                                avg.push({ x: x, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                                ad.push(s.y);
                            }
                            last = x;
                        });
                        data[2].data = avg;
        
                        data[3].data = $.parseJSON("[" + json[0].values[1] + "]");
                        data[4].data = $.parseJSON("[" + json[0].values[0] + "]");
                    }
                    if(graph == 1 || graph == 2 && json[1].comp == 'original_rotorSpeed'){
                        values = $.parseJSON("[" + json[1].values[1] + "]");
                        values.sort(function (a, b) {
                            return parseFloat(a.x) - parseFloat(b.x);
                        });
                        var last = null;
                        var ad = [];
                        var avg = [];
                        values.forEach(s => {
                            console.log('Tres')
                            var x = Math.round(s.x)
                            if (last != null && x != last) {
                                avg.push({ x: x - 1, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                                ad = [];
                                ad.push(s.y);
                            }
                            ad.push(s.y);
                            last = x;
                        });
                        data2[0].data = avg;
        
                        values = $.parseJSON("[" + json[1].values[0] + "]");
                        values.sort(function (a, b) {
                            return parseFloat(a.x) - parseFloat(b.x);
                        });
                        last = null;
                        ad = [];
                        avg = [];
                        values.forEach(s => {
                            var x = Math.round(s.x)
                            if (last != null && x != last) {
                                avg.push({ x: x - 1, y: (ad.reduce((a, b) => a + b, 0) / ad.length) || 0 });
                                ad = [];
                                ad.push(s.y);
                            }
                            ad.push(s.y);
                            last = x;
                        });
                        data2[1].data = avg;
        
                        data2[2].data = $.parseJSON("[" + json[1].values[1] + "]");
                        data2[3].data = $.parseJSON("[" + json[1].values[0] + "]");
                    }
        
                    if((graph == 0 || graph == 2) && json[0].values[1].length == 0){
                        data.splice(3, 1)
                        data.splice(1, 1)
                    }
                    if((graph == 1 || graph == 2) && json[0].values[1].length == 0){
                        data2.splice(2, 1)
                        data2.splice(0, 1)
                    }
        
                    if(graph == 0 || graph == 2){
                        myChart.data.datasets = data
                        myChart.update();
                    }
                    if(graph == 1 || graph == 2){
                        myChart2.data.datasets = data2
                        myChart2.update();
                    }
                    
                    if(graph == 0 || graph == 2){

                        if(myChart.data.datasets[1].type == 'scatter'){
                            $('#power-legend> #legend-scada-avg > span').css('border-bottom', 'dotted');
                        }
                        if(myChart.data.datasets[2].type == 'scatter'){
                            $('#power-legend> #legend-scada > span').css('border-bottom', 'dotted');
                        }

                        $('#power-legend> #legend-oem > span').css('border-color', myChart.data.datasets[0].borderColor);
                        $('#power-legend> #legend-scada-avg > span').css('border-color', myChart.data.datasets[1].borderColor);
                        $('#power-legend> #legend-scada > span').css('border-color', myChart.data.datasets[2].backgroundColor);

                        $('#power-legend > div > img').click(function(){
                            var src = ($(this).attr("src") === "images/icons/check_box.svg")
                            ? "images/icons/empty_box.svg" 
                            : "images/icons/check_box.svg";
                            $(this).attr("src", src);
                            toggleData($(this).attr('value'), myChart)
                        })
                    }

                    if(graph == 1 || graph == 2){

                        if(myChart2.data.datasets[0].type == 'scatter'){
                            $('#rotor-legend> #legend-scada-avg > span').css('border-bottom', 'dotted');
                        }
                        if(myChart2.data.datasets[1].type == 'scatter'){
                            $('#rotor-legend> #legend-scada > span').css('border-bottom', 'dotted');
                        }

                        $('#rotor-legend> #legend-scada-avg > span').css('border-color', myChart2.data.datasets[0].borderColor);
                        $('#rotor-legend> #legend-scada > span').css('border-color', myChart2.data.datasets[1].backgroundColor);

                        $('#rotor-legend > div > img').click(function(){
                            var src = ($(this).attr("src") === "images/icons/check_box.svg")
                            ? "images/icons/empty_box.svg" 
                            : "images/icons/check_box.svg";
                            $(this).attr("src", src);
                            toggleData($(this).attr('value'), myChart2)
                        })
                    }



                    $(".content-header").removeClass('invisible')
                    $(".content-body").removeClass('invisible')
                    $(".loading-container").addClass('d-none')
                    $(".loadGif").addClass('d-none')

                    function toggleData(value, chart){
                        const visibilityData = chart.isDatasetVisible(value);
                        if(visibilityData == true){
                            chart.hide(value);
                        }
                        else{
                            chart.show(value)
                        }
                    }
                },
        
                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText);
                    //window.location.href = "Error";
                }
            });
        },
        error: function (xhr) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

loadWtgInfo()
loadKPIs()
loadMachineLifeAnalytics(0)
loadMachineExtremeAnalytics(0)


if(WINDFARM.idPark == 'CCROES' || WINDFARM.idPark == 'OUROL'){
    $('#power').hide()
    $('#rotor').hide()
}
else{
    loadMachinePerformanceAnalytics(0,2)
}

$('.reload-graph').hide()
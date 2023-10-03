
/* document.getElementsByClassName("infobox").addEventListener("click", function() {
  document.getElementsByClassName("infobox") = "img/icons/infofocus.svg"
}); */

/* var q = document.getElementById('q').src = "img/icons/infofocus.svg" */
/* $( "#q" ).click(function() {
  $(this).src = "img/icons/infofocus.svg";
  console.log($(this['src']))
  }); */

/* 
document.querySelectorAll('.infobox').forEach(element => {
  element.addEventListener('click', changeInfoBox());
})

function changeInfoBox(){
  this.classList.toggle("infobox-focus")
}; */

/* var td = document.getElementsByClassName("value")
for (var i = 0; i < td.length; i++) {
  if(parseInt(td[i].innerText) || td[i].innerText == '0'){
    if(td[i].innerText >= 70){
      td[i].style.color = "#FFD600";  

      if(td[i].innerText >= 85){
        td[i].style.color = "#FF9330";  
      }
      if(td[i].innerText >= 100){
        td[i].style.color = "#FF3300";  
      }
    }
    else{
      td[i].style.color = "#76CC69";  
    }
  }
} */

$('#wf').text(WINDFARM.name)

$('#periods').change(function(){
    $("#wtgs-list").empty()
    KPI_RANGE = this.value
/*     if(KPI_RANGE == 4){
        KPI_RANGE = 3
    } */
    loadExtremeAnalytics(KPI_RANGE)
});

function loadExtremeAnalytics(range){
  //Clear table
  $("#extreme-table thead").empty()
  $("#extreme-table tbody").empty()
  
  //Get table data
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWT', 'windFarm': WINDFARM.idPark, 'wtg': null, 'range': range },
        type: 'POST',
        dataType: 'json',
        async: false,
  
        success: function (machine) {
            var table_head = "<tr class='head'><th></th>"
            var hide = "<tr id='first-row'><td></td>"
            var posneg = "<tr id='second-row'><td></td>"
            var cont = 1
            //Generate headers
            machine.data.forEach(wtg => {
                table_head += "<th><div>" + WINDFARM.wtg_code + "" + wtg.wtg_number + " <span>[%]<span></div></th>"
                hide += "<td><img src='images/icons/ocultar.svg' alt=''></td>"
                posneg += "<td><div><div>+</div><div>-</div></div></td>"
                cont++
            });
            table_head += "</tr>"
            hide += "</tr>"
            posneg += "</tr>"
            $("#extreme-table thead").append(table_head)
    /*           $("#extreme-table tbody").append(hide) */
            $("#extreme-table tbody").append(posneg)

            //Generate body for each machine and component
            $.ajax({
                url: 'php/getData.php',
                data: { 'callFunc': 'getModelComponents', 'windFarm': WINDFARM.idPark, 'model': machine.data[0].idcell, 'isCell': 'true' },
                type: 'POST',
                dataType: 'json',
                async: false,
            
                success: function (json) {
                    //Set info for the extremes
                    var components_rows = []
                    machine.data.forEach(wtg => {
                        $.ajax({
                            url: 'php/getDashboardData.php',
                            data: { 'callFunc': 'getExtremeComponents', 'windFarm': WINDFARM.idPark, 'machine': wtg.number, 'idCell': wtg.idcell, 'turbineType': wtg.turbine_model},
                            type: 'POST',
                            dataType: 'json',
                            async: false,
                        
                            success: function (json) {            
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
                                    name = 'Blade - Composite Root'
                                }
/*                                 if(component.component == 'twr_00'){
                                    name = 'Tower'
                                } */
                    
                                //Fill table
                                if (!(component.component in components_rows)){
                                    components_rows[component.component] = [name, parseInt(component.order), ""]
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

                                    if(valuen != null){
                                        components_rows[component.component][2] += "<td><div onclick='toComponentExtreme(" + wtg.wtg_number + ", \"" + component.component + "\", \"" + component.name + "\")'><div class='" + colorp + "'>" + valuep + "%</div><div class='" + colorn + "'>" + valuen + "%</div></div></td>"
                                    }else{
                                        components_rows[component.component][2] += "<td><div onclick='toComponentExtreme(" + wtg.wtg_number + ", \"" + component.component + "\", \"" + component.name + "\")'><div class='" + colorp + "'>" + valuep + "%</div><div class='" + colorn + "'>-</div></div></td>"
                                    }

                                    if(wtg == machine.data[machine.data.length - 1] && component == Object.values(json.data.data)[Object.values(json.data.data).length - 1]){
                                        Object.values(components_rows).forEach(comp => {
                                            $("#extreme-table tbody").append("<tr><td>" + comp[0] + "</td>" + comp[2] + "</tr>")
                                        })

                                        $(".content-header").removeClass('invisible')
                                        $(".content-body").removeClass('invisible')
                                        $(".loading-container").addClass('d-none')
                                    }
                                })
                            },
                        
                            error: function (xhr, status) {
                                console.log('There is an error -> ' + xhr.responseText);
                                //window.location.href = "Error";
                            }
                        });
                    })
                },
            
                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText)
                    //window.location.href = "Error"
                }
            })
        },
  
      error: function (xhr, status) {
          console.log('There is an error -> ' + xhr.responseText)
          //window.location.href = "Error"
      }
  })
}


function toComponentExtreme(wtg_number, component, name){
    COMPONENT = [component, name, null]
    THRESHOLD = null


    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWT', 'windFarm': WINDFARM.idPark, 'wtg': wtg_number, 'range': KPI_RANGE },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            MACHINE = json.data[0]
            TURBINEMODEL = MACHINE.turbine_model
            pageChange("componentExtreme")
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}


loadExtremeAnalytics(0)
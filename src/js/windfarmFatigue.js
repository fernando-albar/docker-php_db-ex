/* var td = document.getElementsByClassName("value")
for (var i = 0; i < td.length; i++) {
  if(parseInt(td[i].innerText) || td[i].innerText == '0'){
    if(td[i].innerText >= 0){
      td[i].style.color = "#FF3300";  

      if(td[i].innerText >= 20){
        td[i].style.color = "#FF9330";  
      }
      if(td[i].innerText >= 25){
        td[i].style.color = "#76CC69";  
      }
    }
  }
} */

$('#wf').text(WINDFARM.name)
$('#title h9').text('Time to Failure')
function loadLifeAnalytics(range){
  //Empty table
  $("#fatigue-table thead").empty()
  $("#fatigue-table tbody").empty()
  //Get table data
  $.ajax({
      url: 'php/getData.php',
      data: { 'callFunc': 'getWT', 'windFarm': WINDFARM.idPark, 'wtg': null,'range': range },
      type: 'POST',
      dataType: 'json',
      async: false,
  
      success: function (machine) {
          //Generate body for each machine
          var table_head = "<tr class='head'><th></th>"
          var hide = "<tr id='first-row'><td></td>"
          var power = "<td><span>Power</span><span> [MW]</span></td>"
          var model = "<td><span>Turbine Model</span><span> [-]</span></td>"
          var twr = "<td><span>TWR</span><span> [m]</span></td>"
          var startup = "<td><span>Start-Up</span><span> [year]</span></td>"
          var speed = "<td><span>Average Wind Speed</span><span> [m/s]</span></td>"
          var lu = "<td><span>Iu (15m/s)</span><span> [-]</span></td>"
          var inflow = "<td><span>Inflow</span><span> [deg]</span></td>"
          var alpha = "<td><span>Alpha</span><span> [-]</span></td>"
          var density = "<td><span>Air Density</span><span> [Kg/m3]</span></td>"
          var availability = "<td><span>Availability</span><span> [%]</span></td>"
          var cont = 1

          machine.data.forEach(wtg => {
              var pwr = wtg.power
              var strup = '-'
              pwr = Math.round(pwr * 1000) / 1000
              if(wtg.wtg_startup != null){
                  strup = wtg.wtg_startup.substring(0,4)
              }
  
              $.ajax({
                  url: 'php/getData.php',
                  data: { 'callFunc': 'getKpis', 'windFarm': WINDFARM.idPark, 'machine': wtg.wtg_number, 'range': 4 },
                  type: 'POST',
                  dataType: 'json',
                  async: false,
              
                  success: function (json) {
                    table_head += "<th>" + WINDFARM.wtg_code + "" + wtg.wtg_number + "</th>"
                    hide += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'><img src='images/icons/ocultar.svg'></td>"
                    power += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + pwr + "</td>"
                    model += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + wtg.turbine_model + "</td>"
                    twr += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + wtg.twr + "</td>"
                    startup += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + strup + "</td>"
                    speed += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + parseFloat(json.wind_speed) + "</td>"
                    lu += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + parseFloat(json.iu) + "</td>"
                    inflow += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + parseFloat(json.inflow) + "</td>"
                    alpha += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + parseFloat(json.alpha) + "</td>"
                    density += "<td onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + parseFloat(json.air_density) + "</td>"
                    availability += "<td onclick='analytics2smartdata(" + wtg.availability + ", `ml`)'>" + parseFloat(json.availability) + "</td>"
                    cont++
  
                    if(wtg == machine.data[machine.data.length - 1]){
                      table_head += "</tr>"
                      $("#fatigue-table thead").append(table_head)
/*                       $("#fatigue-table tbody").append(hide) */
                      $("#fatigue-table tbody").append("<tr id='second-row'>" + power + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + model + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + twr + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + startup + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + speed + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + lu + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + inflow + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + alpha + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + density + "</tr>")
                      $("#fatigue-table tbody").append("<tr>" + availability + "</tr>")
                    }
                  },
              
                  error: function (xhr, status) {
                      console.log('There is an error -> ' + xhr.responseText)
                      //window.location.href = "Error"
                  }
              })
          });
          $("#fatigue-table tbody").append("<tr id='blank-row'><td>&nbsp</td></tr>")
          $("#fatigue-table tbody").append("<tr id='components'><td>Components<p>Remaining life in years</p></td></tr>")
          var components_rows = []
          var bladeRowFinal = "";
          var bladeRow = "";
          machine.data.forEach(wtg => {
            var bld_min = 40;
              $.ajax({
                  url: 'php/getDashboardData.php',
                  data: { 'callFunc': 'getFatigueComponents', 'windFarm': WINDFARM.idPark, 'machine': wtg.number, 'idCell': wtg.idcell, 'turbineType': wtg.turbine_model, 'range': range},
                  type: 'POST',
                  dataType: 'json',
                  async: false,
              
                  success: function (json) {            
                      //Set each one of the components
                      json.components.forEach(component => {
                          var ttdiff = (Date.now() - new Date(component[0].installdate.substring(3,5) + "/" + component[0].installdate.substring(0,2) + "/" + component[0].installdate.substring(6,10)).getTime()) / 31536000000
              
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
                          //if(component[0].component == 'twr_00'){
                              //name = 'Foundation'
                          //} 
              
                          //Fill table
                          if (!(component[0].component in components_rows)){
                              components_rows[component[0].component] = [name, parseInt(component[0].order), ""]
                          }
                          var color = "c-green"
                          if((Math.round((component[0].fatigue[0] - ttdiff) * 100) / 100) < 5){
                              color = "c-orange"
                          }
                          if((Math.round((component[0].fatigue[0] - ttdiff) * 100) / 100) < 3){
                              color = "c-red"
                          }
  
                        if(component[0].component.startsWith('bld_')){
                            if(Math.trunc(Math.round((component[0].fatigue[0] - ttdiff) * 10) / 10) < bld_min){
                                bld_min =  Math.trunc(Math.round((component[0].fatigue[0] - ttdiff) * 10) / 10)
                                if(bld_min < 0){
                                    bld_min = 0
                                }
                                bladeRow = "<td class='" + color + "' onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + bld_min + "</td>"
                                if(component[3]){
                                    color = "c-green"
                                    bladeRow = "<td class='" + color + "' onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>Calc</td>"
                                }
                            }
                        }
                        if(!component[3]){
                            if((component[0].fatigue[0] - ttdiff) < 0){
                                components_rows[component[0].component][2] += "<td id class='" + color + "' onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>0</td>"
                            }else{
                                if(component[0].component != 'gearbox'){
                                    components_rows[component[0].component][2] += "<td class='" + color + "' onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>" + Math.trunc(Math.round((component[0].fatigue[0] - ttdiff) * 10) / 10) + "</td>"
                                }
                                else{
                                    color = "c-green"
                                    components_rows[component[0].component][2] += "<td class='" + color + "' onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>-</td>"
                                } 
                            }
                        }
                        else{
                            color = "c-green"
                            components_rows[component[0].component][2] += "<td class='" + color + "' onclick='analytics2smartdata(" + wtg.wtg_number + ", `ml`)'>Calc</td>"
                        }
                          if(component == json.components[json.components.length - 1]){
                            bladeRowFinal+=bladeRow
                          }

                          if(wtg == machine.data[machine.data.length - 1] && component == json.components[json.components.length - 1]){
                            var isBlade = true
                              Object.values(components_rows).forEach(comp => {
                                if(comp[0].startsWith('Blade') && isBlade){
                                    $("#fatigue-table > tbody").append("<tr><td>Blade</td>" + bladeRowFinal + "</tr>")
                                    isBlade = false
                                }
                                if(!comp[0].startsWith('Blade')){
                                    $("#fatigue-table > tbody").append("<tr><td>" + comp[0] + "</td>" + comp[2] + "</tr>")
                                    $("#fatigue-table > tbody > tr:nth-child(14)").attr('id', 'first-component')
                                }
                              })

  
/*                               document.querySelectorAll('tr.sortable td:first-child').forEach(td => td.addEventListener('click', (() => {
                                  const table = td.closest('table');
                                  var childrens = Array.from(td.parentNode.children)
              
                                  Array.from(table.querySelectorAll('thead tr')).forEach(row => {
                                      var row_child = Array.from(row.children)
                                      row_child.sort(function(a, b) {
                                          return childrens[row_child.indexOf(a)].innerHTML - childrens[row_child.indexOf(b)].innerHTML
                                      });
                                      row.remove()
                                      var tr = document.createElement("tr");
                                      tr.classList.add('head')
                                      row_child.forEach(child => {
                                          tr.appendChild(child)
                                      })
                                      table.querySelectorAll('thead')[0].appendChild(tr)
                                  })
              
                                  Array.from(table.querySelectorAll('tbody tr')).forEach(row => {
                                      var row_child = Array.from(row.children)
                                      row_child.sort(function(a, b) {
                                          return childrens[row_child.indexOf(a)].innerHTML - childrens[row_child.indexOf(b)].innerHTML
                                      });
                                      row.remove()
                                      var tr = document.createElement("tr");
                                      row_child.forEach(child => {
                                          tr.appendChild(child)
                                      })
                                      table.querySelectorAll('tbody')[0].appendChild(tr)
                                  })
                              })));
              
                              const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;
              
                              const comparer = (idx, asc) => (a, b) => ((v1, v2) => 
                                  v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
                                  )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));
              
                              // do the work...
                              document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
                                  const table = th.closest('table');
                                  Array.from(table.querySelectorAll('tr:nth-child(n+11):not(.head)'))
                                      .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
                                      .forEach(tr => table.querySelectorAll('tbody')[0].appendChild(tr) );
                              })));
                            */
                              $("#second-container").css('display', 'block')
                              $(".loading-container").css('display', 'none')
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
}

loadLifeAnalytics(0)
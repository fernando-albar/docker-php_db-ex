document.getElementById("calc").addEventListener("change", function () {
    RANGE = this.value;
    loadMachineLife(this.value);
});

$('#wtg').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#wf').text(WINDFARM.name)

$('#wf').click(function(){
    pageChange('windfarm')
})
RANGE = 0
function loadMachineLife(range){
    var data = {nacelle: "", hub: "", blade: "", tower: "", foundation: ""};
    
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getFatigueComponents', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'idCell': MACHINE.idcell, 'turbineType': TURBINEMODEL, 'range': range},
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            //Set of the header data info
            $("#windturbine").text("Wind Turbine " + MACHINE.wtg_number);
            $("#lastDataDate").text("Last data from " + json.lastDataDate);
            $("#fatigueCalculatedOn").text("Fatigue calculated on " + json.fatigueCalculatedOn);
            $("#windfarm-startDate").text("Wind farm start date: " + WINDFARM.startUp);
            $("#analytics-startDate").text("nabla analytics start date: " + WINDFARM.startDate);
            $('.main-card div').empty()
            //Set each one of the components
            json.components.forEach(component => {
                //Select the life bar color by his value
                var color = 'green';
                if(component[0].fatigue[0] < 20){
                    color = 'red';
                }else if(component[0].fatigue[0] < 25){
                    color = 'orange';
                }

                //Set dates format
                today = new Date();
                var installDate = component[0].installdate;
                installDate = installDate.substring(3, 5) + "-" + installDate.substring(6, 10);
                var expectancyDate = new Date(component[0].installdate.substring(6, 10), component[0].installdate.substring(3, 5), component[0].installdate.substring(0, 2));
                expectancyDate.setMonth(expectancyDate.getMonth() + Math.round(component[0].fatigue[0]*12));
                if(expectancyDate < today || expectancyDate == 'Invalid Date'){
                    expectancyDate = today
                }
                expectancyDate = expectancyDate.toISOString();
                expectancyDate = expectancyDate.substring(5, 7) + "-" + expectancyDate.substring(0, 4);
                var nextRevision = component[0].fatigue[2];

                //Generate a row for each component
                switch (component[0].position){
                    case "Nacelle":
                        data.nacelle += rowCreator(component[0].component, component[0].name, component[0].location, Math.trunc(component[0].fatigue[0]), color, installDate, expectancyDate, component[1], component[0].fatigue[1], component[2], nextRevision, range, component[3])
                        break
                    case "Hub":
                        data.hub += rowCreator(component[0].component, component[0].name, component[0].location, Math.trunc(component[0].fatigue[0]), color, installDate, expectancyDate, component[1], component[0].fatigue[1], component[2], nextRevision, range, component[3])
                        break
                    case "Blade":
                        data.blade += rowCreator(component[0].component, component[0].name, component[0].location, Math.trunc(component[0].fatigue[0]), color, installDate, expectancyDate, component[1], component[0].fatigue[1], component[2], nextRevision, range, component[3])
                        break
                    case "Tower":
                        data.tower += rowCreator(component[0].component, component[0].name, component[0].location, Math.trunc(component[0].fatigue[0]), color, installDate, expectancyDate, component[1], component[0].fatigue[1], component[2], nextRevision, range, component[3])
                        break
                    case "Foundation":
                        data.foundation += rowCreator(component[0].component, component[0].name, component[0].location, Math.trunc(component[0].fatigue[0]), color, installDate, expectancyDate, component[1], component[0].fatigue[1], component[2], nextRevision, range, component[3])
                        break
                }
            })

            //Fill components containers
            $("#nacelle div").append(data.nacelle);
            $("#hub div").append(data.hub);
            $("#blade div").append(data.blade);
            $("#tower div").append(data.tower);
            $("#foundation div").append(data.foundation);

            json.components.forEach(component => {
                $('#' + component[0].component).click(function(){
                    COMPONENT = [component[0].component, component[0].name, component[0].location]
                    THRESHOLD = null
                    pageChange("componentFatigue")
                });
            })

            //Load loadbars
            document.querySelectorAll(".progress").forEach(element => {
                element.style.width = element.getAttribute('data-done') + "%"
                element.style.backgroundColor = element.getAttribute('data-color')
            })
            
            //Page top
            $('html, body').animate({ scrollTop: 0 }, 'fast');
            $(".content-header").removeClass('invisible')
            $(".content-body").removeClass('invisible')
            $(".loading-container").addClass('d-none')
            //document.getElementById("img-logo-header").classList.remove("reveal_logo")
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

function rowCreator(component, componentName, location, life, color, installation, expectancy, oem, fatigue, last, next, range, reset_fatigue){
    var progress = 0
    styleCalculating = ''
    if(fatigue < 0){
        fatigue = 'Not available'
    }

    if(life < 0){
        life = 0
    }
    
    if(reset_fatigue){
        //life = 0
        life = 'Calculating'
        progress = 40
        color = 'green'
        expectancy = 'Calculating'
        styleCalculating = 'font-size: 0.2em'
    }

    if(component == 'gearbox'){
        //life = 0
        life = '-'
        progress = 40
        color = 'green'
        expectancy = '-'
    }

    progress = (life*100)/40
    return '<div class="card" id="' + component + '">'
+'       <div>           '             
+'           <p>'+ componentName +'</p> '
+'        </div>'
+'      <div class="single-chart">'
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
+'            <text x="18" y="20.35" class="percentage" style="'+styleCalculating+'">'+ life +'</text>'
+'            <text x="18" y="23.35" class="subline">years</text>'
+'          </svg>'
+'        </div>'
+'        <p>Life</p>'
+'        <div class="expectancy-info">'
+'          <div>                             '   
+'              <p>Installation:</p>'
+'              <p>'+ installation +'</p> '
+'          </div>'
+'          <img src="images/icons/arrow_chart.svg" alt="">'
+'          <div>'
+'              <p>Expectancy:</p>'
+'              <p>'+ expectancy +'</p> '
+'          </div>'
+'        </div>'
+'  </div>'
+' </div>'
}

loadMachineLife(0)
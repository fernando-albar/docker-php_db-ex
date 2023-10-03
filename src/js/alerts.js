var ALLALERTS = "active"

cleanNavbarSelect()
document.getElementById("alerts-all").classList.add("nav-selected")
document.getElementById("dashboards").classList.remove("panel-selected")
document.getElementById("alerts").classList.add("panel-selected")
document.getElementById("active-subtitle").classList.remove("d-none")

function cleanNavbarSelect(){
    document.getElementById("alerts-all").classList.remove("nav-selected")
    document.getElementById("alerts-pending").classList.remove("nav-selected")
    document.getElementById("alerts-solved").classList.remove("nav-selected")

    document.getElementById("active-subtitle").classList.add("d-none")
    document.getElementById("pending-subtitle").classList.add("d-none")
    document.getElementById("solved-subtitle").classList.add("d-none")
}

document.getElementById("alerts-all").addEventListener("click", function(){
    ALLALERTS = "active"
    cleanNavbarSelect()
    document.getElementById("alerts-all").classList.add("nav-selected")
    document.getElementById("active-subtitle").classList.remove("d-none")
    loadData()
})

document.getElementById("alerts-pending").addEventListener("click", function(){
    ALLALERTS = "pending"
    cleanNavbarSelect()
    document.getElementById("alerts-pending").classList.add("nav-selected")
    document.getElementById("pending-subtitle").classList.remove("d-none")
    loadData()
})

document.getElementById("alerts-solved").addEventListener("click", function(){
    ALLALERTS = "solved"
    cleanNavbarSelect()
    document.getElementById("alerts-solved").classList.add("nav-selected")
    document.getElementById("solved-subtitle").classList.remove("d-none")
    loadData()
})

document.getElementById("check-all-alerts").addEventListener('change', function() {
    if (document.getElementById("check-all-alerts").checked) {
        $("table tbody tr input[type=checkbox]").prop("checked", true)
    } else {
        $("table tbody tr input[type=checkbox]").prop("checked", false)
    }
})

document.getElementById("body").addEventListener('click', function() {
    $(".dropdown-content").removeClass("d-block")
})

document.getElementById("wfarm-btn").addEventListener('click', function() {
    $(".dd-content:not(#wfarm-content)").removeClass("show")
    $("#wfarm-btn i").toggleClass('show')
    document.getElementById("wfarm-content").classList.toggle('show')
})

document.getElementById("date-btn").addEventListener('click', function() {
    $(".dd-content:not(#date-content)").removeClass("show")
    $("#date-btn i").toggleClass('show')
    document.getElementById("date-content").classList.toggle('show')
})

document.getElementById("wtg-btn").addEventListener('click', function() {
    $(".dd-content:not(#wtg-content)").removeClass("show")
    $("#wtg-btn i").toggleClass('show')
    document.getElementById("wtg-content").classList.toggle('show')
})

document.getElementById("model-btn").addEventListener('click', function() {
    $(".dd-content:not(#model-content)").removeClass("show")
    $("#model-btn i").toggleClass('show')
    document.getElementById("model-content").classList.toggle('show')
})

document.getElementById("type-btn").addEventListener('click', function() {
    $(".dd-content:not(#type-content)").removeClass("show")
    $("#type-btn i").toggleClass('show')
    document.getElementById("type-content").classList.toggle('show')
})

document.getElementById("alert-date-calendar").addEventListener('change', function() {
    document.getElementById("alert-date-calendar").classList.add("d-none")
    document.getElementById("date-btn").innerHTML = "<b>Date: </b>" + document.getElementById("alert-date-calendar").value
    document.getElementById("date-btn").setAttribute("value", document.getElementById("alert-date-calendar").value)
    let i = document.createElement('i')
    i.classList.add("fa-solid")
    i.classList.add("fa-xmark")
    i.classList.add("refresh-dd")
    i.addEventListener('click', e =>{
        e.stopPropagation()
        clearDd("date", "Date")
    })
    document.getElementById("date-btn").appendChild(i)
})


var wfs;
function loadSearch(){

    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getSearch' },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            //Fill platform select
            json.platforms.forEach(platform => {
                addElementDd("model", platform, platform, "Turbine model", [], null)
            })

            //Fill windfarm select
            json.windfarms.forEach(windfarm => {
                addElementDd("wfarm", windfarm[0], windfarm[1], "Wind farm", [], null)
            })

            //Fill machines select
            json.wtgs.forEach(wtg => {
                addElementDd("wtg", wtg[3] + "," + wtg[2].replace(/\s/g, "").replace(".", "") + "," + wtg[1] + "," + wtg[4] + "," + wtg[0], wtg[1] + " - " + wtg[0], "WTG", [wtg[3], wtg[2].replace(/\s/g, "").replace(".", ""), wtg[1], wtg[4]], null)
            })

            //Fill dates
            addElementDd("date", "last", "Last 24h", "Date", [], null)
            addElementDd("date", "week", "Last week", "Date", [], null)
            addElementDd("date", "month", "Last 30 days", "Date", [], null)
            addElementDd("date", "month3", "Last 3 months", "Date", [], null)
            addElementDd("date", "custom", "Custom date", "Date", [], "fa-plus")

            //Fill types
            addElementDd("type", "ndt", "NDT", "Alert type", [], null)
            addElementDd("type", "preventive", "Preventive", "Alert type", [], null)
            addElementDd("type", "failure", "Failure", "Alert type", [], null)
            addElementDd("type", "extreme", "Extreme", "Alert type", [], null)

            loadData()
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function addElementDd(code, value, value_text, text, clases, special){
    let div = document.createElement("p")
    if(special != null){
        div.setAttribute("style", "border-top: 1px solid rgba(0, 0, 0, 0.22); margin-top: .5rem;")
    }

    clases.forEach(clase =>{
        div.classList.add(clase)
    })

    div.setAttribute("value", value)
    if(special == null){
        div.innerHTML = "<i class=\"fa-regular fa-circle-dot select\"></i><i class=\"fa-regular fa-circle no-select\"></i>" + " " + value_text
    }else{
        div.innerHTML = "<i class=\"fa-solid "+ special +"\"></i>" + " " + value_text
    }
    div.addEventListener("click", function(){
        $("#"+code+"-content p").removeClass("selected")
        div.classList.add("selected")
        document.getElementById(code+"-btn").innerHTML = "<b>"+text+": </b>" + value_text
        document.getElementById(code + "-btn").setAttribute("value", value)
        let i = document.createElement('i')
        i.classList.add("fa-solid")
        i.classList.add("fa-xmark")
        i.classList.add("refresh-dd")
        i.addEventListener('click', e =>{
            e.stopPropagation()
            clearDd(code, text)
            filterSearch()
            loadData()
            if(code == "wfarm" || code == "model"){
                if(code == "wfarm"){
                    filtModel()
                }else{
                    filtWindfarm()
                }
            }
        })
        document.getElementById(code+"-btn").appendChild(i)
        document.getElementById(code+"-content").classList.remove("show")

        if(code == "wfarm" || code == "model"){
            if(code == "wfarm"){
                filtModel()
            }else{
                filtWindfarm()
            }
        }

        if(value != "custom"){
            loadData()
        }else{
            document.getElementById("alert-date-calendar").classList.remove("d-none")
        }
    })

    document.getElementById(code+"-content").appendChild(div)
}

function filtModel(){
    if($("#wfarm-btn").val() != 999){
        if($("#model-btn").val() == 999){
            $.ajax({
                url: 'php/getData.php',
                data: { 'callFunc': 'getWindfarmModels', 'windFarm': $("#wfarm-btn").val() },
                type: 'POST',
                dataType: 'json',
        
                success: function (json) {
                    $('#model-content p').css("display", "none")
                    json.forEach(model => {
                        $('#model-content p[value="' + model + '"]').css("display", "inherit")
                    })
                    filterSearch()
                },
        
                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText)
                    //window.location.href = "Error"
                }
            })
        }else{
            filterSearch()
        }
    }else{
        $('#model-content p').css("display", "inherit")
        filterSearch()
    }
}

function filtWindfarm(){
    if($("#model-btn").val() != 999){
        if($("#wfarm-btn").val() == 999){
            $.ajax({
                url: 'php/getData.php',
                data: { 'callFunc': 'getModelsWindfarm', 'model': $("#model-btn").val() },
                type: 'POST',
                dataType: 'json',
        
                success: function (json) {
                    $('#wfarm-content p').css("display", "none")
                    json.forEach(model => {
                        $('#wfarm-content p[value="' + model + '"]').css("display", "inherit")
                    })
                    filterSearch()
                },
        
                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText)
                    //window.location.href = "Error"
                }
            })
        }else{
            filterSearch()
        }
    }else{
        $('#wfarm-content p').css("display", "inherit")
        filterSearch()
    }
}

function clearDd(content, text){
    document.getElementById(content + "-btn").innerHTML = text + "<i class=\"fa-solid fa-angle-right\"></i>"
    document.getElementById(content + "-btn").setAttribute("value", 999)
    $("#"+content+"-content p").removeClass("selected")
}

function filterSearch(){
    //Reset all machine options
    $('#wtg-content p').css("display", "inherit")

    //Filter by windfarm
    if($("#wfarm-btn").val() != 999){
        $('#wtg-content p').not("." + $("#wfarm-btn").val()).css("display", "none")
    }

    //Filter by platform
    if($("#model-btn").val() != 999){
        $('#wtg-content p').not("." + $("#model-btn").val()).css("display", "none")
    }
}

function loadData(){
    $("#alert-date-calendar").addClass('d-none')
    document.getElementById("alerts-body").innerHTML = "<tr><td colspan='11'><img src='images/loader_final.gif'></td></tr>"
    var date = $("#date-btn").val();
    if($("#date-btn").val() == "custom"){
        date = $("#alert-date-calendar").val()
    }

    var wtg = $("#wtg-btn").val()
    if(wtg != 999){
        wtg = wtg.split(',')[4]
    }

    var icon = ''
    var options = ''
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getAlertsCalcs', "windFarm": $("#wfarm-btn").val(), "date": date, "wtg": wtg, "model": $("#model-btn").val(), "type": $("#type-btn").val(), "all": ALLALERTS },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            var newAlerts = json.reduce((accumulator, object) => {
                return accumulator + parseInt(object.new);
              },0);

            var counter = 0
            if(newAlerts > 0){
                document.getElementById("alerts").setAttribute("style", "--alertNum: '"+ newAlerts +"';")
            }
            //Fill platform select
            document.getElementById("alerts-body").innerHTML = ""

            document.getElementById("footer-results").innerHTML = json.length + " Results"
            document.getElementById("footer-new").innerHTML = newAlerts + " new alerts"

            json.forEach(alert => {
                if(counter == newAlerts) {
                    var divider = document.createElement("tr")
                    divider.classList.add("divider")

                    var line1 = document.createElement("td")
                    line1.setAttribute("colspan", 5)
                    var hr1 = document.createElement("hr")
                    line1.appendChild(hr1)
                    hr1.setAttribute("colspan", 5)
                    var line2 = document.createElement("td")
                    var hr2 = document.createElement("hr")
                    line2.appendChild(hr2)
                    line2.setAttribute("colspan", 5)

                    var text = document.createElement("td")
                    text.innerHTML = newAlerts + " new alerts"

                    divider.appendChild(line1)
                    divider.appendChild(text)
                    divider.appendChild(line2)
                    document.getElementById("alerts-body").appendChild(divider)
                }
                var row = document.createElement("tr")

/*                 row.addEventListener('click', e =>{
                    e.stopPropagation()
                    goToComponent(alert.idalert, alert.idwfarm, alert.wtg, alert.type, alert.idcomponent, alert.component)
                    }) */

                alert_value = Math.trunc(alert.value)
                if(alert.type == 'extreme'){
                    alert_value += '%'
                    if(alert.idcomponent.includes('bld')){
                        alert.component = 'Blade - '+alert.component
                    }
                }
                else{
                    if(alert_value == 0){
                        alert_value = '< 1';
                    }
                    if(alert_value < 0){
                        alert_value = '0';
                    }
                    alert_value += ' years'
                    if(alert.idcomponent.includes('bld')){
                        alert.component = 'Blade'
                    }
                }

                switch(ALLALERTS){
                    case ('active'):
                        icon = 'class=\"fa-solid fa-triangle-exclamation\" style=\" color: #FDA872;'
                        options = `<a onclick='alertAction(\"solved\", ${alert.idalert})'>Mark as solved</a><a onclick='alertAction(\"pending\", ${alert.idalert})'>Pending task</a>`;
                        break;
                    case ('pending'):
                        icon = 'class=\"fa-regular fa-hourglass-half\" style=\" color: #55CAFF;'
                        options = `<a onclick='alertAction(\"solved\", ${alert.idalert})'>Mark as solved</a><a onclick='alertAction(\"active\", ${alert.idalert})'>Active task</a>`;
                        break;
                    case ('solved'):
                        icon = 'class=\"fa-regular fa-circle-check\" style=\" color: #5DAA40;'
                        options = `<a onclick='alertAction(\"active\", ${alert.idalert})'>Mark as active</a><a onclick='alertAction(\"pending\", ${alert.idalert})'>Pending task</a>`;
                        break;
                }

                row.innerHTML = "<td><input id = 'checkbox-"+alert.idalert+"' type=\"checkbox\"></td><td>" + alert.idalert + "</td><td><i " + icon + "  margin-right: 5px;\"></i>" + alert.status + "</td><td>" + alert.datetime + "</td><td>" + alert.windfarm + "</td><td>" + alert.type + "</td><td>" + alert.wtg + "</td><td>" + alert.model + "</td><td>" + alert.component + "</td><td>" + alert_value + "</td>"
                var td = document.createElement("td")
                td.innerHTML = "<div class=\"dropdown\"><i class=\"fa-solid fa-ellipsis-vertical\"></i><div id=\"myDropdown\" class=\"dropdown-content\"> " + options + " </div></div>"
                td.addEventListener('click', e =>{
                    e.stopPropagation()
                    var tiene = td.querySelectorAll(".dropdown-content")[0].classList.contains('d-block')
                    document.querySelectorAll(".dropdown-content").forEach(element =>{ 
                        element.classList.remove('d-block')
                    })
                    
                    if(!tiene){
                        td.querySelectorAll(".dropdown-content")[0].classList.add('d-block')
                    }
                })
                
                $(row).children('td').slice(1).click(function(){
                    goToComponent(alert.idalert, alert.idwfarm, alert.wtg, alert.type, alert.idcomponent, alert.component)
                })
                row.appendChild(td)
                
                //document.getElementById("alerts-body").innerHTML = ""
                document.getElementById("alerts-body").appendChild(row)
                counter++
            });

            
            
            
            $(document).ready(function() {
                var menuDropdown = "<div class=\"dropdown\"><div id=\"myDropdown\" class=\"dropdown-content\">" + options + "</div></div>"
                var options = ""

                switch (ALLALERTS) {
                    case ('active'):
                        icon = 'class=\"fa-solid fa-triangle-exclamation\" style=\" color: #FDA872;';
                        options = `<a onclick='alertAction(\"solved\", \"checkbox\")'>Mark as solved</a><a onclick='alertAction(\"pending\", \"checkbox\")'>Pending task</a>`;
                        break;
                    case ('pending'):
                        icon = 'class=\"fa-regular fa-hourglass-half\" style=\" color: #55CAFF;';
                        options = `<a onclick='alertAction(\"solved\", \"checkbox\")'>Mark as solved</a><a onclick='alertAction(\"active\", \"checkbox\")'>Active task</a>`;
                        break;
                    case ('solved'):
                        icon = 'class=\"fa-regular fa-circle-check\" style=\" color: #5DAA40;';
                        options = `<a onclick='alertAction(\"active\", \"checkbox\")'>Mark as active</a><a onclick='alertAction(\"pending\", \"checkbox\")'>Pending task</a>`;
                        break;
                    }

                $('#menug').click(function() {
                   
                    var checkboxes = $('input[type="checkbox"]:checked')
                    var checkAllCheckbox = $('#check-all-alerts')

                    if (checkboxes.length >= 1 || checkAllCheckbox.is(':checked')) {
                        $('#myDropdown').empty().append(options)
                        $('#myDropdown').toggle()
                    }
                });

                $('#menug').empty().append(menuDropdown)
        });

            /*document.getElementById('menug').onclick = function() {
                var checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')
                var dropdownIcon = document.querySelector('#menug')
                var checkAllCheckbox = document.querySelector('#check-all-alerts')
                console.log(checkboxes)
                
                var dropdownContent = document.querySelector('.dropdown-content d-block')
                //var dropdownIcon = document.querySelector('.fa-solid.fa-ellipsis-vertical')

                dropdownIcon.addEventListener('click', function (event) {
                    dropdownContent.classList.toggle('active')
                })

                document.addEventListener('click', function(event) {
                    if (!dropdownContent.contains(event.target)) {
                        event.stopPropagation()
                        dropdownContent.classList.remove('active')
                    }
                })

                var selectedCount = 0
                for (var i = 0; i < checkboxes.length; i++) {
                selectedCount++
                }
            
                console.log(selectedCount)
                if (selectedCount >= 1 || checkAllCheckbox.checked) {
                    console.log("ok")

                    dropdownContent.addEventListener('click', function(event) {
                        event.stopPropagation()
                        dropdownContent.classList.toggle('active')

                    })
                    
                    document.addEventListener('click', function(event) {
                        if (!event.target.matches('#menug')) {
                            dropdownContent.classList.remove('active')
                        }
                    })
                }
            }*/
        
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function goToComponent(idalert, idwfarm, wtg, type, idcomponent, component){

    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWindFarm', 'windFarm': idwfarm},
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            WINDFARM = json
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })

/*     $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getKpis', 'windFarm': WINDFARM.idPark, 'machine': wtg, 'range': KPI_RANGE },
        type: 'POST',
        dataType: 'json',
    
        success: function (json) {
            MACHINE=json
            console.log(MACHINE)
        },
        
        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    }) */
    
    $.ajax({
        url: 'php/getData.php',
        data: { 'callFunc': 'getWT', 'windFarm': idwfarm, 'range': 0},
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            json['data'].forEach(machine => {
                if(wtg == machine['wtg_number']){
                    MACHINE = machine
                    TURBINEMODEL = MACHINE.turbine_model
                    COMPONENT = [idcomponent, component]

                    if(['ndt', 'preventive', 'failure'].includes(type)){
                        pageChange('wtg')
                    }
                    else{
                        pageChange('componentExtreme')
                    }

                    cleanPanelSelect()
                    document.getElementById("dashboards").classList.add("panel-selected")

/*                     setTimeout(() => {
                        document.getElementById(idcomponent).scrollIntoView({ behavior: 'smooth'});
                    }, 1500); */

                }
            });
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })

    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'cleanNewAlert', 'idalert': idalert},
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            console.log(json)
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })

}

function alertAction(action, idalert){
    if (idalert == "checkbox") {
        var checkboxes = $('input[type="checkbox"]:checked')
        
        checkboxes.each(i => {
            console.log(checkboxes[i])
            var checkboxId = $(checkboxes[i]).attr('id').split("-")[1]
            console.log(checkboxId)

            $.ajax({
                url: 'php/getDashboardData.php',
                data: { 'callFunc': 'alertAction', 'action': action, 'idalert': checkboxId },
                type: 'POST',
                dataType: 'json',
        
                success: function (json) {
                    loadData()
                },
        
                error: function (xhr, status) {
                    console.log('There is an error -> ' + xhr.responseText)
                    //window.location.href = "Error"
                }
            })
        
        });
    } else {
        $.ajax({
            url: 'php/getDashboardData.php',
            data: { 'callFunc': 'alertAction', 'action': action, 'idalert': idalert },
            type: 'POST',
            dataType: 'json',

            success: function (json) {
                loadData()
            },

            error: function (xhr, status) {
                console.log('There is an error -> ' + xhr.responseText)
                //window.location.href = "Error"
            }
        })
    }
}

loadSearch()
$('#wtg').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
$('#wf').text(WINDFARM.name)

$('#wf').click(function(){
    pageChange('windfarm')
})

$("#nacelle-btn").click(function() {
    $('html, body').animate({
    scrollTop: $("#nacelle").offset().top
    }, 2000);
});

$("#hub-btn").click(function() {
    $('html, body').animate({
    scrollTop: $("#hub").offset().top
    }, 2000);
});

$("#blade-btn").click(function() {
    $('html, body').animate({
    scrollTop: $("#blade").offset().top
    }, 2000);
});

$("#tower-btn").click(function() {
    $('html, body').animate({
    scrollTop: $("#tower").offset().top
    }, 2000);
});

$("#foundation-btn").click(function() {
    $('html, body').animate({
    scrollTop: $("#foundation").offset().top
    }, 2000);
});

position_extremes = {'nacelle': 0, 'hub': 0, 'blade': 0, 'tower': 0, 'foundation': 0}
function loadMachineExtreme(){
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getExtremeComponents', 'windFarm': WINDFARM.idPark, 'machine': MACHINE.wtg_number, 'idCell': MACHINE.idcell, 'turbineType': TURBINEMODEL },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            //Set of the header data info
            $("#wf").text(WINDFARM.name);
            $("#windturbine").text(WINDFARM.idPark+ "-" + MACHINE.wtg_number);
            $("#lastDataDate").text("Last data from: " + json.data.last_record);

            $(".extreme-container").empty();
            $(".secondary-card").empty();
            $(".main-card div").empty();

            //Set each one of the components
            Object.values(json.data.data).forEach(component => {
                //Generate a row for each component
                switch (component.position){
                    case "Nacelle":
                        $("#nacelle").append(rowCreator(component.component, component.name, 'nacelle', component.extreme))
                        break;
                    case "Hub":
                        $("#hub").append(rowCreator(component.component, component.name, 'hub', component.extreme))
                        break;
                    case "Blade":
                        $("#blade").append(rowCreator(component.component, component.name, 'blade', component.extreme))
                        break;
                    case "Tower":
                        $("#tower").append(rowCreator(component.component, component.name, 'tower', component.extreme))
                        break;
                    case "Foundation":
                        $("#foundation").append(rowCreator(component.component, component.name, 'foundation', component.extreme))
                        break;
                }
                
/*                 $('#' + component.component).click(function(){
                    COMPONENT = [component.component, component.name, component.location]
                    THRESHOLD = null
                    pageChange("componentExtreme")
                }); */
                //Generate graphs
/*                 graphCreator(component.component, component.extreme) */
            })

            $(".content-header").removeClass('invisible')
			$(".content-body").removeClass('invisible')
			$(".loading-container").addClass('d-none')
            //document.getElementById("img-logo-header").classList.remove("reveal_logo")

/*             $('.secondary-card').click(function(){
                console.log($(this).attr('id'))
                COMPONENT = this.id
                THRESHOLD = null
                console.log('pageChange')
                pageChange("componentExtreme")
            }); */
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText);
            //window.location.href = "Error";
        }
    });
}

/**
 * Generates an element with the component info
 * @param {String} component Component code
 * @param {String} componentName Component name
 * @param {String} location Component location
 * @param {Object} extreme Extreme data values
 */
function rowCreator(component, componentName, location, extreme){
    var colorP;
    var colorN;
    var green = '#79E569';
    var yellow = '#FFD600';
    var orange = '#FF9330';
    var red = '#FF6A45';

    if(extreme.dpv >= 70){
        colorP = yellow;
        if(extreme.dpv >= 85){
            colorP = orange;
        }
        if(extreme.dpv >= 100){
            colorP = red;
        }
    }
    else{
        colorP = green
    }


    var row = ''
    +'<div class="secondary-card" id="' + component + '">'
    +"<div class='card' onclick='openComponentExtreme([`" + component + "`,`" + componentName + "`,`" + location + "`])'>"
        +'    <div>'
        +'        <p>'+ componentName +'</p>'
        +'        <p>Last 24h</p>'
        +'    </div>'
        +'    <span>Positive</span>' 
        +'    <div class="bar-num">'
        +'        <div class="extreme-bar">'
        +'            <div class="progress-bar" style="width:' + extreme.dpv +'%; background-color:' + colorP + '">'
        +'            </div>' 
        +'        </div>'
        +'        <p>'+ extreme.dpv +'%</p>'
        +'    </div>'

    if(extreme.dnv != null){
        if(extreme.dnv >= 70){
            colorN = yellow;
            if(extreme.dnv >= 85){
                colorN = orange;
            }
            if(extreme.dnv >= 100){
                colorN = red;
            }
        }
        else{
            colorN = green
        }
        row +='    <span>Negative</span>' 
            +'         <div class="bar-num">'
            + '  <div class="extreme-bar">'
            + '<div class="progress-bar" style="width:' + extreme.dnv +'%; background-color:' + colorN + '"></div>'
            + '</div>'
            + '<p>'+ extreme.dnv +'%</p>'
            + '</div>'
            + '</div>'
    }
    else{
        row += '</div>'
    }

    if(extreme.mpv >= 70){
        colorP = yellow;
        if(extreme.mpv >= 85){
            colorP = orange;
        }
        if(extreme.mpv >= 100){
            colorP = red;
        }
    }
    else{
        colorP = green
    }

    row += "    <div class='card' onclick='openComponentExtreme([`" + component+ "`,`" + componentName + "`,`" + location + "`])'>"
    +'    <div>'
    +'        <p>'+ componentName +'</p>'
    +'        <p>Last month</p>'
    +'    </div>'
    +'    <span>Positive</span>' 
    +'    <div class="bar-num">'
    +'        <div class="extreme-bar">'
    +'            <div class="progress-bar" style="width:' + extreme.mpv +'%; background-color:' + colorP + '">'
    +'            </div>'
    +'        </div>'
    + '<p>'+ extreme.mpv +'%</p>'
    +'    </div>'

    if(extreme.mnv != null){
        if(extreme.mnv >= 70){
            colorN = yellow;
            if(extreme.mnv >= 85){
                colorN = orange;
            }
            if(extreme.mnv >= 100){
                colorN = red;
            }
        }
        else{
            colorN = green
        }

        row +='    <span>Negative</span>' 
            +'         <div class="bar-num">'
            + '  <div class="extreme-bar">'
            + '<div class="progress-bar" style="width:' + extreme.mnv +'%; background-color:' + colorN + '"></div>'
            + '</div>'
            + '<p>'+ extreme.mnv +'%</p>'
            + '</div>'
            + '</div>'
    }
    else{
        row += '</div>'
    }

    //Button colors
    if(extreme.mnv != null){
        max_extreme = Math.max(extreme.mpv, extreme.mnv)
        if(extreme.mpv >= extreme.mnv){
            max_extreme_color = colorP
        }
        else{
            max_extreme_color = colorN
        }
    }
    else{
        max_extreme = extreme.mpv
        max_extreme_color = colorP
    }
    if(max_extreme > position_extremes[location]){
        position_extremes[location] = parseInt(max_extreme)
        $('#'+location+'-btn').css('background-color', max_extreme_color)
    }

    if(extreme.tpv >= 70){
        colorP = yellow;
        if(extreme.tpv >= 85){
            colorP = orange;
        }
        if(extreme.tpv >= 100){
            colorP = red;
        }
    }
    else{
        colorP = green
    }

    row += "    <div class='card' onclick='openComponentExtreme([`" + component+ "`,`" + componentName + "`,`" + location + "`])'>"
    +'    <div>'
    +'        <p>'+ componentName +'</p>'
    +'        <p>Last 3 months</p>'
    +'    </div>'
    +'    <span>Positive</span>' 
    +'    <div class="bar-num">'
    +'        <div class="extreme-bar">'
    +'            <div class="progress-bar" style="width:' + extreme.tpv +'%; background-color:' + colorP + '">'
    +'            </div>'
    +'        </div>'
    +'        <p>'+ extreme.tpv +'%</p>'
    +'    </div>'

    if(extreme.tnv != null){
        if(extreme.tnv >= 70){
            colorN = yellow;
            if(extreme.tnv >= 85){
                colorN = orange;
            }
            if(extreme.tnv >= 100){
                colorN = red;
            }
        }
        else{
            colorN = green
        }

        row +='    <span>Negative</span>' 
            +'         <div class="bar-num">'
            + '  <div class="extreme-bar">'
            + '<div class="progress-bar" style="width:' + extreme.tnv +'%; background-color:' + colorN + '"></div>'
            + '</div>'
            + '<p>'+ extreme.tnv +'%</p>'
            + '</div>'
            + '</div>'
    }
    else{
        row += '</div>'
    }

    if(extreme.spv >= 70){
        colorP = yellow;
        if(extreme.spv >= 85){
            colorP = orange;
        }
        if(extreme.spv >= 100){
            colorP = red;
        }
    }
    else{
        colorP = green
    }

    row += "    <div class='card' onclick='openComponentExtreme([`" + component+ "`,`" + componentName + "`,`" + location + "`])'>"
    +'    <div>'
    +'        <p>'+ componentName +'</p>'
    +'        <p>Last 6 months</p>'
    +'    </div>'
    +'    <span>Positive</span>' 
    +'    <div class="bar-num">'
    +'        <div class="extreme-bar">'
    +'            <div class="progress-bar" style="width:' + extreme.spv +'%; background-color:' + colorP + '">'
    +'            </div>'
    +'        </div>'
    +'        <p>'+ extreme.spv +'%</p>'
    +'    </div>'

    if(extreme.snv != null){
        if(extreme.snv >= 70){
            colorN = yellow;
            if(extreme.snv >= 85){
                colorN = orange;
            }
            if(extreme.snv >= 100){
                colorN = red;
            }
        }
        else{
            colorN = green
        }

        row +='    <span>Negative</span>' 
            +'         <div class="bar-num">'
            +'  <div class="extreme-bar">'
            + '<div class="progress-bar" style="width:' + extreme.snv +'%; background-color:' + colorN + '"></div>'
            +'</div>'
            + '<p>'+ extreme.snv +'%</p>'
            + '</div>'
            + '</div>'
    }
    else{
        row += '</div>'
    }

    if(extreme.ypv >= 70){
        colorP = yellow;
        if(extreme.ypv >= 85){
            colorP = orange;
        }
        if(extreme.ypv >= 100){
            colorP = red;
        }
    }
    else{
        colorP = green
    }



    row += "    <div class='card' onclick='openComponentExtreme([`" + component+ "`,`" + componentName + "`,`" + location + "`])'>"
        +'    <div>'
        +'        <p>'+ componentName +'</p>'
        +'        <p>Last year</p>'
        +'    </div>'
        +'    <span>Positive</span>' 
        +'    <div class="bar-num">'
        +'        <div class="extreme-bar">'
        +'            <div class="progress-bar" style="width:' + extreme.ypv +'%; background-color:' + colorP + '">'
        +'            </div>' 
        +'        </div>'
        +'        <p>'+ extreme.ypv +'%</p>'
        +'    </div>'

    if(extreme.ynv != null){
        if(extreme.ynv >= 70){
            colorN = yellow;
            if(extreme.ynv >= 85){
                colorN = orange;
            }
            if(extreme.ynv >= 100){
                colorN = red;
            }
        }
        else{
            colorN = green
        }
        row +='    <span>Negative</span>' 
            +'         <div class="bar-num">'
            + '  <div class="extreme-bar">'
            + '<div class="progress-bar" style="width:' + extreme.ynv +'%; background-color:' + colorN + '"></div>'
            + '</div>'
            + '<p>'+ extreme.ynv +'%</p>'
            + '</div>'
            + '</div>'
    }
    else{
        row += '</div>'
    }

    row +='           </div>'
    return row;
}

/* function submitExtremeForm(component){
    //Change to life graphic page
    COMPONENT = component
    THRESHOLD = null
    console.log(COMPONENT)
    pageChange("componentExtreme")
} */

function openComponentExtreme(component){
    COMPONENT = component
    THRESHOLD = null
    pageChange("componentExtreme")
}

loadMachineExtreme()
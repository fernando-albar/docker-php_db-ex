//Global variables for the app
var WINDFARM = ""
var TURBINEMODEL = ""
var MACHINE = ""
var COMPONENT = ""
var TODAY = ""
var RANGE = 1
var KPI_RANGE = 0
var PERFORMANCE_KPI_RANGE = 1
var CELL = ""
var DASHACCESS = ""
var THRESHOLD = ""
var CURRENTPAGE = ""
var NAVHISTORY = []
var USER_EMAIL = ""

//Set navegation back button action
history.pushState(null, document.title, location.href);
window.addEventListener('popstate', function (event)
{
    //Go to the previous page visited
    history.pushState(null, document.title, location.href);
    if(NAVHISTORY.length > 0){
        CURRENTPAGE = ""
        pageChange(NAVHISTORY.pop())
    }
});

//Prepare today data and calendars max data
var TODAY = new Date()
var dd = TODAY.getDate()
var mm = TODAY.getMonth() + 1 //January is 0!
var yyyy = TODAY.getFullYear()

if (dd < 10) {
  dd = '0' + dd
}
if (mm < 10) {
  mm = '0' + mm
}

TODAY = yyyy + '-' + mm + '-' + dd

$('#menu > img').click(function(){
    pageChange('mainAnalytics')
})

/* $('#profile > img').click(function(){
    $('#panel-collapse').css('display', 'flex')
})

$('window').click(function(){
    console.log($('#panel-collapse').css('display'))
    if($('#panel-collapse').css('display') == 'flex'){
        $('#panel-collapse').css('display', 'none')
    }
}) */

window.addEventListener('click', function(e){   
if ((e.target.id) == 'profile-img'){
    $('#panel-collapse').css('display', 'flex')
} else{
    $('#panel-collapse').css('display', 'none')
}
});

$('#panel-collapse').hover(function(){
    $('#logout-img').attr('src', 'images/icons/arrow_logout_hover.png')
}, function(){
    $('#logout-img').attr('src', 'images/icons/arrow_logout.png')
}
);

document.getElementById("panel-collapse").addEventListener("click", function(){
    $.ajax({
        url: 'php/login.php',
        data: { 'logout': true },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            window.location = json.url+'.html'
        },

        error: function (xhr, status) {
            //console.log('There is an error -> ' + xhr.responseText)
            window.location.href = "Error"
        }
    })
})

document.getElementById("dashboards").addEventListener("click", function(){
    cleanPanelSelect()
    pageChange('mainAnalytics')
})

document.getElementById("alerts").addEventListener("click", function(){
    cleanPanelSelect()
    pageChange('alerts')
})

function pageChange(page){

/*     if(CURRENTPAGE == 'alerts'){
        cleanNewAlerts()
    } */
    //Hide range buttons
/*     $(".mainRangeButtons").addClass('d-none')
    //Remove before pages scripts
 */
    //Clear main content
    console.log(page)
    loadAlerts()
    KPI_RANGE = 0
    main_map = false
    windfarm_map = false

    $('.nav > ul > li').removeClass('nav-selected')
    if(page == 'mainAnalytics'){
        $(".nav").hide();
        cleanPanelSelect()
    }
    else{
        if(page == 'windfarm'){
            $('#wtg-nav').hide()
            $('#alerts-nav').hide()
            $('#windfarm-nav').show()
            $('#windfarm-nav > ul > li#overview').addClass('nav-selected')

/*             if(USER_EMAIL != 'demo.user@nablawindhub.com'){
                $('#windfarm-nav #performance').hide()
            } */
        }
        else if(page == 'wtg'){
            $('#windfarm-nav').hide()
            $('#alerts-nav').hide()
            $('#wtg-nav').show()
            $('#wtg-nav > ul > li#overview').addClass('nav-selected')
/*             if(USER_EMAIL != 'demo.user@nablawindhub.com'){
                $('#wtg-nav #performance').hide()
            } */
        } 
        if(page == 'alerts'){
            $('#wtg-nav').hide()
            $('#windfarm-nav').hide()
            $('#alerts-nav').show()
            $('#alerts-nav > ul > li#overview').addClass('nav-selected')
        } 
    }
/*     console.log($('.nav > ul > li#fatigue:visible')) */

    if(page.includes('Extreme')){
        $('.nav > ul > li#extreme').addClass('nav-selected')
        if(CURRENTPAGE == 'mainAnalytics'){
            $('#wtg-nav').hide()
            $('#windfarm-nav').show()
            main_map = true
        }
        if(CURRENTPAGE == 'alerts'){
            $('#alerts-nav').hide()
            windfarm_map = true
        }
        if(page.includes('Map')){
            page = 'wtgExtreme'
            windfarm_map = true
        }
    }
    else if(page.includes('Fatigue')){
        $('.nav > ul > li#fatigue').addClass('nav-selected')
        if(CURRENTPAGE == 'mainAnalytics'){
            $('#wtg-nav').hide()
            $('#windfarm-nav').show()
            main_map = true
        }
        if(page.includes('Map')){
            page = 'wtgFatigue'
            windfarm_map = true
        }
    }
    else if(page.includes('Performance')){
        $('.nav > ul > li#performance').addClass('nav-selected')
        if(CURRENTPAGE == 'mainAnalytics'){
            $('#wtg-nav').hide()
            $('#windfarm-nav').show()
            main_map = true
        }
        if(page.includes('Map')){
            page = 'wtgPerformance'
            windfarm_map = true
        }
    }

    if(main_map){
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
    }

    if(windfarm_map){
        $('#windfarm-nav').hide()
        $('#wtg-nav').show()
        $('#wtg-nav #overview p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
        $('#wtg-nav #fatigue p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
        $('#wtg-nav #performance p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
        $('#wtg-nav #extreme p').text(WINDFARM.wtg_code+''+MACHINE.wtg_number)
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
    }

    $(".dynamic").remove()
    $("#second-container").empty()

    //Include new page
    $("#second-container").load("includes/" + page + ".html")

    var timestamp = new Date().getTime();
    var script = document.createElement('script')
    script.classList = "dynamic"
    script.src = "js/" + page + ".js?v=" + timestamp
    script.setAttribute('defer', '')

    var css = document.createElement('link')
    css.classList = 'dynamic'
    css.href = 'css/' + page + '.css'
    css.rel = 'stylesheet' 
    document.head.appendChild(css)

    if(USER_EMAIL == ""){
        $.ajax({
            url: 'php/getData.php',
            data: { 'callFunc': 'getUser' },
            type: 'POST',
            dataType: 'json',
        
            success: function (json) {
                USER_EMAIL = json.user.email
                $("#profile-img").attr("src", "images/users/" + json.user.client + ".png");
                if (USER_EMAIL != 'demo.user@nablawindhub.com'){
                    $('#windfarm-nav #performance').hide()
                    $('#wtg-nav #performance').hide()
                }
                setTimeout(() => {
                    //document.head.appendChild(script2)
                    document.head.appendChild(script)
                    dispatchEvent(new Event('load'))
                }, "50")
            },
        
            error: function (xhr, status) {
                console.log('There is an error -> ' + xhr.responseText)
                //window.location.href = "Error"
            }
        })
    }
    else{
        setTimeout(() => {
            //document.head.appendChild(script2)
            document.head.appendChild(script)
            dispatchEvent(new Event('load'))
        }, "50")
    }

    
    //Load page data
/*     loadData(page) */

    //Save in history
    if(CURRENTPAGE != ""){
        NAVHISTORY.push(CURRENTPAGE)
    }
    CURRENTPAGE = page

/*     if (!document.getElementById('img-logo-header').classList.contains('reveal_logo') && 
        ['mainAnalytics', 'windfarmAnalytics', 'machineAnalytics', 'fatigueAnalytics', 'extremeAnalytics', 'performanceAnalytics'].includes(page)){
        document.getElementById("img-logo-header").classList.add("reveal_logo")
    } */
    
}

function cleanPanelSelect(){
    document.getElementById("dashboards").classList.remove("panel-selected")
    document.getElementById("alerts").classList.remove("panel-selected")
/*     document.getElementById("indicators").classList.remove("panel-selected") */
}

function cleanNewAlerts(){
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'cleanNewAlerts' },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}

function loadAlerts(){
    $.ajax({
        url: 'php/getDashboardData.php',
        data: { 'callFunc': 'getAlertsCalcs', "windFarm": 999, "date": 999, "wtg": 999, "model": 999, "type": 999, "all": 'active' },
        type: 'POST',
        dataType: 'json',

        success: function (json) {
            var newAlerts = json.reduce((accumulator, object) => {
                return accumulator + parseInt(object.new);
              },0);

            if(newAlerts > 0){
                document.getElementById("alerts").setAttribute("style", "--alertNum: '"+ newAlerts +"';")
            }

            if(newAlerts == 0){
                $("#alerts").removeAttr("style")
            }
        },

        error: function (xhr, status) {
            console.log('There is an error -> ' + xhr.responseText)
            //window.location.href = "Error"
        }
    })
}


pageChange('mainAnalytics')
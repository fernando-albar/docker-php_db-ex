//Verify if the user is logged
$.ajax({
    url : 'php/credentials.php',
    type : 'POST',
    dataType : 'json',

    success : function(json) {
        // Redirect to login if user is not logged
        if(!json.access){
            window.location = json.url;
        }
    },

    error : function(xhr, status) {
        console.log('There is an error ->' + xhr.status);
        //window.location = 'Login';
    }
});

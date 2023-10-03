//Check if there is saved user
if(localStorage.getItem('loginUser') != null && localStorage.getItem('loginUser') != "null"){
    document.getElementById("email").value = JSON.parse(localStorage.getItem('loginUser')).email
    document.getElementById("password").value = JSON.parse(localStorage.getItem('loginUser')).password
    document.getElementById("customControlInline").checked = true
}

//On login button click check credentials
document.getElementById("access-btn").addEventListener("click", function(){
/*     document.getElementById("messageError").classList.add('d-none') */
    
    //Check if there are empty fields
    if(document.getElementById("email").value == ""){
        document.getElementById("email").classList.add('border-red')

/*         document.getElementById("messageError").classList.remove('d-none') */
/*         document.getElementById("messageError").innerHTML = "You can't leave the email empty" */
    }else if(document.getElementById("password").value == ""){
/*         document.getElementById("password").classList.add('border-red')

        document.getElementById("messageError").classList.remove('d-none')
        document.getElementById("messageError").innerHTML = "You can't leave the password empty" */
    }else{
        //Save user if checkbox checked
        if($('#customControlInline').prop('checked')){
            localStorage.setItem('loginUser', JSON.stringify({'email': document.getElementById("email").value, 'password': document.getElementById("password").value}))
        }else{
            localStorage.setItem('loginUser', null)
        }
    
        //Check credentials
        $.ajax({
            url : 'php/login.php',
            data : { 'email' : document.getElementById("email").value, 'password' : document.getElementById("password").value },
            type : 'POST',
            dataType : 'json',
        
            success : function(json) {
                if(json.access){
                    window.location = json.url
                }else{
                    console.log('Error')
/*                     document.getElementById("messageError").classList.remove('d-none')
                    document.getElementById("messageError").innerHTML = json.message */
                }
            },
        
            error : function(xhr, status) {
                console.log('There is an error -> ' + xhr.responseText);
                //window.location.href = "Error"
            }
        });
    }
});

//Redirect to forgot password page
document.getElementById("submit-forgot").addEventListener("click", function(){
    window.location = "ForgotPassword"
});
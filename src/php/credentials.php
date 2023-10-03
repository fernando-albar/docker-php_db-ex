<?php
    header('Content-Type: application/json');
    
    session_start();

    # Check if the user is logged
    if(isset($_SESSION["credentials"]) && $_SESSION["credentials"] != null){
        echo json_encode(['access' => true, 'url' => '']);
    }else{
        echo json_encode(['access' => false, 'url' => 'Login.html']);
    }
?>
<?php
    //PHPMailer
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;
    require "/root/PHPProject/vendor/autoload.php";
    
    include 'php.php';
    date_default_timezone_set('UTC');

    if((isset($_POST['client']) && isset($_POST['wfarm']) && isset($_POST['extremesData'])) && ($_POST['client'] != null && $_POST['wfarm'] != null && $_POST['extremesData'] != null)){
        $argv = ['test.php',$_POST['client'],$_POST['wfarm'],$_POST['extremesData']];
    }

    if (!function_exists('str_contains')) {
        function str_contains(string $haystack, string $needle): bool
        {
            return '' === $needle || false !== strpos($haystack, $needle);
        }
    }

    /*     $servername = "109.106.244.222"; */
    $servername = "localhost";
    $username = "root";
    $password = "N@bl@W1ndP0w3r";
    $dbname = "smartdata_client_2";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $sql = "SELECT wind_farm.name, wtg_code FROM wind_farm where idwfarm = '".$argv[2]."' ";
    $result = $conn->query($sql);

    if($result->num_rows > 0){
        while ($windfarm = $result->fetch_assoc()) {
            $windfarm_name = $windfarm['name'];
            $wtg_code = $windfarm['wtg_code'];
            break;
        }
    }
    
    $email_data = urldecode($argv[3]);
    $email_data = json_decode($email_data, true);
    $mail_recipients = urldecode($argv[4]);
    $mail_recipients = json_decode($mail_recipients);
    sendEmail($email_data, $windfarm_name, $wtg_code, $mail_recipients);



    function sendEmail($extremeData, $windfarm_name, $wtg_code, $mail_recipients){
        $body = '<h3>There have been new extremes in '. $windfarm_name . '</h3>';
        $auxComp = '';
        $auxWTG = '';
        foreach($extremeData as $wtg => $comps){
            if($auxWTG != $wtg){
                $auxWTG = $wtg;
                $nextWTG = true;
            }
            else{
                $nextWTG = false;
            }
            $body .= '<h3>WTG: '. $wtg_code . str_pad($wtg, 2, 0, STR_PAD_LEFT) . '</h3>';
            foreach($comps as $comp => $values){
                if($auxComp != $comp || $nextWTG){
                    $auxComp = $comp;
                    $body .= '<p><strong>Component: '. $auxComp . '</strong></p>';
                }

                if(count($values) == 2){
                    $body .= '<p> - Positive envelope extreme load: ' . strval($values['pos'][0]) . '% <br> - Datetime: ' . $values['pos'][1] . " (UTC+00) </p> <p> - Negative envelope extreme load: " . strval($values['neg'][0]) . '% <br> - Datetime: ' . $values['neg'][1] . " (UTC+00)</p>";
                }
                elseif (in_array('pos', array_keys($values)))  {
                    $body .= '<p> - Positive envelope extreme load: ' . strval($values['pos'][0]) . '% <br> - Datetime: ' . $values['pos'][1] . " (UTC+00) </p>";
                }
                elseif (in_array('neg', array_keys($values)))  {
                    $body .= '<p> - Negative envelope extreme load: ' . strval($values['neg'][0]) . '% <br> - Datetime: ' . $values['neg'][1] . " (UTC+00) </p>";
                }
            }
        }

        $mail = new PHPMailer(true);
        $mail->IsSMTP();
        
        $mail->SMTPDebug = 1; 
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = 'tls'; 
        $mail->Host = "smtp.office365.com";
        $mail->Port = 587; 
        $mail->IsHTML(true);
        $mail->Username = "no-reply-analytics@nablawindhub.com";
        $mail->Password = "bblN9AB$%PlMrPc3";
        $mail->SetFrom("no-reply-analytics@nablawindhub.com");
        $mail->Subject = "New extreme loads";
        $mail->Body = $body;
        foreach($mail_recipients as $recipient){
            $mail->addBCC($recipient);
        }

        $mail->Send();
    }
?>
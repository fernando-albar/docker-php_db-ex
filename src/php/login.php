<?php
    header('Content-Type: application/json');

    include 'config.php';
    include 'php.php';
    
    session_start();

    if ($conn->connect_error) {
        echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
    } else {
        $sql = "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';";
                    //echo $sql;
        if ($conn->query($sql) === TRUE) {
            //echo ".";
        }else {
            //echo $sql."\n";;
        }
    
        $sql = "SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));";
        //echo $sql;
        if ($conn->query($sql) === TRUE) {
            //echo ".";
        }else {
            //echo $sql."\n";;
        }
    }

    //error_reporting(E_ALL);
    //ini_set('display_errors', 'on');

    if(!isset($_POST['logout']) || $_POST['logout'] == null){

        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
            $password = md5(filter_input(INPUT_POST, 'password'));
    
            # Find user in database
            $sql = "SELECT user.idclient, user.name, user.email, user.password, user.telephone, user.user_type, client.name AS client FROM user inner join client on user.idclient = client.idclient WHERE user.email='".$email."' and user.password='".$password."';";
            
            $result = $conn->query($sql);

            # Check if the user exist
            if($result->num_rows == 1){
                $user = $result->fetch_assoc();
                $_SESSION["credentials"] = new User($user['idclient'],$user['name'],$user['client'],$user['email'],$user['password'],$user['telephone'],$user['user_type']);
    
                if(getWindFarms($conn, $user['idclient'])){
                    setDashAccess($conn, $user['email']);
                    echo json_encode(['access' => true, 'message' => '', 'url' => dirname(".", 2)]);
                }else{
                    $_SESSION["credentials"] = null;
                    echo json_encode(['access' => false, 'message' => 'Something went wrong!', 'url' => null]);
                }
            }else{
                $_SESSION["credentials"] = null;
                echo json_encode(['access' => false, 'message' => 'Incorrect login', 'url' => null]);
            }
    
            $conn->close();
        }
    }else{
        $_SESSION["credentials"] = null;
        $_SESSION["windFarms"] = null;
        session_destroy();
        $_SESSION = [];
        echo json_encode(['access' => false, 'message' => 'Loggin out', 'url' => 'Login']);
    }

/**
 * Load in session the windfarms of an specific client
 * 
 * @param conn $conn Database connection
 * @param integer $idclient User client
 * 
 * @return boolean Check if all went right
 **/
    function getWindFarms($conn, $idclient){
        $sql = "SELECT wind_farm.*, analytics.rango, avg(analytics.performance) as performance, sum(extreme_1) as extreme_1, sum(extreme_2) as extreme_2, sum(extreme_3) as extreme_3 FROM wind_farm inner join smartdata_calculed_data.analytics on wind_farm.idwfarm = analytics.idwfarm where wind_farm.idclient = ".$idclient." AND wind_farm.idwfarm != 'i-spin' group by idwfarm, rango order by rango;";
        
        $result = $conn->query($sql);
        if($result->num_rows > 0){
            $windFarms = [];

            while ($windFarm = $result->fetch_assoc()) {
                if($windFarm['rango'] == 0){
                    $windFarms[$windFarm['idwfarm']] = new WindFarm($windFarm['idwfarm'],$windFarm['name'],$windFarm['country'],$windFarm['smartdata_startup'],$windFarm['windfarm_startup'],$windFarm['lat'],$windFarm['lng'],$windFarm['extremeReset'],$windFarm['timeZone'],$windFarm['wtg_code']);
                    $windFarms[$windFarm['idwfarm']]->setAnalytics([]);
                }
                
                $analytics = $windFarms[$windFarm['idwfarm']]->getAnalytics();
                array_push($analytics, [$windFarm['rango'],$windFarm['performance'],$windFarm['extreme_1'],$windFarm['extreme_2'],$windFarm['extreme_3']]);
                $windFarms[$windFarm['idwfarm']]->setAnalytics($analytics);
            }

            $sql = "SELECT idwfarm, MIN(expectancy) as expectancy FROM smartdata_calculed_data.life where rango = 1 and idclient = ".$idclient." group by idwfarm;";

            $result = $conn->query($sql);
            if($result->num_rows > 0){
                while ($lifes = $result->fetch_assoc()) {
                    $analytics = $windFarms[$lifes['idwfarm']]->getAnalytics();
                    for ($i=0; $i < count($analytics); $i++) {
                        array_push($analytics[$i], $lifes['expectancy']);
                    }
                    $windFarms[$lifes['idwfarm']]->setAnalytics($analytics);
                }
            }

            $_SESSION["windFarms"] = $windFarms;
            return true;
        }else{
            $_SESSION["windFarms"] = null;
            return true;
        }
        
        return false;
    }

/**
 * Set the dashboard access to the logged user
 * 
 * @param conn $conn Database connection
 * @param string $email User email
 * 
 **/
    function setDashAccess($conn, $email){
        $sql = "SELECT DISTINCT(dashboard_id) FROM dashboard_access WHERE user_email='".$email."';";
        $result = $conn->query($sql);

        if($result->num_rows > 0){
            $dashAccess = [];

            while ($dash = $result->fetch_assoc()) {
                array_push($dashAccess, $dash['dashboard_id']);
            }

            $_SESSION["credentials"]->setDashAccess($dashAccess);
        }else{
            $_SESSION["credentials"]->setDashAccess([]);
        }
    }
?>
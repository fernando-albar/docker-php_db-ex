<?php
# Import connection
include 'config.php';
include 'php.php';


//PHPMailer
/* use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require "/root/PHPProject/vendor/autoload.php"; */

$callFunc = $_POST['callFunc'];
session_start();
$idclient = $_SESSION['credentials']->getId();

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

if (!function_exists('str_contains')) {
    function str_contains(string $haystack, string $needle): bool
    {
        return '' === $needle || false !== strpos($haystack, $needle);
    }
}

switch ($callFunc) {
    case 'loadWfMachines':
        $windfarm = $_POST['windFarm'];
        # Save in cache windfarm machines data
        if(!isset($_SESSION["windFarms"]) || $_SESSION["windFarms"] == null || $_SESSION["windFarms"][$windfarm]->getMachines() == null){
            $sql = "SELECT *, cell.turbine_model FROM wtg INNER JOIN cell ON cell.idcell = wtg.idcell where wtg.idwfarm = '".$windfarm."' and cell.idwfarm = '".$windfarm."' and wtg.enabled = True order by wtg_number;";
            $result = $conn->query($sql);

            if($result->num_rows > 0){
                $machines = [];

                while ($machine = $result->fetch_assoc()) {
                    $machines[$machine['wtg_number']] = new Machine($machine['idcell'], $machine['wtg_number'], $machine['lat'], $machine['lng'], $machine['turbine_model'],$machine['ispin_wtg'],$machine['wtg_startup']);
                    //$machines[$machine['wtg_number']]->setWtgStartup($machine['wtg_startup']);
                }

                $_SESSION["windFarms"][$windfarm]->setMachines($machines);
            }else{
                $_SESSION["windFarms"][$windfarm]->setMachines(null);
            }

            $conn->close();
        }

        $machines = array();
        $sm = $_SESSION["windFarms"][$windfarm]->getMachines();
        if (!empty($sm)){
            foreach ($sm as $machine){
                $machines['m'.$machine->getNumber()] = $machine->jsonSerialize();
            }
        }
        # Return machines data
        echo json_encode(['wf' =>  $_SESSION["windFarms"][$windfarm]->jsonSerialize(), 'machines' =>  $machines]);
        
        break;
    case 'getWfCells':
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $windfarm = $_POST['windFarm'];
            $sql = "SELECT * FROM cell where idwfarm = '".$windfarm."';";
            $result = $conn->query($sql);

            $cells = [];

            if($result->num_rows > 0){
                while ($cell = $result->fetch_assoc()) {
                    array_push($cells, $cell);
                }
            }

            $conn->close();

            echo json_encode(['cells' => $cells]);
        }
        break;
    case 'getWfTurbines':
        $windfarm = $_POST['windFarm'];
        $sql = "SELECT distinct(turbine_model) from cell where idwfarm = '".$windfarm."';";
        $result = $conn->query($sql);

        $turbines = [];

        if($result->num_rows > 0){
            while ($turbine = $result->fetch_assoc()) {
                array_push($turbines, $turbine);
            }
        }

        $conn->close();

        echo json_encode(['turbines' => $turbines, 'extremeReset' => $_SESSION["windFarms"][$windfarm]->getExtremeReset()]);
        
        break;
    case 'getModelComponents':
        $windfarm = $_POST['windFarm'];
        $model = $_POST['model'];
        $isCell = $_POST['isCell'];
        $sql = "";

        if($isCell == 'true'){
            $sql = "SELECT idcomponent, component.name, idwtgmodel, location FROM smartdata_app.component INNER JOIN cell ON component.idwtgmodel = cell.turbine_model WHERE cell.idcell = '".$model."' AND cell.idwfarm = '".$windfarm."' AND idcomponent != 'drive_t_brake' AND idcomponent != 'gearbox' order by idcomponent asc;";

            //$sql = "SELECT idcomponent, component.name, idwtgmodel, location FROM smartdata_app.component INNER JOIN cell ON component.idwtgmodel = cell.turbine_model WHERE cell.idcell = '".$model."' AND cell.idwfarm = '".$windfarm."' AND idcomponent != 'drive_t_brake' AND idcomponent != 'gearbox' AND idcomponent != 'root_j_bolts' AND idcomponent != 'foundation_j_bolts' AND idcomponent != 'tower_top_j_bolts' order by idcomponent asc;";
        }else{
            $sql = "SELECT idcomponent, name, idwtgmodel, location FROM smartdata_app.component WHERE idwtgmodel = '".$model."' AND idcomponent != 'drive_t_brake' AND idcomponent != 'gearbox' order by idcomponent asc;";

            //$sql = "SELECT idcomponent, name, idwtgmodel, location FROM smartdata_app.component WHERE idwtgmodel = '".$model."' AND idcomponent != 'drive_t_brake' AND idcomponent != 'gearbox' AND idcomponent != 'root_j_bolts' AND idcomponent != 'foundation_j_bolts' AND idcomponent != 'tower_top_j_bolts' order by idcomponent asc;";
        }
        $result = $conn->query($sql);

        $components = [];

        if($result->num_rows > 0){
            while ($component = $result->fetch_assoc()) {
                array_push($components, ['code' => $component['idcomponent'], 'name' => $component['name'], 'wtg_model' => $component['idwtgmodel'], 'location' => $component['location']]);
            }
        }

        $conn->close();

        echo json_encode(['components' => $components]);
        break;
    case 'setExtremeReset':
        $windfarm = $_POST['windFarm'];
        echo setExtremeReset($windfarm);
        break;
    case 'setExtremeStatus':
        $windfarm = $_POST['windFarm'];
        $machines = [];
        $machinesS = [];
        foreach($_SESSION["windFarms"][$windfarm]->getMachines() as $machine){
            $d = getMaxima($windfarm, $machine, $_SESSION["windFarms"][$windfarm]->getExtremeReset());

            switch($d){
                case 0:
                    $machine->setExtremeStatus("green");
                    break;
                case 1:
                    $machine->setExtremeStatus("yellow");
                    break;
                case 2:
                    $machine->setExtremeStatus("orange");
                    break;
                case 3:
                    $machine->setExtremeStatus("red");
                    break;
            }
            
            array_push($machines, $machine);
            array_push($machinesS, $machine->jsonSerialize());
        }
        $_SESSION["windFarms"][$windfarm]->setMachines($machines);

        echo json_encode(['machines' => $machinesS]);
        break;
    case 'getFatigueComponents':
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            # Get machine life data from precalculated data
            $windfarm = $_POST['windFarm'];
            $machine = $_POST['machine'];
            $turbineType = $_POST['turbineType'];
            if($turbineType == 'V9020'){
                $turbineType = 'V90 2.0';
            }
            
            $sql = "SELECT last_date, component, life.name, life.location, life.position, orden, MIN(expectancy) AS expectancy, installation, revision, oem, tts, tts_date, preventive, ndt FROM smartdata_calculed_data.life inner join smartdata_app.component on component.idcomponent = life.component and component.idwtgmodel = '".$turbineType."' WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine." AND rango = ".$_POST['range']." GROUP BY component ORDER BY orden;";
            
            $result = $conn->query($sql);
            $components = [];
            $lastDataDate = null;


            $sql_resert_fatigue = "SELECT idcomponent, installation_date, reset_fatigue FROM smartdata_client_2.component_installation_record WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$machine." AND reset_fatigue = 1;";
            $result_reset_fatigue = $conn->query($sql_resert_fatigue);


            $components_reset = [];
            if($result_reset_fatigue->num_rows > 0){
                while ($record = $result_reset_fatigue->fetch_assoc()) {
                    $components_reset[$record['idcomponent']] = $record['installation_date'];
                }
            }

            $currentDateOneYearLess = strtotime('-1 year', strtotime(date("Y-m-d")));
            if($result->num_rows > 0){
                while ($component = $result->fetch_assoc()) {
                    if($windfarm == 'OUROL'){
                        if($component['component'] == 'mounting'){
                            $mountingPos = count($components);
                        }
                        if($component['component'] == 'main_f'){
                            $main_fPos = count($components);
                        }
                    }
                    $reset_component = false;
                    $order = $component['orden'];
                    if($order == 999){ $order = null; }
                    if(in_array($component['component'], array_keys($components_reset))){
                        $newInstallDate = substr($components_reset[$component['component']],8,2)."-".substr($components_reset[$component['component']],5,2)."-".substr($components_reset[$component['component']],0,4);
                        if($currentDateOneYearLess > strtotime($newInstallDate)){
                            $reset_component = true;
                        }
                    }
                    $installation = substr($component['installation'],8,2)."-".substr($component['installation'],5,2)."-".substr($component['installation'],0,4);
                    $nc = new Component($component['component'],$component['name'],$component['location'],$component['position'],null,$order,null,$installation,null,null,null);
                    $tts_date = substr($component['tts_date'],8,2)."-".substr($component['tts_date'],5,2)."-".substr($component['tts_date'],0,4);
                    $nc->setFatigue([$component['expectancy'],$component['tts'],$tts_date,$component['preventive'],$component['ndt']]);
                    $revision = substr($component['revision'],8,2)."-".substr($component['revision'],5,2)."-".substr($component['revision'],0,4);
                    array_push($components, [$nc->jsonSerialize(),$component['oem'],$revision, $reset_component]);
                    date_default_timezone_set('UTC');
                    $time = strtotime($component['last_date']);
                    date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                    $lastDataDate = Date('Y-m-d', $time);
                }
            }

            if($windfarm == 'OUROL'){
                $components[$mountingPos][0]['fatigue'][0] = min($components[$mountingPos][0]['fatigue'][0], $components[$main_fPos][0]['fatigue'][0]);
                $components[$main_fPos][0]['fatigue'][0] = min($components[$mountingPos][0]['fatigue'][0], $components[$main_fPos][0]['fatigue'][0]);
            }
            $conn->close();
            $lastDataDate = substr($lastDataDate,8,2)."-".substr($lastDataDate,5,2)."-".substr($lastDataDate,0,4);
            $todayData = date("d-m-Y", time() - 86400);
            echo json_encode(['components' => $components, 'lastDataDate' => $lastDataDate, 'fatigueCalculatedOn' => $todayData]);
        }
        break;
    case 'getFatigeCalcs':
        $windfarm = $_POST['windFarm'];
        $component = $_POST['component'];
        $model = $_POST['model'];
        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());

        if($_POST['range'] == 0 || $_POST['range'] == 1){
            if($windfarm == 'OUROL' || $windfarm == 'CCROES'){
                $sql = "SELECT last_date, component, name, location, position, variable, wohler, last, past, rev, design, installation, rango, (SELECT name FROM smartdata_app.fatigue_variables WHERE idcomponent = '".$component."' AND fatigue_variables.variable_analytics = life.variable AND idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model."))) AS specific_name, expectancy FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$model." AND component = '".$component."' AND rango = ".$_POST['range']." ORDER BY orden, component, variable;";
            }
            else{
                $sql = "SELECT last_date, component, name, location, position, variable, wohler, last, past, rev, design, installation, rango, (SELECT name FROM smartdata_app.fatigue_variables WHERE idcomponent = '".$component."' AND fatigue_variables.variable = life.variable AND idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model."))) AS specific_name, expectancy FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$model." AND component = '".$component."' AND rango = ".$_POST['range']." ORDER BY orden, component, variable;";
            }
            if($windfarm == 'OUROL' && ($component == 'mounting' || $component == 'main_f')){
                $sql = "SELECT last_date, component, name, location, position, variable, wohler, last, past, rev, design, installation, rango, (SELECT name FROM smartdata_app.fatigue_variables WHERE (idcomponent = 'mounting' OR idcomponent = 'main_f') AND fatigue_variables.variable_analytics = life.variable AND idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model."))) AS specific_name, expectancy FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$model." AND (component = 'mounting' OR component = 'main_f') AND rango = ".$_POST['range']." ORDER BY orden, component, variable;";  
            }
        }else{
            if($windfarm == 'OUROL' || $windfarm == 'CCROES'){
                $sql = "SELECT last_date, component, name, location, position, variable, wohler, last, past, rev, design, installation, rango, (SELECT name FROM smartdata_app.fatigue_variables WHERE idcomponent = '".$component."' AND fatigue_variables.variable_analytics = life.variable AND idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model."))) AS specific_name, (SELECT min(expectancy) FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."'and idwfarm = '".$windfarm."' AND wtg = ".$model." AND component = '".$component."') AS expectancy FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$model." AND component = '".$component."' AND rango = 1 ORDER BY orden, component, variable;";
            }
            else{
                $sql = "SELECT last_date, component, name, location, position, variable, wohler, last, past, rev, design, installation, rango, (SELECT name FROM smartdata_app.fatigue_variables WHERE idcomponent = '".$component."' AND fatigue_variables.variable = life.variable AND idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model."))) AS specific_name, (SELECT min(expectancy) FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."'and idwfarm = '".$windfarm."' AND wtg = ".$model." AND component = '".$component."') AS expectancy FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$model." AND component = '".$component."' AND rango = 1 ORDER BY orden, component, variable;";
            }
            if($windfarm == 'OUROL' && ($component == 'mounting' || $component == 'main_f')){
                $sql = "SELECT last_date, component, name, location, position, variable, wohler, last, past, rev, design, installation, rango, (SELECT name FROM smartdata_app.fatigue_variables WHERE (idcomponent = 'mounting' OR idcomponent = 'main_f') AND fatigue_variables.variable_analytics = life.variable AND idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model."))) AS specific_name, (SELECT min(expectancy) FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."'and idwfarm = '".$windfarm."' AND wtg = ".$model." AND (component = 'mounting' OR component = 'main_f')) AS expectancy FROM smartdata_calculed_data.life WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$model." AND (component = 'mounting' OR component = 'main_f') AND rango = 1 ORDER BY orden, component, variable;";
            }
        }


        $sql_resert_fatigue = "SELECT idcomponent, installation_date, reset_fatigue FROM smartdata_client_2.component_installation_record WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model." AND reset_fatigue = 1;";
        $result_reset_fatigue = $conn->query($sql_resert_fatigue);


        $components_reset = [];
        if($result_reset_fatigue->num_rows > 0){
            while ($record = $result_reset_fatigue->fetch_assoc()) {
                $components_reset[$record['idcomponent']] = $record['installation_date'];
            }
        }

        $currentDateOneYearLess = strtotime('-1 year', strtotime(date("Y-m-d")));

        $components = [];
        $life = 40;
        $vars = [];
        $v = [];

        $result = $conn->query($sql);
        if($result->num_rows > 0){
            while ($component = $result->fetch_assoc()) {
                $reset_component = false;
                if(in_array($component['component'], array_keys($components_reset))){
                    $newInstallDate = substr($components_reset[$component['component']],8,2)."-".substr($components_reset[$component['component']],5,2)."-".substr($components_reset[$component['component']],0,4);
                    if($currentDateOneYearLess > strtotime($newInstallDate)){
                        $reset_component = true;
                    }
                }


                $componentDate = date_create_from_format('Y-m-d', date("Y-m-d",strtotime($component['installation'])));
                $currentDate = date_create_from_format('Y-m-d', date('Y-m-d'));
                $datediff = date_diff($currentDate, $componentDate)->days/365;

                if($component['expectancy'] < $life){
                    $life = $component['expectancy'];
                }

                $incremento = 0;
                $incremento2 = -20;
                $valores = [];

                if($datediff > 1){
                    if(!$reset_component && ($component['component'] != 'gearbox')){
                        if($_POST['range'] == 0){
                            while ($incremento <= 44){
                                $calc = pow( (pow($component['last'],$component['wohler']) + ($incremento/$datediff) * pow($component['last'],$component['wohler'])) , 1/$component['wohler']);
                                $calc = (($calc - $component['design']) / $component['design']) * 100;
                                array_push($valores, [$datediff + $incremento, $calc]);
                        
                                $incremento += 0.25;
                            }
                            $v[$component['variable']][$component['wohler']][$component['rango']] = [$component['specific_name'],$component['expectancy']];
                            $vars[$component['variable']][$component['wohler']] = [$v[$component['variable']][$component['wohler']],$valores];
    
                        }else if ($_POST['range'] == 1){
                            while ($incremento <= 44){
                                if($component['last'] != $component['past']){
                                    //echo $component['last']."||".$component['past']."||".$component['wohler']."||".$component['variable'];
                                    $calc = pow(pow($component['last'],$component['wohler']) + ($incremento * (pow($component['last'],$component['wohler']) - pow($component['past'],$component['wohler']))) , 1/$component['wohler']);
                                    $calc = (($calc - $component['design']) / $component['design']) * 100;
                                    array_push($valores, [$datediff + $incremento, $calc]);
                                }
        
                                $incremento += 0.25;
                            }
                            $v[$component['variable']][$component['wohler']][$component['rango']] = [$component['specific_name'],$component['expectancy']];
                            $vars[$component['variable']][$component['wohler']] = [$v[$component['variable']][$component['wohler']],$valores];
                        }else{
                            while ($incremento <= 44){
                                if($component['last'] != $component['past']){
                                    $calc = pow( (pow($component['last'],$component['wohler']) + ($incremento/$datediff) * pow($component['last'],$component['wohler'])) , 1/$component['wohler']);
                                    $calc = (($calc - $component['design']) / $component['design']) * 100;
                                    $calcAll = pow(pow($component['last'],$component['wohler']) + ($incremento * (pow($component['last'],$component['wohler']) - pow($component['past'],$component['wohler']))) , 1/$component['wohler']);
                                    $calcAll = (($calcAll - $component['design']) / $component['design']) * 100;
                                    array_push($valores, [$datediff + $incremento, $calc, $calcAll]);
                                }
        
                                $incremento += 0.25;
                            }
                            
                            $v[$component['variable']][$component['wohler']][$component['rango']] = [$component['specific_name'],$component['expectancy']];
                            $vars[$component['variable']][$component['wohler']] = [$v[$component['variable']][$component['wohler']],$valores];
                        }
                    }
                    else{
                        if ($_POST['range'] != 2){
                            while ($incremento <= 44){
                                array_push($valores, [$incremento, 0]);
                        
                                $incremento += 0.25;
                                $incremento2 += 0.25;
                            }
                        }
                        else{
                            while ($incremento <= 44){
                                array_push($valores, [$incremento, 0, 0]);
                        
                                $incremento += 0.25;
                                $incremento2 += 0.25;
                            }
                        }
                        $v[$component['variable']][$component['wohler']][$component['rango']] = [$component['specific_name'],$component['expectancy']];
                        $vars[$component['variable']][$component['wohler']] = [$v[$component['variable']][$component['wohler']],$valores];
                    }
                }
                else{
                    if ($_POST['range'] != 2){
                        while ($incremento <= 44){
                            array_push($valores, [$incremento, $incremento2]);
                    
                            $incremento += 0.25;
                            $incremento2 += 0.25;
                        }
                    }
                    else{
                        while ($incremento <= 44){
                            array_push($valores, [$incremento, $incremento2, $incremento2]);
                    
                            $incremento += 0.25;
                            $incremento2 += 0.25;
                        }
                    }
                    $v[$component['variable']][$component['wohler']][$component['rango']] = [$component['specific_name'],$component['expectancy']];
                    $vars[$component['variable']][$component['wohler']] = [$v[$component['variable']][$component['wohler']],$valores];
                }


                $nc = new Component($component['component'],$component['name'],null,null,null,null,[$component['variable'],$component['specific_name'],array_keys($vars[$component['variable']])],$component['installation'],null,null,null);
                $nc->setFatigue($vars[$component['variable']]);
                $components[$component['variable']] = $nc->jsonSerialize();
            }
        }

        $conn->close();
        echo json_encode(['calcs' => array_values($components), 'life' => $life, 'reset_fatigue' => $reset_component]);
        break;
    case 'getFatigeCalcsRange':
            $windfarm = $_POST['windFarm'];
            $component = $_POST['component'];
            $model = $_POST['model'];
            date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
            
            if($windfarm == 'OUROL' || $windfarm == 'CCROES'){
                $sql = "SELECT component.*, IFNULL(component.order, 999) AS 'nOrder', fatigue_variables.variable_analytics, fatigue_variables.name AS nombre, (SELECT CONCAT('[',GROUP_CONCAT(wohler_parameter),']') FROM smartdata_app.wohler_parameters WHERE idcomponent = component.idcomponent AND variable = fatigue_variables.variable AND idwtgmodel = component.idwtgmodel) AS m, wtg_component.component_installation_date FROM smartdata_app.component INNER JOIN smartdata_app.fatigue_variables ON fatigue_variables.idwtgmodel = component.idwtgmodel AND fatigue_variables.idcomponent = component.idcomponent INNER JOIN wtg_component ON wtg_component.idwfarm = '".$windfarm."' AND wtg_component.wtg_number = ".$model." AND wtg_component.component_id = component.idcomponent WHERE component.idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model.")) AND component.idcomponent = '".$component."' order by nOrder , component.idcomponent asc;";

            }
            else{
                $sql = "SELECT component.*, IFNULL(component.order, 999) AS 'nOrder', fatigue_variables.variable, fatigue_variables.name AS nombre, (SELECT CONCAT('[',GROUP_CONCAT(wohler_parameter),']') FROM smartdata_app.wohler_parameters WHERE idcomponent = component.idcomponent AND variable = fatigue_variables.variable AND idwtgmodel = component.idwtgmodel) AS m, wtg_component.component_installation_date FROM smartdata_app.component INNER JOIN smartdata_app.fatigue_variables ON fatigue_variables.idwtgmodel = component.idwtgmodel AND fatigue_variables.idcomponent = component.idcomponent INNER JOIN wtg_component ON wtg_component.idwfarm = '".$windfarm."' AND wtg_component.wtg_number = ".$model." AND wtg_component.component_id = component.idcomponent WHERE component.idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$model.")) AND component.idcomponent = '".$component."' order by nOrder , component.idcomponent asc;";
            }
            
            $result = $conn->query($sql);
    
            $components = [];
            $life = 0;
            $vars = [];
            $fatigueVals = getFatigueByRange($windfarm,$model,$_POST['strDate'],$_POST['fnlDate']);
    
            if($result->num_rows > 0){
                while ($component = $result->fetch_assoc()) {
                    if($windfarm == 'OUROL' || $windfarm == 'CCROES'){
                        $nc = new Component($component['idcomponent'],$component['name'],null,null,$component['src'],null,[$component['variable_analytics'],$component['nombre'],json_decode($component['m'])],$component['component_installation_date'],null,null,null);
                    }
                    else{
                        $nc = new Component($component['idcomponent'],$component['name'],null,null,$component['src'],null,[$component['variable'],$component['nombre'],json_decode($component['m'])],$component['component_installation_date'],null,null,null);
                    }
                    $nc->setFatigue(calcMachineFatigueRange($windfarm,$model,$component['idwtgmodel'],$nc,$fatigueVals));
                    array_push($components, $nc->jsonSerialize());
                }
            }
    
            $conn->close();
    
            echo json_encode(['calcs' => $components]);
            break;
    case 'getMaterials':
            $windfarm = $_POST['windFarm'];
            $machine = $_POST['machine'];
            $sql = "SELECT m, name FROM wtg_materials WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$machine.") order by 'order' asc;";
            
            $result = $conn->query($sql);
    
            $materials = [];
    
            if($result->num_rows > 0){
                while ($material = $result->fetch_assoc()) {
                    array_push($materials, ['m' => $material['m'], 'name' => $material['name']]);
                }
            }
    
            $conn->close();
    
            echo json_encode(['materials' => $materials]);
            break;
    case 'getExtremeComponents':
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $windfarm = $_POST['windFarm'];
            $machine = $_POST['machine'];

            $data = ['last_record' => null, 'data' => []];
            $acumulated_data = [];

            $sql = "SELECT name, component, src, location, position, positive, orden, MAX(day) AS maximo, last_date FROM smartdata_calculed_data.extreme WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine." GROUP BY positive,component ORDER BY orden;";
            $result = $conn->query($sql);

            if($result->num_rows > 0){
                while ($line = $result->fetch_assoc()) {
                    date_default_timezone_set('UTC');
                    $time = strtotime($line['last_date']);
                    date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                    $lastDataDate = Date('Y-m-d H:i', $time);
                    if($data['last_record'] < $lastDataDate)
                    $data['last_record'] = substr($lastDataDate,8,2)."-".substr($lastDataDate,5,2)."-".substr($lastDataDate,0,4)." ".substr($lastDataDate,11,5);
                    if($line['positive'] == 1){
                        $acumulated_data['data'][$line['component']]['dpv'] = $line['maximo'];
                    }else{
                        $acumulated_data['data'][$line['component']]['dnv'] = $line['maximo'];
                    }
                }
            }

            $sql = "SELECT name, component, src, location, position, positive, orden, MAX(month) AS maximo, day_date FROM smartdata_calculed_data.extreme WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine." GROUP BY positive,component ORDER BY orden;";
            $result = $conn->query($sql);

            if($result->num_rows > 0){
                while ($line = $result->fetch_assoc()) {
                    if($line['positive'] == 1){
                        $acumulated_data['data'][$line['component']]['mpv'] = $line['maximo'];
                    }else{
                        $acumulated_data['data'][$line['component']]['mnv'] = $line['maximo'];
                    }
                }
            }

            $sql = "SELECT name, component, src, location, position, positive, orden, MAX(three_months) AS maximo, week_date FROM smartdata_calculed_data.extreme WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine." GROUP BY positive,component ORDER BY orden;";
            $result = $conn->query($sql);

            if($result->num_rows > 0){
                while ($line = $result->fetch_assoc()) {
                    if($line['positive'] == 1){
                        $acumulated_data['data'][$line['component']]['tpv'] = $line['maximo'];
                    }else{
                        $acumulated_data['data'][$line['component']]['tnv'] = $line['maximo'];
                    }
                }
            }

            $sql = "SELECT name, component, src, location, position, positive, orden, MAX(six_months) AS maximo, week_date FROM smartdata_calculed_data.extreme WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine." GROUP BY positive,component ORDER BY orden;";
            $result = $conn->query($sql);

            if($result->num_rows > 0){
                while ($line = $result->fetch_assoc()) {
                    if($line['positive'] == 1){
                        $acumulated_data['data'][$line['component']]['spv'] = $line['maximo'];
                    }else{
                        $acumulated_data['data'][$line['component']]['snv'] = $line['maximo'];
                    }
                }
            }

            $sql = "SELECT name, component, src, location, position, positive, orden, MAX(twelve_months) AS maximo, month_date FROM smartdata_calculed_data.extreme WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine." GROUP BY positive,component ORDER BY orden;";
            $result = $conn->query($sql);

            if($result->num_rows > 0){
                while ($line = $result->fetch_assoc()) {
                    $order = $line['orden'];
                    if($order == 999){ $order = null; }
                    $nc = new Component($line['component'],$line['name'],$line['location'],$line['position'],$line['src'],$order,null,null,null,null,null);

                    if($line['positive'] == 1){
                        $acumulated_data['data'][$line['component']]['ypv'] = $line['maximo'];
                    }else{
                        $acumulated_data['data'][$line['component']]['ynv'] = $line['maximo'];
                    }

                    $nc->setExtreme($acumulated_data['data'][$line['component']]);
                    $data['data'][$line['component']] = $nc->jsonSerialize();
                    //array_push($data['data'], $nc->jsonSerialize());
                    //$data['data'][$line['component']] = $nc->jsonSerialize();
                }
            }
            
            $conn->close();
            echo json_encode(['data' => $data]);
        }
        break;
    case "getExtremeComponentsByComponent":
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $windfarm = $_POST['windFarm'];
            $machine = $_POST['machine'];

            $sql = "SELECT DISTINCTROW extreme.name, component, extreme.variable, extreme_variables.name AS 'specific_name', positive, last, last_date, day, day_date, week, week_date, month, month_date FROM smartdata_calculed_data.extreme LEFT JOIN smartdata_app.extreme_variables ON extreme_variables.idcomponent = component AND extreme_variables.variable = extreme.variable AND extreme_variables.idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$machine.")) WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine." AND component = '".$_POST['component']."';";
            
            $result = $conn->query($sql);
            $vars = [];
    
            if($result->num_rows > 0){
                while ($line = $result->fetch_assoc()) {
                    if($line['positive'] == 1){
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['last_date'],8,2)."-".substr($line['last_date'],5,2)."-".substr($line['last_date'],0,4)." ".substr($line['last_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['last'][0] = [$date,intval($line['last'])];
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['day_date'],8,2)."-".substr($line['day_date'],5,2)."-".substr($line['day_date'],0,4)." ".substr($line['day_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['day'][0] = [$date,intval($line['day'])];
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['week_date'],8,2)."-".substr($line['week_date'],5,2)."-".substr($line['week_date'],0,4)." ".substr($line['week_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['week'][0] = [$date,intval($line['week'])];
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['month_date'],8,2)."-".substr($line['month_date'],5,2)."-".substr($line['month_date'],0,4)." ".substr($line['month_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['month'][0] = [$date,intval($line['month'])];
                    }else{
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['last_date'],8,2)."-".substr($line['last_date'],5,2)."-".substr($line['last_date'],0,4)." ".substr($line['last_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['last'][1] = [$date,intval($line['last'])];
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['day_date'],8,2)."-".substr($line['day_date'],5,2)."-".substr($line['day_date'],0,4)." ".substr($line['day_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['day'][1] = [$date,intval($line['day'])];
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['week_date'],8,2)."-".substr($line['week_date'],5,2)."-".substr($line['week_date'],0,4)." ".substr($line['week_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['week'][1] = [$date,intval($line['week'])];
                        date_default_timezone_set('UTC');
                        $time = strtotime(substr($line['month_date'],8,2)."-".substr($line['month_date'],5,2)."-".substr($line['month_date'],0,4)." ".substr($line['month_date'],11,5));
                        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
                        $date = Date('Y-m-d H:i', $time);
                        $vars[$line['variable']]['month'][1] = [$date,intval($line['month'])];
                    }
                    $vars[$line['variable']]['name'] = $line['specific_name'];
                }
            }
            
            $conn->close();
            echo json_encode($vars);
        }
        break;
    case "getExtremeComponentsByDate":
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $windfarm = $_POST['windFarm'];
            $machine = $_POST['machine'];
            $startD = $_POST['startD'];
            $endD = $_POST['endD'];
            $turbineType = $_POST['turbineType'];
            date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
            if($turbineType == "V9020"){
                $turbineType = "V90 2.0";
            }

            $sql = "SELECT component.*, IFNULL(component.order, 999) AS 'nOrder', extreme_variables.variable, extreme_variables.name AS nombre, wtg_component.component_installation_date FROM smartdata_app.component INNER JOIN smartdata_app.extreme_variables ON extreme_variables.idwtgmodel = component.idwtgmodel AND extreme_variables.idcomponent = component.idcomponent INNER JOIN wtg_component ON wtg_component.idwfarm = '".$windfarm."' AND wtg_component.wtg_number = ".$machine." AND wtg_component.component_id = component.idcomponent WHERE component.idwtgmodel = '".$turbineType."' AND component.idcomponent = '".$_POST['component']."' order by nOrder , component.idcomponent asc;";

            $result = $conn->query($sql);
            $components = [];
            $comp = "";
            $turbine = "";
            $vars = [];
            $nc = new Component(null,null,null,null,null,null,null,null,null,null,null);
    
            if($result->num_rows > 0){
                while ($component = $result->fetch_assoc()) {
                    if($component['idcomponent'] != $comp && $comp != ""){
                        array_push($components, $nc->jsonSerialize());
                        $vars = [];
                    }
                    $comp = $component['idcomponent'];
                    $turbine = $component['idwtgmodel'];
                    $order = $component['nOrder'];
                    if($order == 999){ $order = null; }
                    array_push($vars, [$component['variable'],$component['name'],$component['nombre']]);
                    $nc = new Component($component['idcomponent'],$component['name'],$component['location'],$component['position'],$component['src'],$order,$vars,$component['component_installation_date'],null,null,null);
                }
            }
            
            $conn->close();
            calcMachineExtremeByDate($windfarm,$machine,$turbine,$nc,$startD,$endD);
        }
        break;
    case "getExtremeMachinesData":
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $windfarm = $_POST['windfarm'];
            $machines = $_POST['machines'];
            date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());

            $machineData = [];
            //$time_start0 = microtime(true); 
            //$machines = [[1,1],[2,1]];
            foreach ($machines as $machine){
                $machine_num = $machine['number'];
                
                $sql = "SELECT extreme.name, component, wtg, extreme.variable, extreme_variables.name AS 'specific_name', positive, last, last_date, day, day_date, week, week_date, month, month_date FROM smartdata_calculed_data.extreme LEFT JOIN smartdata_app.extreme_variables ON extreme_variables.idcomponent = component AND extreme_variables.variable = extreme.variable AND extreme_variables.idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg = ".$machine_num." AND wtg_number = wtg)) WHERE idclient = '".$idclient."' and idwfarm = '".$windfarm."' AND wtg = ".$machine_num." AND component = '".$_POST['component']."' ORDER BY variable, positive desc;";
                
                $result = $conn->query($sql);
                
                if($result->num_rows > 0){
                    $data = [];
                    while ($line = $result->fetch_assoc()) {
                        if($line['positive'] == 1){
                            $data[0][0][$line['variable']] = [$line['specific_name'],intval($line['last'])];
                            $data[0][1][$line['variable']] = [$line['specific_name'],intval($line['day'])];
                            $data[0][2][$line['variable']] = [$line['specific_name'],intval($line['week'])];
                            $data[0][3][$line['variable']] = [$line['specific_name'],intval($line['month'])];
                            $data[1][0][$line['variable']] = [null,null];
                            $data[1][1][$line['variable']] = [null,null];
                            $data[1][2][$line['variable']] = [null,null];
                            $data[1][3][$line['variable']] = [null,null];
                        }else{
                            $data[1][0][$line['variable']] = [$line['specific_name'],intval($line['last'])];
                            $data[1][1][$line['variable']] = [$line['specific_name'],intval($line['day'])];
                            $data[1][2][$line['variable']] = [$line['specific_name'],intval($line['week'])];
                            $data[1][3][$line['variable']] = [$line['specific_name'],intval($line['month'])];
                        }
                    }
                }
                //$time_start = microtime(true); 
                array_push($machineData, [$machine_num,$data]);
                //echo 'Total execution time in seconds: ' . (microtime(true) - $time_start)."\n";
            }

            $conn->close();
            //echo 'Total execution time in seconds: ' . (microtime(true) - $time_start0)."\n";
            echo json_encode(['data' => $machineData]);
        }
        break;
    case "getExtremeMachinesDataByDate":
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $windfarm = $_POST['windfarm'];
            $machines = $_POST['machines'];
            date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
            
            $machineData = [];
            
            //$machines = [[1,1]];
            foreach ($machines as $machine){
                $machine_num = $machine['number'];
                
                $sql = "SELECT component.*, IFNULL(component.order, 999) AS 'nOrder', extreme_variables.variable, extreme_variables.name AS nombre, wtg_component.component_installation_date FROM smartdata_app.component INNER JOIN smartdata_app.extreme_variables ON extreme_variables.idwtgmodel = component.idwtgmodel AND extreme_variables.idcomponent = component.idcomponent INNER JOIN wtg_component ON wtg_component.idwfarm = '".$windfarm."' AND wtg_component.wtg_number = ".$machine_num." AND wtg_component.component_id = component.idcomponent WHERE component.idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$windfarm."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$windfarm."' AND wtg_number = ".$machine_num.")) AND component.idcomponent = '".$_POST['component']."' order by nOrder , component.idcomponent asc;";

                $result = $conn->query($sql);
                $components = [];
                $comp = "";
                $vars = [];
                $nc = new Component(null,null,null,null,null,null,null,null,null,null,null);
                $cellmodel = "";
        
                if($result->num_rows > 0){
                    while ($component = $result->fetch_assoc()) {
                        if($component['idcomponent'] != $comp && $comp != ""){
                            array_push($components, $nc->jsonSerialize());
                            $vars = [];
                        }
                        $comp = $component['idcomponent'];
                        $order = $component['nOrder'];
                        if($order == 999){ $order = null; }
                        array_push($vars, [$component['variable'],$component['nombre']]);
                        $nc = new Component($component['idcomponent'],$component['name'],$component['location'],$component['position'],$component['src'],$order,$vars,$component['component_installation_date'],null,null,null);
                        $cellmodel = $component['idwtgmodel'];
                    }
                }

                array_push($machineData, [$machine_num,countMachineExtremeByDate($windfarm,$machine_num,$nc->getVars(),$cellmodel,$_POST['value'],$_POST['startDate'],$_POST['finalDate'],$nc)]);
            }

            $conn->close();
            echo json_encode(['data' => $machineData]);
        }
        break;
    case "getFatigueByMinutes":
        $windfarm = $_POST['windFarm'];
        $machine = $_POST['machine'];
        $fecha = $_POST['date'];
        $turbine = $_POST['turbine'];
        date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());

        if($turbine == 'V9020'){
            $turbine = 'V90 2.0';
        }

        $data = ['minutes' => [], 'design' => ['component' => null, 'bolts' => null]];

        include 'configMongo.php';
        $q = [
            '$and' => [
                [
                    'DateTime' => [
                        '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($fecha) * 1000)
                    ]
                    ],
                [
                    'DateTime' => [
                        '$lt' => new MongoDB\BSON\UTCDateTime(strtotime('+1 day', strtotime($fecha)) * 1000)
                    ]
                ]
            ]
        ];
    
        $o = [
            'sort' => [
                'DateTime' => 1
            ]
        ];
    
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_LCDetection', $query);
    
        foreach ($rows as $document) {
            if($document->dataType != 'fne'){
                $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
                $date = substr(date("Y-m-d H:i", ($a / 1000)), 0, 15);

                if (isset($data['minutes'][$date.'7'])){
                    $data['minutes'][$date.'3']['time'] = $date.'2';
                    $data['minutes'][$date.'7']['time'] = $date.'5';
                    $data['minutes'][$date.'2'] = $data['minutes'][$date.'3'];
                    $data['minutes'][$date.'5'] = $data['minutes'][$date.'7'];
                    if($windfarm != 'OUROL'){ //OUROL no tiene turbulencia
                        $data['minutes'][$date.'8'] = ['time' => $date.'8', 'status' => strtolower($document->status), 'windSector' => strtolower($document->windSector), 'speed' => $document->speed, 'turbulence' => $document->turbulence , 'yaw' => $document->yaw , 'density' => strtolower($document->density), 'valueN' => 0, 'valueP' => 0, 'design' => 1];
                    }
                    else{
                        $data['minutes'][$date.'8'] = ['time' => $date.'8', 'status' => strtolower($document->status), 'windSector' => strtolower($document->windSector), 'speed' => $document->speed, 'yaw' => $document->yaw , 'density' => strtolower($document->density), 'valueN' => 0, 'valueP' => 0, 'design' => 1];

                    }
                    unset($data['minutes'][$date.'3']);
                    unset($data['minutes'][$date.'7']);
                }else if(isset($data['minutes'][$date.'0'])){
                    $data['minutes'][$date.'0']['time'] = $date.'3';
                    $data['minutes'][$date.'3'] = $data['minutes'][$date.'0'];
                    if($windfarm != 'OUROL'){ //OUROL no tiene turbulencia
                        $data['minutes'][$date.'7'] = ['time' => $date.'7', 'status' => strtolower($document->status), 'windSector' => strtolower($document->windSector), 'speed' => $document->speed, 'turbulence' => $document->turbulence , 'yaw' => $document->yaw , 'density' => strtolower($document->density), 'valueN' => 0, 'valueP' => 0, 'design' => 1];
                    }
                    else{
                        $data['minutes'][$date.'7'] = ['time' => $date.'7', 'status' => strtolower($document->status), 'windSector' => strtolower($document->windSector), 'speed' => $document->speed, 'yaw' => $document->yaw , 'density' => strtolower($document->density), 'valueN' => 0, 'valueP' => 0, 'design' => 1];
                    }
                    unset($data['minutes'][$date.'0']);
                }else{
                    if($windfarm != 'OUROL'){ //OUROL no tiene turbulencia
                        $data['minutes'][date("Y-m-d H:i", ($a / 1000))] = ['time' => date("Y-m-d H:i", ($a / 1000) ), 'status' => strtolower($document->status), 'windSector' => strtolower($document->windSector), 'speed' => $document->speed, 'turbulence' => $document->turbulence , 'yaw' => $document->yaw , 'density' => strtolower($document->density), 'valueN' => 0, 'valueP' => 0, 'design' => 1];                    }
                    else{
                        $data['minutes'][date("Y-m-d H:i", ($a / 1000))] = ['time' => date("Y-m-d H:i", ($a / 1000) ), 'status' => strtolower($document->status), 'windSector' => strtolower($document->windSector), 'speed' => $document->speed, 'yaw' => $document->yaw , 'density' => strtolower($document->density), 'valueN' => 0, 'valueP' => 0, 'design' => 1];                    }
                }
                
            }
        }

/*         $q = [
            '_id' => 'v20210831_rflw'
        ];

        if($windfarm == 'CCROES'){
            $q = [
                '_id' => 'v20221024_rflw'
            ];
        }
        if($windfarm == 'OUROL'){
            $q = [
                '_id' => 'v20220712_rflw'
            ];
        }
        if($turbine == 'GE1.5 T64.7'){
            $q = [
                '_id' => 'v20221219_rflw'
            ];
        } */


        $filter = [];
        $options = ['sort' => ['_id' => 1]];
        // Query Class
        $query = new MongoDB\Driver\Query($filter, $options);
        // Output of the executeQuery will be object of MongoDB\Driver\Cursor class
        $cursor = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach($cursor as $document){
            $doc = (array)$document;
            if(substr((string)$doc['_id'],10,4) == "xtr"){
                $idXtr = (string) $doc['_id'];
            }
            if (substr((string)$doc['_id'],10,4) == "rflw"){
                $idRflw = (string) $doc['_id'];
            }
        }
        
        $q = [
            '_id' => $idRflw
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['component'] = $document;
        }
        
        $q = [
            '_id' => 'v2021831_rflw_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['bolts'] = $document;
        }

        //var_dump($_SESSION["windFarms"][$windfarm]->getMachines());
        getFatigueByMinutes($windfarm,$machine,$_SESSION["windFarms"][$windfarm]->getMachines()[$machine]->getCell(),$data,$_POST['component'],$_POST['variable'],$_POST['wohler']);
        break;
    case 'getPerformanceCalcsByDate':
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } else {
            $windfarm = $_POST['windFarm'];
            $wtg = $_POST['machine'];
            $startdate = $_POST['startdate'];
            $finaldate = $_POST['finaldate'];
            date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());

            include 'configMongo.php';
            if($startdate != null && $finaldate != null){
                $q = [
                    '$and' => [
                        [
                            'DateTime' => [
                                '$lte' => new MongoDB\BSON\UTCDateTime(strtotime($finaldate) * 1000)
                            ]
                        ],
                        [
                            'DateTime' => [
                                '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($startdate) * 1000)
                            ]
                        ]
                    ]
                ];
            }else{
                $q = [];
            }
            
            $o = [
                'projection' => [
                    'DateTime' => '$DateTime',
                    'WndSpd' => '$WndSpd',
                    'Power' => '$Power',
                    'RotSpd' => '$RotSpd',
                    'i-spin_WndSpd' => '$i-spin_WndSpd',
                    'i-spin_RotSpd' => '$i-spin_RotSpd',
                    '_id' => 0
                ],
                'sort' => [
                    'DateTime' => 1
                ]
            ];

            $oDetection = [
                'projection' => [
                    'DateTime' => '$DateTime',
                    'status' => '$status',
                    '_id' => 0
                ],
                'sort' => [
                    'DateTime' => 1
                ]
            ];

            if($startdate == null || $finaldate == null){
                $o['sort'] = ['DateTime' => -1];
                $o['limit'] = 4464;
            }

            $machines = [];
            if($wtg != null){
                foreach ($_SESSION["windFarms"][$windfarm]->getMachines() as $machine){
                    if($machine->getNumber() == $wtg['wtg_number']){
                        array_push($machines, $machine);
                    }
                }
            }else{
                $machines = $_SESSION["windFarms"][$windfarm]->getMachines();
            }
            
            $compData = [];
            
            foreach($machines as $machine){
                $data = ['power' => [], 'rotorSpeed' => [], 'windSpeed' => [], 'wsDistribution' => [], 'original' => ['power' => [[],[]], 'rotorSpeed' => [[],[]]]];
                $query = new MongoDB\Driver\Query($q, $o);
                $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine->getNumber().'_SCADA', $query);
                $queryDetection = new MongoDB\Driver\Query($q, $oDetection);
                $rowsDetection   = $mogoconn->executeQuery($windfarm.'.'.$machine->getNumber().'_LCDetection', $queryDetection);
                foreach ($rows as $document) {
                    $document = json_decode(json_encode($document), true);
                    $arrayRows[$document['DateTime']['$date']['$numberLong']] = $document;     
                }
                foreach($rowsDetection as $documentDetection){
                    $documentDetection = json_decode(json_encode($documentDetection), true);
                    if(array_key_exists('status', $documentDetection)){
                        if($documentDetection['status'] == 'PP'){
                            $arrayDatesDetection[] = $documentDetection['DateTime']['$date']['$numberLong'];
                        }
                    }
                }
                foreach($arrayDatesDetection as $date){
                    if(array_key_exists($date, $arrayRows)){
                        $document = $arrayRows[$date];
                        if($document['WndSpd'] != ""){
                            array_push($data['original']['power'][0], '{"x": '.$document['WndSpd'].',"y": '.$document['Power'].'}');
                            if($windfarm != 'OUROL' && $windfarm != 'CCROES'){
                                array_push($data['original']['rotorSpeed'][0], '{"x": '.$document['RotSpd'].',"y": '.$document['Power'].'}');
                            }

                            if(isset($document['i-spin_WndSpd']) && $document['i-spin_WndSpd'] != ''){
                                $document['WndSpd'] = $document['i-spin_WndSpd'];
                                array_push($data['original']['power'][1], '{"x": '.$document['i-spin_WndSpd'].',"y": '.$document['Power'].'}');
                            }
                            if(isset($document['i-spin_RotSpd']) && $document['i-spin_RotSpd'] != ''){
                                $document['RotSpd'] = $document['i-spin_RotSpd'];
                                array_push($data['original']['rotorSpeed'][1], '{"x": '.$document['i-spin_RotSpd'].',"y": '.$document['Power'].'}');
                            }
                            array_push($data['power'], '{"x": '.$document['WndSpd'].',"y": '.$document['Power'].'}');
                            if($windfarm != 'OUROL' && $windfarm != 'CCROES'){
                            array_push($data['rotorSpeed'], '{"x": '.$document['RotSpd'].',"y": '.$document['Power'].'}');
                            }
                            array_push($data['windSpeed'], '{"x": "'.date("Y-m-d H:i", ($document['DateTime']['$date']['$numberLong'] / 1000) ).'","y": '.$document['WndSpd'].'}');
                            if(!isset($data['wsDistribution'][round($document['WndSpd'])])){
                                $data['wsDistribution'][round($document['WndSpd'])] = 1;
                            }else{
                                $data['wsDistribution'][round($document['WndSpd'])] += 1;
                            }
                        }
                    }
                } 

                array_push($compData, ['windfarm' => $windfarm, 'machine' => $machine->getNumber(), 'comp' => 'original_power', 'name' => 'Power Curve', 'values' => $data['original']['power'], 'avg' => []]);
                array_push($compData, ['windfarm' => $windfarm, 'machine' => $machine->getNumber(), 'comp' => 'original_rotorSpeed', 'name' => 'Angular rotor Speed', 'values' => $data['original']['rotorSpeed'], 'avg' => []]);
                array_push($compData, ['windfarm' => $windfarm, 'machine' => $machine->getNumber(), 'comp' => 'power', 'name' => 'Power Curve', 'values' => $data['power'], 'avg' => []]);
                array_push($compData, ['windfarm' => $windfarm, 'machine' => $machine->getNumber(), 'comp' => 'rotorSpeed', 'name' => 'Angular rotor Speed', 'values' => $data['rotorSpeed'], 'avg' => []]);
                array_push($compData, ['windfarm' => $windfarm, 'machine' => $machine->getNumber(), 'comp' => 'wsDistribution', 'name' => 'Wind Speed Distibution', 'values' => $data['wsDistribution']]);
                array_push($compData, ['windfarm' => $windfarm, 'machine' => $machine->getNumber(), 'comp' => 'windSpeed', 'name' => 'Wind Speed', 'values' => $data['windSpeed']]);
            }

            $conn->close();
            echo json_encode($compData);
        }
        break;
    case 'getComponentPreventive':
        $component = $_POST['component'];
        $sql = "SELECT * FROM smartdata_app.generic_component_preventive WHERE idComponent = '".$component."' order by type, orden;";
        $result = $conn->query($sql);

        $preventives = [];

        if($result->num_rows > 0){
            while ($preventive = $result->fetch_assoc()) {
                array_push($preventives, $preventive);
            }
        }

        $conn->close();

        echo json_encode($preventives);
        break;
    case 'getAlertsCalcs':
        $windfarm = $_POST['windFarm'];
        $date = $_POST['date'];
        $wtg = $_POST['wtg'];
        $model = $_POST['model'];
        $type = $_POST['type'];
        $all = $_POST['all'];

        if($windfarm != null && $windfarm != "999"){
            date_default_timezone_set($_SESSION["windFarms"][$windfarm]->getTimeZone());
        }

        $sql = "SELECT * FROM smartdata_calculed_data.alerts";

        $where = "";
        if($windfarm != "999"){
            if($where == ""){
                $where .= " WHERE idwfarm = '" . $windfarm . "'";
            }else{
                $where .= " AND idwfarm = '" . $windfarm . "'";
            }
        }

        if($date != "999"){
            $d = date('Y-m-d');
            switch($date){
                case 'last':
                    $d = date('Y-m-d',strtotime('-1 day'));
                    break;
                case 'week':
                    $d = date('Y-m-d',strtotime('-1 week'));
                    break;
                case 'month':
                    $d = date('Y-m-d',strtotime('-1 months'));
                    break;
                case 'month3':
                    $d = date('Y-m-d',strtotime('-3 months'));
                    break;
                default:
                    $d = $date;
                    break;
            }

            if($where == ""){
                $where .= " WHERE datetime >= '" . $d . "'";
            }else{
                $where .= " AND datetime >= '" . $d . "'";
            }
        }

        if($wtg != "999"){
            if($where == ""){
                $where .= " WHERE wtg = " . $wtg;
            }else{
                $where .= " AND wtg = " . $wtg;
            }
        }

        if($model != "999"){
            if($where == ""){
                $where .= " WHERE model = '" . $model . "'";
            }else{
                $where .= " AND model = '" . $model . "'";
            }
        }

        if($type != "999"){
            if($where == ""){
                $where .= " WHERE type = '" . $type . "'";
            }else{
                $where .= " AND type = '" . $type . "'";
            }
        }

        if($where == ""){
            $where .= " WHERE idclient = " . $idclient;
        }else{
            $where .= " AND idclient = " . $idclient;
        }

        if($all != ''){
            $where .= " AND status = '" . $all . "'";
        }

        $sql .= $where . " order by new DESC;";

        $result = $conn->query($sql);

        $alerts = [];
        if($result && $result->num_rows > 0){
            while ($alert = $result->fetch_assoc()) {
                array_push($alerts, $alert);
            }
        }
        
        $conn->close();
        echo json_encode($alerts);

        break;

    case 'cleanNewAlert':
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } 
        else{            
            $idalert = $_POST['idalert'];
            $sql = "UPDATE smartdata_calculed_data.alerts SET new = 0 where idalert = " . $idalert. " and new = 1;";
            $result = $conn->query($sql);

            $conn->close();
            echo json_encode('ok');
        }
        break;

    case 'alertAction':
        $action = $_POST['action'];
        $idalert = intVal($_POST['idalert']);
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } 
        else{            
            
            $sql = "UPDATE smartdata_calculed_data.alerts SET status = '" . $action . "' where idalert = " . $idalert . ";";
            $result = $conn->query($sql);

            $conn->close();
            echo json_encode($result);
        }
        break;
    case 'getComponentInstallationsRecord':
        $windfarm = $_POST['windFarm'];
        $wtg = $_POST['wtg'];
        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } 
        else{            
            
            $sql = "SELECT wtg_startup FROM smartdata_client_2.wtg WHERE wtg_number = ".$wtg." AND idwfarm = '".$windfarm."';";
            
            $result = $conn->query($sql);

            while ($row = $result->fetch_assoc()) {
                $wtg_startup = $row['wtg_startup'];
            }
            
            $sql = "SELECT * FROM smartdata_client_2.component_installation_record WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "';";
            $result = $conn->query($sql);

            $records = [];
            
            if($result->num_rows > 0){
                while ($record = $result->fetch_assoc()) {
                    if (!array_key_exists($record['idcomponent'], $records)){
                        $records[$record['idcomponent']] = [];
                    }
                    array_push($records[$record['idcomponent']], $record['installation_date']);
                }
            }
    
            $conn->close();
        }
            
        echo json_encode([$records, $wtg_startup]);
        break;

    case 'addComponentInstallationDate':
        $windfarm = $_POST['windFarm'];
        $wtg = $_POST['wtg'];
        $component = $_POST['component'];
        $date = $_POST['date'];
        $email = $_SESSION["credentials"]->getEmail();
        $inserted= False;

        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } 
        else{            
            
            if(str_contains($component, 'bld')){
                $component = 'bld_%';
            }

            $sql = "SELECT * FROM smartdata_client_2.component_installation_record WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and idcomponent like '" . $component . "';";
            $result = $conn->query($sql);

            $dates = [];
            

            while($record = mysqli_fetch_array($result))
            {
                $dates[] = $record['installation_date'];
                $components[] = $record['idcomponent'];
            }
            
            if(!in_array($date, $dates)){
                if($date > max($dates)){
                    $reset = 1;
                    $sql = "UPDATE smartdata_client_2.component_installation_record SET reset_fatigue = 0 WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and idcomponent like '" . $component . "' and reset_fatigue = '" . $reset . "';";
                    $result = $conn->query($sql);
                }
                else{$reset = 0;}
                $currentDate = date('Y-m-d H:i:s');
                if($component == 'bld_%'){
                    foreach($components as $bladeComponent){
                        $sql = "INSERT INTO smartdata_client_2.component_installation_record VALUES ('" . $windfarm . "', '" . $wtg . "', '" . $bladeComponent . "', '" . $date . "', '" . $email . "', '" . $currentDate . "', '" . $reset . "');";
                        $inserted = $conn->query($sql);
                    }
                }
                else{
                    $sql = "INSERT INTO smartdata_client_2.component_installation_record VALUES ('" . $windfarm . "', '" . $wtg . "', '" . $component . "', '" . $date . "', '" . $email . "', '" . $currentDate . "', '" . $reset . "');";
                    $inserted = $conn->query($sql);
                }

                $currentDate = strtotime('-1 year', strtotime(date("Y-m-d")));
                if($inserted && $reset){
                    if($currentDate < strtotime($date)){
                        $sql = "UPDATE smartdata_calculed_data.life SET expectancy = 20 WHERE idclient = '" . $idclient . "' and idwfarm = '" . $windfarm . "' and wtg = '" . $wtg . "' and component like '" . $component . "';";
                        $conn->query($sql);
                    }
/*                     $sql = "UPDATE smartdata_client_2.wtg_component SET component_installation_date = '" . $date . "' WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and component_id = '" . $component . "';";
                    $conn->query($sql); */

                    $sql = "UPDATE smartdata_calculed_data.life SET installation = '" . $date . "' WHERE idclient = '" . $idclient . "' and idwfarm = '" . $windfarm . "' and wtg = '" . $wtg . "' and component like '" . $component . "';";
                    $conn->query($sql);
                }
            }
            $conn->close();
        }
/*         if($inserted){
            sendComponentEmail($email, $windfarm, $wtg, $component, $date);
        } */
        echo json_encode($inserted);
        break;

    case 'removeComponentInstallationDate':
        $windfarm = $_POST['windFarm'];
        $wtg = $_POST['wtg'];
        $component = $_POST['component'];
        $date = $_POST['date'];
        $email = $_SESSION["credentials"]->getEmail();
        $deleted= False;

        if ($conn->connect_error) {
            echo json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
        } 
        else{            
            
            if(str_contains($component, 'bld')){
                $component = 'bld_%';
            }

            $sql = "SELECT * FROM smartdata_client_2.component_installation_record WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and idcomponent like '" . $component . "';";
            $result = $conn->query($sql);

            $dates = [];
            

            while($record = mysqli_fetch_array($result))
            {
                $dates[] = $record['installation_date'];
                $components[] = $record['idcomponent'];
            }
            
            if($date == max($dates) && count($dates) > 1){
                $reset = 1;
                while(($key = array_search($date, $dates)) !== false) {
                    unset($dates[$key]);
                }
                $newDate = max($dates);
                $sql = "DELETE FROM smartdata_client_2.component_installation_record WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and idcomponent like '" . $component . "' and installation_date = '" . $date . "';";
                $deleted = $conn->query($sql);

/*                 $sql = "SELECT * FROM smartdata_client_2.wtg_component WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and component_id = '" . $component . "' and component_installation_date = '" . $newDate . "';";
                $result = $conn->query($sql);
                
                if($result->num_rows == 0){
                } */
                
                $sql = "UPDATE smartdata_client_2.component_installation_record SET reset_fatigue = 1 WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and idcomponent like '" . $component . "' and installation_date = '" . $newDate . "';";
                $deleted = $conn->query($sql);

                $currentDate = strtotime('-1 year', strtotime(date("Y-m-d")));
                if($currentDate < strtotime($newDate)){
                    $sql = "UPDATE smartdata_calculed_data.life SET expectancy = 20 WHERE idclient = '" . $idclient . "' and idwfarm = '" . $windfarm . "' and wtg = '" . $wtg . "' and component like '" . $component . "';";
                    $conn->query($sql);
                }

                $sql = "UPDATE smartdata_calculed_data.life SET installation = '" . $newDate . "' WHERE idclient = '" . $idclient . "' and idwfarm = '" . $windfarm . "' and wtg = '" . $wtg . "' and component like '" . $component . "';";
                $conn->query($sql);
            }
            else{            
                $sql = "DELETE FROM smartdata_client_2.component_installation_record WHERE idwfarm = '" . $windfarm . "' and wtg_number = '" . $wtg . "' and idcomponent like '" . $component . "' and installation_date = '" . $date . "';";
                $deleted = $conn->query($sql);
                if (($key = array_search($date, $dates)) !== false) {
                    unset($dates[$key]);
                }
            }


            $conn->close();
        }

        echo json_encode(['deleted' => $deleted, 'count' => count($dates)]);
        break;
}

function cmp($a, $b) {
    return strcmp($a['comp'], $b['comp']);
}

function getMaxima($windfarm, $machine, $date){
    $number = $machine->getNumber();
    if($machine->getNumber() < 10){
        $number = '0'.$machine->getNumber();
    }
    $date = new DateTime($date);
    include 'configMongo.php';

    $q = [
        'windfarm' => $windfarm,
        'wtg' => $number,
        'range' => 4,
        'datetime' => [
            '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y H:m')) * 1000)
        ]
    ];
    
    $o = [
        'sort' => [
            'datetime' => -1
        ],
        'limit' => 1
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery('Visualizacion_ejecutiva1.visualizacion_ejecutiva_data', $query);

    $past = "";
    foreach ($rows as $document) {
        $past = $document;
    }

    $q = [
        'windfarm' => $windfarm,
        'wtg' => $number,
        'range' => 4
    ];
    
    $o = [
        'sort' => [
            'datetime' => 1
        ],
        'limit' => 1
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery('Visualizacion_ejecutiva1.visualizacion_ejecutiva_data', $query);

    $last = "";
    foreach ($rows as $document) {
        $last = $document;
    }

    if(isset($past->extreme_events)) {
        if($last->extreme_events[4] > $past->extreme_events[4]){
            return 3;
        }else if($last->extreme_events[3] > $past->extreme_events[3]){
            return 2;
        }else if($last->extreme_events[2] > $past->extreme_events[2]){
            return 1;
        }else{
            return 0;
        }
    }else{
        return 0;
    }
}

function setExtremeReset($windfarm){
    include 'config.php';
    if ($conn->connect_error) {
        return json_encode(['access' => false, 'message' => 'Could not connect to the database', 'url' => null]);
    } else {
        $minutes = substr(date('i'), 0, 1)."0";
        $date = date('Y-m-d H:').$minutes;

        $sql = "UPDATE wind_farm SET extremeReset = '".$date."' WHERE idwfarm = '".$windfarm."';";
        //echo $sql;
        $conn->query($sql);

        $_SESSION["windFarms"][$windfarm]->setExtremeReset($date);

        return json_encode(['extremeReset' =>  $_SESSION["windFarms"][$windfarm]->getExtremeReset()]);
    }
}

function calcMachineFatigue($windfarm,$machine,$turbine,$range,$component,$designTts,$lastRevision){
    $lastDataDate = date("Y-m-").(date("d")-2);
    $wollerPositions = [4 => 0, 5 => 1, 7 => 2, 8 => 3, 9 => 4, 10 => 5, 14 => 6];
    $data = ['last' => null, 'past' => null, 'design' => ['component' => null, 'bolts' => null]];
    $componentDate = date_create_from_format('Y-m-d', date("Y-m-d",strtotime($component->getInstalldate())));
    $currentDate = date_create_from_format('Y-m-d', date('Y-m-d'));
    $datediff = date_diff($currentDate, $componentDate)->days/365;

    include 'configMongo.php';
    /*$q = [
        'accumulatedEst_fatigue' => [
            '$ne' => NULL
        ]
    ];*/

    $q = [
        'accumulatedEst_fatigue' => [
            '$ne' => NULL
        ],
        'accumulatedBoltsEst_fatigue' => [
            '$ne' => NULL
        ]
    ];

    /*$o = [
        'projection' => [
            '_id' => '$_id',
            'accumulatedEst_fatigue' => '$accumulatedEst_fatigue'
        ],
        'sort' => [
            '_id' => -1
        ],
        'limit' => 1
    ];*/

    $o = [
        'projection' => [
            '_id' => '$_id',
            'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
            'accumulatedBoltsEst_fatigue' => '$accumulatedBoltsEst_fatigue'
        ],
        'sort' => [
            '_id' => -1
        ],
        'limit' => 1
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Fatigue', $query);
    foreach ($rows as $document) {
        $t = json_decode(json_encode($document), true)['_id'];
        $a = json_decode(str_replace('$','',json_encode($t)))->date->numberLong;
        $lastDataDate = date("d-m-Y", ($a / 1000) );
        //var_dump($document);
        $document = json_decode(json_encode($document), true);
        unset($document["_id"]);
        unset($document["notas"]);
        $data['last'] = $document;
    }

    if(!isset($_SESSION['fatigueData']) || $_SESSION['fatigueData']['windFarm'] != $windfarm || $_SESSION['fatigueData']['machine'] != $machine || !isset($_SESSION['fatigueData']['data']) || $_SESSION['fatigueData']['data']['last'] == null || $_SESSION['fatigueData']['data']['past'] == null || $_SESSION['fatigueData']['data']['revision'] == null || $_SESSION['fatigueData']['data']['design'] == null){
        $_SESSION['fatigueData']['windFarm'] = $windfarm;
        $_SESSION['fatigueData']['machine'] = $machine;

        $date=date('Y-m-d', strtotime('-1 year'));
        $date = new DateTime($date);
        $date->modify('+1 day');
        $q = [
            '_id' => [
                '$lte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)
            ]
        ];

        /*$o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];*/

        $o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                'accumulatedBoltsEst_fatigue' => '$accumulatedBoltsEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Fatigue', $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['past'] = $document;
        }
        
        $q = [
            '_id' => [
                '$lte' => new MongoDB\BSON\UTCDateTime(strtotime($lastRevision) * 1000)
            ]
        ];

        /*$o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];*/

        $o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                'accumulatedBoltsEst_fatigue' => '$accumulatedBoltsEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Fatigue', $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['revision'] = $document;
        }

        $q = [
            '_id' => 'v20210831_rflw'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['component'] = $document;
        }

        $q = [
            '_id' => 'v2021831_rflw_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['bolts'] = $document;
        }

        $_SESSION['fatigueData']['data'] = $data;
    }
    
    $fatigueVal = 40;
    $tts = 20;
    $date1 = date_create_from_format('Y-m-d', $lastRevision);
    //echo $component->getComponent()."||".$lastRevision."\n";
    $date2 = date_create_from_format('Y-m-d', date('Y-m-d'));
    $diff = (array) date_diff($date1, $date2);
    $ddiff = round($diff['y'] + ($diff['m'] * 100 / 12) / 100, 1);
    foreach ($component->getVars() as $var){
        foreach($var[1] as $woller){
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                if($woller == 3){
                    $valDesign = $_SESSION['fatigueData']['data']['design']['bolts'][$var[0]][0];
                    $valLast = $_SESSION['fatigueData']['data']['last']['accumulatedBoltsEst_fatigue'][$var[0]][0];
                    $valRevision = $_SESSION['fatigueData']['data']['revision']['accumulatedBoltsEst_fatigue'][$var[0]][0];
                }else{
                    $valDesign = $_SESSION['fatigueData']['data']['design']['bolts'][$var[0]][1];
                    $valLast = $_SESSION['fatigueData']['data']['last']['accumulatedBoltsEst_fatigue'][$var[0]][1];
                    $valRevision = $_SESSION['fatigueData']['data']['revision']['accumulatedBoltsEst_fatigue'][$var[0]][1];
                }
            }else{
                $valDesign = $_SESSION['fatigueData']['data']['design']['component'][$var[0]][$wollerPositions[$woller]];
                $valLast = $_SESSION['fatigueData']['data']['last']['accumulatedEst_fatigue'][$var[0]][$wollerPositions[$woller]];
                $valRevision = $_SESSION['fatigueData']['data']['revision']['accumulatedEst_fatigue'][$var[0]][$wollerPositions[$woller]];
            }

            $calc = 0;

            if($range == 0 || $datediff < 1){
                $calc = ( ( pow($valDesign,$woller)/pow($valLast,$woller) ) * $datediff );
            }else{
                if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                    if($woller == 3){
                        $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedBoltsEst_fatigue'][$var[0]][0];
                    }else{
                        $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedBoltsEst_fatigue'][$var[0]][1];
                    }
                }else{
                    $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedEst_fatigue'][$var[0]][$wollerPositions[$woller]];
                }
                if($valLast == $valRevision){
                    $calc = $fatigueVal;
                }else{
                    $calc = ( ( (pow($valDesign,$woller)-pow($valPast,$woller))/(pow($valLast,$woller)-pow($valPast,$woller)) ) * 1 + ($datediff - 1) );
                }
                //echo $component->getComponent()."||".$valDesign."||".$valLast."||".$valPast."\n";
            }
            
            if($calc < $fatigueVal){
                $fatigueVal = $calc;
            }

            $fda = $valDesign * pow(($designTts/20), (1/$woller));
            $fdpr = pow((pow($valRevision,$woller) + pow($fda,$woller)),(1/$woller));
            if($valLast == $valRevision){
                $ftts = $tts;
            }else{
                $ftts = ((pow($fdpr,$woller) - pow($valRevision,$woller))/(pow($valLast,$woller) - pow($valRevision,$woller))) * $ddiff;
            }
            if($ftts < $tts){
                $tts = $ftts;
            }

            //echo "Var:".$var[0]."||Design:".$valDesign."||Last:".$valLast."||Past:".$valPast."||Woller:".$woller."||Datediff:".$datediff."||Sol:".$calc."\n";
        }
    }

    if($fatigueVal > 40){
        $fatigueVal = 40;
    }else{
        $fatigueVal = round($fatigueVal, 1);
    }

    if($tts > 2*$designTts){
        $tts = 2*$designTts;
    }else{
        $tts = round($tts, 1);
    }

    $ttdate=date('d-m-Y', strtotime($lastRevision));
    $ttdate = new DateTime($ttdate);
    $ttdate->modify('+'.intval($tts * 365).' day');

    return [$fatigueVal,$lastDataDate,$tts,$ttdate];
}

function calcMachineFatigueCont($windfarm,$machine,$turbine,$range,$component){
    $wollerPositions = [4 => 0, 5 => 1, 7 => 2, 8 => 3, 9 => 4, 10 => 5, 14 => 6];
    $data = ['last' => null, 'past' => null, 'design' => ['component' => null, 'bolts' => null]];
    $componentDate = date_create_from_format('Y-m-d', date("Y-m-d",strtotime($component->getInstalldate())));
    $currentDate = date_create_from_format('Y-m-d', date('Y-m-d'));
    $datediff = date_diff($currentDate, $componentDate)->days/365;

    if(!isset($_SESSION['fatigueData']) || $_SESSION['fatigueData']['windFarm'] != $windfarm || $_SESSION['fatigueData']['machine'] != $machine || !isset($_SESSION['fatigueData']['data']) || $_SESSION['fatigueData']['data']['last'] == null || $_SESSION['fatigueData']['data']['past'] == null || $_SESSION['fatigueData']['data']['design'] == null){
        $_SESSION['fatigueData']['windFarm'] = $windfarm;
        $_SESSION['fatigueData']['machine'] = $machine;

        include 'configMongo.php';
        $q = [
            'accumulatedEst_fatigue' => [
                '$ne' => NULL
            ]
        ];

        /*$o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];*/

        $o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                'accumulatedBoltsEst_fatigue' => '$accumulatedBoltsEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Fatigue', $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['last'] = $document;
        }

        $date=date('d-m-Y', strtotime('-1 year'));
        $date = new DateTime($date);
        $date->modify('+1 day');
        $q = [
            '_id' => [
                '$lte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)
            ]
        ];

        /*$o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];*/

        $o = [
            'projection' => [
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                'accumulatedBoltsEst_fatigue' => '$accumulatedBoltsEst_fatigue',
                '_id' => 0
            ],
            'sort' => [
                '_id' => -1
            ],
            'limit' => 1
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Fatigue', $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['past'] = $document;
        }

        $q = [
            '_id' => 'v20210831_rflw'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['component'] = $document;
        }

        $q = [
            '_id' => 'v2021831_rflw_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['bolts'] = $document;
        }

        $_SESSION['fatigueData']['data'] = $data;
    }
    
    $fatigueVal = [];
    $lifeVar = [0,-100];
    $life = [40,-100];
    foreach($component->getVars()[2] as $woller){
        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
            if($woller == 3){
                $valDesign = $_SESSION['fatigueData']['data']['design']['bolts'][$component->getVars()[0]][0];
                $valLast = $_SESSION['fatigueData']['data']['last']['accumulatedBoltsEst_fatigue'][$component->getVars()[0]][0];
            }else{
                $valDesign = $_SESSION['fatigueData']['data']['design']['bolts'][$component->getVars()[0]][1];
                $valLast = $_SESSION['fatigueData']['data']['last']['accumulatedBoltsEst_fatigue'][$component->getVars()[0]][1];
            }
        }else{
            $valDesign = $_SESSION['fatigueData']['data']['design']['component'][$component->getVars()[0]][$wollerPositions[$woller]];
            $valLast = $_SESSION['fatigueData']['data']['last']['accumulatedEst_fatigue'][$component->getVars()[0]][$wollerPositions[$woller]];
        }
        $incremento = 0;
        $valores = [];

        if($range == 0 || $datediff < 1){
            while ($incremento <= 44){
                $calc = pow( (pow($valLast,$woller) + ($incremento/$datediff) * pow($valLast,$woller)) , 1/$woller);
                //echo "W:".$woller."||Last:".$valLast."||Past:||Design:".$valDesign."||Calc:".$calc."\n";
                $calc = (($calc - $valDesign) / $valDesign) * 100;
                array_push($valores, [$datediff + $incremento, $calc]);

                if($calc < 0 && $calc > $lifeVar[1]){
                    $lifeVar = [$datediff + $incremento,$calc];
                }

                $incremento += 0.25;
            }
        }else if ($range == 1){
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                if($woller == 3){
                    $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedBoltsEst_fatigue'][$component->getVars()[0]][0];
                }else{
                    $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedBoltsEst_fatigue'][$component->getVars()[0]][1];
                }
            }else{
                $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedEst_fatigue'][$component->getVars()[0]][$wollerPositions[$woller]];
            }
            while ($incremento <= 44){
                if($valLast != $valPast){
                    $calc = pow(pow($valLast,$woller) + ($incremento * (pow($valLast,$woller) - pow($valPast,$woller))) , 1/$woller);
                    //echo "W:".$woller."||Last:".$valLast."||Past:".$valPast."||Design:".$valDesign."||Calc:".$calc."\n";
                    $calc = (($calc - $valDesign) / $valDesign) * 100;
                    array_push($valores, [$datediff + $incremento, $calc]);
    
                    if($calc < 0 && $calc > $lifeVar[1]){
                        $lifeVar = [$datediff + $incremento,$calc];
                    }
                }

                $incremento += 0.25;
            }
        }else{
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                if($woller == 3){
                    $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedBoltsEst_fatigue'][$component->getVars()[0]][0];
                }else{
                    $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedBoltsEst_fatigue'][$component->getVars()[0]][1];
                }
            }else{
                $valPast = $_SESSION['fatigueData']['data']['past']['accumulatedEst_fatigue'][$component->getVars()[0]][$wollerPositions[$woller]];
            }
            while ($incremento <= 44){
                if($valLast != $valPast){
                    $calc = pow(pow($valLast,$woller) + ($incremento * (pow($valLast,$woller) - pow($valPast,$woller))) , 1/$woller);
                    $calc = (($calc - $valDesign) / $valDesign) * 100;
                    $calcAll = pow( (pow($valLast,$woller) + ($incremento/$datediff) * pow($valLast,$woller)) , 1/$woller);
                    $calcAll = (($calcAll - $valDesign) / $valDesign) * 100;
                    array_push($valores, [$datediff + $incremento, $calc, $calcAll]);
    
                    if($calc < 0 && $calc > $lifeVar[1]){
                        $lifeVar = [$datediff + $incremento,$calc];
                    }
                    if($calcAll < 0 && $calcAll > $lifeVar[1]){
                        $lifeVar = [$datediff + $incremento,$calcAll];
                    }
                }

                $incremento += 0.25;
            }
        }

        $fatigueVal[$woller] = $valores;
        if($lifeVar[0] < $life[0]){
            $life = $lifeVar;
        }
    }

    if($life[0] > 40){
        $life[0] = 40;
    }else{
        $life[0] = round($life[0], 1);
    }
    
    return [$life[0],$fatigueVal];
}

function calcMachineFatigueRange($windfarm,$machine,$turbine,$component,$fatigueData){
    $wollerPositions = [4 => 0, 5 => 1, 7 => 2, 8 => 3, 9 => 4, 10 => 5, 14 => 6];
    $data = ['last' => null, 'past' => null, 'design' => ['component' => null, 'bolts' => null]];
    
    if(!isset($_SESSION['fatigueData']) || $_SESSION['fatigueData']['windFarm'] != $windfarm || $_SESSION['fatigueData']['machine'] != $machine || !isset($_SESSION['fatigueData']['data']) || $_SESSION['fatigueData']['data']['design'] == null){
        $_SESSION['fatigueData']['windFarm'] = $windfarm;
        $_SESSION['fatigueData']['machine'] = $machine;

        include 'configMongo.php';
/*         $q = [
            '_id' => 'v20210831_rflw'
        ];
        if($windfarm == 'CCROES'){
            $q = [
                '_id' => 'v20221024_rflw'
            ];
        }
        if($windfarm == 'OUROL'){
            $q = [
                '_id' => 'v20220712_rflw'
            ];
        }
        if($turbine == 'GE1.5 T64.7'){
            $q = [
                '_id' => 'v20221219_rflw'
            ];
        } */


        $filter = [];
        $options = ['sort' => ['_id' => 1]];
        // Query Class
        $query = new MongoDB\Driver\Query($filter, $options);
        // Output of the executeQuery will be object of MongoDB\Driver\Cursor class
        $cursor = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach($cursor as $document){
            $doc = (array)$document;
            if(substr((string)$doc['_id'],10,4) == "xtr"){
                $idXtr = (string) $doc['_id'];
            }
            if (substr((string)$doc['_id'],10,4) == "rflw"){
                $idRflw = (string) $doc['_id'];
            }
        }
        
        $q = [
            '_id' => $idRflw
        ];
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['component'] = $document;
        }

        $q = [
            '_id' => 'v2021831_rflw_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['bolts'] = $document;
        }
        $_SESSION['fatigueData']['data'] = $data;
    }
    
    $fatigueValsByDay = [];
    foreach($component->getVars()[2] as $woller){
        $fatigueVals = [];
        foreach($fatigueData as $data){
            if(isset($data["dailyEst_fatigue"])){
                if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts' && ($windfarm != 'CCROES' && $windfarm != 'OUROL')){
                    if(isset($data["dailyBoltsEst_fatigue"][$component->getVars()[0]])){
                        if($woller == 3){
                            $valDesign = $_SESSION['fatigueData']['data']['design']['component'][$component->getVars()[0]][0] * pow(((1/365.25)/20), 1/$woller);
                            $valDaily = $data["dailyBoltsEst_fatigue"][$component->getVars()[0]][0];
                        }else{
                            $valDesign = $_SESSION['fatigueData']['data']['design']['component'][$component->getVars()[0]][1] * pow(((1/365.25)/20), 1/$woller);
                            $valDaily = $data["dailyBoltsEst_fatigue"][$component->getVars()[0]][1];
                        }
                    }else{
                        $valDaily = null;
                    }
                }else{
                    if(isset($data["dailyEst_fatigue"][$component->getVars()[0]])){
                        $valDesign = $_SESSION['fatigueData']['data']['design']['component'][$component->getVars()[0]][$wollerPositions[$woller]] * pow(((1/365.25)/20), 1/$woller);
                        $valDaily = $data["dailyEst_fatigue"][$component->getVars()[0]][$wollerPositions[$woller]];
                    }else{
                        $valDaily = null;
                    }
                }

                if($valDaily != null){
                    $a = json_decode(str_replace('$','',json_encode($data["_id"])))->date->numberLong;
                    $valDaily = $valDaily / $valDesign * 100;
                    array_push($fatigueVals, [date("Y-m-d", ($a / 1000) ), $valDaily]);
                }
            
            }
        }
        if(count($fatigueVals) > 0){
            array_push($fatigueValsByDay, [$woller, $fatigueVals]);
        }
    }
    
    return $fatigueValsByDay;
}

function getFatigueByRange($windfarm,$machine,$strDate,$fnlDate){
    include 'configMongo.php';
    $q = [
        '$and' => [
            [
                '_id' => [
                    '$lte' => new MongoDB\BSON\UTCDateTime(strtotime($fnlDate) * 1000)
                ]
            ],
            [
                '_id' => [
                    '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($strDate) * 1000)
                ]
            ]
        ]
    ];

    /*$o = [
        'projection' => [
            '_id' => '$_id',
            'dailyEst_fatigue' => '$dailyEst_fatigue'
        ]
    ];*/

    $o = [
        'projection' => [
            '_id' => '$_id',
            'dailyEst_fatigue' => '$dailyEst_fatigue',
            'dailyBoltsEst_fatigue' => '$dailyBoltsEst_fatigue'
        ]
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Fatigue', $query);

    $data = [];
    foreach ($rows as $document) {
        $document = json_decode(json_encode($document), true);
        unset($document["notas"]);
        array_push($data, $document);
    }
    return $data;
}

function calcMachineExtreme($windfarm,$machine,$turbine,$component){
    $wollerPositions = [4 => 0, 5 => 1, 7 => 2, 8 => 3, 9 => 4, 10 => 5, 14 => 6];
    $data = ['last' => null, 'month' => null, 'design' => ['component' => null, 'bolts' => null]];
    $componentDate = date_create_from_format('Y-m-d', date("Y-m-d",strtotime($component->getInstalldate())));
    $currentDate = date_create_from_format('Y-m-d', date('Y-m-d'));
    $datediff = date_diff($currentDate, $componentDate)->days/365;

    //echo var_dump($_SESSION['extremeData']['data']['last']);
    if(!isset($_SESSION['extremeData']) || $_SESSION['extremeData']['windFarm'] != $windfarm || $_SESSION['extremeData']['machine'] != $machine || !isset($_SESSION['extremeData']['data']) || $_SESSION['extremeData']['data']['last'] == null || $_SESSION['extremeData']['data']['last'][1] == null || $_SESSION['extremeData']['data']['month'] == null || $_SESSION['extremeData']['data']['design'] == null){
    //if(true){
        $_SESSION['extremeData']['windFarm'] = $windfarm;
        $_SESSION['extremeData']['machine'] = $machine;

        $lastDate = null;

        include 'configMongo.php';
        /*$q = [
            'extreme_data' => [
                '$ne' => NULL
            ]
        ];*/

        $q = [
            'extreme_data' => [
                '$ne' => NULL
            ],
            'extreme_data_bolts' => [
                '$ne' => NULL
            ]
        ];

        /*$o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => -1
            ],
            'limit' => 1
        ];*/

        $o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                'extreme_data_bolts' => '$extreme_data_bolts',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => -1
            ],
            'limit' => 1
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
        
        foreach ($rows as $document) {
            $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
            $data['last'] = [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data, $document->extreme_data_bolts];
            //$data['last'] = [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data];
            $lastDate = date("d-m-Y H:i", ($a / 1000) );
        }
        
        $date=date('d-m-Y', strtotime('-4 week', strtotime($lastDate)));
        $date = new DateTime($date);
        $q = [
            'DateTime' => [
                '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)
            ]
        ];

        /*$o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => 1
            ]
        ];*/

        $o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                'extreme_data_bolts' => '$extreme_data_bolts',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => 1
            ]
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
        
        $monthVals = [];
        foreach ($rows as $document) {
            $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
            //echo date("d-m-Y H:i", ($a / 1000) )."\n";
            //var_dump(date("d-m-Y H:i", ($a / 1000) )."\n");
            array_push($monthVals, [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data, $document->extreme_data_bolts]);
            //echo var_dump($document->extreme_data_bolts);
            //array_push($monthVals, [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data]);
        }
        
        $data['month'] = $monthVals;

        $q = [
            '_id' => 'v20210831_xtr'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['component'] = $document;
        }
        
        $q = [
            '_id' => 'v20210831_xtr_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['bolts'] = $document;
        }
        $_SESSION['extremeData']['data'] = $data;
    }
    
    $fatigueVal = 0;

    $nnvars = ['var42','var44','var45','var46','var47','var48','var49','var50','var51','var52','var53'];
    $values = ['lpv' => null, 'lnv' => null, 'dpv' => null, 'dnv' => null, 'wpv' => null, 'wnv' => null, 'mpv' => null, 'mnv' => null];
    
    $dataDates = [$_SESSION['extremeData']['data']['last'][0],[null,null],[null,null],[null,null]];
    foreach ($component->getVars() as $var){
        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
            $valDesign = $_SESSION['extremeData']['data']['design']['bolts'][$var];
            $valLast = ((array) $_SESSION['extremeData']['data']['last'][2])[$var];
            //echo $component->getComponent()."||".$var."||".$valDesign[0]."||".$valLast[0]."\n";
        }else{
            $valDesign = $_SESSION['extremeData']['data']['design']['component'][$var];
            $valLast = ((array) $_SESSION['extremeData']['data']['last'][1])[$var];
        }
        $calcPos = $valLast[0] * 100 / $valDesign[0];

        if($valLast[1] * $valDesign[1] > 0){
            $calcNeg = abs($valLast[1]) * 100 / abs($valDesign[1]);
        }else{
            $calcNeg = 0;
        }

        if($values['lpv'] == null || $values['lpv'] < $calcPos){
            $values['lpv'] = $calcPos;
        }
        if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || (!in_array($var, $nnvars) && ($values['lnv'] == null || $values['lpv'] < $calcNeg))){
            $values['lnv'] = $calcNeg;
        }
    }
    
    foreach ($_SESSION['extremeData']['data']['month'] as $day){
        foreach ($component->getVars() as $var){
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                $valDesign = $_SESSION['extremeData']['data']['design']['bolts'][$var];
                $valLast = ((array) $day[2])[$var];
            }else{
                $valDesign = $_SESSION['extremeData']['data']['design']['component'][$var];
                $valLast = ((array) $day[1])[$var];
            }
            
            $calcPos = $valLast[0] * 100 / $valDesign[0];

            if($valLast[1] * $valDesign[1] > 0){
                $calcNeg = abs($valLast[1]) * 100 / abs($valDesign[1]);
            }else{
                $calcNeg = 0;
            }
    
            $date=date('d-m-Y', strtotime('-1 day', strtotime($_SESSION['extremeData']['data']['last'][0])));
            if(strtotime($day[0]) > strtotime($date)){
                if($values['dpv'] == null || $values['dpv'] < $calcPos){
                    $dataDates[1][0] = $day[0];
                    $values['dpv'] = $calcPos;
                }
                if(($values['dnv'] == null || $values['dnv'] < $calcNeg) && (($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var, $nnvars))){
                    $dataDates[1][0] = $day[1];
                    $values['dnv'] = $calcNeg;
                }
            }

            $date=date('d-m-Y', strtotime('-1 week', strtotime($_SESSION['extremeData']['data']['last'][0])));
            if(strtotime($day[0]) > strtotime($date)){
                if($values['wpv'] == null || $values['wpv'] < $calcPos){
                    $dataDates[2][0] = $day[0];
                    $values['wpv'] = $calcPos;
                }
                if(($values['wnv'] == null || $values['wnv'] < $calcNeg) && (($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var, $nnvars))){
                    $dataDates[2][1] = $day[0];
                    $values['wnv'] = $calcNeg;
                }
            }

            if($values['mpv'] == null || $values['mpv'] < $calcPos){
                $dataDates[3][0] = $day[0];
                $values['mpv'] = $calcPos;
            }
            if(($values['mnv'] == null || $values['mnv'] < $calcNeg) && (($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var, $nnvars))){
                $dataDates[3][1] = $day[0];
                $values['mnv'] = $calcNeg;
            }
        }
    }
    
    $values['lpv'] = round($values['lpv']);
    $values['dpv'] = round($values['dpv']);
    $values['wpv'] = round($values['wpv']);
    $values['mpv'] = round($values['mpv']);

    if($values['lpv'] < 0){
        $values['lpv'] = 0;
    }
    if($values['dpv'] < 0){
        $values['dpv'] = 0;
    }
    if($values['wpv'] < 0){
        $values['wpv'] = 0;
    }
    if($values['mpv'] < 0){
        $values['mpv'] = 0;
    }
    
    if($values['lnv'] != null){
        $values['lnv'] = round($values['lnv']);
    }
    if($values['lnv'] < 0){
        $values['lnv'] = 0;
    }
    if($values['dnv'] != null){
        $values['dnv'] = round($values['dnv']);
    }
    if($values['dnv'] < 0){
        $values['dnv'] = 0;
    }
    if($values['wnv'] != null){
        $values['wnv'] = round($values['wnv']);
    }
    if($values['wnv'] < 0){
        $values['wnv'] = 0;
    }
    if($values['mnv'] != null){
        $values['mnv'] = round($values['mnv']);
    }
    if($values['mnv'] < 0){
        $values['mnv'] = 0;
    }

    return [$dataDates,$values];
}

function calcMachineExtremeByDate($windfarm,$machine,$turbine,$component,$startD,$endD){
    include 'configMongo.php';
    
    $q = [
        '$and' => [
            [
                'DateTime' => [
                    '$gt' => new MongoDB\BSON\UTCDateTime(strtotime($startD) * 1000)
                ]
            ],
            [
                'DateTime' => [
                    '$lt' => new MongoDB\BSON\UTCDateTime(strtotime($endD) * 1000)
                ]
            ]
        ]
    ];

    /*$o = [
        'projection' => [
            'DateTime' => '$DateTime',
            'extreme_data' => '$extreme_data',
            '_id' => 0
        ],
        'sort' => [
            'DateTime' => 1
        ]
    ];*/

    $o = [
        'projection' => [
            'DateTime' => '$DateTime',
            'loadCase' => '$loadCase',
            'extreme_data' => '$extreme_data',
            'extreme_data_bolts' => '$extreme_data_bolts',
            '_id' => 0
        ],
        'sort' => [
            'DateTime' => 1
        ]
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
    $monthVals = [];
    foreach ($rows as $document) {
        $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
        //echo date("d-m-Y H:i", ($a / 1000) );
        //echo "\n";
        if($windfarm != 'CCROES' && $windfarm != 'OUROL'){
            array_push($monthVals, [date("Y-m-d H:i", ($a / 1000) ), json_encode($document->extreme_data), json_encode($document->extreme_data_bolts), $document->loadCase]);

        }
        else{
            array_push($monthVals, [date("Y-m-d H:i", ($a / 1000) ), json_encode($document->extreme_data), $document->loadCase]);
        }
        //var_dump($document->extreme_data);
        //array_push($monthVals, [date("d-m-Y H:i", ($a / 1000) ), json_encode($document->extreme_data)]);
        //echo count($monthVals);
        //echo "\n";
    }
    
    $design = ['component' => null, 'bolts' => null];

    $q = [
        '_id' => 'v20210831_xtr'
    ];

    if($windfarm == 'CCROES' || $windfarm == 'OUROL'){
        $q = [
            '_id' => 'v20221128_xtr'
        ];
    }
    
    $o = [];
    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
    $design = [];
    foreach ($rows as $document) {
        $document = json_decode(json_encode($document), true);
        unset($document["_id"]);
        unset($document["notas"]);
        $design['component'] = $document;
    }
    
    $q = [
        '_id' => 'v20210831_xtr_bolts'
    ];
    
    $o = [];
    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
    foreach ($rows as $document) {
        $document = json_decode(json_encode($document), true);
        unset($document["_id"]);
        unset($document["notas"]);
        $design['bolts'] = $document;
    }

    $nnvars = ['var42','var44','var45','var46','var47','var48','var49','var50','var51','var52','var53'];
    $varsData = [];
    foreach ($monthVals as $day){
        $d = json_decode($day[1]);
        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
            $d = json_decode($day[2]);
        }
        
        foreach ($component->getVars() as $var){
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                $valDesign = $design['bolts'][$var[0]];
                $valLast = ((array) $d)[$var[0]];
            }else{
                $valDesign = $design['component'][$var[0]];
                $valLast = ((array) $d)[$var[0]];
            }
            $calcPos = $valLast[0] * 100 / $valDesign[0];
            if($calcPos < 0){
                $calcPos = 0;
            }

            if($valLast[1] * $valDesign[1] > 0){
                $calcNeg = abs($valLast[1]) * 100 / abs($valDesign[1]);
            }else{
                $calcNeg = 0;
            }

            if (!isset($varsData[$var[0]])) {
                $varsData[$var[0]] = [[$var[1],$var[2]], []];
            }
            if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0], $nnvars)){
                if($windfarm != 'CCROES' && $windfarm != 'OUROL'){
                    array_push($varsData[$var[0]][1], [$day[0], $calcPos, $calcNeg, $day[3]]);
                }
                else{
                    array_push($varsData[$var[0]][1], [$day[0], $calcPos, $calcNeg, $day[2]]);
                }
            }else{
                if($windfarm != 'CCROES' && $windfarm != 'OUROL'){
                    array_push($varsData[$var[0]][1], [$day[0], $calcPos, null, $day[3]]);
                }
                else{
                    array_push($varsData[$var[0]][1], [$day[0], $calcPos, null, $day[2]]);
                }
            }
        }
    }
    //echo json_encode(['data' =>  $varsData]);
    echo json_encode($varsData);
}

function calcMachineExtremeByComponent($windfarm,$machine,$turbine,$component){
    $data = ['last' => null, 'month' => null, 'design' => ['component' => null, 'bolts' => null]];

    //echo var_dump($_SESSION['extremeData']['data']['last']);
    if($_SESSION['extremeData'] == null){
        $_SESSION['extremeData']['windFarm'] = $windfarm;
        $_SESSION['extremeData']['machine'] = $machine;

        $lastDate = null;

        include 'configMongo.php';
        /*$q = [
            'extreme_data' => [
                '$ne' => NULL
            ]
        ];*/

        $q = [
            'extreme_data' => [
                '$ne' => NULL
            ],
            'extreme_data_bolts' => [
                '$ne' => NULL
            ]
        ];

        /*$o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => -1
            ],
            'limit' => 1
        ];*/

        $o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                'extreme_data_bolts' => '$extreme_data_bolts',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => -1
            ],
            'limit' => 1
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
        
        foreach ($rows as $document) {
            $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
            $data['last'] = [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data, $document->extreme_data_bolts];
            //$data['last'] = [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data];
            $lastDate = date("d-m-Y H:i", ($a / 1000) );
        }

        $date=date('d-m-Y', strtotime('-1 month', strtotime($lastDate)));
        $date = new DateTime($date);
        $q = [
            'DateTime' => [
                '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)
            ]
        ];

        /*$o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => 1
            ]
        ];*/

        $o = [
            'projection' => [
                'DateTime' => '$DateTime',
                'extreme_data' => '$extreme_data',
                'extreme_data_bolts' => '$extreme_data_bolts',
                '_id' => 0
            ],
            'sort' => [
                'DateTime' => 1
            ]
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
        $monthVals = [];
        foreach ($rows as $document) {
            $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
            //var_dump(date("d-m-Y H:i", ($a / 1000) )."\n");
            array_push($monthVals, [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data, $document->extreme_data_bolts]);
            //array_push($monthVals, [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data]);
        }
        
        $data['month'] = $monthVals;

        $q = [
            '_id' => 'v20210831_xtr'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['component'] = $document;
        }

        $q = [
            '_id' => 'v2021831_xtr_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$turbine, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['design']['bolts'] = $document;
        }

        $_SESSION['extremeData']['data'] = $data;
    }

    $nnvars = ['var42','var44','var45','var46','var47','var48','var49','var50','var51','var52','var53'];

    $data = [];
    
    foreach ($component->getVars() as $var){
        $data[$var[0]]['name'] = $var[1];

        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
            $valDesign = $_SESSION['extremeData']['data']['design']['bolts'][$var[0]];
            $valLast = ((array) $_SESSION['extremeData']['data']['last'][2])[$var[0]];
            //echo $component->getComponent()."||".$var."||".$valDesign[0]."||".$valLast[0]."\n";
        }else{
            $valDesign = $_SESSION['extremeData']['data']['design']['component'][$var[0]];
            $valLast = ((array) $_SESSION['extremeData']['data']['last'][1])[$var[0]];
        }
        $calcPos = $valLast[0] * 100 / $valDesign[0];
        
        //echo $_SESSION['extremeData']['data']['last'][0]."||".$valLast[0]."||".$valDesign[0]."\n";
        if($calcPos < 0){
            $calcPos = 0;
        }

        if($valLast[1] * $valDesign[1] > 0){
            $calcNeg = abs($valLast[1]) * 100 / abs($valDesign[1]);
        }else{
            $calcNeg = 0;
        }

        if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || (!in_array($var[0], $nnvars))){
            $data[$var[0]]['last'] = [[$_SESSION['extremeData']['data']['last'][0],$calcPos],[$_SESSION['extremeData']['data']['last'][0],$calcNeg]];
        }else{
            $data[$var[0]]['last'] = [[$_SESSION['extremeData']['data']['last'][0],$calcPos],null];
        }
    }
    
    foreach ($_SESSION['extremeData']['data']['month'] as $day){
        foreach ($component->getVars() as $var){
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                $valDesign = $_SESSION['extremeData']['data']['design']['bolts'][$var[0]];
                $valLast = ((array) $day[2])[$var[0]];
            }else{
                $valDesign = $_SESSION['extremeData']['data']['design']['component'][$var[0]];
                $valLast = ((array) $day[1])[$var[0]];
            }
            $calcPos = $valLast[0] * 100 / $valDesign[0];
            if($calcPos < 0){
                $calcPos = 0;
            }

            if($valLast[1] * $valDesign[1] > 0){
                $calcNeg = abs($valLast[1]) * 100 / abs($valDesign[1]);
            }else{
                $calcNeg = 0;
            }
    
            $date=date('d-m-Y', strtotime('-1 day', strtotime($_SESSION['extremeData']['data']['last'][0])));
            if(strtotime($day[0]) > strtotime($date)){
                if(!isset($data[$var[0]]['day']) || $data[$var[0]]['day'][0][1] < $calcPos){
                    $data[$var[0]]['day'][0] = [$day[0],$calcPos];
                }
                if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0], $nnvars)){
                    if(!isset($data[$var[0]]['day'][1]) || $data[$var[0]]['day'][1][1] < $calcNeg){
                        $data[$var[0]]['day'][1] = [$day[0],$calcNeg];
                    }
                }else{
                    $data[$var[0]]['day'][1] = null;
                }
            }

            $date=date('d-m-Y', strtotime('-1 week', strtotime($_SESSION['extremeData']['data']['last'][0])));
            if(strtotime($day[0]) > strtotime($date)){
                if(!isset($data[$var[0]]['week']) || $data[$var[0]]['week'][0][1] < $calcPos){
                    $data[$var[0]]['week'][0] = [$day[0],$calcPos];
                }
                if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0], $nnvars)){
                    if(!isset($data[$var[0]]['week'][1]) || $data[$var[0]]['week'][1][1] < $calcNeg){
                        $data[$var[0]]['week'][1] = [$day[0],$calcNeg];
                    }
                }else{
                    $data[$var[0]]['week'][1] = null;
                }
            }

            if(!isset($data[$var[0]]['month']) || $data[$var[0]]['month'][0][1] < $calcPos){
                $data[$var[0]]['month'][0] = [$day[0],$calcPos];
            }
            if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0], $nnvars)){
                if(!isset($data[$var[0]]['month'][1]) || $data[$var[0]]['month'][1][1] < $calcNeg){
                    $data[$var[0]]['month'][1] = [$day[0],$calcNeg];
                }
            }else{
                $data[$var[0]]['month'][1] = null;
            }
        }
    }
    
    //echo json_encode(['data' =>  $varsData]);
    echo json_encode($data);
}

function countMachineExtreme($windfarm,$machine,$vars,$cellmodel,$component){
    $nnvars = ['var42','var44','var45','var46','var47','var48','var49','var50','var51','var52','var53'];

    include 'configMongo.php';

    if(!isset($_SESSION['extremeData']) || !isset($_SESSION['extremeData']['windFarm']) || $_SESSION['extremeData']['windFarm'] != $windfarm || !isset($_SESSION['extremeData']['machine']) || $_SESSION['extremeData']['machine'] != $machine || !isset($_SESSION['extremeData']['data']) || $_SESSION['extremeData']['data']['design'] == null){
        $q = [
            '_id' => 'v20210831_xtr'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$cellmodel, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $_SESSION['extremeData']['data']['design']['component'] = $document;
        }

        $q = [
            '_id' => 'v2021831_xtr_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$cellmodel, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $_SESSION['extremeData']['data']['design']['bolts'] = $document;
        }
    }

    $date = date("d-m-Y", strtotime("- 1 month"));

    $q = [];

    $o = [];

    foreach($vars as $var){
        $o['projection']['extreme_data.'.$var[0]] = '$extreme_data.'.$var[0];
        $o['projection']['extreme_data_bolts.'.$var[0]] = '$extreme_data_bolts.'.$var[0];
    }

    $o['projection']['DateTime'] = '$DateTime';
    $o['projection']['_id'] = 0;

    $o2 = $o;
    $o2['sort']['DateTime'] = -1;
    $o2['limit'] = 1;

    $query = new MongoDB\Driver\Query($q, $o2);
    $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);

    $lastP = [];
    $lastN = null;
    $dayP = [];
    $dayN = null;
    $weekP = [];
    $weekN = null;
    $monthP = [];
    $monthN = null;

    $date = 0;
    foreach ($rows as $document) {
        $date = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
        foreach($vars as $var){
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                $varDataP = $document->extreme_data_bolts->{$var[0]}[0] * 100 / $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][0];
                if($varDataP < 0){
                    $varDataP = 0;
                }
                $varDataN = null;
                if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0],$nnvars)){
                    $varDataN = $document->extreme_data_bolts->{$var[0]}[1] * 100 / $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][1];
                    if($varDataN < 0){
                        $varDataN = 0;
                    }
                }
            }else{
                $varDataP = $document->extreme_data->{$var[0]}[0] * 100 / $_SESSION['extremeData']['data']['design']['component'][$var[0]][0];
                if($varDataP < 0){
                    $varDataP = 0;
                }
                $varDataN = null;
                if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0],$nnvars)){
                    $varDataN = $document->extreme_data->{$var[0]}[1] * 100 / $_SESSION['extremeData']['data']['design']['component'][$var[0]][1];
                    if($varDataN < 0){
                        $varDataN = 0;
                    }
                }
            }

            $lastP[$var[0]] = [$var[1],$varDataP];
            if($varDataN != null || $varDataN == 0){
                $lastN[$var[0]] = [$var[1],$varDataN];
            }
        }
    }

    $date = date("d-m-Y H:m", $date/1000);
    $d = date("d-m-Y H:m", strtotime("- 1 month", strtotime($date)));
    $d = strtotime($d) * 1000;

    $q = [
        'DateTime' => [
            '$gt' => new MongoDB\BSON\UTCDateTime($d)
        ]
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
    
    foreach ($rows as $document) {
        $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
        $a = $a / 1000;
        
        foreach($vars as $var){
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                $varDataP = $document->extreme_data_bolts->{$var[0]}[0] * 100 / $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][0];
                $varDataN = null;
                if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0],$nnvars)){
                    $varDataN = $document->extreme_data_bolts->{$var[0]}[1] * 100 / $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][1];
                    if($varDataN < 0){
                        $varDataN = 0;
                    }
                }
            }else{
                $varDataP = $document->extreme_data->{$var[0]}[0] * 100 / $_SESSION['extremeData']['data']['design']['component'][$var[0]][0];
                $varDataN = null;
                if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var[0],$nnvars)){
                    $varDataN = $document->extreme_data->{$var[0]}[1] * 100 / $_SESSION['extremeData']['data']['design']['component'][$var[0]][1];
                    if($varDataN < 0){
                        $varDataN = 0;
                    }
                }
            }

            $d = date("d-m-Y H:m", strtotime("- 1 day", strtotime($date)));
            if(date("d-m-Y H:m", $a) > $d){
                if(!isset($dayP[$var[0]]) || $varDataP > $dayP[$var[0]][1]){
                    $dayP[$var[0]] = [$var[1],$varDataP];
                }
                if(($varDataN != null || $varDataN == 0) && (!isset($dayN[$var[0]]) || $varDataN > $dayN[$var[0]][1])){
                    $dayN[$var[0]] = [$var[1],$varDataN];
                }
            }

            $d = date("d-m-Y H:m", strtotime("- 1 week", strtotime($date)));
            if(date("d-m-Y H:m", $a) > $d){
                if(!isset($weekP[$var[0]]) || $varDataP > $weekP[$var[0]][1]){
                    $weekP[$var[0]] = [$var[1],$varDataP];
                }
                if(($varDataN != null || $varDataN == 0) && (!isset($weekN[$var[0]]) || $varDataN > $weekN[$var[0]][1])){
                    $weekN[$var[0]] = [$var[1],$varDataN];
                }
            }

            if(!isset($monthP[$var[0]]) || $varDataP > $monthP[$var[0]][1]){
                $monthP[$var[0]] = [$var[1],$varDataP];
            }
            if(($varDataN != null || $varDataN == 0) && (!isset($monthN[$var[0]]) || $varDataN > $monthN[$var[0]][1])){
                $monthN[$var[0]] = [$var[1],$varDataN];
            }
        }
    }

    return [[$lastP,$dayP,$weekP,$monthP],[$lastN,$dayN,$weekN,$monthN]];
}

function countMachineExtremeByDate($windfarm,$machine,$vars,$cellmodel,$value,$startDate,$finalDate,$component){
    $nnvars = ['var42','var44','var45','var46','var47','var48','var49','var50','var51','var52','var53'];

    include 'configMongo.php';

    if(!isset($_SESSION['extremeData']) || !isset($_SESSION['extremeData']['windFarm']) || $_SESSION['extremeData']['windFarm'] != $windfarm || !isset($_SESSION['extremeData']['machine']) || $_SESSION['extremeData']['machine'] != $machine || !isset($_SESSION['extremeData']['data']) || $_SESSION['extremeData']['data']['design'] == null){
        $q = [
            '_id' => 'v20210831_xtr'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$cellmodel, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $_SESSION['extremeData']['data']['design']['component'] = $document;
        }

        $q = [
            '_id' => 'v2021831_xtr_bolts'
        ];
        
        $o = [];
        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery('Design.'.$cellmodel, $query);
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $_SESSION['extremeData']['data']['design']['bolts'] = $document;
        }
    }

    $q = [
        '$and' => [
            [
                'DateTime' => [
                    '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($startDate) * 1000)
                ]
            ],
            [
                'DateTime' => [
                    '$lte' => new MongoDB\BSON\UTCDateTime(strtotime($finalDate) * 1000)
                ]
            ]
        ]
    ];
    
    $or = [];
    
    foreach($vars as $var){
        $o['projection']['extreme_data.'.$var[0]] = '$extreme_data.'.$var[0];
        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
            array_push($or,['extreme_data_bolts.'.$var[0].'.0' => ['$gt' => $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][0] * $value / 100]]);
            array_push($or,['extreme_data_bolts.'.$var[0].'.1' => ['$lt' => $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][1] * $value / 100]]);
        }else{
            array_push($or,['extreme_data.'.$var[0].'.0' => ['$gt' => $_SESSION['extremeData']['data']['design']['component'][$var[0]][0] * $value / 100]]);
            array_push($or,['extreme_data.'.$var[0].'.1' => ['$lt' => $_SESSION['extremeData']['data']['design']['component'][$var[0]][1] * $value / 100]]);
        }
    }  
    array_push($q['$and'],['$or' => $or]);
    $o['projection']['DateTime'] = '$DateTime';
    $o['projection']['_id'] = 0;

    //var_dump($q);

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
    $data = [];

    foreach ($rows as $document) {
        foreach($vars as $var){
            $data[$var[0]]['name'] = $var[1];
            $pdata = $document->extreme_data->{$var[0]}[0];
            $ndata = $document->extreme_data->{$var[0]}[1];
            $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
            if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                if($pdata >= $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][0] * $value / 100){
                    if(!isset($data[$var[0]]['pos'])){
                        $data[$var[0]]['pos'] = [];
                    }
                    array_push($data[$var[0]]['pos'], [date("d-m-Y H:i", ($a / 1000) ),$pdata * 100 / $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][0]]);
                }
                if($ndata <= $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][1] * $value / 100){
                    if(!isset($data[$var[0]]['neg'])){
                        $data[$var[0]]['neg'] = [];
                    }
                    array_push($data[$var[0]]['neg'], [date("d-m-Y H:i", ($a / 1000) ),$ndata * 100 / $_SESSION['extremeData']['data']['design']['bolts'][$var[0]][1]]);
                }
            }else{
                if($pdata >= $_SESSION['extremeData']['data']['design']['component'][$var[0]][0] * $value / 100){
                    if(!isset($data[$var[0]]['pos'])){
                        $data[$var[0]]['pos'] = [];
                    }
                    array_push($data[$var[0]]['pos'], [date("d-m-Y H:i", ($a / 1000) ),$pdata * 100 / $_SESSION['extremeData']['data']['design']['component'][$var[0]][0]]);
                }
                if($ndata <= $_SESSION['extremeData']['data']['design']['component'][$var[0]][1] * $value / 100){
                    if(!isset($data[$var[0]]['neg'])){
                        $data[$var[0]]['neg'] = [];
                    }
                    array_push($data[$var[0]]['neg'], [date("d-m-Y H:i", ($a / 1000) ),$ndata * 100 / $_SESSION['extremeData']['data']['design']['component'][$var[0]][1]]);
                }
            }
        }
    }

    return $data;
}

function getFatigueByMinutes($windfarm,$machine,$cell,$data,$component,$variable,$wohler){
    $wollerPositions = [4 => 0, 5 => 1, 7 => 2, 8 => 3, 9 => 4, 10 => 5, 14 => 6];
    $design = $data['design']['component'][$variable][0];
    if($component == 'tower_top_j_bolts' || $component == 'foundation_j_bolts' || $component == 'root_j_bolts'){
        if($wohler == 3){
            $design = $data['design']['bolts'][$variable][0];
        }else{
            $design = $data['design']['bolts'][$variable][1];
        }
    }
    $design = pow(pow($design, $wohler) / (20*365.25*144), (1/$wohler));

    include 'configMongo.php';

    $q = [
        '$or' => [
        ]
    ];

    $repetidos = [];
    foreach($data['minutes'] as $minute){
        $id = 'rflw_'.$minute['status'].'_'.$minute['windSector'].'_'.$minute['speed'].'_'.$minute['yaw'].'_'.$minute['density'];
        if(($minute['status'] == 'pp' || $minute['status'] == 'id') && $windfarm != 'OUROL'){
            $id .= '_'.$minute['turbulence'];
        }
        if($windfarm == 'CCROES' || $windfarm == 'OUROL'){
            $id = str_replace('y0', 'ym', $id);
        }
        if(!in_array($id, $repetidos)){
            array_push($q['$or'], ['_id' => $id]);
            array_push($repetidos, $id);
        }
    }

    $o = [
        'projection' => [
            '_id' => '$_id',
            'data.'.$variable => '$data.'.$variable
        ]
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery($windfarm.'.'.$cell.'_LookUpTables', $query);
    if($component == 'tower_top_j_bolts' || $component == 'foundation_j_bolts' || $component == 'root_j_bolts'){
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$cell.'_LookUpTablesBolts', $query);
    }

    if (!function_exists('str_contains')) {
        function str_contains($haystack, $needle) {
            return $needle !== '' && mb_strpos($haystack, $needle) !== false;
        }
    }
    $sdf = [];
    foreach ($rows as $document) {
        $document = json_decode(json_encode($document), true);
        array_push($sdf, $document['_id']);
        $keys = array_keys($document['data']);
        foreach(array_values($data['minutes']) as $minute){
            if(isset($minute)){
                $id = 'rflw_'.$minute['status'].'_'.$minute['windSector'].'_'.$minute['speed'].'_'.$minute['yaw'].'_'.$minute['density'];
                if(($minute['status'] == 'pp' || $minute['status'] == 'id') && $windfarm != 'OUROL'){
                    $id .= '_'.$minute['turbulence'];
                }
    
                if($windfarm == 'CCROES' || $windfarm == 'OUROL'){
                    $id = str_replace('y0', 'ym', $id);
                }

                if($id == $document['_id']){
                    if($component == 'tower_top_j_bolts' || $component == 'foundation_j_bolts' || $component == 'root_j_bolts'){
                        if($wohler == 3){
                            $data['minutes'][$minute['time']]['valueN'] = $document['data'][$keys[0]][0];
                            $data['minutes'][$minute['time']]['valueP'] = $document['data'][$keys[0]][0] * 100 / $design;
                        }else{
                            $data['minutes'][$minute['time']]['valueN'] = $document['data'][$keys[0]][1];
                            $data['minutes'][$minute['time']]['valueP'] = $document['data'][$keys[0]][1] * 100 / $design;
                        }
                    }else{
                        $data['minutes'][$minute['time']]['valueN'] = $document['data'][$keys[0]][$wollerPositions[$wohler]];
                        $data['minutes'][$minute['time']]['valueP'] = $document['data'][$keys[0]][$wollerPositions[$wohler]] * 100 / $design;
                    }
                    $data['minutes'][$minute['time']]['design'] = $design;
                }
            }
        }
    }
    echo json_encode(['data' => array_values($data['minutes'])]);
}

function sendComponentEmail($email, $windfarm, $wtg, $component, $date){
    $mail_recipients = ['victor.blanco@nablawindhub.com'];


    $body = '<h3>Componente reemplazado</h3>';
/*     $auxComp = '';
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
            else{
                $body .= '<p> - Positive envelope extreme load: ' . strval($values['pos'][0]) . '% <br> - Datetime: ' . $values['pos'][1] . " (UTC+00) </p>";
            }
        }
    } */

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
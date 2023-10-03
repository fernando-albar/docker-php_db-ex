<?php
# Import connection
include 'config.php';
include 'php.php';

$callFunc = $_POST['callFunc'];

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

switch ($callFunc) {
    case 'getUser':
        session_start();
        # Returns user info, user dash access and user windfarms
        echo json_encode(['user' =>  $_SESSION["credentials"]->jsonSerialize(), 'dashAccess' =>  $_SESSION["credentials"]->getDashAccess(), 'wf' => count($_SESSION["windFarms"])]);
        break;
    case 'getSearch':
        session_start();
        # Select countries, windfarms, platforms and machines of the logged user
        $sql = "SELECT DISTINCT(wtg.idwfarm), wtg.idcell, wtg.wtg_number, wtg.ispin_wtg, wtg.enabled, wind_farm.name, wind_farm.country, cell.turbine_model FROM wtg LEFT JOIN wind_farm ON wtg.idwfarm = wind_farm.idwfarm LEFT JOIN smartdata_calculed_data.analytics ON wind_farm.idwfarm = analytics.idwfarm LEFT JOIN cell ON wtg.idcell = cell.idcell AND wtg.idwfarm = cell.idwfarm WHERE smartdata_calculed_data.analytics.idclient = ".$_SESSION["credentials"]->getId()." ORDER BY idwfarm, wtg_number;";
        
        $result = $conn->query($sql);

        $countries = [];
        $platforms = [];
        $windfarms = [];
        $wtgs = [];

        if($result->num_rows > 0){
            while ($line = $result->fetch_assoc()) {
                $countries[$line['country']] = $line['country'];
                $platforms[$line['turbine_model']] = $line['turbine_model'];
                $windfarms[$line['idwfarm']] = [$line['idwfarm'],$line['name']];
                if ($line['enabled'] == 1){
                    array_push($wtgs, [$line['wtg_number'],$line['idwfarm'],$line['turbine_model'],$line['country'],$line['idcell']]);
                }
            }
            # Returns countries, windfarms, platforms and machines of the logged user
            echo json_encode(['contries' =>  array_values($countries), 'platforms' =>  array_values($platforms), 'windfarms' =>  array_values($windfarms), 'wtgs' =>  $wtgs]);
        }

        $conn->close();
        break;
    case 'getCountries':
        session_start();
        # Returns logged user windfarms countries
        $countries = array();
        foreach ($_SESSION["windFarms"] as $windFarm){
            if (!in_array($windFarm->getCountry(), $countries)){
                array_push($countries, $windFarm->getCountry());
            }
        }
        echo json_encode(['data' =>  $countries]);
        break;
    case 'getPlatforms':
        session_start();
        # Returns logged user windfarms platforms by country
        $country = $_POST['country'];
        $sql = "SELECT DISTINCT turbine_model FROM cell INNER JOIN wind_farm ON cell.idwfarm = wind_farm.idwfarm WHERE country='".$country."' AND idclient = ".$_SESSION["credentials"]->getId().";";
        
        $result = $conn->query($sql);

        if($result->num_rows > 0){
            $platforms = [];

            while ($platform = $result->fetch_assoc()) {
                array_push($platforms, $platform['turbine_model']);
            }

            echo json_encode(['data' =>  $platforms]);
        }else{
            echo json_encode(['data' =>  null]);
        }
        $conn->close();

        break;
    case 'getWindFarmsNames':
        session_start();
        # Returns logged user windfarms names by country and platform
        $country = $_POST['country'];
        $platform = $_POST['platform'];
        $sql = "SELECT DISTINCT wind_farm.* FROM wind_farm INNER JOIN cell ON cell.idwfarm = wind_farm.idwfarm WHERE turbine_model='".$platform."' AND idclient = ".$_SESSION["credentials"]->getId()." AND country='".$country."';";
        
        $result = $conn->query($sql);

        if($result->num_rows > 0){
            $windFarms = [];

            while ($windFarm = $result->fetch_assoc()) {
                array_push($windFarms, [$windFarm['idwfarm']." - ".$windFarm['name'],$windFarm['idwfarm']]);
            }

            echo json_encode(['data' =>  $windFarms]);
        }else{
            echo json_encode(['data' =>  null]);
        }
        $conn->close();

        break;
    case 'getWT':
        session_start();
        # Returns logged user windfarms machines by windfarm and platform
        $windFarm = $_POST['windFarm'];
        $wtg = $_POST['wtg'];
        $range = $_POST['range'];
        if ($wtg != Null){
            $sql = "SELECT wtg.*, wtg_number AS number, cell.turbine_model, analytics.rango,  analytics.performance, (min(life.expectancy) - (DATEDIFF(NOW(), life.installation) / 365.25)) as expectancy, analytics.extreme_1, analytics.extreme_2, analytics.extreme_3 FROM wtg inner join cell on cell.idcell = wtg.idcell inner join smartdata_calculed_data.analytics on wtg.idwfarm = analytics.idwfarm and wtg.wtg_number = analytics.wtg inner join smartdata_calculed_data.life on wtg.idwfarm = life.idwfarm and wtg.wtg_number = life.wtg where life.idclient =  '".$_SESSION['credentials']->getId()."' and wtg.idwfarm = '".$windFarm."' and cell.idwfarm = '".$windFarm."' and analytics.wtg = ".$wtg." and analytics.rango = ".$range." and life.rango = 1 and wtg.enabled = True group by wtg_number order by wtg_number;";
        }
        else{
            $sql = "SELECT wtg.*, wtg_number AS number, cell.turbine_model, analytics.rango,  analytics.performance, (min(life.expectancy) - (DATEDIFF(NOW(), life.installation) / 365.25)) as expectancy, analytics.extreme_1, analytics.extreme_2, analytics.extreme_3 FROM wtg inner join cell on cell.idcell = wtg.idcell inner join smartdata_calculed_data.analytics on wtg.idwfarm = analytics.idwfarm and wtg.wtg_number = analytics.wtg inner join smartdata_calculed_data.life on wtg.idwfarm = life.idwfarm and wtg.wtg_number = life.wtg where life.idclient =  '".$_SESSION['credentials']->getId()."' and wtg.idwfarm = '".$windFarm."' and cell.idwfarm = '".$windFarm."' and analytics.rango = ".$range." and life.rango = 1 and wtg.enabled = True group by wtg_number order by wtg_number;";
        }
                
        $result = $conn->query($sql);

        if($result->num_rows > 0){
            $wts = [];

            while ($wt = $result->fetch_assoc()) {
                array_push($wts, $wt);
            }

            echo json_encode(['data' =>  $wts]);
        }else{
            echo json_encode(['data' =>  null]);
        }
        $conn->close();

        break;
    case 'getWTturbine':
        session_start();
        # Returns logged user windfarms machines by windfarm and platform
        $windFarm = $_POST['windFarm'];
        $platform = $_POST['platform'];
        $sql = "SELECT wtg.idcell, wtg_number AS number FROM wtg INNER JOIN cell ON wtg.idcell = cell.idcell where wtg.idwfarm = '".$windFarm."' and cell.idwfarm = '".$windFarm."' and cell.turbine_model = '".$platform."' and wtg.enabled = True order by wtg_number;";
        
        $result = $conn->query($sql);

        if($result->num_rows > 0){
            $wts = [];

            while ($wt = $result->fetch_assoc()) {
                array_push($wts, $wt);
            }

            echo json_encode(['data' =>  $wts]);
        }else{
            echo json_encode(['data' =>  null]);
        }
        $conn->close();

        break;
    case 'getWTcell':
        session_start();
        # Returns cell by windfarm and platform
        $windFarm = $_POST['windFarm'];
        $cell = $_POST['platform'];
        $sql = "SELECT wtg.idcell, wtg_number AS number FROM wtg where idwfarm = '".$windFarm."' and idcell = ".$cell." and enabled = True order by wtg_number;";
        
        $result = $conn->query($sql);

        if($result->num_rows > 0){
            $wts = [];

            while ($wt = $result->fetch_assoc()) {
                array_push($wts, $wt);
            }

            echo json_encode(['data' =>  $wts]);
        }else{
            echo json_encode(['data' =>  null]);
        }
        $conn->close();

        break;
    case 'getWindFarms':
        session_start();
        # Returns logged user windfarms
        $windFarms = array();
        foreach ($_SESSION["windFarms"] as $windFarm){
            array_push($windFarms, $windFarm->jsonSerialize());
        }
        echo json_encode(['windFarms' => $windFarms]);
        break;
    case 'getWindFarm':
        session_start();
        # Returns logged user windfarm info
        echo json_encode($_SESSION["windFarms"][$_POST['windFarm']]->jsonSerialize());
        break;
    case 'getModelComponents':
        # Returns components of a machine bby windfarm and machine or cell
        $windfarm = $_POST['windFarm'];
        $model = $_POST['model'];
        $isCell = $_POST['isCell'];
        $sql = "";

        if($isCell == 'true'){
            $sql = "SELECT idcomponent, component.name, idwtgmodel, location FROM smartdata_app.component INNER JOIN cell ON component.idwtgmodel = cell.turbine_model WHERE cell.idcell = '".$model."' AND cell.idwfarm = '".$windfarm."' AND idcomponent != 'drive_t_brake' AND idcomponent != 'gearbox' order by idcomponent asc;";
        }else{
            $sql = "SELECT idcomponent, name, idwtgmodel, location FROM smartdata_app.component WHERE idwtgmodel = '".$model."' AND idcomponent != 'drive_t_brake' AND idcomponent != 'gearbox' order by idcomponent asc;";
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
    case 'getKpis':
        session_start();
        # Returns the capacity of the machine, windfarm or client selected
        $windfarm = $_POST['windFarm'];
        $machine = $_POST['machine'];
        $range = $_POST['range'];

        $sql = "SELECT IFNULL(avg(d1.availability), 'Not Available') AS availability, avg(d1.performance) AS performance, sum(d1.production) AS production, sum(d1.m_extreme_1) AS extreme_1, sum(d1.m_extreme_2) AS extreme_2, sum(d1.m_extreme_3) AS extreme_3, sum(d1.failures) AS failures, sum(d1.opex) AS opex, sum(d1.wind_speed) AS wind_speed, sum(d1.iu) AS iu, sum(d1.inflow) AS inflow, sum(d1.alpha) AS alpha, sum(d1.air_density) AS air_density, (SELECT sum(power) AS capacity FROM smartdata_client_2.wtg inner join wind_farm on wind_farm.idwfarm = wtg.idwfarm where wind_farm.idclient = ".$_SESSION["credentials"]->getId()." and wtg.enabled = True) AS capacity FROM smartdata_calculed_data.analytics AS d1 INNER JOIN smartdata_client_2.wtg on d1.idwfarm = wtg.idwfarm and d1.wtg = wtg.wtg_number where rango = ".$range." and idclient = ".$_SESSION["credentials"]->getId()." and wtg.enabled = True;";

        if($windfarm != null){
            $sql = "SELECT IFNULL(avg(d1.availability), 'Not Available') AS availability, avg(d1.performance) AS performance, sum(d1.production) AS production, sum(d1.m_extreme_1) AS extreme_1, sum(d1.m_extreme_2) AS extreme_2, sum(d1.m_extreme_3) AS extreme_3, sum(d1.failures) AS failures, sum(d1.opex) AS opex, sum(d1.wind_speed) AS wind_speed, sum(d1.iu) AS iu, sum(d1.inflow) AS inflow, sum(d1.alpha) AS alpha, sum(d1.air_density) AS air_density, (SELECT sum(power) AS capacity FROM smartdata_client_2.wtg inner join wind_farm on wind_farm.idwfarm = wtg.idwfarm where wind_farm.idclient = ".$_SESSION["credentials"]->getId()." and wtg.idwfarm = '".$windfarm."' and wtg.enabled = True) AS capacity FROM smartdata_calculed_data.analytics AS d1 INNER JOIN smartdata_client_2.wtg on d1.idwfarm = wtg.idwfarm and d1.wtg = wtg.wtg_number where rango = ".$range." and d1.idwfarm = '".$windfarm."' and idclient = ".$_SESSION["credentials"]->getId()." and wtg.enabled = True;";
        }
        if($machine != null){
            $sql = "SELECT IFNULL(avg(d1.availability), 'Not Available') AS availability, avg(d1.performance) AS performance, sum(d1.production) AS production, sum(d1.m_extreme_1) AS extreme_1, sum(d1.m_extreme_2) AS extreme_2, sum(d1.m_extreme_3) AS extreme_3, sum(d1.m_extreme_1) AS m_extreme_1, sum(d1.m_extreme_2) AS m_extreme_2, sum(d1.m_extreme_3) AS m_extreme_3, sum(d1.failures) AS failures, sum(d1.opex) AS opex, sum(d1.wind_speed) AS wind_speed, sum(d1.iu) AS iu, sum(d1.inflow) AS inflow, sum(d1.alpha) AS alpha, sum(d1.air_density) AS air_density, d1.estimated_aep, d1.energy_production, (SELECT sum(power) AS capacity FROM smartdata_client_2.wtg inner join wind_farm on wind_farm.idwfarm = wtg.idwfarm where wind_farm.idclient = ".$_SESSION["credentials"]->getId()." and wtg.idwfarm = '".$windfarm."' and wtg.wtg_number = ".$machine.") AS capacity FROM smartdata_calculed_data.analytics AS d1 where rango = ".$range." and d1.idwfarm = '".$windfarm."' and d1.wtg = ".$machine." and idclient = ".$_SESSION["credentials"]->getId().";";
        }
        
        $result = $conn->query($sql);

        if($result->num_rows > 0){
            while ($row = $result->fetch_assoc()) {
                echo json_encode($row);
            }
        }

        $conn->close();
        break;
    case 'getWindfarmModels':
        session_start();
        # Returns windfarm models
        $windFarm = $_POST['windFarm'];
        $sql = "SELECT DISTINCT(turbine_model) FROM `cell` WHERE idwfarm = '".$windFarm."';";
        
        $result = $conn->query($sql);
        
        if($result->num_rows > 0){
            $models = [];

            while ($model = $result->fetch_assoc()) {
                array_push($models, $model['turbine_model']);
            }

            echo json_encode($models);
        }
        $conn->close();
        break;
    case 'getModelsWindfarm':
        session_start();
        # Returns windfarm models
        $model = $_POST['model'];
        $sql = "SELECT DISTINCT(idwfarm) FROM `cell` WHERE turbine_model = '".$model."';";
        
        $result = $conn->query($sql);
        
        if($result->num_rows > 0){
            $windfarms = [];

            while ($windfarm = $result->fetch_assoc()) {
                array_push($windfarms, $windfarm['idwfarm']);
            }

            echo json_encode($windfarms);
        }
        $conn->close();
        break;
    case 'getPowerCurveModels':
        session_start();
        # Returns windfarm models
        $model = $_POST['model'];
        if($model == 'V90 2.0' or $model == 'V9020' or $model == 'G87'){
            $model = 'V90';
        }
        $sql = "SELECT * FROM `power_curve` WHERE model = '".$model."';";
        
        $result = $conn->query($sql);
        
        if($result->num_rows > 0){
            $power_curve_data = [];

            while ($power_curve_row = $result->fetch_assoc()) {
                array_push($power_curve_data, $power_curve_row);
            }

            echo json_encode($power_curve_data);
        }
        $conn->close();
        break;
    }
?>
<?php
    include 'php.php';
    date_default_timezone_set('UTC');

    if((isset($_POST['client']) && isset($_POST['wfarm']) && isset($_POST['wtg'])) && ($_POST['client'] != null && $_POST['wfarm'] != null && $_POST['wtg'] != null)){
        $argv = ['test.php',$_POST['client'],$_POST['wfarm'],$_POST['wtg']];
    }

    if (!function_exists('str_contains')) {
        function str_contains(string $haystack, string $needle): bool
        {
            return '' === $needle || false !== strpos($haystack, $needle);
        }
    }
    
    $servername = "109.106.244.222";
/*     $servername = "localhost"; */
    $username = "root";
    $password = "N@bl@W1ndP0w3r";
    $dbname = "smartdata_client_2";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $sql = "SELECT wind_farm.name FROM wind_farm where idwfarm = '".$argv[2]."' ";
    $result = $conn->query($sql);

    if($result->num_rows > 0){
        while ($windfarm = $result->fetch_assoc()) {
            $windfarm_name = $windfarm['name'];
            break;
        }
    }

    $sql = "SELECT component.*, IFNULL(component.order, 999) AS 'nOrder', extreme_variables.variable, wtg_component.component_installation_date FROM smartdata_app.component INNER JOIN smartdata_app.extreme_variables ON extreme_variables.idwtgmodel = component.idwtgmodel AND extreme_variables.idcomponent = component.idcomponent INNER JOIN wtg_component ON wtg_component.idwfarm = '".$argv[2]."'AND wtg_component.wtg_number = ".$argv[3]." AND wtg_component.component_id = component.idcomponent AND component.idcomponent != 'drive_t_brake' WHERE smartdata_app.component.idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$argv[2]."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$argv[2]."' AND wtg_number = ".$argv[3].")) order by nOrder, component.idcomponent asc;";
    $result = $conn->query($sql);

    $components = [];
    $comp = "";
    $vars = [];
    $turbine = "";
    $nc = new Component(null,null,null,null,null,null,null,null,null,null,null);
    if($result->num_rows > 0){
        while ($component = $result->fetch_assoc()) {
            $turbine = $component['idwtgmodel'];
            if($component['idcomponent'] != $comp && $comp != ""){
                array_push($components, $nc);
                $vars = [];
            }
            $comp = $component['idcomponent'];
            $order = $component['nOrder'];
            array_push($vars, $component['variable']);
            $nc = new Component($component['idcomponent'],$component['name'],$component['location'],$component['position'],$component['src'],$order,$vars,$component['component_installation_date'],$component['failure'],$component['preventive'],$component['ndt']);
        }
    }
    array_push($components, $nc);

    $start = microtime(true);
    $nnvars = ['var42','var44','var45','var46','var47','var48','var49','var50','var51','var52','var53'];
    $cont = 0;
    $max_pos_blade = 0;
    $max_neg_blade = 0;
    $max_pos_tower = 0;
    $email_data = [];

    foreach (calcMachineExtreme($argv[2],$argv[3],$turbine,$components) as $comp){
        $vars = $comp->getVars();
        $extremePos = 0;
        $extremeNeg = 0;
        foreach (array_keys($vars) as $key){
            if($extremePos < $vars[$key]['dpv'][1]){
                $extremePos = $vars[$key]['dpv'][1];
                $datePos = $vars[$key]['dpv'][0];
            }


            $sql = "INSERT INTO smartdata_calculed_data.extreme (idclient, idwfarm, wtg, component, variable, positive, name, src, location, position, orden, last, last_date, day, day_date, week, week_date, month, month_date) VALUES (".$argv[1].",'".$argv[2]."',".$argv[3].",'".$comp->getComponent()."','".$key."',1,'".$comp->getName()."','".$comp->getSrc()."','".$comp->getLocation()."','".$comp->getPosition()."',".$comp->getOrder().",".$vars[$key]['lpv'][1].",'".$vars[$key]['lpv'][0]."',".$vars[$key]['dpv'][1].",'".$vars[$key]['dpv'][0]."',".$vars[$key]['wpv'][1].",'".$vars[$key]['wpv'][0]."',".$vars[$key]['mpv'][1].",'".$vars[$key]['mpv'][0]."') ON DUPLICATE KEY UPDATE last = ".$vars[$key]['lpv'][1].", day = ".$vars[$key]['dpv'][1].", week = ".$vars[$key]['wpv'][1].", month = ".$vars[$key]['mpv'][1].", last_date = '".$vars[$key]['lpv'][0]."', day_date = '".$vars[$key]['dpv'][0]."', week_date = '".$vars[$key]['wpv'][0]."', month_date = '".$vars[$key]['mpv'][0]."';";

            if ($conn->query($sql) === TRUE) {
                //echo ".";
            }else {
                //echo $sql."\n";;
            }
            $cont++;

            if(!in_array($key, $nnvars) || $comp->getComponent() == 'tower_top_j_bolts'){
                if($extremeNeg < $vars[$key]['dnv'][1]){
                    $extremeNeg = $vars[$key]['dnv'][1];
                    $dateNeg = $vars[$key]['dnv'][0];
                }

                $sql = "INSERT INTO smartdata_calculed_data.extreme (idclient, idwfarm, wtg, component, variable, positive, name, src, location, position, orden, last, last_date, day, day_date, week, week_date, month, month_date) VALUES (".$argv[1].",'".$argv[2]."',".$argv[3].",'".$comp->getComponent()."','".$key."',0,'".$comp->getName()."','".$comp->getSrc()."','".$comp->getLocation()."','".$comp->getPosition()."',".$comp->getOrder().",".$vars[$key]['lnv'][1].",'".$vars[$key]['lnv'][0]."',".$vars[$key]['dnv'][1].",'".$vars[$key]['dnv'][0]."',".$vars[$key]['wnv'][1].",'".$vars[$key]['wnv'][0]."',".$vars[$key]['mnv'][1].",'".$vars[$key]['mnv'][0]."') ON DUPLICATE KEY UPDATE last = ".$vars[$key]['lnv'][1].", day = ".$vars[$key]['dnv'][1].", week = ".$vars[$key]['wnv'][1].", month = ".$vars[$key]['mnv'][1].", last_date = '".$vars[$key]['lnv'][0]."', day_date = '".$vars[$key]['dnv'][0]."', week_date = '".$vars[$key]['wnv'][0]."', month_date = '".$vars[$key]['mnv'][0]."';";

                if ($conn->query($sql) === TRUE) {
                    //echo ".";
                }else {
                    //echo $sql."\n";;
                }
                $cont++;
            }
        }
        if(str_contains($comp->getComponent(), 'bld')){
            if($extremePos > $max_pos_blade){
                $max_pos_blade = $extremePos;
                $max_blade = $comp;
                $date_pos_blade = $datePos;
            }
    
            if($extremeNeg > $max_neg_blade){
                $max_neg_blade = $extremeNeg;
                $max_blade = $comp;
                $date_neg_blade = $dateNeg;
            }
        }

        if(str_contains($comp->getComponent(), 'twr')){
            if($extremePos > $max_pos_tower){
                $max_pos_tower = $extremePos;
                $max_tower = $comp;
                $date_pos_tower = $datePos;
            }
    
        }

        if(!(str_contains($comp->getComponent(), 'bld')) && !(str_contains($comp->getComponent(), 'twr'))){
            if($extremePos >= 70){
                $sqlAlertsPositiveSelect = "SELECT * FROM smartdata_calculed_data.alerts WHERE idclient = ".$argv[1]." and windfarm = '".$windfarm_name."' and idwfarm = '".$argv[2]."' and model = '".$turbine."' and wtg = ".$argv[3]." and idcomponent = '".$comp->getComponent()."' and component = '".$comp->getName()."' and type = 'extreme' and positive = 1 and value = ".$extremePos." and datetime = '".$datePos."';";
                $result = $conn->query($sqlAlertsPositiveSelect);

                if($result->num_rows == 0){
                    $sqlAlertsPositive = "INSERT INTO smartdata_calculed_data.alerts (idclient, windfarm, idwfarm, model, wtg, idcomponent,component, type, positive, value, datetime, status, new) VALUES (".$argv[1].", '".$windfarm_name."', '".$argv[2]."', '".$turbine."', ".$argv[3].", '".$comp->getComponent()."', '".$comp->getName()."','extreme',1,".$extremePos.",'".$datePos."','active', 1);";
                    $email_data[$argv[3]][$comp->getName()]['pos'] = [$extremePos, $datePos];
                    if ($conn->query($sqlAlertsPositive) === TRUE) {
                        //echo ".";
                    }else {
                        //echo $sql."\n";;
                    }
                }
            }
    
            if($extremeNeg >= 70){
                $sqlAlertsNegativeSelect = "SELECT * FROM smartdata_calculed_data.alerts WHERE idclient = ".$argv[1]." and windfarm = '".$windfarm_name."' and idwfarm = '".$argv[2]."' and model = '".$turbine."' and wtg = ".$argv[3]." and idcomponent = '".$comp->getComponent()."' and component = '".$comp->getName()."' and type = 'extreme' and positive = 0 and value = ".$extremeNeg." and datetime = '".$dateNeg."';";
                $result = $conn->query($sqlAlertsNegativeSelect);

                if($result->num_rows == 0){
                    $sqlAlertsNegative = "INSERT INTO smartdata_calculed_data.alerts (idclient, windfarm, idwfarm, model, wtg, idcomponent, component, type, positive, value, datetime, status, new) VALUES (".$argv[1].", '".$windfarm_name."', '".$argv[2]."', '".$turbine."', ".$argv[3].", '".$comp->getComponent()."', '".$comp->getName()."','extreme',0,".$extremeNeg.",'".$dateNeg."','active', 1);";
                    $email_data[$argv[3]][$comp->getName()]['neg'] =  [$extremeNeg, $dateNeg];
                    if ($conn->query($sqlAlertsNegative) === TRUE) {
                        //echo ".";
                    }else {
                        //echo $sql."\n";;
                    }
                }
            }
        }
    }

    if($max_pos_blade >= 70){

        $sqlAlertsPositiveSelect = "SELECT * FROM smartdata_calculed_data.alerts WHERE idclient = ".$argv[1]." and windfarm = '".$windfarm_name."' and idwfarm = '".$argv[2]."' and model = '".$turbine."' and wtg = ".$argv[3]." and idcomponent = '".$max_blade->getComponent()."' and component = '".$max_blade->getName()."' and type = 'extreme' and positive = 1 and value = ".$max_pos_blade." and datetime = '".$date_pos_blade."';";
        $result = $conn->query($sqlAlertsPositiveSelect);

        if($result->num_rows == 0){
            $sqlAlertsPositive = "INSERT INTO smartdata_calculed_data.alerts (idclient, windfarm, idwfarm, model, wtg, idcomponent,component, type, positive, value, datetime, status, new) VALUES (".$argv[1].", '".$windfarm_name."', '".$argv[2]."', '".$turbine."', ".$argv[3].", '".$max_blade->getComponent()."', '".$max_blade->getName()."','extreme',1,".$max_pos_blade.",'".$date_pos_blade."','active', 1);";
            $email_data[$argv[3]]['Blade']['pos'] = [$max_pos_blade, $date_pos_blade];
            if ($conn->query($sqlAlertsPositive) === TRUE) {
                //echo ".";
            }else {
                //echo $sql."\n";;
            }
        }
    }

    if($max_neg_blade >= 70){

        $sqlAlertsPositiveSelect = "SELECT * FROM smartdata_calculed_data.alerts WHERE idclient = ".$argv[1]." and windfarm = '".$windfarm_name."' and idwfarm = '".$argv[2]."' and model = '".$turbine."' and wtg = ".$argv[3]." and idcomponent = '".$max_blade->getComponent()."' and component = '".$max_blade->getName()."' and type = 'extreme' and positive = 0 and value = ".$max_neg_blade." and datetime = '".$date_neg_blade."';";
        $result = $conn->query($sqlAlertsPositiveSelect);

        if($result->num_rows == 0){
            $sqlAlertsNegative = "INSERT INTO smartdata_calculed_data.alerts (idclient, windfarm, idwfarm, model, wtg, idcomponent, component, type, positive, value, datetime, status, new) VALUES (".$argv[1].", '".$windfarm_name."', '".$argv[2]."', '".$turbine."', ".$argv[3].", '".$max_blade->getComponent()."', '".$max_blade->getName()."','extreme',0,".$max_neg_blade.",'".$date_neg_blade."','active', 1);";
            $email_data[$argv[3]]['Blade']['neg'] = [$max_neg_blade, $date_neg_blade];
            if ($conn->query($sqlAlertsNegative) === TRUE) {
                //echo ".";
            }else {
                //echo $sql."\n";;
            }
        }
    }

    if($max_pos_tower >= 70){

        $sqlAlertsPositiveSelect = "SELECT * FROM smartdata_calculed_data.alerts WHERE idclient = ".$argv[1]." and windfarm = '".$windfarm_name."' and idwfarm = '".$argv[2]."' and model = '".$turbine."' and wtg = ".$argv[3]." and idcomponent = '".$max_tower->getComponent()."' and component = '".$max_tower->getName()."' and type = 'extreme' and positive = 1 and value = ".$max_pos_tower." and datetime = '".$date_pos_tower."';";
        $result = $conn->query($sqlAlertsPositiveSelect);

        if($result->num_rows == 0){
            $sqlAlertsPositive = "INSERT * INTO smartdata_calculed_data.alerts (idclient, windfarm, idwfarm, model, wtg, idcomponent,component, type, positive, value, datetime, status, new) VALUES (".$argv[1].", '".$windfarm_name."', '".$argv[2]."', '".$turbine."', ".$argv[3].", '".$max_tower->getComponent()."', '".$max_tower->getName()."','extreme',1,".$max_pos_tower.",'".$date_pos_tower."','active', 1);";
            $email_data[$argv[3]]['Tower']['pos'] = [$max_pos_tower, $date_pos_tower];
            if ($conn->query($sqlAlertsPositive) === TRUE) {
                //echo ".";
            }else {
                //echo $sql."\n";;
            }
        }
    }


    echo json_encode($email_data);
    
    $conn->close();

    function calcMachineExtreme($windfarm,$machine,$turbine,$components){
        $mogoconn = new MongoDB\Driver\Manager('mongodb+srv://AtlasNWH:Nablawindp0wer@smartdata.k62sl.mongodb.net/?ssl=true&authSource=admin&serverSelectionTryOnce=false&serverSelectionTimeoutMS=15000');
        
        $data = ['last' => null, 'month' => null, 'design' => ['component' => null, 'bolts' => null]];
        $lastDate = null;

        $q = [
            'extreme_data' => [
                '$ne' => NULL
            ],
            'extreme_data_bolts' => [
                '$ne' => NULL
            ]
        ];
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

        if((in_array($windfarm,['RM', 'PF', 'CCROES', 'OUROL']))){
            $q = [
                'extreme_data' => [
                    '$ne' => NULL
                ]
            ];
        }

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
        
        foreach ($rows as $document) {
            $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
            if((in_array($windfarm,['RM', 'PF', 'CCROES', 'OUROL']))){
                $data['last'] = [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data];
            }
            else{
                $data['last'] = [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data, $document->extreme_data_bolts];
            }
            $lastDate = date("d-m-Y H:i", ($a / 1000) );
        }
        
        $date=date('d-m-Y', strtotime('-4 week', strtotime($lastDate)));
        $date = new DateTime($date);
        $q = [
            'DateTime' => [
                '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)
            ]
        ];
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

        if((in_array($windfarm,['RM', 'PF', 'CCROES', 'OUROL']))){
            $o = [
                'projection' => [
                    'DateTime' => '$DateTime',
                    'extreme_data' => '$extreme_data',
                    '_id' => 0
                ],
                'sort' => [
                    'DateTime' => 1
                ]
            ];
        }

        $query = new MongoDB\Driver\Query($q, $o);
        $rows = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Extreme', $query);
        
        $monthVals = [];
        foreach ($rows as $document) {
            $a = json_decode(str_replace('$','',json_encode($document->DateTime)))->date->numberLong;
            if((in_array($windfarm,['RM', 'PF', 'CCROES', 'OUROL']))){
                array_push($monthVals, [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data]);
            }
            else{
                array_push($monthVals, [date("d-m-Y H:i", ($a / 1000) ), $document->extreme_data, $document->extreme_data_bolts]);
            }
        }
        
        $data['month'] = $monthVals;

/*         $q = [
            '_id' => 'v20210831_xtr'
        ];
        
        if($windfarm == 'CCROES' || $windfarm == 'OUROL'){
            $q = [
                '_id' => 'v20221128_xtr'
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
            '_id' => $idXtr
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

        $nnvars = ['var42','var44','var45','var46','var47','var48','var49','var50','var51','var52','var53'];
        
        foreach ($components as $component){
            $vars_data = [];
            foreach ($component->getVars() as $var){
                $f = substr($data['last'][0],6,4)."-".substr($data['last'][0],3,2)."-".substr($data['last'][0],0,2)." ".substr($data['last'][0],11,5);
                $best_data = ['lpv' => [$f,null], 'lnv' => [$f,null], 'dpv' => [null,null], 'dnv' => [null,null], 'wpv' => [null,null], 'wnv' => [null,null], 'mpv' => [null,null], 'mnv' => [null,null]];

                if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                    $valDesign = $data['design']['bolts'][$var];
                    $valLast = ((array) $data['last'][2])[$var];
                }else{
                    $valDesign = $data['design']['component'][$var];
                    $valLast = ((array) $data['last'][1])[$var];
                }
                $calcPos = $valLast[0] * 100 / $valDesign[0];
        
                if($valLast[1] * $valDesign[1] > 0){
                    $calcNeg = abs($valLast[1]) * 100 / abs($valDesign[1]);
                }else{
                    $calcNeg = 0;
                }
        
                if($best_data['lpv'][1] == null || $best_data['lpv'][1] < $calcPos){
                    $best_data['lpv'][1] = $calcPos;
                }
                if(($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || (!in_array($var, $nnvars) && ($best_data['lnv'][1] == null || $best_data['lpv'][1] < $calcNeg))){
                    $best_data['lnv'][1] = $calcNeg;
                }

                foreach ($data['month'] as $day){
                    if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                        $valDesign = $data['design']['bolts'][$var];
                        $valLast = ((array) $day[2])[$var];
                    }else{
                        $valDesign = $data['design']['component'][$var];
                        $valLast = ((array) $day[1])[$var];
                    }
                    
                    $calcPos = $valLast[0] * 100 / $valDesign[0];
        
                    if($valLast[1] * $valDesign[1] > 0){
                        $calcNeg = abs($valLast[1]) * 100 / abs($valDesign[1]);
                    }else{
                        $calcNeg = 0;
                    }
            
                    $date=date('d-m-Y', strtotime('-1 day', strtotime($data['last'][0])));
                    if(strtotime($day[0]) > strtotime($date)){
                        if($best_data['dpv'][1] == null || $best_data['dpv'][1] < $calcPos){
                            $best_data['dpv'][0] = substr($day[0],6,4)."-".substr($day[0],3,2)."-".substr($day[0],0,2)." ".substr($day[0],11,5);
                            $best_data['dpv'][1] = $calcPos;
                        }
                        if(($best_data['dnv'][1] == null || $best_data['dnv'][1] < $calcNeg) && (($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var, $nnvars))){
                            $best_data['dnv'][0] = substr($day[0],6,4)."-".substr($day[0],3,2)."-".substr($day[0],0,2)." ".substr($day[0],11,5);
                            $best_data['dnv'][1] = $calcNeg;
                        }
                    }
        
                    $date=date('d-m-Y', strtotime('-1 week', strtotime($data['last'][0])));
                    if(strtotime($day[0]) > strtotime($date)){
                        if($best_data['wpv'][1] == null || $best_data['wpv'][1] < $calcPos){
                            $best_data['wpv'][0] = substr($day[0],6,4)."-".substr($day[0],3,2)."-".substr($day[0],0,2)." ".substr($day[0],11,5);
                            $best_data['wpv'][1] = $calcPos;
                        }
                        if(($best_data['wnv'][1] == null || $best_data['wnv'][1] < $calcNeg) && (($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var, $nnvars))){
                            $best_data['wnv'][0] = substr($day[0],6,4)."-".substr($day[0],3,2)."-".substr($day[0],0,2)." ".substr($day[0],11,5);
                            $best_data['wnv'][1] = $calcNeg;
                        }
                    }
        
                    if($best_data['mpv'][1] == null || $best_data['mpv'][1] < $calcPos){
                        $best_data['mpv'][0] = substr($day[0],6,4)."-".substr($day[0],3,2)."-".substr($day[0],0,2)." ".substr($day[0],11,5);
                        $best_data['mpv'][1] = $calcPos;
                    }
                    if(($best_data['mnv'][1] == null || $best_data['mnv'][1] < $calcNeg) && (($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') || !in_array($var, $nnvars))){
                        $best_data['mnv'][0] = substr($day[0],6,4)."-".substr($day[0],3,2)."-".substr($day[0],0,2)." ".substr($day[0],11,5);
                        $best_data['mnv'][1] = $calcNeg;
                    }
                }

                $best_data['lpv'][1] = intval($best_data['lpv'][1]);
                $best_data['dpv'][1] = intval($best_data['dpv'][1]);
                $best_data['wpv'][1] = intval($best_data['wpv'][1]);
                $best_data['mpv'][1] = intval($best_data['mpv'][1]);

                if($best_data['lpv'][1] < 0){
                    $best_data['lpv'][1] = 0;
                }
                if($best_data['dpv'][1] < 0){
                    $best_data['dpv'][1] = 0;
                }
                if($best_data['wpv'][1] < 0){
                    $best_data['wpv'][1] = 0;
                }
                if($best_data['mpv'][1] < 0){
                    $best_data['mpv'][1] = 0;
                }
                
                if($best_data['lnv'][1] != null){
                    $best_data['lnv'][1] = intval($best_data['lnv'][1]);
                }
                if($best_data['lnv'][1] < 0){
                    $best_data['lnv'][1] = 0;
                }
                if($best_data['dnv'][1] != null){
                    $best_data['dnv'][1] = intval($best_data['dnv'][1]);
                }
                if($best_data['dnv'][1] < 0){
                    $best_data['dnv'][1] = 0;
                }
                if($best_data['wnv'][1] != null){
                    $best_data['wnv'][1] = intval($best_data['wnv'][1]);
                }
                if($best_data['wnv'][1] < 0){
                    $best_data['wnv'][1] = 0;
                }
                if($best_data['mnv'][1] != null){
                    $best_data['mnv'][1] = intval($best_data['mnv'][1]);
                }
                if($best_data['mnv'][1] < 0){
                    $best_data['mnv'][1] = 0;
                }

                $vars_data[$var] = $best_data;
            }

            $component->setVars($vars_data);
        }

        return $components;
    }
?>
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

/*     $servername = "192.168.61.53";
    $username = "smartdata";
    $password = "Sm4rtDat0K,.<2saq";
    $dbname = "smartdata_client_2"; */

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

    $sql = "SELECT component.*, IFNULL(component.order, 999) AS 'nOrder', fatigue_variables.variable_analytics, (SELECT CONCAT('[',GROUP_CONCAT(wohler_parameter),']') FROM smartdata_app.wohler_parameters WHERE idcomponent = component.idcomponent AND variable = fatigue_variables.variable AND idwtgmodel = component.idwtgmodel) AS m, wtg_component.component_installation_date, wtg_component.design_time_to_service, IFNULL((SELECT revision FROM component_revisions WHERE idwfarm = '".$argv[2]."' AND wtg_number = ".$argv[3]." AND component_id = component.idcomponent), '2021-06-10') AS last_revision FROM smartdata_app.component INNER JOIN smartdata_app.fatigue_variables ON fatigue_variables.idwtgmodel = component.idwtgmodel AND fatigue_variables.idcomponent = component.idcomponent INNER JOIN wtg_component ON wtg_component.idwfarm = '".$argv[2]."' AND wtg_component.wtg_number = ".$argv[3]." AND wtg_component.component_id = component.idcomponent WHERE component.idwtgmodel = (SELECT turbine_model FROM cell WHERE idwfarm = '".$argv[2]."' AND idcell = (SELECT idcell FROM wtg WHERE idwfarm = '".$argv[2]."' AND wtg_number = ".$argv[3].")) AND component.idcomponent != 'drive_t_brake' order by nOrder , component.idcomponent asc;";
    $result = $conn->query($sql);

    $components = [];
    $comp = "";
    $vars = [];
    $turbine = "";
    $nc = new Component(null,null,null,null,null,null,null,null,null,null,null);
    $minDate = null;
    $maxDate = null;
    if($result->num_rows > 0){
        while ($component = $result->fetch_assoc()) {
            $turbine = $component['idwtgmodel'];
            if($component['idcomponent'] != $comp && $comp != ""){
                array_push($components, $nc);
                $vars = [];
            }
            $comp = $component['idcomponent'];
            $order = $component['nOrder'];
            array_push($vars, [$component['variable_analytics'],json_decode($component['m'])]);
            $nc = new Component($component['idcomponent'],$component['name'],$component['location'],$component['position'],$component['src'],$order,$vars,$component['component_installation_date'],$component['failure'],$component['preventive'],$component['ndt']);
            $nc->setTts($component['design_time_to_service']);
            $nc->setRevision($component['last_revision']);
            if($minDate == null || $component['last_revision'] < $minDate){
                $minDate = $component['last_revision'];
            }
            if($maxDate == null || $component['last_revision'] > $maxDate){
                $maxDate = $component['last_revision'];
            }
        }
    }
    array_push($components, $nc);
    //var_dump(calcMachineFatigue($argv[2],$argv[3],$turbine,$components,$minDate,$maxDate,$argv[1]));

    $start = microtime(true);
    $cont = 0;
    $cont_blade = 0;
    $min_years_blade = 40;
    $insert_blade = false;
    $cont_tower = 0;
    $min_years_tower = 40;
    $insert_tower = false;
    foreach (calcMachineFatigue($argv[2],$argv[3],$turbine,$components,$minDate,$maxDate,$argv[1]) as $comp){
        if(str_contains($comp->getComponent(), 'bld')){
            $cont_blade++;
        }
        if(str_contains($comp->getComponent(), 'twr')){
            $cont_tower++;
        }
        $alertType = null;
        $min_years = 40;
        $vars = $comp->getVars()[0];
        $raw_installDate = $comp->getInstalldate();
        $installDate = substr($comp->getInstalldate(),6,4)."-".substr($comp->getInstalldate(),3,2)."-".substr($comp->getInstalldate(),0,2);
        //strtotime -1year y comparar con instalación. Comparar date normal da error
        $currentDate = strtotime('-1 year', strtotime(date("Y-m-d")));
        foreach (array_keys($vars) as $varkey){
            foreach (array_keys($vars[$varkey]) as $wohlerkey){
                if($vars[$varkey][$wohlerkey][6] == null){$vars[$varkey][$wohlerkey][6] = "NULL";}
                if($currentDate < strtotime($installDate)){
                    $vars[$varkey][$wohlerkey][0] = 20;
                }
                $sql = "INSERT INTO smartdata_calculed_data.life VALUES (".$argv[1].",'".$argv[2]."',".$argv[3].",'".$comp->getComponent()."','".$varkey."',".$wohlerkey.",0,'".$comp->getName()."','".$comp->getLocation()."','".$comp->getPosition()."',".$comp->getOrder().",".$vars[$varkey][$wohlerkey][0].",'".$installDate."','".$comp->getRevision()."',".$comp->getTts().",".$vars[$varkey][$wohlerkey][2].",'".$vars[$varkey][$wohlerkey][3]."',".$vars[$varkey][$wohlerkey][5].",'".$vars[$varkey][$wohlerkey][1]."',".$vars[$varkey][$wohlerkey][6].",".$vars[$varkey][$wohlerkey][7].",".$vars[$varkey][$wohlerkey][4].") ON DUPLICATE KEY UPDATE expectancy = ".$vars[$varkey][$wohlerkey][0].", installation = '".$installDate."', revision = '".$comp->getRevision()."', oem = ".$comp->getTts().", tts = ".$vars[$varkey][$wohlerkey][2].", tts_date = '".$vars[$varkey][$wohlerkey][3]."', last = ".$vars[$varkey][$wohlerkey][5].", last_date = '".$vars[$varkey][$wohlerkey][1]."', past = ".$vars[$varkey][$wohlerkey][6].", rev = ".$vars[$varkey][$wohlerkey][7].", design = ".$vars[$varkey][$wohlerkey][4].";";
                //echo $sql;

                if ($conn->query($sql) === TRUE) {
                    echo ".";
                }else {
                    //echo $sql."\n";;
                }
                $cont++;

                $today = new DateTime( date( 'Y-m-d' ) );
                $ttf = $today->diff( new DateTime( $installDate ) );

                $years = $ttf->format('%y');
                $expectancy = $vars[$varkey][$wohlerkey][0];
                $years = $expectancy-$years;

                if($years < $min_years){
                    $min_years = $years;
                    if($years <= ($comp->getNdt() + $comp->getPreventive() + $comp->getFailure())){
                        $alertType = 'ndt';
                        if($years <= ($comp->getPreventive() + $comp->getFailure())){
                            $alertType = 'preventive';
                            if($years <= $comp->getFailure()){
                                $alertType = 'failure';
                            }
                        }
                    }
                }
            }
        }

        $vars = $comp->getVars()[1];
        foreach (array_keys($vars) as $varkey){
            foreach (array_keys($vars[$varkey]) as $wohlerkey){
                if($vars[$varkey][$wohlerkey][6] == null){$vars[$varkey][$wohlerkey][6] = "NULL";}
                if($currentDate < strtotime($installDate)){
                    $vars[$varkey][$wohlerkey][0] = 20;
                }
                $sql = "INSERT INTO smartdata_calculed_data.life VALUES (".$argv[1].",'".$argv[2]."',".$argv[3].",'".$comp->getComponent()."','".$varkey."',".$wohlerkey.",1,'".$comp->getName()."','".$comp->getLocation()."','".$comp->getPosition()."',".$comp->getOrder().",".$vars[$varkey][$wohlerkey][0].",'".$installDate."','".$comp->getRevision()."',".$comp->getTts().",".$vars[$varkey][$wohlerkey][2].",'".$vars[$varkey][$wohlerkey][3]."',".$vars[$varkey][$wohlerkey][5].",'".$vars[$varkey][$wohlerkey][1]."',".$vars[$varkey][$wohlerkey][6].",".$vars[$varkey][$wohlerkey][7].",".$vars[$varkey][$wohlerkey][4].") ON DUPLICATE KEY UPDATE expectancy = ".$vars[$varkey][$wohlerkey][0].", installation = '".$installDate."', revision = '".$comp ->getRevision()."', oem = ".$comp->getTts().", tts = ".$vars[$varkey][$wohlerkey][2].", tts_date = '".$vars[$varkey][$wohlerkey][3]."', 	last = ".$vars[$varkey][$wohlerkey][5].", last_date = '".$vars[$varkey][$wohlerkey][1]."', past = ".$vars[$varkey][$wohlerkey][6].", rev = ".$vars[$varkey][$wohlerkey][7].", design = ".$vars[$varkey][$wohlerkey][4].";";
                //echo $sql;

                if ($conn->query($sql) === TRUE) {
                    //echo ".";
                }else {
                    //echo $sql."\n";;
                }
                $cont++;
            }
        }

        switch($alertType){
            case 'ndt':
                $years -= 4;
                break;
            case 'preventive':
                $years -= 2;
                break;
        }

        if($alertType != null){
            if(str_contains($comp->getComponent(), 'bld')){
                if($years < $min_years_blade){
                    $insert_blade = true;
                    $min_years_blade = $years;
                    $min_blade = $comp; 
                    $alertType_blade = $alertType;
                    $vars_blade = $vars;
                    $varkey_blade = $varkey;
                    $wohlerkey_blade = $wohlerkey;
                    $turbine_blade = $turbine;
                }
            }
            if(str_contains($comp->getComponent(), 'twr')){
                if($years < $min_years_tower){
                    $insert_tower = true;
                    $min_years_tower = $years;
                    $min_tower = $comp; 
                    $alertType_tower = $alertType;
                    $vars_tower = $vars;
                    $varkey_tower = $varkey;
                    $wohlerkey_tower = $wohlerkey;
                    $turbine_tower = $turbine;
                }
            }
            if(!str_contains($comp->getComponent(), 'bld') && !str_contains($comp->getComponent(), 'twr') && $comp->getComponent() != 'gearbox'){
                insertAlert($conn, $argv, $windfarm_name, $comp, $turbine, $alertType, $years, $vars, $varkey, $wohlerkey);
            }
        }
    }

    if($cont_blade == 11 && $insert_blade){
        insertAlert($conn, $argv, $windfarm_name, $min_blade, $turbine_blade, $alertType_blade, $min_years_blade, $vars_blade, $varkey_blade, $wohlerkey_blade);
    }

    if($cont_tower == 10 && $insert_tower){
        insertAlert($conn, $argv, $windfarm_name, $min_tower, $turbine_tower, $alertType_tower, $min_years_tower, $vars_tower, $varkey_tower, $wohlerkey_tower);
    }

    echo(microtime(true) - $start)."\n";
    echo $cont;
    
    $conn->close();

    function insertAlert($conn, $argv, $windfarm_name, $comp, $turbine, $alertType, $years, $vars, $varkey, $wohlerkey){

        $sqlAlerts = "SELECT * FROM smartdata_calculed_data.alerts WHERE idclient = ".$argv[1]." and idwfarm = '".$argv[2]."' and wtg = ".$argv[3]." and idcomponent = '".$comp->getComponent()."' and type != 'extreme';";
        $result = $conn->query($sqlAlerts);

        while ($row = $result->fetch_assoc()) {
            $idAlert = $row['idalert'];
        }

        if($result->num_rows == 0){
            $sqlAlerts = "INSERT INTO smartdata_calculed_data.alerts (idclient, windfarm, idwfarm, model, wtg, idcomponent, component, type, value, datetime, status, new) VALUES (".$argv[1].", '".$windfarm_name."', '".$argv[2]."', '".$turbine."', ".$argv[3].", '".$comp->getComponent()."', '".$comp->getName()."', '".$alertType."','".$years."','".$vars[$varkey][$wohlerkey][1]."','active', 1) ON DUPLICATE KEY UPDATE type = '".$alertType."', value = '".$years."', datetime = '".$vars[$varkey][$wohlerkey][1]."';";
            if ($conn->query($sqlAlerts) === TRUE) {
                //echo ".";
            }else {
                echo $sqlAlerts."\n";;
            }
        }
        else{
            $sqlAlerts = "UPDATE smartdata_calculed_data.alerts SET type = '".$alertType."' WHERE idalert = ".$idAlert."";
            $conn->query($sqlAlerts);
            $sqlAlerts = "UPDATE smartdata_calculed_data.alerts SET value = '".$years."' WHERE idalert = ".$idAlert." ";
            $conn->query($sqlAlerts);
            $sqlAlerts = "UPDATE smartdata_calculed_data.alerts SET datetime = '".$vars[$varkey][$wohlerkey][1]."' WHERE idalert = ".$idAlert." ";
            $conn->query($sqlAlerts);
        }
    }

    function calcMachineFatigue($windfarm,$machine,$turbine,$components,$minDate,$maxDate,$client){
        $data = ['last' => null, 'past' => null, 'revision' => null, 'design' => ['component' => null, 'bolts' => null]];
        $lastDataDate = date("Y-m-").(date("d")-2);

        $mogoconn = new MongoDB\Driver\Manager('mongodb+srv://AtlasNWH:Nablawindp0wer@smartdata.k62sl.mongodb.net/?ssl=true&authSource=admin&serverSelectionTryOnce=false&serverSelectionTimeoutMS=15000');
        //$mogoconn = new MongoDB\Driver\Manager('mongodb://172.30.70.249');
        
        $q = [
            'accumulatedEst_fatigue' => [
                '$ne' => NULL
            ],
            'accumulatedBoltsEst_fatigue' => [
                '$ne' => NULL
            ]
        ];

        if(in_array($windfarm,['RM', 'PF', 'CCROES', 'OUROL'])){
            $q = [
                'accumulatedEst_fatigue' => [
                    '$ne' => NULL
                ]
            ];
        }

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
            $lastDataDate = date("Y-m-d H:i", ($a / 1000) );
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['last'] = $document;
        }

        $date=date('Y-m-d', strtotime('-1 year'));
        $date = new DateTime($date);
        $date->modify('+1 day');
        $q = [
            '_id' => [
                '$lte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)
            ]
        ];
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
            '$and' => [
                [
                    '_id' => [
                        '$gte' => new MongoDB\BSON\UTCDateTime(strtotime($minDate) * 1000)
                    ]
                ],
                [
                    '_id' => [
                        '$lte' => new MongoDB\BSON\UTCDateTime((strtotime($maxDate) + 82800) * 1000)
                    ]
                ]
            ]
        ];
        $o = [
            'projection' => [
                '_id' => '$_id',
                'accumulatedEst_fatigue' => '$accumulatedEst_fatigue',
                'accumulatedBoltsEst_fatigue' => '$accumulatedBoltsEst_fatigue'
            ],
            'sort' => [
                '_id' => -1
            ]
        ];

        $query = new MongoDB\Driver\Query($q, $o);
        $rows   = $mogoconn->executeQuery($windfarm.'.'.$machine.'_Fatigue', $query);
        foreach ($rows as $document) {
            $t = json_decode(json_encode($document), true)['_id'];
            $a = json_decode(str_replace('$','',json_encode($t)))->date->numberLong;
            $d = date("d-m-Y", ($a / 1000) );
            $d = substr($d,6,4)."-".substr($d,3,2)."-".substr($d,0,2);
            $document = json_decode(json_encode($document), true);
            unset($document["_id"]);
            unset($document["notas"]);
            $data['revision'][$d] = $document;
        }
        //var_dump($data['revision']);



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
        
        $wollerPositions = [4 => 0, 5 => 1, 7 => 2, 8 => 3, 9 => 4, 10 => 5, 14 => 6];

        //$lastDataDate=substr($lastDataDate,6,4)."-".substr($lastDataDate,3,2)."-".substr($lastDataDate,0,2);
        foreach($components as $component) {
            //Dentro del bucle se component sacar la pos
/*             if($component->getComponent() == 'mounting'){
                $mountingPosition = count($components)-1;
            }

            if($component->getComponent() == 'main_f'){
                $main_fPosition = count($components)-1;
            } */

            $componentDate = date_create_from_format('Y-m-d', date("Y-m-d",strtotime($component->getInstalldate())));
            $currentDate = date_create_from_format('Y-m-d', date('Y-m-d'));
            $datediff = date_diff($currentDate, $componentDate)->days/365;
            
            $fatigueVal = 40;
            $fatigueVal2 = 40;            
            $tts = 20;
            $date1 = date_create_from_format('Y-m-d', $component->getRevision());
            $date2 = date_create_from_format('Y-m-d', date('Y-m-d'));
            $diff = (array) date_diff($date1, $date2);
            $ddiff = round($diff['y'] + ($diff['m'] * 100 / 12) / 100, 1);
            $variables = [];
            $valDesign = [];
            $valLast = [];
            $valPast = [];
            $valRevision = [];
            foreach ($component->getVars() as $var){
                foreach($var[1] as $woller){
                    if((($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts') && array_key_exists('accumulatedBoltsEst_fatigue', $data['last']) || array_key_exists('accumulatedEst_fatigue', $data['last']))){
                        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                            if($woller == 3){
                                $valDesign = $data['design']['bolts'][$var[0]][0];
                                $valLast = $data['last']['accumulatedBoltsEst_fatigue'][$var[0]][0];
                                $valPast = $data['past']['accumulatedBoltsEst_fatigue'][$var[0]][0];
                                $valRevision = $data['revision'][$component->getRevision()]['accumulatedBoltsEst_fatigue'][$var[0]][0];
                            }else{
                                $valDesign = $data['design']['bolts'][$var[0]][1];
                                $valLast = $data['last']['accumulatedBoltsEst_fatigue'][$var[0]][1];
                                $valPast = $data['past']['accumulatedBoltsEst_fatigue'][$var[0]][1];
                                $valRevision = $data['revision'][$component->getRevision()]['accumulatedBoltsEst_fatigue'][$var[0]][1];
                            }
                        }else{
                            $valDesign = $data['design']['component'][$var[0]][$wollerPositions[$woller]];
                            $valLast = $data['last']['accumulatedEst_fatigue'][$var[0]][$wollerPositions[$woller]];
                            $valPast = $data['past']['accumulatedEst_fatigue'][$var[0]][$wollerPositions[$woller]];
                            $valRevision = $data['revision'][$component->getRevision()]['accumulatedEst_fatigue'][$var[0]][$wollerPositions[$woller]];
                        }
    
                        $calc = ( ( pow($valDesign,$woller)/pow($valLast,$woller) ) * $datediff );
                        if($calc < $fatigueVal){
                            $fatigueVal = $calc;
                        }
    
                        $fda = $valDesign * pow(($component->getTts()/20), (1/$woller));
                        $fdpr = pow((pow($valRevision,$woller) + pow($fda,$woller)),(1/$woller));
                        if($valLast == $valRevision){
                            $ftts = $tts;
                        }else{
                            $ftts = ((pow($fdpr,$woller) - pow($valRevision,$woller))/(pow($valLast,$woller) - pow($valRevision,$woller))) * $ddiff;
                        }
                        if($ftts < $tts){
                            $tts = $ftts;
                        }
    
                        if($fatigueVal > 40){
                            $fatigueVal = 40;
                        }else{
                            $fatigueVal = round($fatigueVal, 1);
                        }
            
                        if($tts > 2 * $component->getTts()){
                            $tts = 2 * $component->getTts();
                        }else{
                            $tts = round($tts, 1);
                        }
            
                        $ttdate=date('d-m-Y', strtotime($component->getRevision()));
                        $ttdate = new DateTime($ttdate);
                        $ttdate->modify('+'.intval($tts * 365).' day');
                        $ttdate=$ttdate->format('d-m-Y');
                        $ttdate=substr($ttdate,6,4)."-".substr($ttdate,3,2)."-".substr($ttdate,0,2);
    
                        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                            if($woller == 3){
                                $variables[0][$var[0]][3] = [$fatigueVal,$lastDataDate,$tts,$ttdate,$valDesign,$valLast,null,$valRevision];
                            }else{
                                $variables[0][$var[0]][5] = [$fatigueVal,$lastDataDate,$tts,$ttdate,$valDesign,$valLast,null,$valRevision];
                            }
                        }else{
                            $variables[0][$var[0]][$woller] = [$fatigueVal,$lastDataDate,$tts,$ttdate,$valDesign,$valLast,null,$valRevision];
                        }
    
                        if($valLast == $valRevision){
                            $calc = $fatigueVal2;
                        }else if($datediff < 1 || date_diff(date_create_from_format('Y-m-d', date("Y-m-d",strtotime($lastDataDate))), $componentDate)->days/365 < 1){
                            $calc = ( ( pow($valDesign,$woller)/pow($valLast,$woller) ) * $datediff );
                        }else{
                            $calc = ( ( (pow($valDesign,$woller)-pow($valPast,$woller))/(pow($valLast,$woller)-pow($valPast,$woller)) ) * 1 + ($datediff - 1) );
                        }
    
                        if($calc < $fatigueVal2){
                            $fatigueVal2 = $calc;
                        }
    
                        $fda = $valDesign * pow(($component->getTts()/20), (1/$woller));
                        $fdpr = pow((pow($valRevision,$woller) + pow($fda,$woller)),(1/$woller));
                        if($valLast == $valRevision){
                            $ftts = $tts;
                        }else{
                            $ftts = ((pow($fdpr,$woller) - pow($valRevision,$woller))/(pow($valLast,$woller) - pow($valRevision,$woller))) * $ddiff;
                        }
                        if($ftts < $tts){
                            $tts = $ftts;
                        }
    
                        if($fatigueVal2 > 40){
                            $fatigueVal2 = 40;
                        }else{
                            $fatigueVal2 = round($fatigueVal2, 1);
                        }
            
                        if($tts > 2 * $component->getTts()){
                            $tts = 2 * $component->getTts();
                        }else{
                            $tts = round($tts, 1);
                        }
            
                        $ttdate=date('d-m-Y', strtotime($component->getRevision()));
                        $ttdate = new DateTime($ttdate);
                        $ttdate->modify('+'.intval($tts * 365).' day');
                        $ttdate=$ttdate->format('d-m-Y');
                        $ttdate=substr($ttdate,6,4)."-".substr($ttdate,3,2)."-".substr($ttdate,0,2);
    
                        if($component->getComponent() == 'tower_top_j_bolts' || $component->getComponent() == 'foundation_j_bolts' || $component->getComponent() == 'root_j_bolts'){
                            if($woller == 3){
                                $variables[1][$var[0]][3] = [$fatigueVal2,$lastDataDate,$tts,$ttdate,$valDesign,$valLast,$valPast,$valRevision];
                            }else{
                                $variables[1][$var[0]][5] = [$fatigueVal2,$lastDataDate,$tts,$ttdate,$valDesign,$valLast,$valPast,$valRevision];
                            }
                        }else{
                            $variables[1][$var[0]][$woller] = [$fatigueVal2,$lastDataDate,$tts,$ttdate,$valDesign,$valLast,$valPast,$valRevision];
                        }
                    }
                }
            }
            $component->setVars($variables);
        }
        return $components;
    }
?>
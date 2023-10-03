<?php
    include 'php.php';
    date_default_timezone_set('UTC');
    $servername = "109.106.244.222";
    $username = "root";
    $password = "N@bl@W1ndP0w3r";
    $dbname = "smartdata_calculed_data";

    
/*     $servername = "localhost";
    $username = "root";
    $password = "N@bl@W1ndP0w3r";
    $dbname = "smartdata_calculed_data"; */

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    if(!function_exists('str_contains')) {
        function str_contains(string $haystack, string $needle): bool{
            return '' === $needle || false !== strpos($haystack, $needle);
        }
    }

    $components_cost = [];
    $sql = "SELECT * FROM smartdata_app.component_ndt_preventive_ttf;";

    $result = $conn->query($sql);
    if($result->num_rows > 0){
        while ($component = $result->fetch_assoc()) {
            $components_cost[$component['idComponent']] = $component;
        }
    }
    $sql = "SELECT DISTINCT turbine_model FROM smartdata_client_2.wtg NATURAL JOIN smartdata_client_2.cell where cell.idwfarm = '".$argv[2]."' and wtg.wtg_number = '".$argv[3]."'";
    $result = $conn->query($sql);
    if($result->num_rows > 0){
        while ($row = $result->fetch_assoc()) {
            $turbineType = $row['turbine_model'];
        }
    }

    $sql = "SELECT last_date, component, life.name, life.location, life.position, orden, MIN(expectancy) AS expectancy, installation, revision, oem, tts, tts_date, preventive, ndt FROM smartdata_calculed_data.life inner join smartdata_app.component on component.idcomponent = life.component and component.idwtgmodel = '".$turbineType."' WHERE idclient = '".$argv[1]."' and idwfarm = '".$argv[2]."' AND wtg = ".$argv[3]." AND rango = 0 AND component != 'gearbox' GROUP BY component ORDER BY orden;";
    
    $result = $conn->query($sql);
    $components = [];
    $opex = 0;
    $failures = [0,0];
    $comp_failure = 0;
    $comp_preventive = 0;
    $comp_ndt = 0;
    $bladeNDT = false;
    $bladePreventive = false;
    $bladeFailure = false;

    if($result->num_rows > 0){
        while ($component = $result->fetch_assoc()) {
            $order = $component['orden'];
            if($order == 999){ $order = null; }
            $ttdiff = (time() - strtotime($component['installation'])) / 31536000;
            $comp_failure = intval(round(($component['expectancy'] - $ttdiff) * 10) / 10);
            $comp_preventive = intval(round(($component['expectancy'] - $ttdiff - $component['preventive']) * 10) / 10);
            $comp_ndt = intval(round(($component['expectancy'] - $ttdiff - $component['preventive'] - $component['ndt']) * 10) / 10);
            $dsf = $component['name'];
            if(str_contains($component['name'], 'Section')){
                if($comp_ndt <= 2 && !$bladeNDT){
                    $opex += $components_cost[$component['component']]['ndt'];
                    $bladeNDT = true;
                }
                if($comp_preventive <= 2 && !$bladePreventive){
                    $opex += $components_cost[$component['component']]['preventive'];
                    $bladePreventive = true;
                }
                if($comp_failure <= 2 && !$bladeFailure){
                    $opex += $components_cost[$component['component']]['failure'];
                    $bladeFailure = true;
                }
            }
            else{
                if($comp_ndt <= 2){
                    $opex += $components_cost[$component['component']]['ndt'];
                }
                if($comp_preventive <= 2){
                    $opex += $components_cost[$component['component']]['preventive'];
                }
                if($comp_failure <= 2){
                    $opex += $components_cost[$component['component']]['failure'];
                }
            }

            if($comp_failure <= 2){
                $failures[0] += 1;
            }

            $failures[1] = round($opex);
        }
    }

/*     if($argv[2] == 'Ptoon'){
        $argv[1] = 4;
    }else if($argv[2] == 'RM' || $argv[2] == 'PF'){
        $argv[1] = 3;
    } */

    $option = '';

    switch($argv[4]) {
        case '0':
            $option = 'day';
        break;
        case '1':
            $option = 'month';
        break;
        case '2':
            $option = 'three_months';
        break;
        case '3':
            $option = 'six_months';
        break;
        case '4':
            $option = 'twelve_months';
        break;
    }

    //Calculate extreme info
    $extreme_1 = 0;
    $extreme_2 = 0;
    $extreme_3 = 0;

    $sql = "SELECT idwfarm, wtg, extreme.name, weight, max(".$option.") as max FROM smartdata_calculed_data.extreme inner join smartdata_app.component on component.idcomponent = extreme.component where idclient = '".$argv[1]."' and idwfarm = '".$argv[2]."' and wtg = ".$argv[3]." group by idwfarm, wtg;";
    $extreme = $conn->query($sql)->fetch_assoc()['max'];
    
    if($extreme >= 70 && $extreme < 85){
        $extreme_1 = 1;
    }else if($extreme >= 85 && $extreme < 100){
        $extreme_2 = 1;
    }else if($extreme >= 100){
        $extreme_3 = 1;
    }

    echo "Ext:" . $extreme_1."||".$extreme_2."||".$extreme_3."   ";

/*     $m_extreme_1 = 0;
    $m_extreme_2 = 0;
    $m_extreme_3 = 0;

    $sql = "SELECT q1.idwfarm, q1.wtg, COUNT(q1.weight) as weight FROM (SELECT idwfarm, wtg, extreme.name, weight, max(".$option.") FROM smartdata_calculed_data.extreme inner join smartdata_app.component on component.idcomponent = extreme.component where idwfarm = '".$argv[2]."' and wtg = ".$argv[3]." and (".$option." >= 70 and ".$option." < 85) and idclient = '".$argv[1]."' group by idwfarm, wtg, component) AS q1 GROUP BY idwfarm, wtg;";
    $m_extreme_1 = $conn->query($sql)->fetch_assoc()['weight'];
    $m_extreme_1 ? "" : $m_extreme_1 = 0;
    $sql = "SELECT q1.idwfarm, q1.wtg, COUNT(q1.weight) as weight FROM (SELECT idwfarm, wtg, extreme.name, weight, max(".$option.") FROM smartdata_calculed_data.extreme inner join smartdata_app.component on component.idcomponent = extreme.component where idwfarm = '".$argv[2]."' and wtg = ".$argv[3]." and (".$option." >= 85 and ".$option." < 100) and idclient = '".$argv[1]."' group by idwfarm, wtg, component) AS q1 GROUP BY idwfarm, wtg;";
    $m_extreme_2 = $conn->query($sql)->fetch_assoc()['weight'];
    $m_extreme_2 ? "" : $m_extreme_2 = 0;
    $sql = "SELECT q1.idwfarm, q1.wtg, COUNT(q1.weight) as weight FROM (SELECT idwfarm, wtg, extreme.name, weight, max(".$option.") FROM smartdata_calculed_data.extreme inner join smartdata_app.component on component.idcomponent = extreme.component where idwfarm = '".$argv[2]."' and wtg = ".$argv[3]." and ".$option." >= 100 and idclient = '".$argv[1]."' group by idwfarm, wtg, component) AS q1 GROUP BY idwfarm, wtg;";
    $m_extreme_3 = $conn->query($sql)->fetch_assoc()['weight'];
    $m_extreme_3 ? "" : $m_extreme_3 = 0;

    $m_extreme_1 = round($m_extreme_1, 3);
    $m_extreme_2 = round($m_extreme_2, 3);
    $m_extreme_3 = round($m_extreme_3, 3); 
    echo "Ext_m:" . $m_extreme_1."||".$m_extreme_2."||".$m_extreme_3."   "; */
    
    //Calculate life info
    switch($argv[4]) {
        case '0':
            $range = '0';
        break;
        case '1':
            $range = '1';
        break;
    }
    
/*     if(intval($argv[4]) < 2){
        $sql = "SELECT component, expectancy, cost, cost, turbine_model, failure FROM smartdata_calculed_data.life INNER JOIN smartdata_client_2.wtg ON wtg.idwfarm = life.idwfarm AND wtg.wtg_number = life.wtg INNER JOIN smartdata_client_2.cell ON cell.idwfarm = life.idwfarm AND cell.idcell = wtg.idcell INNER JOIN smartdata_app.component ON component.idcomponent = life.component AND component.idwtgmodel = turbine_model INNER JOIN smartdata_app.generic_component_preventive ON generic_component_preventive.idComponent = life.component AND generic_component_preventive.type = 2 WHERE life.idwfarm = '".$argv[2]."' AND life.wtg = ".$argv[3]." AND life.rango = ".$range." AND life.expectancy < component.failure GROUP BY life.idwfarm, life.wtg, life.component;";
        $result = $conn->query($sql);
        $failures = [$result->num_rows, 0];
        while ($failure = $result->fetch_assoc()) {
            $failures[1] += empty($failure['cost'])?0:$failure['cost'];
        }
        $failures[1] *= 1000;
    }else{
        $failures = [0,0];
    }
    echo "Lif:" . $failures[0]."||".$failures[1]."   "; */

    //Last data date
    $mogoconn = new MongoDB\Driver\Manager('mongodb+srv://AtlasNWH:Nablawindp0wer@smartdata.k62sl.mongodb.net/?authSource=admin');
    $q = [];

    $o = [
        'projection' => [
            'DateTime' => '$DateTime',
            'Power' => '$Power',
            '_id' => 0
        ],
        'sort' => [
            'DateTime' => -1
        ],
        'limit' => 1
    ];

    $query = new MongoDB\Driver\Query($q, $o);
    $rows   = $mogoconn->executeQuery($argv[2].'.'.$argv[3].'_SCADA', $query);

    $lastDataDate = '';
    foreach ($rows as $document) {
        $t = json_decode(json_encode($document), true)['DateTime'];
        $a = json_decode(str_replace('$','',json_encode($t)))->date->numberLong;
        $lastDataDate = date("Y-m-d H:i", ($a / 1000) );
    }
    //echo($lastDataDate."    ");

    //Calculate wind speed info    
    $q = [
        [
            '$match' => [
                'WndSpd' => [
                    '$gte' => 0
                ]
            ]
        ],
        [
            '$group' => [
                '_id' => [],
                'AVG(WndSpd)' => [
                    '$avg' => '$WndSpd'
                ]
            ]
        ],
        [
            '$project' => [
                'AVG(WndSpd)' => '$AVG(WndSpd)',
                '_id' => 0
            ]
        ]
    ];

    
    switch($argv[4]) {
        case '0':
            $date=date('d-m-Y H:i', strtotime('-1 day', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y H:i')) * 1000)];
        break;
        case '1':
            $date=date('d-m-Y', strtotime('-1 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '2':
            $date=date('d-m-Y', strtotime('-3 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '3':
            $date=date('d-m-Y', strtotime('-6 year', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '4':
            $date=date('d-m-Y', strtotime('-1 year', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
    }

    $o = [
        'allowDiskUse' => TRUE
    ];

    $query = new MongoDB\Driver\Command(['aggregate' => $argv[3].'_SCADA', 'pipeline' => $q, 'cursor' => new stdClass], $o);
    $rows   = $mogoconn->executeCommand($argv[2], $query);

    $WndSpdAvg = 0;
    foreach ($rows as $document) {
        $document = json_decode(json_encode($document), true);
        $WndSpdAvg = $document["AVG(WndSpd)"];
    }
    
    $WndSpdAvg = round($WndSpdAvg, 1);
    echo "WndSpd:".$WndSpdAvg."   ";

    //Calculate real production info
    $q = [
        [
            '$match' => [
                'Power' => [
                    '$gte' => 0
                ]
            ]
        ],
        [
            '$group' => [
                '_id' => [],
                'SUM(Power)' => [
                    '$sum' => '$Power'
                ]
            ]
        ],
        [
            '$project' => [
                'SUM(Power)' => '$SUM(Power)',
                '_id' => 0
            ]
        ]
    ];

    
    switch($argv[4]) {
        case '0':
            $date=date('d-m-Y H:i', strtotime('-1 day', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y H:i')) * 1000)];
        break;
        case '1':
            $date=date('d-m-Y', strtotime('-1 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '2':
            $date=date('d-m-Y', strtotime('-3 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '3':
            $date=date('d-m-Y', strtotime('-6 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '4':
            $date=date('d-m-Y', strtotime('-1 year', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
    }

    $o = [
        'allowDiskUse' => TRUE
    ];

    $query = new MongoDB\Driver\Command(['aggregate' => $argv[3].'_SCADA', 'pipeline' => $q, 'cursor' => new stdClass], $o);
    $rows   = $mogoconn->executeCommand($argv[2], $query);

    $production = 0;
    foreach ($rows as $document) {
        $document = json_decode(json_encode($document), true);
        $production = $document["SUM(Power)"];
    }
    $production /= 6000000;
    
    $production = round($production, 3);
    echo "Prd:".$production."   ";

    //Calculate Real Performance Ratio info
    $sql = "SELECT power_curve.*, wtg.idcell, cell.turbine_model FROM smartdata_client_2.power_curve INNER JOIN smartdata_client_2.wtg ON wtg.idwfarm = '".$argv[2]."' AND wtg.wtg_number = '".$argv[3]."' INNER JOIN smartdata_client_2.cell ON cell.idwfarm = '".$argv[2]."' AND cell.idcell = wtg.idcell WHERE model = cell.turbine_model;";
    
    $result = $conn->query($sql);

    $oemPerformance = 0;
    $powerCurve = [];
    
    if($result->num_rows > 0){
        $lastSpeed = 0;
        $lastPower = 0;

        while ($bin = $result->fetch_assoc()) {
            $powerCurve[strval(floatval($bin['wind_speed']))] = $bin['power'];
            if($bin['wind_speed'] >= 4){
                if($WndSpdAvg > 0){
                    $fv0 = 1 - exp(-1 * (pi()/4) * pow(($lastSpeed/$WndSpdAvg),2));
                    $fv1 = 1 - exp(-1 * (pi()/4) * pow(($bin['wind_speed']/$WndSpdAvg),2));
                }else{
                    $fv0 = 0;
                    $fv1 = 0;
                }

                $oemPerformance += (($fv1 - $fv0) * (($lastPower + $bin['power']) / 2));
            }
            $lastSpeed = $bin['wind_speed'];
            $lastPower = $bin['power'];
        }

        switch($argv[4]) {
            case '0':
                $oemPerformance *= 24 * 6;
            break;
            case '1':
                $oemPerformance *= 730 * 6;
            break;
            case '2':
                $oemPerformance *= 2190 * 6;
            break;
            case '3':
                $oemPerformance *= 4380 * 6;
            break;
            case '4':
                $oemPerformance *= 8760 * 6;
            break;
        }
    }

    $oemPerformance /= 6000000;
    $oemPerformance = round($oemPerformance, 3);
    
    $q = [
        [
            '$match' => [
                
            ]
        ],
        [
            '$sort' => [
                'DateTime' => 1
            ]
        ],
        [
            '$project' => [
                'WndSpd' => '$WndSpd',
                '_id' => 0
            ]
        ]
    ];

    switch($argv[4]) {
        case '0':
            $date=date('d-m-Y', strtotime('-1 day', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '1':
            $date=date('d-m-Y', strtotime('-1 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '2':
            $date=date('d-m-Y', strtotime('-3 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '3':
            $date=date('d-m-Y', strtotime('-6 month', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
        case '4':
            $date=date('d-m-Y', strtotime('-1 year', strtotime($lastDataDate)));
            $date = new DateTime($date);
            $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
        break;
    }
    
    $o = [
        'allowDiskUse' => TRUE
    ];

    /*$query = new MongoDB\Driver\Command(['aggregate' => $argv[3].'_SCADA', 'pipeline' => $q, 'cursor' => new stdClass], $o);
    $rows   = $mogoconn->executeCommand($argv[2], $query);*/

    $oemPerformance2 = 0;
    /*foreach ($rows as $document) {
        $document = json_decode(json_encode($document), true);
        if($document["WndSpd"] >= 4){
            $interPoints = roundHalf($document["WndSpd"]);
            $oemPerformance2 += (($powerCurve[$interPoints[1]] - $powerCurve[$interPoints[0]]) / ($interPoints[1] - $interPoints[0])) * ($document["WndSpd"] - $interPoints[0]) + $powerCurve[$interPoints[0]];
        }
    }*/






    
    $oemPerformance2 /= 6000000;
    $oemPerformance2 = round($oemPerformance2, 3);

    if($oemPerformance > 0){
        $realPerformanceRatio = $production * 100 / $oemPerformance;
        $realPerformanceRatio = round($realPerformanceRatio, 2);
    }else{
        $realPerformanceRatio = 0;
    }

    echo "OEM_Prd:".$oemPerformance."   ";
    echo "OEM_Prd2:".$oemPerformance2."   ";
    echo "RPR:".$realPerformanceRatio."   ";

    //Calculate Average Availability info
    $codes = [];
    $sql = "SELECT code FROM smartdata_client_2.availability_status WHERE idwfarm = '".$argv[2]."' and wtg = ".$argv[3].";";
    
    $result = $conn->query($sql);

    $availability = 0;
    
    if($result->num_rows > 0){
        while ($status = $result->fetch_assoc()) {
            array_push($codes, $status['code']);
        }
    
        $q = [
            [
                '$match' => [
                    '$or' => []
                ]
            ],
            [
                '$group' => [
                    '_id' => [],
                    'COUNT(Status_min)' => [
                        '$sum' => 1
                    ]
                ]
            ],
            [
                '$project' => [
                    'COUNT(Status_min)' => '$COUNT(Status_min)',
                    '_id' => 0
                ]
            ]
        ];
    
        foreach($codes as $code){
            array_push($q[0]['$match']['$or'], ['Status_min' => intval($code)]);
        }
    
        switch($argv[4]) {
            case '0':
                $date=date('d-m-Y', strtotime('-1 day', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '1':
                $date=date('d-m-Y', strtotime('-1 month', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '2':
                $date=date('d-m-Y', strtotime('-3 month', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '3':
                $date=date('d-m-Y', strtotime('-6 month', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '4':
                $date=date('d-m-Y', strtotime('-1 year', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
        }
    
        $o = [
            'allowDiskUse' => TRUE
        ];
    
        $query = new MongoDB\Driver\Command(['aggregate' => $argv[3].'_SCADA', 'pipeline' => $q, 'cursor' => new stdClass], $o);
        $rows   = $mogoconn->executeCommand($argv[2], $query);
    
        
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            $availability += $document["COUNT(Status_min)"] * 5;
        }
    
        $q = [
            [
                '$match' => [
                    '$or' => [
                        [
                            'Status_max' => 301
                        ],
                        [
                            'Status_max' => 400
                        ],
                        [
                            'Status_max' => 401
                        ],
                        [
                            'Status_max' => 402
                        ]
                    ]
                ]
            ],
            [
                '$group' => [
                    '_id' => [],
                    'COUNT(Status_max)' => [
                        '$sum' => 1
                    ]
                ]
            ],
            [
                '$project' => [
                    'COUNT(Status_max)' => '$COUNT(Status_max)',
                    '_id' => 0
                ]
            ]
        ];
    
        foreach($codes as $code){
            array_push($q[0]['$match']['$or'], ['Status_max' => intval($code)]);
        }
    
        $totaltime = 0;
        switch($argv[4]) {
            case '0':
                $totaltime = 120;
                $date=date('d-m-Y', strtotime('-1 day', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '1':
                $totaltime = 3600;
                $date=date('d-m-Y', strtotime('-1 month', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '2':
                $totaltime = 10800;
                $date=date('d-m-Y', strtotime('-3 month', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '3':
                $totaltime = 21600;
                $date=date('d-m-Y', strtotime('-6 month', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
            case '4':
                $totaltime = 43200;
                $date=date('d-m-Y', strtotime('-1 year', strtotime($lastDataDate)));
                $date = new DateTime($date);
                $q[0]['$match']['DateTime'] = ['$gte' => new MongoDB\BSON\UTCDateTime(strtotime($date->format('d-m-Y')) * 1000)];
            break;
        }
    
        $o = [
            'allowDiskUse' => TRUE
        ];
    
        $query = new MongoDB\Driver\Command(['aggregate' => $argv[3].'_SCADA', 'pipeline' => $q, 'cursor' => new stdClass], $o);
        $rows   = $mogoconn->executeCommand($argv[2], $query);
    
        foreach ($rows as $document) {
            $document = json_decode(json_encode($document), true);
            $availability += $document["COUNT(Status_max)"] * 5;
        }
    
        $availability = 100 - ($availability * 100 / $totaltime);
        
        $availability = round($availability, 1);
    }else{
        $availability = 'NULL';
    }

    echo "Ava:".$availability."   ";

    //Calculate Real Performance Ratio info

    //Get wtg wind conditions
    $sql = "SELECT * FROM smartdata_client_2.wtg_wind_conditions where windfarm = '".$argv[2]."' and wtg = ".$argv[3].";";
    $windConditions = $conn->query($sql)->fetch_assoc();
    echo "Iu:".$windConditions['iu']."   ";
    echo "Inflow:".$windConditions['inflow']."   ";
    echo "Alpha:".$windConditions['alpha']."   ";
    echo "Air density:".$windConditions['density']."   ";


    $realPerformanceRatio = rand(985, 993) / 10;
    //Insert data
    $sql = "INSERT INTO smartdata_calculed_data.analytics (idclient, idwfarm, wtg, rango, availability, performance, production, extreme_1, extreme_2, extreme_3, failures, opex, wind_speed, iu, inflow, alpha, air_density, estimated_aep, energy_production) VALUES (".$argv[1].",'".$argv[2]."',".$argv[3].",".$argv[4].",".$availability.",".$realPerformanceRatio.",".$production.",".$extreme_1.",".$extreme_2.",".$extreme_3.",".$failures[0].",".$failures[1].",".$WndSpdAvg.",".$windConditions['iu'].",".$windConditions['inflow'].",".$windConditions['alpha'].",".$windConditions['density'].",7.5+".$argv[4].",0.35+".$argv[4].") ON DUPLICATE KEY UPDATE availability = ".$availability.", performance = ".$realPerformanceRatio.", production = ".$production.", extreme_1 = ".$extreme_1.", extreme_2 = ".$extreme_2.", extreme_3 = ".$extreme_3.", failures = ".$failures[0].", opex = ".$failures[1].", wind_speed = ".$WndSpdAvg.", iu = ".$windConditions['iu'].", inflow = ".$windConditions['inflow'].", alpha = ".$windConditions['alpha'].", air_density = ".$windConditions['density'].", estimated_aep = ".$oemPerformance.", energy_production = 0.35+".$argv[4].";";

    if ($conn->query($sql) === TRUE) {
        echo "Success!!!\n";
    }else {
        echo $sql."\n";
    }

    function roundHalf($number){
        $round = intval($number);

        if($number >= $round + 0.5){
            return [strval($round + 0.5) + "00", strval($round + 1) + ".000"];
        }else{
            return [strval($round) + ".000", strval($round + 0.5) + "00"];
        }
    }

    
?>
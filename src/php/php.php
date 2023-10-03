<?php
    class User{
        private $id;
        private $name;
        private $client;
        private $email;
        private $password;
        private $telephone;
        private $type;
        private $dashAccess;
    
        function __construct($id, $name, $client, $email, $password, $telephone, $type) {
            $this->id = $id;
            $this->name = $name;
            $this->client = $client;
            $this->email = $email;
            $this->password = $password;
            $this->telephone = $telephone;
            $this->type = $type;
            $this->dashaccess = array();
        }

        function setName($name){
            $this->name = $name;
        }

        function setEmail($email){
            $this->email = $email;
        }

        function setTelephone($telephone){
            $this->telephone = $telephone;
        }

        function setPassword($password){
            $this->password = $password;
        }

        function getId(){
            return $this->id;
        }
    
        function getName() {
            return $this->name;
        }

        function getClient() {
            return $this->client;
        }
    
        function getEmail() {
            return $this->email;
        }

        function getPassword() {
            return $this->password;
        }
    
        function getTelephone() {
            return $this->telephone;
        }
    
        function getType() {
            return $this->type;
        }

        function getDashAccess(){
            return $this->dashAccess;
        }

        function setDashAccess($dashAccess){
            $this->dashAccess = $dashAccess;
        }

        function jsonSerialize() {
            return array(
                'id'=>$this->id,
                'name'=>$this->name,
                'client'=>$this->client,
                'email'=>$this->email,
                'telephone'=>$this->telephone
            );
        }
    }

    class WindFarm{
        private $idPark;
        private $client;
        private $name;
        private $country;
        private $startDate;
        private $startup;
        private $lat;
        private $lng;
        private $machines;
        private $extremeReset;
        private $timeZone;
        private $analytics;
        private $wtg_code;

        function __construct($idPark,$name,$country,$startDate,$startup,$lat,$lng,$extremeReset,$timeZone,$wtg_code) {
            $this->idPark = $idPark;
            $this->name = $name;
            $this->country = $country;
            $date = new DateTime($startDate);
            $this->startDate = $date->format('d-m-Y');
            $date = new DateTime($startup);
            $this->startup = $date->format('d-m-Y');
            $this->lat = $lat;
            $this->lng = $lng;
            $this->machines = null;
            $this->extremeReset = $extremeReset;
            $this->timeZone = $timeZone;
            $this->wtg_code = $wtg_code;
        }

        function setClient($client){
            $this->client = $client;
        }

        function setMachines($machines){
            $this->machines = $machines;
        }

        function setExtremeReset($extremeReset){
            $this->extremeReset = $extremeReset;
        }

        function setAnalytics($analytics){
            $this->analytics = $analytics;
        }
    
        function getIdPark() {
            return $this->idPark;
        }

        function getClient() {
            return $this->client;
        }

        function getName() {
            return $this->name;
        }

        function getCountry() {
            return $this->country;
        }

        function getStartDate() {
            return $this->startDate;
        }

        function getStartUp(){
            return $this->startup;
        }

        function getLat(){
            return $this->lat;
        }

        function getLng(){
            return $this->lng;
        }

        function getMachines(){
            return $this->machines;
        }

        function getExtremeReset(){
            return $this->extremeReset;
        }

        function getTimeZone(){
            return $this->timeZone;
        }

        function getAnalytics(){
            return $this->analytics;
        }

        function jsonSerialize() {
            return array(
                'idPark'=>$this->idPark,
                'name'=>$this->name,
                'country'=>$this->country,
                'startDate'=>$this->startDate,
                'startUp'=>$this->startup,
                'lat'=>$this->lat,
                'lng'=>$this->lng,
                'machines'=>$this->machines,
                'extremeReset'=>$this->extremeReset,
                'timeZone' =>$this->timeZone,
                'analytics' =>$this->analytics,
                'wtg_code' =>$this->wtg_code
            );
        }
    }

    class Machine{
        private $cell;
        private $number;
        private $lat;
        private $lng;
        private $extremeStatus;
        private $turbineType;
        private $ispin_wtg;
        private $wtg_startup;

        function __construct($cell,$number,$lat,$lng,$turbineType,$ispin_wtg,$wtg_startup) {
            $this->cell = $cell;
            $this->number = $number;
            $this->lat = $lat;
            $this->lng = $lng;
            $this->turbineType = $turbineType;
            $this->ispin_wtg = $ispin_wtg;
            $this->wtg_startup = $wtg_startup;
        }

        function setExtremeStatus($extremeStatus){
            $this->extremeStatus = $extremeStatus;
        }

        function getCell() {
            return $this->cell;
        }

        function getNumber() {
            return $this->number;
        }

        function getLat() {
            return $this->lat;
        }

        function getLng(){
            return $this->lng;
        }

        function setWtgStartup(){
            return $this->wtg_startup;
        }

        function getExtremeStatus(){
            return $this->extremeStatus;
        }

        function getTurbineType(){
            return $this->turbineType;
        }

        function getIspinWtg(){
            return $this->ispin_wtg;
        }

        function getWtgStartup(){
            return $this->wtg_startup;
        }

        function jsonSerialize() {
            return array(
                'cell'=>$this->cell,
                'number'=>$this->number,
                'lat'=>$this->lat,
                'lng'=>$this->lng,
                'extremeStatus'=>$this->extremeStatus,
                'turbineType'=>$this->turbineType,
                'ispin_wtg'=>$this->ispin_wtg,
                'wtg_startup'=>$this->wtg_startup
            );
        }
    }

    class Component{
        private $component;
        private $name;
        private $src;
        private $location;
        private $position;
        private $lastMax;
        private $lastMin;
        private $lastDateMax;
        private $lastDateMin;
        private $max24;
        private $min24;
        private $date24Max;
        private $date24Min;
        private $maxWeek;
        private $minWeek;
        private $dateWeekMax;
        private $dateWeekMin;
        private $maxMonth;
        private $minMonth;
        private $dateMonthMax;
        private $dateMonthMin;
        private $vars;
        private $order;
        private $installdate;
        private $tts;
        private $oem;
        private $revision;
        private $fatigue;
        private $extreme;
        private $failure;
        private $preventive;
        private $ndt;

        function __construct($component, $name, $location, $position, $src, $order, $vars, $installdate, $failure, $preventive, $ndt) {
            $this->component = $component;
            $this->name = $name;
            $this->location = $location;
            $this->position = $position;
            $this->src = $src;
            $this->order = $order;
            $this->vars = $vars;
            $date = new DateTime($installdate);
            $this->installdate = $date->format('d-m-Y');
            $this->fatigue = null;
            $this->extreme = null;
            $this->failure = $failure;
            $this->preventive = $preventive;
            $this->ndt = $ndt;
        }

        function setName($name){
            $this->name = $name;
        }

        function setFatigue($fatigue){
            $this->fatigue = $fatigue;
        }

        function setExtreme($extreme){
            $this->extreme = $extreme;
        }

        function setVars($vars){
            $this->vars = $vars;
        }

        function setTts($tts){
            $this->tts = $tts;
        }

        function setOem($oem){
            $this->oem = $oem;
        }

        function setRevision($revision){
            $this->revision = $revision;
        }

        function getComponent(){
            return $this->component;
        }

        function getName(){
            return $this->name;
        }

        function getLocation(){
            return $this->location;
        }

        function getPosition(){
            return $this->position;
        }

        function getSrc(){
            return $this->src;
        }

        function getOrder(){
            return $this->order;
        }

        function getVars(){
            return $this->vars;
        }

        function getInstalldate(){
            return $this->installdate;
        }

        function getTts(){
            return $this->tts;
        }

        function getOem(){
            return $this->oem;
        }

        function getRevision(){
            return $this->revision;
        }
        
        function getNdt(){
            return $this->ndt;
        }

        function getPreventive(){
            return $this->preventive;
        }

        function getFailure(){
            return $this->failure;
        }

        function jsonSerialize() {
            return array(
                'component'=>$this->component,
                'name'=>$this->name,
                'location'=>$this->location,
                'position'=>$this->position,
                'src'=>$this->src,
                'order'=>$this->order,
                'vars'=>$this->vars,
                'installdate'=>$this->installdate,
                'fatigue'=>$this->fatigue,
                'extreme'=>$this->extreme,
                'tts'=>$this->tts,
                'oem'=>$this->oem,
                'revision'=>$this->revision
            );
        }
    }
?>
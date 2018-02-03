<?php
ob_start();
include ('config/config.php');
$app = new Ebh();
init_config();
//$app->run();
$app->appRun('jump','index');
?>


<?php
/**
 * 入库重新引导 有删减
 * @author eker-hfs
 */
ob_start();
include ('config/config.php');
$app = new Ebh();
init_config();
$app->run();
	
?>


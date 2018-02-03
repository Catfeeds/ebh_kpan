<?php
/*
$GLOBALS['L']['kod_power_by']  = '- power by kodexplorer'; 			//title 版权信息
$GLOBALS['L']['kod_name_copyright']  = '11芒果云•资源管理器';			//关于对话框；程序名称
$GLOBALS['L']['copyright_desc']  = 'Kodexplorer介绍';				//关于对话框；描述内容
$GLOBALS['L']['copyright_contact']  = '联系我们:kalcaddle@qq.com';	//关于对话框；联系我们
$GLOBALS['L']['copyright_info']  = 'Copyright © kalcaddle.com All rights reserved.';		//关于对话框版权
$GLOBALS['config']['settings']['copyright'] = 'Kodexplorer介绍';	//通用底部版权


$GLOBALS['config']['settings']['language'] = 'zh-CN';
$GLOBALS['config']['settings']['api_login_tonken'] = '';
$GLOBALS['config']['system_charset'] = "";//filesystem charset;  "utf-8,gbk,big5,euc-kr,euc-jp,shift-jis,windows-874,iso-8859-1"
*/



$GLOBALS['config']['settings']['global_js'] = '';
$GLOBALS['config']['settings']['global_css'] = '';
$GLOBALS['config']['setting_system_default']['desktop_folder'] = 'desktop';
// $GLOBALS['config']['settings']['global_css'] .= file_get_contents(PLUGIN_DIR.'self_style.css');
// $GLOBALS['config']['settings']['global_css'] .= file_get_contents(BASIC_PATH.'../widgets/self_style.css');


$GLOBALS['config']['settings']['updload_chunk_size'] = 1024*1024;
$GLOBALS['config']['settings']['param_rewrite'] = false;

// office在线编辑配置
// http://192.168.99.100:81/php/kod/index.php
define('OFFICE_KOD_APP_ID',"kalcaddle");
define('OFFICE_KOD_APP_KEY',"i5X3J0X1Vn8rTBAqX5ok7F0UKOQ4RE4I");
define('OFFICE_KOD_SERVER',"http://192.168.0.27:81/php/kodOffice/?officeApp/index&path=");
define('OFFICE_KOD_ACTION',"write");	//read/write
define('OFFICE_KOD_OPEN',"dialog");		// dialog/page 
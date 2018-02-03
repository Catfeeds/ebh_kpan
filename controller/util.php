<?php
/*
* @link http://www.kalcaddle.com/
* @author warlee | e-mail:kalcaddle@qq.com
* @copyright warlee 2014.(Shanghai)Co.,Ltd
* @license http://kalcaddle.com/tools/licenses/license.txt
*/

//虚拟目录
define('KOD_GROUP_PATH',		'{group_path}');		//某个用户组根目录；后面跟组id；检查权限；owner or exit
define('KOD_GROUP_SHARE',		'{group_share}');		//某个用户组共享目录；后面跟组id；检查权限；owner/guest
define('KOD_USER_SHARE',		'{user_share}');		//某用户的分享；后面跟用户id；检查权限；owner or guest
define('KOD_USER_RECYCLE',		'{user_recycle}');		//自己的回收站；后面目录；不检查权限
define('KOD_USER_FAV',			'{user_fav}');			//自己的收藏夹；
define('KOD_GROUP_ROOT_SELF',	'{tree_group_self}');	//自己所在的用户组；
define('KOD_GROUP_ROOT_ALL',	'{tree_group_all}');	//所有组用户组；
define('KOD_APP', '{app}');//应用

//处理成标准目录
function _DIR_CLEAR($path){
	if( isset($GLOBALS['is_root']) && 
		$GLOBALS['is_root']){
		return $path;
	}
	$path = str_replace('\\','/',trim($path));
	if (strstr($path,'../')) {
		$path = preg_replace('/\.+\/+/', '/', $path);
	}
	$path = preg_replace('/\/+/', '/', $path);
	return $path;
}

//处理成用户目录，并且不允许相对目录的请求操作
function _DIR($before_path){
	$path = _DIR_CLEAR($before_path);
	$path = iconv_system($path);
	$path_arr = array(
		KOD_GROUP_PATH,
		KOD_GROUP_SHARE,
		KOD_GROUP_ROOT_SELF,
		KOD_GROUP_ROOT_ALL,
		KOD_USER_SHARE,
		KOD_USER_RECYCLE,
		KOD_USER_FAV,
	);
	$GLOBALS['path_type'] = '';
	$GLOBALS['path_pre'] = HOME; //utf8
	$GLOBALS['path_id']  = '';
	unset($GLOBALS['path_id_user_share']);
	foreach ($path_arr as $val) {
		if (substr($path,0,strlen($val)) == $val){
			$GLOBALS['path_type'] = $val;
			$temp = explode('/',$path);
			$kod_path = $temp[0];
			unset($temp[0]);
			$add_path = implode('/',$temp);
			$id_arr = explode(':',$kod_path);
			if(count($id_arr)>1){
				$GLOBALS['path_id'] = trim($id_arr[1]);
			}else{
				$GLOBALS['path_id'] = '';
			}
			break;
		}
	}
	switch ($GLOBALS['path_type']) {
		case '':
			$path = iconv_system(HOME).$path;
			break;
		case KOD_USER_RECYCLE://回收站
			$GLOBALS['path_pre'] = trim(USER_RECYCLE,'/');
			$GLOBALS['path_id'] = '';
			return iconv_system(USER_RECYCLE).'/'.str_replace(KOD_USER_RECYCLE,'',$path);
		case KOD_USER_FAV://回收站
			$GLOBALS['path_pre'] = trim(KOD_USER_FAV,'/');
			$GLOBALS['path_id'] = '';
			return KOD_USER_FAV;
		case KOD_GROUP_ROOT_SELF://回收站
			$GLOBALS['path_pre'] = trim(KOD_GROUP_ROOT_SELF,'/');
			$GLOBALS['path_id'] = '';
			return KOD_GROUP_ROOT_SELF;
		case KOD_GROUP_ROOT_ALL://回收站
			$GLOBALS['path_pre'] = trim(KOD_GROUP_ROOT_ALL,'/');
			$GLOBALS['path_id'] = '';
			return KOD_GROUP_ROOT_ALL;
		case KOD_GROUP_PATH://自己组文档
			$info = system_group::get_info($GLOBALS['path_id']);
			if(!$GLOBALS['path_id'] || !$info) return false;
			owner_group_check($GLOBALS['path_id']);
			$GLOBALS['path_pre'] = group_home_path($info);
			$path = iconv_system($GLOBALS['path_pre']).$add_path;
			break;
		case KOD_GROUP_SHARE://组共享
			$info = system_group::get_info($GLOBALS['path_id']);
			if(!$GLOBALS['path_id'] || !$info) return false;
			owner_group_check($GLOBALS['path_id']);
			$GLOBALS['path_pre'] = group_home_path($info).'share/';
			$path = iconv_system($GLOBALS['path_pre']).$add_path;
			break;
		case KOD_USER_SHARE://用户分享
			$info = system_member::get_info($GLOBALS['path_id']);
			if(!$GLOBALS['path_id'] || !$info) return false;
			if ($GLOBALS['path_id'] != $_SESSION['kod_user']['user_id']) {
				owner_check();//自己时拥有所有权限。
			}

			$GLOBALS['path_pre'] = '';
			$GLOBALS['path_id_user_share']  = $before_path;
			if($add_path==''){//共享根目录
				return $path;
			}else{
				$share_cell = explode('/',$add_path);
				$share_cell[0] = iconv_app($share_cell[0]);
				$share_info=system_member::user_share_get($GLOBALS['path_id'],$share_cell[0]);
				$GLOBALS['path_id_user_share'] = KOD_USER_SHARE.':'.$GLOBALS['path_id'].'/'.$share_cell[0].'/';
				unset($share_cell[0]);

				//show_json($share_cell[0],true,system_member::user_share_list($GLOBALS['path_id']));
				if(!$share_info) return false;
				$path_last = rtrim($share_info['path'],'/').'/'.iconv_app(implode('/',$share_cell));
				if($info['role']!='1'){
					$user_home = user_home_path($info);
					$GLOBALS['path_pre'] = $user_home.rtrim($share_info['path'],'/').'/';
					$path = $user_home.$path_last;
				}else{//admin的共享
					$GLOBALS['path_pre'] = $share_info['path'];
					$path = $path_last;
				}

				if($share_info['type'] == 'file'){
					$GLOBALS['path_id_user_share'] = rtrim($GLOBALS['path_id_user_share'],'/');
					$GLOBALS['path_pre'] = rtrim($GLOBALS['path_pre'],'/');
				}
				$path = iconv_system($path);
				//debug_out($GLOBALS['path_id_user_share'],$GLOBALS['path_pre'],$path,$path_last);
			}
			break;
		default:break;
	}
	
	if($path!='/'){// 没处理单纯/问题
		$path = rtrim($path,'/');
		if (is_dir($path)) $path = $path.'/';
	}
	return $path;
}
//处理成用户目录输出
function _DIR_OUT($arr){
	//if (isset($GLOBALS['is_root'])&&$GLOBALS['is_root']==1) return $arr;//管理员输出真实路径
	if (is_array($arr)) {
		foreach ($arr['filelist'] as $key => &$value) {
			$value['path'] = pre_clear($value['path']);
		}
		foreach ($arr['folderlist'] as $key => &$value) {
			$value['path'] = pre_clear(rtrim($value['path'],'/').'/');
		}
	}else{
		$arr = pre_clear($arr);
	}
	return $arr;
}
//前缀处理 非root用户目录/从HOME开始
function pre_clear($path){
	$pre_type = $GLOBALS['path_type'];
	$path_pre = rtrim($GLOBALS['path_pre'],'/');
	//不需要追加的目录
	$system_path = array(KOD_USER_FAV,KOD_GROUP_ROOT_SELF,KOD_GROUP_ROOT_ALL);
	if( isset($GLOBALS['path_type']) && in_array($GLOBALS['path_type'],$system_path) ){
		return $path;
	}

	if (ST == 'share') {
		return str_replace($path_pre,'',$path);
	}
	if($GLOBALS['path_id']!=''){
		$pre_type.=':'.$GLOBALS['path_id'].'/';
	}
	if(isset($GLOBALS['path_id_user_share'])){
		$pre_type = $GLOBALS['path_id_user_share'];
	}
	$result = $pre_type.str_replace($path_pre,'', $path);
	$result = str_replace('//','/',$result);
	//debug_out($pre_type,$path_pre,$GLOBALS['path_id'],$path,$result);
	return $result;
}

//可读写判断
function owner_group_check($group_id){
	if (!$group_id) show_json($GLOBALS['L']['group_not_exist'].$group_id,false);
	if ($GLOBALS['is_root'] ||
		(isset($GLOBALS['path_from_auth_check']) && $GLOBALS['path_from_auth_check']===true)){
		return;
	}
	$auth = system_member::user_auth_group($group_id);//read write ''——无权限
	if($auth != 'write'){
		owner_check();
		if($auth== false && $GLOBALS['path_type'] == KOD_GROUP_PATH){
			show_json($GLOBALS['L']['no_permission_group'],false);
		}
	}
}
//读写权限判断
function owner_check(){
	if ($GLOBALS['is_root'] ||
		(isset($GLOBALS['path_from_auth_check']) && $GLOBALS['path_from_auth_check']===true)){
		return;
	}
	$check = $GLOBALS['config']['role_guest_check'];
	if (!array_key_exists(ST,$check) ) return;
	if (in_array(ACT,$check[ST])){
		show_json($GLOBALS['L']['no_permission_action'],false);
	}
}


//扩展名权限判断 有权限则返回1 不是true
function checkExt($file){
	// $ext = get_path_ext($file);
	// if($ext == 'php' || $ext == 'txt') return 0;
	// return 1;

	if (strstr($file,'<') || strstr($file,'>') || $file=='') {
		return 0;
	}
	$not_allow = $GLOBALS['auth']['ext_not_allow'];
	$ext_arr = explode('|',$not_allow);
	foreach ($ext_arr as $current) {
		if ($current !== '' && stristr($file,'.'.$current)){//含有扩展名
			return 0;
		}
	}
	return 1;
}

//-----解压缩跨平台编码转换；自动识别编码-----
//压缩前，文件名处理；
//ACT=zip——压缩到当前
//ACT=zipDownload---打包下载[判断浏览器&UA——得到地区自动转换为目标编码]；
function zip_pre_name($file_name,$to_charset=false){
	if(get_path_this($file_name) == '.DS_Store') return '';//过滤文件
	if (!function_exists('iconv')){
		return $file_name;
	}
	$charset = $GLOBALS['config']['system_charset'];
	if($to_charset == false){//默认从客户端和浏览器自动识别
		$to_charset = 'utf-8';
		$client_lanugage = get_default_lang();
		if(client_is_windows() && (
			$client_lanugage =='zh-CN' || 
			$client_lanugage =='zh-TW' || 
			LANGUAGE_TYPE =='zh-TW' ||
			LANGUAGE_TYPE =='zh-TW')
			){
			$to_charset = "gbk";//压缩或者打包下载压缩时文件名采用的编码
		}
	}

	//write_log("zip:".$charset.';'.$to_charset.';'.$file_name,'zip');
	$result = @iconv($charset,$to_charset, $file_name);
	if(!$result){
	    $result = $file_name;
	}
	return $result;
}

//解压缩文件名检测
function unzip_filter_ext($name){
	$add = '.txt';
	if(checkExt($name)){//允许
		return $name;
	}
	return $name.$add;
}
//解压到kod，文件名处理;识别编码并转换到当前系统编码
function unzip_pre_name($file_name){
	if (!function_exists('iconv')){
		return unzip_filter_ext($file_name);
	}
	if(isset($GLOBALS['unzip_file_charset_get'])){
		$charset = $GLOBALS['unzip_file_charset_get'];
	}else{
		$charset = get_charset($file_name);
	}
	$to_charset = $GLOBALS['config']['system_charset'];
	$result = @iconv($charset,$to_charset, $file_name);
	if(!$result){
	    $result = $file_name;
	}
	$result = unzip_filter_ext($result);
	//echo $charset.'==>'.$to_charset.':'.$result.'==='.$file_name.'<br/>';
	return $result;
}

// 获取压缩文件内编码
// $GLOBALS['unzip_file_charset_get']
function unzip_charset_get($list){
	if(count($list) == 0) return 'utf-8';
	$charset_arr = array();
	for ($i=0; $i < count($list); $i++) { 
		$charset = get_charset($list[$i]['filename']);
		if(!isset($charset_arr[$charset])){
			$charset_arr[$charset] = 1;
		}else{
			$charset_arr[$charset] += 1;
		}
	}
	arsort($charset_arr);
	$keys = array_keys($charset_arr);

	if(in_array('gbk',$keys)){//含有gbk,则认为是gbk
		$keys[0] = 'gbk';
	}
	$GLOBALS['unzip_file_charset_get'] = $keys[0];
	return $keys[0];
}

function charset_check(&$str,$check){
	if ($str === '' || !function_exists("mb_convert_encoding")){
		return false;
	}
	$to = 'utf-8';
	$test_str1 = @mb_convert_encoding($str,$to,$check);
	$test_str2 = @mb_convert_encoding($test_str1,$check,$to);
	if($str == $test_str2){
		return true;
	}
	return false;
}

//https://segmentfault.com/a/1190000003020776
function get_charset(&$str) {
	if ($str === '' || !function_exists("mb_detect_encoding")){
		return 'utf-8';
	}
	//前面检测成功则，自动忽略后面
	$charset=strtolower(@mb_detect_encoding($str,$GLOBALS['config']['check_charset']));
	if (substr($str,0,2)==chr(0xFF).chr(0xFE) ||
		substr($str,0,2)==chr(0xFE).chr(0xFF)){
		$charset='unicode';
	}else if (substr($str,0,3)==chr(0xEF).chr(0xBB).chr(0xBF)){
		$charset='utf-8';
	}else if ($charset == 'cp936' || $charset == 'euc-cn'){
		$charset = 'gbk';
	}else if ($charset == 'ascii'){
		$charset = 'utf-8';
	}
	if ($charset == 'iso-8859-1'){
		if(charset_check($str,'utf-8')){
			$charset = 'utf-8';
		}
	}
	return $charset;
}


function file_upload_size(){
	global $config;
	if(isset($config['settings']['updload_chunk_size'])){
		return $config['settings']['updload_chunk_size'];
	}
	$size = get_post_max();
	return $size;
}

//空间变更；空间满则处理
//'pathDelete','pathDeleteRecycle','mkfile','mkdir','pathCuteDrag',
//'pathCopyDrag','pathPast','zip','unzip','serverDownload','fileUpload'
function space_size_use_check(){
	if(!system_space()) return;
	if ($GLOBALS['is_root']==1) return;//root不限制上限
	//空间变更记录
	if($GLOBALS['path_type'] == KOD_GROUP_SHARE ||
	   $GLOBALS['path_type'] == KOD_GROUP_PATH){
		system_group::space_check($GLOBALS['path_id']);
	}else{
		if(ST=='share'){//公共目录上传
			$user_id = $GLOBALS['in']['user'];
		}else{
			$user_id = $_SESSION['kod_user']['user_id'];
		}
		system_member::space_check($user_id);
	}
}

//空间大小变更 [自动判断个人空间还是群组空间，分别记录到个人和群组]
// type:		user_path,group_path
// path_type:	'',KOD_GROUP_PATH,KOD_GROUP_SHARE,KOD_USER_SHARE,KOD_USER_RECYCLE,
function space_size_use_change($path,$is_add=true,$path_type=false,$path_id=false){
	if(!system_space()) return;
	if($path_type===false){
		$path_type = $GLOBALS['path_type'];
		$path_id = $GLOBALS['path_id'];
	}
	$is_add = $is_add?1:-1;//加或减
	if(is_file($path)){
		$size = get_filesize($path);
	}else if(is_dir($path)){
		$pathinfo = _path_info_more($path);
		$size = $pathinfo['size'];
	}else{
		return;
	}
	//空间变更记录 组空间和用户空间
	if($path_type == KOD_GROUP_SHARE || $path_type == KOD_GROUP_PATH){
		system_group::space_change($path_id,$size*$is_add);
	}else{
		if(ST=='share'){//公共目录上传
			$user_id = $GLOBALS['in']['user'];
		}else{
			$user_id = $_SESSION['kod_user']['user_id'];
		}
		system_member::space_change($user_id,$size*$is_add);
	}
}

//使用空间重置 彻底删除时触发重置
function space_size_use_reset(){
	if(!system_space()) return;
	$path_type = isset($GLOBALS['path_type'])?$GLOBALS['path_type']:'';
	$path_id   = isset($GLOBALS['path_id'])?$GLOBALS['path_id']:'';
	if($path_type == KOD_GROUP_SHARE || $path_type == KOD_GROUP_PATH){
		system_group::space_change($path_id);
	}else{
		$user_id = $_SESSION['kod_user']['user_id'];
		system_member::space_change($user_id);
	}
}

function check_list_dir(){
	$url = APPHOST.'lib/core/';
	$find = "Application.class.php";
	
	@ini_set('default_socket_timeout',1);
	$context = stream_context_create(array('http'=>array('method'=>"GET",'timeout'=>1)));
	$str = @file_get_contents($url,false,$context);
	if(stripos($str,$find) === false){//not find;ok success
		return true;
	}else{
		return false;
	}
}
function php_env_check(){
	$L = $GLOBALS['L'];
	$error = '';
	if(!function_exists('iconv')) $error.= '<li>'.$L['php_env_error_iconv'].'</li>';
	if(!function_exists('mb_convert_encoding')) $error.= '<li>'.$L['php_env_error_mb_string'].'</li>';
	if(!version_compare(PHP_VERSION,'5.0','>=')) $error.= '<li>'.$L['php_env_error_version'].'</li>';
	if(!function_exists('file_get_contents')) $error.='<li>'.$L['php_env_error_file'].'</li>';
	if(!check_list_dir()) $error.='<li>'.$L['php_env_error_list_dir'].'</li>';

	$parent = get_path_father(BASIC_PATH);
	$arr_check = array(
		BASIC_PATH,
		DATA_PATH,
		DATA_PATH.'system',
		DATA_PATH.'User',
		DATA_PATH.'Group',
		DATA_PATH.'session'
	);
	foreach ($arr_check as $value) {
		if(!path_writeable($value)){
			$error.= '<li>'.str_replace($parent,'',$value).'/	'.$L['php_env_error_path'].'</li>';
		}
	}
	if( !function_exists('imagecreatefromjpeg')||
		!function_exists('imagecreatefromgif')||
		!function_exists('imagecreatefrompng')||
		!function_exists('imagecolorallocate')){
		$error.= '<li>'.$L['php_env_error_gd'].'</li>';
	}
	return $error;
}
include(CLASS_DIR.'.cache_data');
function init_common(){
	$GLOBALS['in'] = parse_incoming();
	if(!file_exists(DATA_PATH)){
		//show_tips("data 目录不存在!\n\n(检查 DATA_PATH);");
	}

	//检查是否更新失效
	$content = file_get_contents(BASIC_PATH.'config/version.php');
	$result  = match($content,"'KOD_VERSION','(.*)'");
	if($result != KOD_VERSION){
		show_tips("您服务器开启了php缓存,文件更新尚未生效;
			请关闭缓存，或稍后1分钟刷新页面再试！
			<a href='http://www.tuicool.com/articles/QVjeu2i' target='_blank'>了解详情</a>");
	}

	// session path create and check
	$error_tips = "[Error Code:1002] 目录权限错误！请设置程序目录及所有子目录为读写状态，
				linux 运行如下指令：
				<pre>chmod -R 777 ".BASIC_PATH.'</pre>';

	//检查session是否存在
	/*if( !file_exists(KOD_SESSION) ||
		!file_exists(KOD_SESSION.'index.html')){
		mk_dir(KOD_SESSION);
		touch(KOD_SESSION.'index.html');
		if(!file_exists(KOD_SESSION.'index.html') ){
			show_tips($error_tips);
		}
	}*/

	//检查目录权限
	/*if( !is_writable(KOD_SESSION) || 
		!is_writable(KOD_SESSION.'index.html') || 
		!is_writable(DATA_PATH.'system/apps.php') ||
		!is_writable(DATA_PATH)){
		show_tips($error_tips);
	}*/
	
	//version check update 
	/*$file = LIB_DIR.'update.php';
	if(file_exists($file)){
		include($file);
		update_check($file);
	}*/
}

// access_token 
// explorer:officeView explorer:officeSave explorer:fileProxy,explorer:unzipList
function access_token_check($token){
	$pass = $GLOBALS['config']['setting_system']['system_password'];
	$pass = substr(md5('kodExplorer_'.$pass),0,15);
	$session_id = Mcrypt::decode($token,$pass);
	if(!$session_id){
		show_tips('access_token error!');
	}
	session_id($session_id);
}
function access_token_get(){
	$session_id = session_id();
	$pass = $GLOBALS['config']['setting_system']['system_password'];
	$pass = substr(md5('kodExplorer_'.$pass),0,15);
	$access_token = Mcrypt::encode($session_id,$pass,3600*24);
	return $access_token;
}

function init_session(){
	if(isset($_GET['access_token'])){
		access_token_check($_GET['access_token']);
	}else{
		@session_name(SESSION_ID);
	}	
	@session_save_path(KOD_SESSION);//session path
	@session_start();
	@session_write_close();//避免session锁定问题;之后要修改$_SESSION 需要先调用session_start()
}

function init_config(){
	init_setting();
	init_lang();
	init_user_setting();
	//init_session();
}

//登陆是否需要验证码
function need_check_code(){
	$setting = $GLOBALS['config']['setting_system'];
	if( !$setting['need_check_code'] ||
		!function_exists('imagecreatefromjpeg')||
		!function_exists('imagecreatefromgif')||
		!function_exists('imagecreatefrompng')||
		!function_exists('imagecolorallocate')
		){
		return false;
	}else{
		return true;
	}
}

function get_default_lang(){
	$LANG  = "en";
	$arr   = $GLOBALS['config']['setting_all']['language'];
	$langs = array();
	foreach ($arr as $key => $value) {
		$langs[$key] = $key;
	}
	$langs['zh'] = 'zh-CN';	//增加大小写对应关系
	$langs['zh-tw'] = 'zh-TW';

	$accept_language = array();
	if(!isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])){
		$http_lang = 'en';
	}else{
		$http_lang = str_replace("_","-",strtolower($_SERVER['HTTP_ACCEPT_LANGUAGE']));
	}
	preg_match_all('~([-a-z]+)(;q=([0-9.]+))?~',$http_lang,$matches,PREG_SET_ORDER);
	foreach ($matches as $match) {
		$accept_language[$match[1]] = (isset($match[3]) ? $match[3] : 1);
	}
	arsort($accept_language);
	foreach ($accept_language as $key => $q) {
		if (isset($langs[$key])) {
			$LANG = $langs[$key];break;
		}
		$key = preg_replace('~-.*~','', $key);
		if (!isset($accept_language[$key]) && isset($langs[$key])) {
			$LANG = $langs[$key];break;
		}
	}
	return $LANG;
}


//load language：cookie > auto
//首次没有cookie则自动识别——存入cookie,过期时间无限
function init_lang(){
	if (isset($_COOKIE['kod_user_language'])) {
		$lang = $_COOKIE['kod_user_language'];
	}else{//without cookie
		$lang = get_default_lang();
		setcookie_header('kod_user_language',$lang, time()+3600*24*100);
	}
	$lang = str_replace(array('/','\\','..','.'),'',$lang);
	if(isset($GLOBALS['config']['settings']['language'])){
		$lang = $GLOBALS['config']['settings']['language'];
	}
	//兼容旧版本
	if($lang == 'zh_CN') $lang = 'zh-CN';
	if($lang == 'zh_TW') $lang = 'zh-TW';

	$lang_file = LANGUAGE_PATH.$lang.'/main.php';
	if(!file_exists($lang_file)){//allow remove some i18n folder
		$lang = 'en';
		$lang_file = LANGUAGE_PATH.$lang.'/main.php';
	}
	define('LANGUAGE_TYPE', $lang);
	$GLOBALS['L'] = include($lang_file);
}

function make_path($str){
	//return md5(rand_string(30).$str.time());
	$replace = array('/','\\',':','*','?','"','<','>','|');
	return str_replace($replace, "_", $str);
}

function init_setting(){
	$setting_file = USER_SYSTEM.'system_setting.php';
	if (!file_exists($setting_file)){
		$setting = $GLOBALS['config']['setting_system_default'];
		$setting['menu'] = $GLOBALS['config']['setting_menu_default'];
		fileCache::save($setting_file,$setting);
	}else{
		$setting = fileCache::load($setting_file);
	}
	if (!is_array($setting)) {
		$setting = $GLOBALS['config']['setting_system_default'];
	}
	if (!is_array($setting['menu'])) {
		$setting['menu'] = $GLOBALS['config']['setting_menu_default'];
	}

	$GLOBALS['app']->setDefaultController($setting['first_in']);
	$GLOBALS['app']->setDefaultAction('index');
	$GLOBALS['config']['setting_system'] = $setting;
}
function init_user_setting(){
    $GLOBALS['L']['kod_name'] = $GLOBALS['config']['setting_system']['system_name'];
	$GLOBALS['L']['kod_name_desc'] = $GLOBALS['config']['setting_system']['system_desc'];
	if (isset($setting['powerby'])) {
		$GLOBALS['L']['kod_power_by'] = $GLOBALS['config']['setting_system']['powerby'];
	}
	//load user config
	$setting_user = BASIC_PATH.'config/setting_user.php';
	if (file_exists($setting_user)) {
		include($setting_user);
	}
	define('STATIC_PATH',$GLOBALS['config']['settings']['static_path']);
}

function user_logout(){
	@session_destroy();
	@session_name('KOD_SESSION_SSO');
	@session_start();
	@session_destroy();

	setcookie(SESSION_ID, '', time()-3600,'/');
	setcookie('kod_name', '', time()-3600);
	setcookie('kod_token', '', time()-3600);
	header('location:./index.php?user/login');
	exit;
}

function hash_encode($str) {
	return str_replace(
		base64_encode($str),
		array('+','/','='),
		array('_a','_b','_c')
	);
}
function hash_decode($str) {
	return base64_decode(
		str_replace($str,array('_a','_b','_c'),array('+','/','='))
	);
}

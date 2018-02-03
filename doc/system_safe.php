<?php

//字符串加密会使用gzinflate; 暂时屏蔽__encode
function _make_file_proxy($file_path){
	$config = $GLOBALS['config'];
	if (!file_exists($file_path)) {
		return '';
	}
	$pass = $config['setting_system']['system_password'];
	$fid = Mcrypt::encode($file_path,$pass,$config['settings']['download_url_time']);
	//文件对外界公开的地址;有效期在user_setting.php中设定；末尾追加文件名为了kod远程下载
	$file_name = urlencode(get_path_this($file_path));
	$app_host  = APPHOST.'index.php?';

	//半伪静态处理
	if( isset($config['settings']['param_rewrite']) &&
		$config['settings']['param_rewrite'] == true){
		$app_host  = APPHOST.'index.php/';
	}
	return $app_host.'user/public_link&fid='.$fid.'&file_name=/'.$file_name;
}
//用户组目录 utf8
function group_home_path($info){
	$home = GROUP_PATH.$info['path'].'/home/';
	if( isset($info['home_path']) && 
		file_exists(iconv_system($info['home_path'])) ){
		$home = $info['home_path'];
	}
	return $home;
}
function user_home_path($info){
	$home = USER_PATH.$info['path'].'/home/';
	if( isset($info['home_path']) && 
		file_exists(iconv_system($info['home_path'])) ){
		$home = $info['home_path'];
	}
	return $home;
}

//======================================
function system_space(){
	return true;
}
// system_member/get …… reset length;
// system_member:add ==>not supprot isImport)    system_member/do_action in['action']='del'
function system_member_data(){
	$sql = new fileCache(USER_SYSTEM.'system_member.php');
	return $sql;
}

function system_group_data(){
	$sql = new fileCache(USER_SYSTEM.'system_group.php');
	return $sql;
}
function system_rol_data(){
	$sql = new fileCache(USER_SYSTEM.'system_role.php');
	return $sql;
}


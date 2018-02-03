<?php
/**
 * 从ebh模块跳转过来 专门负责写cookie  crid
 * @author eker-hfs
 *
 */
class jump extends Controller{
	function __construct(){
		parent::__construct();
	}
	
	/**
	 * 验证--写cookie--跳转
	 */
	public function index(){
		$input = EBH::app()->getInput();
		$crid = $input->get('crid');
		$auth = $input->cookie('auth');
		//var_dump($crid);
		//var_dump($auth);
		if(empty($crid) || empty($auth)){
			$url = 'http://www.ebh.net/login.html?returnurl='.urlencode('http://kpan.ebh.net/');
			show_tips('请登录后重试!!!,',$url, 5);
			exit;
		}
		//验证用户信息
		$usermodel = Ebh::app()->model('User');
		$roommodel = Ebh::app()->model('Classroom');
		
		$deauth = authcode($auth, 'DECODE');
		if (empty($deauth)) return FALSE;
		@list($password, $uid) = explode("\t", $deauth);
		$uid = intval($uid);
		if ($uid <= 0) {
			show_tips('参数非法!!!','http://www.ebh.net', 5);
			exit;
		}
		//验证用户是否有网校权限
		$user = $usermodel->getloginbyuid($uid, $password, TRUE);
		if(!empty($user)){
			if($user['groupid']==5){//老师
				$check = $roommodel->checkteacher($uid, $crid);
			}elseif($user['groupid']==6){//学生
				$check = $roommodel->checkstudent($uid, $crid);
			}
			if($check == 1){//跳转到kpan首页
				//写cookie
				$input->setcookie('crid',$crid,31536000);//默认保存1年
				header("Location:/");
			}else{
				$url= 'http://www.ebh.net/homev2.html';
				show_tips('您没有该网校的权限!!!',$url, 5);
			}
		}else{
			show_tips('参数非法!!!','http://www.ebh.net', 5);
			exit;
		}
	}
}

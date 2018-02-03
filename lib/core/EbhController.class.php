<?php
class EbhController extends Controller {
	public $crid;
	public $user;
	public $roominfo;
	public function __construct() {
		parent::__construct();
		$this->checklogin();
	}
	/**
	 * 验证用户登录
	 */
	public function checklogin() {
		$user = $this->getloginuser();
		$roominfo = $this->getcurroom();
		//此处用于代理服务器输出文件权限判断
		if ($_GET['jsondata']) {
			$crid = authcode($_GET['crid'], 'DECODE');
			$deauth = authcode($_GET['jsondata'], 'DECODE');
			if (empty($deauth) || empty($crid)) {
				header('Location:http://www.ebh.net/login.html?returnurl='.urlencode('http://kpan.ebh.net/'));
				exit;
			}
			$this->user = json_decode($deauth,TRUE);
			$this->crid = $crid;
			return;
		}
		//权限开通
		$power = $this->model('classroom')->checkRoomMoudle($roominfo['crid'],'http://kpan.ebh.net/jump.php?crid=[crid]');
		//print_r($power);exit;
		if (!$power) {
			echo 'has no power';exit;
		}

		if(empty($user) || empty($roominfo)){
			//跳转登录
			header('Location:http://www.ebh.net/login.html?returnurl='.urlencode('http://kpan.ebh.net/'));
			exit;
		}
		
		//p($user);
		//p($roominfo);
	}
	/**
	 * 加载model类
	 * @param string $modelname 模板名称
	 * @return object model对象
	 */
	public function model($modelname) {
		return Ebh::app()->model($modelname);
	}
	/**
	 *获取普通登录用户信息
	 */
	public function getloginuser() {
		if (isset($this->user)) return $this->user;
		$input = EBH::app()->getInput();
		$auth =$input->cookie('auth'); 
		if (!empty($auth)) {
			$usermodel = $this->model('User');
			$deauth = authcode($auth, 'DECODE');
			if (empty($deauth)) return FALSE;
			@list($password, $uid) = explode("\t", $deauth);
			$uid = intval($uid);
			if ($uid <= 0) {
				return FALSE;
			}
			$user = $usermodel->getloginbyuid($uid, $password, TRUE);
			if (!empty($user)) {
				$lastlogintime = $input->cookie('lasttime');
				$lastloginip = $input->cookie('lastip');
				$user['lastlogintime'] = empty($lastlogintime) ? '' : date('Y-m-d H:i', $lastlogintime);
				$user['lastloginip'] = $lastloginip;
			}
			$this->user = $user;
			return $user;
		}
		return FALSE;
	}
	/**
	 * 获取当前平台简要信息
	 * @return array 平台信息
	 */
	public function getcurroom() {
		if (isset($this->_roominfo)) return $this->_roominfo;
		$user = $this->user;
		$roommodel = $this->model('Classroom');
		$input = EBH::app()->getInput();
		$rooms = $this->getUserRooms();
		if(!empty($rooms)){
			//1.从url传递crid
			$getCrid = intval($input->get('crid'));
			if($getCrid>0 && array_key_exists($getCrid, $rooms)){
				//写入cookie
				$input->setcookie('crid',$getCrid,31536000);//默认保存1年
				$room = $rooms[$getCrid];
			}else{
				//2.先从cookie中读取crid
				$cookieCrid =intval($input->cookie('crid'));
				if($cookieCrid>0 && array_key_exists($cookieCrid, $rooms)){
					$room = $rooms[$cookieCrid];
				}else{
						//3.从用户所拥有的的网校中取一所
						//$cridArr = sort(array_column($rooms, 'crid'));
						$room = reset( $rooms);
						//写入cookie
						$input->setcookie('crid',$room['crid'],31536000);//默认保存1年
					}
				}
			$this->roominfo = $room;
			$this->crid = $this->roominfo['crid'];
		}else{
			$this->roominfo = FALSE;
			$this->crid = FALSE;
		}
		
		return $this->roominfo;
	}
	
	/**
	 * 获取用户所在的网校信息
	 */
	public function getUserRooms(){
		$user = $this->getloginuser();
		$roommodel = $this->model('Classroom');
		if(!empty($user)){
			//读取用户所在的网校
			if($user['groupid']==5){//老师
				$rooms = $roommodel->getroomlistbytid($user['uid']);
			}elseif($user['groupid']==6){//学生
				$rooms = $roommodel->getroomlistbyuid($user['uid']);
			}
			$rooms = array_coltokey($rooms,'crid');
		}
		
		return $rooms;
	}
}

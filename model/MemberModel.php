<?php
/*
会员
*/
class MemberModel extends CModel{
    public function __construct(){
        $this->db = $this->getebhdb();
    }

	/*
	添加会员
	@param array $param
	@return int
	*/
	public function addmember($param){
		if(!empty($param['username']))
			$userarr['username'] = $param['username'];
		if(!empty($param['password']))
			$userarr['password'] = md5($param['password']);
		if (!empty($param['mpassword']))	//md5加密后的用户密码
                $userarr['password'] = $param['mpassword'];
		if(isset($param['realname']))
			$userarr['realname'] = $param['realname'];
		if(isset($param['nickname']))
			$userarr['nickname'] = $param['nickname'];
		if(!empty($param['dateline']))
			$userarr['dateline'] = $param['dateline'];
		if(isset($param['sex']))
			$userarr['sex'] = $param['sex'];
		if(!empty($param['mobile']))
			$userarr['mobile'] = $param['mobile'];
		if(!empty($param['citycode']))
			$userarr['citycode'] = $param['citycode'];
		if(isset($param['address']))
			$userarr['address'] = $param['address'];
		if(!empty($param['email']))
			$userarr['email'] = $param['email'];
		if(!empty($param['face']))
			$userarr['face'] = $param['face'];
		if(!empty($param['qqopid']))
			$userarr['qqopid'] = $param['qqopid'];
		if(!empty($param['sinaopid']))
			$userarr['sinaopid'] = $param['sinaopid'];
		
		if(!empty($param['wxopenid']))
			$userarr['wxopenid'] = $param['wxopenid'];
		
		if(!empty($param['schoolname']))
			$userarr['schoolname'] = $param['schoolname'];
		$userarr['status'] = 1;
		$userarr['groupid'] = 6;
		// var_dump($userarr);
		$uid = $this->db->insert('ebh_users',$userarr);
		if($uid){
			$memberarr['memberid'] = $uid;
			if(isset($param['realname']))
				$memberarr['realname'] = $param['realname'];
			if(isset($param['nickname']))
				$memberarr['nickname'] = $param['nickname'];
			if(isset($param['sex']))
				$memberarr['sex'] = $param['sex'];
			if(!empty($param['birthdate']))
				$memberarr['birthdate'] = $param['birthdate'];
			if(!empty($param['phone']))
				$memberarr['phone'] = $param['phone'];
			if(!empty($param['mobile']))
				$memberarr['mobile'] = $param['mobile'];
			if(!empty($param['native']))
				$memberarr['native'] = $param['native'];
			if(!empty($param['citycode']))
				$memberarr['citycode'] = $param['citycode'];
			if(isset($param['address']))
				$memberarr['address'] = $param['address'];
			if(!empty($param['msn']))
				$memberarr['msn'] = $param['msn'];
			if(!empty($param['qq']))
				$memberarr['qq'] = $param['qq'];
			if(!empty($param['email']))
				$memberarr['email'] = $param['email'];
			if(!empty($param['face']))
				$memberarr['face'] = $param['face'];
			if(isset($param['profile']))
				$memberarr['profile'] = $param['profile'];
			$memberid = $this->db->insert('ebh_members',$memberarr);
			// var_dump($uid.'___'.$memberid.'````');
			
		}
		return $uid;
	}

}
?>
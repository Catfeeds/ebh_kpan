<?php
/**
 *用户Model类
 */
class UserModel extends CModel {
    /**
     * 用username和password判断登录
     * @param type $username
     * @param type $userpass
     * @param boolean $iscoding 是否加密过密码
     * @return boolean 返回用户信息数组
     */
    public function login($username,$userpass,$iscoding = FALSE) {
		if(empty($username))
			return FALSE;
        $pwd = $iscoding ? $userpass : md5($userpass);
        $username = $this->db->escape($username);
        $sql = "select u.uid, u.username, u.groupid, u.logincount,u.lastlogintime,u.lastloginip,u.password,u.status,u.allowip from ebh_users u where u.username=$username";
        $user = $this->db->query($sql)->row_array();
        if(empty($user) || $user['password'] != $pwd || $user['status'] == 0) {
            return false;
        }
        return $user;
    }
    /**
     * 用uid和password判断登录
     * @param type $uid
     * @param type $userpass
     * @param boolean $iscoding 是否加密过密码
     * @return boolean 返回用户信息数组
     */
    public function getloginbyuid($uid,$userpass,$iscoding = FALSE) {
        $pwd = $iscoding ? $userpass : md5($userpass);
        $sql = "select u.uid, u.username,u.realname,u.sex,u.email,u.face, u.groupid, u.credit,u.logincount,u.dateline,u.lastlogintime,u.password,u.balance,u.lastloginip,u.status,u.allowip,u.schoolname,u.mysign,u.address,u.mobile from ebh_users u where u.uid=$uid";
        $user = $this->db->query($sql)->row_array();
        if(empty($user) || $user['password'] != $pwd || $user['status'] == 0) {
            return false;
        }
        return $user;
    }
	/**
	* 根据用户auth信息获取用户信息
	*/
	public function getloginbyauth($auth) {
		@list($password, $uid) = explode("\t", authcode($auth, 'DECODE'));
        $uid = intval($uid);
        if ($uid <= 0) {
            return FALSE;
        }
        $user = $this->getloginbyuid($uid,$password,TRUE);
		return $user;
	}
	/*
	用户名是否存在
	@param string $username
	*/
	public function exists($username){
		$sql = 'select 1 from ebh_users where username = \''.$this->db->escape_str($username).'\' limit 1';
		return $this->db->query($sql)->row_array();
	}
	/*
	邮箱是否存在
	*/
	public function existsEmail($email){
		if(empty($email))
			return FALSE;
		$sql = 'select 1 from ebh_users where email = \''.$this->db->escape_str($email).'\' limit 1';
		return $this->db->query($sql)->row_array();
	}
        /**
         * 根据uid获取用户基本信息
         * @param int $uid
         * @return array 
         */
        public function getuserbyuid($uid) {
            $sql = 'select u.uid, u.username,u.realname,u.sex,u.email,u.mobile,u.face, u.groupid, u.credit,u.logincount,u.password,u.balance,u.lastloginip,u.lastlogintime,u.status,u.allowip,u.schoolname,u.mysign  from ebh_users u where u.uid = '.$uid;
            return $this->db->query($sql)->row_array();
        }
        /**
         * 修改用户信息
         * @param type $param
         * @param type $uid
         */
        public function update($param,$uid) {
            $afrows = FALSE;    //影响行数
            $userarr = array();
            //修改user表信息
            if(!empty($param['username'])){
                $userarr['username'] = $param['username'];
            }
            if (!empty($param['password']))
                $userarr['password'] = md5($param['password']);
			if (!empty($param['mpassword']))	//md5加密后的用户密码
                $userarr['password'] = $param['mpassword'];
            if (isset($param['status']))
                $userarr['status'] = $param['status'];
			if (isset($param['balance']))
                $userarr['balance'] = $param['balance'];
            if (isset($param['realname']))
                $userarr['realname'] = $param['realname'];
            if (isset($param['nickname']))
                $userarr['nickname'] = $param['nickname'];
            if (isset($param['mysign']))
            	$userarr['mysign'] = $param['mysign'];
            if (isset($param['sex']))
                $userarr['sex'] = $param['sex'];
            if (isset($param['mobile']))
                $userarr['mobile'] = $param['mobile'];
            if (isset($param['email']))
                $userarr['email'] = $param['email'];
            if (isset($param['citycode']))
                $userarr['citycode'] = $param['citycode'];
            if (isset($param['address']))
                $userarr['address'] = $param['address'];
            if (isset($param['face']))
                $userarr['face'] = $param['face'];
			if(!empty($param['qqopid']))
				$userarr['qqopid'] = $param['qqopid'];
			if(!empty($param['sinaopid']))
				$userarr['sinaopid'] = $param['sinaopid'];
			if(!empty($param['wxopenid']))
				$userarr['wxopenid'] = $param['wxopenid'];
			if(!empty($param['wxunionid']))
				$userarr['wxunionid'] = $param['wxunionid'];
			if(!empty($param['wxopid']))
				$userarr['wxopid'] = $param['wxopid'];
			
			if(!empty($param['lastlogintime']))
				$userarr['lastlogintime'] = $param['lastlogintime'];
			if(!empty($param['lastloginip']))
				$userarr['lastloginip'] = $param['lastloginip'];
			if(isset($param['allowip']))
				$userarr['allowip'] = $param['allowip'];
			$sarr = array();
			if(isset($param['logincount']))
				$sarr['logincount'] = 'logincount+1';
            $wherearr = array('uid' => $uid);
            if (!empty($userarr)) {
                $afrows = $this->db->update('ebh_users', $userarr, $wherearr, $sarr);
            }
            return $afrows;
        }
		
	/**
    * 根据username获取用户基本信息  场景：学校后台添加教师
    * @param int $uid
    * @return array 
    */
	public function getuserbyusername($username) {
		$sql = 'select u.uid,u.groupid,u.realname,u.sex,u.email from ebh_users u where u.username = \''.$this->db->escape_str($username).'\'';
		return $this->db->query($sql)->row_array();
	}
    /**
     * 新增一条用户记录
     *@author zkq
     *@param array $param
     *@return int uid
     *标注：1.返回0表示插入失败;2.禁止传空数组;3.禁止自定义uid;4.返回值为用户的uid,如果uid为0表示新增失败
     */
    public function _insert($param = array()){
        if(empty($param)||isset($param['uid'])){
            return 0;
        }else{
            return $this->db->insert('ebh_users',$param);
            }
    }
    /**
     *删除一条user记录
     *@author zkq
     *@param int $uid
     *@return bool
     */
    public function deletebyuid($uid=0){
        if($uid==0)return false;
        $where = array('uid'=>intval($uid));
        if($this->db->delete('ebh_users',$where)===false){
            return false;
        }else{
        	$redis = Ebh::app()->getCache('redis');
        	$redis->remove('shop_'.$uid);
            return true;
        }
    }
	/*
	*原创空间的个人详细资料
	*
	*/
	public function selectedprofile($username){
		if(empty($username))
			return FALSE;
		$sql = 'select u.username,u.sex,u.citycode,u.groupid,u.face,u.address,u.nickname,u.realname,m.qq,m.spacenum,m.email,m.profile from ebh_users u left join ebh_members m on m.memberid = u.uid left join ebh_cities c on u.citycode = c.citycode ';
		$wherearr = array();
		if(!empty($username))
		{
			$wherearr[] = 'u.username = \''.$username.'\'' ;
		}
		if (!empty ( $wherearr ))
		{
			 $sql .= ' WHERE '.implode(' AND ',$wherearr);
		}
		return $this->db->query($sql)->row_array();
	}
	
	/*
	qq,sina, wx 登录
	*/
	public function openlogin ($opcode,$type,$cookietime=0) {
		if(empty($opcode))
			return FALSE;
		if($type=='sina'){
			$sql = "SELECT uid,username,password FROM ebh_users  WHERE sinaopid='$opcode'";	
		}elseif($type=='wx'){
			$sql = "SELECT uid,username,password FROM ebh_users  WHERE wxunionid='$opcode'";
		}else{
			$sql = "SELECT uid,username,password FROM ebh_users  WHERE qqopid='$opcode'";
		}
		$data = $this->db->query($sql)->row_array();
		if($data){
			return $this->login($data['username'], $data['password'] ,true);	
		}else{
			return false;
		}
	}
	
	/**
	 * 通过微信unionid查询用户
	 */
	public function  getUserbyWeixin($unionid){
		if(empty($unionid))
			return FALSE;
		$sql = "select  u.username,u.groupid,u.uid,u.wxopid,u.wxopenid,u.wxunionid, u.realname,u.face,u.uid,u.password,u.lastlogintime,u.lastloginip,u.logincount,  u.status,u.allowip from  ebh_users u
				where u.wxunionid ='{$unionid}' ";
		return  $this->db->query($sql)->row_array();
	}
	
	/**
	 * 检测微信授权是否存在
	 */
	public function checkWeixinExist($unionid){
		if(empty($unionid))
			return FALSE;
		$sql = "select count(*) count from ebh_users where wxunionid = '{$unionid}' ";
		$row = $this->db->query($sql)->row_array();
		return ($row['count']>0) ? true : false;
	}
	
	/*
	账号关联信息
	*/
	public function getAssociateInfoByUsername($username){
		if(empty($username))
			return FALSE;
		$sql = 'select uid,password,qqopid,sinaopid,wxopid,wxopenid,wxunionid from ebh_users where username=\''.$this->db->escape_str($username).'\'';//echo $sql;
		return $this->db->query($sql)->row_array();
	}
	
	/**
	*根据用户名列表获取用户列表
	*/
	function getuserlistbyusername($usernamelist) {
		if(empty($usernamelist))
			return FALSE;
		$sql = 'select uid,username from ebh_users where username in ('.$usernamelist.')';
		return $this->db->query($sql)->list_array();
	}
	/*
	根据邮箱查询用户
	*/
	public function getUserByEmail($email) {
		if(empty($email))
			return FALSE;
		$sql = 'select uid,username,lastlogintime from ebh_users u where u.email=\'' . $this->db->escape_str($email) . '\'';
		return $this->db->query($sql)->row_array();
	}
	
	/**
	 * 根据绑定手机查询用户
	 */
	public function getUserByMobile($mobile){
		if(empty($mobile))
			return FALSE;
		$sql = 'select uid,username,mobile,lastlogintime from ebh_users u where u.mobile=\'' . $this->db->escape_str($mobile) . '\'';
		return $this->db->query($sql)->row_array();
	}
    /**
     *根据用户uid查询用户信息(支持数组)
     *
     */
    public function getUserInfoByUid($uid, $setKey = false){
        $uidArr = array();
        if(is_scalar($uid)){
            $uidArr = array($uid);
        }
        if(is_array($uid)){
            $uidArr = array_filter($uid, function($i) {
               return !empty($i);
            });
        }
        $in = '('.implode(',',$uidArr).')';
        $sql = 'select uid,username,realname,face,sex,groupid from ebh_users where uid in '.$in;
        return $this->db->query($sql)->list_array($setKey ? 'uid' : '');
    }

	/*
	searchableclassrooms表中是否存在
	*/
	public function getUserlistByUsernameOnScb($usernamelist,$upcrid = NULL){
		$sql = 'select username from ebh_searchableclassrooms where username in ('.$usernamelist.')';
		if(!empty($upcrid))
			$sql .= ' and upcrid='.$upcrid;
		return $this->db->query($sql)->list_array();
	}
	
	/*
	添加到可查询用户名表中
	*/
	public function addToScb($uarr){
		$sql = 'insert into ebh_searchableclassrooms (username,realname,sex,crname,upcrid,password) values';
		foreach($uarr as $user){
			$username = str_replace('　','',str_replace(' ','',$user['username']));
			$realname = str_replace('　','',str_replace(' ','',$user['realname']));
			$sex = $user['sex'];
			$crname = $user['crname'];
			$upcrid = $user['crid'];
			$password = $user['password'];
			$sql.= " ('$username','$realname',$sex,'$crname',$upcrid,'$password'),";
		}
		$sql = rtrim($sql,',');
		$this->db->query($sql);
	}

    /**
     *获取有头像的用户列表
     */
    public function getUserListWithFace($param = array()){
        if(!empty($param['uid'])){
             $sql = 'select username,uid,face from ebh_users where face<>\'\' and uid = '.$param['uid'];
             return $this->db->query($sql)->list_array();
        }
        if(empty($param['limit'])){
            return;
        }
        $sql = 'select username,uid,face from ebh_users where face<>\'\' order by uid limit '.$param['limit'];
        return $this->db->query($sql)->list_array();
    }
	/**
	*根据用户编号获取用户加密密码信息，可用于管理员登录老师和学生后台
	*/
	public function getUserPwd($uid) {
		$sql = 'select u.uid,u.username,u.password from ebh_users u where u.uid = '.$uid;
        return $this->db->query($sql)->row_array();
	}

	/**
	 * 获取包含多个用户的数组
	 * @param  array $uid_array uid数组
	 * @return array            用户数组
	 */
	public function getUserArray($uid_array) {
		$user_array = array();
		if (!empty($uid_array) && is_array($uid_array))
		{
			$uid_array = array_unique($uid_array);
			$sql = 'SELECT uid,username,realname FROM ebh_users WHERE uid IN(' . implode(',', $uid_array) . ')';
			$row = $this->db->query($sql)->list_array();
			foreach ($row as $v)
			{
				$user_array[$v['uid']] = array('username' => $v['username'], 'realname' => $v['realname']);
			}
		}
		return $user_array;
	}
	/**
	 * 根据username获取用户信息
	 */
	public function getUserinfoByUsername($usernames){
		if(empty($usernames)){
			return false;
		}
		$sql = 'select username,uid from ebh_users where username in ('.$usernames.')';
		return $this->db->query($sql)->list_array();

	}

	/**
     * 根据realname获取用户基本信息
     * @param int $crid
     * @param str $realname
     * @return array 
     */
	public function getUserinfoByname($realname,$crid) {
		if (empty($realname) || empty($crid)) {
			return;
		}
		$sql = 'select u.uid,u.groupid,u.realname,u.username,u.sex,u.email,u.face from ebh_roomusers ru left join ebh_users u on u.uid=ru.uid where ru.crid='.$crid.' and (u.realname like \'%'.$this->db->escape_str($realname).'%\' or u.username like \'%'.$this->db->escape_str($realname).'%\')';
		return $this->db->query($sql)->list_array();
	}

	/**
	 * 根据username获取passward
	 */
	public function getPasswardByUsername($username){
		if(empty($username)){
			return false;
		}
		$sql = 'select password from `ebh_users` where username = \''.$this->db->escape_str($username).'\' limit 1';
		$row = $this->db->query($sql)->row_array();
		if(!empty($row)){
			return $row['password'];
		}else{
			return false;
		}
	}
}

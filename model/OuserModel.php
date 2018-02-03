<?php
/**
 *OuserModel类 第三放登录model类
 */
class OuserModel extends CModel {
    public function __construct(){
        $this->db = $this->getebhdb();
    }
    /**
     * 用username和password判断登录
     * @param type $username第三方用户名
     * @param type $userpass第三方密码
     * @param boolean $iscoding 是否加密过密码
     * @return boolean 返回用户信息数组
     */
    public function getuserbyouser($username,$userpass,$iscoding = FALSE) {
        $pwd = $iscoding ? $userpass : md5($userpass);
        $username = $this->db->escape($username);
        $sql = "select u.uid,u.userpass from ebh_ousers u where u.username=$username";
        $ouser = $this->db->query($sql)->row_array();
        if(empty($ouser) || $ouser['userpass'] != $pwd) {
            return false;
        }
		$uid = $ouser['uid'];
		$usql = "select u.uid,u.username,u.password from ebh_users u where u.uid=$uid";
		$user = $this->db->query($usql)->row_array();
        return $user;
    }
	/**
     * 用username和password判断登录
     * @param type $username第三方用户名
     * @param type $userpass第三方密码
     * @param boolean $iscoding 是否加密过密码
     * @return boolean 返回用户信息数组
     */
    public function getOuserbyOuser($username,$userpass,$iscoding = FALSE) {
        $pwd = $iscoding ? $userpass : md5($userpass);
        $username = $this->db->escape($username);
        $sql = "select u.ouid,u.uid,u.userpass from ebh_ousers u where u.username=$username";
        $ouser = $this->db->query($sql)->row_array();
        if(empty($ouser) || $ouser['userpass'] != $pwd) {
            return false;
        }
		return $ouser;
    }
	/**
	*根据第三方账号获取对应的OUser对象
	*/
	public function getOuserByUserName($username) {
		$username = $this->db->escape($username);
        $sql = "select u.ouid,u.uid,u.userpass,u.usertag from ebh_ousers u where u.username=$username";
        $ouser = $this->db->query($sql)->row_array();
		return $ouser;
	}
	/**
	* 更新第三方账号信息
	*/
	public function update($param = array(),$where = array()) {
		if(empty($where['ouid']))
			return FALSE;
		$setarr = array();
		if(!empty($param['userpass'])) {
			$setarr['userpass'] = $param['userpass'];
		}
		if (empty($setarr))
			return FALSE;
		return $this->db->update('ebh_ousers', $setarr, $where);
	}
	/*
	添加ouser记录
	@param array $param
	@return int
	*/
	public function add($param){
		if(!empty($param['uid']))
			$userarr['uid'] = $param['uid'];
		if(!empty($param['useruid']))
			$userarr['useruid'] = $param['useruid'];
		if(isset($param['username']))
			$userarr['username'] = $param['username'];
		if(isset($param['userpass']))
			$userarr['userpass'] = $param['userpass'];
		if(!empty($param['usertag']))
			$userarr['usertag'] = $param['usertag'];
		return $this->db->insert('ebh_ousers',$userarr);
    }
}

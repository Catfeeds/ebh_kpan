<?php
/**
 * 用户信息model
 */
class UserinfoModel extends CModel{
	private $pandb = NULL;
	function __construct(){
		parent::__construct();
		$this->pandb = Ebh::app()->getOtherDb('pandb');//pan
	}
	public function getSize($param){
		$filesize = 0;
		if(empty($param['uid']) || empty($param['crid']))
			return $filesize;
		$sql = 'SELECT filesize FROM pan_userinfos WHERE uid=' . intval($param['uid']) . ' AND crid=' . intval($param['crid']);
		$row = $this->pandb->query($sql)->row_array();
		if(!empty($row))
			$filesize = $row['filesize'];
		return $filesize;
	}

	/**
	 *获取某个网校下单个用户云盘使用的信息
	 */
	public function getOnePanUserinfo($param){
		if(empty($param['crid']))
			return '';
		$sql =  $sql = 'select c.totalpansize,c.usepansize,c.defaultpansize from pan_giveinfos c where c.crid='.intval($param['crid']);
		$row = $this->pandb->query($sql)->row_array();
		return $row;
	}
}
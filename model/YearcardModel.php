<?php
/*
年卡
*/
class YearcardModel extends CModel{
    public function __construct(){
        $this->db = $this->getebhdb();
    }
	/**
	*根据卡号获取年卡信息
	*@param string $cardnumber 卡号
	*/
	public function getYearcardByCardnumber($cardnumber,$crid = 0) {
		$sql = 'select c.cardid,c.cardnumber,c.time,c.dateline,c.period,c.status,c.cardpass,c.activedate,c.crid from ebh_yearcards c';
		$sql .= ' where c.cardnumber='.$this->db->escape($cardnumber);
		if(!empty($crid)){
			$sql .= ' AND c.crid = '.$this->db->escape_str($crid);
		}
		return $this->db->query($sql)->row_array();
	}
	/**
	*更新年卡信息，一般为年卡激活时用
	*/
	public function update($param) {
		if(empty($param['cardid']))
			return FALSE;
		$wherearr = array('cardid'=>$param['cardid']);
		$setarr = array();
		if(isset($param['status'])) {
			$setarr['status'] = $param['status'];
		}
		if(isset($param['activedate']))
			$setarr['activedate'] = $param['activedate'];
		else if(isset($param['status']) && $param['status'] == 1) {
			$setarr['activedate'] = SYSTIME;
		}
		return $this->db->update('ebh_yearcards',$setarr,$wherearr);
	}
}
?>
<?php
/*
开通和支付服务相关Model类
*/
class OpencountModel extends CModel{
    public function __construct(){
        $this->db = $this->getebhdb();
    }

	/**
	*插入支付记录，默认情况下为未支付记录
	*/
	public function insert($param) {
		$setarr = array ();
		if(!empty($param ['uid'])){
			$setarr['uid'] = $param['uid'];
		}
		if(!empty($param ['username'])){
			$setarr['username'] = $param['username'];
		}
		if(!empty($param ['realname'])){
			$setarr['realname'] = $param['realname'];
		}
		if(!empty($param ['sex'])){
			$setarr['sex'] = intval($param['sex']);
		}
		if(!empty($param ['birthday'])){
			$setarr['birthday'] = intval($param['birthday']);
		}
		if(!empty($param ['mobile'])){
			$setarr['mobile'] = $param['mobile'];
		}
		if(!empty($param ['email'])){
			$setarr['email'] = $param['email'];
		}
		if(!empty($param ['school'])){
			$setarr['school'] = $param['school'];
		}
		if(!empty($param ['grade'])){
			$setarr['grade'] = $param['grade'];
		}
		if(!empty($param ['class'])){
			$setarr['class'] = $param['class'];
		}
		if(!empty($param ['citycode'])){
			$setarr['citycode'] = $param['citycode'];
		}
		if(!empty($param ['address'])){
			$setarr['address'] = $param['address'];
		}
		if(!empty($param ['password'])){
			$setarr['password'] = $param['password'];
		}
		if(!empty($param ['type'])){
			$setarr['type'] = intval($param['type']);//type{1 为激活，2为充值}
		}
		if(!empty($param ['paytime'])){
			$setarr['paytime'] = intval($param['paytime']);
		}
		if(!empty($param ['ordernumber'])){
			$setarr['ordernumber'] = $param['ordernumber'];
		}
		if(!empty($param ['addtime'])){
			$setarr['addtime'] = intval($param['addtime']);
		}
		if(!empty($param ['status'])){
			$setarr['status'] = $param ['status'];
		}else{
			$setarr['status'] = 0;
		}
		if(!empty($param ['money'])){
			$setarr['money'] = $param['money'];
		}else{
			$setarr['money'] = 0;
		}
		if(!empty($param ['ip'])){
			$setarr['ip'] = $param['ip'];
		}
		if(!empty($param ['dateline'])){
			$setarr['dateline'] = $param['dateline'];
		}else{
			$setarr['dateline'] = SYSTIME;
		}	
		if(!empty($param ['crid'])){
			$setarr['crid'] = $param ['crid'];
		}
		if(!empty($param ['payfrom'])){	//支付来源 1为年卡 2为快钱 3为支付宝 
			$setarr['payfrom'] = $param ['payfrom'];
		}
		if(!empty($param ['paycode'])){	//支付交易号，适用于快钱和支付宝交易
			$setarr['paycode'] = $param ['paycode'];
		}
		if(!empty($param ['bankid'])){	//银行代码，适用于快钱
			$setarr['bankid'] = $param ['bankid'];
		}
		
		return $this->db->insert('ebh_tempstudents',$setarr);
	}

}

?>
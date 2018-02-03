<?php
/*
积分
*/
class CreditModel extends CModel{
    public function __construct(){
        $this->db = $this->getebhdb();
    }

	/*
	积分记录数量
	@param int $uid
	*/
	public function getUserCreditCount($param){
		$wherearr = array();
		$sql = 'select count(*) count from ebh_creditlogs';
		if(!empty($param['uid']))
			$wherearr[]= 'uid='.$param['uid'];
		if(!empty($param['toid']))
			$wherearr[]= 'toid='.$param['toid'];
		if(!empty($param['ruleid']))
			$wherearr[]= 'ruleid='.$param['ruleid'];
		if(!empty($param['credit']))
			$wherearr[]= 'credit='.$param['credit'];
		if(!empty($param['dateline']))//特殊条件
			$wherearr[]= $param['dateline'];
		if(!empty($param['type']))
			$wherearr[]= 'type='.$param['type'];
		$sql.= ' where '.implode(' AND ',$wherearr);
		//log_message($sql);
		$count = $this->db->query($sql)->row_array();
		return $count['count'];
	}
	/*
	根据ruleid查看积分规则信息
	@param int $ruleid
	*/
	public function getCreditRuleInfo($ruleid){
		$sql = 'select r.rulename,r.action,r.credit,r.actiontype,r.maxaction
			from ebh_creditrules r where r.ruleid='.$ruleid;
		return $this->db->query($sql)->row_array();
	}
	/*
	添加积分日志,并修改积分
	@param array $param ruleid, toid/aid..
	*/
	public function addCreditlog($param){
		if(is_numeric($param))
			$logarr['ruleid'] = $param;
		else
			$logarr['ruleid'] = $param['ruleid'];
		$user = Ebh::app()->user->getloginuser();
		if(!empty($param['uid']))
			$logarr['uid'] = $param['uid'];
		else
			$logarr['uid'] = $user['uid'];
		
		$flag = 0;
		if(!empty($param['uid'])){//指定了受分对象的
			$logarr['toid'] = $param['uid'];
		}else if(!empty($param['aid'])){//指定了答疑号的,被采纳为最佳答案
			$sql = 'select q.uid,a.uid toid,q.title from ebh_askanswers a 
				join ebh_askquestions q on (q.qid=a.qid)';
			$warr[] = 'a.aid='.$param['aid'];
			$warr[] = 'q.uid='.$logarr['uid'];
			$sql.= ' where '.implode(' AND ',$warr);
			$temp = $this->db->query($sql)->row_array();
			$logarr['uid'] = empty($param['qid']) ? $temp['uid'] : $param['qid'];//记录qid
			$logarr['toid'] = $temp['toid'];
			$logarr['type'] = 3;
			$logarr['detail'] = $temp['title'];
		}else if(!empty($param['qid'])){//指定了qid的,回答问题
			$sql = 'select q.title,q.qid from ebh_askquestions q';
			$warr[] = 'q.qid='.$param['qid'];
			$sql.= ' where '.implode(' AND ',$warr);
			$temp = $this->db->query($sql)->row_array();
			$logarr['toid'] = $logarr['uid'];
			$logarr['uid'] = $temp['qid'];
			$logarr['detail'] = $temp['title'];
			$logarr['type'] = 3;
		}else if(!empty($param['eid'])){//指定了eid的,完成作业
			$logarr['toid'] = $logarr['uid'];
			$logarr['detail'] = $param['detail'];
			$logarr['type'] = 4;
		}elseif(!empty($param['cwid']) && $param['ruleid'] != 5){
			$sql = 'select cw.title,cw.cwid,cw.uid from ebh_coursewares cw';
			$warr[] = 'cw.cwid='.$param['cwid'];
			$sql.= ' where '.implode(' AND ',$warr);
			$temp = $this->db->query($sql)->row_array();
			$logarr['uid'] = $param['cwid'];
			$logarr['detail'] = $temp['title'];
			$logarr['toid'] = $temp['uid'];
			// $logarr['type'] = 0;
		}else{//没有指定，则为自己
			$logarr['toid'] = $logarr['uid'];
		}
		$ruleinfo = $this->getCreditRuleInfo($logarr['ruleid']);
		//每次都增加
		if($ruleinfo['actiontype'] == 0){
			$flag = 1;
		}
		//只一次
		elseif($ruleinfo['actiontype'] == -1){
			$wherearr['toid'] = $logarr['toid'];
			$wherearr['ruleid'] = $logarr['ruleid'];
			$logcount = $this->getUserCreditCount($wherearr);
			if($logcount>0)
				return ;
			else{
				$flag=1;
			}
		}
		//每天增加有限次数
		elseif($ruleinfo['actiontype'] == -2){
			$today = strtotime(Date('Y-m-d'));
			$wherearr['toid'] = $logarr['toid'];
			$wherearr['ruleid'] = $logarr['ruleid'];
			$wherearr['dateline'] = ' dateline>'.$today.' and dateline<'.($today+86400);
			$logcount = $this->getUserCreditCount($wherearr);
			if($logcount>=$ruleinfo['maxaction']){
				if(!empty($param['nocheck'])&&($param['nocheck']==true)){//抽奖再来一次不需要检测最大次数;权限由控制器给出
					$flag=1;
				}else{
					return ;
				}
				
			}else{
				$uniqueconfirm = 0;
				if(!empty($param['cwid'])){
					$wherearr['uid'] = $param['cwid'];
					$wherearr['type'] = 2;
					$uniqueconfirm = 1;
				}elseif(!empty($param['qid'])){
					$wherearr['uid'] = $param['qid'];
					$wherearr['type'] = 3;
					$uniqueconfirm = 1;
				}
				if($uniqueconfirm){
					$logcount = $this->getUserCreditCount($wherearr);
					if($logcount>0)
						return;
					else{
						$logarr['type'] = $wherearr['type'];
						$logarr['uid'] = $wherearr['uid'];
					}
				}
				$flag=1;
			}
		}
		//按时间段增加
		else{
			return;
		}
		
		//添加记录并增加toid的积分
		if($flag){
			if($logarr['ruleid'] == 16 && isset($param['productid']) && isset($param['credit'])){//积分兑换
				$logarr['credit'] = $param['credit'];
				$logarr['productid'] = $param['productid'];
			}
			elseif(isset($param['credit']))
				$logarr['credit'] = $param['credit'];
			else
				$logarr['credit'] = $ruleinfo['credit'];
			$logarr['dateline'] = SYSTIME;
			$logarr['fromip'] = getip();
			if(!empty($param['detail']))
				$logarr['detail'] = $param['detail'];
			$res = $this->db->insert('ebh_creditlogs',$logarr);
			$sparam = array('credit'=>'credit'.$ruleinfo['action'].$logarr['credit']);
			$this->db->update('ebh_users',array(),'uid='.$logarr['toid'],$sparam);
			/*
			if($ruleinfo['action'] == '+' && $logarr['ruleid'] != 29){log_message(111);
				$redis = $redis = Ebh::app()->getCache('cache_redis');
				$roominfo = Ebh::app()->room->getcurroom();
				$crcache = $redis->hget('credit',$roominfo['crid']);
				$crcache = unserialize($crcache);
				$day = Date('Y/m/d',SYSTIME);
				if(isset($crcache[$day]))
					$crcache[$day] += $logarr['credit'];
				else
					$crcache[$day] = $logarr['credit'];
				$redis->hset('credit',$roominfo['crid'],$crcache);
			}*/
			return $res;
		}
	}
}
?>
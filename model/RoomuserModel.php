<?php

/*
  教室与会员,前台会员->云教育网校
 */

class RoomuserModel extends CModel {
    public function __construct(){
        $this->db = $this->getebhdb();
    }

    /**
     * 插入ebh_roomusers记录，主要用于学员和教室的绑定
     * @param type $param
     * @return boolean
     */
    public function insert($param) {
        if (empty($param['crid']) || empty($param['uid']))
            return FALSE;
        $setarr = array();
        $setarr['crid'] = $param['crid'];
        $setarr['uid'] = $param['uid'];
        if (!empty($param ['cdateline'])) { //记录添加时间
            $setarr ['cdateline'] = $param ['cdateline'];
        } else {
            $setarr ['cdateline'] = SYSTIME;
        }
        if (!empty($param ['begindate'])) { //服务开始时间
            $setarr ['begindate'] = $param ['begindate'];
        }
        if (!empty($param ['enddate'])) {   //服务结束时间
            $setarr ['enddate'] = $param ['enddate'];
        }
        if (!empty($param ['cnname'])) {   //学生真实姓名，此处只做存档用
            $setarr ['cnname'] = $param ['cnname'];
        }
		if (isset($param ['cstatus'])) { //状态，1正常 0 锁定
            $setarr ['cstatus'] = $param['cstatus'];
        }
        if (isset($param ['sex'])) {   //性别
            $setarr ['sex'] = $param ['sex'];
        }
        if (isset($param ['birthday'])) {   //出生日期
            $setarr ['birthday'] = $param ['birthday'];
        }
        if (!empty($param ['mobile'])) {   //联系方式
            $setarr ['mobile'] = $param ['mobile'];
        }
        if (!empty($param ['email'])) {   //邮箱
            $setarr ['email'] = $param ['email'];
        }

        $afrows = $this->db->insert('ebh_roomusers',$setarr);
        return $afrows;
    }

}

?>
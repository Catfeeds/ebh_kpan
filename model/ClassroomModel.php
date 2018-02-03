<?php

/*
 * ClassroomModel教师平台model类
 */

class ClassroomModel extends CModel {
    /**
     * 添加教室对应的课件数
     * @param int $crid 课程编号
     * @param int $num 如为正数则添加，负数则为减少
     */
    public function addcoursenum($crid,$num = 1) {
        $where = 'crid='.$crid;
        $setarr = array('coursenum'=>'coursenum+'.$num);
        $this->db->update('ebh_classrooms',array(),$where,$setarr);
    }
    /**
     * 添加教室对应的学生数
     * @param int $crid 教室编号
     * @param int $num 如为正数则添加，负数则为减少
     */
    public function addstunum($crid,$num = 1) {
        $where = 'crid='.$crid;
        $setarr = array('stunum'=>'stunum+'.$num);
        $this->db->update('ebh_classrooms',array(),$where,$setarr);
    }
	/**
     * 添加教室对应的教师数
     * @param int $crid 教室编号
     * @param int $num 如为正数则添加，负数则为减少
     */
    public function addteanum($crid,$num = 1) {
        $where = 'crid='.$crid;
        $setarr = array('teanum'=>'teanum+'.$num);
        $this->db->update('ebh_classrooms',array(),$where,$setarr);
    }
    
    /*
  检测某网校是否有模块的权限
  */
  public function checkRoomMoudle($crid,$url_t){
    if (empty($crid) OR empty($url_t)) {
      return FALSE;
    }
    $sql = 'select moduleid from ebh_roommodules rm left join ebh_appmodules am using (moduleid) where rm.crid ='.$crid.' and am.url_t=\''.$url_t.'\'';
    return $this->db->query($sql)->list_array();
  }

    public function getroomlist($param = array(), $select = '') {
        if (!empty($select))
            $sql = 'select ' . $select . ' from ebh_classrooms cr ';
        else
            $sql = 'select cr.crid,cr.upid,cr.catid,cr.crname,cr.summary,cr.dateline,cr.cface,cr.domain,cr.crprice,cr.hastv,cr.tvlogo from ebh_classrooms cr ';
        $wherearr = array();
        if (isset($param['status']))
            $wherearr[] = 'cr.status=' . $param['status'];
        if (isset($param['upid'])) {
            $wherearr[] = 'cr.upid=' . $param['upid'];
        }
        if(isset($param['property'])){
        	if(is_array($param['property'])){
        		$wherearr[] = 'cr.property in ('.implode(',',$param['property']).')';
        	}else{
        		$wherearr[] = 'cr.property ='.intval($param['property']);
        	}
        }
        if(isset($param['isschool'])){
        	if(is_array($param['isschool'])){
        		$wherearr[] = 'cr.isschool in ('.implode(',',$param['isschool']).')';
        	}else{
        		$wherearr[] = 'cr.isschool ='.intval($param['isschool']);
        	}
        }
        if (!empty($param['filterorder']))
            $wherearr[] = 'cr.displayorder < ' . $param['filterorder'];
        if (!empty($wherearr))
            $sql .= ' WHERE ' . implode(' AND ', $wherearr);
        if (!empty($param['order']))
            $sql .= ' ORDER BY ' . $param['order'];
        else
            $sql .= ' ORDER BY cr.crid desc ';
        if(!empty($param['limit']))
          $sql .= ' limit '.$param['limit'];
        else {
          if (empty($param['page']) || $param['page'] < 1)
            $page = 1;
          else
            $page = $param['page'];
          $pagesize = empty($param['pagesize']) ? 10 : $param['pagesize'];
          $start = ($page - 1) * $pagesize;
          $sql .= ' limit ' . $start . ',' . $pagesize;
        }
        return $this->db->query($sql)->list_array();
    }

    /**
     * 根据域名查询room平台信息
     * @param string $domain需查域名
     */
    public function getroomdetailbydomain($domain) {
        $domain = $this->db->escape($domain);
        $sql = "select cr.status,cr.crid,cr.uid,cr.crname,cr.domain,cr.template,cr.upid,cr.isschool,cr.dateline,cr.summary,cr.crlabel,cr.cface,cr.banner,cr.crqq,cr.craddress,cr.crphone,cr.cremail,cr.modulepower,cr.stumodulepower,cr.ctype,cr.lng,cr.lat,cr.crprice,cr.tplsetting,cr.grade,cr.ispublic,cr.coursenum,cr.stunum,cr.iscollege,cr.checktype,cr.fulldomain,cr.icp,cr.kefu,cr.kefuqq from ebh_classrooms cr where cr.domain=$domain";
        return $this->db->query($sql)->row_array();
    }

    /**
     * 判断学生是否有教室权限
     * @param int $uid 用户编号
     * @param int $crid 对应教室编号
     * @param boolean $charge 是否为收费平台，如为收费平台，则需要验证有效期
     * @return int 返回验证结果，1表示有权限 2表示已过期 0表示用户已停用 -1表示无权限 -2参数非法
     */
    public function checkstudent($uid, $crid, $charge = false) {
        $sql = "select u.`status`,ru.cstatus,ru.begindate,ru.enddate from ebh_users u join ebh_roomusers ru on (u.uid = ru.uid) where u.uid=$uid and ru.crid=$crid";
        $data = $this->db->query($sql)->row_array();
        if (empty($data))
            return -1;
        if ($data['status'] != 1)
            return 0;
        if (!empty($data['enddate']) && $data['enddate'] < (EBH_BEGIN_TIME - 86400))
            return 2;
        if ($charge) { //如果为收费平台，如果没有时间或者已过期
            if (empty($data['enddate']) || $data['enddate'] < (EBH_BEGIN_TIME - 86400)) {
                return 2;
            }
        }
        return 1;
    }

    /*
      判断教师是否有教室权限
      @param $tid 教师编号
      @param $crid 对应教室编号
      @return 返回验证结果，1表示有权限 0表示用户已停用 -1表示无权限
     */

    function checkteacher($tid, $crid) {
        $sql = "select u.status ustatus,rt.status tstatus from ebh_users u join ebh_roomteachers rt on (u.uid = rt.tid) where u.uid = $tid and crid=$crid";
        $data = $this->db->query($sql)->row_array();
        if (empty($data))
            return -1;
        if ($data['ustatus'] != 1 || $data['tstatus'] != 1)
            return 0;
        return 1;
    }

    /*
      判断教师是否对学校有控制权限，一般为上级学校的所有者能对子集的学校进行管理
      @param $tid 教师编号
      @param $crid 对应教室编号
      @return 返回验证结果，1表示有权限 其他为无权限
     */

    function checkcontrolteacher($tid, $crid) {
        $upid = 0;
        $haspower = 0;
        while (true) {
            $sql = 'select upid from ebh_classrooms where crid=' . $crid;
            $row = $this->db->query($sql)->row_array();
            if (empty($row) || empty($row['upid']))
                break;
            $upsql = 'select upid,uid from ebh_classrooms where crid=' . $row['upid'];
            $uprow = $this->db->query($upsql)->row_array();
            if (empty($uprow))
                break;
            if ($uprow['uid'] == $tid) {
                $haspower = 1;
                break;
            } else {
                $crid = $row['upid'];
            }
        }
        return $haspower;
    }

    /**
     * 根据教师编号获取教师有权限的平台
     * @param int $tid教师编号
     * @return array 平台列表
     */
    function getroomlistbytid($tid) {
        $sql = 'select c.crid,c.crname,c.icp,c.domain,c.upid,c.cface,c.summary,c.coursenum,c.teanum,c.stunum,c.fulldomain,c.uid from ebh_roomteachers rt ' .
                'join ebh_classrooms c on (rt.crid = c.crid) ' .
                'where rt.tid = ' . $tid . ' and rt.status = 1';
        return $this->db->query($sql)->list_array();
    }

	 /**
     * 获取TV版平台
     * @return array 平台列表
     */
    function getTVroomlist() {
        $sql = 'select crid,crname,domain,upid,cface,summary,hastv from ebh_classrooms where hastv = 1 order by displayorder';
        return $this->db->query($sql)->list_array();
    }

	/**
     * 根据学生编号获取学生有权限的平台
     * @param int $uid学生编号
     * @return array 平台列表
     */
    function getroomlistbyuid($uid) {
        $sql = 'select c.crid,c.crname,c.icp,c.domain,c.fulldomain from ebh_roomusers rc ' .
                'join ebh_classrooms c on (rc.crid = c.crid) ' .
                'where rc.uid = ' . $uid . ' and rc.cstatus = 1';
        return $this->db->query($sql)->list_array();
    }
	
	
    /**
     * 获取用户在本平台的余额
     * @param int $crid
     * @param int $uid
     */
    function getuserroombalance($crid, $uid) {
        if (empty($crid) || empty($uid))
            return 0;
        $sql = 'select rbalance from ebh_roomusers ru where ru.crid = ' . $crid . ' and ru.uid=' . $uid;
        $balancerow = $this->db->query($sql)->row_array();
        if (empty($balancerow) || empty($balancerow['rbalance']))
            return 0;
        return $balancerow['rbalance'];
    }

    /**
     * 判断用户是否对共享平台有播放权限
     * @param int $crid 共享平台id
     * @param int $uid 用户编号
     * @param int $groupid 用户组编号
     * @return int 1表示有权限，-1表示无权限
     */
    function checkshareuser($crid, $uid, $groupid) {
        if (empty($uid) || empty($crid))
            return false;
        $sql = '';
        if ($groupid == 5) {
            $sql = 'select count(*) count from ebh_roomteachers rt join ebh_roompermissions rp on (rt.crid=rp.crid) where rt.tid=' . $uid;
        } else {
            $sql = 'select count(*) count from ebh_roomusers ru join ebh_roompermissions rp on (ru.crid=rp.crid) where ru.uid=' . $uid;
        }
        $countrow = $this->db->query($sql)->row_array();
        if (empty($countrow) || $countrow['count'] == 0)
            return -1;
        return 1;
    }

	//免费课件(金华,cq,fssq免费试听)
	function getfreecourse($para){
	//	print_r($para);
		$sql = 'SELECT cw.cwid,cw.title,cw.summary,cw.logo,cw.cwsource,r.crid,r.isfree,IFNULL(s.displayorder,1000) sdisplayorder from ebh_roomcourses r left join ebh_coursewares cw on r.cwid = cw.cwid left join ebh_sections s on r.sid = s.sid ';
		$wherearr = array();
	
		if (!empty($para['crid'])) {
            $wherearr[] = ' r.crid in (' . $para['crid'] .') '  ;
        }
		if (!empty($para['status'])) {
            $wherearr[] = ' cw.status in (' . $para['status'] . ') ';
        }
		if (!empty($para['isfree'])) {
        	$wherearr[] = 'r.isfree = '.$para['isfree'];
        }
		if(!empty($wherearr)) {
            $sql .= ' WHERE '.implode(' AND ',$wherearr);
        }
        if(!empty($para['displayorder'])) {
            $sql .= ' ORDER BY '.$para['displayorder'];
        } else {
            $sql .= ' ORDER BY r.displayorder';
        }
        if(!empty($para['limit'])) {
            $sql .= ' limit '. $para['limit'];
        } else {
            $sql .= ' limit 0,10';
        }
        return $this->db->query($sql)->list_array();
	}

/*
	后台获取教室列表
	*/
	public function getclassroomlist($param){
		$sql = 'select c.crid,c.crname,c.begindate,c.crprice,c.upid,c.enddate,c.dateline,c.maxnum,c.domain,c.status,c.ctype,c.summary,u.realname,u.nickname,u.username,c.displayorder,uu.username as agentname,c.profitratio from ebh_classrooms c join ebh_users u on u.uid = c.uid left join ebh_users uu on uu.uid=c.agentid';
		if(isset($param['q']))
			$wherearr[] = '( c.crname like \'%'. $this->db->escape_str($param['q']) .'%\' or c.domain like \'%'. $this->db->escape_str($param['q']) .'%\')';
		if(!empty($param['crid']))
			$wherearr[] = ' crid = '.$param['crid'];
		if(!empty($param['isschool'])){
			$wherearr[] = ' isschool='.$param['isschool'];
		}
		if(!empty($param['notfree']))
			$wherearr[] = ' (c.isschool = 6 or c.isschool = 2 or c.isschool = 7)';
		if(isset($param['hastv'])){
			$wherearr[] = ' c.hastv = '.$this->db->escape_str($param['hastv']);
		}
		if(isset($param['ctype'])){
			$wherearr[] = ' c.ctype = '.$this->db->escape_str($param['ctype']);
		}
		if(!empty($wherearr))
			$sql.= ' WHERE '.implode(' AND ',$wherearr);
		$sql.=' order by crid desc';
		if(!empty($param['limit'])){
        $sql .= ' limit '.$param['limit'];
    }else {
        if (empty($param['page']) || $param['page'] < 1)
          $page = 1;
        else
          $page = $param['page'];
        $pagesize = empty($param['pagesize']) ? 10 : $param['pagesize'];
        $start = ($page - 1) * $pagesize;
        $sql .= ' limit ' . $start . ',' . $pagesize;
    }
		return $this->db->query($sql)->list_array();
	}
	/*
	简单无条件查询，供下拉菜单使用
	*/
	public function getsimpleclassroomlist(){
		$sql = 'select c.crid,c.domain,c.crname from ebh_classrooms c';
		return $this->db->query($sql)->list_array();
	}
	/**
	 * 获取所有网校列表
	 * @return 所有网校列表
	 */
	public function getclassroomlistall(){
		$sql = 'select c.crid,c.domain,c.crname,c.cface from ebh_classrooms c';
		return $this->db->query($sql)->list_array();
	}
	/*
	后台获取教室数量
	*/
	public function getclassroomcount($param){
		$sql = 'select count(*) count from ebh_classrooms c ';
		if(!empty($param['q']))
			$wherearr[] = '(c.crname like \'%'. $this->db->escape_str($param['q']) .'%\' or c.domain like \'%'. $this->db->escape_str($param['q']) .'%\')';
		if(!empty($param['beginprice']))
			$wherearr[] = ' c.crprice >= '.$param['beginprice'];
		if(!empty($param['endprice']))
			$wherearr[] = ' c.crprice <= '.$param['endprice'];
		if(!empty($param['crid']))
			$wherearr[] = ' crid = '.$param['crid'];
		if(!empty($param['isschool']))
	 		$wherearr[] = 'isschool = '.intval($param['isschool']);
	 	if(!empty($param['property']))
	 		$wherearr[] = 'property = '.intval($param['property']);
		if(!empty($param['grade']))
			$wherearr[] = 'c.grade = '.intval($param['grade']);
		if(!empty($param['citycode']))
			$wherearr[] = 'c.citycode like \''.$this->db->escape_str($param['citycode']).'%\'';
		if(!empty($param['subject'])){
			$wherearr[] = ' c.crname like \'%'. $this->db->escape_str($param['subject']) .'%\'';
		}
		if(!empty($param['notfree']))
			$wherearr[] = ' (c.isschool = 6 or c.isschool = 2 or c.isschool = 7)';
		if(isset($param['hastv'])){
			$wherearr[] = ' c.hastv = '.$this->db->escape_str($param['hastv']);
		}
		if(isset($param['ctype'])){
			$wherearr[] = ' c.ctype = '.$this->db->escape_str($param['ctype']);
		}
		if(!empty($wherearr))
			$sql.= ' WHERE '.implode(' AND ',$wherearr);
		$count = $this->db->query($sql)->row_array();
		return $count['count'];
	}
	/*
	删除教室
	@param $crid 教室编号
	@return int
	*/
	public function deleteclassroom($crid){
		$this->db->begin_trans();
		$this->db->delete('ebh_classrooms','crid='.$crid);
		$this->db->delete('ebh_roomteachers','crid='.$crid);
		$this->db->delete('ebh_roomusers','crid='.$crid);
		$sql = 'select classid from ebh_classes where crid='.$crid;
		$classes = $this->db->query($sql)->list_array();
		if(!empty($classes)){
			$classids ='';
			foreach($classes as $class){
				if(!empty($classids))
					$classids.=','.$class['classid'];
				else
					$classids = $class['classid'];
			}
			$sql = 'delete from ebh_classteachers where classid in ('.$classids.')';
			$this->db->query($sql);
			$sql = 'delete from ebh_classstudents where classid in ('.$classids.')';
			$this->db->query($sql);
			
			$this->db->delete('ebh_classes','crid='.$crid);
		}
		$this->db->delete('ebh_teacherfolders','crid='.$crid);
		
		//删除网校 对应删除网校结算管理账号
		$jsql = "delete from ebh_billusers where crid =  {$crid}";
		$this->db->query($jsql);
		
		if ($this->db->trans_status() === FALSE) {
            $this->db->rollback_trans();
            return FALSE;
        } else {
            $this->db->commit_trans();
        }
		return TRUE;
	}
	/*
	添加教室
	@param array $param
	@return int
	*/
	public function addclassroom($param){
		if(isset($param['status']))
			$setarr['status'] = $param['status'];
		if(!empty($param['crname']))
			$setarr['crname'] = $param['crname'];
		if(!empty($param['cface']))
			$setarr['cface'] = $param['cface'];
		if(!empty($param['uid']))
			$setarr['uid'] = $param['uid'];
		if(!empty($param['catid']))
			$setarr['catid'] = $param['catid'];
		if(isset($param['upid']))
			$setarr['upid'] = $param['upid'];
		if(!empty($param['citycode']))
			$setarr['citycode'] = $param['citycode'];
		if(!empty($param['craddress']))
			$setarr['craddress'] = $param['craddress'];
		if(!empty($param['crphone']))
			$setarr['crphone'] = $param['crphone'];
		if(!empty($param['cremail']))
			$setarr['cremail'] = $param['cremail'];
		if(!empty($param['crqq']))
			$setarr['crqq'] = $param['crqq'];
                if(!empty($param['lng']))
			$setarr['lng'] = $param['lng'];
                if(!empty($param['lat']))
			$setarr['lat'] = $param['lat'];
		if(!empty($param['domain']))
			$setarr['domain'] = $param['domain'];
		if(!empty($param['maxnum']))
			$setarr['maxnum'] = $param['maxnum'];
		if(isset($param['crlabel']))
			$setarr['crlabel'] = $param['crlabel'];
		if(!empty($param['summary']))
			$setarr['summary'] = htmlspecialchars($param['summary']);
                if(!empty($param['message']))
			$setarr['message'] = $param['message'];
		if(isset($param['ispublic'])){
			$setarr['ispublic'] = $param['ispublic'];
		}else{
			$setarr['ispublic'] = 0;
		}
			
		if(isset($param['isshare'])){
			$setarr['isshare'] = $param['isshare'];
		}else{
			$setarr['isshare'] = 0;
		}
		if(isset($param['isschool']))
			$setarr['isschool'] = $param['isschool'];
		if(isset($param['grade']))
			$setarr['grade'] = $param['grade'];
		if(!empty($param['begindate']))
			$setarr['begindate'] = $param['begindate'];
		if(!empty($param['enddate']))
			$setarr['enddate'] = $param['enddate'];
		if(!empty($param['template']))
			$setarr['template'] = $param['template'];
		if(isset($param['modulepower']))
			$setarr['modulepower'] = $param['modulepower'];
		if(isset($param['crprice']))
			$setarr['crprice'] = $param['crprice'];
		if(isset($param['stumodulepower']))
			$setarr['stumodulepower'] = $param['stumodulepower'];
		if(isset($param['displayorder']))
			$setarr['displayorder'] = $param['displayorder'];
		if(isset($param['banner']))
			$setarr['banner'] = $param['banner'];
		if(isset($param['property'])){
			$setarr['property'] = $param['property'];
		}
		// $setarr = $this->db->escape_str($setarr);
		if(isset($param['profitratio'])){
			$setarr['profitratio'] = $param['profitratio'];

		}
		if(isset($param['floatadimg']))
			$setarr['floatadimg'] = $param['floatadimg'];
		if(isset($param['floatadurl']))
			$setarr['floatadurl'] = $param['floatadurl'];
		if(!empty($param['roompermission']))
		{
			$rparr = $param['roompermission'];
		}
		if(isset($param['showusername']))
			$setarr['showusername'] = $param['showusername'];
		if(isset($param['defaultpass']))
			$setarr['defaultpass'] = $param['defaultpass'];
		if(isset($param['ctype']))
			$setarr['ctype'] = $param['ctype'];
		$setarr['dateline'] = time();
		if(isset($param['hastv'])){
			$setarr['hastv'] = $param['hastv'];
		}
		if(isset($param['tvlogo']))
			$setarr['tvlogo'] = $param['tvlogo'];
    if(isset($param['iscollege'])){
        $setarr['iscollege'] = $param['iscollege'];
    }
		$res = $this->db->insert('ebh_classrooms',$setarr);
		if($res && !empty($rparr)){//共享平台分配
			foreach ($rparr as $rv) {
			$rParam = array(
				       		'crid'=>$res,
				       		'moduleid'=>$rv,
				       		'moduletype'=>1
				       		);
			$this->db->insert('ebh_roompermissions',$rParam);
			}
		}
		
		return $res;
	}
	/*
	编辑教室
	@param array $param
	@return int
	*/
	public function editclassroom($param){
		if(empty($param['crid'])){
			return false;
		}
		$param['crid'] = intval($param['crid']);
		if(isset($param['status']))
			$setarr['status'] = $param['status'];
		if(!empty($param['crname']))
			$setarr['crname'] = $param['crname'];
		if(isset($param['cface']))
			$setarr['cface'] = $param['cface'];
		if(!empty($param['uid']))
			$setarr['uid'] = $param['uid'];
		if(!empty($param['catid']))
			$setarr['catid'] = $param['catid'];
		if(isset($param['upid']))
			$setarr['upid'] = $param['upid'];
		if(!empty($param['citycode']))
			$setarr['citycode'] = $param['citycode'];
		if(isset($param['banner']))
			$setarr['banner'] = $param['banner'];
		if(isset($param['craddress'])) {
            $setarr['craddress'] = $param['craddress'];
        }

		if(isset($param['crphone'])) {
            $setarr['crphone'] = $param['crphone'];
        }

        if(isset($param['kefu'])){
            $setarr['kefu'] = $param['kefu'];
        }
        if(isset($param['kefuqq'])){
            $setarr['kefuqq'] = $param['kefuqq'];
        }
		if(!empty($param['cremail'])) {
            $setarr['cremail'] = $param['cremail'];
        }

		if(isset($param['property'])){
			$setarr['property'] = $param['property'];
		}
		if(!empty($param['crqq']))
			$setarr['crqq'] = $param['crqq'];
                if(!empty($param['lng']))
			$setarr['lng'] = $param['lng'];
                if(!empty($param['lat']))
			$setarr['lat'] = $param['lat'];
		if(!empty($param['weibosina']))
			$setarr['weibosina'] = $param['weibosina'];
		if(!empty($param['domain']))
			$setarr['domain'] = $param['domain'];
		if(!empty($param['maxnum']))
			$setarr['maxnum'] = $param['maxnum'];
		if(isset($param['crlabel'])) {
            $setarr['crlabel'] = $param['crlabel'];
        }

		if(isset($param['summary'])) {
            $setarr['summary'] = htmlspecialchars($param['summary']);
        }

        if(isset($param['message'])) {
            $setarr['message'] = $param['message'];
        }

		if(isset($param['ispublic']))
			$setarr['ispublic'] = $param['ispublic'];
		if(isset($param['isshare']))
			$setarr['isshare'] = $param['isshare'];
		
		if(isset($param['isschool']))
			$setarr['isschool'] = $param['isschool'];
		if(isset($param['grade']))
			$setarr['grade'] = $param['grade'];
		if(!empty($param['begindate']))
			$setarr['begindate'] = $param['begindate'];
		if(!empty($param['enddate']))
			$setarr['enddate'] = $param['enddate'];
		if(!empty($param['template']))
			$setarr['template'] = $param['template'];
		if(isset($param['modulepower']))
			$setarr['modulepower'] = $param['modulepower'];
		if(isset($param['crprice']))
			$setarr['crprice'] = $param['crprice'];
		if(isset($param['stumodulepower']))
			$setarr['stumodulepower'] = $param['stumodulepower'];
		
		if(isset($param['displayorder']))
			$setarr['displayorder'] = $param['displayorder'];
		// $setarr = $this->db->escape_str($setarr);
		if(isset($param['profitratio'])){
			$setarr['profitratio'] = $param['profitratio'];
		}
		if(isset($param['floatadimg']))
			$setarr['floatadimg'] = $param['floatadimg'];
		if(isset($param['floatadurl']))
			$setarr['floatadurl'] = $param['floatadurl'];
		if(isset($param['showusername']))
			$setarr['showusername'] = $param['showusername'];
		if(isset($param['defaultpass']))
			$setarr['defaultpass'] = $param['defaultpass'];
		if(isset($param['ctype']))
			$setarr['ctype'] = $param['ctype'];
		if(isset($param['hastv'])){
			$setarr['hastv'] = $param['hastv'];
		}
		if(isset($param['tvlogo']))
			$setarr['tvlogo'] = $param['tvlogo'];
    if(isset($param['iscollege'])){
        $setarr['iscollege'] = $param['iscollege'];
    }
		if(!empty($param['myroomleft']))
			$setarr['myroomleft'] = $param['myroomleft'];
		if(!empty($param['navigator']))
			$setarr['navigator'] = $param['navigator'];
		if(isset($param['custommodule']))
			$setarr['custommodule'] = $param['custommodule'];
		if(isset($param['wechatimg']))
			$setarr['wechatimg'] = $param['wechatimg'];
		if(isset($param['fulldomain']))
			$setarr['fulldomain'] = $param['fulldomain'];
		if(isset($param['icp']))
			$setarr['icp'] = $param['icp'];
		$wherearr = array('crid'=>$param['crid']);
		$row = $this->db->update('ebh_classrooms',$setarr,$wherearr);
		
		return $row;
	}
	/*
	详情
	@param int $crid
	@return array
	*/
	public function getclassroomdetail($crid){
		$sql = 'select c.catid,c.crid,c.crname,c.begindate,c.banner,c.upid,c.enddate,c.dateline,c.maxnum,c.domain,c.status,c.citycode,c.cface,c.craddress,c.crqq,c.crphone,c.cremail,c.crlabel,c.summary,c.ispublic,c.isshare,c.modulepower,c.stumodulepower,c.isschool,c.grade,c.template,c.profitratio,c.crprice,c.displayorder,c.property,u.username,u.uid,c.floatadimg,c.floatadurl,c.showusername,c.defaultpass,c.hastv,c.tvlogo,c.custommodule,c.iscollege,c.wechatimg from ebh_classrooms c join ebh_users u on u.uid = c.uid where c.crid='.$crid;
		return $this->db->query($sql)->row_array();
	}
	
	
	/*
	域名是否存在
	@param string $domain
	*/
	public function exists_domain($domain){
		$sql = 'select 1 from ebh_classrooms where domain = \''.$domain .'\' limit 1';
		return $this->db->query($sql)->row_array();
	}
	/*
	网校名是否存在
	@param string $domain
	*/
	public function exists_crname($crname){
		$sql = 'select 1 from ebh_classrooms where crname = \''.$crname .'\' limit 1';
		return $this->db->query($sql)->row_array();
	}
	/*
	教室权限
	$param int $upid 区分老师/学生权限
	@return array
	*/
	public function getroompowerlist($upid){
		$sql = 'select c.catid,c.name from ebh_categories c where c.system=0 and c.visible=1 and c.upid ='.$upid;
		return $this->db->query($sql)->list_array();
	}
	/*
	共享平台分配列表
	@return array
	*/
	public function getsharelist(){
		$sql = 'select c.crid,c.crname from ebh_classrooms c where isshare = 1';
		return $this->db->query($sql)->list_array();
		
	}
	/*
	学员平分教室信息
	@return array
	*/
	public function getmessagelist($crid){
		$sql = 'select c.crname,c.score,c.viewnum from ebh_classrooms c where crid = '.$crid;
		return $this->db->query($sql)->row_array();
		
	}
	/*
	教室所使用的共享平台
	@param int $crid
	@return array
	*/
	public function getroompermission($crid){
		$sql = 'select r.moduleid from ebh_roompermissions r where r.crid='.$crid;
		return $this->db->query($sql)->list_array();
	}
	/*
	子网校数量
	*/
	public function getzwxcount($crid){
		$sql = 'select count(*) count from ebh_classrooms where upid ='.$crid;
		$count = $this->db->query($sql)->row_array();
		if (!empty($count) && !empty($countrow['count']))
            $count = $count['count'];
        return $count;
	}
	/*
	子网校列表
	*/
	public function getzwxlist($param){
		$sql = 'SELECT cr.ispublic,cr.examcount,cr.crid,cr.crname,cr.template,cr.cface,cr.status,cr.domain,cr.score,cr.summary,cr.coursenum,cr.stunum as rucount FROM ebh_classrooms cr ';
		// .'LEFT JOIN (select COUNT(*) examcount,crid from ebh_exams group by crid) texam on cr.crid=texam.crid ';
		$wherearr = array();
		if (!empty($param['crid'])) {
            $wherearr[] = ' cr.upid = '.$param['crid'] ;
        }
		if(!empty($param['q'])){
			$q = $this->db->escape_str($param['q']);
			$wherearr[] = ' cr.crname like \'%'.$q.'%\'';
		}
		
		if(!empty($wherearr)) {
            $sql .= ' WHERE '.implode(' AND ',$wherearr);
        }
		if(!empty($param['order'])) {
            $sql .= ' ORDER BY '.$param['order'];
        } else {
            $sql .= ' ORDER BY displayorder';
        }
		if(!empty($param['limit'])) {
            $sql .= ' limit '.$param['limit'];
        } else {
			if (empty($param['page']) || $param['page'] < 1)
				$page = 1;
			else
				$page = $param['page'];
			$pagesize = empty($param['pagesize']) ? 10 : $param['pagesize'];
			$start = ($page - 1) * $pagesize;
			$sql .= ' limit ' . $start . ',' . $pagesize;
        }
//log_message($sql);
		return $this->db->query($sql)->list_array();
	}

	/**
	 * 根据crid获取教室详细信息
	 * @param type $crid
	 * @return type
	 */
	public function getdetailclassroom($crid) {
		$sql = "select cr.crid,cr.uid,cr.crname,cr.domain,cr.template,cr.isschool,cr.summary,cr.crlabel,cr.cface,cr.crqq,cr.craddress,cr.crphone,cr.cremail,cr.modulepower,cr.stumodulepower,cr.bankcard,"
				. "cr.dateline,cr.banner,cr.displayorder,cr.viewnum,cr.score,cr.onlinecount,cr.lng,cr.lat,cr.weibosina,cr.stunum,cr.teanum,cr.coursenum,cr.message,cr.good,cr.bad,cr.useful,cr.districts,cr.examcount,cr.asknum,cr.profitratio,cr.kefu,cr.kefuqq,cr.fulldomain  from ebh_classrooms cr where cr.crid=$crid";
		return $this->db->query($sql)->row_array();
	}
	/*
	多个教室详情
	*/
	public function getdetailclassroommulti($crid){
		$sql = "select cr.crid,cr.uid,cr.crname,cr.domain,cr.summary,cr.coursenum,cr.examcount,cr.cface,cr.score from ebh_classrooms cr where cr.crid in ($crid)";
		return $this->db->query($sql)->list_array();
	}
	/**
	*大厅教室列表显示
	*/
	public function getclassroomall($param){
		$sql = 'SELECT u.username,cr.crname,cr.summary,cr.begindate,cr.cface,cr.domain,cr.template,cr.isschool,cr.craddress,cr.ispublic,cr.score,cr.crid FROM ebh_classrooms cr LEFT JOIN ebh_users u on cr.uid=u.uid';
		$wherearr = array();
		if(!empty($param['q']))
			$wherearr[] = '(cr.crname like \'%'. $this->db->escape_str($param['q']) .'%\' or cr.domain like \'%'. $this->db->escape_str($param['q']) .'%\')';
		if($param['beginprice']==='0'&&$param['endprice']==='0')
			$wherearr[] = ' crprice = 0 ';
		if(!empty($param['beginprice']))
			$wherearr[] = ' crprice >= '.$param['beginprice'];
		if(!empty($param['endprice']))
			$wherearr[] = ' crprice <= '.$param['endprice'];
		if(!empty($param['property']))
			$wherearr[] = 'property = '.intval($param['property']);
		if (!empty($param['filterorder']))
            $wherearr[] = 'cr.displayorder < ' . $param['filterorder'];
		if(!empty($param['grade']))
			$wherearr[] = 'cr.grade = '.intval($param['grade']);
		if(!empty($param['citycode']))
			$wherearr[] = 'cr.citycode like \''.$this->db->escape_str($param['citycode']).'%\'';
		if(!empty($param['subject'])){
			$wherearr[] = ' cr.crname like \'%'. $this->db->escape_str($param['subject']) .'%\'';
		}
		if(!empty($wherearr)) {
            $sql .= ' WHERE '.implode(' AND ',$wherearr);
        }
		if(!empty($param['order'])) {
            $sql .= ' ORDER BY '.$param['order'];
        } else {
            $sql .= ' ORDER BY displayorder';
        }
    if(!empty($param['limit']))
			$sql .= ' limit '.$param['limit'];
		else {
			if (empty($param['page']) || $param['page'] < 1)
				$page = 1;
			else
				$page = $param['page'];
			$pagesize = empty($param['pagesize']) ? 10 : $param['pagesize'];
			$start = ($page - 1) * $pagesize;
			$sql .= ' limit ' . $start . ',' . $pagesize;
		}
		return $this->db->query($sql)->list_array();
	}
	/**
	 *改变教室的状态stauts
	 *@author zkq
	 */
	public function changeStatus($param = array()){
		if(empty($param)){
			return 0;
		}
		$set = array('status'=>intval($param['status']));
		$where = array('crid'=>intval($param['crid']));
		echo $this->db->update('ebh_classrooms',$set,$where);
	}
	/**
	*根据教室编号获取教室对应的信息
	*/
	public function getRoomByCrid($crid) {
		$sql = "select crid,domain,isschool,good,useful,bad,score,viewnum from ebh_classrooms where crid=$crid";
		return $this->db->query($sql)->row_array();
	}
	/**
	*添加教室的评分数
	*/
	public function addViewnum($crid,$num = 1) {
		$where = 'crid='.$crid;
        $setarr = array('viewnum'=>'viewnum+'.$num);
        $this->db->update('ebh_classrooms',array(),$where,$setarr);
	}
	/**
	*更新平台评分等数据
	*/
	public function updatescore($crid,$param=array()){
		$myroom = $this->getRoomByCrid($crid);
		//求平均分
		$viewnum = $myroom['viewnum'];	//当前评论数
		$score = $myroom['score'];
		if($viewnum<=10){
    		$newscore = $score + $param['score'] / 50;
    	}elseif($viewnum<=20 && $viewnum>10){
			$newscore = $score + $param['score'] / 100;
    	}elseif($viewnum<=50 && $viewnum>20){
			$newscore = $score + $param['score'] / 200;
    	}elseif($viewnum<=200 && $viewnum>50){
			$newscore = $score + $param['score'] / 400;
    	}else{
    		$newscore = $score + $param['score'] / 1000;
    	}
		//求平台good评分
		$good = $myroom['good'];
		if($viewnum<=10){
    		$newgood = $good + $param['good'] / 20;
    	}elseif($viewnum<=20 && $viewnum>10){
			$newgood = $good + $param['good'] / 40;
    	}elseif($viewnum<=50 && $viewnum>20){
			$newgood = $good + $param['good'] / 80;
    	}elseif($viewnum<=200 && $viewnum>50){
			$newgood = $good + $param['good'] / 160;
    	}else{
    		$newgood = $good + $param['good'] / $viewnum;;
    	}
		//求平台bad评分
		$bad = $myroom['bad'];
		if($viewnum<=10){
    		$newbad = $bad + $param['bad'] / 20;
    	}elseif($viewnum<=20 && $viewnum>10){
			$newbad = $bad + $param['bad'] / 40;
    	}elseif($viewnum<=50 && $viewnum>20){
			$newbad = $bad + $param['bad'] / 80;
    	}elseif($viewnum<=200 && $viewnum>50){
			$newbad = $bad + $param['bad'] / 160;
    	}else{
    		$newbad = $bad + $param['bad'] / $viewnum;;
    	}
		//求平台useful评分
		$useful = $myroom['useful'];
		if($viewnum<=10){
    		$newuseful = $useful + $param['useful'] / 20;
    	}elseif($viewnum<=20 && $viewnum>10){
			$newuseful = $useful + $param['useful'] / 40;
    	}elseif($viewnum<=50 && $viewnum>20){
			$newuseful = $useful + $param['useful'] / 80;
    	}elseif($viewnum<=200 && $viewnum>50){
			$newuseful = $useful + $param['useful'] / 160;
    	}else{
    		$newuseful = $useful + $param['useful'] / $viewnum;;
    	}

		$newgood = intval($newgood);
		$newbad = intval($newbad);
		$newuseful = intval($newuseful);
		$where = 'crid='.$crid;
        $setarr = array('score'=>$newscore,'good'=>$newgood,'bad'=>$newbad,'useful'=>$newuseful);
        return $this->db->update('ebh_classrooms',$setarr,$where);
	}
	//修改共享平台分配
	public function editroompermission($rparr,$crid){
		$this->db->delete('ebh_roompermissions',array('crid'=>$crid));
		foreach ($rparr as $rv) {
			$rParam = array(
				'crid'=>$crid,
				'moduleid'=>$rv,
				'moduletype'=>1
			);
		$this->db->insert('ebh_roompermissions',$rParam);
		}
	}
	/**
	*根据第三方oauth教室编号获取教室对应的信息
	*/
	public function getRoomByOsign($osign) {
		$osign = $this->db->escape($osign);
		$sql = "select domain,isschool from ebh_classrooms where osign=$osign";
		return $this->db->query($sql)->row_array();
	}
	
	/*
	可以按真实姓名查询用户名的学校
	*/
	public function getSearchableClassrooms($crid){
		$sql = 'select distinct(crname) from ebh_searchableclassrooms where upcrid='.$crid;
		return $this->db->query($sql)->list_array();
	}
	
	/*
	按真实姓名查询用户名
	*/
	public function getUsernameByRealname($param){
		$realname = $this->db->escape_str($param['realname']);
		$crname = $this->db->escape_str($param['crname']);
		$crid = $param['crid'];
		// $sex = $param['sex'];
		$sql = 'select username,realname,password from ebh_searchableclassrooms sc ';
		$sql.= " where realname='$realname' and crname='$crname' and upcrid=$crid";
		// echo $sql;
		return $this->db->query($sql)->row_array();
	}
	
	/*
	新用户首次登录特定学校
	*/
	public function checkforfirstlogin($user,$crid){
		if(empty($user) || empty($crid))
			return false;
		$uid = $user['uid'];
		if($user['groupid'] == 6){
			$sql = 'select 1 from ebh_users u join ebh_roomusers ru on u.uid = ru.uid join ebh_classrooms cr on ru.crid = cr.crid';
			$sql.= " where u.uid=$uid and cr.crid=$crid and u.lastlogintime=0 and u.groupid=6";
		}else{
			$sql = 'select 1 from ebh_users u join ebh_roomteachers rt on u.uid = rt.tid join ebh_classrooms cr on rt.crid = cr.crid';
			$sql.= " where u.uid=$uid and cr.crid=$crid and u.lastlogintime=0 and u.groupid=5";
		}
		return $this->db->query($sql)->row_array();
	}
	
	/*
	根据域名获取父级的信息
	*/
	public function getUproom($domain){
		$sql = 'select cr1.domain,cr1.crname,cr1.fulldomain from ebh_classrooms cr1 join ebh_classrooms cr2 on cr1.crid=cr2.upid where cr2.domain=\''.$domain.'\'';
		// echo $sql;
		return $this->db->query($sql)->row_array();
		
	}
	/**
     * 添加教室对应的答疑数
     * @param int $crid 教室编号
     * @param int $num 如为正数则添加，负数则为减少
     */
    public function addasknum($crid,$num=1) {
        $where = 'crid='.$crid;
        $setarr = array('asknum'=>'asknum+'.$num);
        $this->db->update('ebh_classrooms',array(),$where,$setarr);
    }

    /**
     *获取用户所在的教室
     */
    public function getUserClassroom($uid = 0){
    	$sql = 'select cr.crid,cr.crname from ebh_roomusers r join ebh_classrooms cr on r.crid = cr.crid where r.uid = '.$uid;
    	return $this->db->query($sql)->list_array();
    }

    //获取教室列表，供搜索使用
    public function getRoomListForSearch($param = array()) {
       	$sql = 'select cr.crid,cr.crname,cr.summary,cr.dateline,cr.cface,cr.domain from ebh_classrooms cr ';
        $wherearr = array();
        if (isset($param['status']))
            $wherearr[] = 'cr.status=' . $param['status'];
        if(isset($param['property'])){
        	if(is_array($param['property'])){
        		$wherearr[] = 'cr.property in ('.implode(',',$param['property']).')';
        	}else{
        		$wherearr[] = 'cr.property ='.intval($param['property']);
        	}
        }
        if(isset($param['q']))
			$wherearr[] = '( cr.crname like \'%'. $this->db->escape_str($param['q']) .'%\' or cr.domain like \'%'. $this->db->escape_str($param['q']) .'%\' or cr.crlabel like \'%'. $this->db->escape_str($param['q']) .'%\')';
        if(isset($param['isschool'])){
        	if(is_array($param['isschool'])){
        		$wherearr[] = 'cr.isschool in ('.implode(',',$param['isschool']).')';
        	}else{
        		$wherearr[] = 'cr.isschool ='.intval($param['isschool']);
        	}
        }
        if (!empty($param['filterorder']))
            $wherearr[] = 'cr.displayorder < ' . $param['filterorder'];
        if (!empty($wherearr))
            $sql .= ' WHERE ' . implode(' AND ', $wherearr);
        if (!empty($param['order']))
            $sql .= ' ORDER BY ' . $param['order'];
        else
            $sql .= ' ORDER BY cr.crid desc ';
       	if(!empty($param['limit'])) {
            $sql .= ' limit '. $param['limit'];
        } else {
			if (empty($param['page']) || $param['page'] < 1)
				$page = 1;
			else
				$page = $param['page'];
			$pagesize = empty($param['pagesize']) ? 10 : $param['pagesize'];
			$start = ($page - 1) * $pagesize;
            $sql .= ' limit ' . $start . ',' . $pagesize;
        }
        return $this->db->query($sql)->list_array();
    }
    //获取教室列表数量，供搜索使用
    public function getRoomListCountForSearch($param = array()) {
       	$sql = 'select count(1) count from ebh_classrooms cr ';
        $wherearr = array();
        if (isset($param['status']))
            $wherearr[] = 'cr.status=' . $param['status'];
        if(isset($param['property'])){
        	if(is_array($param['property'])){
        		$wherearr[] = 'cr.property in ('.implode(',',$param['property']).')';
        	}else{
        		$wherearr[] = 'cr.property ='.intval($param['property']);
        	}
        }
        if(isset($param['q']))
			$wherearr[] = '( cr.crname like \'%'. $this->db->escape_str($param['q']) .'%\' or cr.domain like \'%'. $this->db->escape_str($param['q']) .'%\' or cr.crlabel like \'%'. $this->db->escape_str($param['q']) .'%\')';
        if(isset($param['isschool'])){
        	if(is_array($param['isschool'])){
        		$wherearr[] = 'cr.isschool in ('.implode(',',$param['isschool']).')';
        	}else{
        		$wherearr[] = 'cr.isschool ='.intval($param['isschool']);
        	}
        }
        if (!empty($param['filterorder']))
            $wherearr[] = 'cr.displayorder < ' . $param['filterorder'];
        if (!empty($wherearr))
            $sql .= ' WHERE ' . implode(' AND ', $wherearr);
       	
        $res = $this->db->query($sql)->row_array();
        return $res['count'];
    }
	
	/*
	大学生顶部模块
	*/
	public function getMyroomLeft($crid){
		$sql = 'select myroomleft from ebh_classrooms where crid ='.$crid;
		$res = $this->db->query($sql)->row_array();
		return $res['myroomleft'];
	}
	
	/*
	drag模板首页导航
	*/
	public function getNavigator($crid){
		$sql = 'select navigator from ebh_classrooms where crid ='.$crid;
		$res = $this->db->query($sql)->row_array();
		return $res['navigator'];
	}
	
	/*
	获取自定义富文本
	*/
	public function getcustommessage($param){
		if(empty($param['crid'])){
			return false;
		}
		$param['crid'] = intval($param['crid']);
		$sql = 'select crid,custommessage,appstr,`index` from ebh_custommessages';
		$wherearr[] = 'crid='.$param['crid'];
		if(isset($param['index']))
			$wherearr[] = '`index` in ('.$param['index'].')';
		$sql.= ' where '.implode(' AND ',$wherearr);
		return $this->db->query($sql)->list_array();
	}
	
	/*
	修改自定义富文本
	*/
	public function editcustommessage($param){
		if(empty($param['crid'])){
			return false;
		}
		$param['crid'] = intval($param['crid']);
		$wherearr[] = 'crid='.$param['crid'];
		if(isset($param['index']))
			$wherearr[] = '`index`='.$param['index'];
		$sql = 'select 1 from ebh_custommessages';
		$sql.= ' where '.implode(' AND ',$wherearr);
		$res = $this->db->query($sql)->list_array();
		// var_dump($res);
		
		if(empty($res)){
			$iarr['crid'] = $param['crid'];
			if(isset($param['index']))
				$iarr['index'] = trim($param['index'],'\'');
			if(isset($param['custommessage']))
				$iarr['custommessage'] = $param['custommessage'];
			// if(isset($param['appstr']))
				$iarr['appstr'] = isset($param['appstr'])?$param['appstr']:'';
			$this->db->insert('ebh_custommessages',$iarr);
		}else{
			if(isset($param['custommessage']))
				$setarr['custommessage'] = $param['custommessage'];
			if(isset($param['appstr']))
				$setarr['appstr'] = $param['appstr'];
			$wherearr = array('crid'=>$param['crid']);
			if(isset($param['index']))
				$wherearr['`index`'] = trim($param['index'],'\'');
			// var_dump($wherearr);
			$row = $this->db->update('ebh_custommessages',$setarr,$wherearr);
			return $row;
		}
	}
	
	/*
	批量自定义富文本,导航处的
	*/
	public function editcms($param){
		$this->db->begin_trans();
		if(empty($param['crid'])){
			return false;
		}
		$param['crid'] = intval($param['crid']);
		$crid = $param['crid'];
		$wherearr[] = 'crid='.$param['crid'];
		$indexs = '';
		
		$delsql = 'delete from ebh_custommessages where crid='.$crid.' and `index` not in(\'0\',\'1\')';
		$this->db->query($delsql);
		
		$insertsql = 'insert into ebh_custommessages (crid,`index`,custommessage) values ';
		foreach($param['cmlist'] as $index=>$cm){
			$indexs .= '\''.$index.'\',';
			$cm = $this->db->escape_str($cm);
			$insertsql .= "($crid,'$index','$cm'),";
		}
		$insertsql = rtrim($insertsql,',');
		$this->db->query($insertsql);
		
		// $indexs = rtrim($indexs,',');
		// $findsql = 'select cid from ebh_custommessages';
		// $wherearr[] = '`index` in ('.$indexs.')';
		// $findsql .= ' where '.implode(' AND ',$wherearr);
		// $res = $this->db->query($findsql)->list_array();
		
		
		if ($this->db->trans_status() === FALSE) {
            $this->db->rollback_trans();
            return FALSE;
        } else {
            $this->db->commit_trans();
        }
		return TRUE;
		// $
	}
	
	/*
	删除自定义文本
	*/
	public function delcustommessage($param){
		$wherearr['crid'] = $param['crid'];
		$wherearr['`index`'] = $param['index'];
		$this->db->delete('ebh_custommessages',$wherearr);
	}
    /**
    *根据一级域名获取对应网校的子域名
    */
    public function getDomainByFullDomain($fulldomain) {
        $domain = '';
        $sql = "select domain from ebh_classrooms where fulldomain='$fulldomain'";
        $row = $this->db->query($sql)->row_array();
        if(!empty($row))
            $domain = $row['domain'];
        return $domain;
    }
    /**
     * [getdomainByCrid 根据crid获取domain]
     * @param  [type] $crid [description]
     * @return [type]       [description]
     */
    public function getdomainByCrid($crid){
      $sql = 'select domain from `ebh_classrooms` where crid ='.$crid;
      return $this->db->query($sql)->row_array();
    }

    //获取年级人数
    public function getStudentsCountByGrade($param){
        if(empty($param['grade'])||empty($param['crid'])){
            return false;
        }
        $sql = 'select classid from ebh_classes where crid ='.$param['crid'].' and grade ='.$param['grade'];
        $classidarr = $this->db->query($sql)->list_array();
        if(!empty($classidarr)){
            $gradenum = 0;
            foreach($classidarr as $classid){
                $classinfo = $this->db->query('select stunum from ebh_classes where classid ='.$classid['classid'])->row_array();
                $gradenum += $classinfo['stunum'];
            }
            return $gradenum;
        }else{
            return 0;
        }
    }

    //检测独立域名是不是已经存在了
    public function checkdomain($param){
        if(empty($param['fulldomain'])){
            return false;
        }
        $fulldomain=$param["fulldomain"];
        $sql="select domain from ebh_classrooms where fulldomain='$fulldomain'";
        $row = $this->db->query($sql)->row_array();
        return $row;
    }

    //获取网校和网校所拥有的班级信息
    public function getClassroomAndClass($param){
      $sql = 'select cr.crid,c.classid,c.classname,c.stunum from ebh_classrooms cr left join ebh_classes c on(cr.crid = c.crid)';
      if(!empty($param['limit']))
          $sql .= ' limit '.$param['limit'];
        else {
          if (empty($param['page']) || $param['page'] < 1)
            $page = 1;
          else
            $page = $param['page'];
          $pagesize = empty($param['pagesize']) ? 10 : $param['pagesize'];
          $start = ($page - 1) * $pagesize;
          $sql .= ' limit ' . $start . ',' . $pagesize;
        }
      return $this->db->query($sql)->list_array();  
    }
}

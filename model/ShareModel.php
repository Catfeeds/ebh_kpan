<?php
/**
 * 文件分享model类
 */
class ShareModel extends CModel{
    private $pandb;
    public function __construct() {
        $this->pandb = Ebh::app()->getOtherDb('pandb');
    }
	/**
	 * 获取分享列表
	 */
	public function getShareList($param, $v = 1){
		$sql = 'SELECT sh.shareid,f.fileid,sh.upid,sh.isdir,sh.title,sh.path,sh.dateline,sh.uid,sh.ispassword,sh.password,sh.aid,f.title as name,f.size,f.suffix,s.ispreview,sh.disable_down,f.sid,sh.deadline,f.path as fpath,f.uid as fuid FROM pan_shares sh LEFT JOIN pan_files f ON sh.fileid=f.fileid  LEFT JOIN pan_sources s ON sh.sid=s.sid';
		$wherearr[] = '`sh`.`v`='.intval($v);
		if(isset($param['upid']))
			$wherearr[] = 'sh.upid=' . $param['upid'];
		if(isset($param['isdir']))
			$wherearr[] = 'sh.isdir=' . $param['isdir'];
		if(!empty($param['uid']))
			$wherearr[] = 'sh.uid=' . $param['uid'];
		if(!empty($param['crid']))
			$wherearr[] = 'sh.crid=' . $param['crid'];
		if(!empty($param['fileid']))
			$wherearr[] = 'sh.fileid=' . $param['fileid'];
		$wherearr[] = '(f.status=0 OR f.status IS NULL)';
		if(!empty($param['q']))
			$wherearr[] = "sh.title like '%" . $this->pandb->escape_str($param['q']) . "%' AND sh.isdir=0";
		if(!empty($wherearr))
			$sql.= ' where '.implode(' AND ',$wherearr);

		$sql.= ' order by sh.isdir DESC,sh.shareid DESC';
		if(!empty($param['limit'])) {
			$sql .= ' limit '.$param['limit'];
		} else {
			if (empty($param['page']) || $param['page'] < 1)
				$page = 1;
			else
				$page = $param['page'];
			$pagesize = empty($param['pagesize']) ? 300 : $param['pagesize'];
			$start = ($page - 1) * $pagesize;
			$sql .= ' limit ' . $start . ',' . $pagesize;
        }
		return $this->pandb->query($sql)->list_array();
	}


	/**
	 * 获取分享总数
	 */
	public function getShareCount($param, $v = 1){
		$count = 0;
		$wherearr[] = '`sh`.`v`='.intval($v);
		$sql = 'SELECT count(*) count FROM pan_shares sh LEFT JOIN pan_files f ON sh.fileid=f.fileid';
		if(isset($param['upid']))
			$wherearr[] = 'sh.upid=' . $param['upid'];
		if(isset($pram['isdir']))
			$wherearr[] = 'sh.isdir=' . $param['isdir'];
		if(!empty($param['uid']))
			$wherearr[] = 'sh.uid=' . $param['uid'];
		if(!empty($param['crid']))
			$wherearr[] = 'sh.crid=' . $param['crid'];
		if(!empty($param['fileid']))
			$wherearr[] = 'sh.fileid=' . $param['fileid'];
		$wherearr[] = '(f.status=0 OR f.status IS NULL)';
		if(!empty($param['q']))
			$wherearr[] = "sh.title like '%" . $this->pandb->escape_str($param['q']) . "%' AND sh.isdir=0";
		if(!empty($wherearr))
			$sql.= ' where '.implode(' AND ',$wherearr);

		$row = $this->pandb->query($sql)->row_array();
		if(!empty($row))
			$count = $row['count'];
        return $count;
	}

	/**
	 * 检查文件夹是否已经存在
	 * @param  string  $upid 父目录编号
	 * @param  string  $path 文件夹名称
	 * @param  integer  $uid  用户编号
	 * @param  integer  $crid 网校编号
	 * @param  integer  $shareid 需排除文件夹的编号
	 * @return boolean       TRUE存在 FALSE不存在
	 */
	public function isShareExists($upid, $path, $uid, $crid, $shareid=0,$v = 1){
		$wherearr = array();
		$sql = 'SELECT shareid FROM pan_shares';
		$wherearr[] = '`v`='.intval($v);
		$wherearr[] = 'upid=' . intval($upid);
		$wherearr[] = 'path=\'' . $this->pandb->escape_str($path) .'\'';
		if (!empty($uid))
			$wherearr[] = 'uid=' . intval($uid);
		$wherearr[] = 'crid=' . intval($crid);
		if(!empty($shareid))
			$wherearr[] = 'shareid!=' . intval($shareid);
		if(!empty($wherearr))
			$sql .= ' WHERE '.implode(' AND ',$wherearr);
		$row = $this->pandb->query($sql)->row_array();
		if (empty($row)){
			return FALSE;
		}
		else {
			return TRUE;
		}
	}

	/**
	 * 创建分享
	 */
	public function addShare($param, $v = 1){
		$setarr = array(
		    'v' => intval($v)
        );
		if(isset($param['sid']))
			$setarr['sid'] = $param['sid'];
		if(!empty($param['fileid']))
			$setarr['fileid'] = $param['fileid'];
		if(isset($param['isdir']))
			$setarr['isdir'] = $param['isdir'];
		if(!empty($param['title']))
			$setarr['title'] = $param['title'];
		if(!empty($param['dateline']))
			$setarr['dateline'] = $param['dateline'];
		if(!empty($param['uid']))
			$setarr['uid'] = $param['uid'];
		if(!empty($param['crid']))
			$setarr['crid'] = $param['crid'];
		if(isset($param['upid']))
			$setarr['upid'] = $param['upid'];
		if(!empty($param['path']))
			$setarr['path'] = $param['path'];
		if(isset($param['ispassword']))
			$setarr['ispassword'] = $param['ispassword'];
		if(isset($param['password']))
			$setarr['password'] = $param['password'];
		if (isset($param['disable_down'])) {
		    $setarr['disable_down'] = intval($param['disable_down']) == 1 ? 1 : 0;
        }
        if (isset($param['deadline'])) {
		    $setarr['deadline'] = max(0, intval($param['deadline']));
        }
		$result = $this->pandb->insert('pan_shares', $setarr);
		if(!empty($result)){
			$this->pandb->update('pan_files', array('isshare'=>1),array('fileid'=>$param['fileid']));
		}
		return $result;
	}

	/**
	 * 更新分享
	 */
	public function editShare($param, $v = 1){
		$setarr = array();
		if(empty($param['shareid']) || empty($param['uid']) || empty($param['crid']))
			return FALSE;
		$setarr['v'] = intval($v);
		if(isset($param['sid']))
			$setarr['sid'] = $param['sid'];
		if(!empty($param['fileid']))
			$setarr['fileid'] = $param['fileid'];
		if(isset($param['isdir']))
			$setarr['isdir'] = $param['isdir'];
		if(!empty($param['title']))
			$setarr['title'] = $param['title'];
		if(!empty($param['dateline']))
			$setarr['dateline'] = $param['dateline'];
		if(isset($param['upid']))
			$setarr['upid'] = $param['upid'];
		if(!empty($param['path']))
			$setarr['path'] = $param['path'];
		if(isset($param['ispassword']))
			$setarr['ispassword'] = $param['ispassword'];
		if(isset($param['password']))
			$setarr['password'] = $param['password'];

        if (isset($param['disable_down'])) {
            $setarr['disable_down'] = intval($param['disable_down']) == 1 ? 1 : 0;
        }
        if (isset($param['deadline'])) {
            $setarr['deadline'] = max(0, intval($param['deadline']));
        }

		$wherearr['shareid'] = $param['shareid'];
		$wherearr['uid'] = $param['uid'];
		$wherearr['crid'] = $param['crid'];

		$result = $this->pandb->update('pan_shares', $setarr, $wherearr);
		return $result;
	}

	/**
	 * 取消分享
	 * 传入fileids时，删除fileid对应的所有分享
	 */
	public function cancelByFileids($param, $v = 1){
		if (empty($param['fileids']) || !is_array($param['fileids']))
			return FALSE;
		if (empty($param['uid']) || empty($param['crid']))
			return FALSE;
		$fileidarr = array_map('intval', $param['fileids']);
		$wherearr[] = 'fileid in(' . implode(',', $fileidarr) . ')';
		$wherearr[] = 'uid=' . intval($param['uid']);
		$wherearr[] = 'crid=' . intval($param['crid']);
		$wherearr[] = 'v='.intval($v);

		$sql = 'DELETE FROM pan_shares';
		$sql .= ' WHERE '.implode(' AND ',$wherearr);
		$result = $this->pandb->query($sql);
		if ($result !== FALSE){
			//更新没有分享的文件
			$sql_file = 'UPDATE pan_files SET isshare=0' . ' WHERE '.implode(' AND ',$wherearr);
			$this->pandb->query($sql_file);
		}
		return $result;
	}

	/**
	 * 取消分享
	 * 传入shareids时，删除shareid对应的所有分享
	 */
	public function cancelByShareids($param, $v = 1){
		if (empty($param['shareids']) || !is_array($param['shareids']))
			return FALSE;
		if (empty($param['crid']))
			return FALSE;
		$shareidarr = array_map('intval', $param['shareids']);
		$wherearr[] = 'shareid in(' . implode(',', $shareidarr) . ')';
		$wherearr[] = 'crid=' . intval($param['crid']);
		$wherearr[] = 'v='.intval($v);
		if (!empty($param['uid']))
			$wherearr[] = 'uid=' . intval($param['uid']);
		//取得对应的fileid
		$sharelist = $this->pandb->query('SELECT fileid FROM pan_shares'.' WHERE '.implode(' AND ',$wherearr))->list_array();

		$nosharefile = array();
		foreach($sharelist as $share){
			$share_count = $this->getShareCount(array('fileid'=>$share['fileid']));
			if ($share_count <= 1){
				$nosharefile[] = $share['fileid'];
			}
		}

		$sql = 'DELETE FROM pan_shares';
		$sql .= ' WHERE '.implode(' AND ',$wherearr);
		$result = $this->pandb->query($sql);
		if ($result !== FALSE){
			//更新没有分享的文件
			if (!empty($nosharefile)){
				$sql_file = 'UPDATE pan_files SET isshare=0 WHERE fileid in(' . implode(',', $nosharefile) . ') AND crid=' . $param['crid'];
				if (!empty($param['uid']))
					$sql_file .= ' AND uid=' . $param['uid'];
				$this->pandb->query($sql_file);
			}
		}

		return $result;

	}

	/**
	 * 获取分享详情
	 */
	public function getOneShare($param, $v = 1){
		$wherearr = array('v='.intval($v));
		$sql = 'SELECT shareid,sid,fileid,isdir,title,dateline,uid,crid,upid,path,ispassword,password FROM pan_shares';
		if(!empty($param['shareid'])){
			$wherearr[] = 'shareid=' . intval($param['shareid']);
		}
		if(!empty($param['fileid'])){
			$wherearr[] = 'fileid=' . intval($param['fileid']);
		}
		if(!empty($param['path'])){
			$wherearr[] = 'path=\'' . $this->pandb->escape_str($param['path']) . '\'';
		}
		if(isset($param['upid'])){
			$wherearr[] = 'upid=' . intval($param['upid']);
		}
		if(!empty($param['uid'])){
			$wherearr[] = 'uid='. intval($param['uid']);
		}
		if(!empty($param['crid'])){
			$wherearr[] = 'crid=' . intval($param['crid']);
		}
		if(!empty($wherearr))
			$sql .= ' WHERE '.implode(' AND ',$wherearr);

		$row = $this->pandb->query($sql)->row_array();
		return $row;
	}

	/**
	 * 重命名文件夹
	 */
	public function renameShare($param, $v = 1){
		$setarr = array();
		if (!empty($param['title']))
			$setarr['title'] = $param['title'];
		if (!empty($param['path']))
			$setarr['path'] = $param['path'];
		if (empty($param['shareid']) || empty($param['crid'])){
			return FALSE;
		} else {
			$wherearr['shareid'] = $param['shareid'];
			$wherearr['crid'] = $param['crid'];
		}
		if (!empty($param['uid']))
			$wherearr['uid'] = intval($param['uid']);
        $wherearr['v'] = intval($v);
		$result = $this->pandb->update('pan_shares', $setarr, $wherearr);
		if ($result === FALSE){
			return FALSE;
		}
		else {
			if (!empty($param['isdir']))
				$this->_updateChildren($param['shareid'], $param['path']);
			return TRUE;
		}

	}

	/**
	 * 移动
	 */
	public function moveShare($param, $v = 1){
		$setarr = array();
		if (isset($param['upid']))
			$setarr['upid'] = $param['upid'];
		if (!empty($param['path']))
			$setarr['path'] = $param['path'];
		if(empty($param['shareid']) || empty($param['crid'])){
			return FALSE;
		} else {
			$wherearr['shareid'] = $param['shareid'];
			$wherearr['crid'] = $param['crid'];
		}
        $wherearr['v'] = intval($v);
		$result = $this->pandb->update('pan_shares', $setarr, $wherearr);
		if ($result === FALSE){
			return FALSE;
		}
		else {
			if (!empty($param['isdir']))
				$this->_updateChildren($param['shareid'], $param['path']);
			return TRUE;
		}
	}

	/**
	 * 删除文件夹
	 */
	public function removeShare($param, $v = 1){
		if (empty($param['shareid']) || empty($param['crid']))
			return FALSE;
		$wherearr = array();
		$wherearr['shareid'] = intval($param['shareid']);
		$wherearr['crid'] = intval($param['crid']);
		$wherearr['isdir'] = 1;
		$wherearr['v'] = intval($v);
		$result = $this->pandb->delete('pan_shares', $wherearr);

		//文件夹内的分享文档移动到根目录下
		if (!empty($result)){
			$sql = 'select shareid,isdir,title from pan_shares where upid = '.$param['shareid'];
			$children = $this->pandb->query($sql)->list_array();
			if(!empty($children)){
				foreach ($children as $child) {
					if ($child['isdir'] == 0){
						$this->moveShare(array('upid'=>0, 'path'=>'/'.$child['title'], 'shareid'=>$child['shareid'], 'crid'=>$param['crid']));
					}
				}
			}
		}
		return $result;
	}

	/**
	 * 递归更新子文件的路径
	 * @param  integer $upid   父编号
	 * @param  string $uppath 父路径
	 */
	public function _updateChildren($upid, $uppath, $v = 1){
		$sql = 'select shareid,isdir,title from pan_shares where upid = '.intval($upid).' AND `v`='.intval($v);
		$children = $this->pandb->query($sql)->list_array();
		if(empty($children)){
			return;
		}
		foreach ($children as $child) {
			if ($child['isdir'] == 1){
				$this->pandb->update('pan_shares', array('path'=>$uppath.$child['title'].'/'), array('shareid'=>$child['shareid']));
				$this->_updatechildren($child['shareid'], $uppath.$child['title'].'/');
			}
			else
			{
				$this->pandb->update('pan_shares', array('path'=>$uppath.$child['title']), array('shareid'=>$child['shareid']));
			}
		}

	}

    /**
     * 检查文件是否已共享
     * @param $path 文件路径
     * @param $uid 用户ID
     * @param $crid 网校ID
     * @return bool
     */
	public function checkShared($path, $uid, $crid, $v = 1) {
	    $whereArr = array(
	        '`uid`='.intval($uid),
            '`crid`='.intval($crid),
            '`path`='.$this->pandb->escape($path),
            '`v`='.intval($v)
        );
        $sql = 'SELECT `shareid`,`sid`,`fileid`,`isdir`,`title`,`dateline`,`upid`,`path`,`ispassword`,`password`,`disable_down`,`deadline` FROM `pan_shares` WHERE '.implode(' AND ', $whereArr);
        $ret = $this->pandb->query($sql)->row_array();
        if (empty($ret['shareid'])) {
            return false;
        }
        return $ret;
    }

    /**
     * 查询路径的ID
     * @param $path
     * @param $crid
     * @return int
     */
    public function getUpid($path, $crid, $v = 1) {
        $sql = 'SELECT `shareid` FROM `pan_shares` WHERE `crid`='.intval($crid).' AND `path`='.$this->pandb->escape($path).' AND `v`='.intval($v);
        $ret = $this->pandb->query($sql)->row_array();
        if (!empty($ret)) {
            return $ret['shareid'];
        }
        return 0;
    }

    /**
     * 批量移动共享文件
     * @param $fileids 目标文件ID
     * @param $upid 目标目录ID
     * @param $uid 目标文件用户ID
     * @param $crid 目标文件所在网校ID
     * @return bool
     */
    public function batchMove($fileids, $upid, $uid, $crid, $v = 1) {
        if (empty($fileids) || empty($upid)) {
            return false;
        }
        $wheres = array(
            '`uid`='.intval($uid),
            '`crid`='.intval($crid),
            '`upid`=0',
            '`v`='.intval($v)
        );
        $params = array('upid' => intval($upid));
        if (is_array($fileids)) {
            $fileids = array_map('intval', $fileids);
            $fileids = array_unique($fileids);
            $wheres[] = '`fileid` IN('.implode(',', $fileids).')';
        } else {
            $wheres[] = '`fileid`='.intval($fileids);
        }
        $wheres = implode(' AND ', $wheres);
        return $this->pandb->update('pan_shares', $params, $wheres);
    }
}
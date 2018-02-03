<?php
/**
 * 文件model类
 */
class FileModel extends CModel{
	private $pandb = NULL;
	function __construct(){
		parent::__construct();
		$this->pandb = Ebh::app()->getOtherDb('pandb');//pan
	}
	/**
	 * 获取文件列表
	 */
	public function getFileList($param){
		$sql = 'SELECT s.checksum,f.fileid,f.uid,f.isdir,f.upid,f.title as name,f.path,f.dateline,f.size,f.suffix as ext,f.isshare,s.ispreview,f.sid FROM pan_files f LEFT JOIN pan_sources s ON f.sid=s.sid ';
		//分类：doc文档 video视频 image图片 music音乐 zip压缩包
		if(!empty($param['category'])){
			switch($param['category']){
				case 'doc':
					$wherearr[] = "f.suffix in('doc','docx','docm','dotx','dotm','dot','rtf','xlsx','xls','csv','xlsm','xlsb','ppt','pptx','pptm','potx','pot','potm','pdf','fdf','markdown','mdown','mkdn','md','txt')";
					break;
				case 'video':
					$wherearr[] = "f.suffix in('avi','rm','rmvb','wmv','mpg','mpeg','mkv','flv','dat','scm','mov','3g2','3gp','3gp2','3gpp','mp4','amv','csf','ivf','mts','swf','webm')";
					break;
				case 'image':
					$wherearr[] = "f.suffix in('bmp','gif','jpg','jpeg','png','psd','cdr','ico','tif','tiff','tga','raw')";
					break;
				case 'music':
					$wherearr[] = "f.suffix in('mp3','wma','wav','aac','ape','mid','mod','cd','asf','arm','ram','m4a','ogg','aif','aifc','amr')";
					break;
				case 'zip':
					$wherearr[] = "f.suffix in('rar','zip','jar','iso','cab','lha','bh','tar','lzh','7z','gz','gzip','bar','zipx','bz2')";
					break;
				default:
					return FALSE;
			}
		}
		if (isset($param['ext'])) {
			$ext = $this->db->escape_str($param['ext']);
			$wherearr[] = "f.suffix in('".$ext."')";
		}
		if(isset($param['upid']))
			$wherearr[] = 'f.upid=' . $param['upid'];
		if(isset($param['fileid']))
			$wherearr[] = 'f.fileid=' . $param['fileid'];
		if(isset($param['fileidlist']))
			$wherearr[] = 'f.fileid in(' . $param['fileidlist'].') ';
		if(!empty($param['isdir']))
			$wherearr[] = 'f.isdir=' . $param['isdir'];
		if(!empty($param['uid']))
			$wherearr[] = 'f.uid=' . $param['uid'];
		if(!empty($param['crid']))
			$wherearr[] = 'f.crid=' . $param['crid'];
		$wherearr[] = 'f.status=0';
		if(!empty($param['q']))
			$wherearr[] = "f.title like '%" . $this->pandb->escape_str($param['q']) . "%' and f.path like '" . $this->pandb->escape_str($param['path'])."%'";
		if(!empty($wherearr))
			$sql.= ' where '.implode(' AND ',$wherearr);

		$sql.= ' order by isdir DESC,fileid desc';
		if(!empty($param['limit'])) {
			$sql .= ' limit '.$param['limit'];
		} else {
			if (empty($param['page']) || $param['page'] < 1)
				$page = 1;
			else
				$page = $param['page'];
			$pagesize = empty($param['pagesize']) ? 3000 : $param['pagesize'];
			$start = ($page - 1) * $pagesize;
			$sql .= ' limit ' . $start . ',' . $pagesize;
        }
        //print_r($sql);exit;
		return $this->pandb->query($sql)->list_array();
	}

	/** 
	 * 获取有子目录的id
	 * @param str $pid
	 * @return arr
	 */
	public function getFilePidByPids($pid) {
		if (empty($pid))
			return array();
		$sql = 'select distinct(upid) from pan_files where upid in ('.$pid.') and isdir=1 limit 0,1000';//取个1000吧
		return $this->pandb->query($sql)->list_array();
	}

	/*public function getFileListGtZero() {
		
	}*/

	/**
	 * 获取文件总数
	 */
	public function getFileCount($param){
		$count = 0;
		$sql = 'SELECT count(*) count FROM pan_files f';
		//分类：doc文档 video视频 image图片 music音乐 zip压缩包
		if(!empty($param['category'])){
			switch($param['category']){
				case 'doc':
					$wherearr[] = "f.suffix in('doc','docx','docm','dotx','dotm','dot','rtf','xlsx','xls','csv','xlsm','xlsb','ppt','pptx','pptm','potx','pot','potm','pdf','fdf','markdown','mdown','mkdn','md','txt')";
					break;
				case 'video':
					$wherearr[] = "f.suffix in('avi','rm','rmvb','wmv','mpg','mpeg','mkv','flv','dat','scm','mov','3g2','3gp','3gp2','3gpp','mp4','amv','csf','ivf','mts','swf','webm')";
					break;
				case 'image':
					$wherearr[] = "f.suffix in('bmp','gif','jpg','jpeg','png','psd','cdr','ico','tif','tiff','tga','raw')";
					break;
				case 'music':
					$wherearr[] = "f.suffix in('mp3','wma','wav','aac','ape','mid','mod','cd','asf','arm','ram','m4a','ogg','aif','aifc','amr')";
					break;
				case 'zip':
					$wherearr[] = "f.suffix in('rar','zip','jar','iso','cab','lha','bh','tar','lzh','7z','gz','gzip','bar','zipx','bz2')";
					break;
				default:
					return FALSE;
			}
		}
		if(isset($param['upid']))
			$wherearr[] = 'f.upid=' . $param['upid'];
		if(!empty($param['uid']))
			$wherearr[] = 'f.uid=' . $param['uid'];
		if(!empty($param['crid']))
			$wherearr[] = 'f.crid=' . $param['crid'];
		$wherearr[] = 'f.status=0';
		if(!empty($param['q']))
			$wherearr[] = "f.title like '%" . $this->pandb->escape_str($param['q']) . "%' AND f.isdir=0";
		if(!empty($wherearr))
			$sql.= ' where '.implode(' AND ',$wherearr);

		$row = $this->pandb->query($sql)->row_array();
		if(!empty($row))
			$count = $row['count'];
        return $count;
	}

	/**
	 * 检查文件是否已经存在
	 * @param  string  $upid 父目录编号
	 * @param  string  $path 文件名称
	 * @param  integer  $uid  用户编号
	 * @param  integer  $crid 网校编号
	 * @param  integer  $fileid 需排除文件的编号
	 * @return boolean       TRUE存在 FALSE不存在
	 */
	public function isFileExists($upid, $title, $uid, $crid, $fileid=0){
		$wherearr = array();
		$sql = 'SELECT fileid FROM pan_files';
		$wherearr[] = 'upid=' . intval($upid);
		$wherearr[] = 'title=\'' . $this->pandb->escape_str($title) .'\'';
		$wherearr[] = 'uid=' . intval($uid);
		$wherearr[] = 'crid=' . intval($crid);
		if(!empty($fileid))
			$wherearr[] = 'fileid!=' . intval($fileid);
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
	 * 添加文件和文件夹
	 */
	public function addFile($param){
		$setarr = array();
		if(isset($param['sid']))
			$setarr['sid'] = $param['sid'];
		if(isset($param['isdir']))
			$setarr['isdir'] = $param['isdir'];
		if(!empty($param['title']))
			$setarr['title'] = $param['title'];
		if(!empty($param['dateline']))
			$setarr['dateline'] = $param['dateline'];
		if(isset($param['size']))
			$setarr['size'] = $param['size'];
		if(isset($param['suffix']))
			$setarr['suffix'] = $param['suffix'];
		if(!empty($param['uid']))
			$setarr['uid'] = $param['uid'];
		if(!empty($param['crid']))
			$setarr['crid'] = $param['crid'];
		if(isset($param['upid']))
			$setarr['upid'] = $param['upid'];
		if(!empty($param['path']))
			$setarr['path'] = $param['path'];

		return $this->pandb->insert('pan_files', $setarr);
	}

	/**
	 * 删除文件
	 */
	public function delFile($param){
		if (empty($param['fileids']) || !is_array($param['fileids']))
			return FALSE;
		$fileidarr = array_map('intval', $param['fileids']);
		$wherearr[] = 'fileid in(' . implode(',', $fileidarr) . ')';
		if(empty($param['uid']))
			return FALSE;
		else
			$wherearr[] = 'uid=' . $param['uid'];
		if(empty($param['crid']))
			return FALSE;
		else
			$wherearr[] = 'crid=' . $param['crid'];

		//计算需要减去的已用空间
		$minus_size = 0;
		$file_sql = 'SELECT fileid,size,isshare FROM pan_files WHERE fileid in(' . implode(',', $fileidarr) . ')';
		$filelist = $this->pandb->query($file_sql)->list_array();
		if (!empty($filelist)){
			foreach($filelist as $file){
				$minus_size += $file['size'];
				if ($file['isshare'] == 1){
					$this->pandb->delete('pan_shareings',array('fileid'=>$file['fileid']));
				}
			}
		}
		//减少已用空间
		$userinfo_sql = 'SELECT filesize FROM pan_userinfos WHERE uid=' . intval($param['uid']) . ' AND crid=' . intval($param['crid']);
		$userinfo = $this->pandb->query($userinfo_sql)->row_array();
		if (!empty($userinfo) && $minus_size > 0){
			$filesize = $userinfo['filesize'] - $minus_size;
			$filesize = $filesize > 0 ? $filesize : 0;
			$this->pandb->update('pan_userinfos', array('filesize'=>$filesize), array('uid'=>$param['uid'], 'crid'=>$param['crid']));
			$this->pandb->update('pan_giveinfos',array(),array('crid'=>$param['crid']),array('usepansize'=>'usepansize-'.$minus_size));
		}

		$sql = 'DELETE FROM pan_files';
		$sql .= ' WHERE '.implode(' AND ',$wherearr);
		return $this->pandb->query($sql);
	}

	/**
	 *更新用户的状态
	 */
	public function upDateUserInfo($param) {
		//减少已用空间
		$setarr = array('filesize' => 'filesize+' . intval($param['filesize']));
        $this->pandb->update('pan_userinfos', array(),array('uid'=>$param['uid'],'crid'=>$param['crid']), $setarr);
	}

	/**
	 * 获取文件详情
	 * @param  array $param [description]
	 * @return array        [description]
	 */
	public function getOneFile($param){
		$wherearr = array();
		$sql = 'SELECT fileid,sid,isdir,title,dateline,size,suffix,uid,crid,upid,path,isshare FROM pan_files';
		if(!empty($param['fileid'])){
			$wherearr[] = 'fileid=' . intval($param['fileid']);
		}
		if(!empty($param['path'])){
			$wherearr[] = 'path=\'' . $this->pandb->escape_str($param['path']) . '\'';
		}
		if(!empty($param['title'])){
			$wherearr[] = 'title=\'' . $this->pandb->escape_str($param['title']) . '\'';
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
	 * 重命名
	 */
	public function renameFile($param){
		$setarr = array();
		if (isset($param['title']))
			$setarr['title'] = $param['title'];
		if (isset($param['path']))
			$setarr['path'] = $param['path'];
		if (empty($param['fileid']) || empty($param['uid']) || empty($param['crid'])){
			return FALSE;
		} else {
			$wherearr['fileid'] = $param['fileid'];
			$wherearr['uid'] = $param['uid'];
			$wherearr['crid'] = $param['crid'];
		}

		$result = $this->pandb->update('pan_files', $setarr, $wherearr);
		if ($result === FALSE){
			return FALSE;
		}
		else {
			if (!empty($param['isdir']))
				$this->_updateChildren($param['fileid'], $param['path']);
			return TRUE;
		}

	}

	/**
	 * 移动
	 */
	public function moveFile($param){
		$setarr = array();		
		if (isset($param['upid']))
			$setarr['upid'] = $param['upid'];
		if (!empty($param['path']))
			$setarr['path'] = $param['path'];
		if(empty($param['fileid']) || empty($param['uid']) || empty($param['crid'])){
			return FALSE;
		} else {
			$wherearr['fileid'] = $param['fileid'];
			$wherearr['uid'] = $param['uid'];
			$wherearr['crid'] = $param['crid'];
		}

		$result = $this->pandb->update('pan_files', $setarr, $wherearr);
		if ($result === FALSE){
			return FALSE;
		}
		else {
			if (!empty($param['isdir']))
				$this->_updateChildren($param['fileid'], $param['path']);
			return TRUE;
		}
	}

	/**
	 * 递归更新子文件的路径
	 * @param  integer $upid   父编号
	 * @param  string $uppath 父路径
	 */
	public function _updateChildren($upid, $uppath){
		$sql = 'select fileid,isdir,title from pan_files where upid = '.$upid;
		$children = $this->pandb->query($sql)->list_array();
		if(empty($children)){
			return;
		}
		foreach ($children as $child) {
			if ($child['isdir'] == 1){
				$this->pandb->update('pan_files', array('path'=>$uppath.$child['title'].'/'), array('fileid'=>$child['fileid']));
				$this->_updatechildren($child['fileid'], $uppath.$child['title'].'/');
			}
			else
			{
				$this->pandb->update('pan_files', array('path'=>$uppath.$child['title']), array('fileid'=>$child['fileid']));
			}
		}

	}

	/**
    *插入文件记录
    */
    public function insert($param) {
        $setarr = array();
        if (!empty($param['sid']))
            $setarr['sid'] = $param['sid'];
        if (isset($param['isdir']))
            $setarr['isdir'] = $param['isdir'];
        if (!empty($param['title']))
            $setarr['title'] = $param['title'];
        if (isset($param['dateline']))
            $setarr['dateline'] = $param['dateline'];
        else
            $setarr['dateline'] = SYSTIME;
        if (!empty($param['size']))
            $setarr['size'] = $param['size'];
        if (!empty($param['suffix']))
            $setarr['suffix'] = $param['suffix'];
        if (!empty($param['uid']))
            $setarr['uid'] = $param['uid'];
        if (!empty($param['crid']))
            $setarr['crid'] = $param['crid'];
        if (!empty($param['upid']))
            $setarr['upid'] = $param['upid'];
        if (!empty($param['path']))
            $setarr['path'] = $param['path'];
        if (isset($param['isshare']))
            $setarr['isshare'] = $param['isshare'];
        return $this->pandb->insert('pan_files', $setarr);
    }
    /**
    *更新文件信息
    */
    public function update($param) {
        if(empty($param['fileid']))
            return FALSE;
        $setarr = array();
        if (!empty($param['sid']))
            $setarr['sid'] = $param['sid'];
        if (!empty($param['title']))
            $setarr['title'] = $param['title'];
        if (!empty($param['dateline']))
            $setarr['dateline'] = $param['dateline'];
        if (!empty($param['size']))
            $setarr['size'] = $param['size'];
        if (!empty($param['suffix']))
            $setarr['suffix'] = $param['suffix'];
        if (!empty($param['suffix']))
            $setarr['suffix'] = $param['suffix'];
        $where = array('fileid' => $param['fileid']);
        return $this->pandb->update('pan_files', $setarr, $where);
    }
    /**
    *根据文件信息获取对应文件
    */
    public function getFileByInfo($param) {
        //通过 uid crid title upid path 唯一确定一个文件

        if(empty($param['uid']) || empty($param['crid']) || empty($param['title']) || empty($param['path']) ) {
            return FALSE;
        }
        $uid = $param['uid'];
        $crid = $param['crid'];
        $title = $this->pandb->escape($param['title']);
        $upid = $param['upid'];
        $path = $this->pandb->escape($param['path']);
        $sql = "select fileid from pan_files where uid=$uid and crid=$crid and title=$title and upid=$upid and path=$path";
        return $this->pandb->query($sql)->row_array();
    }
    /**
    *根据文件fileid获取原始文档的sid
    */
    public function getSidByFileid($fileid) {
        $sid = 0;
        $sql = "select sid from pan_files where fileid=$fileid";
        $row = $this->pandb->query($sql)->row_array();
        if(!empty($row))
            $sid = $row['sid'];
        return $sid;
    }
    /**
    *根据文件fileid获取文件信息
    */
    public function getFileByFileid($fileid) {
        $sql = "select fileid,sid,title,dateline,size,suffix,uid,crid from pan_files where fileid=$fileid";
        return $this->pandb->query($sql)->row_array();
    }

    /**
     * 检查文件是否自己的
     * @param $fileid 文件ID
     * @param $uid 用户ID
     * @param $crid 网校ID
     * @return bool
     */
    public function checkMine($fileid, $uid, $crid) {
        $sql = 'SELECT `fileid` FROM `pan_files` WHERE `fileid`='.intval($fileid).
            ' AND `uid`='.intval($uid). ' AND `crid`='.intval($crid);
        $ret = $this->pandb->query($sql)->row_array();
        if (empty($ret['fileid'])) {
            return false;
        }
        return true;
    }

    /**
     * 根据路径获取ID
     * @param $path
     * @param $uid
     * @return bool
     */
    public function getFileByPath($path, $uid) {
        $sql = 'SELECT `fileid` FROM `pan_files` WHERE `uid`='.intval($uid).' AND `path`='.$this->pandb->escape($path);
        $ret = $this->pandb->query($sql)->row_array();
        if (empty($ret['fileid'])) {
            return false;
        }
        return $ret['fileid'];
    }
}
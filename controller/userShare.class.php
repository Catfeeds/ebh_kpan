<?php 
/*
* @link http://www.kalcaddle.com/
* @author warlee | e-mail:kalcaddle@qq.com
* @copyright warlee 2014.(Shanghai)Co.,Ltd
* @license http://kalcaddle.com/tools/licenses/license.txt
*/
class userShare extends EbhController{
    /**
     * 数据保存模式：0 - 文件，１ - 数据库
     * @var int
     */
    private $_saveType = 0;
	private $sql;
	function __construct(){
		parent::__construct();
		$this->_saveType = 1;
		if ($this->_saveType == 1) {
		    return;
        }
		$this->sql=new fileCache(USER.'data/share.php');
	}
	/**
	 * 获取
	 */
	public function get() {
	    if ($this->_saveType == 1) {

        }
		$list = $this->sql->get();
		foreach($list as $key=>&$val){
			//unset($val['share_password']);
		}
		return $list;
	}

	//检测该目录是否已被共享
	public function checkByPath(){
        if ($this->_saveType == 1) {
            $model = $this->model('Shareing');
            $shareFile = $model->checkShared($this->in['path'], $this->user['uid'], $this->crid);
            if ($shareFile === false) {
                show_json('',false);//没有找到
            }
            $source = $this->model('File')->getOneFile(array(
                'fileid' => $shareFile['fileid'],
                'crid' => $this->crid,
                'uid' => $this->user['uid']
            ));
            show_json(
                array(
                    'mtime' => $shareFile['dateline'],
                    'sourceid' => $shareFile['sid'],
                    'sid' => 's'.$shareFile['shareid'],
                    'type' => $shareFile['isdir'] ? 'folder' : 'file',
                    'path' => $shareFile['path'],
                    'name' => $shareFile['title'],
                    'show_name' => $shareFile['title'],
                    'time_to' => '',
                    'share_password' => '',
                    'code_read' => '',
                    'can_upload' => '',
                    'not_download' => ''
                ),
                true,
                empty($source) ? '' : array(
                    's'.$shareFile['shareid'] => array(
                        'mtime' => $source['dateline'],
                        'sourceid' => 's'.$shareFile['shareid'],
                        'sid' => 's'.$shareFile['shareid'],
                        'type' => $shareFile['isdir'] ? 'folder' : 'file',
                        'path' => $shareFile['path'],
                        'name' => $shareFile['title'],
                        'show_name' => $source['title'],
                        'time_to' => '',
                        'share_password' => '',
                        'code_read' => '',
                        'can_upload' => '',
                        'not_download' => ''
                    )
                )
            );
        }

		$this->in['path'] = _DIR_CLEAR($this->in['path']);
		$share_info = $this->sql->get('path',$this->in['path']);
		if (!$share_info) {
			show_json('',false);//没有找到
		}else{
			show_json($share_info,true,$this->get());
		}
	}

	/**
	 * 编辑
	 */
	public function set(){
        if ($this->_saveType == 1) {
            if ($this->user['groupid'] != 5) {
                //非教师用户禁止共享文件
                show_json($this->L['no_permission_action'], false);
            }
            $shareModel = $this->model('Shareing');
            $sid = $this->in['sid'];
            if (!$sid && $this->in['fileid']) {
                $existShare = $shareModel->getOneShare(array(
                    'fileid' => intval($this->in['fileid']),
                    'uid' => $this->user['uid'],
                    'crid' => $this->crid
                ));
                if (!empty($existShare)) {
                    show_json(
                        array(
                        'mtime' => SYSTIME,
                        'sourceid' => $existShare['sid'],
                        'sid' => 's'.$existShare['shareid'],
                        'type' => $this->in['type'],
                        'path' => $existShare['path'],
                        'name' => $existShare['title'],
                        'show_name' => '',
                        'time_to' => '',
                        'share_password' => '',
                        'code_read' => '',
                        'can_upload' => '',
                        'not_download' => ''
                    ),
                        true,
                        array(
                        's'.$existShare['shareid'] => array(
                            'mtime' => $existShare['dateline'],
                            'sourceid' => $existShare['sid'],
                            'sid' => 's'.$existShare,
                            'type' => $this->in['type'],
                            'path' => $existShare['path'],
                            'name' => $existShare['title'],
                            'show_name' => $existShare['title'],
                            'time_to' => '',
                            'share_password' => '',
                            'code_read' => '',
                            'can_upload' => '',
                            'not_download' => ''
                        )
                    ));
                }
            }
            if (!$sid && $this->in['path'] && $this->in['type'] && $this->in['name']) {
                $source = $this->model('File')->getOneFile(array(
                    'fileid' => $this->in['fileid'],
                    'crid' => $this->crid,
                    'uid' => $this->user['uid']
                ));
                if (empty($source)) {
                    show_json($this->L["path_can_not_action"],false);
                }
                $name = $this->getName($this->in['name'], $source['isdir'], $this->crid, $source['fileid']);
                $shareData = array(
                    'title' => $name,
                    'sid' => $source['sid'],
                    'fileid' => $source['fileid'],
                    'isdir' => $source['isdir'],
                    'dateline' => SYSTIME,
                    'uid' => $this->user['uid'],
                    'crid' => $this->crid,
                    'upid' => $source['upid'],
                    'path' => $this->in['path'],
                    'ispassword' => 0,
                    'password' => '',
                    'disable_down' => 0,
                    'dealine' => 0
                );
                $ret = $shareModel->addShare($shareData);
                if ($ret > 0) {
                    show_json(
                        array(
                            'mtime' => SYSTIME,
                            'sourceid' => $shareData['sid'],
                            'sid' => 's'.$ret,
                            'type' => $this->in['type'],
                            'path' => $shareData['path'],
                            'name' => $name,
                            'show_name' => $name,
                            'time_to' => '',
                            'share_password' => '',
                            'code_read' => '',
                            'can_upload' => '',
                            'not_download' => $shareData['disable_down']
                        ),
                        true,
                        array(
                            's'.$ret => array(
                                'mtime' => $source['dateline'],
                                'sourceid' => $source['sid'],
                                'sid' => 's'.$ret,
                                'type' => $this->in['type'],
                                'path' => $source['path'],
                                'name' => $name,
                                'show_name' => $name,
                                'time_to' => '',
                                'share_password' => '',
                                'code_read' => '',
                                'can_upload' => '',
                                'not_download' => ''
                            )
                        )
                    );
                }
                show_json($this->L['error'],false);
            }


            if (!$sid || !$this->in['show_name'] || !$this->in['path']){
                show_json($this->L["data_not_full"],false);
            }
            $shareid = intval(substr($sid, 1));
            $shareItem = $shareModel->getOneShare(array('shareid' => $shareid));
            if (empty($shareItem)) {
                show_json($this->L['error'],false);
            }

            $name = $this->getName(!empty($this->in['show_name']) ? $this->in['show_name'] : $this->in['name'], $shareItem['isdir'], $this->crid, $shareItem['fileid']);
            $params = array(
                'title' => $name,
                'shareid' => $shareid,
                'crid' => $this->crid,
                'uid' => $this->user['uid']
            );
            //print_r($params);exit;
            $ret = $shareModel->renameShare($params);
            if ($ret > 0) {
                show_json(
                    array(
                        'mtime' => SYSTIME,
                        'sid' => $this->in['sid'],
                        'type' => 'file',
                        'path' => $this->in['path'],
                        'name' => $name,
                        'show_name' => $name,
                        'time_to' => $this->in['time_to'],
                        'share_password' => $this->in['share_password'],
                        'code_read' => $this->in['code_read'],
                        'can_upload' => $this->in['can_upload'],
                        'not_download' => $this->in['not_download']
                    ),
                    true,
                    array(
                        $this->in['sid'] => array(
                            'mtime' => SYSTIME,
                            'sid' => $this->in['sid'],
                            'type' => 'file',
                            'path' => $this->in['path'],
                            'name' => $name,
                            'show_name' => $name,
                            'time_to' => $this->in['time_to'],
                            'share_password' => $this->in['share_password'],
                            'code_read' => $this->in['code_read'],
                            'can_upload' => $this->in['can_upload'],
                            'not_download' => $this->in['not_download']
                        )
                    )
                );
            }
            show_json($this->L['error'],false);
        }
        if (!$this->in['show'] || !$this->in['path'] || !$this->in['type']){
            show_json($this->L["data_not_full"],false);
        }
		$share_info = array(
			'mtime'			=> time(),//更新则记录最后时间
			'sid'			=> isset($this->in['sid'])?$this->in['sid']:'',
			'type'			=> $this->in['type'],
			'path'			=> _DIR_CLEAR($this->in['path']),
			'name'			=> $this->in['name'],
			'show_name'		=> isset($this->in['show_name'])?$this->in['show_name']:$this->in['name'],
			'time_to'		=> isset($this->in['time_to'])?$this->in['time_to']:'',
			'share_password'=> isset($this->in['share_password'])?$this->in['share_password']:'',
			'code_read'		=> isset($this->in['code_read'])?$this->in['code_read']:'',
			'can_upload'	=> isset($this->in['can_upload'])?$this->in['can_upload']:'',
			'not_download'	=> isset($this->in['not_download'])?$this->in['not_download']:''
		);
		if(substr($share_info['path'],0,1) == '{'){//用户只能分享自己的目录；
			show_json($this->L["path_can_not_action"],false);
		}

		$name = $share_info['name'];
		$search = $this->sql->get('name',$name);
		$i = 0;
		while($i>200 || $search && $search['sid']!=$share_info['sid']){
			$name   = $share_info['name'].'('.$i.')';
			$search = $this->sql->get('name',$name);
			$i++;
		}
		if($i !=0){
			$share_info['name'] = $name;
		}

		//含有sid则为更新，否则为插入
		if (isset($this->in['sid']) && strlen($this->in['sid']) == 8) {
			$info_new = $this->sql->get($this->in['sid']);			
			foreach ($share_info as $key=>$val) {//只更新指定key
				$info_new[$key] = $val;
			}
			if($this->sql->set($this->in['sid'],$info_new)){
				show_json($info_new,true,$this->get());
			}
			show_json($this->L['error'],false);
		}else{//插入
			$share_list = $this->sql->get();
			$new_id = rand_string(8);
			while (isset($share_list[$new_id])) {
				$new_id = rand_string(8);
			}
			$share_info['sid'] = $new_id;
			if($this->sql->set($new_id,$share_info)){
				show_json($share_info,true,$this->get());
			}
			show_json($this->L['error'],false);
		}
		show_json($this->L['error'],false);
	}

	/**
	 * 删除
	 */
	public function del() {
        if ($this->_saveType == 1) {
            $jsonData = json_decode($this->in['data_arr'], true);
            if (empty($jsonData)) {
                show_json($this->L['error'], false);
            }
            $shareid = array_column($jsonData, 'path');
            $shareid = array_map(function($pathid) {
                return intval(substr($pathid, 1));
            }, $shareid);
            $model = $this->model('Shareing');
            $ret = $model->cancelByShareids(array(
                'shareids' => $shareid,
                'crid' => $this->crid,
                'uid' => $this->user['uid']
            ));
            if ($ret > 0) {
                show_json($this->L['success']);
            }
            show_json($this->L['error'], false);
        }
		$list = json_decode($this->in['data_arr'],true);
		foreach ($list as $val) {
			$this->sql->remove($val['path']);
		}
		show_json($this->L['success'],true,$this->get());
	}

    /**
     * 获取保存的分享名
     */
	private function getName($title, $isdir, $crid, $fileid = 0) {
        $repeatNames = $this->model('Shareing')->getRepeatName($isdir, $crid, true);
	    if (empty($repeatNames) || isset($repeatNames[$fileid]) && $repeatNames[$fileid]['title'] == $title) {
	        return $title;
        }
        unset($repeatNames[$fileid]);
        $names = array_column($repeatNames, 'title');
	    $names = array_flip($names);
	    if (!isset($names[$title])) {
	        return $title;
        }
        $ext = '';
        $i = 1;
        $title = $basetitle = preg_replace('/\(\d+\)\B/', '', $title);
        if (!$isdir) {
            $ext = strrchr($title,'.');
            $len = strrpos($basetitle, '.');
            $basetitle = substr($basetitle, 0, $len);
        }

        while(isset($names[$title])) {
            $title = $basetitle.'('.$i.')'.$ext;
            $i++;
        }
        return $title;
    }
}

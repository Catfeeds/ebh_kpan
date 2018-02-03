<?php 
/*
* @link http://www.kalcaddle.com/
* @author warlee | e-mail:kalcaddle@qq.com
* @copyright warlee 2014.(Shanghai)Co.,Ltd
* @license http://kalcaddle.com/tools/licenses/license.txt
*/

class fav extends EbhController {
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
		$this->sql=new fileCache(USER.'data/fav.php');
	}

	/**
	 * 获取收藏夹json
	 */
	public function get() {
	    if ($this->_saveType == 1) {
	        $model = $this->model('Favorite');
            $data = $model->favoriteList($this->user['uid'], $this->crid, 'name');
            array_walk($data, function(&$v) {
                //$v['ext'] = null;
                //收藏文件是否失效，１-是，0-否
                $v['lose'] = $v['path'] == $v['spath'] ? 0 : 1;
                /*if ($v['isdir'] == 1) {
                    $v['type'] = 'folder';
                    return;
                }
                $v['type'] = ltrim(strrchr($v['name'], '.'), '.');*/
            });
	        show_json($data);
        }
		show_json($this->sql->get());
	}

	/**
	 * 添加
	 */
	public function add() {
        $name = $this->in['name'];
        $path = $this->in['path'];

	    if ($this->_saveType == 1) {
            $model = $this->model('Favorite');
            $title = trim($name);
            $exists = $model->exists($this->user['uid'], $this->crid, array(
                'fileid' => $this->in['fileid']
            ));
            if ($exists) {
                show_json($this->L['success']);
            }
            $file = $this->model('File')->getOneFile(array(
                'fileid' => intval($this->in['fileid']),
                'crid' => intval($this->crid)
            ));
            if (empty($file)) {
                show_json($this->L['error'], false);
            }
            $params = array(
                'title' => $title,
                'path' => trim($path),
                'uid' => $this->user['uid'],
                'isdir' => $file['isdir'],
                'fileid' => $file['fileid'],
                'sid' => $file['sid'],
                'crid' => $this->crid,
                'ext' => $file['suffix']
            );

            $ret = $model->add($params);
            if (empty($ret)) {
                show_json($this->L['error'], false);
            }
            show_json($this->L['success']);
        }

		if($this->sql->get($name)){//已存在则自动重命名
			$index = 0;
			while ($this->sql->get($name.'('.$index.')')) {
				$index ++;
			}
			$name = $name.'('.$index.')';
		}
		$res=$this->sql->set(
			$name,
			array(
				'name' => $name,
				'path' => $path,
				'ext'  => $this->in['ext'],
				'type' => $this->in['type']
			)
		);
		show_json($this->L['success']);
	}

	/**
	 * 编辑
	 */
	public function edit() {
        if ($this->_saveType == 1) {
            $favid = intval($this->in['favid']);
            if ($favid < 1) {
                show_json($this->L['error'],false);
            }
            $model = $this->model('Favorite');
            $params = array();
            $name = trim($this->in['name_to']);
            if (!empty($name)) {
                $params['title'] = $name;
            }
            $path = trim($this->in['path_to']);
            if (!empty($path)) {
                $params['path'] = $path;
            }
            if (count($params) == 0) {
                show_json($this->L['success']);
            }
            $ret = $model->update($params, $this->in['favid'], $this->user['uid'], $this->crid);
            if ($ret > 0) {
                show_json($this->L['success']);
            }
            show_json($this->L['error'],false);
        }

		$this->in['name'] = $this->in['name'];
		$this->in['path'] = $this->in['path'];
		$this->in['name_to'] = $this->in['name_to'];
		$new_fav = $this->sql->get($this->in['name']);
		if(!isset($new_fav['type'])){
			$new_fav['type'] = 'folder';
		}
		//查找到一条记录，修改为该数组
		$to_array=array(
			'name'=>$this->in['name_to'],
			'path'=>$this->in['path_to'],
			'type'=>$new_fav['type']
		);
		$this->sql->remove($this->in['name']);
		if($this->sql->set($this->in['name_to'],$to_array)){
			show_json($this->L['success']);
		}
		show_json($this->L['error_repeat'],false);
	}

	/**
	 * 删除
	 */
	public function del() {
	    if ($this->_saveType == 1) {
	        $model = $this->model('Favorite');
	        $ret = $model->remove(trim($this->in['favid']), $this->user['uid'], $this->crid);
	        if ($ret > 0) {
                show_json($this->L['success']);
            }
            show_json($this->L['error'],false);
        }
		$this->in['name'] = $this->in['name'];
		if($this->sql->remove($this->in['name'])){
			show_json($this->L['success']);
		}
		show_json($this->L['error'],false);
	}
}

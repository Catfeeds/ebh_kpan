<?php
/*
* @link http://www.kalcaddle.com/
* @author warlee | e-mail:kalcaddle@qq.com
* @copyright warlee 2014.(Shanghai)Co.,Ltd
* @license http://kalcaddle.com/tools/licenses/license.txt
*/

class explorer extends EbhController{
    /**
     * 数据保存模式：0 - 文件，１ - 数据库
     * @var int
     */
    private $_saveType = 0;
	public $path;
	public $user;
	public $input = NULL;
	public function __construct(){
		parent::__construct();
        $this->_saveType = 1;
        if ($this->user['groupid'] == 5) {
        	$this->assign('isTeacher',1);
        } else {
        	$this->assign('isTeacher',0);
        }
		$this->assign('crname',$this->roominfo['crname']);
		$this->input = Ebh::app()->getInput();
		$this->tpl = TEMPLATE.'explorer/';
		//$this->user = $_SESSION['kod_user'];
		if (isset($this->in['path'])) {
			$this->path = $this->in['path'];
			$this->check_system_path();
		}
	}
	/**
	 * kpan 入口首页
	 * eker-hfs...
	 */
	public function index(){
		$dir = '';
		if(isset($this->in['path']) && $this->in['path'] !=''){
			$dir = _DIR_CLEAR($_GET['path']);
			$dir = rtrim($dir,'/').'/';
		}
		$this->assign('dir',$dir);
		if ($this->config['forceWap']) {
			$this->display('index_wap.php');
		}else{
			$this->display('index.php');
		}
	}

	//system virtual folder;
	private function check_system_path(){
		if(!in_array(ACT,array('mkfile','mkdir','search','pathCuteDrag','pathCopyDrag','pathPast','fileDownload'))){
			return;
		}
		if( $GLOBALS['path_type'] == KOD_USER_SHARE && 
			!strstr(trim($this->in['path'],'/'),'/')){//分享根目录
			show_json($this->L['error'],false);
		}
		if(in_array($GLOBALS['path_type'],array(
				KOD_USER_FAV,
				KOD_GROUP_ROOT_ALL,
				KOD_GROUP_ROOT_SELF
				)
			)){
			show_json($this->L['system_path_not_change'],false);
		}
	}

	/**
	 * edit by ebh tyt
	 */
	public function pathInfo(){
		$info_list = json_decode($this->input->post('data_arr'),true);
		if(!$info_list){
			show_json($this->L['error'],false);
		}
		$param['fileidlist'] = '';
		foreach ($info_list as &$val) {
			$param['fileidlist'] .= intval($val['fileid']).',';
		}
		$param['fileidlist'] = substr($param['fileidlist'], 0, -1);
		$data = $this->model('file')->getFileList($param);
		if(!$data){
			show_json($this->L['not_exists'],false);
		}

		//属性查看，单个文件则生成临时下载地址。没有权限则不显示
		/*if (count($info_list)==1 && $info_list[0]['type']!='folder') {//单个文件
			$file = $info_list[0]['path'];
			if( $GLOBALS['is_root'] || 
				$GLOBALS['auth']['explorer:fileDownload']==1 ||
				isset($this->in['viewPage'])){
				$data['download_path'] = _make_file_proxy($file);
			}
			if($data['size'] < 100*1024|| isset($this->in['get_md5'])){//100kb
				$data['file_md5'] = @md5_file($file);
			}else{
				$data['file_md5'] = "...";
			}

			//获取图片尺寸
			$ext = get_path_ext($file);
			if(in_array($ext,array('jpg','gif','png','jpeg','bmp')) ){
				load_class('imageThumb');
				$size = imageThumb::imageSize($file);
				if($size){
					$data['image_size'] = $size;
				}
			}
		}
		$data['path'] = _DIR_OUT($data['path']);*/
		//先默认输出第一个
		if ($data[0]['isdir'] == 1) {
			$data['download_path'] = rtrim($data[0]['path'],'/');
			$data['file_md5'] = '...';
		} else {
			$data['download_path'] = 'http://uppan.ebh.net/att.html?id='.$data[0]['fileid'];
			$data['file_md5'] = $data[0]['checksum'];
		}
		$data['path'] = $data[0]['path'] == '/' ? '/'.$data[0]['name'] : $data[0]['path'];;
		$data['size'] = $data[0]['size'];
		$data['is_readable'] = 1;
		$data['is_writeable'] = 1;
		//$data['mode'] = '-rwx rwx rwx(0777)';
		$ext = get_path_ext($data[0]['path']);
		if(in_array($ext,array('jpg','gif','png','jpeg','bmp')) ){
			$size = $data[0]['size'];
			//if($size){
				//$data['image_size'] = $size;
			//}
		}
		show_json($data);
	}

	public function pathChmod(){
		$info_list = json_decode($this->in['list'],true);
		if(!$info_list){
			show_json($this->L['error'],false);
		}
		$mod = octdec('0'.$this->in['mod']);
		$success=0;$error=0;
		foreach ($info_list as $val) {
			$path = _DIR($val['path']);
			if(chmod_path($path,$mod)){
				$success++;
			}else{
				$error++;
			}
		}
		$state = $error==0?true:false;
		$info = $success.' success,'.$error.' error';
		if (count($info_list) == 1 && $error==0) {
			$info = $this->L['success'];
		}
		show_json($info,$state);
	}

	public function mkfile(){
		$tpl_path = BASIC_PATH.'static/others/newfile-tpl/';
		space_size_use_check();
		$repeat_type = 'skip';
		if(isset($this->in['repeat_type'])){
			$repeat_type = $this->in['repeat_type'];
		}
		$new= rtrim($this->path,'/');
		$new = get_filename_auto($new,'',$repeat_type);//已存在处理 创建副本
		if(@touch($new)){
			chmod_path($new,DEFAULT_PERRMISSIONS);
			if (isset($this->in['content'])) {
				file_put_contents($new,$this->in['content']);
			}else{
				$ext = get_path_ext($new);
				$tpl_file = $tpl_path.'newfile.'.$ext;
				if(file_exists($tpl_file)){
					$content = file_get_contents($tpl_file);
					file_put_contents($new,$content);
				}
			}
			space_size_use_change($new);
			show_json($this->L['create_success'],true,_DIR_OUT(iconv_app($new)) );
		}else{
			show_json($this->L['create_error'],false);
		}
	}

	/**
	 * ebh 创建文件夹
	 */
	public function mkdir(){
		//这个为了兼容前端传的//
		$_GET['path'] = str_replace('//', '/', $_GET['path']);
		$rename = substr($_GET['path'],strrpos($_GET['path'],'/')+1);
		$path = ($_GET['path'] != '/' ) ? substr($_GET['path'],0,strrpos($_GET['path'],'/')).'/': $_GET['path'];
        if ($this->_saveType == 1) {
            if ($path == '{group_share}/') {
                //共享目录限制二级
                $sharePath = '/'.trim($rename, '/').'/';
                if (empty($rename)) {
                    show_json($this->L['create_error'],false);
                }
                $shareModel = $this->model('Share');
                $exists = $shareModel->isShareExists(0, $sharePath, 0, $this->crid);
                if ($exists) {
                    show_json($this->L['create_error'],false);
                }
                $params = array(
                    'sid' => 0,
                    'fileid' => 0,
                    'isdir' => 1,
                    'title' => $rename,
                    'dateline' => SYSTIME,
                    'uid' => $this->user['uid'],
                    'upid' => 0,
                    'path' => $sharePath,
                    'ispassword' => intval($this->in['ispassword']) == 1 ? 1 : 0,
                    'password' => strval($this->in['password']),
                    'disable_down' => intval($this->in['disable_down']) == 1 ? 1 : 0,
                    'deadline' => intval($this->in['deadline']),
                    'crid' => $this->crid
                );
                $ret = $shareModel->addShare($params);
                if ($ret > 0) {
                    show_json($this->L['create_success'],true);
                }
                show_json($this->L['create_error'],false);
            }
        }
		$param['path'] = $path;
		$param['uid'] = $this->user['uid'];
		$param['crid'] = $this->crid;
		$res['errno'] = 0;
		$res['errmsg'] = '操作成功';
		if (!$this->check_path($path)){
			$res['errno'] = 1;
			$res['errmsg'] = '目录错误';
			echo json_encode($res);
			exit;
		}
		$upid = $this->_getfileid($path);
		if ($upid === FALSE){
			$res['errno'] = 2;
			$res['errmsg'] = '目录不存在，新建文件夹失败';
			echo json_encode($res);
			exit;
		} else{
			$param['upid'] = $upid;
		}

		//生成新建文件夹名称
		$newtitle = '新建文件夹';
		$newtitlenum = 1;
		while($this->model('file')->isFileExists($upid, $newtitle, $this->user['uid'], $this->crid)){
			$newtitle = '新建文件夹('.$newtitlenum.')';
			$newtitlenum++;
		}

		$param['isdir'] = 1;
		$param['title'] = $newtitle;
		$param['dateline'] = SYSTIME;
		$param['uid'] = $this->user['uid'];
		$param['crid'] = $this->crid;
		$param['path'] = $path . $newtitle .'/';

		if (iconv_strlen($param['path'],"UTF-8") > 255 ) {
			show_json('文件名字太长',false);
		}

		$insert_id = $this->model('file')->addFile($param);
		if (empty($insert_id)){
			$res['errno'] = 5;
			$res['errmsg'] = '新建文件夹失败';
			echo json_encode($res);
			exit;
		}

		$file = array(
			'title' 	=> $param['title'],
			'path'		=> $param['path'],
			'fileid'	=> $insert_id,
			'date'		=> date('Y-m-d H:i', $param['dateline']),
			'isdir'		=> 1,
			'size'		=> 0,
			'suffix'	=> '',
			'isshare'	=> 0,
			'ispreview'	=> 0,
			'ico'		=> ''//format_ico($param['title'], 1, '')
		);
		$res['data'] = $file;
		$this->pathRname($insert_id,$rename);
		show_json($this->L['create_success'],true,_DIR_OUT(iconv_app($rename)) );
		/*space_size_use_check();
		$repeat_type = 'skip';
		if(isset($this->in['repeat_type'])){
			$repeat_type = $this->in['repeat_type'];
		}
		$new = rtrim($this->path,'/');
		$new = get_filename_auto($new,'',$repeat_type);//已存在处理 创建副本
		if(mk_dir($new,DEFAULT_PERRMISSIONS)){
			chmod_path($new,DEFAULT_PERRMISSIONS);
			show_json($this->L['create_success'],true,_DIR_OUT(iconv_app($new)) );
		}else{
			show_json($this->L['create_error'],false);
		}*/
	}

	/**
	 * ebh 检查路径格式
	 * @param  string $path 路径
	 * @param  boolean $notrootpath 非根目录 TRUE不允许根目录 FALSE允许根目录
	 * @return boolean       TRUE正确 FALSE错误
	 */
	public function check_path(&$path, $notrootpath = FALSE){
		if ($path == '//') {
			$path = '/';
			return TRUE;
		}
	    if (!$notrootpath && $path == '/'){
	        return TRUE;
	    }
	    if (preg_match('/^\/.+\/$/', $path)){
	        return TRUE;
	    }
	    else{
	        return FALSE;
	    }
	}

	/**
	 * ebh 根据路径获取目录编号
	 * @param  string $path 路径
	 * @return mix      fileid
	 */
	private function _getfileid($path){
		$fileid = FALSE;
		if (empty($path)){
			return FALSE;
		}
		if ($path == '/'){
			$fileid = 0;
		} else {
			$file = $this->model('file')->getOneFile(array('path'=>$path,'uid'=>$this->user['uid'],'crid'=>$this->crid));
			if (!empty($file)){
				$fileid = $file['fileid'];
			}
		}
		return $fileid;
	}

	/**
	 * 根据编号获取文件夹路径
	 * @param  integer $fileid 文件编号
	 * @return mix         文件路径
	 */
	private function _getfilepath($fileid){
		$filepath = FALSE;
		if($fileid == 0){
			$filepath ='/';
		}
		else {
			$file = $this->model('file')->getOneFile(array('fileid'=>$fileid,'uid'=>$this->user['uid'],'crid'=>$this->crid));
			if (!empty($file) && $file['isdir'] == 1){
				$filepath = $file['path'];
			}
		}
		return $filepath;
	}

	/**
	 *ebh 文件路径重命名
	 */
	public function pathRname($fileid=NULL,$title=NULL){
		if ($_POST['rname_to'] == '//' || $title =='//') {
			show_json('文件名不能包含下列字符：\/:*?"<>|',false,array(''));
		}
		$param['fileid'] = empty($fileid)?intval($_POST['fileid']):$fileid;
		$param['title'] = empty($title)?substr($_POST['rname_to'],strrpos($_POST['rname_to'], '/')):$title;
		$param['title'] = ltrim($param['title'],'/');
		$param['uid'] = $this->user['uid'];
		$param['crid'] = $this->crid;

		if(empty($param['fileid'])){
			show_json('重命名失败',false,array());
			exit;
		}
		if(preg_match('/[\\/:\*\?""<>\|]/', $param['title'])) {
			show_json('文件名不能包含下列字符：\/:*?"<>|',false,array(''));
		}
		/*if (!check_title($param['title'])){
			show_json('重命名失败',false);
			$res['errno'] = 2;
			$res['errmsg'] = '文件名不能包含下列字符：\/:*?"<>|';
			echo json_encode($res);
			exit;
		}*/
		$title = $param['title'];
		if ($param['title'] == '') {
			show_json('文件名不能包含下列字符：\/:*?" <>|',false,array(''));
		}
		unset($param['title']);
		Ebh::app()->getOtherDb('pandb')->set_con(0);//设置主服务器查询
		$file = $this->model('file')->getOneFile($param);
		if (empty($file)){
			show_json('文件不存在',false);
		}
		$param['title'] = $title;
		$check_exist = $this->model('file')->isFileExists($file['upid'], $param['title'], $this->user['uid'], $this->crid, $param['fileid']);
		if ($check_exist){
			show_json('已存在相同文件名',false);
		}

		//获取新路径
		$up_path = $this->_getfilepath($file['upid']);//获取父路径
		if ($up_path === FALSE){
			show_json('目录错误',false);
		}
		$param['path'] = $up_path . $param['title'];

		if (iconv_strlen($param['path'],"UTF-8") > 255 ) {
			show_json('文件名字太长',false);
		}

		if ($file['isdir'] == 1){//文件夹后面加斜杠
			$param['path'] .= '/';
		}
		$param['isdir'] = $file['isdir'];
		$result = $this->model('file')->renameFile($param);
		if ($result === FALSE){
			show_json('重命名失败',false);
		}

		//$res['data'] = array('title'=>$param['title'],'path'=>$param['path'],'fileid'=>$param['fileid']);
		//echo json_encode($res);
		if (empty($fileid))
			show_json($this->L['rname_success'],true,_DIR_OUT(iconv_app($param['path'])));
		/*$rname_to=_DIR($this->in['rname_to']);
		if (file_exist_case($rname_to)) {
			show_json($this->L['name_isexists'],false);
		}
		if(@rename($this->path,$rname_to)){
			show_json($this->L['rname_success'],true,_DIR_OUT(iconv_app($rname_to)) );
		}else{
			show_json($this->L['no_permission_write_all'],false);
		}*/
	}

	public function search(){
		//
		$path = $_POST['path'];
		$isFromSearch = TRUE;
		$this->pathList($path,$isFromSearch);
		/*if (!isset($this->in['search'])) show_json($this->L['please_inpute_search_words'],false);

		$is_content = intval($this->in['is_content']);
		$is_case = intval($this->in['is_case']);
		$ext= trim($this->in['ext']);
		//共享根目录不支持搜索
		if( $GLOBALS['path_type'] == KOD_USER_SHARE &&
			strstr($this->path,KOD_USER_SHARE)){
			show_json($this->L['path_cannot_search'],false);
		}
		$list = path_search(
			$this->path,
			iconv_system(rawurldecode($this->in['search'])),
			$is_content,$ext,$is_case);
		show_json(_DIR_OUT($list));*/
	}

	public function pathList($path=NULL,$isFromSearch=false){
		$user_path = empty($path) ? $this->in['path'] : $path;
		$list_file=true;
		$check_children=false;
		$formInit=false;
		if ($user_path=="")  $user_path='/';
		$list=$this->path($this->path,$list_file,$check_children,$formInit,$isFromSearch);
		//自己的根目录
		if($this->path== MYHOME || $this->path==HOME){
			;
			$this->_self_root_load($list['folderlist']);
		}
		/*if ($this->_saveType == 1) {
		    show_json($list);
        }*/
//print_r($list);exit;
		//群组根目录
		if( $list['info']['path_type'] == KOD_GROUP_PATH &&
			!strstr(trim(_DIR_CLEAR($this->in['path']),'/'),'/')
		   ){//自己的根目录
			$this->_self_group_load($list['folderlist']);
		}
		$list['user_space'] = $this->user['config'];
		show_json($list);
	}

	public function treeList(){//树结构
		$app = $this->in['app'];//是否获取文件 传folder|file
		if (isset($this->in['type']) && $this->in['type']=='init'){
			$this->_tree_init($app);
		}

		/*强制刷新全部树状结构*/
		/*if ($this->in['path'] == '/') {
            $this->_tree_init('refresh');
        }*/


		//根树目录请求
		switch(trim(rawurldecode($this->in['path']))){
			case KOD_USER_FAV:
				show_json($this->_tree_fav(),true);
				break;
			case KOD_GROUP_ROOT_SELF:
				show_json($this->_group_self(),true);
				break;
			case KOD_GROUP_ROOT_ALL:
				show_json($this->_group_tree('1'),true);
				break;
			default:break;
		}
		//树目录组处理
		if ( (isset($this->in['tree_icon']) && $this->in['tree_icon']!='groupPublic') &&  //公共目录刷新排除
			!strstr(trim(rawurldecode($this->in['path']),'/'),'/') &&
			($GLOBALS['path_type'] == KOD_GROUP_PATH||
			$GLOBALS['path_type'] == KOD_GROUP_SHARE)) {
			$list = $this->_group_tree($GLOBALS['path_id']);
			show_json($list,true);
			return;
		}

		//正常目录
		//$path=_DIR($this->in['path']);
		$path = $this->in['path'];
		//if (!path_readable($path)) show_json($this->L['no_permission_read'],false);
		//$list_file = ($app == 'editor'?true:false);//编辑器内列出文件
		$list=$this->path($path,$list_file,true);
		if (!empty($list['folderlist'])) {
            $list['folderlist'] = array_map(function($folderitem) {
                unset($folderitem['menuType']);
                return $folderitem;
            }, $list['folderlist']);
        }

		function sort_by_key($a, $b){
			if ($a['name'] == $b['name']) return 0;
			return ($a['name'] > $b['name']) ? 1 : -1;
		}
		usort($list['folderlist'], "sort_by_key");
		usort($list['filelist'], "sort_by_key");
		if($path == MYHOME || $path==HOME){//自己的根目录
			// $this->_self_root_load($list['folderlist']);
		}
		if ($app == 'editor') {
			$res = array_merge($list['folderlist'],$list['filelist']);
			show_json($res,true);
		}else{
			show_json($list['folderlist'],true);
		}
	}

	//用户根目录
	private function _self_group_load(&$root){
		foreach ($root as $key => $value) {
			if($value['name'] == 'share'){
				$root[$key] = array(
					'name'		=> $this->L['group_share'],
					'menuType'  => "menufolder folderBox",
					'ext' 		=> "folder_share",
					'isParent'	=> true,
					'is_readable'	=> true,
					'is_writeable'	=> true,

					'path' 		=> KOD_GROUP_PATH.':'.$GLOBALS['path_id'].'/share/',
					'type'      => 'folder',
					'open'      => false,
					'isParent'  => false
				);
				break;
			}
		}
		$root = array_values($root);
	}

	//用户根目录
	private function _self_root_load(&$root){
		foreach ($root as $key => $value) {
			if($value['name'] == 'share'){
				$root[$key] = array(
					'name'		=> $this->L['my_share'],
					'menuType'  => "menuTreeUser",
					'ext' 		=> "folder_share",
					'isParent'	=> true,
					'is_readable'	=> true,
					'is_writeable'	=> true,

					'path' 		=> KOD_USER_SHARE.':'.$this->user['uid'].'/',
					'type'      => 'folder',
					'open'      => false,
					'isParent'  => false
				);
				break;
			}
		}
		$root = array_values($root);
		//不开启回收站则不显示回收站
		if($this->config['user']['recycle_open']=="1"){
			// $root[] = array(
			// 	'name'=>$this->L['recycle'],
			// 	'menuType'  =>"menuRecycleButton",
			// 	'ext' 		=>"recycle",
			// 	'isParent'	=> true,
			// 	'is_readable'	=> true,
			// 	'is_writeable'	=> true,

			// 	'path' 		=> KOD_USER_RECYCLE,
			// 	'type'      => 'folder',
			// 	'open'      => true,
			// 	'isParent'  => false
			// );
		}
	}


	private function _tree_fav(){
		$check_file = ($this->in['app'] == 'editor'?true:false);
		$favData=new fileCache(USER.'data/fav.php');
		$fav_list = $favData->get();
		$fav = array();
		$GLOBALS['path_from_auth_check'] = true;//组权限发生变更。导致访问group_path 无权限退出问题
		foreach($fav_list as $key => $val){
			$has_children = path_haschildren(_DIR($val['path']),$check_file);
			if( !isset($val['type'])){
				$val['type'] = 'folder';
			}
			if( in_array($val['type'],array('group'))){
				$has_children = true;
			}
			$the_fav = array(
				'name'      => $val['name'],
				'ext' 		=> isset($val['ext'])?$val['ext']:"",
				'menuType'  => "menuTreeFav",

				'path' 		=> $val['path'],
				'type'      => $val['type'],
				'open'      => false,
				'isParent'  => $has_children
			);
			if(isset($val['type']) && $val['type']!='folder'){//icon优化
				$the_fav['ext'] = $val['type'];
			}
			$fav[] = $the_fav;
		}
		$GLOBALS['path_from_auth_check'] = false;
		return $fav;
	}

	private function _tree_init($app){
		if ($app == 'editor' && isset($this->in['project'])) {
			$list_project = $this->path(_DIR($this->in['project']),true,true);
			$project = array_merge($list_project['folderlist'],$list_project['filelist']);
			$tree_data = array(
				array('name'=> get_path_this($this->in['project']),
					'children'	=>$project,
					'menuType'  => "menuTreeRoot",
					'ext' 		=> "folder",
					'path' 		=> $this->in['project'],
					'type'      => 'folder',
					'open'      => true,
					'isParent'  => count($project)>0?true:false)
			);
			show_json($tree_data);
			return;
		}
		$check_file = ($app == 'editor'?true:false);
		$fav = $this->_tree_fav($app);
		$public_path = KOD_GROUP_PATH.':1/';

		$group_root  = system_group::get_info(1);
		$group_root_name = $this->L['public_path'];
		if($group_root && $group_root['name'] != 'public'){
			$group_root_name = $group_root['name'];
		}

		if(system_member::user_auth_group(1) == false){
			$public_path = KOD_GROUP_SHARE.':1/';//不在公共组则只能读取公共组共享目录
		}
		$init = true;
		$list_public = $this->path(_DIR($public_path),$check_file,true,$init);
		$list_root  = $this->path(_DIR(MYHOME),$check_file,true,$init);
		if ($check_file) {//编辑器
			$root = array_merge($list_root['folderlist'],$list_root['filelist']);
			$public = array_merge($list_public['folderlist'],$list_public['filelist']);
		}else{//文件管理器
			$root  = $list_root['folderlist'];
			$public = $list_public['folderlist'];
			//$this->_self_root_load($root);//自己的根目录 含有我的共享和回收站
		}

		$root_isparent = count($root)>0?true:false;
		$public_isparent = count($public)>0?true:false;
		$public = array_map(function($item) {
		    unset($item['menuType']);
		    return $item;
        }, $public);
		$tree_data = array(
            'app' => array(
                'name' => $this->L['app'],
                'ext' 		=> "groupRoot",
                'path' 		=> KOD_APP,//KOD_GROUP_PATH.':'.$this->crid,
                'type'      => 'folder',
                'open'      => true,
                'isParent'  => false,
                'children' => array()
            ),
            'public'=>array(
                'name'		=> $group_root_name,
                'menuType'  => "menuTreeGroupRoot",
                'ext' 		=> "groupPublic",
                'children'  => $public,

                'path' 		=> KOD_GROUP_SHARE,//$public_path,
                'type'      => 'folder',
                'open'      => false,
                'isParent'  => false//$public_isparent
            ),
            'fav'=>array(
                'name'      => $this->L['fav'],
                'ext' 		=> "treeFav",
                'menuType'  => "menuTreeFavRoot",
                'children'  => $fav,

                'path' 		=> KOD_USER_FAV,
                'type'      => 'folder',
                'open'      => true,
                'isParent'  => count($fav)>0?true:false
            ),
            'my_home'=>array(
                'name'		=> $this->L['root_path'],
                'menuType'  => "menuTreeRoot",
                'ext' 		=> "treeSelf",
                'children'  => $root,

                'path' 		=> MYHOME,
                'type'      => 'folder',
                'open'      => true,
                'isParent'  => $root_isparent
            )


            /*'my_group'=>array(
                'name'		=> $this->L['my_kod_group'],//TODO
                'menuType'  => "menuTreeGroupRoot",
                'ext' 		=> "groupSelfRoot",
                'children'  => $this->_group_self(),

                'path' 		=> KOD_GROUP_ROOT_SELF,
                'type'      => 'folder',
                'open'      => true,
                'isParent'  => true
            ),
            'group'=>array(
                'name'		=> $this->L['kod_group'],
                'menuType'  => "menuTreeGroupRoot",
                'ext' 		=> "groupRoot",
                'children'  => $this->_group_tree('1'),

                'path' 		=> KOD_GROUP_ROOT_ALL,
                'type'      => 'folder',
                'open'      => true,
                'isParent'  => true
            ),*/
		);
		//编辑器简化树目录
		if($app == 'editor'){
			unset($tree_data['my_group']);
			unset($tree_data['group']);
			unset($tree_data['public']);
			//管理员，优化编辑器树目录
			if($GLOBALS['is_root']==1){
				$list_web  = $this->path(_DIR(WEB_ROOT),$check_file,true);
				$web = array_merge($list_web['folderlist'],$list_web['filelist']);
				$tree_data['webroot'] = array(
					'name'      => "webroot",
					'menuType'  => "menuTreeRoot",
					'ext' 		=> "folder",
					'children'  => $web,

					'path' 		=> WEB_ROOT,
					'type'      => 'folder',
					'open'      => true,
					'isParent'  => true
				);
			}
		}

		$result = array();
		foreach ($tree_data as $key => $value) { //为空则不展示
			if( count($value['children'])<1 && 
				in_array($key,array('my_group','group')) ){//'fav'
				continue;
				//$value['isParent'] = false;
			}
			$result[] = $value;
		}
		show_json($result);
	}

	//session记录用户可以管理的组织；继承关系
	private function _group_tree($node_id){//获取组织架构的用户和子组织；为空则获取根目录
		$group_sql = system_group::load_data();
		$groups = $group_sql->get(array('parent_id',$node_id));
		$group_list = $this->_make_node_list($groups);

		//user
		$user_list = array();
		if($node_id !='1'){//根组不显示用户
			$user = system_member::get_user_at_group($node_id);
			foreach($user as $key => $val){
				$tree_icon = 'user';
				if ($val['user_id'] == $this->user['uid']) {
					$tree_icon = 'userSelf';
				}
				$user_list[] = array(
					'name'      => $val['name'],
					'menuType'  => "menuTreeUser",
					'ext' 		=> $tree_icon,

					'path' 		=> KOD_USER_SHARE.':'.$val['user_id'].'/',
					'type'      => 'folder',
					'open'      => false,
					'isParent'  => false
				);
			}
		}
		$arr = array_merge($group_list,$user_list);
		return $arr;
	}
	//session记录用户可以管理的组织；继承关系
	private function _group_self(){//获取组织架构的用户和子组织；为空则获取根目录
		$groups = array();
		foreach ($this->user['group_info'] as $group_id=>$val){
			if($group_id=='1') continue;
			$item = system_group::get_info($group_id);
			if($item){
				$groups[] = $item;
			}
		}
		return $this->_make_node_list($groups);
	}
	private function _make_node_list($list){
		$group_list = array();
		if(!is_array($list)){
			return $group_list;
		}
		foreach($list as $key => $val){
			$group_path = KOD_GROUP_PATH;
			$auth = system_member::user_auth_group($val['group_id']);
			if($auth==false){//是否为该组内部成员
				$group_path = KOD_GROUP_SHARE;
				$tree_icon = 'groupGuest';
			}else if($auth=='read'){
				$tree_icon = 'groupSelf';
			}else{
				$tree_icon = 'groupSelfOwner';
			}
			$has_children = true;
			$user_list = system_member::get_user_at_group($val['group_id']);

			if(count($user_list)==0 && $val['children']==''){
				$has_children = false;
			}
			$group_list[] = array(
				'name'      => $val['name'],
				'type'      => 'folder',
				'path' 		=> $group_path.':'.$val['group_id'].'/',
				'ext' 		=> $tree_icon,
				'tree_icon'	=> $tree_icon,//request

				'menuType'  => "menuTreeGroup",
				'isParent'  => $has_children
			);
		}
		return $group_list;
	}
	public function pathDelete(){
		$post = json_decode($_POST['data_arr'],TRUE);
		foreach ($post as $value) {
			$fileids[] = intval(rtrim($value['fileid'], '/'));
		}
		$res['errno'] = 0;

		if(empty($fileids) || !is_array($fileids)){
			$res['errno'] = 1;
			$res['errmsg'] = '删除失败';
			show_json($res['errmsg'],false);
		}

		foreach($fileids as $fileid){
			$file = $this->model('file')->getOneFile(array('fileid'=>$fileid,'uid'=>$this->user['uid'],'crid'=>$this->crid));
			if (empty($file)){
				$res['errno'] = 2;
				$res['errmsg'] = '文件不存在';
				show_json($res['errmsg'],false);
			}
			if ($file['isdir'] == 1){
				$childfilecount = $this->model('file')->getFileCount(array('upid'=>$fileid,'uid'=>$this->user['uid'],'crid'=>$this->crid));
				if ($childfilecount > 0){
					$res['errno'] = 3;
					$res['errmsg'] = '文件夹不为空，请先删除文件夹下的内容';
					show_json($res['errmsg'],false);
				}
			}
		}

		$param['fileids'] = $fileids;
		$param['uid'] = $this->user['uid'];
		$param['crid'] = $this->crid;
		$result = $this->model('file')->delFile($param);
		if (empty($result)){
			$res['errno'] = 4;
			$res['errmsg'] = '删除失败';
			echo json_encode($res);
			exit;
		}

		$state = $res['errno']==0?true:false;
		$info = $success.' success,'.$error.' error';
		if ($error==0) {

			$info = $this->L['remove_success'];
		}
		show_json($info,$state);
	}

	private function clearTemp(){
		$path = iconv_system(USER_TEMP);
		$time = @filemtime($path);
		if(time() - $time > 600){//10min without updload
			del_dir($path);
			mk_dir($path);
		}
	}

	public function pathDeleteRecycle(){
		$user_recycle = iconv_system(USER_RECYCLE);
		if(!isset($this->in['list'])){
			if (!del_dir($user_recycle)) {
				show_json($this->L['remove_fali'],false);
			}else{
				mkdir($user_recycle);
				$this->clearTemp();
				space_size_use_reset();//使用空间重置
				show_json($this->L['recycle_clear_success'],true);
			}
		}
		$list = json_decode($this->in['list'],true);
		$success = 0;$error   = 0;
		foreach ($list as $val) {
			$path_full = _DIR($val['path']);
			if ($val['type'] == 'folder') {
				if(del_dir($path_full)) $success ++;
				else $error++;
			}else{
				if(del_file($path_full)) $success++;
				else $error++;
			}
		}
		space_size_use_reset();//使用空间重置
		if (count($list) == 1) {
			if ($success) show_json($this->L['remove_success']);
			else show_json($this->L['remove_fali'],false);
		}else{
			$code = $error==0?true:false;
			show_json($this->L['remove_success'].$success.'success,'.$error.'error',$code);
		}
	}

	/**
	 * change by ebh tyt
	 */
	public function pathCopy(){
		$postArr = $this->input->post('data_arr');
		$the_list = json_decode($postArr,true);
		$this->input->setcookie('path_copy',json_encode($the_list),time()+3600);
		$this->input->setcookie('path_copy_type','copy',time()+3600);
		show_json($this->L['copy_success'],ture,$this->input->cookie());
	}

	/**ebh
	 *检测当前用户空间大小，如果新上传后会超出容量限制，则不允许上传
	 */
	private function _checkUserSize($uid,$crid,$size = NULL) {
		if(!isset($size)) {
			$size = $_FILES['file']['size'];
		}
		$allowsize = 1073741824;    //每个用户只允许1G的容量
		$uinfomodel = $this->model('Userinfo');
		$usersize = $uinfomodel->getSize(array('uid'=>$uid,'crid'=>$crid)); //用户已使用容量
		if(($size + $usersize) > $allowsize) {
			show_json('空间已用完',false);
			//$arr = array('status'=>0,'msg'=>'空间已用完');
			//echo json_encode($arr);
			//exit();
		}
		return true;
	}

	/**
	 * ebh 移动,拷贝文件
	 * @author tyt | e-mail:876511857@qq.com
	 * @param int $file ,int $newupid
	 */
	public function move($fileid,$newupid,$isCopy=FALSE){
		$param['fileid'] = $fileid;//$this->input->post('fileid');
		$param['upid'] = $newupid;//$this->input->post('newupid');
		$param['crid'] = $this->crid;
		$res['errno'] = 0;
		$res['errmsg'] = '操作成功';

		if(empty($param['fileid'])){
			$res['errno'] = 1;
			$res['errmsg'] = '移动失败';
			echo json_encode($res);
			exit;
		}

		$file = $this->model('file')->getOneFile($param);
		if (empty($file)){
			$res['errno'] = 2;
			$res['errmsg'] = '文件不存在';
			echo json_encode($res);
			exit;
		}
        $param['uid'] = $this->user['uid'];
		//获取新路径
		$up_path = $this->_getfilepath($param['upid']);//获取父路径
		if ($up_path === FALSE){
			$res['errno'] = 3;
			$res['errmsg'] = '目录错误';
			echo json_encode($res);
			exit;
		}
		
		$param['isdir'] = $file['isdir'];
		if ($isCopy) {
			$this->_checkUserSize($this->user['uid'],$this->roominfo['crid'],$file['size']);
			$param['sid'] = $file['sid'];
			$param['size'] = $file['size'];
			$param['suffix'] = $file['suffix'];
			$param['title'] = $file['title'];
			$param['status'] = $file['status'];
			unset($param['fileid']);
			$newtitle = $file['title'];
			if ($param['isdir']) {
				$origTitle = $file['title'];
			} else {
				$file['suffix'] = '.'.$file['suffix'];
				$origTitle = rtrim($file['title'],'.'.$file['suffix']);
			}
			$newtitlenum = 1;
			while($this->model('file')->isFileExists($newupid, $newtitle, $this->user['uid'], $this->crid)){
				$newtitle = $origTitle.'('.$newtitlenum.')'. $file['suffix'];
				$newtitlenum++;
			}
			$param['title'] = $newtitle;
			if ($file['isdir'] == 1){//文件夹后面加斜杠
				$param['path'] = $up_path . $newtitle.'/';
			} else {
				$param['path'] = $up_path;
			}
			$result = $this->model('file')->insert($param);
			return $file['size'];
		} else {
			if ($file['isdir'] == 1){//文件夹后面加斜杠
				$param['path'] = $up_path . $file['title'].'/';
			} else {
				$param['path'] = $up_path;
			}
			$result = $this->model('file')->moveFile($param);
		}
		if ($result === FALSE){
			$res['errno'] = 4;
			$res['errmsg'] = '移动失败';
			echo json_encode($res);
			exit;
		}
		//echo json_encode($res);
	}

	/**
	 * ebh
	 */
	public function pathCute(){
		$the_list = json_decode($_POST['data_arr'],true);
		foreach ($the_list as $key => &$value) {
			$value['path'] = rtrim($value['fileid'],'/');
		}
		$this->input->setcookie('path_copy',json_encode($the_list),time()+3600);
		$this->input->setcookie('path_copy_type','cute',time()+3600);
		//setcookie('path_copy',json_encode($the_list), time()+3600);
		//setcookie('path_copy_type','cute',time()+3600);
		show_json($this->L['cute_success']);
	}

	/**
	 * ebh
	 */
	public function pathCuteDrag(){
		$clipboard = json_decode($this->input->post('data_arr'),true);
		if (empty($clipboard)) {
            show_json('操作失败');
        }
        if (strpos($this->path, KOD_GROUP_SHARE) === 0) {
		    $pathInfo = explode(':', trim($this->path, '/'));
		    if (count($pathInfo) < 2) {
		        show_json($this->L['error'], false);
            }
            $fileidArr = array_column($clipboard, 'fileid');
		    $ret = $this->model('Share')->batchMove($fileidArr, $pathInfo[1], $this->user['uid'], $this->crid);
		    if (empty($ret)) {
                show_json($this->L['error'], false);
            }
            show_json($pathInfo[1], true);
        }
		if ($this->input->post('fileid')) {
			$path_past = $newupid = intval($this->input->post('fileid'));
		} else {
			$path = substr($this->path, 0,-1);
			$fileid = $this->_getfileid($path);
			$path_past = $newupid = $fileid;
		}
		
		//$before_path_type = $GLOBALS['path_type'];
		//$before_path_id = $GLOBALS['path_id'];
		//if (!path_writeable($this->path)) show_json($this->L['no_permission_write'],false);
		$success=0;$error=0;$data = array();
		foreach ($clipboard as $value) {
			$this->move($value['fileid'],$newupid);
		}
		//foreach ($clipboard as $val) {

			//$path_copy = _DIR($val['path']);
			//$filename  = get_path_this($path_copy);
			//$auto_path = get_filename_auto($path_past.$filename,'',$this->config['user']['file_repeat']);//已存在处理 创建副本

			//跨空间检测
			/*if($before_path_id != $GLOBALS['path_id']){
				space_size_use_check();
			}
			if (move_path($path_copy,$auto_path,'',$this->config['user']['file_repeat'])) {
				$success++;
				//跨空间操作  用户——组——其他组 任意两者见处理；移动到此处；之前的空间使用量减少，目前的增加
				if($before_path_id != $GLOBALS['path_id']){
					space_size_use_change($auto_path);
					space_size_use_change($auto_path,false,$before_path_type,$before_path_id);
				}
				$data[] = _DIR_OUT(iconv_app($auto_path));
			}else{
				$error++;
			}*/
		//}
		$state = $error==0?true:false;
		$msg = $success.' success,'.$error.' error';
		if($error == 0){
			$msg = $this->L['success'];
		}
		show_json($msg,$state,$data);
	}

	/**
	 * edit by ebh tyt
	 */
	public function pathCopyDrag(){
		$clipboard = json_decode($this->input->post('data_arr'),true);
		if (empty($clipboard))
			show_json('操作失败');
		if ($this->input->post('fileid')) {
			$path_past = $newupid = intval($this->input->post('fileid'));
		} else {
			$path = substr($this->path, 0,-1);
			$fileid = $this->_getfileid($path);
			$path_past = $newupid = $fileid;
		}
		//$before_path_type = $GLOBALS['path_type'];
		//$before_path_id = $GLOBALS['path_id'];
		//if (!path_writeable($this->path)) show_json($this->L['no_permission_write'],false);
		$success=0;$error=0;$data = array();
		$isCopy = TRUE;
		if (!empty($clipboard)) {
			$size = 0;
			foreach ($clipboard as $value) {
				$size += $this->move($value['fileid'],$newupid,$isCopy);
			}
			//更新用户容量信息
			if ($size) {
				$setParam['uid'] = $this->user['uid'];
				$setParam['crid'] = $this->roominfo['crid'];
				$setParam['filesize'] = $size;
				$this->model('file')->upDateUserInfo($setParam);
			}
		}
		/*$clipboard = json_decode($this->in['list'],true);
		$path_past=$this->path;
		$before_path_type = $GLOBALS['path_type'];
		$before_path_id = $GLOBALS['path_id'];
		space_size_use_check();*/
		
		/*if (!path_writeable($this->path)) show_json($this->L['no_permission_write'],false);
		$success=0;$error=0;$data = array();
		foreach ($clipboard as $val) {
			$path_copy = _DIR($val['path']);
			$filename = get_path_this($path_copy);
			$auto_path = get_filename_auto($path_past.$filename,'',$this->config['user']['file_repeat']);

			if ($this->in['filename_auto']==1 &&
				trim($auto_path,'/') == trim($path_copy,'/')) {
				$auto_path = get_filename_auto($path_past.$filename,'','folder_rename');				
			}
			if(copy_dir($path_copy,$auto_path)){
				$success++;
				space_size_use_change($filename);//空间使用增加
				$data[] = _DIR_OUT(iconv_app($auto_path));
			}else{
				$error++;
			}
		}*/
		$state = $error==0?true:false;
		$msg = $success.' success,'.$error.' error';
		if($error == 0){
			$msg = $this->L['success'];
		}
		show_json($msg,$state,$data);
	}

	public function clipboard(){
		$clipboard = json_decode($_COOKIE['path_copy'],true);
		if(!$clipboard){
			$clipboard = array();
		}
		show_json($clipboard,true,$_COOKIE['path_copy_type']);
	}
	public function pathPast(){
		$path_copy = $this->input->cookie('path_copy');
		if (!$path_copy){
			show_json($this->L['clipboard_null'],false,array());
		}
		$path_past = $this->path;//之前就自动处理权限判断；
		$error = '';
		//print_r(json_decode($_COOKIE['path_copy'],true));exit;
		if (isset($_GET['upid'])) {
			$newupid = intval($_GET['upid']);
		} else {
			$newupid = $this->_getfileid($this->path);
		}
		//$newupid = substr($this->path, 0,-1);
		//print_r($newupid);exit;
		$data = array();
		$clipboard = json_decode($path_copy,true);
		$copy_type = $this->input->cookie('path_copy_type');
		//$before_path_type = $GLOBALS['path_type'];
		//$before_path_id = $GLOBALS['path_id'];
		//if (!path_writeable($path_past)) show_json($this->L['no_permission_write'],false,$data);
		if ($copy_type == 'copy') {
			$size = 0;
			$isCopy = TRUE;
			if (!empty($clipboard)) {
				foreach ($clipboard as $value) {
					$size += $this->move($value['fileid'],$newupid,$isCopy);
				}
				//更新用户容量信息
				if ($size) {
					$setParam['uid'] = $this->user['uid'];
					$setParam['crid'] = $this->roominfo['crid'];
					$setParam['filesize'] = $size;
					$this->model('file')->upDateUserInfo($setParam);
				}
			} else {
				show_json($this->L['clipboard_null'],false,$data);
			}
		}else{
			$cookietime = -365 * 66400;
			$this->input->setcookie('path_copy','',$cookietime);
			$this->input->setcookie('path_copy_type','',$cookietime);
			if (!empty($clipboard)) {
				foreach ($clipboard as $value) {
					$this->move($value['fileid'],$newupid);
				}
			} else {
				show_json($this->L['clipboard_null'],false,$data);
			}
		}

		$GLOBALS['path_from_auth_check'] = true;//粘贴来源检测权限；和粘贴到目标位置冲突
		$list_num = count($clipboard);
		if ($list_num == 0) {
			show_json($this->L['clipboard_null'],false,$data);
		}
		for ($i=0; $i < $list_num; $i++) {
			$path_copy = _DIR($clipboard[$i]['path']);
			_DIR($this->in['path']);//重置path_type等数据
			$filename  = get_path_this($path_copy);
			$filename_out  = iconv_app($filename);
			/*if (!file_exists($path_copy)){
				$error .= "<li>{$filename_out}".$this->L['copy_not_exists']."</li>";
				continue;
			}*/
			if ($clipboard[$i]['type'] == 'folder'){
				if ($path_copy == substr($path_past,0,strlen($path_copy))){
					$error .="<em style='color:#fff;'>{$filename_out}".$this->L['current_has_parent']."</em>";
					continue;
				}
			}
			$auto_path = get_filename_auto($path_past.$filename,'',$this->config['user']['file_repeat']);
			$filename = get_path_this($auto_path);
			/*if ($copy_type == 'copy') {
				space_size_use_check();
				copy_dir($path_copy,$auto_path);
				space_size_use_change($filename);
			}else{
				if($before_path_id != $GLOBALS['path_id']){
					space_size_use_check();
				}
				move_path($path_copy,$auto_path,'',$this->config['user']['file_repeat']);
				//跨空间操作  用户——组——其他组 任意两者见处理；移动到此处；之前的空间使用量减少，目前的增加
				if($before_path_id != $GLOBALS['path_id']){
					space_size_use_change($filename);
					space_size_use_change($filename,false,$before_path_type,$before_path_id);
				}
			}*/
			$data[] = _DIR_OUT(iconv_app($auto_path));
		}
		if ($copy_type == 'copy') {
			$msg=$this->L['past_success'];
		}else{
			$msg=$this->L['cute_past_success'];
		}
		$state = ($error ==''?true:false);
		show_json($msg,$state,$data);
	}
	public function fileDownload(){
		$fileid = intval($this->input->get('fileid'));
		if (empty($fileid)) {
			$fileid = $this->_getFileByFilePath($this->input->get('path'));
			if (!$fileid)
		    	exit();
        }
        $isMine = $this->model('File')->checkMine($fileid, $this->user['uid'], $this->crid);
		if ($isMine) {
            $url = 'http://uppan.ebh.net/att.html?id='.$fileid;
        } else {
            $url = 'http://uppan.ebh.net/att.html?fshid='.$fileid;
        }
		header("Location: $url");
		//file_put_out($this->path,true);
	}
	//文件下载后删除,用于文件夹下载
	public function fileDownloadRemove(){
		$path = rawurldecode(_DIR_CLEAR($this->in['path']));
		$path = iconv_system(USER_TEMP.$path);
		space_size_use_change($path,false);//使用空间回收
		file_put_out($path,true);
		del_file($path);
	}
	public function zipDownload(){
		$user_temp = iconv_system(USER_TEMP);
		if(!file_exists($user_temp)){
			mkdir($user_temp);
		}else{//清除未删除的临时文件，一天前
			$list = path_list($user_temp,true,false);
			$max_time = 3600*24;//自动清空一天前的缓存
			if ($list['filelist']>=1) {
				for ($i=0; $i < count($list['filelist']); $i++) {
					$create_time = $list['filelist'][$i]['mtime'];//最后修改时间
					if(time() - $create_time >$max_time){
						del_file($list['filelist'][$i]['path'].$list['filelist'][$i]['name']);
					}
				}
			}
		}
		$zip_file = $this->zip($user_temp);
		show_json($this->L['zip_success'],true,get_path_this($zip_file));
	}
	public function zip($zip_path=''){
		load_class('pclzip');
		ignore_timeout();

		$zip_list = json_decode($this->in['list'],true);
		$list_num = count($zip_list);
		$files = array();
		for ($i=0; $i < $list_num; $i++) {
			$item = rtrim(_DIR($zip_list[$i]['path']),'/');//处理成系统 文件编码
			if(file_exists($item)){
				$files[] = $item;
			}
		}
		if(count($files)==0){
			show_json($this->L['not_exists'],false);
		}

		//指定目录
		$basic_path = $zip_path;
		if ($zip_path==''){
			$basic_path =get_path_father($files[0]);
		}
		if (!path_writeable($basic_path)) {
			show_json($this->L['no_permission_write'],false);
		}

		if (count($files) == 1){
			$path_this_name=get_path_this($files[0]);
		}else{
			$path_this_name=get_path_this(get_path_father($files[0]));
		}
		$zipname = $basic_path.$path_this_name.'.zip';
		$zipname = get_filename_auto($zipname,'',$this->config['user']['file_repeat']);
		space_size_use_check();
		

		$archive = new PclZip($zipname);
		foreach ($files as $key =>$val) {
			$remove_path_pre = _DIR_CLEAR(get_path_father($val));
			if($key ==0){
				$v_list = $archive->create($val,
					PCLZIP_OPT_REMOVE_PATH,$remove_path_pre,
					PCLZIP_CB_PRE_FILE_NAME,'zip_pre_name'
				);
				continue;
			}
			$v_list = $archive->add($val,
				PCLZIP_OPT_REMOVE_PATH,$remove_path_pre,
				PCLZIP_CB_PRE_FILE_NAME,'zip_pre_name'
			);
		}
		space_size_use_change($zipname);//使用的空间增加
		if ($v_list == 0) {
			show_json("Create error!",false);
		}
		$info = $this->L['zip_success'].$this->L['size'].":".size_format(filesize($zipname));
		if ($zip_path=='') {
			show_json($info,true,_DIR_OUT(iconv_app($zipname)) );
		}else{
			return iconv_app($zipname);
		}
	}
	public function unzip(){
		load_class('pclzip');
		ignore_timeout();

		$path=$this->path;
		$name = get_path_this($path);
		$name = substr($name,0,strrpos($name,'.'));
		$ext  = get_path_ext($path);
		$unzip_to=get_path_father($path).$name;//解压在该文件夹内：
		if(isset($this->in['to_this'])){//直接解压
			$unzip_to=get_path_father($path);
		}

		//$unzip_to=get_path_father($path);//解压到当前
		if (isset($this->in['path_to'])) {//解压到指定位置
			$unzip_to = _DIR($this->in['path_to']);
		}
		//所在目录不可写
		if (!path_writeable(get_path_father($path))){
			show_json($this->L['no_permission_write'],false);
		}
		space_size_use_check();
		$zip = new PclZip($path);
		unzip_charset_get($zip->listContent());
		$result = $zip->extract(PCLZIP_OPT_PATH,$unzip_to,
								PCLZIP_OPT_SET_CHMOD,DEFAULT_PERRMISSIONS,
								PCLZIP_CB_PRE_FILE_NAME,'unzip_pre_name',
								PCLZIP_CB_PRE_EXTRACT,"check_ext_unzip",
								PCLZIP_OPT_REPLACE_NEWER);//解压到某个地方,覆盖方式
		if ($result == 0) {
			show_json("Error : ".$zip->errorInfo(true),fasle);
		}else{
			space_size_use_change($path);//使用的空间增加 近似使用压缩文件大小；
			show_json($this->L['unzip_success']);
		}
	}

	public function imageRotate(){
		load_class('imageThumb');
		$fileid = $this->_getFileByFilePath($this->input->get('path'));
		if (empty($fileid)) {
		    return;
        }
		$filemodel = $this->model('file');
		$file = $filemodel->getFileByFileid($fileid);
		/*$check = $this->checkFile($this->user,$fileid,$file);
		if (!$check)
			return;*/
		$sid = $file['sid'];
        $sourcemodel = $this->model('Source');
        $source = $sourcemodel->getFileBySid($sid);
        $_UP = Ebh::app()->getConfig()->load('upconfig');
        $savepath = $_UP['pan']['savepath'];
		$this->path = $savepath.$source['filepath'];
		$cm=new imageThumb($this->path,'file');
		//print_r($cm);exit;
		$result = $cm->imgRotate($this->path,intval($this->in['rotate']));
		if($result){
			show_json($this->L['success']);
		}else{
			show_json($this->L['error'],false);
		}
	}

	//缩略图
	public function image(){
		$fileid = intval($this->input->get('fileid'));
		$filemodel = $this->model('File');
		$file = $filemodel->getFileByFileid($fileid);
    	/*$check = $this->checkFile($this->user,$fileid,$file);
    	if ($check)*/
        	return $this->_doThumb($file);
		
	}

	 private function _doThumb($file,$fsize='80_80') {
        $sid = $file['sid'];
        $sourcemodel = $this->model('Source');
        $size = $fsize;
        $source = $sourcemodel->getFileBySid($sid);
        $allowsize = array('80_80','30_30','100_100'); //允许的缩略图尺寸
        $imgarr = array('jpg','jpeg','gif','bmp','png');
        $isimage = in_array($source['filesuffix'],$imgarr) ? TRUE : FALSE;
        if(!empty($source) && ($isimage || !empty($source['thumb']))) {
            $filepath = $isimage ? $source['filepath'] : $source['thumb'];
            $title = $isimage ? $file['title'] : $file['title'].'.jpg';
            if(!empty($size) && in_array($size, $allowsize)) {
                Ebh::app()->helper('ebhimage');
                $_UP = Ebh::app()->getConfig()->load('upconfig');
                //print_r($_UP);exit;
                $savepath = $_UP['pan']['savepath'];
                $filename = explode('.', $filepath);
                $thumbpath = $filename[0] . '_' . $size . '.' . $filename[1];
                $imagepath = $savepath.$filepath;
                $realpath = $savepath.$thumbpath;
                //print_r($realpath);exit;
                if(!file_exists($realpath)) {
                    $realpath = thumb($imagepath, $size, $quality = 75) ;
                }
               /* if(!empty($realpath)){
                	$thumbfilepath = substr($realpath,strlen($savepath));
                	getfile('pan',$thumbfilepath,$title,TRUE);
                } else {*/
                	getfile('pan',$filepath,$title,TRUE);
               // }
            } else {
                getfile('pan',$filepath,$title,TRUE);
            }
        }
    }

	// 远程下载
	public function serverDownload() {
		$uuid = 'download_'.$this->in['uuid'];
		if ($this->in['type'] == 'percent') {//获取下载进度
			if (isset($_SESSION[$uuid])){
				$info = $_SESSION[$uuid];
				$result = array(
					'support_range' => $info['support_range'],
					'uuid'      => $this->in['uuid'],
					'length'    => (int)$info['length'],
					'name'		=> $info['name'],
					'size'      => (int)@filesize(iconv_system($info['path'])),
					'time'      => mtime()
				);
				show_json($result);
			}else{
				show_json('uuid_not_set',false);
			}
		}else if($this->in['type'] == 'remove'){//取消下载;文件被删掉则自动停止
			$the_file = str_replace('.downloading','',$_SESSION[$uuid]['path']);
			del_file($the_file.'.downloading');
			del_file($the_file.'.download.cfg');
			unset($_SESSION[$uuid]);
			show_json('remove_success',false);
		}
		//下载
		$save_path = _DIR($this->in['save_path']);
		if (!path_writeable($save_path)){
		   show_json($this->L['no_permission_write'],false);
		}
		$url = rawurldecode($this->in['url']);
		$header = url_header($url);
		if (!$header){
			show_json($this->L['download_error_exists'],false);
		}
		$save_path = $save_path.$header['name'];
		if (!checkExt($save_path)){//不允许的扩展名
			$save_path = _DIR($this->in['save_path']).date('-h:i:s').'.dat';
		}
		space_size_use_check();
		$save_path = get_filename_auto(iconv_system($save_path),'',$this->config['user']['file_repeat']);
		$save_path_temp = $save_path.'.downloading';
		session_start();
		$_SESSION[$uuid] = array(
			'support_range' => $header['support_range'],
			'length'=> $header['length'],
			'path'	=> $save_path_temp,
			'name'	=> get_path_this($save_path)
		);
		session_write_close();

		load_class("downloader");
		$result = downloader::start($url,$save_path);
		session_start();unset($_SESSION[$uuid]);session_write_close();
		if($result['code']){
			$name = get_path_this(iconv_app($save_path));
			space_size_use_change($save_path);//使用的空间增加
			show_json($this->L['download_success'],true,_DIR_OUT(iconv_app($save_path)) );
		}else{
			show_json($result['data'],false);
		}
	}

	/**
	 * by ebh tyt ,/1/2/ss.doc 根据文件的路径获取文件id
	 * return int 
	 */
	public function _getFileByFilePath($path) {
	    $fileid = intval($this->input->get('fileid'));
	    if ($fileid > 0) {
	        return $fileid;
        }
		if (empty($path)) {
			return 0;
		}
		//预留可能共享输出文件会用到
		$postUid = intval($this->input->get('this_uid'));
		$param['uid'] = $postUid ? $postUid : $this->user['uid'];

        //请求可能来自共享目录，禁止用户ID过滤
        //$param['uid'] = $this->user['uid'];
		$param['crid'] = $this->crid;
		$param['title'] = substr($path, strrpos($path, '/')+1);
		$param['path'] = substr($path, 0,strrpos($path, '/')+1);
		$model = $this->model('file');
		$file = $model->getOneFile($param);
		
		if (empty($file)) {//主要为了兼容老的版本移动过后，文件的路径变成了，/aaa/asd/111.txt等形式
			$param['path'] = $path;
			unset($param['title']);
			$file = $model->getOneFile($param);
		}

		if (!empty($file)) {
            if ($file['uid'] == $this->user['uid'] || !empty($file['isshare'])) {
                return $file['fileid'];
            }
            $upid = $file['upid'];
            while ($upid > 0) {
                $parent = $model->getOneFile(array(
                    'fileid' => $upid,
                    'crid' => $file['crid']
                ));
                if (empty($parent)) {
                    return 0;
                }
                if (!empty($parent['isshare'])) {
                    return $file['fileid'];
                }
                $upid = $parent['upid'];
            }
        }
		return 0;

	}

	/**
	 * 获取网盘空间大小
	 */
	public function getsize(){
		$param['uid'] = $this->user['uid'];
		$param['crid'] = $this->crid;
		$res['errno'] = 0;
		$res['errmsg'] = '操作成功';
		$res['totalsize'] = 1073741824;
		$res['usedsize'] = $this->model('userinfo')->getSize($param);
		$user_pan_info = $this->model('userinfo')->getOnePanUserinfo($param);
		if (!empty($user_pan_info['defaultpansize'])) {
			$res['totalsize'] = $user_pan_info['defaultpansize'];
		}
		$res['usedsize'] = $res['usedsize'] > 0 ? $res['usedsize'] : 0;
		$res['usedsize'] = $res['usedsize'] > $res['totalsize'] ? $res['totalsize'] : $res['usedsize'];

		Ebh::app()->helper('ebhpan');
		$res['sizestr'] = format_bytes($res['usedsize']) . '/' . format_bytes($res['totalsize']);
		echo json_encode($res);
	}

	/**
	 *代理输出文件
	 */
	public function fileProxyA() {
		//代理输出
		if (empty($this->path)) {
			return false;
		}
		//$this->path = '/data0/pan/docs/2017/09/14/15053531368752.pptx';
		$this->getfile('pan','','',false,$this->path);
		//$download = 1;
		//file_put_out($this->path,$download);
	}

	//生成临时文件key
	public function officeView(){
		/*if (!file_exists($this->path)) {
			show_tips($this->L['not_exists']);
		}
		$file_ext = get_path_ext($this->path);
		$file_url = _make_file_proxy($this->path);*/

		//kodoffice  预览
		if(defined("OFFICE_KOD_SERVER")){
			$fileid = $this->_getFileByFilePath($this->input->get('path'));
			if (empty($fileid)) {
			    return;
            }
			$filemodel = $this->model('file');
			$file = $filemodel->getFileByFileid($fileid);
			/*$check = $this->checkFile($this->user,$fileid,$file);
    		if (!$check)
    			return;*/
			$sid = $file['sid'];
	        $sourcemodel = $this->model('Source');
	        $source = $sourcemodel->getFileBySid($sid);
	        $_UP = Ebh::app()->getConfig()->load('upconfig');
            $savepath = $_UP['pan']['savepath'];
			$this->in['path'] = $savepath.$source['filepath'];
			$file_link = APPHOST.'index.php?explorer/fileProxyA&path='.rawurlencode($this->in['path']).'&jsondata='.rawurlencode(authcode(json_encode($this->user),'encode')).'&crid='.rawurlencode(authcode($this->crid,'encode'));
			/*$fileid = intval($this->input->get('fileid'));
			if (!$fileid) {
				$fileid = $this->_getFileByFilePath($this->path);
			}
			$file_link = 'http://uppan.ebh.net/att.html?id='.$fileid;*/
			$view_type = '&appMode=edit&access_token='.session_id();
			if(OFFICE_KOD_ACTION == 'read'){//只读
				$view_type = '&appMode=view';
				//$file_link = _make_file_proxy($this->path);
			}
			$user_info = $this->user;//$_SESSION['kod_user'];
			$app_r = rand_string(10);
			$office_url = OFFICE_KOD_SERVER.rawurlencode($file_link)
						.'&lang='.LANGUAGE_TYPE.'&appType=desktop'.$view_type
						.'&file_time='.time().'&key='.md5($this->path)
						.'&user_id='.'1'.'&user_name='.'admin'
						.'&app_id='.OFFICE_KOD_APP_ID.'&app_s='.$app_r.'&app_v='.md5($app_r.OFFICE_KOD_APP_KEY);

			header("location:".$office_url);
			exit;
		}

		//插件支持：flash转换 or 在线编辑
		if (file_exists(PLUGIN_DIR.'officeView')) {
			if(isset($_GET['is_edit']) || !isset($this->config['settings']['office_server_doc2pdf'])){
				include(PLUGIN_DIR.'officeView/index.php');
			}else{
				include(PLUGIN_DIR.'officeView/flexpapper.php');
			}
			exit;
		}

		//office live 浏览
		$host = $_SERVER['HTTP_HOST'];
		if (strpos(OFFICE_SERVER,'view.officeapps.live.com') === -1 ||
			strstr($host,'10.10.') ||
			strstr($host,'192.168.')||
			strstr($host,'127.0.') ||
			!strstr($host,'.')) {
			$local_tips = $this->L['unknow_file_office'];
			show_tips($local_tips);
		}else{
			$office_url = OFFICE_SERVER.rawurlencode($file_url);
			header("location:".$office_url);
		}
	}
	public function officeSave(){
		$save_path = _DIR($this->in['path']);
		//from activex
		if(isset($this->in['from_activex'])){
			if ($_FILES["file"]["error"] > 0){
				echo "Return Code: ".$_FILES["file"]["error"];
			}else{
				move_uploaded_file($_FILES["file"]["tmp_name"],$this->path);
				echo 'succeed';
			}
			exit;
		}

		if (!path_writeable($save_path)){
		   $this->json_putout(array('error'=>'no_permission_write'));
		}
		if (($body_stream = file_get_contents('php://input'))===FALSE){
			$this->json_putout(array('error'=>'Bad Request'));
		}
		$data = json_decode($body_stream,true);
		if ($data === NULL){
			$this->json_putout(array('error'=>'Bad Response'));
		}
		$_trackerStatus = array(
			0 => 'NotFound',
			1 => 'Editing',
			2 => 'MustSave',
			3 => 'Corrupted',
			4 => 'Closed'
		);
		$result = array('error'=>0,'action'=>$_trackerStatus[$data["status"]]);
		switch ($_trackerStatus[$data["status"]]){
			case "MustSave":
			case "Corrupted":
				$result["c"] = "saved";
				$result['status'] = '0';
				if (file_download_this($data["url"],$save_path)){
					$result['status'] = 'success';
				}
				break;
			default:break;
		}
		$this->json_putout($result);
	}
	private function json_putout($info){
		@header( 'Content-Type: application/json; charset==utf-8');
		@header( 'X-Robots-Tag: noindex' );
		@header( 'X-Content-Type-Options: nosniff' );
		write_log(json_encode(array($this->in,$info)),'office_save');
		
		echo json_encode($info);
		exit;
	}

	//代理输出
	public function fileProxy(){
		$fileid = $this->input->get('fileid');

		if (!empty($fileid)) {
			$fileid = intval($fileid);
		} else {
			$fileid = $this->_getFileByFilePath($this->input->get('path'));
		}
		if (empty($fileid)) {
		    return;
        }
		$filemodel = $this->model('file');
		$file = $filemodel->getFileByFileid($fileid);
    	$check = $this->checkFile($this->user,$fileid,$file);
    	//print_r($check);print_r($file);exit;
    	//if ($check)
        	return $this->_doOutputFile($file);
		/*$download = isset($this->in['download']);
		file_put_out($this->path,$download);*/
	}

	/*
	 *输出文件
	 */
	private function _doOutputFile($file) {
		$sid = $file['sid'];
        $sourcemodel = $this->model('Source');
        $source = $sourcemodel->getFileBySid($sid);
        $imgarr = array('jpg','jpeg','gif','bmp','png');
        $isimage = in_array($source['filesuffix'],$imgarr) ? TRUE : FALSE;
        if(!empty($source) && ($isimage || !empty($source['thumb']))) {
        	Ebh::app()->helper('ebhimage');
            $filepath = $source['filepath'];
            $title = $isimage ? $file['title'] : $file['title'].'.jpg';
            getfile('pan',$filepath,$title,TRUE);
        } else {
        	$title = $file['title'];
        	$filepath = $source['filepath'];
        	getfile('pan',$filepath,$title,TRUE);
        }
	}
	/**修改
	 *ebh auther tyt
	 * 上传,html5拖拽  flash 多文件
	 */
	public function fileUpload(){
		//这个上传接口暂时关闭
		return false;
		
		$save_path = _DIR($this->in['upload_to']);
		if (!path_writeable($save_path)) show_json($this->L['no_permission_write'],false);
		if ($save_path == '') show_json($this->L['upload_error_big'],false);

		if (strlen($this->in['fullPath']) > 1) {//folder drag upload
			$full_path = _DIR_CLEAR(rawurldecode($this->in['fullPath']));
			$full_path = get_path_father($full_path);
			$full_path = iconv_system($full_path);
			if (mk_dir($save_path.$full_path)) {
				$save_path = $save_path.$full_path;
			}
		}
		$repeat_action = $this->config['user']['file_repeat'];
		//分片上传
		$temp_dir = iconv_system(USER_TEMP);
		mk_dir($temp_dir);
		if (!path_writeable($temp_dir)) show_json($this->L['no_permission_write'],false);
		upload_chunk('file',$save_path,$temp_dir,$repeat_action);
	}

	//分享根目录
	private function path_share(&$list){
	    if ($this->_saveType == 1) {
            $list['path_read_write'] = 'readable';
            $shareModel = $this->model('Shareing');
            $shareList = array();
            $path_info = explode('/', $GLOBALS['path_type']);
            $pathDevel = count($path_info);
            if ($pathDevel > 1) {
                $fileModel = $this->model('File');
                $relativePathArr = array_slice($path_info, 1);
                $relativePath = implode('/', $relativePathArr);
                $pathId = $fileModel->getFileByPath('/'.$relativePath.'/', $this->user['uid']);
                if (empty($pathId)) {
                    show_json($this->L['error'], false);
                }
                $subFiles = $this->model('File')->getFileList(array(
                    'upid' => $pathId,
                    'crid' => $this->crid
                ));
                if (!empty($subFiles)) {
                    foreach ($subFiles as $subFile) {
                        $subShare = array();
                        $subShare['shareid'] = 0;
                        $subShare['fileid'] = $subFile['fileid'];
                        $subShare['title'] = $subFile['name'];
                        $subShare['fpath'] = $subFile['path'];
                        $subShare['isdir'] = $subFile['isdir'];
                        $subShare['suffix'] = $subFile['ext'];
                        $subShare['uid'] = $this->user['uid'];
                        $subShare['fuid'] = $this->user['uid'];
                        $subShare['size'] = $subFile['size'];
                        $subShare['mtime'] = $subFile['dateline'];
                        $shareList[] = $subShare;
                    }
                }
                unset($subFiles);
            } else {
                $shareList = $shareModel->getShareList(array(
                    'crid' => $this->crid,
                    'uid' => $this->user['uid'],
                    'limit' => pow(2, 16)
                ));
                //print_r($shareList);exit;
            }
            if (!empty($shareList)) {
                $aids = array_column($shareList, 'aid');
                $aids = array_filter($aids, function($aid) {
                    return $aid > 0;
                });
                $apps = array();
                if (!empty($aids)) {
                    $apps = $this->model('Webapp')->getPublicAppList($aids, $this->crid, true);
                }

                $uids = array_column($shareList, 'uid');
                $uids = array_unique($uids);
                $userinfos = $this->model('User')->getUserInfoByUid($uids, true);
                unset($uids);

                foreach ($shareList as $shareItem) {
                    $username = '';
                    if (isset($userinfos[$shareItem['uid']])) {
                        $username = isset($userinfos[$shareItem['uid']]['realname']) ? $userinfos[$shareItem['uid']]['realname'] : $userinfos[$shareItem['uid']]['username'];
                    }
                    $sid = 's'.(!empty($shareItem['shareid']) ? $shareItem['shareid'] : $shareItem['fileid']);

                    $path = $shareItem['fpath'];
                    if (empty($shareItem['isdir'])) {
                        $l = strrpos($path, '/');
                        $path = substr($path, 0, $l + 1).(!empty($shareItem['name']) ? $shareItem['name'] : $shareItem['title']);
                    } else {
                        $path = KOD_USER_SHARE.':null/'.ltrim($path, '/');
                    }
                    $list['share_list'][$sid] = array(
                        'mtime' => SYSTIME,
                        'sid' => $sid,
                        'type' => $shareItem['isdir'] ? 'folder' : 'file',
                        'path' => $path,
                        'name' => empty($shareItem['name']) ? $shareItem['title'] : $shareItem['name'],
                        'show_name' => $shareItem['title'],
                        'time_to' => $shareItem['deadline'] > 0 ? $shareItem['deadline'] : '',
                        'share_password' => '',
                        'code_read' => '',
                        'can_upload' => '',
                        'not_download' => '',
                        'uid' => $shareItem['uid'],
                        'username' => $username,
                        'sub' => $pathDevel > 1 ? 1 : 0
                    );
                    $item = array(
                        'name' => $shareItem['title'],
                        'path' => $path,
                        'fileid' => $shareItem['fileid'],
                        'shareid' => $shareItem['shareid'],
                        'sid' => $sid,
                        'size' => $shareItem['size'],
                        'upid' => $shareItem['upid'],
                        'menuType'  => 'menuSharePath',
                        'atime' => '',
                        'ctime' => '',
                        'mtime' => $shareItem['mtime'],
                        'mode' => '',
                        'is_readable' => 1,
                        'is_writable' => 1,
                        'uid' => $shareItem['uid'],
                        'username' => $username,
                        'this_uid' => $shareItem['fuid'],
                        'sub' => $pathDevel > 1 ? 1 : 0,
                        'num_view' => '',
                        'num_download' => ''
                    );
                    if ($pathDevel == 1) {
                        $item['exists'] = empty($shareItem['fpath']) ? 0 : 1;
                        $item['meta_info'] = 'path_self_share';
                        $l = strrpos($path, '/');
                        $item['real_path'] = substr($shareItem['fpath'], 0, $l + 1);
                    } else {
                        $item['exists'] = 1;
                    }
                    if(get_path_ext($shareItem['title']) == 'oexe'){
                        if (!isset($apps[$shareItem['aid']])) {
                            continue;
                        }
                        $item = array_merge($item, $apps[$shareItem['aid']]);
                        $item['exists'] = 1;
                    }
                    if ($item['exists'] == 0) {
                        //失效文件过滤
                        continue;
                    }
                    if ($shareItem['isdir']) {
                        $item['type'] = 'folder';
                        $list['folderlist'][] = $item;
                    } else {
                        $item['ext'] = get_path_ext($shareItem['title']);
                        $list['filelist'][] = $item;
                    }
                }
                unset($shareList);
            }
            $list['info'] = array(
                'path_type' => KOD_USER_SHARE,
                'role' => 'owner',
                'kpan_share' => true,
                'sub_share' => $pathDevel > 1
            );
	        return $list;
        }
		$arr = explode(',',$GLOBALS['path_id']);
		$share_list = system_member::user_share_list($arr[0]);
		$before_share_id = $GLOBALS['path_id_user_share'];
		foreach ($share_list as $key => $value) {
			$the_path = _DIR(KOD_USER_SHARE.':'.$arr[0].'/'.$value['name']);
			$value['path'] = $value['name'];
			$value['atime']='';$value['ctime']='';
			$value['mode']='';$value['is_readable'] = 1;$value['is_writable'] = 1;
			$value['exists'] = intval(file_exists($the_path));
			$value['meta_info'] = 'path_self_share';
			$value['menuType']  = "menuSharePath";

			//分享列表oexe
			if(get_path_ext($value['name']) == 'oexe'){
				$json = json_decode(@file_get_contents($the_path),true);
				if(is_array($json)) $value = array_merge($value,$json);
			}
			if ($value['type']=='folder') {
				$value['ext'] = 'folder';
				$list['folderlist'][] = $value;
			}else{
				$list['filelist'][] = $value;
			}
		}
		$list['path_read_write'] = 'readable';
		$GLOBALS['path_id_user_share'] = $before_share_id;
		if($arr[0] == $this->user['uid']){//自己分享列表
			$list['share_list'] = $share_list;
		}
		return $list;
	}

	//我的收藏根目录
	private function path_fav(&$list){
        if ($this->_saveType == 1) {
            $model = $this->model('Favorite');
            $data = $model->favoriteList($this->user['uid'], $this->crid, 'name');
            if (!empty($data)) {
                $uids = array_column($data, 'uid');
                $uids = array_unique($uids);
                $userinfos = $this->model('User')->getUserInfoByUid($uids, true);
                unset($uids);
                foreach ($data as $item) {
                    if ($item['isdir']) {
                        $pre = '';
                        if (preg_match('/\{group_share\}:\d+/', $item['path'], $m)) {
                            $pre = $m[0];
                        }
                        $path = $pre.$item['spath'];
                    } else {
                        $l = strrpos($item['spath'], '/');
                        $path = substr($item['spath'], 0, $l + 1).$item['title'];
                    }
                    $cell = array(
                        'favid' => $item['favid'],
                        'fileid' => $item['fileid'],
                        'sid' => $item['sid'],
                        'name'      => $item['name'],
                        'ext' 		=> $item['ext'],
                        'type'     => $item['ext'],
                        'menuType'  => "menuFavPath",
                        'size' => $item['size'],
                        'atime'		=> '',
                        'ctime'		=> '',
                        'mtime' => $item['dateline'],
                        'mode'		=> '',
                        'is_readable'	=> 1,
                        'is_writeable'	=> 1,
                        'meta_info' => 'treeFav',
                        'path' 		=> $path,
                        'open'      => false,
                        'uid' => $item['fuid'],
                        'this_uid' => $item['fuid'],
                        'isParent'  => false,//$has_children
                        'username' => isset($userinfos[$item['uid']]) ? $userinfos[$item['uid']]['realname'] :  $userinfos[$item['uid']]['username'],
                        'exists' => !empty($item['spath']) ? 1 : 0
                    );
                    //过滤无效项目
                    if (empty($cell['exists'])) {
                        continue;
                    }
                    if ($item['isdir'] == 1) {
                        //目录
                        $list['folderlist'][] = $cell;
                        continue;
                    }
                    $list['filelist'][] = $cell;
                }
            }

            $GLOBALS['path_from_auth_check'] = false;
            $GLOBALS['path_type'] = KOD_USER_FAV;
            $list['path_read_write'] = 'readable';
            $list['info'] = array(
                'path_type' => KOD_USER_FAV,
                'role' => 'owner'
            );
            return $list;
        }
		$favData=new fileCache(USER.'data/fav.php');
		$fav_list = $favData->get();
		$GLOBALS['path_from_auth_check'] = true;//组权限发生变更。导致访问group_path 无权限退出问题
		foreach($fav_list as $key => $val){
			$the_path = _DIR($val['path']);
			$has_children = path_haschildren($the_path,$check_file);
			if( !isset($val['type'])){
				$val['type'] = 'folder';
			}
			if( $val['type'] == 'folder' && $val['ext'] != 'treeFav'){
				$has_children = true;
			}
			$cell = array(
				'name'      => $val['name'],
				'ext' 		=> $val['ext'],
				'menuType'  => "menuFavPath",
				'atime'		=> '',
				'ctime'		=> '',
				'mode'		=> '',
				'is_readable'	=> 1,
				'is_writeable'	=> 1,
				'exists'	=> intval(file_exists($the_path)),
				'meta_info' => 'treeFav',

				'path' 		=> $val['path'],
				'type'		=> $val['type'],
				'open'      => false,
				'isParent'  => false//$has_children
			);
			if( strstr($val['path'],KOD_USER_SHARE)||
				strstr($val['path'],KOD_USER_FAV) ||
				strstr($val['path'],KOD_GROUP_ROOT_SELF) ||
				strstr($val['path'],KOD_GROUP_ROOT_ALL)
				){
				$cell['exists'] = 1;
			}

			//分享列表oexe
			if(get_path_ext($val['name']) == 'oexe'){
				$json = json_decode(@file_get_contents($the_path),true);
				if(is_array($json)) $val = array_merge($val,$json);
			}
			if ($val['type']=='folder') {
				$list['folderlist'][] = $cell;
			}else{
				$list['filelist'][] = $cell;
			}
		}
		$GLOBALS['path_from_auth_check'] = false;
		$GLOBALS['path_type'] = KOD_USER_FAV;
		$list['path_read_write'] = 'readable';
		return $list;
	}

    /**
     * 应用
     * @param $list
     */
	private function path_app(&$list) {
	    $list['filelist'] = $this->model('Webapp')->getAppList($this->crid);
	    $list['filelist'] = array_map(function($file) {
	        $file['simple'] = intval($file['simple']);
	        $file['resize'] = intval($file['resize']);
	        $file['isParent'] = intval($file['isParent']) == 1 ? true : false;
	        $file['is_readable'] = intval($file['is_readable']);
	        $file['is_writeable'] = intval($file['is_writeable']);
	        return $file;
        }, $list['filelist']);
        $GLOBALS['path_from_auth_check'] = false;
        $GLOBALS['path_type'] = KOD_APP;
        $list['path_read_write'] = 'readable';
        $list['info'] = array(
            'path_type' => KOD_APP,
            'role' => 'owner'
        );

        return $list;
    }

	//用户组列表
	private function path_group(&$list,$group_root_type){
		if($group_root_type == KOD_GROUP_ROOT_SELF){
			$data_list = $this->_group_self();
		}else{
			$data_list = $this->_group_tree('1');
		}
		$GLOBALS['path_from_auth_check'] = true;//组权限发生变更。导致访问group_path 无权限退出问题
		foreach($data_list as $key => $val){
			$cell = array(
				'name'      => $val['name'],
				'menuType'  => "menuGroupRoot",
				'atime'		=> '',
				'ctime'		=> '',
				'mode'		=> '',
				'is_readable'	=> 1,
				'is_writeable'	=> 1,
				'exists'	=> 1,

				'path' 		=> $val['path'],
				'ext'		=> $val['ext'],
				'type'		=> 'folder',
				'open'      => false,
				'isParent'  => false//$val['isParent']
			);
			if ($val['type']=='folder') {
				$list['folderlist'][] = $cell;
			}else{
				$list['filelist'][] = $cell;
			}
		}
		$GLOBALS['path_from_auth_check'] = false;
		$GLOBALS['path_type'] = $group_root_type;
		$list['path_read_write'] = 'readable';
		return $list;
	}

    /**
     * 用户组共享
     * @param $list
     * @return mixed
     */
    private function path_groupshare(&$list, $byTree = false) {
        //共享目录
        $shareModel = $this->model('Shareing');
        $fileModel = $this->model('File');
        $root = null;
        $filterParams = array(
            'crid' => $this->crid,
            'limit' => pow(2, 16)
        );
        $path_info = explode('/', $GLOBALS['path_type']);
        $shareList = array();
        $pathDevel = count($path_info);
        $delRoot = '';
        if ($pathDevel > 1) {
            $group = explode(':', $path_info[0]);
            if (count($group) != 3) {
                show_json($this->L['share_error_path'], false);
            }
            $ownerId = intval($group[1]);
            $fileId = intval($group[2]);
            $root = $fileModel->getOneFile(array(
                'fileid' => $fileId,
                'crid' => $this->crid
            ));
            if (empty($root) || empty($root['isdir'])) {
                show_json($this->L['share_error_path'], false);
            }
            $tmpPos = rtrim($root['path'], '/');
            $tmpPos = strrpos($tmpPos, '/');
            $root['path'] = substr($root['path'], 0, $tmpPos);
            unset($path_info[0]);
            if (count($path_info) > 1) {
                $tmpPath = $root['path'].'/'.implode('/', $path_info).'/';
                $parent = $fileModel->getOneFile(array(
                    'crid' => $root['crid'],
                    'uid' => $root['uid'],
                    'path' => $tmpPath
                ));
                if (empty($parent)) {
                    show_json($this->L['share_error_path'], false);
                }
                $fileId = $parent['fileid'];
            }
            if ($ownerId != $this->user['uid']) {
                //分享的目录
                $isShare = $shareModel->isShare($ownerId, $fileId, $this->crid);
                if (empty($isShare)) {
                    show_json('目录没有访问权限', false);
                }
            }
            $subFiles = $fileModel->getFileList(array(
                'upid' => $fileId,
                'crid' => $this->crid
            ));
            if (!empty($subFiles)) {
                foreach ($subFiles as $subFile) {
                    $subShare = array();
                    $subShare['shareid'] = 0;
                    $subShare['fileid'] = $subFile['fileid'];
                    $subShare['title'] = $subFile['name'];
                    $subShare['fpath'] = $subFile['path'];
                    $subShare['isdir'] = $subFile['isdir'];
                    $subShare['suffix'] = $subFile['ext'];
                    $subShare['uid'] = $subFile['uid'];
                    $subShare['fuid'] = $subFile['fuid'];
                    $subShare['sub'] = 1;
                    $subShare['size'] = $subFile['size'];
                    $subShare['mtime'] = $subFile['dateline'];
                    $shareList[] = $subShare;
                }
                unset($subFiles);
            }
        } else {
            $shareList = $shareModel->getShareList($filterParams);
        }

        $list['path_read_write'] = 'writeable';
        $list['this_path'] = KOD_GROUP_SHARE;
        /**
         * 用户空间使用情况
         */
        $list['user_space'] = array(
            'size_max' => 0,
            'size_use' => 0
        );
        if (!empty($shareList)) {
            $aids = array_column($shareList, 'aid');
            $aids = array_filter($aids, function($aid) {
               return $aid > 0;
            });
            $apps = array();
            if (!empty($aids)) {
                $apps = $this->model('Webapp')->getPublicAppList($aids, $this->crid, true);
            }
            $uids = array_column($shareList, 'uid');
            $uids = array_unique($uids);
            $userinfos = $this->model('User')->getUserInfoByUid($uids, true);
            unset($uids);
            foreach ($shareList as $shareItem) {
                $username = '';
                if (isset($userinfos[$shareItem['uid']])) {
                    $username = isset($userinfos[$shareItem['uid']]['realname']) ? $userinfos[$shareItem['uid']]['realname'] : $userinfos[$shareItem['uid']]['username'];
                }
                $sid = 's'.(!empty($shareItem['shareid']) ? $shareItem['shareid'] : $shareItem['fileid']);
                $path = $shareItem['fpath'];
                if (empty($shareItem['isdir'])) {
                    $l = strrpos($path, '/');
                    $path = substr($path, 0, $l + 1).(!empty($shareItem['name']) ? $shareItem['name'] : $shareItem['title']);
                } else {
                    $path = str_replace($root['path'], '', $path);
                    if (!empty($root)) {
                        $fid = $root['fileid'];
                        $path = str_replace($root['path'], '', $path);
                    } else {
                        $fid = $shareItem['fileid'];
                        $path = rtrim($path, '/');
                        $path = strrchr($path, '/');
                    }
                    $path = KOD_GROUP_SHARE.':'.$shareItem['uid'].':'. $fid.'/'.ltrim($path, '/');
                    //echo $path."\n";
                }

                $list['share_list'][$sid] = array(
                    'mtime' => SYSTIME,
                    'sid' => $sid,
                    'type' => $shareItem['isdir'] ? 'folder' : 'file',
                    'path' => $path,
                    'name' => empty($shareItem['name']) ? $shareItem['title'] : $shareItem['name'],
                    'show_name' => $shareItem['title'],
                    'time_to' => $shareItem['deadline'] > 0 ? $shareItem['deadline'] : '',
                    'share_password' => '',
                    'code_read' => '',
                    'can_upload' => '',
                    'not_download' => '',
                    'uid' => $shareItem['uid'],
                    'username' => $username,
                    'sub' => $pathDevel > 1 ? 1 : 0
                );
                $item = array(
                    'name' => $shareItem['title'],
                    'path' => $path,
                    'fileid' => $shareItem['fileid'],
                    'shareid' => $shareItem['shareid'],
                    'sid' => $sid,
                    'size' => $shareItem['size'],
                    'upid' => $shareItem['upid'],
                    'menuType'  => 'menuSharePath',
                    'atime' => '',
                    'ctime' => '',
                    'mode' => '',
                    'is_readable' => 1,
                    'is_writable' => 1,
                    'uid' => $shareItem['uid'],
                    'username' => $username,
                    'sub' => $pathDevel > 1 ? 1 : 0,
                    'exists' => $pathDevel > 1 || !empty($shareItem['fpath']) ? 1 : 0,
                    'this_uid' => $shareItem['fuid'],
                    'mtime' => $shareItem['mtime']
                );
                if ($pathDevel == 1) {
                    if ($this->user['uid'] == $shareItem['fuid']) {
                        $item['meta_info'] = 'path_self_share';
                    }
                    $l = strrpos($path, '/');
                    $item['real_path'] = substr($shareItem['fpath'], 0, $l + 1);
                }

                if(get_path_ext($shareItem['title']) == 'oexe'){
                    if (!isset($apps[$shareItem['aid']])) {
                        continue;
                    }
                    if ($apps[$shareItem['aid']]['auid'] == $item['uid']) {
                        $item['meta_info'] = 'path_self_share';
                    }
                    $item = array_merge($item, $apps[$shareItem['aid']]);
                    $item['exists'] = 1;
                }
                if ($item['exists'] == 0) {
                    //失效文件过滤
                    continue;
                }

                if ($shareItem['isdir']) {
                    $item['type'] = 'folder';
                    $list['folderlist'][] = $item;
                } else {
                    $item['ext'] = get_path_ext($shareItem['title']);
                    $list['filelist'][] = $item;
                }
            }
            unset($shareList);
        }
        $list['info'] = array(
            'path_type' => KOD_GROUP_SHARE,
            'role' => 'owner',
            'kpan_share' => true,
            'sub_share' => $pathDevel > 1
        );
        //print_r($list);exit;
        return $list;
    }

	//获取文件列表&哦exe文件json解析
	private function path($dir,$list_file=true,$check_children=false,$formInit=false,$isFromSearch=false){
        //echo $GLOBALS['path_type'];
		$ex_name = explode(',',$this->config['setting_system']['path_hidden']);
		//当前目录
		$this_path = _DIR_OUT(iconv_app($dir));
		if($GLOBALS['path_type'] == KOD_USER_SHARE && strpos(trim($dir,'/'),'/')===false ) {
			$this_path = $dir;
		}
		/****测试代码******************************************************************************************/
        $GLOBALS['path_type'] = rtrim($this_path, '/');
        //die($this_path."\n".$GLOBALS['path_type']);
		/*********************************************************************************************/
		//die($GLOBALS['path_type']);
		$list = array(
			'folderlist'		=> array(),
			'filelist'			=> array(),
			'info'				=> array(),
			'path_read_write'	=>'not_exists',
			'this_path' 		=> $this_path
		);
		//真实目录读写权限判断
		$list['path_read_write'] = 'readable';
		$list['path_read_write'] = 'writeable';
		/*if (!file_exists($dir)) {
			$list['path_read_write'] = "not_exists";
		}else if (path_writeable($dir)) {
			$list['path_read_write'] = 'writeable';
		}else if (path_writeable($dir)) {
			$list['path_read_write'] = 'readable';
		}else{
			$list['path_read_write'] = 'not_readable';
		}*/

		//处理
		if ($dir===false){
			return $list;
		}else if ($GLOBALS['path_type'] == KOD_USER_SHARE &&
			!strstr(trim($this->in['path'],'/'),'/')) {//分享根目录 {user_share}:1/ {user_share}:1/test/
			$list = $this->path_share($list);
		}else if ($GLOBALS['path_type'] == KOD_USER_FAV) {//收藏根目录 {user_fav}
			$list = $this->path_fav($list);
		}else if ($GLOBALS['path_type'] == KOD_GROUP_ROOT_SELF) {//自己用户组目录；KOD_GROUP_ROOT_SELF
			$list = $this->path_group($list,$GLOBALS['path_type']);
		}else if ($GLOBALS['path_type'] == KOD_GROUP_ROOT_ALL) {//全部用户组目录；KOD_GROUP_ROOT_ALL
			$list = $this->path_group($list,$GLOBALS['path_type']);
		}else if($GLOBALS['path_type'] == KOD_APP) {
		    $list = $this->path_app($list);
        }else{
			if (isset($_POST['search']))
				$param['q'] = $_POST['search'];
			if (!empty($_POST['ext']))
				$param['ext'] = $_POST['ext'];
			if (!empty($_POST['category']))
				$param['category'] = $_POST['category'];
			if (isset($_POST['is_content']))
				$param['isdir'] = $_POST['is_content'];
			/*if (isset($_GET['fileid']) && $_GET['fileid'] !='undefined') {
				$param['fileid'] = intval($_GET['fileid']);
			}*/
			if (!empty($_GET['app']))//来自初始化根目录
				$param['isdir'] = 1;
			if ($isFromSearch) {
				$param['isFromSearch'] = 1;
			}
			$param['path'] = $dir;
			$param['crid'] = $this->crid;
			$param['uid'] = $this->user['uid'];
			if ($formInit) {
				$param['path'] = '/';
			}

            if ($this->_saveType == 1) {
                if (strpos($GLOBALS['path_type'], '{user_share}') !== false) {
                    //我的共享
                    $list = $this->path_share($list);
                    return $list;
                }
                if (strpos($GLOBALS['path_type'], '{group_share}') !== false) {
                    //共享组
                    $list = $this->path_groupshare($list);
                    return $list;
                }
            }
			$list_file = path_list($dir,$list_file,true,$param);//$check_children
			$list['folderlist'] = $list_file['folderlist'];
			$list['filelist'] = $list_file['filelist'];

		}
		$filelist_new = array();
		$folderlist_new = array();
		if (!empty($list['filelist'])) {
            foreach ($list['filelist'] as $key => $val) {
                if (in_array($val['name'],$ex_name)) continue;
                $val['ext'] = get_path_ext($val['name']);
                if ($val['ext'] == 'oexe' && !isset($val['content'])){
                    $path = iconv_system($val['path']);
                    $json = json_decode(@file_get_contents($path),true);
                    if(is_array($json)) $val = array_merge($val,$json);
                }
                if ($val['ext'] == 'oexe') {
                    $val['mode'] = '只读';
                    $val['username'] = '系统';
                }
                $filelist_new[] = $val;
            }
		}
		if (!empty($list['folderlist'])) {
		foreach ($list['folderlist'] as $key => $val) {
			if (in_array($val['name'],$ex_name)) continue;
			$folderlist_new[] = $val;
		}
		}
		
		$list['filelist'] = $filelist_new;
		$list['folderlist'] = $folderlist_new;
		$list = _DIR_OUT($list);
		//$this->_role_check_info($list);
		return $list;
	}

	/**
	 * ebh
     * 验证文件权限
     */
    public function checkFile($user,$fileid,$file = NULL) {
        if(empty($user))
            return FALSE;
        if(!isset($file)) {
            $filemodel = Ebh::app()->model('File');
            $file = $filemodel->getFileByFileid($fileid);
        }
        if(empty($file))
            return FALSE; 
        if($user['uid'] == $file['uid']) {  //如果为上传者 则直接有权限
            return TRUE;
        }
        return FALSE;
    }

    /**
	 * 输出二进制文件
	 * @param string $type 输出的文件类型项，此值必须与upconfig对应的项相同
	 * @param string $filepath文件保存的相对路径，通过upconfig的savepath可找到绝对路径
	 * @param string $filename文件输出的显示名称
	 * @param boolean $octet文件是否为二进制流输出
	 */
	function getfile($type = 'pan', $filepath, $filename, $octet = false, $realpath='') {
	    $_UP = Ebh::app()->getConfig()->load('upconfig');
	    if ($realpath) {
	    	$file_explode = explode('/', $realpath);
	    	if (empty($file_explode)) {
	    		return false;
	    	}
	    	$filename = array_pop($file_explode);
	    	$showpath = $_UP[$type]['showpath'];
	    	$filepath = '';
	    	foreach ($file_explode as $key => $value) {
	    		if (is_numeric($value)) {
	    			$filepath .= $value.'/';
	    		}
	    	}
	    	$filepath = $filepath.$filename;
	    } else {
	    	$realpath = $_UP[$type]['savepath'] . $filepath;
	    	$showpath = $_UP[$type]['showpath'];
	    }
	    if (!file_exists($realpath)) {
	        log_message('文件不存在'.$realpath);
	    } else {
	        $ext = strtolower(substr($filename, strrpos($filename, '.') + 1));
	        if ($type != 'course' && $type != 'note') {
	            $fname = $filename;
	            if (!empty($_SERVER['HTTP_USER_AGENT']) && ( strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') || stripos($_SERVER['HTTP_USER_AGENT'], 'trident'))) {
	                $fname = urlencode($fname);
	            } else {
	                $fname = str_replace(array(' ',','), '', $fname);
	            }
	        } else {
	            $fname = time() . '.ebhp';
	        }
	        if ($ext == 'swf' && $octet === false) {
	            header("Content-Type: application/x-shockwave-flash");
				header("Content-Disposition: inline; filename=" . $fname);
	        } else {
	            $mime = getMime($ext);
	            // header("Content-Type: application/octet-stream");
	            header("Content-Type: ".$mime);
	            header("Content-Disposition: attachment; filename=" . $fname);
	        }
	        $webtype = Ebh::app()->web['type'];
	        if(empty($webtype))
	            $webtype = 'nginx';
	        if ($webtype == 'nginx') {
	            header("X-Accel-Redirect: " . $showpath . $filepath);
	        } else {
	            header('X-Sendfile:' . $realpath);
	        }
	        exit();
	    }
	}
    
	private function _role_check_info(&$list){
		if(!$GLOBALS['path_type']){
			$list['info'] = array("path_type"=>'',"role"=>'',"id"=>'','name'=>'');
			return;
		}
		$list['info']= array(
			"path_type" => $GLOBALS['path_type'],
			"role"      => $GLOBALS['is_root']?'owner':'guest',
			"id"        => $GLOBALS['path_id'],
			'name'      => '',
		);

		if ($GLOBALS['path_type'] == KOD_USER_SHARE) {
			$GLOBALS['path_id'] = explode(':',$GLOBALS['path_id']);
			$GLOBALS['path_id'] = $GLOBALS['path_id'][0];//id 为前面
			$list['info']['id'] = $GLOBALS['path_id'];
			$user = system_member::get_info($GLOBALS['path_id']);
			$list['info']['name'] = $user['name'];

			//自己的分享子目录
			if($GLOBALS['path_id'] == $this->user['uid']){
				$list['info']['role'] = "owner";
			}
			if($GLOBALS['is_root']){
				$list['info']['admin_real_path'] = USER_PATH.$user['path'].'/home/';
			}
		}
		//自己管理的目录
		if ($GLOBALS['path_type']==KOD_GROUP_PATH ||
			$GLOBALS['path_type']==KOD_GROUP_SHARE) {
			$group = system_group::get_info($GLOBALS['path_id']);
			$list['info']['name'] = $group['name'];
			$auth = system_member::user_auth_group($GLOBALS['path_id']);
			if ($auth=='write' || $GLOBALS['is_root']) {
				$list['info']['role'] = 'owner';
				$list['group_space_use'] = $group['config'];//自己
			}
			if($GLOBALS['is_root']){
				$list['info']['admin_real_path'] = GROUP_PATH.$group['path'].'/home/';
			}
		}
	}
}
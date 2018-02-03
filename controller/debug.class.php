<?php
/*
* @link http://www.kalcaddle.com/
* @author warlee | e-mail:kalcaddle@qq.com
* @copyright warlee 2014.(Shanghai)Co.,Ltd
* @license http://kalcaddle.com/tools/licenses/license.txt
*/

class debug extends Controller{
	public $path_app;
	function __construct() {
		$path_parent = dirname(BASIC_PATH);

		require(CLASS_DIR.'archiveLib/pclzip.class.php');
		$this->path_app	= BASIC_PATH;
		$this->path_release	= $path_parent.'/release';

		$this->zip_to	= $path_parent.'/tag/kodexplorer'.KOD_VERSION.'.zip';
		$this->zip_to_oem	= $path_parent.'/tag/kodexplorer'.KOD_VERSION.'-enterprice.zip';

		//自动更新覆盖包
		$this->update_to= $path_parent.'/release_update';
		$this->update_zip_to= $path_parent.'/update/2.0-'.KOD_VERSION.'.zip';
		$this->zip_to_oem_update = $path_parent.'/update/2.0-'.KOD_VERSION.'-enterprice.zip';

		$this->path_git_github  = dirname(dirname(BASIC_PATH)).'/git/github/KODExplorer/';
		$this->path_git_oschina = dirname(dirname(BASIC_PATH)).'/git/oschina/';
		$this->path_git_coding = dirname(dirname(BASIC_PATH)).'/git/coding.net/';
		parent::__construct();
	}
	function log($str){
		$str = str_replace(array("<hr/>","<br/>","</p>"),array("<hr/>\n","<br/>\n","</p>\n"),$str);
		if(isset($this->in['console'])){
			$str = strip_tags($str);
		}
		echo $str;
		flush();
	}

	function language(){
		include(BASIC_PATH.'lib/language/language_manage.html');
	}


	//https://github.com/phillipbentonkelly/GTranslateJS/blob/96b85efd0a01a77149ffb79e0f8e8967d2bc6aad/GoogleTranslateJS.js
	//墙问题，代理到香港服务器翻译
	function translate($text='',$from='auto',$to='zh-CN'){
		$url = "https://translate.google.com/translate_a/single?client=at&dt=t&dt=ld&dt=qca&dt=rm&dt=bd&dj=1&hl=es-ES&ie=UTF-8&oe=UTF-8&inputm=2&otf=2&iid=1dd3b944-fa62-4b55-b330-74909a99969e";
		$url ="http://server.app.zega.cn/tools/http_proxy/?url=".rawurlencode(strrev(base64_encode($url))).'&url_encode=1';
		$post = "sl={$from}&tl={$to}&q=".rawurlencode($text);

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_ENCODING, 'UTF-8');
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($ch, CURLOPT_USERAGENT,'AndroidTranslate/5.3.0.RC02 5.1 phone TRANSLATE_OPM5_TEST_1');
		$result = curl_exec($ch);
		curl_close($ch);

		$sentencesArray = json_decode($result, true);
		$sentences = "";
		foreach ($sentencesArray["sentences"] as $s) {
			$sentences .= $s["trans"];
		}
		return $sentences;
	}

	function translate_html($text='',$from='auto',$to='zh-CN'){
		$url  = "https://www.googleapis.com/language/translate/v2";
		$values = array(
			'key'    => 'AIzaSyCKmtGaFFMp8vh15tAAm2KzrWNDNiQeZqs',
			'target' => $to,
			'source' => $from,
			'q'      => $text
		);
		$param = http_build_query($values);
		$url .= "?".$param;
		$url ="http://server.app.zega.cn/tools/http_proxy/?url=".rawurlencode(strrev(base64_encode($url))).'&url_encode=1';
		$ch = curl_init();
		// curl_setopt($ch, CURLOPT_POST, true);
		// curl_setopt($ch, CURLOPT_POSTFIELDS, $param);

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_ENCODING, 'UTF-8');
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array('Expect: ',"X-HTTP-Method-Override: GET")); //url允许过长
		curl_setopt($ch, CURLOPT_USERAGENT,'AndroidTranslate/5.3.0.RC02 5.1 phone TRANSLATE_OPM5_TEST_1');
		$result = curl_exec($ch);
		curl_close($ch);

		$res = json_decode($result, true);
		if(is_array($res)){
			return html_entity_decode($res['data']['translations'][0]['translatedText'], ENT_QUOTES);
		}else{
			return "";
		}
	}

	function file_save_log_diff($file,$new_str){
		$old_str = file_get_contents($file);
		if($old_str == $new_str){
			return array();
		}

		file_put_contents($file,$new_str);
		$path_diff = BASIC_PATH.'lib/language/phpDiff/';
		require_once $path_diff.'Diff.php';
		require_once $path_diff.'Diff/Renderer/Html/Inline.php';
		$options = array(
			'context' => 0,//前后保留多少行
			'ignoreNewLines' => false,
			'ignoreWhitespace' => false,
			'ignoreCase' => false
		);
		$diff = new Diff(explode("\n",$old_str), explode("\n",$new_str), $options);
		$renderer = new Diff_Renderer_Html_Inline;
		$change  = $diff->render($renderer);
		return array(
			'file'		=> $file,
			'old_str'	=> $old_str,
			'diff'		=> $change
		);
	}
	function change_diff_log(&$log_arr){
		$path_backup = BASIC_PATH.'lib/language/data/backup/'.date('Y-m-d H:i:s').'/';
		$content = '';
		for ($i = 0; $i < count($log_arr); $i++) {
			$item = $log_arr[$i];
			if(count($item)>0){
				$content.= '<div class="filename">'.$item['file'].'</div>'.$item['diff'];
				$file_name = get_path_this($item['file']);
				$parent  = get_path_this(get_path_father($item['file']));
				$parent2 = get_path_this(get_path_father(get_path_father($item['file'])));//两级父目录
				$path    = $path_backup.'/'.$parent2.'/'.$parent.'/';
				mk_dir($path);
				file_put_contents($path.$file_name,$item['old_str']);
			}
		}
		file_put_contents($path_backup.'log.html', $content);
	}
	function change_diff(){
		$path = BASIC_PATH.'lib/language/';
		$arr = path_list($path.'data/backup/');
		$folders = $arr['folderlist'];
		usort($folders, function($a, $b) {
			$al = strtotime($a['name']);
			$bl = strtotime($b['name']);
			if ($al == $bl){
				return 0;
			}else{
				return ($al > $bl) ? -1 : 1;
			}
		});
		if(!is_array($folders)){
			echo 'No Changes!';
			exit;
		}
		$content = "";
		for ($i = 0; $i < count($folders); $i++) {
			$str = file_get_contents($folders[$i]['path'].'/log.html');
			$content .= '<div class="panel"><div class="title version_time">'.
					$folders[$i]['name'].'</div><div class="content">'.$str.'</div></div>';
		}
		include($path.'phpDiff/tpl.html');
	}

	function language_action(){
		$lang_path = BASIC_PATH.'config/i18n/';
		$base = include($lang_path.'zh-CN/main.php');//$L
		$sheet_file = BASIC_PATH.'lib/language/data/sheet.json';

		switch($this->in['action']){
			case "get":
				$result = array();
				foreach ($this->config['setting_all']['language'] as $key => $value) {
					$list    = array();
					$current = array();
					if(file_exists($lang_path.$key.'/main.php')){
						$current = include($lang_path.$key.'/main.php');//$L
					}
					foreach ($base as $lng_key => $lng_value) {
						if(isset($current[$lng_key])){
							$list[$lng_key] = str_replace('\"','"',$current[$lng_key]);//引号转义
						}else{
							$list[$lng_key] = "";
						}
					}
					//html 模板文件
					$tpl_arr = array('about','edit','help');
					for ($i=0; $i < count($tpl_arr); $i++) {
						$the_file = $lang_path.$key.'/'.$tpl_arr[$i].'.html';
						if(file_exists($the_file)){
							$list['page_html_'.$tpl_arr[$i]] = @file_get_contents($the_file);
						}else{
							$list['page_html_'.$tpl_arr[$i]] = "";
						}						
					}

					$result[$key] = array(
						'lang'	=> $key,
						'name'	=> $value[0],
						'desc'	=> $value[1],
						'list'	=> $list
					);
				}
				show_json($result);
				break;
			case "set":
				$change_arr = array();
				$lang_all = json_decode(rawurldecode($this->in['data']));
				foreach ($lang_all as $lang => $arr) {
					$file = $lang_path."/".$lang.'/main.php';
					mk_dir($lang_path."/".$lang);
					$str = "<?php\nreturn array(\n";
					for ($i=0; $i < count($arr); $i++) {
						if(strpos($arr[$i][0],'page_html_') === 0){//文件翻译
							$file_tpl = $lang_path."/".$lang.'/'.str_replace('page_html_','',$arr[$i][0]).'.html';
							$change_arr[] = $this->file_save_log_diff($file_tpl,$arr[$i][1]);
						}else{
							$value = str_replace('"','\"',$arr[$i][1]);
							$value = rtrim($value,"\n");
							$space = " ";
							for ($j=strlen($arr[$i][0]); $j < 30; $j++) {
								$space .=" ";
							}
							$str .='    "'.$arr[$i][0].'"'.$space.'=> "'.$value.'",'."\n";
						}
					}
					$str =  substr($str,0,-2)."\n);";
					$change_arr[] = $this->file_save_log_diff($file,$str);
				}
				$this->change_diff_log($change_arr);
				show_json('保存成功');
				break;
			case 'translate':
				show_json($this->translate($this->in['text'],$this->in['from'],$this->in['to']));
			case "sheet_set":
				file_put_contents($sheet_file, $this->in["sheetData"]);
				show_json("success");
				break;
			case "sheet_get":
				$content = file_get_contents($sheet_file);
				if($this->in['force'] || !$content){//强制加载
					del_file($sheet_file);
					show_json('error',false);
				}else{
					show_json(rawurldecode($content));
				}
				break;
			default:break;
		}
	}


	function gruntVersion(){
		$file = BASIC_PATH.'static/js/build/package.json';
		$file_str = file_get_contents($file);
		
		$json = json_decode($file_str,true);

		$json['version'] = KOD_VERSION;
		$json_str = json_encode($json,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
		$json_str = str_replace(array('\/'),array('/'),$json_str);
		file_put_contents($file,$json_str);
		echo "version ".KOD_VERSION."\n";
	}

	/**
	 * 首页
	 */
	public function index() {
		$this->log('<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />');
		debug_out(WEB_ROOT,BASIC_PATH,$config,$_COOKIE,$_SESSION,$_SERVER);
	}
	function less(){
		header("Content-type: text/html; charset=utf-8");
		ob_end_clean();
		echo str_pad('',1024);
		$this->log('<h3>开始编译less</h3><hr/>');
		$this->_less();
		$this->log('成功！<br/>');
	}
	function run_js(){
		$this->log(system('cd /Library/WebServer/Documents/localhost/kod/make/;grunt build --force;'));
	}

	function export(){
		header("Content-type: text/html; charset=utf-8");
		ob_end_clean();			//在循环输出前，要关闭输出缓冲区
		echo str_pad('',1024);  //浏览器在接受输出一定长度内容之前不会显示缓冲输出

		$this->log('<h1>开始导出！</h1><hr/><h3>删除正式版目录初始文件</h3><hr/>');
		del_dir($this->path_release);
		$this->log('删除完成！<br/><h3>删除成功,开始编译less</h3><hr/>');
		$this->_less();
		$this->log('less编译成功！<br/><h3>开始复制文件</h3><hr/>');
		$this->_fileInit();
		$this->log('复制成功！<br/><h3>删除开发相关文件</h3><hr/>');
		$this->_remove();
		$this->log('删除成功！<br/><h3>开始替换模板种less相关内容</h3><hr/>');
		$this->_fileReplace();
		$this->log('替换成功！<br/><h3>初始化默认用户数据...</h3><hr/>');
		$this->_initUserData();
		$this->log('初始化默认用户成功!<br/><h3>加密php文件！</h3><hr/>');
		$this->_php_encode();
		$this->log('加密完成!<br/><h3>正在处理自动更新包！</h3><hr/>');
		$this->make_update();
		$this->log('更新成功！<br/><h3>开始复制到git_osc git_github  和测试目录</h3>');

		system('rm -rf '.$this->path_git_github.'/*');
		system('rm -rf '.$this->path_git_oschina.'/*');
		system('rm -rf '.$this->path_git_coding.'/*');
		system('cp -R '.$this->path_release.'/* '.$this->path_git_github);
		system('cp -R '.$this->path_release.'/* '.$this->path_git_oschina);
		system('cp -R '.$this->path_release.'/* '.$this->path_git_coding);
		system('chmod -Rf 777 '.$this->path_release);
		system('chmod -Rf 777 '.$this->path_git_github);
		system('chmod -Rf 777 '.$this->path_git_oschina);
		system('chmod -Rf 777 '.$this->path_git_coding);
		ini_set('memory_limit', '2048M');//2G;

		$this->log('复制成功!<br/><h3>正在打包版本</h3>');
		//打包开源版
		$archive = new PclZip($this->zip_to);
		$v_list = $archive->create($this->path_release,PCLZIP_OPT_REMOVE_PATH,$this->path_release);

		//移动release 到self/kod目录
		$kod_release = '/Library/WebServer/Documents/localhost/self/kod/release';
		del_dir($kod_release);
		copy_dir($this->path_release.'/',$kod_release);


		$this->archive_enterprice();
		$this->log('压缩包打包成功！<br/><h1>导出处理完成！^_^</h1>');
	}
	function archive_enterprice(){
		//打包企业版版；
		copy_dir($this->path_app.'/static/js/_dev', $this->path_release.'/static/js/_dev');
		copy_dir($this->path_app.'/static/style/skin_dev', $this->path_release.'/static/style/skin_dev');
		copy_dir($this->path_app.'/static/js/build', $this->path_release.'/static/js/build');
		copy_dir($this->path_app.'/template', $this->path_release.'/template');
		copy_dir($this->path_app.'/controller', $this->path_release.'/controller');
		copy_dir($this->path_app.'/lib/plugins', $this->path_release.'/lib/plugins');
		del_file($this->path_release.'/static/js/_dev/main.js');
		del_file($this->path_release.'/static/js/_dev/common/core.tools_dev.js');
		del_dir($this->path_release.'/static/js/build/node_modules');
		
		copy($this->update_to.'/lib/class/.cache_data', $this->path_release.'/lib/class/.cache_data');
		copy($this->path_app.'/config/setting_user.php', $this->path_release.'/config/setting_user.php');
		copy($this->path_app.'/static/js/lib/less.min.js', $this->path_release.'/static/js/lib/less.min.js');
		$zip_to_oem = new PclZip($this->zip_to_oem);
		$v_list = $zip_to_oem->create($this->path_release,PCLZIP_OPT_REMOVE_PATH,$this->path_release);

		//打包企业更新包
		del_dir($this->path_release.'/data/');
		del_file($this->path_release.'/config/setting_user.php');
		$zip_to_oem_update = new PclZip($this->zip_to_oem_update);
		$zip_to_oem_update->create($this->path_release,PCLZIP_OPT_REMOVE_PATH,$this->path_release);	

		//清空临时目录
		del_dir($this->path_release);
		del_dir($this->update_to);
	}



	function make_update(){
		del_dir($this->update_to);
		mk_dir($this->update_to);
		copy_dir($this->path_release.'/', $this->update_to);
		rename($this->update_to.'/lib/update_dev.php',$this->update_to.'/lib/update.php');
		del_file($this->path_release.'/lib/update_dev.php');
		$file_list = array(
			//$this->update_to.'/static/js/lib/jquery-1.8.0.min.js'
		);
		$path_list = array(
			$this->update_to.'/data',
		);
		foreach($file_list as $val){
			del_file($val);
		}
		$this->log('<br/>1.更新包；文件删除完成：');
		foreach($path_list as $val){
			del_dir($val);
		}
		$this->log('<br/>2.更新包；文件夹删除完成：');
		$archive = new PclZip($this->update_zip_to);
		$v_list = $archive->create($this->update_to,PCLZIP_OPT_REMOVE_PATH,$this->update_to);

		//更新main.js文件大小
		$update_js = $this->path_app.'/static/js/_dev/main.js';
		$size = filesize($this->update_zip_to);
		$content = file_get_contents($update_js);
		$content = preg_replace("/ version_total_size = \d*;\/\/size/",
			" version_total_size = ".$size.";//size",$content);
		file_put_contents($update_js,$content);
		$this->log('更新包打包成功！<br/><hr/>');
	}

	//----------------------------
	function _less_make($path_in,$path_out){
		$banner = "/* power by kodexplorer ver ".KOD_VERSION."".date("(Y-m-d)")." [build ".mtime()."] */\n";
		$footer = "\n/* ver ".KOD_VERSION."".date("(Y-m-d)")." [build ".mtime()."] */";
		try {
			$less	= new lessc();
			$cache	= $less->cachedCompile($path_in);
			$out	= str_replace(
				array("  ",";\n",";  ","; "," ;",": "," :",",\n",  "{\n"," {","{ "," }","} ","}\n"),
				array(" ",";",";",";",";",":",':',",",             "{","{","{","}","}","}"),$cache["compiled"]);
			$out = $banner.$out.$footer;
			file_put_contents($path_out,$out);
			$this->log($path_out.',success!<br/>');
			unset($less);unset($out);
		}catch (exception $e) {
			$this->log("<p style='color:#f66'>fatal error: " . $e->getMessage().'</p>');
		}
	}
	function _less(){
		load_class('lessc.inc');
		$path		= BASIC_PATH.'static/style/';
		$app_less	= array(//base 处理
			'app_code_edit',
			'app_desktop',
			'app_editor',
			'app_explorer',
			'app_setting'
		);
		mk_dir($path.'/skin/base');
		foreach($app_less as $app){
			$this->_less_make($path.'skin_dev/base/'.$app.'.less',$path.'/skin/base/'.$app.'.css');
		}
		//主题处理
		$app_less = array('mac','win7','win10');
		foreach($app_less as $app){
			$this->_less_make($path.'skin_dev/'.$app.'.less',$path.'/skin/'.$app.'.css');
		}
		//编译metro多主题
		$app_less = array("metro","metro_green","metro_purple","metro_pink","metro_orange");
		foreach($app_less as $app){
			$temp_path = $path.'skin_dev/metro_temp.less';
			$str = file_get_contents($path.'skin_dev/metro.less');
			$str = str_replace('/*-debug-replace-*/','@main_color:@'.$app.';',$str);
			file_put_contents($temp_path,$str);                                                                                                            
			$this->_less_make($temp_path,$path.'/skin/'.$app.'.css');
			del_file($temp_path);
		}

		//编译透明多主题
		$app_less = array("alpha_image","alpha_image_sun","alpha_image_sky","diy");
		foreach($app_less as $app){
			$temp_path = $path.'skin_dev/alpha_image_temp.less';
			$str = file_get_contents($path.'skin_dev/alpha_image.less');
			$str = str_replace('/*-debug-replace-*/','@background_image:@'.$app.';',$str);
			file_put_contents($temp_path,$str);
			$this->_less_make($temp_path,$path.'/skin/'.$app.'.css');
			del_file($temp_path);
		}
	}

	function _fileInit(){
		mk_dir($this->path_release);
		$this->log('<br/>开始复制文件');
		copy_dir($this->path_app, $this->path_release);
		copy($this->path_app.'/lib/update_dev.php',$this->path_release.'/lib/update.php');
		$this->log('<br/>复制文件成功，开始清除调试相关信息<hr/>');
		$this->log($this->path_app.'<br/>'.$this->path_release);
	}
	// 删除
	function _remove(){
		system('find '.$this->path_release.' -name ".DS_Store" -depth -exec rm {} \;');
		system('find '.$this->path_release.' -name "__MACOSX" -depth -exec rm {} \;');
		$file_list = array(
			$this->path_release.'/data/system/install.lock',
			$this->path_release.'/config/setting_user.php',
			$this->path_release.'/lib/class/lessc.inc.class.php',
			$this->path_release.'/static/js/_dev/main.js',
			$this->path_release.'/static/js/app/main.js',
			$this->path_release.'/static/js/lib/webuploader/webuploader.js',
			$this->path_release.'/static/js/lib/ace/kod_change.md',
			$this->path_release.'/static/js/lib/ace/api.url',
			$this->path_release.'/static/js/lib/less.min.js',
			$this->path_release.'/.gitignore',
			$this->path_release.'/controller/debug.class.php',
		);
		$path_list = array(
			$this->path_release.'/.git',
			$this->path_release.'/.DS_Store',
			$this->path_release.'/data',
			$this->path_release.'/static/style/skin_dev',
			$this->path_release.'/lib/language',
			$this->path_release.'/static/js/_dev',
			$this->path_release.'/static/js/build',
			$this->path_release.'/lib/plugins/officeView',

			$this->path_release.'/static/js/app/src/edit/tpl',
			$this->path_release.'/static/js/app/src/explorer/tpl',
			$this->path_release.'/static/js/app/src/explorer_wap/tpl',
			$this->path_release.'/static/js/app/src/setting/page',
			$this->path_release.'/static/js/app/src/setting/system',
		);
		foreach($file_list as $val){
			del_file($val);
		}
		$this->log('<br/>1.文件删除完成：');
		foreach($path_list as $val){
			del_dir($val);
		}

		$this->log('<br/>2.文件夹删除完成：');
		$this->log('<br/>3.less文件删除完成<hr/>');
	}

	function make_path($path,$index=true){
		mk_dir($path);
		if($index){
			touch($path.'/index.html');
		}
	}

	// php文件加密
	function _php_encode(){
		include(BASIC_PATH.'../doc/tools/spider.class.php');
		include(BASIC_PATH.'../doc/tools/enPhp.php');

		$path_from  = $this->path_app;
		$path_to    = '/Library/WebServer/Documents/localhost/self/kod/release/';
		$files      = array(
			'lib/class/.cache_data',
			'controller/util.php',

			// 'controller/user.class.php',
			// 'controller/explorer.class.php',
			// 'controller/system_group.class.php',
			// 'controller/system_member.class.php',
			// 'controller/system_role.class.php',
		);


		$check_url = "http://localhost/self/kod/release/";
		foreach ($files as $file) {
			$hide  = $file=='lib/class/.cache_data'?true:false;			
			$times = 0;$time_max = 10;
			enphpPost::encode($path_from.$file,$path_to.$file,$hide);
			while(!check_encode($check_url,$path_to) && $times<$time_max){
				enphpPost::encode($path_from.$file,$path_to.$file,$hide);
				$times++;
			}
		}

		//在上个release版本中测试加密后的正确性
		$path_move_to = $this->path_release.'/';
		foreach ($files as $file) {
			rename($path_to.$file,$path_move_to.$file);
		}
	}

	// 删除less相关信息
	function _fileReplace(){
		$template = $this->path_release.'/template/';
		$file_list = array(
			$template.'app/index.php',
			$template.'desktop/index.php',
			$template.'editor/edit.php',
			$template.'editor/editor.php',
			$template.'explorer/index.php',
			$template.'setting/index.php',

			$template.'share/edit.php',
			$template.'share/editor.php',
			$template.'share/explorer.php',
			$template.'share/file.php',
			$template.'share/tips.php',
		);
		foreach($file_list as $val){
			$content = file_get_contents($val);
			$content = str_replace("<?php if(STATIC_LESS == 'css'){ ?>",'',$content);
			$content = str_replace("<?php echo STATIC_JS;?>",'app',$content);
			$content = preg_replace('/<\?php }else{\/\/less_compare_online \?>.*<\?php } \?>/isU','',$content);

			file_put_contents($val,$content);
			$this->log('<br/>template file：'.$val.' success');
		}

		$file = $this->path_release.'/config/config.php';
		$content = file_get_contents($file);
		$content = str_replace("define('GLOBAL_DEBUG',1);","define('GLOBAL_DEBUG',0);",$content);
		file_put_contents($file,$content);

		//update version
		$file = $this->path_release.'/lib/update_dev.php';
		$content = file_get_contents($file);
		$content = str_replace("define('UPDATE_VERSION','');","define('UPDATE_VERSION','".KOD_VERSION."');",$content);
		file_put_contents($file,$content);
	}

	function _initUserData(){
		$this->log('<br/>初始化用户数据');
		$app = '<?php exit;?>{"\u6c34\u679c\u5fcd\u8005":{"type":"url","content":"http:\/\/ucren.com\/demos\/fruit-ninja\/","group":"game","name":"\u6c34\u679c\u5fcd\u8005","desc":"\u6c34\u679c\u5fcd\u8005 html5\u7248","icon":"fruite.jpg","width":"640","height":"565","simple":0,"resize":1},"\u7f8e\u56fe\u79c0\u79c0":{"type":"url","content":"http:\/\/xiuxiu.web.meitu.com\/baidu\/","group":"tools","name":"\u7f8e\u56fe\u79c0\u79c0","desc":"","icon":"meitu.gif","width":"800","height":"570","simple":0,"resize":1},"\u6709\u9053\u8bcd\u5178":{"type":"url","content":"http:\/\/dict.youdao.com\/app\/baidu","group":"tools","name":"\u6709\u9053\u8bcd\u5178","desc":"","icon":"youdao.jpg","width":"548","height":"490","simple":0,"resize":1},"\u97f3\u60a6\u53f0":{"type":"url","content":"http:\/\/www.yinyuetai.com\/baidu\/index?bd_user=855814346&bd_sig=cac8830f2b6a731ab596413768b4606b&canvas_pos=platform","group":"movie","name":"\u97f3\u60a6\u53f0","desc":"\u97f3\u60a6\u53f0","icon":"yingyuetai.png","width":"798","height":"450","simple":0,"resize":1},"\u9177\u72d7\u7535\u53f0":{"type":"url","content":"http:\/\/topic.kugou.com\/radio\/baiduNew.htm","group":"music","name":"\u9177\u72d7\u7535\u53f0","desc":"\u9177\u72d7\u7535\u53f0","icon":"kugou_radio.png","width":"554","height":"432","simple":0,"resize":1},"\u641c\u72d0\u5f71\u89c6":{"type":"url","content":"http:\/\/tv.sohu.com\/upload\/sohuapp\/index.html?api_key=9ca7e3cdef8af010b947f4934a427a2c","group":"movie","name":"\u641c\u72d0\u5f71\u89c6","desc":"\u641c\u72d0\u5f71\u89c6","icon":"souhu.jpg","width":"798","height":"583","simple":0,"resize":1},"\u683c\u6797\u7ae5\u8bdd":{"type":"url","content":"http:\/\/www.youban.com\/bdapp\/mp3\/geling.html","group":"reader","name":"\u683c\u6797\u7ae5\u8bdd","desc":"\u683c\u6797\u7ae5\u8bdd","icon":"geling.jpg","width":"728","height":"520","simple":0,"resize":1},"\u7f8e\u98df\u5929\u4e0b":{"type":"url","content":"http:\/\/home.meishichina.com\/app2baidu.php","group":"life","name":"\u7f8e\u98df\u5929\u4e0b","desc":"\u7f8e\u98df\u5929\u4e0b\u7f51\u7ad9\u51fa\u54c1\u7684\u4f18\u79c0\u83dc\u8c31\u5927\u5168\uff0c\u7cbe\u7f8e\u7684\u6210\u54c1\u56fe\uff0c\u8fd8\u6709\u8d85\u5b9e\u7528\u7684\u56fe\u6587\u5206\u6b65\u8be6\u89e3","icon":"meishi.png","width":"547","height":"590","simple":0,"resize":1},"pptv\u76f4\u64ad":{"type":"url","content":"http:\/\/app.aplus.pptv.com\/tgapp\/baidu\/live\/main","group":"movie","name":"pptv\u76f4\u64ad","desc":"","icon":"pptv.jpg","width":"798","height":"534","simple":0,"resize":1},"ps":{"type":"url","content":"http:\/\/www.webps.cn\/","group":"tools","name":"ps","desc":"ps","icon":"ps.png","width":"800","height":"560","simple":0,"resize":1},"iqiyi\u5f71\u89c6":{"type":"url","content":"http:\/\/www.qiyi.com\/mini\/baidu.html?from115","group":"movie","name":"iqiyi\u5f71\u89c6","desc":"iqiyi\u5f71\u89c6","icon":"iqiyi.png","width":"1000","height":"643","simple":0,"resize":1},"\u867e\u7c73\u7535\u53f0":{"type":"url","content":"http:\/\/kuang.xiami.com\/kuang\/play\/xiamiradio","group":"music","name":"\u867e\u7c73\u7535\u53f0","desc":"\u867e\u7c73\u7535\u53f0","icon":"xiami.jpg","width":"530","height":"282","simple":0,"resize":1},"\u65f6\u949f":{"type":"url","content":"http:\/\/hoorayos.com\/demo\/extapp\/clock\/index.php","group":"tools","name":"\u65f6\u949f","desc":"\u65f6\u949f\u6302\u4ef6","icon":"time.png","width":"140","height":"140","simple":1,"resize":0},"365\u65e5\u5386":{"type":"url","content":"http:\/\/baidu365.duapp.com\/wnl.html?bd_user=855814346&bd_sig=a64e6e262e8cfa1c42dd716617be2102&canvas_pos=platform","group":"life","name":"365\u65e5\u5386","desc":"365\u65e5\u5386","icon":"365.png","width":"544","height":"440","simple":0,"resize":1},"\u8c46\u74e3\u7535\u53f0":{"type":"url","content":"http:\/\/douban.fm\/partner\/qq_plus","group":"music","name":"\u8c46\u74e3\u7535\u53f0","desc":"\u8c46\u74e3\u7535\u53f0","icon":"douban.png","width":"545","height":"460","simple":0,"resize":1},"\u5feb\u9012\u67e5\u8be2":{"type":"url","content":"http:\/\/baidu.kuaidi100.com\/index2.html","group":"tools","name":"\u5feb\u9012\u67e5\u8be2","desc":"","icon":"kuaidi.gif","width":"545","height":"420","simple":0,"resize":1},"\u9ed18\u5bf9\u51b3":{"type":"url","content":"http:\/\/swf.baoku.360.cn\/swf\/20110921\/1\/ball.swf","group":"game","name":"\u9ed18\u5bf9\u51b3","desc":"\u7ecf\u5178\u53f0\u7403","icon":"ball8.png","width":"650","height":"500","simple":0,"resize":1},"kugou":{"type":"url","content":"http:\/\/web.kugou.com\/hao123.html","group":"music","name":"kugou","desc":"\u9177\u72d7","icon":"kugou2.png","width":"740","height":"505","simple":0,"resize":1},"\u5929\u5929\u52a8\u542cFM":{"type":"url","content":"http:\/\/fm.dongting.com","group":"music","name":"\u5929\u5929\u52a8\u542cFM","desc":"\u5929\u5929\u52a8\u542cFM","icon":"ttpod.png","width":"630","height":"530","simple":0,"resize":1},"\u767e\u5ea6\u968f\u5fc3\u542c":{"type":"url","content":"http:\/\/fm.baidu.com\/?embed=hao123","group":"music","name":"\u767e\u5ea6\u968f\u5fc3\u542c","desc":"\u767e\u5ea6\u968f\u5fc3\u542c","icon":"baidu.png","width":"980","height":"550","simple":0,"resize":1},"icloud":{"type":"app","content":"window.open(\"https:\/\/www.icloud.com\/\");","group":"others","name":"icloud","desc":"icloud","icon":"icloud.png","width":"800","height":"600","simple":0,"resize":1},"\u8ba1\u7b97\u5668":{"type":"url","content":"http:\/\/tools.jb51.net\/static\/skin\/flash\/773460494c0e2274d5f07e568fadf8e0.swf","group":"tools","name":"\u8ba1\u7b97\u5668","desc":"\u8ba1\u7b97\u5668","icon":"calcu.png","width":"538","height":"600","simple":0,"resize":1},"\u5929\u6c14":{"type":"url","content":"http:\/\/hoorayos.com\/demo\/extapp\/weather\/index.php","group":"tools","name":"\u5929\u6c14","desc":"\u5929\u6c14\u9884\u62a5","icon":"weather.png","width":"200","height":"300","simple":1,"resize":0},"js\u5728\u7ebf\u538b\u7f29":{"type":"url","content":"http:\/\/tool.lu\/js\/","group":"others","name":"js\u5728\u7ebf\u538b\u7f29","desc":"js\u5728\u7ebf\u538b\u7f29","icon":"js.png","width":"860","height":"620","simple":0,"resize":1},"\u4e2d\u56fd\u8c61\u68cb":{"type":"url","content":"http:\/\/sda.4399.com\/4399swf\/upload_swf\/ftp14\/cwb\/20140401\/y2.swf","group":"game","name":"\u4e2d\u56fd\u8c61\u68cb","desc":"\u4e2d\u56fd\u8c61\u68cb","icon":"xiangqi.jpg","width":"650","height":"502","simple":0,"resize":1},"\u5730\u56fe":{"type":"url","content":"http:\/\/map.baidu.com\/","group":"life","name":"\u5730\u56fe","desc":"\u5730\u56fe","icon":"map.png","width":"800","height":"600","simple":0,"resize":1,"undefined":0}}';
		$role = '<?php exit;?>{"1":{"name":"Administrator","ext_not_allow":"","explorer:mkdir":0,"explorer:mkfile":0,"explorer:pathRname":0,"explorer:pathDelete":0,"explorer:zip":0,"explorer:unzip":0,"explorer:pathCopy":0,"explorer:pathChmod":0,"explorer:pathCute":0,"explorer:pathCuteDrag":0,"explorer:pathCopyDrag":0,"explorer:clipboard":0,"explorer:pathPast":0,"explorer:pathInfo":0,"explorer:serverDownload":0,"explorer:fileUpload":0,"explorer:search":0,"explorer:pathDeleteRecycle":0,"explorer:fileDownload":0,"explorer:zipDownload":0,"explorer:fileDownloadRemove":0,"explorer:fileProxy":0,"explorer:officeView":0,"explorer:officeSave":0,"app:user_app":0,"app:init_app":0,"app:add":0,"app:edit":0,"app:del":0,"user:changePassword":0,"editor:fileGet":0,"editor:fileSave":0,"userShare:set":0,"userShare:del":0,"setting:set":0,"setting:system_setting":0,"setting:php_info":0,"fav:add":0,"fav:del":0,"fav:edit":0,"system_member:get":0,"system_member:add":0,"system_member:do_action":0,"system_member:edit":0,"system_group:get":0,"system_group:add":0,"system_group:del":0,"system_group:edit":0,"system_role:add":0,"system_role:del":0,"system_role:edit":0},"2":{"name":"default","ext_not_allow":"php|jsp|html","explorer:mkdir":1,"explorer:mkfile":1,"explorer:pathRname":1,"explorer:pathDelete":1,"explorer:zip":1,"explorer:unzip":1,"explorer:pathCopy":1,"explorer:pathChmod":0,"explorer:pathCute":1,"explorer:pathCuteDrag":1,"explorer:pathCopyDrag":0,"explorer:clipboard":1,"explorer:pathPast":1,"explorer:pathInfo":1,"explorer:serverDownload":1,"explorer:fileUpload":1,"explorer:search":1,"explorer:pathDeleteRecycle":0,"explorer:fileDownload":1,"explorer:zipDownload":0,"explorer:fileDownloadRemove":0,"explorer:fileProxy":0,"explorer:officeView":0,"explorer:officeSave":0,"app:user_app":1,"app:init_app":0,"app:add":0,"app:edit":0,"app:del":0,"user:changePassword":1,"editor:fileGet":0,"editor:fileSave":1,"userShare:set":1,"userShare:del":1,"setting:set":1,"setting:system_setting":0,"setting:php_info":0,"fav:add":1,"fav:del":1,"fav:edit":1,"system_member:get":0,"system_member:add":0,"system_member:do_action":0,"system_member:edit":0,"system_group:get":0,"system_group:add":0,"system_group:del":0,"system_group:edit":0,"system_role:add":0,"system_role:del":0,"system_role:edit":0},"100":{"name":"guest","ext_not_allow":"php|jsp|html","explorer:mkdir":0,"explorer:mkfile":0,"explorer:pathRname":0,"explorer:pathDelete":0,"explorer:zip":0,"explorer:unzip":0,"explorer:pathCopy":0,"explorer:pathChmod":0,"explorer:pathCute":0,"explorer:pathCuteDrag":0,"explorer:pathCopyDrag":0,"explorer:clipboard":0,"explorer:pathPast":0,"explorer:pathInfo":0,"explorer:serverDownload":0,"explorer:fileUpload":0,"explorer:search":1,"explorer:pathDeleteRecycle":0,"explorer:fileDownload":0,"explorer:zipDownload":0,"explorer:fileDownloadRemove":0,"explorer:fileProxy":0,"explorer:officeView":0,"explorer:officeSave":0,"app:user_app":0,"app:init_app":0,"app:add":0,"app:edit":0,"app:del":0,"user:changePassword":0,"editor:fileGet":0,"editor:fileSave":0,"userShare:set":0,"userShare:del":0,"setting:set":0,"setting:system_setting":0,"setting:php_info":0,"fav:add":0,"fav:del":0,"fav:edit":0,"system_member:get":0,"system_member:add":0,"system_member:do_action":0,"system_member:edit":0,"system_group:get":0,"system_group:add":0,"system_group:del":0,"system_group:edit":0,"system_role:add":0,"system_role:del":0,"system_role:edit":0}}';
		

		$group = '<?php exit;?>{"1":{"group_id":1,"name":"public","parent_id":"","children":"","config":{"size_max":0,"size_use":0},"path":"public","create_time":""}}';
		$user = '<?php exit;?>{"1":{"user_id":"1","name":"admin","password":"21232f297a57a5a743894a0e4a801fc3","role":"1","config":{"size_max":1,"size_use":5369},"group_info":{"1":"write"},"path":"admin","status":1,"create_time":"","size_max":"1","last_login":""},"100":{"user_id":"100","name":"demo","password":"fe01ce2a7fbac8fafaed7c982a04e229","role":"2","config":{"size_max":5,"size_use":1048576},"group_info":{"1":"write"},"path":"demo","status":1,"last_login":"","create_time":""},"101":{"user_id":"101","name":"guest","password":"084e0343a0486ff05530df6c705c8bb4","role":"100","config":{"size_max":0.1,"size_use":1048576},"group_info":{"1":"read"},"path":"guest","status":1,"last_login":"","create_time":""}}';
		
		$this->make_path($this->path_release.'/data/User');
		$this->make_path($this->path_release.'/data/Group');
		$this->make_path($this->path_release.'/data/temp');
		$this->make_path($this->path_release.'/data/temp/thumb');
		$this->make_path($this->path_release.'/data/session');
		$this->make_path($this->path_release.'/data/system/');
		file_put_contents($this->path_release.'/data/system/apps.php',$app);
		file_put_contents($this->path_release.'/data/system/system_role.php',$role);
		file_put_contents($this->path_release.'/data/system/system_group.php',$group);
		file_put_contents($this->path_release.'/data/system/system_member.php',$user);
		del_file($this->path_release.'/data/system/system_setting.php');
	}
}


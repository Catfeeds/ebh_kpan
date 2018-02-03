<?php
/*************************************************
 * 
 *
 *该文件对应ebh2项目下的common文件
 *@author eker-hfs
 *****************************************************
 */

function log_message($msg, $level = 'error', $php_error = false) {
	Ebh::app()->getLog()->log($msg, $level, $php_error);
}

/**
 * 返回系统调试信息
 * @param type 是否直接输出信息
 * @return string 返回调试信息字符串
 */
function debug_info($echo = TRUE) {
	if(!GLOBAL_DEBUG)
		return FALSE;
		$cost_time = microtime(TRUE) - EBH_BEGIN_TIME;
		$cost_memory = memory_get_usage(TRUE);
		$cost_memoryinfo = '';
		if ($cost_memory > 1048576) {
			$cost_memoryinfo = round($cost_memory / 1048576, 2) . ' Mbytes';
		} else if ($cost_memory > 1024) {
			$cost_memoryinfo = round($cost_memory / 1024, 2) . ' Kbytes';
		} else {
			$cost_memoryinfo = $cost_memory . ' bytes';
		}
		$query_nums = EBH::app()->getDb()->query_nums;
		$info = 'Processed in ' . $cost_time . ' second(s), ' . $query_nums . ' queries ,Memory Allocate is ' . $cost_memoryinfo;
		if ($echo)
			echo $info;
			else {
				return $info;
			}
}

function geturl($name, $echo = FALSE) {
	if (strpos($name, 'http://') !== FALSE || strpos($name, '.html') !== FALSE) {
		$url = $name;
	} else
		$url = '/' . $name . '.html';
		if ($echo)
			echo $url;
			return $url;
}

/**
 * 获取开发平台登录url
 * 统一到www.ebh.net授权
 * @param unknown $type
 * @param string $returnurl
 */
function getopenloginurl($type,$returnurl='/'){
	$baseurl = "http://www.ebh.net";
	$url = '';
	switch ($type){
		case 'qq':$url=geturl('otherlogin/qq');
		break;
		case 'sina':$url=geturl('otherlogin/sina');
		break;
		case 'wx':$url=geturl('otherlogin/wx');
		break;
	}
	//var_dump($returnurl);
	return $baseurl.$url."?returnurl=".urlencode($returnurl);
}

/**
 * 获取当前域名
 */
function getdomain($url=""){
	$domain = '/';
	if(!empty($url)){
		if(preg_match('/http:\/\/[\w.]+[\w\/]*[\w.]*\??[\w=&\+\%]*/is',$url)==true){
			$arr_url = parse_url($url);
			$domain =  "http://".$arr_url['host'];
		}
	}else{
		$domain = "http://".$_SERVER['HTTP_HOST'];
	}
	return $domain;
}

/**
 * 切割中文字符串， 中文占2个字节，字母占一个字节
 * @param $string 要切割的字符串
 * @param $start 起始位置
 * @param $length 切割长度
 */
function ssubstrch($string, $start = 0, $length = -1) {
	$p = 0;
	$co = 0;
	$c = '';
	$retstr = '';
	$startlen = 0;
	$len = strlen($string);
	$charset = Ebh::app()->output['charset'];
	for ($i = 0; $i < $len; $i ++) {
		if ($length <= 0) {
			break;
		}
		$c = ord($string {$i});
		if ($charset == 'UTF-8') {
			if ($c > 252) {
				$p = 5;
			} elseif ($c > 248) {
				$p = 4;
			} elseif ($c > 240) {
				$p = 3;
			} elseif ($c > 224) {
				$p = 2;
			} elseif ($c > 192) {
				$p = 1;
			} else {
				$p = 0;
			}
		} else {
			if ($c > 127) {
				$p = 1;
			} else {
				$p = 0;
			}
		}
		if ($startlen >= $start) {
			for ($j = 0; $j < $p + 1; $j ++) {
				$retstr .= $string [$i + $j];
			}
			$length -= ($p == 0 ? 1 : 2);
		}
		$i += $p;
		$startlen++;
	}
	return $retstr;
}

/**
 * 按照给定长度截取字符串
 * @param string $str源字符串
 * @param int $length 需要截取的长度
 * @param string $pre，字符串附加的字符，默认为...
 * @return string 返回截取后的字符串
 */
function shortstr($str, $length = 20, $pre = '...') {
	$resultstr = ssubstrch($str, 0, $length);
	return strlen($resultstr) == strlen($str) ? $resultstr : $resultstr . $pre;
}

function authcode($string, $operation, $key = '', $expiry = 0) {
	$authkey = Ebh::app()->security['authkey'];
	$ckey_length = 4; // 随机密钥长度 取值 0-32;
	// 加入随机密钥，可以令密文无任何规律，即便是原文和密钥完全相同，加密结果也会每次不同，增大破解难度。
	// 取值越大，密文变动规律越大，密文变化 = 16 的 $ckey_length 次方
	// 当此值为 0 时，则不产生随机密钥

	$key = md5($key ? $key : $authkey);
	$keya = md5(substr($key, 0, 16));
	$keyb = md5(substr($key, 16, 16));
	$keyc = $ckey_length ? ($operation == 'DECODE' ? substr($string, 0, $ckey_length) : substr(md5(microtime()), -$ckey_length)) : '';

	$cryptkey = $keya . md5($keya . $keyc);
	$key_length = strlen($cryptkey);

	$string = $operation == 'DECODE' ? base64_decode(substr($string, $ckey_length)) : sprintf('%010d', $expiry ? $expiry + time() : 0) . substr(md5($string . $keyb), 0, 16) . $string;
	$string_length = strlen($string);
	$result = '';
	$box = range(0, 255);
	$rndkey = array();
	for ($i = 0; $i <= 255; $i++) {
		$rndkey[$i] = ord($cryptkey[$i % $key_length]);
	}

	for ($j = $i = 0; $i < 256; $i++) {
		$j = ($j + $box[$i] + $rndkey[$i]) % 256;
		$tmp = $box[$i];
		$box[$i] = $box[$j];
		$box[$j] = $tmp;
	}

	for ($a = $j = $i = 0; $i < $string_length; $i++) {
		$a = ($a + 1) % 256;
		$j = ($j + $box[$a]) % 256;
		$tmp = $box[$a];
		$box[$a] = $box[$j];
		$box[$j] = $tmp;
		$result .= chr(ord($string[$i]) ^ ($box[($box[$a] + $box[$j]) % 256]));
	}
	if ($operation == 'DECODE') {
		if ((substr($result, 0, 10) == 0 || substr($result, 0, 10) - time() > 0) && substr($result, 10, 16) == substr(md5(substr($result, 26) . $keyb), 0, 16)) {
			return substr($result, 26);
		} else {
			return '';
		}
	} else {
		return $keyc . str_replace('=', '', base64_encode($result));
	}
}

/**
 * 根据原始图片文件,获取缩略图路径
 * 例子：getthumb('http://www.ebanhui.com/images_avater/2014/01/23/1390475735.jpg','120_120');则返回 http://www.ebanhui.com/images_avater/2014/01/23/1390475735_120_120.jp
 * @param string $imageurl	原始图片的路径
 * @param string $size	获取的规格大小  用"_"分隔开
 * @param string $defaulturl Description
 */
function getthumb($imageurl, $size, $defaulturl = '') {
	if(empty($imageurl))
		return $defaulturl;
		$ipos = strrpos($imageurl, '.');
		if ($ipos === FALSE)
			return $imageurl;
			$newimagepath = substr($imageurl, 0, $ipos) . '_' . $size . substr($imageurl, $ipos);
			return $newimagepath;
}

//生成随机字符串或数字
function random($length, $numeric = 0) {
	PHP_VERSION < '4.2.0' ? mt_srand((double) microtime() * 1000000) : mt_srand();
	$seed = base_convert(md5(print_r($_SERVER, 1) . microtime()), 16, $numeric ? 10 : 35);
	$seed = $numeric ? (str_replace('0', '', $seed) . '012340567890') : ($seed . 'zZ' . strtoupper($seed));
	$hash = '';
	$max = strlen($seed) - 1;
	for ($i = 0; $i < $length; $i++) {
		$hash .= $seed[mt_rand(0, $max)];
	}
	return $hash;
}

/**
 * 解析querystring字符串作为查询参数数组返回
 * @return array
 */
function parsequery() {
	$queryarray = array();
	$uri = Ebh::app()->getUri();
	$queryarray['pagesize'] = 20;
	$queryarray['page'] = $uri->page;
	$queryarray['sortmode'] = $uri->sortmode;
	$queryarray['viewmode'] = $uri->viewmode;
	$queryarray['q'] = htmlspecialchars(Ebh::app()->getInput()->get('q'));
	return $queryarray;
}

/**
 * 获取分页html代码
 * @param int $listcount总记录数
 * @param int $pagesize分页大小
 * @return string
 */
function show_page($listcount, $pagesize = 20) {
	if(is_numeric($listcount)&& is_numeric($pagesize) == false){
		echo 'function show_page param should be numeric!';
		exit(0);
	}
	$pagecount = @ceil($listcount / $pagesize);
	$uri = Ebh::app()->getUri();
	$curpage = $uri->page;
	$prefixlink = '/' . $uri->codepath;
	if (!empty($uri->itemid))
		$prefixlink .= '/' . $uri->itemid;
		$prefixlink .= '-';
		$suffixlink = '-' . $uri->sortmode . '-' . $uri->viewmode;
		if (!empty($uri->attribarr))
			$suffixlink .= '-' . implode('-', $uri->attribarr);
			$suffixlink .= '.html';
			$query_string = $uri->uri_query_string();
			if (!empty($query_string))
				$suffixlink .= '?' . $query_string;
				if ($curpage > $pagecount) {
					$curpage = $pagecount;
				}
				if ($curpage < 1) {
					$curpage = 1;
				}
				//这里写前台的分页
				$centernum = 10; //中间分页显示链接的个数
				$multipage = '<div class="pages"><div class="listPage">';
				if ($pagecount <= 1) {
					$back = '';
					$next = '';
					$center = '';
					//   $gopage = '';
				} else {
					$back = '';
					$next = '';
					$center = '';
					//     $gopage = '<input id="gopage" maxpage="' . $pagecount . '" onblur="if($(this).val()>' . $pagecount . '){$(this).val(' .
					//  $pagecount . ')}" type="text" size="3" value="" onfocus="this.select();"  onkeyup="this.value=this.value.replace(/\D/g,\'\')" //onafterpaste="this.value=this.value.replace(/\D/g,\'\')"><a id="page_go" href="###"  onclick="window.location.href=\'' .
					//  $prefixlink . '\'+$(this).prev(\'#gopage\').val()+\'' . $suffixlink . '\'">跳转</a>';
					if ($curpage == 1) {
						for ($i = 1; $i <= $centernum; $i++) {
							if ($i > $pagecount) {
								break;
							}
							if ($i != $curpage) {
								$center .= '<a href="' . $prefixlink . ($i) . $suffixlink . '">' . $i . '</a>';
							} else {
								$center .= '<a class="none">' . $i . '</a>';
							}
						}
						$next .= '<a href="' . $prefixlink . ($curpage + 1) . $suffixlink . '" id="next">下一页&gt;&gt;</a>';
					} elseif ($curpage == $pagecount) {
						$back .= '<a href="' . $prefixlink . ($curpage - 1) . $suffixlink . '" id="next">&lt;&lt;上一页</a>';
						for ($i = $pagecount - $centernum + 1; $i <= $pagecount; $i++) {
							if ($i < 1) {
								$i = 1;
							}
							if ($i != $curpage) {
								$center .= '<a href="' . $prefixlink . $i . $suffixlink . '">' . $i . '</a>';
							} else {
								$center .= '<a class="none">' . $i . '</a>';
							}
						}
					} else {
						$back .= '<a href="' . $prefixlink . ($curpage - 1) . $suffixlink . '" id="next">&lt;&lt;上一页</a>';
						$left = $curpage - floor($centernum / 2);
						$right = $curpage + floor($centernum / 2);
						if ($left < 1) {
							$left = 1;
							$right = $centernum < $pagecount ? $centernum : $pagecount;
						}
						if ($right > $pagecount) {
							$left = $centernum < $pagecount ? ($pagecount - $centernum + 1) : 1;
							$right = $pagecount;
						}
						for ($i = $left; $i <= $right; $i++) {
							if ($i != $curpage) {
								$center .= '<a href="' . $prefixlink . $i . $suffixlink . '">' . $i . '</a>';
							} else {
								$center .= '<a class="none">' . $i . '</a>';
							}
						}
						$next .= '<a href="' . $prefixlink . ($curpage + 1) . $suffixlink . '" id="next">下一页&gt;&gt;</a>';
					}
				}
				$multipage .= $back . $center . $next . '</div></div>';
				//    $multipage .= '<script type="text/javascript">' . "\n"
				//            . '$(function(){' . "\n"
				//			. '$("#gopage").keypress(function(e){' . "\n"
				//            . 'if (e.which == 13){' . "\n"
				//            . '$(this).next("#page_go").click()' . "\n"
				//            . 'cancelBubble(this,e);' . "\n"
				//            . '}' . "\n"
				//            . '})' . "\n"
				//            . '})</script>';
				return $multipage;

}

/**
 * 获取分页html代码
 * @param int $listcount总记录数
 * @param int $pagesize分页大小
 * @return string
 */
function ajaxpage($listcount, $pagesize = 20, $curpage = 1) {
	$pagecount = @ceil($listcount / $pagesize);
	$uri = Ebh::app()->getUri();
	$curpage = $curpage;
	$prefixlink = '/' . $uri->codepath;
	if (!empty($uri->itemid))
		$prefixlink .= '/' . $uri->itemid;
		$prefixlink .= '-';
		$suffixlink = '-' . $uri->sortmode . '-' . $uri->viewmode;
		if (!empty($uri->attribarr))
			$suffixlink .= '-' . implode('-', $uri->attribarr);
			$suffixlink .= '.html';
			$query_string = $uri->uri_query_string();
			if (!empty($query_string))
				$suffixlink .= '?' . $query_string;
				if ($curpage > $pagecount) {
					$curpage = $pagecount;
				}
				if ($curpage < 1) {
					$curpage = 1;
				}
				//这里写前台的分页
				$centernum = 10; //中间分页显示链接的个数
				$multipage = '<div class="pages"><div class="listPage">';
				if ($pagecount <= 1) {
					$back = '';
					$next = '';
					$center = '';
					//   $gopage = '';
				} else {
					$back = '';
					$next = '';
					$center = '';
					//     $gopage = '<input id="gopage" maxpage="' . $pagecount . '" onblur="if($(this).val()>' . $pagecount . '){$(this).val(' .
					//  $pagecount . ')}" type="text" size="3" value="" onfocus="this.select();"  onkeyup="this.value=this.value.replace(/\D/g,\'\')" //onafterpaste="this.value=this.value.replace(/\D/g,\'\')"><a id="page_go" href="###"  onclick="window.location.href=\'' .
					//  $prefixlink . '\'+$(this).prev(\'#gopage\').val()+\'' . $suffixlink . '\'">跳转</a>';
					if ($curpage == 1) {
						for ($i = 1; $i <= $centernum; $i++) {
							if ($i > $pagecount) {
								break;
							}
							if ($i != $curpage) {
								$center .= '<a data="' . $prefixlink . ($i) . $suffixlink . '">' . $i . '</a>';
							} else {
								$center .= '<a class="none">' . $i . '</a>';
							}
						}
						$next .= '<a data="' . $prefixlink . ($curpage + 1) . $suffixlink . '" id="next">下一页&gt;&gt;</a>';
					} elseif ($curpage == $pagecount) {
						$back .= '<a data="' . $prefixlink . ($curpage - 1) . $suffixlink . '" id="next">&lt;&lt;上一页</a>';
						for ($i = $pagecount - $centernum + 1; $i <= $pagecount; $i++) {
							if ($i < 1) {
								$i = 1;
							}
							if ($i != $curpage) {
								$center .= '<a data="' . $prefixlink . $i . $suffixlink . '">' . $i . '</a>';
							} else {
								$center .= '<a class="none">' . $i . '</a>';
							}
						}
					} else {
						$back .= '<a data="' . $prefixlink . ($curpage - 1) . $suffixlink . '" id="next">&lt;&lt;上一页</a>';
						$left = $curpage - floor($centernum / 2);
						$right = $curpage + floor($centernum / 2);
						if ($left < 1) {
							$left = 1;
							$right = $centernum < $pagecount ? $centernum : $pagecount;
						}
						if ($right > $pagecount) {
							$left = $centernum < $pagecount ? ($pagecount - $centernum + 1) : 1;
							$right = $pagecount;
						}
						for ($i = $left; $i <= $right; $i++) {
							if ($i != $curpage) {
								$center .= '<a data="' . $prefixlink . $i . $suffixlink . '">' . $i . '</a>';
							} else {
								$center .= '<a class="none">' . $i . '</a>';
							}
						}
						$next .= '<a data="' . $prefixlink . ($curpage + 1) . $suffixlink . '" id="next">下一页&gt;&gt;</a>';
					}
				}
				$multipage .= $back . $center . $next . '</div></div>';
				return $multipage;
}

/**
 * 输出二进制文件
 * @param string $type 输出的文件类型项，此值必须与upconfig对应的项相同
 * @param string $filepath文件保存的相对路径，通过upconfig的savepath可找到绝对路径
 * @param string $filename文件输出的显示名称
 * @param boolean $octet文件是否为二进制流输出
 */
function getfile($type = 'course', $filepath, $filename, $octet = false) {
	$_UP = Ebh::app()->getConfig()->load('upconfig');
	$realpath = $_UP[$type]['savepath'] . $filepath;
	$showpath = $_UP[$type]['showpath'];
	if (!file_exists($realpath)) {
		log_message('文件不存在'.$realpath);
	} else {
		$ext = strtolower(substr($filename, strrpos($filename, '.') + 1));
		if ($type != 'course' && $type != 'note') {
			$fname = $filename;
			if (strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') || stripos($_SERVER['HTTP_USER_AGENT'], 'trident')) {
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
/**
 * 删除文件
 * @param string $type 删除的文件类型项，此值必须与upconfig对应的项相同
 * @param string $filepath文件相对路径，与upconfig的savepath组合起来即为实际路径
 */
function delfile($type = 'course', $filepath) {
	$_UP = Ebh::app()->getConfig()->load('upconfig');
	$realpath = $_UP[$type]['savepath'] . $filepath;
	if (file_exists($realpath)) {
		@unlink($realpath);
	}
}

//编码转换
function myiconv($str) {
	global $_SC;
	if(EBH::app()->output['charset']!='utf-8'){
		if(is_array($str)){
			foreach($str as $key=>$value){
				$str[$key] = myiconv($value);
			}
		}else{
			$encode = mb_detect_encoding($str, array('UTF-8','EUC-CN'));
			if ($_SC['db']['dbtype']=='mssql' && $encode != 'EUC-CN') {
				$str = iconv('UTF-8', 'GBK', $str);
			}
		}
	}
	return $str;
}

//safeHtml函数的辅助函数
function _filter(&$v,$k,$special){
	if(in_array($k,$special)){
		return ;
	}
	$v=h(remove_xss($v));
}
/**
 * 将特殊字符转成 HTML 格式。
 **
 * @param string $value - 字符串或者数组
 * @param array $value - 数组,用来排除过滤的字段键值
 * @return array
 */
function safeHtml($msg = null,$special=array()){
	if(is_null($msg)){
		return '';
	}else{
		if(is_array($msg)){
			array_walk_recursive($msg,'_filter',$special);
			return $msg;
		}else{
			return _filter($msg);
		}
		 
	}
}
//传入分类列表，处理出树形结构函数
function getTree($arr = array(),$upid=0,$index=0){
	$tree = array();
	foreach ($arr as $value) {

		if($value['upid']==$upid){
			$value['name'] = str_repeat('┣━', $index).$value['name'];
			$tree[] = $value;
			$tree = array_merge($tree,getTree($arr,$value['catid'],$index+1));
		}
	}
	return $tree;
}

//传入position值返回position名
function getPosition($position){
	$positionArr = array('未指定','页头栏目','页脚栏目','顶部栏目','云平台栏目','答疑分类');
	if(intval($position)>5){
		return '警告:外来侵入!';
	}
	return $positionArr[intval($position)];
}

//表单字段验证
function checkFormColumn($receive,$rules){
	if(!is_array($receive)||!is_array($rules)){
		return false;
	}else{
		if((count($receive,1)==count($rules))&&(!array_diff_key($receive,$rules))){
			return true;
		}else{
			return false;
		}
	}
}
function remove_xss($val) {
	// remove all non-printable characters. CR(0a) and LF(0b) and TAB(9) are allowed
	// this prevents some character re-spacing such as <java\0script>
	// note that you have to handle splits with \n, \r, and \t later since they *are* allowed in some inputs
	// $val = preg_replace('/([\x00-\x08,\x0b-\x0c,\x0e-\x19])/', '', $val);

	// straight replacements, the user should never need these since they're normal characters
	// this prevents like <IMG SRC=@avascript:alert('XSS')>
	$search = 'abcdefghijklmnopqrstuvwxyz';
	$search .= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$search .= '1234567890!@#$%^&*()';
	$search .= '~`";:?+/={}[]-_|\'\\';
	for ($i = 0; $i < strlen($search); $i++) {
		// ;? matches the ;, which is optional
		// 0{0,7} matches any padded zeros, which are optional and go up to 8 chars

		// @ @ search for the hex values
		$val = preg_replace('/(&#[xX]0{0,8}'.dechex(ord($search[$i])).';?)/i', $search[$i], $val); // with a ;
		// @ @ 0{0,7} matches '0' zero to seven times
		$val = preg_replace('/(&#0{0,8}'.ord($search[$i]).';?)/', $search[$i], $val); // with a ;
	}

	// now the only remaining whitespace attacks are \t, \n, and \r
	$ra1 = array('javascript', 'vbscript', 'expression', 'applet', 'meta', 'xml', 'blink', 'link', 'style', 'script', 'embed', 'object', 'iframe', 'frame', 'frameset', 'ilayer', 'layer', 'bgsound', 'title', 'base');
	$ra2 = array('onabort', 'onactivate', 'onafterprint', 'onafterupdate', 'onbeforeactivate', 'onbeforecopy', 'onbeforecut', 'onbeforedeactivate', 'onbeforeeditfocus', 'onbeforepaste', 'onbeforeprint', 'onbeforeunload', 'onbeforeupdate', 'onblur', 'onbounce', 'oncellchange', 'onchange', 'onclick', 'oncontextmenu', 'oncontrolselect', 'oncopy', 'oncut', 'ondataavailable', 'ondatasetchanged', 'ondatasetcomplete', 'ondblclick', 'ondeactivate', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave', 'ondragover', 'ondragstart', 'ondrop', 'onerror', 'onerrorupdate', 'onfilterchange', 'onfinish', 'onfocus', 'onfocusin', 'onfocusout', 'onhelp', 'onkeydown', 'onkeypress', 'onkeyup', 'onlayoutcomplete', 'onload', 'onlosecapture', 'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel', 'onmove', 'onmoveend', 'onmovestart', 'onpaste', 'onpropertychange', 'onreadystatechange', 'onreset', 'onresize', 'onresizeend', 'onresizestart', 'onrowenter', 'onrowexit', 'onrowsdelete', 'onrowsinserted', 'onscroll', 'onselect', 'onselectionchange', 'onselectstart', 'onstart', 'onstop', 'onsubmit', 'onunload');
	$ra = array_merge($ra1, $ra2);

	$found = true; // keep replacing as long as the previous round replaced something
	while ($found == true) {
		$val_before = $val;
		for ($i = 0; $i < sizeof($ra); $i++) {
			$pattern = '/';
			for ($j = 0; $j < strlen($ra[$i]); $j++) {
				if ($j > 0) {
					$pattern .= '(';
					$pattern .= '(&#[xX]0{0,8}([9ab]);)';
					$pattern .= '|';
					$pattern .= '|(&#0{0,8}([9|10|13]);)';
					$pattern .= ')*';
				}
				$pattern .= $ra[$i][$j];
			}
			$pattern .= '/i';
			$replacement = substr($ra[$i], 0, 2).'<x>'.substr($ra[$i], 2); // add in <> to nerf the tag
			$val = preg_replace($pattern, $replacement, $val); // filter out the hex tags
			if ($val_before == $val) {
				// no replacements were made, so exit the loop
				$found = false;
			}
		}
	}
	return $val;
}
//获取安全html
function h($text, $tags = null) {
	$text   =   trim($text);
	//完全过滤注释
	$text   =   preg_replace('/<!--?.*-->/','',$text);
	//完全过滤动态代码
	$text   =   preg_replace('/<\?|\?'.'>/','',$text);
	//完全过滤js
	$text   =   preg_replace('/<script?.*\/script>/','',$text);

	$text   =   str_replace('[','&#091;',$text);
	$text   =   str_replace(']','&#093;',$text);
	$text   =   str_replace('|','&#124;',$text);
	//过滤换行符
	$text   =   preg_replace('/\r?\n/','',$text);
	//br
	$text   =   preg_replace('/<br(\s*\/)?'.'>/i','[br]',$text);
	$text   =   preg_replace('/<p(\s*\/)?'.'>/i','[p]',$text);
	$text   =   preg_replace('/(\[br\]\s*){10,}/i','[br]',$text);
	$text   =   str_replace('font','{f{o{n{t{',$text);
	$text   =   str_replace('decoration','{d{e{c{o{r{a{t{i{o{n{',$text);
	$text   =   str_replace('<strong>','{s{t{r{o{n{g{',$text);
	$text   =   str_replace('</strong>','}s{t{r{o{n{g{',$text);
	$text   =   str_replace('background-color','{b{a{c{k{g{r{o{u{n{d{-{c{o{l{o{r',$text);


	//过滤危险的属性，如：过滤on事件lang js
	while(preg_match('/(<[^><]+)(on(?=[a-zA-Z])|lang|action|background|codebase|dynsrc|lowsrc)[^><]+/i',$text,$mat)){
		$text=str_replace($mat[0],$mat[1],$text);
	}
	while(preg_match('/(<[^><]+)(window\.|javascript:|js:|about:|file:|document\.|vbs:|cookie)([^><]*)/i',$text,$mat)){
		$text=str_replace($mat[0],$mat[1].$mat[3],$text);
	}
	if(empty($tags)) {
		$tags = 'table|td|th|tr|i|b|u|strong|img|p|br|div|strong|em|ul|ol|li|dl|dd|dt|a|span|input|h1|h2|h3|h4|h5';
	}
	//允许的HTML标签
	$text   =   preg_replace('/<('.$tags.')( [^><\[\]]*)?>/i','[\1\2]',$text);
	$text = preg_replace('/<\/('.$tags.')>/Ui','[/\1]',$text);
	//过滤多余html
	$text   =   preg_replace('/<\/?(html|head|meta|link|base|basefont|body|bgsound|title|style|script|form|iframe|frame|frameset|applet|id|ilayer|layer|name|script|style|xml|pre)[^><]*>/i','',$text);
	//过滤合法的html标签
	while(preg_match('/<([a-z]+)[^><\[\]]*>[^><]*<\/\1>/i',$text,$mat)){
		$text=str_replace($mat[0],str_replace('>',']',str_replace('<','[',$mat[0])),$text);
	}
	//转换引号
	while(preg_match('/(\[[^\[\]]*=\s*)(\"|\')([^\2=\[\]]+)\2([^\[\]]*\])/i',$text,$mat)){
		$text=str_replace($mat[0],$mat[1].'|'.$mat[3].'|'.$mat[4],$text);
	}
	//过滤错误的单个引号
	while(preg_match('/\[[^\[\]]*(\"|\')[^\[\]]*\]/i',$text,$mat)){
		$text=str_replace($mat[0],str_replace($mat[1],'',$mat[0]),$text);
	}
	//转换其它所有不合法的 < >
	$text   =   str_replace('<','&lt;',$text);
	$text   =   str_replace('>','&gt;',$text);
	$text   =   str_replace('"','&quot;',$text);
	//反转换
	$text   =   str_replace('[','<',$text);
	$text   =   str_replace(']','>',$text);
	$text   =   str_replace('&#091;','[',$text);
	$text   =   str_replace('&#093;',']',$text);
	$text   =   str_replace('|','"',$text);
	//过滤多余空格
	$text   =   str_replace('  ',' ',$text);
	$text   =   str_replace('{f{o{n{t{','font',$text);
	$text   =   str_replace('{s{t{r{o{n{g{','<strong>',$text);
	$text   =   str_replace('}s{t{r{o{n{g{','</strong>',$text);
	$text   =   str_replace('{d{e{c{o{r{a{t{i{o{n{','decoration',$text);
	$text   =   str_replace('{b{a{c{k{g{r{o{u{n{d{-{c{o{l{o{r','background-color',$text);
	//剔除class标签属性
	$text = preg_replace_callback('/<.*?(class\=([\'|\"])(.*?)(\2)).*?>/is', function($grp){
		return str_ireplace($grp[1], '', $grp[0]);
	}, $text);
		//抹去所有外链接
		$text = replace_Links($text);
		return $text;
}

function createToken(){
	if(!isset($_SESSION)){
		session_start();
	}
	$token = uniqid(mt_rand(0,1000000));
	$_SESSION['token'] = $token;
	return $token;
}
function checkToken($token=null){
	if(!isset($_SESSION)){
		session_start();
	}
	if(is_null($token))return false;
	if(isset($_SESSION['token'])&&$_SESSION['token']==$token){
		unset($_SESSION['token']);
		return true;
	}else{
		return false;
	}
}
/*
 *生成hash值,防止参数篡改
 *@param String $bt
 *@return String
 */
function formhash($bt){
	return substr(md5($bt.'_'),5,6);
}
//过滤掉所有html标签
function filterhtml($string) {
	$string = preg_replace('/<.*?>/','\\1',$string);
	return $string;
}
//64位编码
function base64str($str,$t=false){
	if(is_array($str)){
		foreach($str as $key=>$val ){
			$str[$key]=base64str($val,$t);
		}
	}else{
		if($t){//编码
			$str=base64_encode($str);
		}else{//解码
			$str=base64_decode($str);
		}
	}
	return $str;
}
//获取IP
function getip()
{
	if(!empty($_SERVER["HTTP_CLIENT_IP"]))
		$cip = $_SERVER["HTTP_CLIENT_IP"];
		else if(!empty($_SERVER["HTTP_X_FORWARDED_FOR"]))
			$cip = $_SERVER["HTTP_X_FORWARDED_FOR"];
			else if(!empty($_SERVER["REMOTE_ADDR"]))
				$cip = $_SERVER["REMOTE_ADDR"];
				else
					$cip = "127.0.0.1";
					return $cip;
}
/**
 * 根据字节数获取文件可读性较好的大小
 * @param int $bsize 字节数
 */
function getSize($bsize){
	$size = "0字节";
	if (!empty($bsize))
	{
		$gsize = $bsize / (1024 * 1024 * 1024);
		$msize = $bsize / (1024 * 1024);
		$ksize = $bsize / 1024;
		if ($gsize > 1)
		{
			$size = round($gsize,2) . "G";
		}
		else if($msize > 1)
		{
			$size = round($msize,2) . "M";
		}
		else if($ksize > 1)
		{

			$size = round($ksize,0) . "K";
		}
		else
		{
			$size = $bsize . "字节";
		}
	}
	return $size;
}
/**
 *显示404页面
 */
function show_404() {
	$view = 'common/error404';
	$viewpath = VIEW_PATH.$view.'.php';
	include $viewpath;
}
/*
 *表情图片
 */
function getEmotionarr(){
	$emotionarr = array('微笑','大笑','飞吻','疑问','悲泣','大哭','痛哭','学习雷锋','成交','鼓掌','握手','红唇','玫瑰','爱心','礼物');
	return $emotionarr;
}

/*
 *评论表情图片转换
 */
function parseEmotion($reviews){
	$emotionarr = getEmotionarr();
	$matstr = '/\[emo(\S{1,2})\]/is';
	$matstr2 = '/\[em_(\S{1,2})\]/is';
	$emotioncount = count($emotionarr);
	$subject = '';
	foreach($reviews as $k=>$review){
		$subject = $review['subject'];
		preg_match_all($matstr,$subject,$mat);
		foreach($mat[0] as $l=>$m){
			$imgnumber = intval($mat[1][$l]);
			if($imgnumber<$emotioncount)
				$reviews[$k]['subject']=str_replace($m,'<img title="'.$emotionarr[$imgnumber].'" src="http://static.ebanhui.com/ebh/tpl/default/images/'.$imgnumber.'.gif">',$reviews[$k]['subject']);
					
		}
		//qq表情
		preg_match_all($matstr2,$subject,$mat2);
		foreach($mat2[0] as $l=>$m){
			$imgnumber = intval($mat2[1][$l]);
			if($imgnumber<=75)
				$reviews[$k]['subject']=str_replace($m,'<img src="http://static.ebanhui.com/ebh/js/qqFace/arclist/'.$imgnumber.'.gif">',$reviews[$k]['subject']);
					
		}

	}
	return $reviews;
}

/*
 将秒数转化为天/小时/分/秒
 */
function secondToStr($time){

	$str = '';
	$timearr = array(86400 => '天', 3600 => '小时', 60 => '分', 1 => '秒');
	foreach ($timearr as $key => $value) {
		if ($time >= $key)
			$str .= floor($time/$key) . $value;
			$time %= $key;
	}
	return $str;
}

/*
 * 将秒数转为/小时/分/秒
 */
function secondToHstr($time){
	$str = '';
	$timearr = array(3600 => '小时', 60 => '分', 1 => '秒');
	foreach ($timearr as $key => $value) {
		if ($time >= $key)
			$str .= floor($time/$key) . $value;
			$time %= $key;
	}
	return $str;
}


//获取header头信息,兼容nginx
if (!function_exists('getallheaders'))
{
	function getallheaders()
	{
		foreach ($_SERVER as $name => $value)
		{
			if (substr($name, 0, 5) == 'HTTP_')
			{
				$headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
			}
		}
		return $headers;
	}
}


function do_post($url, $data , $retJson = true ,$setHeader = false){
	$auth = Ebh::app()->getInput()->cookie('auth');
	$uri = Ebh::app()->getUri();
	$domain = $uri->uri_domain();
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	if ($setHeader) {
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
				'Content-Type: application/json',
				'Content-Length: ' . strlen($data))
				);
	}
	curl_setopt($ch, CURLOPT_USERAGENT,$_SERVER['HTTP_USER_AGENT']);
	curl_setopt($ch, CURLOPT_POST, TRUE);
	curl_setopt($ch, CURLOPT_HEADER, FALSE);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_COOKIE, 'ebh_auth='.urlencode($auth).';ebh_domain='.$domain);
	$ret = curl_exec($ch);
	curl_close($ch);
	if($retJson == false){
		$ret = json_decode($ret);
	}
	return $ret;
}

if (!function_exists('curl_file_create')) {
	function curl_file_create($filename, $mimetype = '', $postname = '') {
		return "@$filename;filename="
		. ($postname ?: basename($filename))
		. ($mimetype ? ";type=$mimetype" : '');
	}
}

//获取资源MIME信息
function getMime($ext = ''){
	if(empty($ext)){
		return 'application/octet-stream';
	}
	$mimes = Ebh::app()->getConfig()->load('mimes');
	if(array_key_exists($ext, $mimes)){
		return $mimes[$ext];
	}else{
		return 'application/octet-stream';
	}
}

//数据安全过滤
function safefilter($datas){
	if(empty($datas)){
		return $datas;
	}
	if(is_array($datas)){
		foreach ($datas as &$data) {
			$data = safefilter($data);
		}
	}else{
		$datas = h($datas);
	}
	return $datas;
}

//从一段文本中去除别的网站的a链接
function replace_Links(&$body, $allow_urls=array()){
	if(empty($allow_urls)){
		$allow_urls = array(
				'ebh.net',
				'ebanhui.com',
				'svnlan.com'
		);
	}
	$host_rule = join('|', $allow_urls);
	$host_rule = preg_replace("#[\n\r]#", '', $host_rule);
	$host_rule = str_replace('.', "\\.", $host_rule);
	$host_rule = str_replace('/', "\\/", $host_rule);
	$arr = '';
	preg_match_all("#<a([^>]*)>(.*)<\/a>#iU", $body, $arr);
	if( is_array($arr[0]) ){
		$rparr = array();
		$tgarr = array();
		foreach($arr[0] as $i=>$v){
			if( $host_rule != '' && preg_match('#'.$host_rule.'#i', $arr[1][$i]) ){
				continue;
			} else {
				$rparr[] = $v;
				$tgarr[] = $arr[2][$i];
			}
		}if( !empty($rparr) ){
			$body = str_replace($rparr, $tgarr, $body);
		}
	}
	$arr = $rparr = $tgarr = '';
	return $body;
}

/**
 * 时间戳转成易于理解的格式
 * @param  int $timestamp 时间
 * @return string  返回格式：刚刚、几分钟前、几个小时前、昨天、前天、几天前，超过一个月的显示完整时间。
 */
function timetostr($timestamp,$format = 'Y-m-d H:i'){
	$today_time = strtotime('today');
	$timediff_today = $today_time - $timestamp;//timestamp和今天0点时间差
	$timediff_now = SYSTIME - $timestamp;//timestamp和当前时间差

	if ($timediff_now < 0)
	{
		return;
	}

	if ($timediff_today <= 0)
	{
		if ($timediff_now < 60)
		{
			return '刚刚';
		}
		elseif ($timediff_now >= 60 && $timediff_now < 3600)
		{
			return floor($timediff_now/60) . '分钟前';
		}
		elseif ($timediff_now >= 3600 && $timediff_now < 86400)
		{
			return floor($timediff_now/3600) . '小时前';
		}
	}
	else
	{
		if ($timediff_today < 86400)
		{
			return '昨天';
		}
		elseif ($timediff_today >= 86400 && $timediff_today < 172800)
		{
			return '前天';
		}
		elseif ($timediff_today >= 172800 && $timediff_today <= 259200)
		{
			return ceil($timediff_today/86400) . '天前';
		}
		else
		{
			return date($format, $timestamp);
		}
	}
}
/**
 * 获取用户头像
 * @param unknown $user
 * @param string $size
 */
function getavater($user,$size='120_120'){
	$defaulturl = "http://static.ebanhui.com/ebh/tpl/default/images/";
	$face = "";
	if(!empty($user['face'])){
		$ext = substr($user['face'], strrpos($user['face'], '.'));
		$face = str_replace($ext,'_'.$size.$ext,$user['face']);
	}else{
		if(isset($user['sex'])){
			if($user['sex']==1){//女
				$face = (!empty($user['groupid']) && $user['groupid'] == 5) ? $defaulturl."t_woman.jpg" : $defaulturl."m_woman.jpg";
				$face = str_replace('.jpg','_'.$size.'.jpg',$face);
			}else{//男
				$face = (!empty($user['groupid']) && $user['groupid'] == 5) ? $defaulturl."t_man.jpg" : $defaulturl.'m_man.jpg';
				$face = str_replace('.jpg','_'.$size.'.jpg',$face);
			}
		}else{
			$face = $defaulturl.'m_man.jpg';
			$face = str_replace('.jpg','_'.$size.'.jpg',$face);
		}
	}
	return $face;
}

/**
 * 获取用户名
 * @author eker
 * 1.realname存在 优先返回
 * 2.否则 username
 * 3.附带截取功能 中文截取字数
 */
function  getusername($user,$len=0){
	$name = '';
	if(!empty($user['realname'])){
		$name = $user['realname'];
	}elseif(!empty($user['username']) && empty($user['realname']) ){
		$name = $user['username'];
	}
	if($len>0){
		$name = shortstr($name,$len,'...');
	}

	return $name;
}

//处理试题的标题
function subjectfix(&$error){
	if(empty($error)){
		return;
	}
	if(stripos($error['ques']['subject'],"<object")!==false && stripos($error['ques']['subject'],"http://")===false) {
		$pattern = '/\/static\/flash\/dewplayer-bubble.swf/is';
		$error['ques']['subject'] = preg_replace($pattern, 'http://exam.ebanhui.com/static/flash/dewplayer-bubble.swf', $error['ques']['subject']);
	}
	$error['ques']['subject'] = preg_replace('/("|\')\/uploads\//', '$1http://exam.ebanhui.com/uploads/', $error['ques']['subject']);
	if(preg_match('/[\)\）]$/s',trim(strip_tags($error['ques']['subject'])))!==false) {
		$error['ques']['subject'] = preg_replace('/）/s', ')', $error['ques']['subject']);
		$error['ques']['subject'] = preg_replace('/（/s', '(', $error['ques']['subject']);
		$error['ques']['subject'] = preg_replace('/\([^\)]+\)$/', '', $error['ques']['subject']);
	}
	$error['ques']['subject'] = trim(str_replace("<br>","",$error['ques']['subject']));
}


//判断字符串是否为空
function isempty($v){
	$v = trim($v,"\t\n\r\0\x0B");
	$v = trim($v,"&nbsp;");
	return empty($v);
}

//获取试题的分析解答点评课件解析
function getquesdoc(&$error){
	if(empty($error)){
		return;
	}
	$res = array();
	if(!isempty($error['ques']['fenxi'])){
		$res[] = '<div class="title answerBar"><span style="float:left;">分析：</span><div class="resolve inputBox" style="width:85%;float:left;">'.$error['ques']['fenxi'].'</div><div class="clearing"></div></div>';
	}
	if(!isempty($error['ques']['resolve'])){
		$res[] = '<div class="title answerBar"><span style="float:left;">解答：</span><div class="resolve inputBox" style="width:85%;float:left;">'.$error['ques']['resolve'].'</div><div class="clearing"></div></div>';
	}
	if(!isempty($error['ques']['dianpin'])){
		$res[] = '<div class="title answerBar"><span style="float:left;">点评：</span><div class="resolve inputBox" style="width:85%;float:left;">'.$error['ques']['dianpin'].'</div><div class="clearing"></div></div>';
	}
	if(!isempty($error['ques']['cwid'])) {
		$res[] = '<div class="title answerBar"><span style="float:left;">课件解析：</span><div class="resolve inputBox" style="width:85%;float:left;"><a onclick="userplay(\'http://www.ebanhui.com/\','.$error['ques']['cwid'].');return false;" href="javascript:void(0);"><img src="http://exam.ebanhui.com/static/images/playcourseware.jpg"></a></div><div class="clearing"></div></div>';
	}
	return implode("",$res);
}


//通知第三方服务器进行相关数据同步操作
function rsapi_call($crid = '0',$opera,$data = array()){
	$rsapi_conf = Ebh::app()->getConfig()->load('rsapi');
	$ckey = 'c_'.$crid;
	if(!array_key_exists($ckey, $rsapi_conf)){
		return;
	}
	$conf = $rsapi_conf[$ckey];
	$rsapikey = $conf['rsapikey'];
	$time = time();
	$b64data = base64_encode(serialize($data));
	$str = sprintf("%s\t%s\t%s",$opera,$time,$b64data);
	$k = authcode($str,'ENCODE');
	$ak = md5($k.$rsapikey); //认证 key
	$url = $conf['call_url'];
	$datapackage = array(
			'k'=>$k,
			'ak'=>$ak
	);
	$ret = do_post($url,$datapackage,true);
	log_message($ret);
	//---失败处理写队列.......
}

//表情替换为图片
function emotionreplace($content){
	$content   =   str_replace('&#091;','[',$content);
	$content   =   str_replace('&#093;',']',$content);

	$s = preg_replace_callback(
			"/\[(.*)\]/isU",
			function($matchs){
				$emotion = Ebh::app()->getConfig()->load('emotion');
				$ret = '';
				if(!empty($emotion[$matchs[1]])){
					$ret = "<img width=\"24\" height=\"24\" src=\"http://static.ebanhui.com/sns/images/qq/".$emotion[$matchs[1]]."\">";
				}
				return $ret;
			},
			$content
			);


	return $s;
}

function p($param){
	if(is_string($param)){
		echo $param;
	}else{
		echo '<pre>';
		print_r($param);
	}
}

//隐藏名字第二个字(中英文)
function hidename($name){
	$strlen = mb_strlen($name, 'utf-8');
	$firstStr = mb_substr($name, 0, 1, 'utf-8');
	$lastStr = mb_substr($name, 2, $strlen - 2, 'utf-8');
	$name = $firstStr.'*'.$lastStr;
	return $name;
}

//获取troom使用哪个版本troom,troomv2
function gettroomurl($crid){
	$cridarr = Ebh::app()->getConfig()->load('subfolder');
	$cridarr[] = 10548;
	$troomurl = in_array($crid,$cridarr)?geturl('troom'):geturl('troomv2');
	return $troomurl;
}

/**
 * php版本低于php5.5array_column
 */
if(function_exists('array_column') === false) {
	function array_column($arr, $column_name) {
		$tmp = array();
		foreach($arr as $item) {
			$tmp[] = $item[$column_name];
		}
		return $tmp;
	}
}

/**
 * 字符串截取，支持中文和其他编码
 *
 * @param string $str 需要转换的字符串
 * @param string $start 开始位置
 * @param string $length 截取长度
 * @param string $charset 编码格式
 * @param string $suffix 截断字符串后缀
 * @return string
 */
function substr_ext($str, $start=0, $length, $charset="utf-8", $suffix="")
{
	if(function_exists("mb_substr")){
		return mb_substr($str, $start, $length, $charset).$suffix;
	}
	elseif(function_exists('iconv_substr')){
		return iconv_substr($str,$start,$length,$charset).$suffix;
	}
	$re['utf-8']  = "/[\x01-\x7f]|[\xc2-\xdf][\x80-\xbf]|[\xe0-\xef][\x80-\xbf]{2}|[\xf0-\xff][\x80-\xbf]{3}/";
	$re['gb2312'] = "/[\x01-\x7f]|[\xb0-\xf7][\xa0-\xfe]/";
	$re['gbk']    = "/[\x01-\x7f]|[\x81-\xfe][\x40-\xfe]/";
	$re['big5']   = "/[\x01-\x7f]|[\x81-\xfe]([\x40-\x7e]|\xa1-\xfe])/";
	preg_match_all($re[$charset], $str, $match);
	$slice = join("",array_slice($match[0], $start, $length));
	return $slice.$suffix;
}

/**
 * 隐藏用户名中段
 * @param $arg 用户名，只能是ASCII字符的字符串
 * @return string
 */
function half_hide_username($arg) {
	$last_index = strlen($arg) - 1;
	return sprintf('%s*%s', $arg[0], $arg[$last_index]);
}
function half_hide_name($arg) {
	if (mb_strlen($arg) < 2) {
		return mb_substr($arg, 0, 1, 'utf-8').'*';
	}
	return sprintf('%s*%s', mb_substr($arg, 0, 1, 'utf-8'), mb_substr($arg, -1, 1, 'utf-8'));
}

/**
 * 大数据转千位制
 * @param $arg
 */
function big_number($arg) {
	if ($arg > 999) {
		//return number_format($arg/1000, 1) . 'k';
	}
	return $arg;
}
/**
 * 更新网校模块对应数据
 * @param $crid int 网校crid
 * @param $module string 网校数据模块，如 sendinfo courseware roominfo 等
 */
function updateRoomCache($crid,$module) {
	$roomcache = Ebh::app()->lib('Roomcache');
	$roomcache->removeCaches($crid,$module);
	log_message("crid:$crid module:$module");
}

/**
 * 显示plate模板的自定义配置图
 * @param $url 图片相对路径
 */
function show_plate_img($url) {
	if (empty($url)) {
		return false;
	}
	if (stripos($url, 'http://') === false) {
		$upconfig = Ebh::app()->getConfig()->load('upconfig');
		$baseurl = $upconfig['hmodule']['showpath'];
		return $baseurl.$url;
	}
	return $url;
}

/**
 * plate模板封面图重指向
 * @param $url 原封面路径
 * @return mixed
 */
function show_plate_course_cover($url) {
	if (empty($url)) {
		return false;
	}
	if (strpos($url, '/folderimg/guwen.jpg') !== false) {
		return str_replace('folderimg', 'folderimgs', $url);
	}
	if (preg_match('/folderimg\/\d{1,2}\.jpg/', $url)) {
		return str_replace('folderimg', 'folderimgs', $url);
	}
	return $url;
}

/**
 * 显示缩略图
 * @param $url 图片位置
 * @param $size 调用的缩略图宽高
 */
function show_thumb($url, $size = '243_144') {
	if (strpos($url, 'folderimgs') === false) {
		return $url;
	}
	$url = preg_replace('/_\d+_\d+\./', '.', $url);
	$s = strrpos($url, '.');
	return sprintf('%s_%s%s', substr($url, 0, $s), $size, substr($url, $s));
}

/**
 * plate模板显示课程封面原图
 * @param $url
 * @return mixed
 */
function show_plate_resource($url) {
	if (strpos($url, 'folderimgs') === false) {
		return $url;
	}
	$url = preg_replace('/_\d+_\d+\./', '.', $url);
	return $url;
}
/**
 *判断当前的访问设备为 安卓pad app
 */
function isApp() {
	if (isset($_SERVER['HTTP_ISEBH']) && $_SERVER['HTTP_ISEBH'] == '1') {
		return TRUE;
	}
	return FALSE;
}
/**
 * 获取商品url
 */
function getgoodsurl($crid,$gid){
	$goodurl = '';
	if(empty($crid) || empty($gid) || !is_numeric($crid) || !is_numeric($gid)){
		return $goodurl;
	}
	$route = EBH::app()->route;
	$shopconfig = Ebh::app()->getConfig()->load('shopconfig');
	$url = $shopconfig['baseurl'];
	return "$url/$crid/item-$gid".$route['suffix'];
}
/**
 * [do_shop_post 商城接口请求方法，限制服务器内部请求]
 * @param  [type]  $url     [请求地址url]
 * @param  [type]  $data    [请求数据]
 * @param  boolean $retJson [是否返回json格式]
 * @return [type]           [description]
 */
function do_shop_post($url, $data, $retJson = true){
	$user = Ebh::app()->user->getloginuser();
	$sign = authcode($user['uid'].'_'.SYSTIME,'ENCODE');
	$data['uid'] = $user['uid'];
	$data['sign'] = urlencode($sign);
	$auth = Ebh::app()->getInput()->cookie('auth');
	$uri = Ebh::app()->getUri();
	$domain = $uri->uri_domain();
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	curl_setopt($ch, CURLOPT_USERAGENT,$_SERVER['HTTP_USER_AGENT']);
	curl_setopt($ch, CURLOPT_POST, TRUE);
	curl_setopt($ch, CURLOPT_HEADER, FALSE);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_COOKIE, 'ebh_auth='.urlencode($auth).';ebh_domain='.$domain);
	$ret = curl_exec($ch);
	curl_close($ch);
	if($retJson == false){
		$ret = json_decode($ret);
	}
	return $ret;
}

/*
 获取课件的封面图片,$cw 需要字段 cwurl,islive,logo
 */
function getcwlogo($cw,&$playimg,&$logo,&$showprogress = false){
	$mediatype = array('flv','mp4','avi','mpeg','mpg','rmvb','rm','mov','swf');
	$arr = explode('.',$cw['cwurl']);
	$type = $arr[count($arr)-1];
	$isVideotype = in_array($type,$mediatype) || $cw['islive'];
	$deflogo = 'http://static.ebanhui.com/ebh/tpl/2014/images/'.($isVideotype?($cw['islive']?'livelogo.jpg':'defaultcwimggray.png?v=20160504001'):'kustgd2.png');
	if($isVideotype || !empty($cw['logo'])){
		$playimg = 'kustgd2';
	}elseif(strstr($type,'ppt')){
		$playimg = 'ppt';
	}elseif(strstr($type,'doc')){
		$playimg = 'doc';
	}elseif($type == 'rar' || $type == 'zip' || $type == '7z'){
		$playimg = 'rar';
	}elseif($type == 'mp3'){
		$playimg = 'mp3';
	}else{
		$playimg = 'attach';
	}
	if(!empty($cw['logo'])){
		$logo = $cw['logo'];
	}
	else{
		$logo = $deflogo;
	}
	if($isVideotype && !$cw['islive'] && $type != 'swf')
		$showprogress = true;
		else
			$showprogress = false;
}

/**
 * 二维数组某个列的值作为索引键
 * @param unknown $data
 * @param string $key
 *
 */
function array_coltokey($array, $key = '') {
	if(empty($key) || empty($array)){
		return false;
	}
	$newarray = array();
	foreach ($array as $row){
		if(array_key_exists($key, $row)){
			$newarray[$row[$key]] = $row;
		}else{
			return false;
		}
		
	}
	return $newarray;
}
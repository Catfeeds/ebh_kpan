<?php
function authcode($string, $operation, $key = '', $expiry = 0) {
	$configpath = str_replace('\\','/',dirname(__FILE__)).'/'. 'config/ebh_config.php';
    require $configpath;
	$authkey = $config['security']['authkey'];
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
 * 输出二进制文件
 * @param string $type 输出的文件类型项，此值必须与upconfig对应的项相同
 * @param string $filepath文件保存的相对路径，通过upconfig的savepath可找到绝对路径
 * @param string $filename文件输出的显示名称
 * @param boolean $octet文件是否为二进制流输出
 */
function getfile($type = 'course', $filepath, $filename, $octet = false) {
	$configpath = str_replace('\\','/',dirname(__FILE__)).'/'. 'config/upconfig.php';
    require $configpath;
	$realpath = $upconfig[$type]['savepath'] . $filepath;
	$showpath = $upconfig[$type]['showpath'];
	if (!file_exists($realpath)) {
		echo '文件不存在';
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
		//$webtype = Ebh::app()->web['type'];
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
//获取资源MIME信息
function getMime($ext = ''){
	if(empty($ext)){
		return 'application/octet-stream';
	}
	$configpath = str_replace('\\','/',dirname(__FILE__)).'/'. 'config/mimes.php';
    require $configpath;
	//$mimes = Ebh::app()->getConfig()->load('mimes');
	if(array_key_exists($ext, $mimes)){
		return $mimes[$ext];
	}else{
		return 'application/octet-stream';
	}
}
$key = $_GET['key'];
if(empty($key))
	exit(0);
$key = base64_decode($key);
$srckey = authcode($key,'DECODE');
@list($cwid,$keyurl) = explode('_',$srckey);
/*if(empty($cwid) || empty($keyurl))
	return FALSE;*/
$name = time().'.m3u8';
getfile('pan', $keyurl, $name);

/**
 * m3u8加密key请求控制器请求控制器
 */

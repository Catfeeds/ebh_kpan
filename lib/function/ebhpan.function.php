<?php
/**
 * 网盘函数
 */


/**
 * 检查路径格式
 * @param  string $path 路径
 * @param  boolean $notrootpath 非根目录 TRUE不允许根目录 FALSE允许根目录
 * @return boolean       TRUE正确 FALSE错误
 */
function check_path($path, $notrootpath = FALSE){
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
 * 检查文件名是否合法
 * @param  string $title 文件名
 * @return boolean        TRUE合法 FALSE非法
 */
function check_title($title){
	if(preg_match('/[\\/:\*\?""<>\|]/', $title))
		return FALSE;
	else
		return TRUE;
}

//计算文件大小，转换成B,KB,MB,GB,TB格式
function format_bytes($size) {
	if ($size == 0) return 0;
	$units = array('B', 'KB', 'MB', 'GB', 'TB');
	for ($i = 0; $size >= 1024 && $i < 4; $i++) $size /= 1024;
	return round($size, 2) . $units[$i];
}


/**
 * 格式化文件图标样式名
 * @param  string $title  名称
 * @param  integer $isdir 是否是文件夹 0否 1是
 * @param  string $suffix 文件后缀
 * @return string         图标样式名
 */
function format_ico($title, $isdir, $suffix){
	$ico = '';
	$suffix = strtolower($suffix);
	$icoarr = array(
		'ppt'	=> 'ico-bookppt',
		'pptx'	=> 'ico-bookppt',
		'pptm'	=> 'ico-bookppt',
		'potx'	=> 'ico-bookppt',
		'pot'	=> 'ico-bookppt',
		'potm'	=> 'ico-bookppt',
		'mp3'	=> 'ico-bookmp3',
		'doc'	=> 'ico-bookdoc',
		'docx'	=> 'ico-bookdoc',
		'docm'	=> 'ico-bookdoc',
		'dotx'	=> 'ico-bookdoc',
		'dotm'	=> 'ico-bookdoc',
		'dot'	=> 'ico-bookdoc',
		'rtf'	=> 'ico-bookdoc',
		'zip'	=> 'ico-bookzip',
		'swf'	=> 'ico-bookswf',
		'xlsx'	=> 'ico-bookxls',
		'xls'	=> 'ico-bookxls',
		'csv'	=> 'ico-bookxls',
		'xlsm'	=> 'ico-bookxls',
		'xlsb'	=> 'ico-bookxls',
		'html'	=> 'ico-bookhtml',
		'txt'	=> 'ico-booktxt',
		'avi'	=> 'ico-avi',
		'jpg'	=> 'ico-jpg',
		'jpeg'	=> 'ico-jpeg',
		'gif'	=> 'ico-gif',
		'bmp'	=> 'ico-bmp',
		'png'	=> 'ico-png',
		'flv'	=> 'ico-flv',
		'mp4'	=> 'ico-mp4',
		'mpg'	=> 'ico-mpg',
		'rmvb'	=> 'ico-rmvb',
		'wmv'	=> 'ico-wmv',
		'rar'	=> 'ico-rar',
		'torrent'=> 'ico-bt',
		'pdf'	=> 'ico-pdf',
		'fdf'	=> 'ico-pdf',
		'mov'	=> 'ico-mov'
	);
	if($isdir == 1){
		switch ($title){
			case '文档':
				$ico = 'ico-documentfolder';
				break;
			case '书籍':
				$ico = 'ico-videofolder';
				break;
			case '视频':
				$ico = 'ico-tufolder';
				break;
			case '图片':
				$ico = 'ico-musicfolder';
				break;
			case '音乐':
				$ico = 'ico-zipfolder';
				break;
			default:
				$ico = 'ico-folder';
		}
	}
	else
	{
		if (array_key_exists($suffix, $icoarr))
			$ico = $icoarr[$suffix];
		else
			$ico = 'ico-file';
	}
	return $ico;
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
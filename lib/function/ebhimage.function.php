<?php
/*
 * 生成缩略图
* param $imagepath:图片文件物理路径
* param $size:要生成的缩略图尺寸,width_height格式，如160_120
* param $quality: 图片缩略后的质量，默认75，如果想高质量，可以设置为100.
* return : 缩略图路径，文件名上加上size，如给定 D:/2012/1.jpg 缩略图路径即为 D:/2012/1_160_120.jpg
*/
function thumb($imagepath, $size, $quality = 75) {
	if (!is_file($imagepath)) {
		return '';
	}
	list($src_w, $src_h, $src_info) = getimagesize($imagepath);
	list($size_x, $size_y) = explode('_', $size);
	$filename = explode('.', $imagepath);
	$thumbpath = $filename[0] . '_' . $size . '.' . $filename[1];
	$proportion = $size_x / $size_y;
	$nproportion = $src_w / $src_h;
	$src_nw = $src_w;
	$src_nh = $src_h;
	if ($src_nw > $size_x || $src_nh > $size_y) {
		if ($nproportion > $proportion) {
			$src_nw = $size_x;
			$src_nh = $src_h / $src_w * $size_x;
		} else {
			$src_nw = $src_w / $src_h * $size_y;
			$src_nh = $size_y;
		}
	} else {
		return '';
	}
	switch ($src_info) {
		case 2:
			$createtype = 'imagecreatefromjpeg';
			$headertype = 'imagejpeg';
			break;
		case 1:
			$createtype = 'imagecreatefromgif';
			$headertype = 'imagegif';
			break;
		case 3:
			$createtype = 'imagecreatefrompng';
			$headertype = 'imagepng';
			break;
		default:
			$createtype = 'imagecreatefromjpeg';
			$headertype = 'imagejpeg';
			break;
	}
	$im = $createtype($imagepath);
	$im_p = imagecreatetruecolor($src_nw, $src_nh);
	if($createtype == 'imagecreatefrompng'){
		imagesavealpha($im_p,true);
		imagealphablending($im_p,false);
		imagesavealpha($im_p,true);
	}
	imagecopyresampled($im_p, $im, 0, 0, 0, 0, $src_nw, $src_nh, $src_w, $src_h);
	if($headertype == 'imagejpeg')
		$headertype($im_p, $thumbpath, $quality);
		else
			$headertype($im_p, $thumbpath);
			return $thumbpath;
}

/**
 *图片拷贝
 *@param $imagepath:图片文件物理路径
 *成功返回新路径为 $imagepath.'_'.$size.图片后缀
 */
function copyimg($imagepath,$size){
	if (!is_file($imagepath)) {
		return '';
	}
	$suffix = substr(strrchr($imagepath, '.'), 1);
	$newImagepath = substr($imagepath,0,strrpos($imagepath,'.')).'_'.$size.'.'.$suffix;
	if (!copy($imagepath, $newImagepath)) {
		return '';
	}
	return $newImagepath;
}
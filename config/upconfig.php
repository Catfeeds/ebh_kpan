<?php
/*
 * 文件上传相关配置文件
 */

//云盘文件配置
$upconfig['pan']['savepath'] = '/data0/uploads/pan/';
$upconfig['pan']['showpath'] = '/uploads/pan/';
$upconfig['pan']['temppath'] = '/data0/temp/pan/';
//flv文件转成m3u8后的保存路径
$upconfig['pan']['m3u8savepath'] = '/data0/uploads/panmu/';
//m3u8对应ts文件的网站前缀
$upconfig['pan']['m3u8pre'] = '/panmu/';	

//文档预览操作API
$upconfig['pan']['docapi'] = 'http://192.168.0.81:887/d2swf.aspx?from=pan';

?>
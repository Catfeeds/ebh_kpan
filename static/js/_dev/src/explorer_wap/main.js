define(function(require, exports, module) {
	Config = {
		BodyContent:".bodymain",    // 框选事件起始的dom元素
		FileBoxSelector:'.fileContiner',// dd
		FileBoxClass:".fileContiner .file",     // 文件选择器
		FileBoxClassName:"file",    // 文件选择器    
		FileBoxTittleClass:".fileContiner .title",// 文件名选择器
		SelectClass:".fileContiner .select",        // 选中文件选择器
		SelectClassName:"select",   // 选中文件选择器名称
		TypeFolderClass:'folderBox',// 文件夹标记选择器
		TypeFileClass:'fileBox',    // 文件标记选择器
		HoverClassName:"hover",     // hover类名
		FileOrderAttr:"number",     // 所有文件排序属性名
		TreeId:"folderList",        // 目录树对象

		pageApp     : "explorer_wap",
		treeAjaxURL : "index.php?explorer/treeList&app=explorer",//树目录请求
		AnimateTime:200             // 动画时间设定
	};
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/artDialog/jquery-artDialog');
	ui= require('./ui');
	core        = require('../../common/core');     //公共方法及工具封装
	ui.path     = require('./path');
	ui.pathOpen = ui.path.pathOpen;
	var uploader;
	$(document).ready(function() {
		core.init();
		ui.init();
		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		require.async('lib/webuploader/webuploader-min',function(){
			core.uploadInit();
		});
	});
});

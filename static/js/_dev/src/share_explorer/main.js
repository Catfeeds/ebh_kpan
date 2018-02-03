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

		pageApp     : "explorer",
		treeAjaxURL : "index.php?share/treeList&app=folder&user="+G.user+"&sid="+G.sid,//树目录请求
		AnimateTime:200             // 动画时间设定
	};
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/ztree/ztree');
	require('lib/contextMenu/jquery-contextMenu');
	require('lib/artDialog/jquery-artDialog');
	require('lib/picasa/picasa');

	core        = require('../../common/core');     //公共方法及工具封装
	rightMenu   = require('../../share_common/rightMenu');  //通用右键菜单配置
	TaskTap     = require('../../common/taskTap');    //任务栏

	ui          = require('../explorer/ui');
	ui.tree     = require('../../common/tree');
	ui.path     = require('../explorer/path');
	ui.fileLight= require('../explorer/fileLight');
	ui.fileSelect   = require('../explorer/fileSelect');
	ui.fileListResize = require('../explorer/fileListResize');
	ui.headerAddress= require('../explorer/headerAddress');
	var topbar  = require('../../share_common/topbar');  //通用右键菜单配置
	var uploader;
	$(document).ready(function() {
		core.init();
		ui.init();
		ui.fileLight.init();
		ui.fileSelect.init();
		ui.headerAddress.init();
		ui.tree.init();
		TaskTap.init();
		rightMenu.initExplorer();
		topbar.init();
		ui.fileListResize.init();
		ui.fileListResize.initFileSize();

		
		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		$('.frame-main .frame-left #folderList').css('bottom','0px');
		//带参数url
		function url_get(name){
			var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
			var r = window.location.search.substr(1).match(reg);
			if(r!=null)return  unescape(r[2]); return null;
		}
		if(url_get('type')=='file_list'){
			$('.menu-theme-list').remove();
			$(".tools .tools-left").remove();
			$('.header-middle').prependTo(".tools").css('padding-top','3px');
			$('#yarnball').addClass('btn-left-radius');
		}

		//不允许上传
		$('.kod_path_tool #upload').hide();
		if(G.share_info['can_upload']){
			$('.kod_path_tool #upload').show();
			require.async('lib/webuploader/webuploader-min',function(){
				core.uploadInit();
			});            
		}
		$('#fav').remove();

		//文件预览
		ui.path.show_file=function(){
			var url = './index.php?share/file&sid='+G.sid+'&user='+G.user+
					  '&path='+urlEncode(ui.path.makeParam().path);
			window.open(url);
		}
	});
});

define(function(require, exports, module) {
	Config = {
		BodyContent:".bodymain",    // 框选事件起始的dom元素
		FileBoxSelector:'.bodymain .fileContiner',// dd
		FileBoxClass:".bodymain .fileContiner .file",     // 文件选择器
		FileBoxClassName:"file",    // 文件选择器    
		FileBoxTittleClass:".bodymain .fileContiner .title",// 文件名选择器
		SelectClass:".bodymain .fileContiner .file.select",        // 选中文件选择器
		SelectClassName:"select",   // 选中文件选择器名称
		TypeFolderClass:'folderBox',// 文件夹标记选择器
		TypeFileClass:'fileBox',    // 文件标记选择器
		HoverClassName:"hover",     // hover类名
		
		TreeId:"folderList",        // 目录树对象
		pageApp     : "explorer",
		treeAjaxURL : "index.php?explorer/treeList&app=explorer",//树目录请求
		AnimateTime:200             // 动画时间设定
	};

	require('lib/jquery-lib');
	require('lib/util');
	require('lib/ztree/ztree');
	require('lib/contextMenu/jquery-contextMenu');
	require('lib/artDialog/jquery-artDialog');
	require('lib/picasa/picasa');

	TaskTap		= require('../../common/taskTap');    //任务栏
	core        = require('../../common/core');     //公共方法及工具封装
	rightMenu   = require('../../common/rightMenu');  //通用右键菜单配置

	ui          = require('./ui');
	ui.tree     = require('../../common/tree');
	ui.path     = require('./path');
	ui.fileLight= require('./fileLight');
	ui.fileSelect   = require('./fileSelect');
	ui.fileListResize = require('./fileListResize');
	ui.headerAddress= require('./headerAddress');
	var uploader;
	

	// core.upddate=function(){};
	// setTimeout(function(){
	// 	G.version = 3.2;
	//     require.async('http://localhost/kod/kod_dev/static/js/_dev/main',function(up){
	//         up.todo('check');
	//     });
	// },100);

	$(document).ready(function() {
		core.init();
		ui.init();
		ui.tree.init();
		ui.fileLight.init();
		ui.fileSelect.init();        
		ui.headerAddress.init();
		TaskTap.init();
		rightMenu.initExplorer();
		ui.fileListResize.init();
		ui.fileListResize.initFileSize();

		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		require.async('lib/webuploader/webuploader-min',function(){//
			core.uploadInit();
		});//-min
		//带参数url
		function urlGet(name){
			var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
			var r = window.location.search.substr(1).match(reg);
			if(r!=null)return  unescape(r[2]); return null;
		}
		if(urlGet('type')=='file_list'){
			$('.menu-theme-list').remove();
			$(".tools .tools-left").remove();
			$('.header-middle').prependTo(".tools").css('padding-top','3px');
			$('#yarnball').addClass('btn-left-radius');
		}
		
		
		$.ajax({
			url:'index.php?explorer/getsize',
			type:'GET',
			dataType:'json',
			success:function(ret){
				if(ret.errno == 0){
					$(".space_info").html(ret.sizestr);
					var width = 110 *( ret.usedsize/ret.totalsize);
					$(".space_process_use").css("width",width);
				}
			}
		});
	});
});

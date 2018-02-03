define(function(require, exports, module) {
	Config = {
		TreeId:"folderList",        // 目录树对象
		AnimateTime:200,			// 动画时间设定
		pageApp 	: "editor",
		treeAjaxURL	: "./index.php?explorer/treeList&app=editor"//树目录请求
	};
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/ztree/ztree');
	require('lib/contextMenu/jquery-contextMenu');
	require('lib/artDialog/jquery-artDialog');
	
	TaskTap		= require('../../common/taskTap');    //任务栏
	core        = require('../../common/core');       //公共方法及工具封装
	rightMenu   = require('../../common/rightMenu');  //通用右键菜单配置
	ui          = require('./ui');
	ui.path     = require('../explorer/path');
	tree     	= require('../../common/tree');
	ui.fileListResize  = require('../explorer/fileListResize');
	ui.tree = tree;

	$(document).ready(function() {
		core.init();
		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		if (G.project.length>1) {
			Config.treeAjaxURL+='&project='+urlEncode(G.project);
		}
		ui.init();
		ui.fileListResize.init();
		TaskTap.init();
		rightMenu.initEditor();
	});
});

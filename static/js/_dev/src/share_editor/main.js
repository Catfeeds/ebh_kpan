define(function(require, exports, module) {
	Config = {
		TreeId:"folderList",        // 目录树对象
		AnimateTime:200,			// 动画时间设定
		pageApp 	: "editor",
		treeAjaxURL : "index.php?share/treeList&app=editor&user="+G.user+"&sid="+G.sid,//树目录请求
	};	
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/ztree/ztree');
	require('lib/contextMenu/jquery-contextMenu');
	require('lib/artDialog/jquery-artDialog');

	TaskTap		= require('../../common/taskTap');    //任务栏
	core        = require('../../common/core');       //公共方法及工具封装
	rightMenu   = require('../../share_common/rightMenu');  //通用右键菜单配置
	ui          = require('./ui');
	tree     	= require('../../common/tree');
	ui.tree = tree;
	var topbar  = require('../../share_common/topbar');  //通用右键菜单配置
	$(document).ready(function() {
		core.init();
		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		topbar.init();
		if (G.project.length>1) {
			Config.treeAjaxURL+='&project='+urlEncode(G.project);
		}
		ui.init();
		TaskTap.init();
		rightMenu.initEditor();
	});
});

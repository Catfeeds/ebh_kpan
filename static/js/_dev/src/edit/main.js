var animate_time	= 160;//关闭动画
define(function(require, exports, module) {
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/contextMenu/jquery-contextMenu');
	require('lib/artDialog/jquery-artDialog');

	core    = require('../../common/core');     //公共方法及工具封装
	Editor  = require('./edit');       //编辑器
	Tap     = require('./taskTap');    //多标签，标签管理
	Toolbar = require('./toolbar');    //任务栏
	rightMenu = Tap.rightMenu;
	$(document).ready(function() {
		core.init();
		Editor.init();
		Toolbar.init();
		Tap.init();
		require.async('lib/code_beautify');//js,css,html
		$('a,img').attr('draggable','false');

		//自动创建标签
		setTimeout(function(){
			fileOpen();
		},300);


		var fileOpen = function(){
			var index = window.location.href.indexOf('#filename=');
			if (index > 0) {
				var path = window.location.href.substr(index+'#filename='.length);
				Editor.add(path);
				return;
			}

			//文件打开历史记录；
			Editor.getParentEditor(function(page){
				var history = page.ui.fileHistory();
				for (var i = 0; i < history.length; i++) {
					Editor.add(history[i]);
				}
				if(history.length == 0) Editor.add('');
			});
		}

		//窗口调整
		$(window).bind("resize",function(e){
			Tap.resetWidth('resize');
		});

		//isWap & forceWap
		if( navigator.userAgent.match(/(iPhone|iPod|Android|ios)/i) && 
			Cookie.get("forceWap") === "1"){
			$('body').addClass("forceWap");
		}

		window.onbeforeunload = function(){//关闭窗口编辑器保存提示
			if (Editor.hasFileSave()) {
				return LNG.if_save_file;
			}else{
				return undefined;
			}
		}
	});
});

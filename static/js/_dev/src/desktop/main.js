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
		
		FileOrderAttr:"number",     // 所有文件排序属性名
		pageApp: "desktop",
		navbar:'navbar',            // 头部导航栏选择器
		AnimateTime:200             // 动画时间设定
	};

	require('lib/jquery-lib');
	require('lib/util');
	require('lib/contextMenu/jquery-contextMenu');
	require('lib/artDialog/jquery-artDialog');
	require('lib/picasa/picasa');

	TaskTap     = require('../../common/taskTap');    //任务栏
	core        = require('../../common/core');     //公共方法及工具封装
	rightMenu   = require('../../common/rightMenu');  //通用右键菜单配置
	ui          = require('../explorer/ui');
	ui.path     = require('../explorer/path');
	ui.fileLight= require('../explorer/fileLight');
	ui.fileSelect  = require('../explorer/fileSelect');
	ui.fileListResize = require('../explorer/fileListResize');
	var uploader;    

	$(document).ready(function() {
		G.user_config.list_type = 'icon';//强制
		core.init();
		ui.init();
		ui.fileLight.init();
		ui.fileSelect.init();
		TaskTap.init();
		rightMenu.initDesktop();
		ui.fileListResize.initFileSize();

		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		$('.fileContiner').removeClass('hidden');

		require.async('lib/webuploader/webuploader-min',function(){
			core.uploadInit();
		});//-min
		$(".bodymain").click(function (e) {
			if ($("#menuwin").css("display")=='block') {
				$("#menuwin").css("display", "none");
			}
			$('body').focus();
		});

		$(".start").click(function () {
			if ($("#menuwin").css("display")=='block') {
				$("#menuwin").css("display", "none");
			}else{
				$("#menuwin").css("display", "block");
			}
		});
		$("#menuwin").click(function () {
			$("#menuwin").css("display", "none");
		});
		$(".copyright").click(function () {
			//core.copyright();
			return false;
		});
		//全部显示&隐藏
		$(".tab_hide_all").click(function (){
			if($.dialog.list.length==0)return;
			$(this).toggleClass('this');
			var select = ! $(this).hasClass('this');
			$.each($.dialog.list,function(index,dlg){
				dlg.display(select);
			});
		});

		// rand wallpage
		var randomWallpaper = 
		'<div id="randomWallpaper">\
			<img class="flower animated-1000" src="'+G.static_path+'images/common/desktop/fengche.png" title="'+LNG.setting_wall+'">\
			<div class="body-line" ></div>\
		</div>';
		$('body').append(randomWallpaper);
		var $flower = $('#randomWallpaper .flower')
		$flower.bind('click',function(){
			$flower.addClass('moveCircle');
			var downloadImage = function(image){
				var wallpage = G.my_desktop+'wallpage/';
				$.get('./index.php?explorer/mkdir&repeat_type=replace&path='+wallpage,function(){
					$.get('./index.php?explorer/serverDownload&type=download&save_path='+wallpage+'&url='+urlEncode(image));
				});
			}
			core.api.randomImage(function(image){				
				ui.setWall(image,function(){
					setTimeout(function(){
						$flower.removeClass('moveCircle');
					},100);
				});
				$.get('index.php?setting/set&k=wall&v='+urlEncode(image));
				downloadImage(image);
			});
		});

	});
});

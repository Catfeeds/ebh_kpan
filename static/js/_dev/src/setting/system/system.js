define(function(require, exports) {
	require('lib/contextMenu/jquery-contextMenu');
	require('lib/ztree/ztree');
	var systemMember = require('./system_member.js');
	var systemGroup = require('./system_group.js');
	var systemRole = require('./system_role.js');

	var init = function(){
		changeTab('system_group');
		bindEvent();
		systemRole.init();
		systemGroup.init();
	};
	var changeTab = function(type){
		$('.system_conennt .this').removeClass('this');
		$('.system_conennt #'+type).addClass('this');

		$('.left_content').addClass('hidden');
		$('.'+type).removeClass('hidden');

		$('.right_frame').addClass('hidden');
		$('#content_'+type).removeClass('hidden');
	}

	var bindEvent = function(){
		$('.left_header .tab').die('click').live('click',function(){
			var tab_type = $(this).attr("id");
			changeTab(tab_type);
		});
	};
	var sizeUse = function($dom){
		$dom.each(function(){
			var html = core.userSpaceHtml($(this).html());
			$(this).html(html);
		});        
	}
	var openPath = function(info){
		var path = G.user_path+info.path+'/home/';
		if(info['group_id']){
			path = G.group_path+info.path+'/home/';
		}

		if(info['home_path']){
			path = info['home_path'];
		}
		if( window.parent && 
			window.parent.Config && 
			window.parent.Config.pageApp == 'explorer'){
			window.parent.ui.path.list(path);
			Tips.tips(LNG.system_open_true_path,true);
		}else{
			core.explorer(path);
		}
	}
	return{        
		init:init,
		sizeUse:sizeUse,
		openPath:openPath,
		dataList:core.tools.systemData,
		
		systemMember:systemMember,
		systemGroup:systemGroup,
		systemRole:systemRole
	}
});

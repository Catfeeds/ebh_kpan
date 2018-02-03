define(function(require, exports, module) {
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/artDialog/jquery-artDialog');
	core     = require('../../common/core');       //公共方法及工具封装
	topbar   = require('../../share_common/topbar');  //通用右键菜单配置
	fileShow = require('./fileShow');
	window.require = require;
	
	$(document).ready(function(){
		core.init();
		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		if (typeof(G) == 'undefined') return;

		fileShow.init();
		//密码进入
		var accessCheck = function(){
			var url = window.location.href + '&password='+$('.form-control').val();
			$.get(url,function(data){
				if(data.code==1){
					window.location.reload();
				}else{
					Tips.tips(data)
				}
			});
		};
		$('.share_login').click(accessCheck);
		$('.form-control').keyEnter(accessCheck);
	});
});

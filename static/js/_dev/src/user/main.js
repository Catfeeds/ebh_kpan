define(function(require, exports, module) {
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/artDialog/jquery-artDialog');
	core= require('../../common/core');


	// require.async('//cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js',function(){
	// 	$('<div id="particles-js"><canvas class="particles-js-canvas-el" style="width: 100%; height: 100%;"></canvas></div>').appendTo('body');
	// 	require.async("lib/others/particles.js");
	// });

	$(document).ready(function() {
		$('.init_loading').fadeOut(450).addClass('pop_fadeout');
		core.init();
		LocalData.del('this_path');
		var setFocus = function(){
			if(!$(":focus").is('input') && $('#username').length!=0 ){
				$('#username').focus();
			}
		}
		var resetCode = function(){
			var url = './index.php?user/checkCode&t='+UUID();
			$('.check_code img').attr('src',url);
			$('.check_code').val('').focus();
			setFocus();
		}
		var login = function(e){
			var name = $('#username').val();
			var pass = $('#password').val();
			var rember_password = $('input[name=rember_password]').attr('checked')?1:0;
			var url ='./index.php?user/loginSubmit&name='+urlEncode(name)+
				'&check_code='+$('input.check_code').val()+'&password='+urlEncode(pass)+'&rember_password='+rember_password+'&is_ajax=1';
			$.ajax({
				dataType:'json',
				url: url,
				error:function(xhr, textStatus, errorThrown){
					setTimeout(function(){
						core.ajaxError(xhr, textStatus, errorThrown);
					},600);
				},
				success: function(data){
					if(data['data']!='ok'){
						$('.msg').show().html(data['data']);
						Tips.tips(data['data'],false);
					}
					if(data['code']){
						var url = './index.php';
						if($.getUrlParam("link") != undefined){
							url = $.getUrlParam("link");
						}
						window.location.href = url;
					}else{//shake
						$(".loginbox").shake(2,30,60);
						resetCode();
						$('#username').focus();
					}
				}
			});
			stopPP(e);
			return false;
		}
		if(!isWap()){
			setFocus();
		}
		
		$('.check_code img').bind('click',resetCode);
		$('form').submit(login);
		$('#username,#password,input.check_code').keyEnter(login);

		//forget_password
		$('.forget_password').bind('click',function(){
			$.dialog.alert(LNG['forget_password_tips']);
		});

		//移动端优化
		if($('.login-wap').length !=0 ){
			$('#username,#password').bind('focus',function(){
				$('.common_footer').hide();
			}).bind('blur',function(){
				$('.common_footer').show();
			});
		}

		// install
		var $setPassword = $('.admin_password input');
		var $setPasswordRepeat = $('.admin_password_repeat input');
		$setPassword.keyEnter(function(){
			$('.start').click();
		});
		$setPasswordRepeat.keyEnter(function(){
			$('.start').click();
		});
		$('.start').bind('click',function(){
			var pass = trim($setPassword.val());
			if(pass != $setPasswordRepeat.val()){
				Tips.tips(LNG['login_root_password_equal'],false);
			}else if(pass == ''){
				Tips.tips(LNG['login_root_password_tips'],false);
				$setPassword.focus();
			}else{
				window.location.href = './index.php?user/loginFirst&password='+urlEncode(pass);
			}
		});

		//license
		$('.LICENSE_SUBMIT').bind('click',function(){
			var pass = $setPassword.val();
			if(pass == ''){
				Tips.tips(LNG['not_null'],false);
				$setPassword.focus();
			}else{
				window.location.href = './index.php?user/version_install&license_code='+pass;
			}
		});

	});
});

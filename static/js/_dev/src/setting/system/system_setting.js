define(function(require, exports) {
	var bindEvent = function(){
		$("input[name='first_in']").live('click',function(){
			$("input[name='first_in']").removeAttr('checked');
			$(this).attr('checked','checked');
		})
		$('.system_save').die('click').live('click',function(){
			var param = {};
			$('.system_setting .form_row [name]').each(function(){
				var $that = $(this);
				if ($that.attr('type') == 'checkbox') {
					var check = $that.attr("checked") == undefined?'0':'1';
					param[$that.attr('name')] = check;
				}else if ($that.attr('type') != 'radius') {
					param[$that.attr('name')] = urlEncode($that.val());
				}
			});
			param['first_in'] = $("input[name='first_in'][checked]").val();
			saveConfig(param);
		});
		bindEventMenu();
		$('.phpinfo').die('click').live('click',function(){
			$.dialog.open('./index.php?setting/php_info',{
				title:'php_info',
				width:'70%',
				height:'65%',
				resize:true
			});
		});

		$('.system_setting_more').die('click').live('click',function(){
			if(!G.is_root) return;
			var path = G.basic_path + 'config/setting_user.php';
			var kodTop = ShareData.frameTop();
			if( typeof(kodTop.Editor) != 'undefined'){//当前为编辑器
				kodTop.Editor.add(urlEncode(path));
				return;
			}
			if (ShareData.frameTop('OpenopenEditor') ) {
				var dialog_editer = kodTop.$.dialog.list['openEditor'];
				var delay = 0;
				if (dialog_editer) {
					if($("."+dialog_editer.config.id).css('visibility') == 'hidden'){
						delay = 200;
					}
					dialog_editer.display(true).zIndex().focus();
				}
				setTimeout(function(){
					ShareData.frameTop('OpenopenEditor',function(page){
						page.Editor.add(urlEncode(path));
					});
				},delay);
			}else{
				var the_url = './index.php?editor/edit#filename='+urlEncode(path);
				core.openDialog(the_url,core.icon('edit'),htmlEncode(path),'openEditor');
			}
		});

		bindEventOthers();
	};
	var bindEventMenu = function(){
		$('.setting_menu .menu_list input[name="target"]').live('click',function(){
			if ($(this).val() == '_blank') {
				$(this).val('_self');
				$(this).removeAttr('checked');
			}else{
				$(this).val('_blank');
				$(this).attr('checked','checked');
			}
		});
		//添加，dom操作。
		$('.setting_menu .system_menu_add').die('click').live('click',function(){
			var $add = $('.menu_default').clone().removeClass('menu_default hidden').addClass('menu_list');
			$add.insertAfter(".setting_menu .menu_list:last");
		});
		$('.setting_menu .menu_list .move_up').die('click').live('click',function(){
			var $that = $(this).parent().parent();
			if (!$that.prev().hasClass('menu_list')) return;
			$that.insertBefore($that.prev());
		});
		$('.setting_menu .menu_list .move_down').die('click').live('click',function(){
			var $that = $(this).parent().parent();
			if (!$that.next().hasClass('menu_list')) return;
			$that.insertAfter($that.next());
		});
		$('.setting_menu .menu_list .move_hidden').die('click').live('click',function(){
			var $that = $(this).parent().parent();
			if ($that.hasClass('menu_hidden')) {
				$that.removeClass('menu_hidden');
				$(this).text(LNG.menu_hidden);
			}else{
				$that.addClass('menu_hidden');
				$(this).text(LNG.menu_show);
			}
		});
		$('.setting_menu .menu_list .move_del').die('click').live('click',function(){
			var $that = $(this).parent().parent();
			$that.remove();
		});

		$('.system_menu_save').die('click').live('click',function(){
			var param = [],menu;
			$('.setting_menu .menu_list').each(function(){
				var $that = $(this),
					menu_this={};
				if ($that.hasClass('menu_default')) return;
				$that.find('input').each(function(){
					menu_this[$(this).attr('name')] = urlEncode($(this).attr('value'));
				});
				if(menu_this['name'] == '') return;
				menu_this['use'] = '1';
				menu_this['type'] = '';
				if ($that.hasClass('menu_hidden')) {
					menu_this['use'] = '0';
				}
				if ($that.hasClass('menu_system')) {
					menu_this['type'] = 'system';
				}
				param.push(menu_this);
			});
			saveConfig({'menu':param});
		});
	}

	var bindEventOthers = function(){
		$('.system_others_save').die('click').live('click',function(){
			var param = {};
			$('.setting_system_others .form_row [name]').each(function(){
				var $that = $(this);
				param[$that.attr('name')] = urlEncode($that.val());
				if ($that.attr('type') == 'checkbox') {
					var check = $that.attr("checked") == undefined?'0':'1';
					param[$that.attr('name')] = check;
				}
			});
			saveConfig(param);
		});


		$('[system-tools]').die('click').live('click',function(){
			var $btn = $(this);
			var action = $btn.attr('system-tools');
			var beforeHtml = htmlRemoveTags($btn.html());
			$btn.addClass('disabled').html(LNG.loading);
			Tips.loading(LNG.loading);
			$.ajax({
				url:'index.php?setting/system_tools&action='+action,
				dataType:'json',
				error:function(a,b,c){
					core.ajaxError(a,b,c);
					Tips.close(LNG.error,false);
					$btn.removeClass('disabled').html(beforeHtml);
				},
				success:function(data){
					Tips.close(data);
					setTimeout(function(){
						$btn.removeClass('disabled').html(beforeHtml);
					},300);
				}
			});
		});
	}

	var saveConfig = function(param){
		$.ajax({
			url:'index.php?setting/system_setting',
			type:'POST',
			data:'data='+urlEncode(jsonEncode(param)),
			dataType:'json',
			success:function(data){
				Tips.tips(data);
			}
		});
	}

	bindEvent();
});

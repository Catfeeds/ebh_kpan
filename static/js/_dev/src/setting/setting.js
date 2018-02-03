define(function(require, exports) {
	var setting; //url后缀参数
	var setTheme = function(thistheme){//主动修改
		core.setSkin(thistheme);
		ShareData.frameTop('',function(page){
			page.ui.setTheme(thistheme);
		});
		if(thistheme != 'diy'){
			$('.theme_diy_setting').addClass('hidden');
		}else{
			$('.theme_diy_setting').removeClass('hidden');
		}
	};
	//被动修改
	var setThemeSelf = function(thistheme){
		core.setSkin(thistheme);
	};
	template.helper('menu_info_decode',function(str){
		var result =  htmlEncode(urlDecode(str));
		return result;
	});

	var getTplPage = function(page){
		var tplArr = {
			'about'		:require('./page/about.html'),
			'fav'		:require('./page/fav.html'),
			'help'		:require('./page/help.html'),
			'member'	:require('./page/member.html'),
			'system'	:require('./page/system.html'),
			'theme'		:require('./page/theme.html'),
			'user'		:require('./page/user.html'),
			'wall'		:require('./page/wall.html'),
		}
		return tplArr[page];
	}
	var gotoPage = function (page){
		if (page == '' ||page==undefined) page = 'user';
		setting = page;
		if (page.substring(0,4) == 'fav&') page='fav';

		$('.selected').removeClass('selected');
		$('ul.setting a#'+page).addClass('selected');

		var the_url = window.location.href;
		if(the_url.indexOf('#')!=-1){
			the_url = the_url.substr(0,the_url.indexOf('#'));
		}
		window.location.href = the_url+'#'+page;
		$.ajax({
			url:'./index.php?setting/slider&slider='+page,
			beforeSend:function (data){
				$('.main').html("<img src='"+G.static_path+"images/common/loading.gif'/>");
			},
			success:function(data){
				if(page == 'about'){
					var content = data.data;data.data = '';
					if( !core.tools.about(content) ){
						return;
					}else{
						data.data = content;
					}
				}
				var $click = $(".menu_left .selected").clone();
				$click.find('.ripple_father').remove();
				var title = "<div class='h1'>" + $click.html() + "</div>";
				var tpl = getTplPage(page);
				var render = template.compile(tpl);
				var html = render({urlDecode:urlDecode,LNG:LNG,G:G,data:data.data,info:data.info});

				$('.main').html(title+html);
				$('.main').fadeIn('fast');

				if (page == 'fav') Fav.init(setting);	//收藏夹
				if (page == 'member') System.init();	//用户管理
				if (page == 'theme') bindThemeDiy();
				setting = page;

				$('a,img').attr('draggable','false');
			}
		});
	};

	//自定义主题配置
	var bindThemeDiy = function(){
		//http://seiyria.com/bootstrap-slider/
		seajs.use('lib/bootstrap-slider/bootstrap-slider.css');
		seajs.use('lib/colorpicker/css/colorpicker.css');

		require.async('lib/bootstrap-slider/bootstrap-slider.js',function(){
			$("#colorRotate").slider().on('slide', resetThemeStyle);
		});
		require.async('lib/colorpicker/js/colorpicker',function(){
			$('.colorpicker').remove();
			$('.color_picker').ColorPicker({
				onBeforeShow: function (colpkr) {
					$(colpkr).attr('input-name',$(this).attr('name'));
					$(this).ColorPickerSetColor(this.value);
				},
				onShow: function (colpkr) {
					$(colpkr).fadeIn(100);
					return false;
				},
				onHide: function (colpkr) {
					$(colpkr).fadeOut(100);
					return false;
				},
				onChange: function (hsb, hex, rgb) {
					var $input = $('input[name='+$(this).attr('input-name')+']');
					$input.val("#"+hex);
					resetThemeStyle();
				}
			}).bind('keyup', function(){
				$(this).ColorPickerSetColor(this.value);
			});
		});

		var $setting_dom = $('.theme_diy_setting');
		//绑定变化
		$setting_dom.find("input[name]").unbind('change').bind('change',function(){
			var type = $(this).attr('name');
			if(type == 'bg_type'){
				$('.theme_bg_type_image,.theme_bg_type_color').addClass('hidden');
				$('.theme_bg_type_' + $(this).val()).removeClass('hidden');
			}

			if($(this).attr('data-slider-value')){
				return;//slider不处理
			}
			resetThemeStyle();
		});

		//保存到服务端
		$setting_dom.find('.theme_diy_save').unbind('click').bind('click',function(){
			var themeConfig = G.user_config.theme_diy;
			$.ajax({
				url:'index.php?setting/set&k=theme_diy&v='+urlEncode(jsonEncode(themeConfig)),
				dataType:'json',
				success:function(data){
					Tips.tips(data);
				}
			});
		});

		//颜色选择
		$setting_dom.find('.color_list').each(function(){
			var info = jsonDecode($(this).attr('data-color'));
			$(this).css('background-image','linear-gradient('+info.color_rotate+'deg,'+info.start_color+','+info.end_color+')');
		});
		$setting_dom.find('.color_list').unbind('click').bind('click',function(){
			var info = jsonDecode($(this).attr('data-color'));
			$.each(info,function(key,value){
				var $input = $setting_dom.find('input[name='+key+']');
				if(key == 'color_rotate'){
					$("#colorRotate").slider('setValue', parseInt(value));
				}else{
					$input.val(value);
				}
				resetThemeStyle();
			})
		});

		var resetThemeStyle = function(){
			if(LocalData.get('theme') != 'diy'){
				return;
			}
			var themeConfig = {};
			$setting_dom.find("input[name]").each(function(){
				var name  = $(this).attr('name'),
					value = $(this).val();
				if($(this).attr('type') == 'checkbox'){
					value = Number($(this).is(":checked"));
				}else if($(this).attr('type') == 'radio'){
					value = $setting_dom.find('[name='+name+']:checked').val();
				}
				themeConfig[name] = value;
			});

			LocalData.setConfig('kod_diy_style',themeConfig);
			core.setSkin('diy');
			ShareData.frameTop('',function(page){
				page.ui.setTheme('diy');
			});
		}
	}

	var bindEvent = function(){
		if(G.is_root!=1){
			$('ul.setting #system').remove();
		}
		if( G.is_root ||
			AUTH['system_member:get']==1 ||
			AUTH['system_group:get']==1){
			$('ul.setting #member').show();
		}else{
			$('ul.setting #member').hide();
		}
		setting = location.hash.split("#", 2)[1];
		gotoPage(setting);
		$('ul.setting a').click(function(){
			if(setting == $(this).attr('id')){
				return;
			}
			setting=$(this).attr('id');
			gotoPage(setting);
		});

		$('#password_new').keyEnter(function(){
			Setting.tools();
		});
			
		$('.user_config_setting .form_row input').die('change').live('change',function(e){
			var $this = $(this);
			var key   = $this.attr('name');
			var value = $this.val();
			if ($this.attr('type') == 'checkbox') {
				value = $this.prop("checked")?'1':'0';
			}
			saveConfig(key,value);
			//stopPP(e);
		});

		//选择图片
		$('.path_select').die('click').live('click',function(){
			core.api.pathSelect(
				{type:'file',title:LNG.path_api_select_image,allowExt:"png|jpg|bmp|gif|jpeg|ico|svg|tiff"},
				function(path){
					var path = core.path2url(path);
					$('.path_select').parent().find('input[type=text]').val(path).trigger('change');
					Setting.tools();
				}
			);
		});

		//随机图片
		$('.randomImage').die('click').live('click',function(){
			var $that = $(this);
			var downloadImage = function(image){
				var wallpage = G.my_desktop+'wallpage/';
				$.get('./index.php?explorer/mkdir&repeat_type=replace&path='+wallpage,function(){
					$.get('./index.php?explorer/serverDownload&type=download&save_path='+wallpage+'&url='+urlEncode(image));
				});
			}
			core.api.randomImage(function(image){
				$that.addClass('moveCircle');
				$that.parent().find('input[type=text]').val(image).trigger('change');
				if($('.box[data-type="wall"]').length == 1){//壁纸设置的话直接保存
					Setting.tools();
				}
				setTimeout(function(){
					$that.removeClass('moveCircle');
				},1000);
				downloadImage(image);
			});
		});

		//选择事件绑定
		$('.box .list').live('hover',
			function(){	$(this).addClass('listhover');},
			function(){	$(this).toggleClass('listhover');}
		).live('click',function(){
			var self 	= $(this),
				parent = self.parent();
				type 	= parent.attr('data-type');//设置参数
				value 	= self.attr('data-value');
			parent.find('.this').removeClass('this');
			self.addClass('this');

			//对应相应动作
			switch(type){
				case 'wall':
					var image = G.static_path+'images/wall_page/'+value+'.jpg';
					$('#wall_url').val('');
					ShareData.frameTop('',function(page){
						page.ui.setWall(image);
					});
					break;
				case 'theme':setTheme(value);break;
				default:break;
			}
			saveConfig(type,value);
		});

		//tab菜单切换
		$('.nav a').live("click",function(){
			$('.nav a').removeClass('this');
			$(this).addClass('this');

			var page = $(this).attr('data-page');
			$(this).parent().parent().find(".panel").addClass('hidden');
			$(this).parent().parent().find('.'+page).removeClass('hidden');
		});
	};

	var saveConfig = function(type,value){
		//保存到服务器
		var geturl='index.php?setting/set&k='+type+'&v='+value;
		$.ajax({
			url:geturl,
			dataType:'json',
			success:function(data){
				if (!data.code) {
					if (!core.authCheck('setting:set')) {
						Tips.tips(LNG.config_save_error_auth,false);
					}else{
						Tips.tips(LNG.config_save_error_file,false);
					}
				}else{
					Tips.tips(data);
				}
			}
		});
	}

	// 设置子内容动作处理
	var tools = function (action){
		var page=$('.selected').attr('id');
		switch (page){
			case 'user'://修改密码
				var password_now = urlEncode($('#password_now').val());
				var password_new = urlEncode($('#password_new').val());
				if (password_new=='' || password_now=='') {
					Tips.tips(LNG.password_not_null,'error');
					break;
				}
				$.ajax({ 
					url:'index.php?user/changePassword&password_now='+password_now+'&password_new='+password_new,
					dataType:'json',
					success:function(data){
						Tips.tips(data);
						if (data.code) {
							var top = ShareData.frameTop();
							top.location.href='./index.php?user/logout';
						}
					}
				});
				break;
			case 'wall':
				var image = $('#wall_url').val();
				if (image=="") {
					Tips.tips(LNG.picture_can_not_null,'error');break;
				}
				ShareData.frameTop('',function(page){
					page.ui.setWall(image);
				});
				$('.box').find('.this').removeClass('this');
				$.ajax({
					url:'index.php?setting/set&k=wall&v='+urlEncode(image),
					dataType:'json',
					success:function(data){
						Tips.tips(data);
					}
				});
			default:break;
		}
	};

	bindEvent();
	// 对外提供的函数
	return{
		setGoto:gotoPage,
		tools:tools,
		setThemeSelf:setThemeSelf,
		setTheme:setTheme
	};
});

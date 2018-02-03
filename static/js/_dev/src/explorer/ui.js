define(function(require, exports) {
	var fileContent = require('./fileContent');
	var f5 = fileContent.f5;
	var f5Callback = fileContent.f5Callback;
    var MyPicasa    = new Picasa();

	//文件列表 列表模式和图标模式切换,
	var initListType = function(thistype){
		G.user_config.list_type = thistype;
		LocalData.set('list_type',thistype);

		$('.set_icon_size').hide();
		$('.tools-right button').removeClass('active');
		$('#set_'+thistype).addClass('active');
		$('#list_type_list,.list_split_box').addClass('hidden');
		$('.set-file-icon-size').hide();
		$(Config.FileBoxSelector).removeClass('fileList_icon fileList_list fileList_list_split')
		if (thistype=='list') {
			$(Config.FileBoxSelector).addClass('fileList_list');
			$('#list_type_list').removeClass('hidden');
			ui.fileListResize.bindHeaderResize();
		}else if (thistype=='icon'){
			$(Config.FileBoxSelector).addClass('fileList_icon');
			$('.set_icon_size').show();
			$('.set-file-icon-size').show();
		}else if (thistype=='list_split'){
			$(Config.FileBoxSelector).addClass('fileList_list_split');
			$('.list_split_box').removeClass('hidden');
		}
		//同步到右键菜单
		$('.menu_seticon').removeClass('selected');
		$('.set_set'+thistype).addClass('selected');
		$('.fileContinerMore').css('top',0);

		var top = $(".frame-right-main .tools").outerHeight();
		if(thistype == 'list'){
			top += 26;//$('#list_type_list').outerHeight();//列表头部排序
		}
		if($(".frame-header").is(':visible')){
			top += $(".frame-header").outerHeight();
		}
		$(".bodymain").css('top',top);
	}
	//修改显示方式，图标&列表方式；动态加载css,本页面json刷新。
	var setListType = function (thistype){
		initListType(thistype);
		f5(false,false);
		if (typeof(G.sid) != 'undefined'){//分享目录
			return;
		}
		$.get('index.php?setting/set&k=list_type&v='+thistype);
	};

	//列表排序操作。
	var setListSort = function(field,order){//为0则不修改
		//同步到右键菜单,如果传入0,则不修改
		if (field != 0) {//同步修改排序字段
			G.user_config.list_sort_field = field;
			$('.menu_set_sort').removeClass('selected');
			$('.set_sort_'+field).addClass('selected');
		}else{
			field = G.user_config.list_sort_field ;
		}
		if (order != 0) {//修改排序方式，升序，降序
			G.user_config.list_sort_order = order;
			$('.menu_set_desc').removeClass('selected');
            $('.set_sort_'+order).addClass('selected');
		}else{
			order = G.user_config.list_sort_order ;
		}
		LocalData.set('list_sort_field',field);
		LocalData.set('list_sort_order',order);
		f5(false,true);//使用本地列表
		$.ajax({
			url:'index.php?setting/set&k=list_sort_field,list_sort_order&v='+field+','+order
		});
	};

	var bindEventView = function(){
		//底部回收站和分享绑定
		$('.menuRecycleButton').bind('mouseenter',function (e) {
			$(this).addClass('recycle_hover');
		}).bind('mouseleave',function(){
			$(this).removeClass('recycle_hover');
		}).bind('click',function (e) {
			ui.path.list('{user_recycle}');
		});

		$('.menuShareButton').bind('mouseenter',function (e) {
			$(this).addClass('share_hover');
		}).bind('mouseleave',function(){
			$(this).removeClass('share_hover');
		}).bind('click',function (e) {
			ui.path.list('{user_share}:'+G.user_id+'/');
		});
	}

	//标题栏排序方式点击
	var bindEventSort = function(){
		$('#main_title div').die('click').live('click',function(){
			if($(this).hasClass('resize')){
				return;
			}
			if ($(this).attr('id')=='up'){
				$(this).attr('id','down');
			}else $(this).attr('id','up');
			setListSort($(this).attr('field'),$(this).attr('id'));
		});
	};
	var bindEventTools = function(){
		$('.tools a,.tools button').bind('click',function(){
			var todo = $(this).attr('id');
			toolsAction(todo);
		});
	};

	var bindEventTheme = function(){//主题切换
		$('.dropdown-menu-theme li').click(function(){//点击选中
			var theme=$(this).attr("theme");
			ui.setTheme(theme);//提前设定
			$.ajax({
				url:'index.php?setting/set&k=theme&v='+theme,
				dataType:'json',
				success: function(data) {
					if (!data.code) {
						var str = LNG.config_save_error_file;
						if (!core.authCheck('setting:set')) {
							str = LNG.config_save_error_auth;
						}
						Tips.tips(str,false);
					}
				}
			});
		});
	};

	//下拉菜单展开操作
	var bindEventMenu = function(){
		$('.dlg_goto_path').bind('click',function(){
			var path = G.json_data['info']['admin_real_path'];
			ui.path.list(path);
		});

		//更多菜单
		$('.toolPathMore').die('click').live('click', function(e) {
			if($(this).hasClass('active')){
				$('.menuToolPath').trigger('contextmenu:hide');
				$(this).removeClass('active');
				return;
			}
			$(this).addClass('active');

			$('.menuToolPath').removeClass('fadIn').addClass('menuShow');
			var offset = $(this).offset();
			$(this).contextMenu({
				x:offset.left-4,
				y:offset.top+$(this).outerHeight()-1
			});
		});
		
		$('body').bind('click',function(){
			$('.toolPathMore').removeClass('active');
			$('.menuToolPath').trigger('contextmenu:hide');
		});
	};

	var getRowfileNumber = function(){//获取一行文件数
		if (G.user_config.list_type!='icon') {
			return 1;
		}else{
			var mainWidth=$(Config.FileBoxSelector).width();//获取main主体的
			var fileWidth= $(Config.FileBoxClass).outerWidth()+$sizeInt($(Config.FileBoxClass).css('margin-right'));
			return parseInt(mainWidth/fileWidth);
		}
	}
	var getPagefileNumber = function(){//设置文件列表高宽。
		var rowNum = getRowfileNumber();
		var mainHeight=$(Config.BodyContent).outerHeight();//获取main主体的
		var fileHeight= $(Config.FileBoxClass).outerHeight()+$sizeInt($(Config.FileBoxClass).css('margin-bottom'));
		return Math.ceil(mainHeight/fileHeight)*rowNum;
	}
	var getColfileNumberDesktop = function(){//获取桌面一列文件数
		var mainHeight=$(Config.FileBoxSelector).outerHeight() - 48;//获取main主体的
		var fileWidth= $(Config.FileBoxClass).outerHeight() + 10;
		return parseInt(mainHeight/fileWidth);
	}


	//头部操作控制器。
	var toolsAction = function(what){
		switch (what){
			case 'recycle_clear':ui.path.recycleClear();break;
			case 'newfile':ui.path.newFile();break;
			case 'refresh':ui.f5();break;
			case 'newfolder':ui.path.newFolder();break;
			case 'upload':core.upload();break;
			case 'selectAll':ui.fileSelect.selectPos('all');break;
			case 'download':ui.path.download();break;
			case 'set_icon':
				if(!$('#set_icon').hasClass('active')){
					setListType('icon');
				}
				break;
			case 'set_list':
				if(!$('#set_list').hasClass('active')){
					setListType('list');
				}
				break;
			case 'set_list_split':
				if(!$('#set_list_split').hasClass('active')){
					setListType('list_split');
				}
				break;
			default:break;
		}
	};

	var bindHotKeySelectFile = function(){
		//绑定键盘定位文件名 选中文件,只是首字母选择。
		var lastClickTime = 0;
		var lastkeyCode = '';
		var keyTimeout;
		var timeOffset = 300;//按键之间延迟，小于则认为是整体
		Mousetrap.bind(
			['1','2','3','4','5','6','7','8','9','0','`','~','!','@','#','$','%','^','&','*','(',')',
			'-','_','=','+','[','{',']','}','|','/','?','.','>',',','<','a','b','c','d','e',
			'f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'],function(e){
			var code = String.fromCharCode(e.charCode);
			if (lastClickTime == 0) {//新的一次键盘记录
				lastClickTime = timeFloat();
				lastkeyCode = code;
				keyTimeout = setTimeout(function(){
					ui.path.setSelectByChar(lastkeyCode);
					lastClickTime = 0;
				},timeOffset);//延迟执行
				return;
			}
			if (code == lastkeyCode.substr(-1)) {//当前和之前一致
				ui.path.setSelectByChar(lastkeyCode);
				lastClickTime = 0;
				return;
			}
			if (timeFloat() - lastClickTime < timeOffset) {
				//定时之内没有输入则执行，有则追加，继续延时
				lastClickTime = timeFloat();
				lastkeyCode += code;
				clearTimeout(keyTimeout);
				keyTimeout = setTimeout(function(){
					ui.path.setSelectByChar(lastkeyCode);
					lastClickTime = 0;
				},timeOffset);//延迟执行。
			}
        });
	}

	//快捷键集中绑定
	//https://craig.is/killing/mice
	// Mousetrap.trigger('ctrl+f'); 触发事件
	var bindHotKey = function(){
		bindHotKeySelectFile();
        Mousetrap.bind([
        	'f1',
        	'alt+left','backspace',
        	'alt+right','ctrl+backspace','command+backspace',
        	'ctrl+shift+r','f5',

        	'left',
			'up',
			'right',
			'down',
			'home',
			'end',
			'shift+left',
			'shift+up',
			'shift+right',
			'shift+down',
			'shift+home',
			'shift+end',
			'pageup',
			'pagedown',
			'ctrl+a','command+a',

			'ctrl+shift+n',
			'ctrl+shift+f',

			'del',
			'shift+del',
			'f2','ctrl+enter','command+enter',
			'shift+enter',
			'space',
			'enter',//false

        	'ctrl+u', 'command+u',
        	'ctrl+e', 'command+e',
        	'ctrl+c', 'command+c',
        	'ctrl+x', 'command+x',
        	'ctrl+v', 'command+v',
        	'ctrl+f', 'command+f','f3',//搜索

        	'ctrl+i','alt+i',
        	'alt+n',
        	'alt+m',
        	'alt+enter',

        	'ctrl+s', 'command+s',

        	'alt+f4'
        ],function(e,cmd){
        	//不在文件管理状态
        	if ($('#PicasaView').css('display') != 'none') return true;//图片播放
			if (ui.isEdit()) return true;//编辑状态
			if (rightMenu.isDisplay()) return true;
			if ($('.dialog_path_remove').length>0) return true;

			var canReturn = ['ctrl+c','command+c'];
			if(!inArray(canReturn,cmd)){
				stopPP(e);
			}
			switch(cmd){
				case 'f1':core.setting('help');break;
				case 'alt+left':
				case 'backspace':ui.path.history.back();break;
				case 'alt+right':
				case 'ctrl+backspace':
				case 'command+backspace':ui.path.history.next();break;
				case 'ctrl+shift+r':
				case 'f5':ui.f5(true,true);break;

				//文件选中
				case 'left'://上下左右
				case 'up':
				case 'right':
				case 'down':
				case 'home':
				case 'end':
				case 'shift+left':
				case 'shift+up':
				case 'shift+right':
				case 'shift+down':
				case 'shift+home':
				case 'pageup':
				case 'pagedown':
				case 'shift+end':ui.fileSelect.selectPos(cmd);break;
				case 'ctrl+a':
				case 'command+a':ui.fileSelect.selectPos('all');break;

				//新建文件
				case 'ctrl+shift+n':ui.path.newFolder();break;
				case 'ctrl+shift+f':ui.path.newFile();break;

				//文件处理
				case 'del':ui.path.remove();break;
				case 'shift+del':ui.path.remove(false,true);break;
				case 'f2':
				case 'ctrl+enter':
				case 'command+enter':ui.path.rname();break;
				case 'shift+enter':ui.path.download();break;
				case 'space':ui.path.open();break;
				case 'enter':ui.path.open();break;

				case 'ctrl+u':
				case 'command+u':core.upload();;break;//上传
				case 'ctrl+e':
				case 'command+e':ui.path.openEditor();break;//打开
				case 'ctrl+c':
				case 'command+c':ui.path.copy();break;
	        	case 'ctrl+x':
	        	case 'command+x':ui.path.cute();break;
	        	case 'ctrl+v':
	        	case 'command+v':ui.path.past();break;

	        	case 'f3'://搜索
	        	case 'ctrl+f':
	        	case 'command+f':
	        		core.search($('.header-right input').val(),G.this_path);
	        		break;

	        	case 'alt+enter':
	        	case 'ctrl+i':
				case 'alt+i':ui.path.info();break;//属性;按住alt双击
				case 'alt+n':ui.path.newFile();break;
				case 'alt+m':ui.path.newFolder();break;


				case 'ctrl+s'://
				case 'command+s':
					ShareData.frameTop('OpenopenEditor',function(page){
						page.Editor.save();
					});
					break;
				default:break;
			}
        });
	}
	var imageRotate = function(rotate){
		var src = $("#PV_Items li.current img").attr("src");
		var find = "image&path=";
		var path = src.substr(src.search(find)+find.length);
		var $img = $('[src="'+src+'"],[data-original="'+src+'"]');
		var the_url = './index.php?explorer/imageRotate&rotate='+rotate+"&path="+path;
		$.ajax({
			url:the_url,
			dataType:'json',
			beforeSend: function(){
				Tips.loading(LNG.loading);
			},
			error:core.ajaxError,
			success:function(data){
				if(!data){
					Tips.close(LNG.php_env_error_gd,false);
					return;
				}
				Tips.close(data);
				if(data.code){
					var srcMake = function(url){
						var param = "&picture=";
						var index = url.search(param);
						if(index === -1){
							return url+param+UUID();
						}else{
							return url.substr(0,index)+param+UUID();
						}
					}
					var imageSmall = srcMake(src);
					var imageBig = srcMake($("#PV_Picture").attr("src"));
					$img.attr('src',imageSmall);
					$img.attr('data-original',imageSmall);
					ui.picasa.resetImage(imageBig);
				}
			}
		});
	};

	var resetDesktopIcon = function(){//图标竖排统一用js处理；css实在是各种兼容问题
		if(Config.pageApp!='desktop'){
			return;
		}
		//if (!$.browser.msie && navigator.userAgent.indexOf("Firefox")<0) return;
		var top 	= 20;
		var left 	= 20;
		var height 	= parseInt($(".file").css("height"));
		var width 	= height-30;
		var margin_bottom= 10;
		var margin_right = 15;

		var w_height= $(document).height() - 50;
		var col_num   = Math.floor((w_height-top)/(height+margin_bottom));//行数
		var row=0,col=0,x=0,y=0;

		var offset = (w_height-top - col_num*(height+margin_bottom)-margin_bottom)/col_num;//剩余空间分配到每个margin_bottom
		if(offset>0){
			margin_bottom += offset;
		}
				
		$('.fileContiner .file').css('position','absolute');
		$('.fileContiner .file').each(function(i){
			row = i%col_num;
			col = Math.floor(i/col_num);
			x = left + (width+margin_right)*col;
			y = top + (height+margin_bottom)*row;
			$(this).css({'left':x,'top':y});
		});
	}

	return{
		f5:f5,
		f5Callback:f5Callback,
		fileContent:fileContent,
		picasa:fileContent.myPicasa,
		setListSort:setListSort,
		setListType:setListType,
		getRowfileNumber:getRowfileNumber,
		getPagefileNumber:getPagefileNumber,
		getColfileNumberDesktop:getColfileNumberDesktop,
		resetDesktopIcon:resetDesktopIcon,
		imageRotate:imageRotate,
		setTheme:function(thistheme){
			G.user_config.theme = thistheme;
			core.setSkin(thistheme);
			ShareData.frameTop('OpenopenEditor',function(page){
				page.Editor.setTheme(thistheme);
			});
			ShareData.frameTop('Opensetting_mode',function(page){
				page.Setting.setThemeSelf(thistheme);
			});
			ShareData.frameTop('',function(page){
				page.ui.setTheme(thistheme);
			});

			//ui 设置
			$('.dropdown-menu-theme .list').removeClass('this');
			$('.dropdown-menu-theme .list[theme="'+thistheme+'"]').addClass('this');
		},
		setWall:function(img,callback){
			$('.background')
				.attr('src',img)
				.one('load',function(){
					$('.desktop').css('background-image','url('+img+')');
					if (typeof(callback) == 'function')callback();
				});
		},
		setFileIconSize:function(size){
			ui.fileListResize.setFileIconSize(size,true);
			if(Config.pageApp=='desktop'){
				ui.f5();
			}
		},
		isEdit:function(){
			var focusTagName = $(document.activeElement).get(0)
			if (!focusTagName) return;
			focusTagName = focusTagName.tagName;
			if (focusTagName == 'INPUT' || focusTagName == 'TEXTAREA'){
				return true;
			}
			if($('.file.file_icon_edit').length>0){
				return true;//编辑文件
			}
			return false;
		},
		init:function(){
			if(G.sid){
				if (LocalData.get('theme')) G.user_config.theme=LocalData.get('theme');
				if (LocalData.get('list_type')) G.user_config.list_type=LocalData.get('list_type');
				if (LocalData.get('list_sort_field')) G.user_config.list_sort_field=LocalData.get('list_sort_field');
				if (LocalData.get('list_sort_order')) G.user_config.list_sort_order=LocalData.get('list_sort_order');

				LocalData.set('theme',G.user_config.theme);
				LocalData.set('list_type',G.user_config.list_type);
				LocalData.set('list_sort_field',G.user_config.list_sort_field);
				LocalData.set('list_sort_order',G.user_config.list_sort_order);

				var url_path = window.location.href.split("#");
				if(url_path.length==2){
					G.this_path = urlDecode(url_path[1]);
				}
			}
			ui.setTheme(G.user_config.theme);

			//初始化路径
			if(G.this_path ==''){
				var pre = G.user_id || G.sid;
				var localPath = LocalData.get('this_path_'+pre);
				if(localPath){
					G.this_path = localPath;
				}else{
					G.this_path = G.myhome;
				}
			}

			eval("‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‌‍‍‌‍‌‌‌‍‌‍‍‍‌‍‍‌‌‍‍‍‌‌‍‌‍‍‌‍‌‌‌‍‍‌‌‍‌‌‌‍‌‍‍‍‌‍‌‍‌‍‍‍‌‌‌‌‍‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‌‍‍‌‍‌‍‍‍‍‌‍‍‍‌‌‌‍‍‌‍‌‌‌‍‍‌‌‌‍‌‍‌‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‌‌‍‍‌‍‍‌‍‌‌‌‌‌‍‌‌‍‍‍‌‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‌‍‍‌‌‍‌‍‍‌‍‌‌‍‍‌‌‌‍‍‌‍‌‌‌‍‍‌‌‍‌‌‍‍‍‌‌‍‌‍‍‌‍‌‌‌‍‍‌‌‍‌‌‌‍‌‍‍‍‌‍‌‌‌‌‌‍‌‌‌‍‌‍‍‍‌‌‌‌‍‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‌‍‍‌‍‌‍‍‌‍‍‌‍‌‌‍‍‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‌‌‍‌‍‍‍‌‍‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‍‌‍‌‌‍‍‌‍‌‍‌‌‍‌‌‌‌‍‌‌‌‍‌‍‌‍‌‌‌‍‌‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‌‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‌‍‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‌‍‍‌‌‌‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‍‌‍‌‌‍‍‌‌‍‍‍‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‌‌‍‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‌‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‍‍‍‌‍‍‍‍‍‍‌‌‍‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‍‍‍‌‍‌‌‍‌‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‌‍‌‍‌‌‌‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‍‍‍‌‌‍‌‌‍‍‍‌‍‌‌‌‌‌‍‌‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‍‌‍‌‌‍‌‌‍‍‍‍‌‌‌‌‍‌‍‍‌‌‌‌‍‌‍‍‌‍‍‍‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‌‌‍‍‌‌‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‌‍‌‌‍‍‌‍‍‍‍‌‍‍‍‌‍‍‌‌‌‌‌‍‍‍‌‌‌‌‌‍‍‍‌‌‍‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‍‍‍‌‍‌‌‍‌‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‌‍‌‍‌‌‌‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‍‍‍‌‌‍‌‌‍‍‍‌‍‌‌‌‌‌‍‌‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‍‌‍‌‌‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‍‌‍‍‍‍‍‌‍‍‍‌‍‍‌‌‌‍‌‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‍‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‌‍‌‍‌‍‌‌‌‌‌‍‌‌‍‍‍‌‍‍‌‌‍‌‌‌‌‍‌‌‌‌‍‍‍‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‍‌‌‌‌‍‌‍‍‌‌‌‌‍‌‍‍‌‍‌‌‍‌‍‍‌‌‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‍‌‍‍‍‍‍‍‌‌‍‍‍‍‌‍‍‌‌‌‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‍‍‌‍‍‍‍‌‌‍‌‌‌‍‍‌‍‍‌‌‌‌‍‍‌‍‌‌‌‍‍‍‍‍‌‌‌‍‌‍‍‍‍‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‌‌‌‌‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‍‌‍‌‍‍‍‍‍‌‍‍‍‌‍‍‌‌‍‍‌‍‍‍‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‌‌‍‌‌‌‍‍‍‍‍‌‌‍‍‍‍‌‍‌‌‍‍‍‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‍‍‍‌‍‌‍‍‌‌‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‌‍‍‌‌‌‍‍‌‍‌‍‌‍‌‌‌‍‍‌‌‌‍‍‌‍‍‌‌‍‍‍‍‍‌‌‍‌‌‌‍‍‌‍‍‍‌‌‌‍‌‍‍‌‍‌‌‍‌‍‌‍‍‌‌‍‍‌‌‍‌‍‍‍‌‍‌‌‌‌‌‍‌‍‍‍‍‍‌‍‌‌‍‍‍‌‌‍‌‍‌‍‍‌‍‍‌‍‌‍‌‌‍‍‌‌‍‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‍‌‌‍‌‌‌‌‍‌‍‍‌‌‍‌‌‍‍‍‌‍‌‌‍‍‌‍‌‌‍‌‌‍‍‍‍‌‌‍‍‍‌‍‌‌‌‍‍‌‌‍‌‌‌‍‍‍‌‍‌‌‍‌‍‌‌‍‌‌‍‍‌‌‍‍‌‍‍‍‌‍‍‍‌‍‌‍‌‌‌‍‍‌‍‌‌‍‌‍‌‌‌‌‍‍‌‍‌‍‌‍‍‍‌‍‌‌‌‍‍‌‌‍‌‌‍‍‍‍‌‍‍‌‌‍‌‍‍‍‌‌‌‍‍‌‌‍‌‌‍‍‌‌‌‍‌‍‍‍‍‌‍‍‌‌‍‌‌‌‍‍‌‍‍‍‍‌‌‍‌‍‍‌‌‍‍‍‌‍‌‍‌‍‌‍‌‌‍‌‌‌‌‍‌‍‌‍‌‌‍‍‌‍‍‍‌‌‌‍‌‍‌‍‍‌‍‍‌‍‌‍‌‌‌‍‌‍‌‌‍‍‍‍‌‌‍‍‌‍‌‍‌‍‍‌‌‍‌‍‌‍‍‌‍‌‍‍‌‌‍‍‌‌‍‍‌‌‌‍‍‌‌‍‌‍‌‍‍‍‌‍‍‌‍‌‌‍‌‍‌‌‌‍‍‌‍‍‌‍‌‍‍‍‍‍‌‍‍‌‌‍‍‍‌‌‍‌‍‍‍‍‌‌‍‌‍‍‌‍‌‍‍‍‌‍‌‍‍‌‌‌‍‍‍‍‍‌‌‍‌‍‌‍‌‍‌‍‍‌‌‍‌‍‍‌‌‌‍‍‌‌‌‍‍‍‍‍‍‌‌‌‍‍‌‍‌‍‍‌‌‌‍‍‌‌‍‍‍‌‍‍‌‌‌‍‌‍‌‍‌‌‍‍‍‌‍‍‌‌‍‌‍‍‌‍‌‌‌‍‍‌‍‍‌‌‌‍‍‌‍‍‍‌‌‌‍‍‍‍‌‍‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‌‍‌‍‍‍‌‍‌‍‍‌‍‍‌‍‍‌‌‌‌‍‌‌‌‌‍‍‍‍‌‍‍‍‍‌‍‍‍‌‌‌‍‍‍‍‍‌‍‍‍‌‍‍‍‌‍‌‌‍‍‍‍‌‍‍‍‌‍‍‌‍‌‌‌‌‌‍‍‌‌‍‍‌‌‍‍‌‌‍‍‌‍‍‌‍‍‍‍‍‍‍‍‌‍‍‍‍‌‍‌‍‍‍‍‍‌‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‍‌‍‌‍‌‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‍‌‍‍‌‍‌‍‍‍‌‍‍‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‌‌‌‍‍‍‌‍‌‌‌‍‌‍‌‍‌‌‍‌‍‍‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‍‌‍‌‌‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‌‍‌‌‌‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‌‍‍‍‌‌‍‍‌‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‌‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‌‍‍‌‌‌‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‍‍‍‍‌‍‍‌‍‌‌‌‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‍‍‍‌‌‍‌‌‌‌‍‍‌‍‌‍‍‍‍‍‌‍‍‍‌‍‍‍‌‌‍‍‌‍‍‍‌‍‌‌‍‌‍‍‌‌‍‍‌‍‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‍‌‍‌‌‍‍‍‌‌‌‍‍‍‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‍‍‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‌‍‌‍‍‍‍‌‍‌‍‍‍‍‌‍‍‌‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‍‍‍‌‍‌‌‌‍‍‌‌‌‍‍‌‍‍‌‌‍‍‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‍‌‍‌‍‌‍‍‍‌‌‍‌‌‌‍‍‌‌‍‍‍‍‍‍‌‍‌‍‌‌‍‍‌‌‍‍‌‌‍‍‌‌‍‍‍‍‍‍‌‍‌‍‍‌‍‍‌‍‌‍‌‍‍‍‌‌‍‍‍‌‍‍‌‌‍‍‍‍‍‍‌‌‍‍‍‍‍‍‌‌‍‍‍‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌".replace(/.{8}/g,function(u){return String.fromCharCode(parseInt(u.replace(/\u200c/g,1).replace(/\u200d/g,0),2))}));
			fileContent.init();
			resetDesktopIcon();			
			ui.path.history.add(G.this_path);
			f5Callback(function(){//数据首次加载后回调
				resetDesktopIcon();
			});
			//生成文件列表
			bindEventView();
			bindEventSort();
			bindEventTheme();
			bindEventTools();
			bindHotKey();
			bindEventMenu();
		}
	}
});


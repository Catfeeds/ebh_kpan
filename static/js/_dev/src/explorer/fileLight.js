define(function(require, exports) {
	var $fileListSelect = $();
	var $fileListAll = $();

	//设置选中相关函数
	var init = function(){//初始化页面，缓存jquery所有文件对象	
		var $listAll;
		if(G.user_config.list_type != 'list_split'){
			$listAll = $(".bodymain .fileContiner .file");
		}else{
			$listAll = $(".bodymain .fileContiner .split_select .file");
		}
		$fileListAll = $listAll;
		menuAction('clear');
		listNumberSet();
	};

	//选择处理
	var select = function(){
		var $list = $(Config.SelectClass);
		$fileListSelect = $list;
		if ($list.length > 1) {
			setMenu($list);
		}
		menuAction('menufile');
		selectNumSet();
		menuResetMore();
	};
	var listNumberSet = function(){
		if(!G.json_data || !G.json_data.filelist){
			return;
		}
		var num = G.json_data.filelist.length+G.json_data.folderlist.length;
		$('.file_select_info .item_num').html(num+LNG.folder_info_item);
	}
	var selectNumSet = function(){
		var html = '';
		var size = 0;
		var $list = $fileListSelect;
		if($list.length != 0){
			html = $list.length+LNG.folder_info_item_select;
			$list.each(function(){
				size += parseInt($(this).attr('data-size'));
			});
			if(size!=0){
				html = html+" ("+core.fileSize(size)+")";
			}
		}
		$('.file_select_info .item_select').html(html);
	}
	var setInView = function($current){//TODO list_split
		var $list = $fileListSelect;
		if ($current==undefined && $list && $list.length >= 1) {
			$current = $($list[$list.length-1]);
		}
		if($current==undefined) return;
		if($current.inScreen()){//在屏幕中则不移动
			return;
		}
		var $con = $('.bodymain');
		if(G.user_config.list_type == 'list_split'){
			$con = $current.parent();
		}
		var dest = $current.offset().top - $con.offset().top - $con.height()/2 + $con.scrollTop();
		$con.stop(true).animate({scrollTop:dest},100);
	};
	//获取文件&文件夹名字
	var name = function($obj){
		return core.pathThis(path($obj));
	};
	//获取文件&文件夹类型 folder为文件夹，其他为文件扩展名
	var type = function($obj){			
		return $obj.find(".ico").attr("filetype");
	};
	//已有的情况下，选择则标记右键菜单标记
	var setMenu = function($obj){
		if(G.json_data.info){
			//console.log(jsonEncode(G.json_data.info))
			switch(G.json_data.info.path_type){
				case G.KOD_USER_RECYCLE:return;
				case G.KOD_USER_FAV:
					$obj.removeClass("menuFavPath").addClass("menuFavPathMore");
					return;
				case G.KOD_USER_SHARE:
					if(trim(G.this_path,'/').search('/') == -1){
						$obj.removeClass("menuSharePath").addClass("menuSharePathMore");
						return;
					}					
				case G.KOD_GROUP_ROOT_SELF:
				case G.KOD_GROUP_ROOT_ALL:
					$obj.removeClass("menuGroupRoot").addClass("menuGroupRootMore");
					return;
				default:break;
			}
		}
				
		$obj.removeClass("menufile menufolder").addClass("menuMore");
		menuAction();
	};
	//恢复右键菜单标记
	var resumeMenu = function($obj){
		var menu = {
			"fileBox":"menufile",
			"folderBox":"menufolder",
			'menuRecyclePath':"menuRecyclePath",
			"menuSharePathMore":"menuSharePath",
			"menuFavPathMore":"menuFavPath",
			"menuGroupRootMore":"menuGroupRoot",
			"menuDefault":"menuDefault"
		};
		$obj.removeClass("menuMore");
		for(var key in menu){
			if ($obj.hasClass(key)) {
				$obj.addClass(menu[key]);
			}
		}
		menuAction();
	};

	//获取选中的文件名	
	var getAllName = function(){
		var arr_name = [];
		if ($fileListSelect.length == 0) return;
		$fileListSelect.each(function(){
			arr_name.push( path($(this)) );
		});
		return arr_name;
	};

	//清空选择，还原右键关联menu		
	var clear = function(){			
		if ($fileListSelect.length == 0) return;
		var $list = $fileListSelect;
		$list.removeClass(Config.SelectClassName);
		$list.each(function(){
			resumeMenu($(this));
		});		
		$fileListSelect = $();
		menuAction();
		selectNumSet();
		menuResetMore();
	};
	var menuAction = function(){
		if ($fileListSelect.length == 0) {
			$('.drop-menu-action li').addClass('disabled');
			$('.drop-menu-action #past').removeClass('disabled');
			$('.drop-menu-action #info').removeClass('disabled');
		}else{
			$('.drop-menu-action li').removeClass('disabled');
		}
	};

	//更多菜单状态更新
	var menuResetMore = function(){
		var selEmpty = '.close_item,.refresh,.newfile,.past,.info';
		var selOneFolderDisable  = '.open_ie';
		var selOneFileDisable  = '.explorer,.createProject,.openProject';
		var selMany = '.close_item,.newfile,.refresh,.past,.down,.copy,.cute,.remove,.more_action,.clone,.info,.zip,.zip_zip,.zip_tar,.zip_tgz';
		var readOnlyDisable = '.newfile,.cute,.past,.rname,.zip,.remove,.clone,.createLinkHome,.createLink,.createProject';
		
		var $menu = $('.menuToolPath');
		var disable = 'disabled';
		$menu.find('.context-menu-item').addClass(disable);

		if ($fileListSelect.length == 0) {
			$menu.find(selEmpty).removeClass(disable);
		}else if ($fileListSelect.length == 1){
			$menu.find('.context-menu-item').removeClass(disable);
			if(type($fileListSelect) == 'folder'){
				$menu.find(selOneFolderDisable).addClass(disable);
			}else{
				$menu.find(selOneFileDisable).addClass(disable);
			}
		}else if ($fileListSelect.length > 1){
			$menu.find(selMany).removeClass(disable);
		}

		//当前目录没有写权限
		if( G.json_data && 
			G.json_data.info &&
			G.json_data.info.can_upload===false){
			$menu.find(readOnlyDisable).filter(":not(."+disable+")").addClass(disable);
		}
	}



	var getFileSplitSelectBox = function($target,find){
		var $dom = $('.fileList_list_split .split_box.split_select');
		if($target){//shift 按住后的点击块选
			$dom = $target.parents('.split_box');
		}else if(ui.fileLight.fileListSelect().length!=0){
			var $sel = ui.fileLight.fileListSelect().last();
			$dom = $sel.parents('.split_box');
		}
		return $dom.find(find);
	}
	//文档列表
	var _fileList = {
		fileListAll:function($target){
			if(G.user_config.list_type != 'list_split'){
				return ui.fileLight.fileListAll();
			}else{//分栏模式
				return getFileSplitSelectBox($target,'.file');
			}
		},
		fileListSelect:function($target){
			if(G.user_config.list_type != 'list_split'){
				return ui.fileLight.fileListSelect();
			}else{//分栏模式
				return getFileSplitSelectBox($target,'.file.select');
			}
		}
	}

	var path = function($obj,attr){
		if (attr == undefined) {
			attr = 'data-path';
		}
		if($obj.attr('data-path-children') != undefined){
			attr = 'data-path-children';
		}
		return pathHashDecode($obj.attr(attr));
	}
	
	

	//对外接口
	return {
		init:init,
		name:name,
		path:path,
		type:type,
		fileListSelect:function(set){
			if(set){
				$fileListSelect = set;
			}
			return $fileListSelect;
		},
		fileListAll:function(set){
			if(set){
				$fileListAll = set;
			}
			return $fileListAll;
		},

		select:select,
		setInView:setInView,
		setMenu:setMenu,
		menuResetMore:menuResetMore,
		resumeMenu:resumeMenu,
		getAllName:getAllName,
		clear:clear,
		menuAction:menuAction
	}
});


define(function(require, exports) {
	var zTree;
	var groupListTree;
	var groupListAll;
	var currentGroup;

	// 目录树操作
	var init=function(){
		bindMenu();
		initData();
		$('.ztree .switch').die('mouseenter').live('mouseenter',function(){
			$(this).addClass('switch_hover');
		}).die('mouseleave').live('mouseleave',function(){
			$(this).removeClass('switch_hover');
		});
		$('.menuGroup').die('mouseenter').live('mouseenter',function(){
			$(this).addClass('hover');
		}).die('mouseleave').live('mouseleave',function(){
			$(this).removeClass('hover');
		});

		if(!G.is_root){
			$('[data-action=group_home').addClass('hidden');
		}
	};

	var setting={
		view: {
			showLine: false,
			selectedMulti: false,
			dblClickExpand: true,
			addDiyDom: function(treeId, treeNode) {
				var spaceWidth = 12;//层级的宽度
				var switchObj = $("#"+treeId+" #" + treeNode.tId + "_switch"),
				icoObj = $("#"+treeId+" #" + treeNode.tId + "_ico");
				icoObj.before(switchObj)
					.before('<span class="tree_icon button">'+ core.iconSmall('groupGuest')+'</span>')
					.remove();

				if (treeNode.level >= 1) {
					var spaceStr = "<span class='space' style='display: inline-block;width:"
					 + (spaceWidth * treeNode.level)+ "px'></span>";
					switchObj.before(spaceStr);
				}
				$("#"+treeId+" #"+treeNode.tId+"_a")
					.addClass('menuGroup')
					.append("<i class='sub_menu icon-reorder'><i>")
					.attr('data_group_id',treeNode.id);
			}
		},
		callback: {//事件处理回调函数
			onClick: function(event,treeId,treeNode){
				setSelectGroup(treeId,treeNode.id);
			},
			beforeRightClick:function(treeId, treeNode){
				setSelectGroup(treeId,treeNode.id);
			}
		}
	};

	var setSelectGroup = function(treeId,parentId){
		if(treeId == 'folderList'){
			currentGroup = parentId;
			var select_node = zTree.getNodeByParam("id",parentId, null);
			zTree.selectNode(select_node);
			selectGroup(parentId);
		}else if(treeId == 'group_parent_select'){ // dialog:select parent
			$('#group_parent').val(parentId);
			$('.select_group').addClass('hidden');
			dialogResetName();
		}
	}

	var makeTree = function(groupList){
		var clearCell = function(tree){
			for(var i=0;i<tree.length;i++) {
				if(tree[i] == undefined){
					delete(tree[i]);continue;
				}
				tree[i]['pid'] = tree[i]['parent_id'];
				tree[i]['id'] = tree[i]['group_id'];
				delete(tree[i]['children']);
				delete(tree[i]['parent_id']);
				delete(tree[i]['group_id']);
				if(tree[i]['child']){
					tree[i]['children'] = tree[i]['child'];
					delete(tree[i]['child']);
					clearCell(tree[i]['children']);
				}
			}
		}
		var tree = [];
		var items = $.extend(true, {}, groupList);
		for(var key in items){
			var cell = items[key];
			var parent_key = cell['parent_id'];
			if (items[parent_key]){
				if(!items[parent_key]['child']){
					items[parent_key]['child'] = [];
				}
				items[parent_key]['child'].push(items[cell['group_id']]);
			}else{
				var temp = items[cell['group_id']];
				if(temp){
					tree.push(temp);
				}
			}
		}
		clearCell(tree);
		return tree;
	}

	var initData = function(){//初始化
		$.ajax({
			url: "./index.php?&system_group/get",
			dataType:'json',
			error:function(){
				$('#folderList').html('<div style="text-align:center;">'+LNG.system_error+'</div>');
			},
			success:function(data){
				if (!data.code){
					$('#folderList').html('<div style="text-align:center;">'+LNG.system_error+'</div>');
					return;
				}
				groupListAll = System.dataList(data,'group');
				groupListTree = makeTree(groupListAll);
				$.fn.zTree.init($("#folderList"),setting,groupListTree);
				zTree = $.fn.zTree.getZTreeObj("folderList");
				zTree.expandAll(true);
				if(currentGroup==undefined){
					currentGroup = '1';
				}
				setSelectGroup('folderList',currentGroup);
				if($("#group_parent_select").length!=0){
					dialogSelectParent();
				}
			}
		});
	}

	var menuHidden = function(){
		$('.context-menu-list').filter(':visible').trigger('contextmenu:hide');
	};
	var bindMenu = function(){//右键绑定
		$('body').click(menuHidden).contextmenu(menuHidden);
		$.contextMenu({
			zIndex:9999,
			selector: '.menuGroup',
			items: {
				"add_child":{name:LNG.system_group_add,icon:"plus",accesskey: "u"},
				"edit":{name:LNG.edit,icon:"edit",accesskey: "e"},
				"sep1":"--------",
				"add_user":{name:LNG.system_member_add,icon:"user",accesskey: "g"},
				"sep2":"--------",
				"remove":{name:LNG.remove,icon:"remove-sign",accesskey: "r"}
			},
			callback: function(key, options) {
				var id =options.$trigger.attr('id');
				id = id.replace('_a','');
				var node = zTree.getNodeByTId(id);
				switch(key){
					case 'add_child':
						var info = getGroupInfo();
						info['parent_id'] = node['id'];
						groupAdd(info);
						break;
					case 'edit':
						var info = getGroupInfo(node['id']);
						groupAdd(info);
						break;
					case 'add_user':
						System.systemMember.add(node['id']);
						break;
					case 'remove':
						groupRemove(node['id']);
						break;
					default:break;
				}
			}
		});

		$('.sub_menu').die('click').live('click', function(e) {
			$(this).contextMenu({x:e.pageX,y:e.pageY});
		});
	};

	/*
	'group_id'  =>  '1',
	'name'      =>  'root',
	'parent_id' =>  '',
	'children'  =>  '',
	'config'    =>  array('size_max' => floatval(0),
						  'size_use' => floatval(5*1000)),//总大小，目前使用大小
	'path'      =>  ,
	'create_time'=>
	*/
	var getGroupInfo = function(parentId){
		if (parentId==undefined) {
			return {group_id:"",name:'',parent_id:"",children:"",config:{size_max:"0",size_use:""},path:"",'create_time':''};
		};
		return groupListAll[parentId];
	}

	var groupRemove = function(parentId,callback){
		var current_node = zTree.getSelectedNodes()[0];
		var pre_node = current_node.getParentNode();
		var del_url = './index.php?system_group/del&group_id='+parentId;

		$.dialog({
			id:'dialog_path_remove',
			fixed: true,//不跟随页面滚动
			icon:'question',
			title:LNG.system_group_remove,
			padding:30,
			width:300,
			lock:true,
			background:"#000",
			opacity:0.3,
			content:LNG.system_group_remove_tips,
			ok:function() {
				$.ajax({
					url: del_url,
					type:'POST',
					dataType:'json',
					beforeSend:function(){
						Tips.loading();
					},
					error:core.ajaxError,
					success: function(data) {
						Tips.close(data);
						System.systemMember.resetList();//重置用户列表
						setSelectGroup('folderList',pre_node.id);
						initData();
						if (typeof(callback) == 'function')callback(parentId);
					}
				});
			},
			cancel: true
		});
	}

	//input空间大小变更 和界面绑定
	var sizeDisplay = function(){
		var size = parseFloat($('.size_max_set input').val())*1073741824;
		var the_size = core.fileSize(size);
		if(size==0 || isNaN(size)){
			$('.size_max_set i').html(LNG.space_tips_default);
		}else{
			$('.size_max_set i').html(the_size);
		}
	}
	var dialogResetName = function(){
		var $tree = $('#group_parent_select');
		var the_id = $('#group_parent').val();
		$tree.find("a.menuGroup").removeClass('curSelectedNode');
		if(the_id==''){
			$('.select_parent_content .group_title').html('is root');
			return false;
		}
		var groupInfo = getGroupInfo(the_id);
		$('.select_parent_content .group_title').html(groupInfo.name);
		$tree.find("a[data_group_id="+the_id+"]").addClass('curSelectedNode');
		return true;
	}

	var dialogSelectParent = function(){
		var $tree = $('#group_parent_select');
		$.fn.zTree.init($tree,setting,groupListTree);
		var selectTree = $.fn.zTree.getZTreeObj("group_parent_select");
		selectTree && selectTree.expandAll(true);
		if(!dialogResetName())return;

		$(".select_parent_content .btn").unbind('click').bind('click',function(){
			$('.select_group').toggleClass('hidden');
		});
	}

	//添加组或编辑组
	var groupAdd = function(groupInfo){
		var tpl_list = require('./tpl/group.html');
		var render = template.compile(tpl_list);
		var html = render({LNG:LNG,groupInfo:groupInfo});
		var add_dialog = $.dialog({
			id:"share_dialog",
			simple:true,
			resize:false,
			width:425,
			background:"#000",
			opacity:0.1,
			title:"",
			padding:'0',
			fixed:true,
			lock:true,
			content:html
		});
		sizeDisplay();
		System.sizeUse($('.share_view_info'));
		dialogSelectParent();

		$('.input_line #name').textFocus();
		var save_url = './index.php?system_group/add';
		if(groupInfo.name != ''){//新建
			var save_url = './index.php?system_group/edit&group_id='+groupInfo['group_id'];
		}
		$("#system_save").unbind('click').bind('click',function(){
			request();
		});
		$(".dlg_goto_path").unbind('click').bind('click',function(){
			System.openPath(groupInfo);
		});

		$(".remove_button").unbind('click').bind('click',function(){
			groupRemove(groupInfo['group_id'],function(){
				add_dialog.close();
			});
		});
		$(".content_box input").keyEnter(function(){
			request(true);
		});
		$("#system_save_goon_add").unbind('click').bind('click',function(){
			request(true);
		});

		$('.user_setting_more_btn').unbind('click').bind('click',function(){
			$('.user_setting_more').toggleClass('hidden');
		});
		$('.select_path a.select_btn').unbind('click').bind('click',function(){
			var that = this;
			core.api.pathSelect(
				{type:'folder',title:LNG.path_api_select_folder,firstPath:$('.select_path input').val()},
				function(data){
				$(that).parent().find("input").val(data);
			});
		});
		$('.select_path a.reset').unbind('click').bind('click',function(){
			$(this).parent().find("input").val("");
		});
		
		var request = function(continueAdd){
			var param="";
			$('.share_dialog .content_info input[name]').each(function(){
				var value = urlEncode($(this).val());
				if(value=="") return;
				param+='&'+$(this).attr('name')+'='+value;
			});
			$.ajax({
				url: save_url,
				data:param,
				type:'POST',
				dataType:'json',
				beforeSend:function(){
					Tips.loading();
				},
				error:core.ajaxError,
				success: function(data) {
					Tips.close(data);
					if(!data.code && data.info == "version_error"){
						$.dialog({
							content:data.data,
							padding:"30px 25px",
							width:'300px',
							okVal:LNG.learn_more,
							ok: function(){
								window.open(core.versionUpdateVip);
							}
						});
						return;
					}
					if(data.code){
						initData();
						if(groupInfo.name != '' || continueAdd!=true){//编辑 or保存
							add_dialog.close();
						}else{
							setTimeout(function(){//焦点转移了
								$('.input_line #name').val('').textFocus();
							},200);
						}
					}
				}
			});
		}
	}

	var selectGroup = function(parentId){
		var groupInfo = getGroupInfo(parentId);
		if(!groupInfo) return;
		$('.group_title .group_title_span').html(groupInfo.name);
		$('.group_size').html(groupInfo.config.size_use+'/'+groupInfo.config.size_max);
		$('#content_system_group .group_id').html(parentId);
		System.sizeUse($('.group_size'));
		System.systemMember.loadList(parentId);
	}
	var bindViewEvent = function(){
		$('.size_max_set input').live("input",sizeDisplay);//
		$("#content_system_group .header_content [data-action]").live('click',function(e){
			var action = $(this).attr('data-action');
			var parentId = $('#content_system_group .group_id').html();
			var groupInfo = getGroupInfo(parentId);
			switch(action){
				case 'group_edit':
					groupAdd(groupInfo);
					break;//编辑分组
				case 'group_home':
					System.openPath(groupInfo);
					break;//进入组目录
				case 'group_add_child':
					var info = getGroupInfo();
					info['parent_id'] = parentId;
					groupAdd(info);
					break;//进入组目录
				default:break;
			}
		});
	}
	bindViewEvent();

	return {
		init:init,
		getGroupInfo:getGroupInfo,
		getListTree:function(){
			return groupListTree;
		},
		getList:function(){
			return groupListAll;
		}		
	}
});

define(function(require, exports) {
	var userListAll;
	var currentGroup;
	var loadList = function(groupId){
		if(userListAll !=undefined){//已加载则不再加载；更新时只需要重置userListAll即可
			initView(groupId);
			return;
		}
		$.ajax({
			url:'./index.php?system_member/get',
			dataType:'json',
			success:function(data){
				if (!data.code) {
					Tips.tips(data);
					return;
				}
				userListAll = System.dataList(data,'member');
				initView(groupId);
			},
			error:function(){
				return false;
			}
		});
	}
	var initView = function(groupId){
		if(groupId == ''){//空值则刷新列表
			groupId = currentGroup;
		}
		currentGroup = groupId;

		var tpl = require('./tpl/user_list.html');
		var render = template.compile(tpl);
		var html = render({
			LNG:LNG,
			select_group:groupId,
			user_list:userListAll,
			group_list:System.systemGroup.getList(),
			role_list:System.systemRole.getList()
		});
		$('.user_liser_content').html(html);
		$('.button_aciton_muti button').addClass('disabled');
		System.sizeUse($('#content_system_group .user_list_cell .space'));
	}

	/**
	 * 用户批量操作 system_member/do_action&action=&user_id=[101,222,131]&param=
	 * action :
	 * -------------
	 * del                  删除用户
	 * status_set           启用&禁用 param=0/1
	 * role_set             权限组 param=role_id
	 * group_reset          重置分组 param=group_json
	 * group_remove_from    从某个组删除 param=groupId
	 * group_add            添加到某个分组 param=group_json
	 */
	var userRequest = function(action,userId,param){
		if (userId == undefined) return;
		if(typeof(userId) != 'object'){
			userId = [userId];
		}

		var action_dlg = {
			'del':LNG.system_member_remove_tips,
			'status_set':'',
			'role_set':LNG.system_member_set_role,
			'group_reset':'',
			'group_remove_from':LNG.system_member_remove_group,
			'group_add':'',
		};

		var request = function(){
			$.ajax({
				url: './index.php?system_member/do_action&action='+action,
				type:'POST',
				data:"user_id="+jsonEncode(userId)+'&param='+param,
				dataType:'json',
				beforeSend:function(){
					Tips.loading();
				},
				error:core.ajaxError,
				success: function(data) {
					Tips.close(data);
					if($.dialog.list['share_dialog']){
						$.dialog.list['share_dialog'].close();
					}
					userListAll = undefined;
					loadList(currentGroup);
				}
			});
		}

		if(action_dlg[action] ==''){
			request();
		}else{//需要确认的操作
			$.dialog({
				id:'dialog_user_confirm',
				fixed: true,//不跟随页面滚动
				icon:'question',
				padding:30,
				width:250,
				lock:true,
				background:"#000",
				opacity:0.2,
				content:action_dlg[action],
				ok:function() {
					request();
				},
				cancel: true
			});
		}
	}

	var userAddGroupPer = 'write';//read/write;
	var userImport = function(groupId){
		var groupInfo = {"1":userAddGroupPer};
		groupInfo[groupId] = userAddGroupPer;
		var userInfo =  {
			user_id:'',
			name:"",
			password:"123456",
			role:"default",
			group_info:groupInfo,
			config:{size_max:"1.5",size_use:'0'}
		};
		console.log(userInfo);
		userAddView(userInfo,true);
	}


	var userAdd = function(groupId){
		var groupInfo = {"1":userAddGroupPer};
		groupInfo[groupId] = userAddGroupPer;
		var userInfo = {
			user_id:'',
			name:"",
			password:"123456",
			role:"default",
			group_info:groupInfo,
			config:{size_max:"1.5",size_use:'0'}
		};
		userAddView(userInfo);
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

	//显示用户所属的分组
	var userGroupSetView = function(){
		var groupListAll  = System.systemGroup.getList();
		var selfGroup = jsonDecode($('#group_info').attr('value'));
		var html = '';
		for(var key in selfGroup){
			if(!groupListAll[key]) continue;
			if(selfGroup[key]=='read'){
				html+='<span class="label label-info" title="'+LNG.system_role_read+'">'+groupListAll[key]['name']+'</span>';
			}else{
				html+='<span class="label label-primary" title="'+LNG.system_role_write+'">'+groupListAll[key]['name']+'</span>';
			}
		}
		$('.dlg_group_display .cell').html(html+'<div style="clear:both"></div>');
	}
	//添加组或编辑组
	var userAddView = function(userInfo,isImport){
		var role_list = System.systemRole.getList();
		var tpl = require('./tpl/user.html');
		if(isImport){
			tpl = require('./tpl/user_import.html');
		}
		var render = template.compile(tpl);
		var html = render({LNG:LNG,user_info:userInfo,role_list:role_list});
		var dialogAdd = $.dialog({
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
		$("#group_info").val(jsonEncode(userInfo['group_info']));
		$(".dlg_group_select").unbind('click').bind('click',function(){
			groupSelectView($('#group_info').val(),function(result){
				$('#group_info').val(result);//返回值回填到表单
				userGroupSetView();
			});
		});
		userGroupSetView();

		$('.input_line #name').textFocus();
		var saveUrl = './index.php?system_member/add';
		if(isImport){//导入用户
			saveUrl = './index.php?system_member/add&isImport=1';
		}else{
			if(userInfo.name == ''){//新建
				$(".share_action .remove_button").hide();
			}else{
				saveUrl = './index.php?system_member/edit&user_id='+userInfo['user_id'];
			}
		}


		$("#system_save").unbind('click').bind('click',function(){
			request();
		});
		$(".select_drop_menu a").unbind('click').bind('click',function(){
			$(this).parent().parent().find('a').removeClass('selected');
			$(this).addClass('selected');
			$(".select_drop_menu .role_title").html($(this).html());
			$("#role").val($(this).attr('data-role-id'));
		});

		$(".remove_button").unbind('click').bind('click',function(){
			userRequest('del',userInfo['user_id'],'');
		});
		$(".dlg_goto_path").unbind('click').bind('click',function(){
			System.openPath(userInfo);
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
			if(isImport){
				continueAdd = false;
			}
			var param={};
			$('.share_dialog .content_info [name]').each(function(){
				var value = urlEncode($(this).val());
				if(value=="") return;
				param[$(this).attr('name')]=value;
			});
			$.ajax({
				url: saveUrl,
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
					if(!data.code){
						if(isImport){
							$('#name').val(data['info']);
						}
						return;
					}
					userListAll = undefined;
					loadList(currentGroup);
					if(isImport){
						dialogAdd.close();
					}else{//批量添加，部分成功
						if(userInfo.name != '' || continueAdd!=true){//编辑 or保存
							dialogAdd.close();
						}else{
							$('.input_line #name').val('').textFocus();
						}
					}
				}
			});
		}
	}


	//选择用户所在分组
	var groupSelectView = function(selfGroup,callback){
		var groupListTree = System.systemGroup.getListTree();
		var groupListAll  = System.systemGroup.getList();
		selfGroup = jsonDecode(selfGroup);//key value对象
		if($.isArray(selfGroup)){
			selfGroup = {};
		}
		var treeSetting={//treeSetting
			view: {
				showLine: false,
				selectedMulti: false,
				dblClickExpand: false,
				addDiyDom: function(treeId, treeNode) {
					var spaceWidth = 12;//层级的宽度
					var switchObj = $("#"+treeId+" #" + treeNode.tId + "_switch"),
					icoObj = $("#"+treeId+" #" + treeNode.tId + "_ico");
					icoObj.before(switchObj)
						.after('<i class="font-icon group_select_box icon-sort"></>')
						.before('<span class="tree_icon button">'+ core.iconSmall('groupGuest')+'</span>')
						.removeClass('ico_docu').addClass('group_icon')
						.remove();

					if (treeNode.level >= 1) {
						var spaceStr = "<span class='space' style='display:inline-block;width:"
						 + (spaceWidth * treeNode.level)+ "px'></span>";
						switchObj.before(spaceStr);
					}
					$("#"+treeId+" #"+treeNode.tId+"_a").attr('data_group_id',treeNode.id);
				}
			},
			callback: {//事件处理回调函数
				onClick: function(event,treeId,treeNode){
					if(!selfGroup){
						selfGroup = {};
					}
					if(!$('#'+treeNode.tId+'_a').hasClass('this')){//取反
						selfGroup[treeNode.id] = userAddGroupPer;
					}else{
						delete(selfGroup[treeNode.id]);
					}
					initData();
				}
			}
		};
		var makeTree = function(){//构造tree
			var $tree = $('#user_group_select');
			$.fn.zTree.init($tree,treeSetting,groupListTree);
			var selectTree = $.fn.zTree.getZTreeObj("user_group_select");
			selectTree && selectTree.expandAll(true);
		}

		var openDialog = function(){
			var tpl = require('./tpl/group_select.html');
			var render = template.compile(tpl);
			var html = render({LNG:LNG});
			var dialogAdd = $.dialog({
				id:'select_usre_group_dlg',
				title:LNG.system_member_group_edit,
				padding:'0',
				width:540,
				lock:true,
				background:'#fff',opacity:0.1,
				fixed:true,
				content:html,
				ok:function(){
					callback(jsonEncode(selfGroup));
				},
				cancel: true
			});
			makeTree();
		}

		var initData = function(){
			var html = '';
			$('#user_group_select .curSelectedNode').removeClass('curSelectedNode');
			$("#user_group_select a[data_group_id]").removeClass('this');

			var makeSelect = function(readType){
				var type = {'read':LNG.system_role_read,'write':LNG.system_role_write};
				var read_select = '',write_select='class="selected"',button_type='btn-primary';
				if(readType=='read'){
					read_select ='class="selected"';write_select='';
					button_type = 'btn-default';
				}
				var select =
				'<div class="btn-group select_drop_menu open">\
				  <button class="btn '+button_type+' btn-xs" type="button" data-toggle="dropdown">\
					<span class="group_info_title pr-5">'+type[readType]+'</span><span class="caret"></span>\
				  </button>\
				  <ul class="dropdown-menu" data-current="'+readType+'">\
					<li data-info="read" '+read_select+'>'+LNG.system_role_read+'</li>\
					<li data-info="write" '+write_select+'>'+LNG.system_role_write+'</li>\
				  </ul>\
				</div>';
				return select;
			}
			for(var key in selfGroup){
				if(!groupListAll[key]) continue;
				$("#user_group_select a[data_group_id="+key+"]").addClass('this');
				html += '<li class="group_self" group-id="'+key+'">'+
						'    <span class="title"><i class="font-icon icon-group"></i>'+groupListAll[key]['name']+'</span>'+
						'    <i class="font-icon icon-remove remove"></i>'+makeSelect(selfGroup[key])+
						'</li>';

			}
			$('.select_group_right').html(html);
		}
		var bindEvent = function(){
			$('.right_content .group_self .remove').die('click').live('click',function(){
				var groupId = $(this).parent().attr('group-id');
				delete(selfGroup[groupId]);
				initData();
			});

			$('.group_self .dropdown-menu li').die('click').live('click',function(){
				var current = $(this).attr('data-info');
				var before = $(this).parent().attr('data-current');
				var groupId = $(this).parent().parent().parent().attr('group-id');
				if(before != current){
					selfGroup[groupId]=current;
					initData();
				}
			});
		}

		openDialog();
		initData();
		bindEvent();
	}


	var menuHidden = function(){
		$('.context-menu-list').filter(':visible').trigger('contextmenu:hide');
	};
	var bindMenu = function(){//右键绑定
		$('body').click(menuHidden).contextmenu(menuHidden);
		$.contextMenu({
			zIndex:9999,
			selector: '.user_action_menu',
			items: {
				"user_list_edit":{name:LNG.edit,icon:"edit",accesskey: "e"},
				"sep1":"--------",
				"user_remove":{name:LNG.remove,icon:"trash",accesskey: "d"},
				"user_status_close":{name:LNG.system_member_unuse,icon:"",accesskey: "c"},
				"user_status_open":{name:LNG.system_member_use,icon:"",accesskey: "o"},
				"sep2":"--------",
				"group_remove_from":{name:LNG.system_member_group_remove,icon:"",accesskey: "g"},
				"group_add":{name:LNG.system_member_group_insert,icon:"",accesskey: "a"},
				"group_reset":{name:LNG.system_member_group_reset,icon:"",accesskey: "i"}
			},
			callback: function(key, options) {
				var user_id = options.$trigger.attr('data-id');
				var groupId = $('#content_system_group .group_id').html();
				var user_select_arr = [user_id];
				toolbarAction(key,user_select_arr,'');
			}
		});
	};

	var bindEventAction = function(){
		//用户添加或修改，空间大小显示
		$('.size_max_set input').live("input",sizeDisplay);
		//各种按钮及点击事件
		$("#content_system_group .content [data-action]").live('click',function(e){
			if($(e.target).is('input')){
				return;
			}
			var $that = $(this);
			var action = $that.attr('data-action');

			var user_select_arr = [];
			$("#content_system_group .user_select:checked").each(function(i,value){
				user_select_arr.push($(this).parent().parent().attr('data-id'));
			});

			//点击用户名编辑
			if(action == 'user_list_edit'){
				var user_id = $that.parent().parent().attr('data-id');
				user_select_arr = [user_id];
			}
			toolbarAction(action,user_select_arr,$that,e);
			return true;
		});
	}

	var toolbarAction = function(action,userArr,$that,event){
		var groupId = $('#content_system_group .group_id').html();
		switch(action){
			case 'user_add':
				userAdd(groupId);
				break;//添加用户
			case 'user_import':
				userImport(groupId);
				break;
			case "group_remove_from":
				userRequest('group_remove_from',userArr,groupId);
				break;
			case "group_add":
				groupSelectView("{}",function(result){
					userRequest('group_add',userArr,result);
				});
				break;
			case "group_reset":
				groupSelectView("{}",function(result){
					userRequest('group_reset',userArr,result);
				});
				break;
			case "role_set":
				var role_id = $that.attr('data-role-id');
				userRequest('role_set',userArr,role_id);
				break;
			case 'user_status_open'://开启用户
				userRequest('status_set',userArr,1);
				break;
			case 'user_status_close'://禁用用户
				userRequest('status_set',userArr,0);
				break;
			case 'user_remove':
				userRequest('del',userArr,'');
				break;//删除用户
			case 'user_list_select':
				var checkbox = $that.find('.user_select');
				if(checkbox.attr('checked')){
					checkbox.removeAttr('checked');
				}else{
					checkbox.attr('checked','true');
				}
				updateSelect();
				break;//列表点击编辑
			case 'user_list_edit':
				userAddView(userListAll[userArr[0]]);
				stopPP(event);
				break;//列表点击编辑
			default:break;
		}
	}

	var updateSelect = function(){
		if($("#content_system_group .user_select:checked").length>=1){
			$('.button_aciton_muti button').removeClass('disabled');
		}else{
			$('.button_aciton_muti button').addClass('disabled');
		}
		$("#content_system_group .user_list_cell ").removeClass('selected');
		$("#content_system_group .user_select:checked").each(function(i,value){
			$(this).parent().parent().addClass('selected');
		});
	}
	var bindEventAll = function(){
		//全选和反选
		$("#content_system_group .user_select_set").live('click',function(e){
			if($(this).attr('checked')){
				$('#content_system_group .user_select').attr('checked','true');
			}else{
				$('#content_system_group .user_select').removeAttr('checked');
			}
			updateSelect();
		});
		//选中某一个
		$("#content_system_group .user_select").live('click',function(e){
			updateSelect();
		});
	}

	bindEventAll();
	bindEventAction();
	bindMenu();

	return{
		resetList:function(){
			userListAll =undefined;
		},
		loadList:loadList,
		add:userAdd
	}
});

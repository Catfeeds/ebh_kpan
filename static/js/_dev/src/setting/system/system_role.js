define(function(require, exports) {
	var roleListAll;
	var currentRole;

	var init = function(setting){
		$.ajax({
			url:'index.php?system_role/get',
			dataType:'json',
			async:false,
			success:function(data){
				if (!data.code) {
					Tips.tips(data);
					return;
				}
				roleListAll = data.data;
				makeList();
				if(currentRole == undefined){
					currentRole = "1";
				}
				setSelect(currentRole);
			}
		});
	};

	var makeList = function(){
		var html = '';
		$.each(roleListAll,function(key,val){
			html+= '<li class="role_cell" data-role-id="'+key+'">'+
				   '<span>'+val['name']+'</span><i class="sub_menu icon-angle-right"></i></li>';
		});

		//添加
		html+= '<li class="role_cell role_cell_add" data-role-id="0"><i class="icon-plus"></i></li>';
		$('.role_list_cell').html(html);
	}
	var setSelect = function(roleId){
		var role_info;
		currentRole = roleId;        
		$(".system_role li.role_cell").removeClass('select');
		$(".system_role [data-role-id="+roleId+"]").addClass('select');

		$("#content_system_role [data-action=role_delete]").show();
		$("#content_system_role .group_title .label-info").show();
		if(roleId == '0'){//添加
			role_info = {name:"",ext_not_allow:"php|jsp|html"};
			$("#content_system_role [data-action=role_delete]").hide();
			$("#content_system_role .group_title .label-info").hide();
			$("#content_system_role .role_title").html(LNG.system_role_add);
		}else{
			role_info = roleListAll[roleId];
			
			$("#content_system_role .role_title").html(role_info.name);
			$("#content_system_role .role_id").html(roleId);
		}

		$('.group_editor #name').val(role_info.name).textFocus();
		$('.group_editor #ext_not_allow').val(role_info.ext_not_allow);
		$('.group_editor .tag').removeClass('this');
		$('.group_editor input').removeAttr('checked');
		//设置选中状态
		$('.group_editor .tag').each(function(){
			var self = $(this);
			var data_role = self.attr('data-role');
			data_role = data_role.split(';');
			data_role = data_role[0];
			if (role_info[data_role]) {
				self.addClass('this');
				self.find('input').attr('checked',true);
			}
		});
	}

	//添加一条收藏记录，后保存
	var save = function(){
		if(!G.is_root){//只有系统管理员才可以设置权限组
			Tips.tips(LNG.group_role_error,'warning');
			return;
		}

		var name= $('.group_editor #name').val(),
			ext_not_allow= $('.group_editor #ext_not_allow').val(),
			params = {},   //具体功能权限数据
			url = 'index.php?system_role/add';

		if (ext_not_allow == undefined) ext_not_allow = '';
		if (name ==''){
			Tips.tips(LNG.not_null,'error');
			return false;
		}

		$('.group_editor .tag.this').each(function(){
			var data = $(this).attr('data-role').split(';');
			for (var i = 0; i < data.length; i++) {
				params[data[i]] = 1;
			};
		});
		if(currentRole=='1' && params != {}){
			params = {};
		}
		//动作分发,保存或者添加
		if (currentRole != '0') {//没有当前则添加；
			url='index.php?system_role/edit&role_id='+currentRole;
		}
		$.ajax({
			url:url+'&name='+urlEncode(name)+'&ext_not_allow='+ext_not_allow,
			data:params,
			type:'POST',
			dataType:'json',
			success:function(data){
				Tips.tips(data);
				if (data.code){
					currentRole = data.info;//info返回roleId;编辑或者添加
					init();
					System.systemMember.loadList('');
				}
			}
		});
	};

	//删除角色
	var roleDelete = function(roleId){
		if(!G.is_root){//只有系统管理员才可以设置权限组
			Tips.tips(LNG.group_role_error,'warning');
			return;
		}
		$.dialog({
			fixed: true,
			icon:'question',
			padding:'30px 40px',
			drag: true,//拖曳
			title:LNG.warning,
			content: LNG.if_remove+getRoleName(roleId)+'?<br/>'+LNG.group_remove_tips,
			cancel:true,
			ok:function() {
				$.ajax({
					url:'index.php?system_role/del&role_id='+roleId,
					async:false,
					dataType:'json',
					success:function(data){
						Tips.tips(data);
						if (data.code){
							currentRole = undefined;
							init();
							System.systemMember.resetList();//重置用户列表
							System.systemMember.loadList('');
						}
					}
				}); 
			}            
		});
	};

	var selectRevert = function(){
		$('.group_editor .tag').each(function(){
			if ($(this).hasClass('this')) {
				$(this).removeClass('this');
				$(this).find('input').removeAttr('checked');
			}else{
				$(this).addClass('this');
				$(this).find('input').attr('checked',true);
			}

			if (!$('.group_editor .combox:eq(0) .tag:eq(0)').hasClass('this')) {
				$('.group_editor .combox:eq(0) .tag').removeClass('this');
				$('.group_editor .combox:eq(0) .tag').find('input').removeAttr('checked');
			}
			if (!$('.group_editor .combox:eq(1) .tag:eq(0)').hasClass('this')) {
				$('.group_editor .combox:eq(1) .tag').removeClass('this');
				$('.group_editor .combox:eq(1) .tag').find('input').removeAttr('checked');
			}
		});
	}

	//事件绑定
	var bindEvent = function(){
		//编辑保存页面
		$('.group_editor .tag').live('click',function(){
			var self = $(this)
				select = false;
			self.toggleClass('this');
			if (self.hasClass('this')) {
				select = true;
				self.find('input').attr('checked',true);
			}else{
				select = false;
				self.find('input').removeAttr('checked');
			}

			if(self.parent().hasClass('combox')){
				var index = self.index();
				//取消选中第一项，则默认取消后面权限。
				if (index == 1 && select==false){
					self.parent().find('.tag').removeClass('this');
					self.parent().find('input').removeAttr('checked');
				}
				//选择后面操作，默认选中第一项
				if (index !=1 && select==true) {
					self.parent().find('.tag:eq(0)').addClass('this');
					self.parent().find('input:eq(0)').attr('checked',true);
				}
			}
		});

		//左侧列表
		$(".system_role li.role_cell").live('click',function(){
			setSelect($(this).attr('data-role-id'));
		});

		$("#content_system_role [data-action]").live('click',function(e){
			var action = $(this).attr('data-action');
			var $that = $(this);
			switch(action){
				case 'role_delete':
					roleDelete(currentRole);
					break;//移动到组
				case 'role_edit_save':
					save();
					break;//编辑分组
				case 'revert_all':
					selectRevert();
					break;//编辑分组
				default:break;
			}
			stopPP(e);//阻止向上冒泡
		});
	};

	var getRoleName = function(roleId){
		var role = roleListAll[roleId];
		if(role){
			return role['name']
		}
		return '<span style="color:#f00">null</span>';
	};
	var getList = function(){
		var role = {};
		$.each(roleListAll,function(key,val){
			role[key] =val.name;
		});
		return role;
	}
	bindEvent();

	return{
		init:init,
		getList:getList,
		setSelect:setSelect
	}
});

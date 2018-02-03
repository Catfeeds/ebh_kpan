define(function(require, exports) {
	var page;
	var bindEvent = function(){
		page = location.hash.split("#", 2)[1];
		if (!page) {page = 'all'}
		reload(page);

		$('ul.setting a').click(function(){
			if(page==$(this).attr('id')){
				return;
			}
			page=$(this).attr('id');
			reload(page);
		});
		
		//选择事件绑定
		$('.box .list').live(
			'hover',
			function(){	$(this).addClass('listhover');},
			function(){	$(this).toggleClass('listhover');}
		).live('click',function(){
			//保存到服务器
			var geturl='index.php?setting/set&k='+type+'&v='+value;
			$.ajax({
				url:geturl,
				dataType:'json',
				success:function(data){
					Tips.tips(data.data,data.code);
				}
			});			
		});
		$('.create_app').die('click').live('click',function(){
			if (window['parent']) {
				window.parent.ui.path.pathOperate.appEdit("","","root_add");
			}
			// ShareData.frameTop('Openapp_store',function(page){
			// 	page.ui.path.pathOperate.appEdit("","","root_add");
			// });
		});
		$('.app-list .app_li').die('click').live('click',function(e){
			if (!$(e.target).attr('action')) return;
			var data = jsonDecode( base64Decode($(this).attr('data-app')) );
			var action = $(e.target).attr('action');
			switch(action){
				case 'preview':core.openApp(data);break;
				case 'add':
					var path = '/';
					ShareData.frameTop('',function(page){
						path = page.G.this_path;
					});
					var filename = urlEncode(path+data.name);
					var url = './index.php?app/user_app&action=add&path='+filename;
					$.ajax({
						url:url,
						dataType:'json',
						type:'POST',
						data:{data:urlEncode(jsonEncode(data))},
						error:core.ajaxError,
						success:function(data){
							Tips.tips(data.data,data.code);
							if (!data.code) return;
							ShareData.frameTop('',function(page){
								page.ui.f5();
							});
						}
					});
					break;
				case 'edit':
					ShareData.frameTop('',function(page){
						page.ui.path.pathOperate.appEdit(data,'','root_edit');
					});
					break;
				case 'del':
					$.dialog({
						id:'dialog_app_remove',
						icon:'question',
						padding:20,
						width:200,
						lock:true,
						background:"#000",
						opacity:0.3,
						content:LNG.remove_info,
						ok:function() {
							$.ajax({
								url:'./index.php?app/del&name='+urlEncode(data.name),
								dataType:'json',
								error:core.ajaxError,
								success:function(data){
									Tips.tips(data.data,data.code);
									if (!data.code) return;
									reload();
								}
							});	
						},
						cancel: true
					});
					break;
				default:break;
			}
		});
	};
	var makeHtml = function(data){
		var html = '';
		var root_action=
				"<button type='button' class='btn btn-sm btn-default dropdown-toggle' data-toggle='dropdown'>\
					<span class='caret'></span>\
					<span class='sr-only'></span>\
				</button>\
				<ul class='dropdown-menu' role='menu'>\
					<li><a action='edit' href='javascript:;'>"+LNG.button_edit+"</a></li>\
					<li><a action='del' href='javascript:;'>"+LNG.button_del+"</a></li>\
				</ul>";
		if (!G.is_root) {root_action='';}
		for (var i in data) {
			if(!data[i]) continue;
			var icon = data[i].icon;
			if (icon.search(G.static_path)==-1
			 && icon.substring(0,4) !='http') {
				icon = G.static_path + 'images/file_icon/icon_app/' + icon;
			}
			html+="<li class='app_li' data-app="+base64Encode(jsonEncode(data[i]))+">\
				<a action='preview' href='javascript:;' class='icon'><img action='preview' src='"+icon+"'></a>\
				<p><span class='title'>"+data[i].name+"</span>\
				<span class='info'>"+data[i].desc+"</span></p>"+
				"<div class='btn-group'>\
				<button type='button' class='btn btn-sm btn-default' action='add'>"+LNG.button_add+"</button>"+root_action+
				"</div><div style='clear:both;'></div></li>";
		}
		html+= "<div style='clear:both;'></div>";
		return html;
	}

	var reload = function(group){
		if (group == undefined || group =='') {group = page;}
		//window.location.href ='#'+group;
		$('.selected').removeClass('selected');
		$('ul.setting a#'+group).addClass('selected');
		$('.main').find('.h1').html( "<i class='"+$('.selected i').attr('class')+"'></i>" + $('.selected').text());

		var $content = $('.main .app-list');
		$.ajax({
			url:'./index.php?app/get&group='+group,
			dataType:'json',
			beforeSend:function (data){},
			success:function(data){
				$content.html(makeHtml(data.data));
				$('body').scrollTop(0);
			}
		});
	};

	// 对外提供的函数
	return{
		reload:reload,
		init:bindEvent	
	};
});

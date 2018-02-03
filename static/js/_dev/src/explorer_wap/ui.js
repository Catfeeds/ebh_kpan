define(function(require, exports) {
	var tpl = require('./tpl/file_list_make_wap.html');//模板tpl
	var ajaxLive = function(){      
		//图片缩略图懒加载 桌面不做处理
		$(".fileContiner .picture img").lazyload({
			//effect : "fadeIn",
			placeholder:G.static_path + 'images/common/loading_tree.gif',
			container: $(".bodymain")
		});
	}
	//json 排序 filed:(string)排序字段，orderby:升降序。升序为-1，降序为1
	var sortBy = function(filed,orderby) {
		var orderby = (orderby=='down')? -1 : 1;
		return function (a, b) {
			a = a[filed];
			b = b[filed];
			if (a < b)  return orderby * -1;
			if (a > b)  return orderby * 1;
		}
	}

	var photoSwipeTpl = require('./tpl/photoSwipe.html');
	$(photoSwipeTpl).appendTo('body');
	require.async([
			'lib/PhotoSwipe/photoswipe.min.js',
			'lib/PhotoSwipe/photoswipe-ui-default.min.js',
			'lib/PhotoSwipe/photoswipe.css',
			'lib/PhotoSwipe/default-skin/default-skin.css',
		],function(){
	});
	
	//http://photoswipe.com/documentation/getting-started.html
	var openImage = function(path){
		var items = [];
		var index = 0;
		$('.picasaImage img').each(function(i){
			var currentPath = pathHashDecode($(this).parent().parent().attr('data-path'));
			var img = $(this).parent().attr('picasa');
			var thumb = $(this).attr('data-original');
			var r = 30;//width 40
			items.push({
				src:img,
				msrc:thumb,
        		// title:core.pathThis(currentPath), 
				w:$(this).width() * r,
				h:$(this).height() * r
			});
			if(path == currentPath){
				index = i;
			}
		});
		var options = {
			history: false,
			focus: true,
			index: index,
			bgOpacity:0.8,
			maxSpreadZoom:5,
			closeOnScroll:false,
			shareEl: false,
			showHideOpacity:true,
			showAnimationDuration: 300,
			hideAnimationDuration: 0,
			getThumbBoundsFn: function(index) {
				var thumbnail = $('.picasaImage img')[index];
				var pageYScroll = window.pageYOffset || document.documentElement.scrollTop; 
				var rect = thumbnail.getBoundingClientRect(); 
				return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
			}
		};
		var gallery = new PhotoSwipe($('.pswp').get(0),PhotoSwipeUI_Default,items,options);
		gallery.init();
		$('.pswp__caption__center').css({"text-align":"center"});
	}
	
	//下拉菜单展开操作
	var menuActionBind = function(){
		$('.drop-menu-action li').bind('click',function(){
			if ($(this).hasClass('disabled'))return;
			var action = pathHashDecode($(this).attr('data-path'));;
			switch(action){
				case 'past':ui.path.past();break;
				case 'info':ui.path.info();break;
				default:break;
			}
		});
	};

	//文件列表数据填充
	var mainSetData = function(isFade){
		var render = template.compile(tpl);
		var html='';
		var arr = G.json_data['folderlist'].concat(G.json_data['filelist']);
		for (var i=0;i<arr.length;i++){
			var file_type = arr[i]['type']=='folder'?'list_folder':'list_file';
			var assign ={
				LNG:LNG,
				G:G,list:arr[i],
				index:i,
				type:file_type
			};
			//oexe icon处理
			if(arr[i].icon && assign.type == 'icon_file' && arr[i].ext == 'oexe'){
				assign['oexe_icon'] = arr[i].icon;
				if ($.type(arr[i].icon) == 'string' && 
					arr[i].icon.search(G.static_path)==-1 && 
					arr[i].icon.substring(0,4) !='http') {
					assign['oexe_icon'] = G.static_path + 'images/file_icon/icon_app/' + arr[i].icon;
				}
			}
			html += render(assign);
		}

		//if (html =='') html = '<div style="text-align:center;color:#aaa;">'+LNG.path_null+'</div>'
		html += "<div style='clear:both'></div>";
		//填充到dom中-----------------------------------
		if (isFade){//动画显示,
			$(Config.FileBoxSelector)
				.hide()
				.html(html)
				.fadeIn(Config.AnimateTime);
		}else{
			$(Config.FileBoxSelector).html(html);               
		}


		var $dom = $(Config.FileBoxClass).not('.systemBox');
		$('<i class="file-action icon-font icon-ellipsis-horizontal"></i>').appendTo($dom);
		$(Config.FileBoxSelector+" .file:nth-child(2n)").addClass('file2');
		ajaxLive();
	};
	var f5 = function(fromServer,isAnimate,callback) {
		var ajaxUrl = 'index.php?explorer/pathList&path='+urlEncode(G.this_path);
		if(G.user){
			ajaxUrl = 'index.php?share/pathList&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(G.this_path);
		}
		if(fromServer == undefined) fromServer = true; //默认每次从服务器取数据
		if(isAnimate == undefined)      isAnimate = false;     //默认不用渐变动画
		if(!fromServer){//采用当前数据刷新,用于显示模式更换
			mainSetData(isAnimate);
			pathTypeChange();
		}else{//获取服务器数据
			$.ajax({
				url:ajaxUrl,
				dataType:'json',
				beforeSend:function(){
					$('.tools-left .msg').stop(true,true).fadeIn(100);
				},
				success:function(data){
					$('.tools-left .msg').fadeOut(100);
					if (!data.code) {   
						Tips.tips(data);
						$(Config.FileBoxSelector).html('');
						return false;
					}
					//G.json_data = data.data;
					G.json_data = jsonDataSort(data.data);
					mainSetData(isAnimate);
					pathTypeChange();
					ui.header.addressSet();//header地址栏更新
					var folderList  =data.data.folderlist;
					var fileList    = data.data.filelist;
					if(folderList == 0 && fileList == 0){
						$(".fileContiner").html("<img src='http://kpan.ebh.net/static/images/file_icon/icon_app/zanwu.png' style='margin:10px auto;display:block;' />");
					}
				},
				error:function(XMLHttpRequest, textStatus, errorThrown){                    
					$('.tools-left .msg').fadeOut(100);
					$(Config.FileBoxSelector).html('');
					core.ajaxError(XMLHttpRequest, textStatus, errorThrown);
				}
			});
		}
	};
	var f5Callback = function(callback){
		f5(true,false,callback);//默认刷新数据，没有动画,成功后回调。
	};


	var jsonDataSort = function(jsonData){
		jsonData = jsonDatafilter(jsonData);
		var folderlist  = jsonData['folderlist'];
		var filelist    = jsonData['filelist'];
		folderlist= folderlist.sort(sortBy('name','up'));
		filelist = filelist.sort(sortBy('name','up'));
		jsonData['folderlist']=folderlist;
		jsonData['filelist']=filelist;//同步到页面数据
		return jsonData;
	}
	//分享文件夹列表
	var jsonDatafilter = function(jsonData){
		if (!jsonData) return jsonData;
		if(jsonData['share_list']!=undefined){//时间处理
			self_share = jsonData['share_list'];
		}
		if(jsonData['filter_success'] === true) {
			return jsonData;
		}
		for (var key in jsonData) {
			if(key !='filelist' && key !='folderlist') continue;
			for (var i = 0; i < jsonData[key].length; i++) {
				var cell = jsonData[key][i];
				cell['name'] = htmlEncode(cell['name']);
				if(cell['mtime'] && cell['mtime'].toString().length <= 11){ //避免循环处理,处理一次后会保存,调整排序避免再次处理
					cell['atime'] = date(LNG.time_type,cell['atime']);
					cell['ctime'] = date(LNG.time_type,cell['ctime']);
					if (jsonData['info'] && jsonData['info']['path_type']== G.KOD_USER_SHARE &&
						trim(jsonData['this_path'],'/').indexOf('/')==-1 //分享根目录
					   ) {//分享统计数据
						var num_view = parseInt(cell['num_view']);
						num_view = isNaN(num_view)?0:num_view;
						var num_download = parseInt(cell['num_download']);
						num_download = isNaN(num_download)?0:num_download;
						var info = date('Y/m/d ',cell['mtime'])+'  ';
						info += LNG.share_view_num+ num_view +'  '+LNG.share_download_num+num_download
						cell['mtime'] = info;
					}else{
						cell['mtime'] = date(LNG.time_type,cell['mtime']);
					}
				}
				if(typeof(cell['is_readable']) == 'number' && cell['is_readable']==0){
					cell['mode'] = "["+LNG.not_read+"] "+cell['mode'];
				}else if(typeof(cell['is_writeable']) == 'number' && cell['is_writeable']==1){
					cell['mode'] = "["+LNG.system_role_write+"] "+cell['mode'];
				}else if(typeof(cell['is_readable']) == 'number' && cell['is_readable']==1){
					cell['mode'] = "["+LNG.only_read+"] "+cell['mode'];
				}
			}
		}
		jsonData['filter_success'] = true;
		return jsonData;
	};


	//文件操作菜单
	var fileMenuAction = function($dom,action){
		var fileid = $dom.attr("fileid")
		var path = pathHashDecode($dom.attr('data-path'));
		var type = $dom.find('.ico').attr('filetype');
		switch (action){
			case 'action_copy':ui.path.copy(path,type,fileid);break;
			case 'action_rname':ui.path.rname(path,fileid);break;
			case 'action_download':ui.path.download(path,type,fileid);break;
			case 'action_remove':ui.path.remove(path,type,fileid);break;
			default:break;
		}
	}
	//文件列表事件绑定
	var fileActionBind = function(){
		//浏览器后退，描点进行数据刷新。
		$(window).bind('hashchange', function() {
			var url = window.location.href;
			var arr = url.split('#');
			if (arr[1]!='' && (arr[1]!=G.this_path && arr[1]!=urlEncode(G.this_path))) {
				ui.path.list(urlDecode(arr[1]));
			}
		});

		//打开文件
		$('.fileContiner .file').die('click').live('click',function(e){//
			var fileid = $(this).attr('fileid');
			var this_uid = $(this).attr('this_uid');
			$('.fileContiner .file .file_action_menu').animate(
				{left:'100%'},300,0,function(){
				$(this).remove();
			});
			if ($(this).find('.file_action_menu').length>0) {
				if ($(e.target).hasClass('action_menu')) {
					var action = $(e.target).attr('data-action');
					fileMenuAction($(this),action);
				}
				if ($(e.target).parent().hasClass('action_menu')) {
					var action = $(e.target).parent().attr('data-action');
					fileMenuAction($(this),action);
				}
				return;
			}
			if ($(e.target).hasClass('file-action')) {
				var $menu =$('.file_menu .file_action_menu').clone();
				var canWrite = true;
				if($(e.target).parent().hasClass('file_not_writeable')){
					canWrite = false;
				}else if( !G.json_data.info || !G.json_data.info.can_upload){
					canWrite = false;
				}
				if(!canWrite){
					$menu.find('[data-action=action_remove]').remove();
					$menu.find('[data-action=action_rname]').remove();
				}
				$menu.appendTo($(this));
				$menu.removeClass('hidden').css({left:'100%'}).animate(
					{left:'0%'},300,0,function(){
				});
				return;
			}
			var type = $(this).find('.ico').attr('filetype');
			var path = pathHashDecode($(this).attr('data-path'));
			ui.path.open(path,type,fileid,this_uid);
			stopPP(e);
		});
		//地址栏点击，更换地址。
		$(".address li").die('click').live('click',function(e) {
			var path = $(this).find('a').attr('data-path');
			ui.path.list(path);
			stopPP(e);
		});
	}

	//1.工具栏调整筛选【文件管理，回收站，分享根目录】对应右键菜单处理
	//2.文件管理：读写权限处理【只读，可读写】——状态处理
	//3.我在该组【您是访客，】
	//4.物理目录读写状态处理[只读，不存在]
	var pathTypeChange = function(type){
		if(!G.json_data['info']) return;
		var info = G.json_data['info'],
			kod_path_type = info['path_type'],
			path_writeable= G.json_data['path_read_write'];
		if( (path_writeable!=undefined && path_writeable!='writeable') ||
			kod_path_type==G.KOD_USER_RECYCLE || 
			kod_path_type==G.KOD_USER_SHARE || 
			kod_path_type==G.KOD_GROUP_SHARE){
			G.json_data['info']['can_upload'] = false;
		}else{
			G.json_data['info']['can_upload'] = true;
			if( G.is_root!=1 &&
				kod_path_type==G.KOD_GROUP_PATH && 
				info['role']=='guest'){
				G.json_data['info']['can_upload'] = false;
			}
		}

		if(G.json_data['info']['can_upload']){
			$('[data-action=upload],[data-action=newfolder],[data-action=past]')
			.removeClass('hidden');
		}else{
			$('[data-action=upload],[data-action=newfolder],[data-action=past]')
			.addClass('hidden');
		}
	}
	$.ajax({
		url:'http://wap.ebh.net/leftmenu/getLeftMenuAjax.html',
		dataType:'jsonp',
		success:function(data){
			var html = data.html;
			$('.panel-menu').html(html);
		}
	});

	var initLeftMenu = function(){
		$.ajax({
			url:'./index.php?explorer/treeList&app=explorer&type=init',
			dataType:'json',
			success:function(data){
				if(!data.code){
					Tips.tips(data);
				}
				var html = "";
//				for (var i = 0; i < data.data.length; i++) {
//					var item = data.data[i];
//					html += '<li data-action="pathOpen" data-path="'+item['path']
//					+ '"><a href="javascript:void();"><i class="font-icon icon-cloud-upload x-'+item['ext']+'"></i>'+item['name']+'</a></li>'
//				}
				

				html += '<li data-action="upload"><a href="javascript:void();"><i class="font-icon icon-cloud-upload"></i>上传</a></li>';
				html += '<li data-action="newfolder"><a href="javascript:void();"><i class="font-icon icon-folder-close-alt"></i>新建文件夹</a></li>';
				html += '<li data-action="past"><a href="javascript:void();"><i class="font-icon icon-paste"></i>粘贴</a></li>';
				html += '<li data-action="past" style="border-top:1px solid #e3e3e3;"><a href="javascript:void();"></a></li>';
				html += '<li data-action="pathOpen" data-path="{user_fav}"><a href="javascript:void();"><i class="font-icon x-treeFav"></i>收藏夹</a></li>';
				html += '<li data-action="pathOpen" data-path="/"><a href="javascript:void();"><i class="font-icon x-treeSelf"></i>我的文档</a></li>';
				html += '<li data-action="pathOpen" data-path="{group_share}:1/"><a href="javascript:void();"><i class="font-icon x-groupPublic"></i>共享目录</a></li>';
				//html += '<li data-action="search"><a href="javascript:void();"><i class="font-icon icon-search"></i>'+echo['search']+'</a></li>';
				$('.menu-right_tool').html(html);
				$('.menu-left_tool').html(html);
					//右侧菜单
				$('.menu-right_tool li').on('click',function(e){
					$('.menu_group').removeClass('open');
					var action = $(this).attr('data-action');
					switch(action){
						case 'upload':core.upload();break;
						case 'newfolder':ui.path.newFolder();break;
						case 'newfile':ui.path.newFile('txt');break;
						case 'search':core.search('',G.this_path);break;
						case 'past':ui.path.past();break;
						default:break;
					}
					stopPP(e);
					return false;
				});
				//左侧菜单事件绑定
				$('.menu-right_tool li').bind('click',function(){
					$('body').removeClass('menu-open');
					var action = $(this).attr('data-action');
					switch(action){                     
						case 'pathOpen':ui.path.list($(this).attr('data-path'));break;
						case 'exit':window.location.href="./index.php?user/logout";break;
						default:break;
					}
				});	
			}
		});
	}


	return{ 
		f5:f5,
		f5Callback:f5Callback,
		openImage:openImage,
		init:function(){
			if(G.this_path ==''){
				var arr = window.location.href.split("#");
				if(arr.length == 2 && trim(urlDecode(arr[1]))!=''){
					G.this_path = urlDecode(arr[1]);
				}else{
					var pre = G.user_id || G.sid;
					var localPath = LocalData.get('this_path_'+pre);
					if(localPath){
						G.this_path = localPath;
					}else{
						G.this_path = G.myhome;
					}
				}               
			}
			f5Callback(function(){//数据首次加载后回调
				f5(false,true);
			});

			//生成文件列表
			initLeftMenu();
			fileActionBind();
			ui.header.bindEvent();
		},

		// 头部操作
		header:{
			bindEvent:function(){


				$('.right_tool').on('click',function(e){
					$(this).parent().toggleClass('open');
					stopPP(e);
				});
				$('body').on('click',function(e){
					if( !$(e).hasClass('right_tool')){
						$('.menu_group').removeClass('open');
					}
				});



				//右侧菜单
				$('.menu-right_tool li').on('click',function(e){
					$('.menu_group').removeClass('open');
					var action = $(this).attr('data-action');
					switch(action){
						case 'upload':core.upload();break;
						case 'newfolder':ui.path.newFolder();break;
						case 'newfile':ui.path.newFile('txt');break;
						case 'search':core.search('',G.this_path);break;
						case 'past':ui.path.past();break;
						default:break;
					}
					stopPP(e);
					return false;
				});

				if(G.share_info && G.share_info.can_upload){
					$('[data-action=upload]').removeClass('hidden');
				}
				
			},
			//更新地址栏
			addressSet:function(){
				var path = G.this_path;
				var makeHtml = function(address) {
					var add_first = '<li class="yarnlet first"><a title="@1@" data-path="@1@" style="z-index:{$2};"><span class="left-yarn"></span>{$3}</a></li>\n';
					var add_more = '<li class="yarnlet "><a title="@1@" data-path="@1@" style="z-index:{$2};">{$3}</a></li>\n';
					address = address.replace(/\/+/g,'/');
					var arr = address.split('/');
					if (arr[arr.length - 1] == '') {
						arr.pop();
					}
					var this_address = arr[0]+'/';
					var li = add_first.replace(/@1@/g,this_address);
					var key = arr[0];
					var key_pre = '';
					if (G.json_data.info && G.json_data.info.path_type && arr[0] != '') {//特殊目录处理
						var iconInfo = core.getPathIcon(G.json_data['info'],G.json_data['info']['name']);
						key_pre = '<span class="address_ico">'+core.iconSmall(iconInfo.icon)+'</span>';
						key = iconInfo.name;
					}
					li = li.replace('{$2}',arr.length);
					li = li.replace('{$3}',key_pre+'<span class="title_name">'+htmlEncode(key)+"</span>");
					var html = li;
					for (var i=1,z_index=arr.length-1; i<arr.length; i++,z_index--){
						
						this_address += htmlEncode(arr[i])+'/';
						li = add_more.replace(/@1@/g,this_address);
						li = li.replace('{$2}',z_index);
						li = li.replace('{$3}','<span class="title_name">'+htmlEncode(urlDecode(arr[i]))+"</span>");
						html += li;
					}
					return html;
				};
				$(".frame-main .address ul").html(makeHtml(path));
			},
			
			//地址栏enter或者 点击go按钮，main更换地址
			gotoPath:function(){
				var url=$("input.path").val();//保持文件夹最后有一个/
				url = url.replace(/\\/g,'/');
				$("input.path").val(url);
				if (url.substr(url.length-1,1)!='/'){
					url+='/';
				}
				ui.path.list(url);
				ui.header.addressSet();
			}
		}
	}
});

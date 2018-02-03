define(function(require, exports){
	var pathDisableWindow  = ['/','\\',':','*','?','"','<','>','|'];//win文件名命不允许的字符
	var pathDisableLinux   = ['/','\\'];//win文件名命不允许的字符
	//检测文件名是否合法，根据操作系统，规则不一样
	var pathAllow = function(path){
		//字符串中检验是否出现某些字符，check=['-','=']
		var hasChar = function(str,check){
			var len=check.length;
			var reg="";
			for (var i=0; i<len; i++){
				if(str.indexOf(check[i])>0) return true;
			}
			return false;
		};

		var pathDisable = pathDisableLinux;
		if(G.system_os && G.system_os == 'windows'){
			pathDisable = pathDisableWindow;
		}
		if (hasChar(path,pathDisable)){
			Tips.tips(LNG.path_not_allow+':    '+pathDisable.join(', '),false);
			return false;
		}
		return true;
	};
	//组装数据
	//list=[{}]
	var makeJson = function(json){
		var param = [];
		var convert = function(str){//提交到后端前，双引号加入转义
			if(!str) return str;
			return str.replace(/"/g,'\\\\"');
		}
		for (var i=0;i<json.length;i++){
			param.push({'type':convert(json[i].type),path:urlEncode(convert(json[i].path)),fileid:json[i].fileid});
		}
		return 'data_arr='+jsonEncode(param);
	}

	var strSortChina = function(a,b){
		var arr = '0123456789零一二三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟万';//
		for (var i=0;i<Math.max(a.length,b.length);i++){
			if (a.charAt(i) != b.charAt(i)){
				var aIndex = arr.indexOf(a.charAt(i));
				var bIndex = arr.indexOf(b.charAt(i));
				if(aIndex!=-1 && bIndex!=-1){//有该字符
					if(aIndex>bIndex){
						return 1;
					}else if(aIndex<bIndex){
						return -1;
					}else{
						return 0;
					}
				}else{//字符比较
					if(a.charAt(i)>b.charAt(i)){
						return 1;
					}else if(a.charAt(i)<b.charAt(i)){
						return -1;
					}else{
						return 0;
					}
				}
			}
		}
		return 0;
	}
	//字符串排序函数 ；222>111,bbb>aaa; bbb(1).txt>bbb(0).txt [bbb(100).txt>bbb(55).txt]
	//https://github.com/overset/javascript-natural-sort/blob/master/speed-tests.html
	var strSort = function(a,b){
		if(a==undefined || b==undefined){
			return 0;
		}
		var re = /([0-9\.]+)/g,	// /(-?[0-9\.]+)/g,  负数 2016-11-09 2016-11-10歧义
			x = a.toString().toLowerCase() || '',
			y = b.toString().toLowerCase() || '',
			nC = String.fromCharCode(0),
			xN = x.replace( re, nC + '$1' + nC ).split(nC),
			yN = y.replace( re, nC + '$1' + nC ).split(nC),
			xD = (new Date(x)).getTime(),
			yD = xD ? (new Date(y)).getTime() : null;

		if ( yD ){//时间戳排序
			if ( xD < yD ){
				return -1;
			}else if ( xD > yD ){
				return 1;
			}
		}
		for( var cLoc = 0, numS = Math.max(xN.length, yN.length); cLoc < numS; cLoc++ ) {
			oFxNcL = parseFloat(xN[cLoc]) || xN[cLoc];
			oFyNcL = parseFloat(yN[cLoc]) || yN[cLoc];
			if(oFxNcL== oFyNcL){
				continue;
			}
			if(typeof(oFxNcL) == 'string' && typeof(oFyNcL)== 'string'){
				//自定义字符大小顺序
				var resultCurrent = strSortChina(oFxNcL,oFyNcL);
				if(resultCurrent!=0){
					return resultCurrent;
				}
			}else{
				if (oFxNcL < oFyNcL){
					return -1;
				}else if (oFxNcL > oFyNcL){
					return 1;
				}
			}
		}
		return 0;
	}
	// 新建文件
	var newFile = function(path,callback){
		if (!path) return;
		var filename = core.pathThis(path);
		if (!pathAllow(filename)){
			if (typeof(callback) == 'function')callback();
			return;
		}
		$.ajax({
			dataType:'json',
			url: 'index.php?explorer/mkfile&path='+urlEncode(path),
			beforeSend:function(){
				Tips.loading();
			},
			error:core.ajaxError,
			success: function(data){
				Tips.close(data);
				if (typeof (callback) == 'function'){
					if(data && data.info){
						callback(data.info);
					}
				}
			}
		});
	};
	// 新建文件夹
	var newFolder = function(path,callback){
		if (!path) return;
		var filename = core.pathThis(path);
		if (!pathAllow(filename)){
			if (typeof(callback) == 'function')callback();
			return;
		}
		$.ajax({
			dataType:'json',
			url: 'index.php?explorer/mkdir&path='+urlEncode(path),
			beforeSend:function(){
				if (typeof (callback) == 'function'){
					Tips.loading();
				}
			},
			error:core.ajaxError,
			success: function(data){
				Tips.close(data);
				if (typeof (callback) == 'function'){
					if(data && data.info){
						callback(data.info);
					}
				}
			}
		});
	};
	// 重命名文件(夹)
	var rname = function(from,id,to,callback){
		if (!from || !to) return;
		if (from == to) return;
		if (!pathAllow(core.pathThis(to))){
			if (typeof(callback) == 'function')callback();
			return;
		}
		$.ajax({
			type: "POST",
			dataType:'json',
			url: 'index.php?explorer/pathRname',
			data: 'path='+urlEncode(from)+'&rname_to='+urlEncode(to) + '&fileid='+id,
			beforeSend:function(){
				Tips.loading();
			},
			error:core.ajaxError,
			success: function(data){
				Tips.close(data);
				if (typeof (callback) == 'function'){
					if(data && data.info){
						callback(data.info);
					}
				}
				//ui.tree.refresh(treeNode.getParentNode());
			}
		});
	};

	/**
	 * 删除指定文件(文件|文件夹 & 包含批量删除)
	 * param：[{"type":"file","file":"D:/test/a.txt"}]
	 * callback:删除回调
	 * ignoreTips:为true则不弹出确认框
	 */
	var remove = function(param,callback,ignoreTips,shiftDelete){
		ignoreTips  = ignoreTips == undefined ? false:ignoreTips;//默认不隐藏提示
		shiftDelete = shiftDelete == undefined ? false:shiftDelete;//默认不直接删除
		if (param.length<1) return;
		//var name = core.pathThis(param[0]['path'])+'<br/><br/>'+;
		var title= LNG.remove_title;
		var desc = LNG.remove_info;
		var delUrl = 'index.php?explorer/pathDelete';
		var post = makeJson(param);
		if (param[0]['type'] == 'share'){//取消共享
			title 	= LNG.share_remove;
			desc 	= LNG.share_remove_tips;
			delUrl 	= 'index.php?userShare/del';
		}

		if(shiftDelete){
			desc  = LNG.remove_info_force;
			title = LNG.remove_title_force;
			delUrl += '&shiftDelete=1';
		}

		//彻底删除回收站文件 or 清空回收站
		if ( param[0]['type'] == 'recycle_clear' || 
			 (G.USER_RECYCLE && G.this_path == G.USER_RECYCLE) ||
			 G.this_path == core.pathFather(G.myhome)+'recycle_kod/'
			 ){
			desc = LNG.recycle_clear_info;
			delUrl = 'index.php?explorer/pathDeleteRecycle';
			title = LNG.recycle_clear;
			if(param[0]['type'] == 'recycle_clear'){
				post = {}; // clear recycle
			}
		}

		if (param.length>1){
			desc+= ' ... <span class="badge">'+param.length+'</span>';
		}

		//删除文件请求
		var request = function(){
			$.ajax({
				url: delUrl,
				type:'POST',
				dataType:'json',
				data:post,
				beforeSend:function(){
					Tips.loading();
				},
				error:core.ajaxError,
				success: function(data){
					Tips.close(data);
					ShareData.frameTop('',function(page){
						page.ui.f5();
					});
					if (param[0]['type'] == 'share'){
						G.self_share = data.info;
						//取消分享，对应关闭分享信息框
						var dialog = $.dialog.list['share_dialog'];
						if (dialog != undefined){
							dialog.close();
						};
					}
					if(title == LNG.recycle_clear){
						core.playSound("recycle_clear");
					}else{
						core.playSound("file_remove");
					}
					if (typeof(callback) == 'function')callback(data);
				}
			});
		}
		if(ignoreTips){
			request();
		}else{
			$.dialog({
				id:'dialog_path_remove',
				fixed: true,//不跟随页面滚动
				icon:'question',
				title:title,
				padding:"40px 80px 40px 30px",
				// width:200,
				lock:true,
				background:"#000",
				opacity:0.1,
				content:desc,
				ok:request,
				cancel: true
			});
		}
	};
	//复制
	var copy = function(param){
		var fileid = param[0].fileid;
		if (param.length<1) return;
		$.ajax({
			url:'index.php?explorer/pathCopy',
			type:'POST',
			dataType:'json',
			data:makeJson(param),
			error:core.ajaxError,
			success: function(data){
				G.this_fileid = fileid;
				Tips.tips(data);
			}
		});
	};

	var share = function(param){
		var path = param.path;
		var fileid = param.fileid;
		var sid = param.ssid;
		var upid = param.upid;
		var pathPre = core.pathPre(path);
		if( pathPre == G.KOD_GROUP_PATH || 
			pathPre == G.KOD_GROUP_SHARE ||
			pathPre == G.KOD_USER_SHARE
			){
			Tips.tips(LNG.path_can_not_action,'warning');
			return;
		}
		var shareType = param.type=='folder'?'folder':'file';
		if (path.length<1) return;
		if (!core.authCheck('userShare:set')) return;
		$.ajax({
			url:'./index.php?userShare/checkByPath&path='+urlEncode(path) + '&fileid=' + fileid,
			dataType:'json',
			error:core.ajaxError,
			success:function(data){
				if (data.code){//已经分享则编辑分享
					//Tips.tips(LNG.path_exists,true);
					shareBox(data.data);
				}else{//没有分享，新建分享提交
					//自动分享
					G.self_share = data.info;
					var param = {path:path,type:shareType,name:core.pathThis(path),fileid:fileid,sid:sid,upid:upid};
					sharePost(param,function(data){
						if(data.code){
							// //直接分享，不编辑
							// Tips.tips(LNG.success,true);
							// G.self_share = data.info;
							// ui.f5();
							G.self_share = data.info;
							ui.f5();
							shareBox(data.data);
						}else{
							Tips.tips(data);
							shareBox(undefined,function(){//编辑分享
								//新建分享提交
								$('.content_info input[name=type]').val(shareType);
								$('.content_info input[name=path]').val(path);
								$('.content_info input[name=name]').val(core.pathThis(path)+'(1)');
								if (shareType=='file'){
									$('.label_code_read').addClass('hidden');
									$('.label_can_upload').addClass('hidden');
								};
							});
						}
					});
				}
			}
		});
	};
	var shareBox = function(shareParam,callback){
		if ($(".share_dialog").length!=0){
			$(".share_dialog").shake(3,30,100);
		}
		require.async([
			'lib/jquery.datetimepicker/jquery.datetimepicker.css',
			'lib/jquery.datetimepicker/jquery.datetimepicker.js'],function(){
			shareBoxMake(shareParam);
			if(callback!=undefined) callback();
		});
	}

	var sharePost = function(param,callback){
		$.ajax({
			url:'index.php?userShare/set',
			data:param,
			type:'POST',
			dataType:'json',
			beforeSend:function(data){
				$('.share_create_button').addClass('disabled');
			},
			error:function(){
				Tips.tips(LNG.error,false);
			},
			success:function(data){
				$('.share_create_button').removeClass('disabled');
				if(callback!=undefined) callback(data);
			}
		});
	}

	var shareBoxMake = function(shareParam){
		var tpl_list = require('./tpl/share.html');
		var render = template.compile(tpl_list);
		var html = render({LNG:LNG});
		$.dialog({
			id:"share_dialog",
			simple:true,
			resize:false,
			width:425,
			title:LNG.share,
			padding:'0',
			fixed:true,
			content:html
		});

		//时间控件
		var theLang = G.lang=='zh-CN'?'ch':'en';
		$('#share_time').datetimepicker({
			format:'Y/m/d',
			formatDate:'Y/m/d',
			timepicker:false,
			lang:theLang
		});
		$('#share_time').unbind('blur').bind('blur',function(e){
			stopPP(e);
		});
		var initData = function(shareInfo){
			//初始化数据
			$('.share_setting_more').addClass('hidden');
			if (shareInfo == undefined){//没有数据 则清空
				$('.share_has_url').addClass('hidden');
				$('.share_action .share_remove_button').addClass('hidden');

				$('.content_info input[name=sid]').val('');
				$('.content_info input[name=type]').val('');
				$('.content_info input[name=name]').val('');
				$('.content_info input[name=show_name]').val('');
				$('.content_info input[name=path]').val('');
				$('.content_info input[name=time_to]').val('');
				$('.content_info input[name=share_password]').val('');
				$(".share_view_info").addClass('hidden');
			}else{//有数据
				if (typeof(shareInfo['can_upload'])=='undefined'){
					shareInfo['can_upload'] = "";
				}
				shareParam = shareInfo;
				if(!shareInfo.show_name){
					shareInfo.show_name = shareInfo.name;
				}
				$('.content_info input[name=sid]').val(shareInfo.sid);
				$('.content_info input[name=type]').val(shareInfo.type);
				$('.content_info input[name=name]').val(shareInfo.name);
				$('.content_info input[name=show_name]').val(shareInfo.show_name);
				$('.content_info input[name=path]').val(shareInfo.path);
				$('.content_info input[name=time_to]').val(shareInfo.time_to);
				$('.content_info input[name=share_password]').val(shareInfo.share_password);
				$(".share_view_info").removeClass('hidden');

				//浏览量下载量展示
				if (typeof(shareInfo['num_download']) == 'undefined'){
					shareInfo['num_download'] = 0;
				}
				if (typeof(shareInfo['num_view']) == 'undefined'){
					shareInfo['num_view'] = 0;
				}
				var read_info = LNG.share_view_num+shareInfo['num_view']+'  '+
								LNG.share_download_num+shareInfo['num_download'];
				$(".share_view_info").html(read_info);

				//其他配置
				if (shareInfo.code_read == '1'){
					$('.content_info input[name=code_read]').attr('checked','checked');
				}else{
					$('.content_info input[name=code_read]').removeAttr('checked');
				}
				if (shareInfo.not_download == '1'){
					$('.content_info input[name=not_download]').attr('checked','checked');
				}else{
					$('.content_info input[name=not_download]').removeAttr('checked');
				}

				//是否可以上传
				if (shareInfo['can_upload'] == '1'){
					$('.content_info input[name=can_upload]').attr('checked','checked');
				}else{
					$('.content_info input[name=can_upload]').removeAttr('checked');
				}

				$('.share_has_url').removeClass('hidden');
				if (shareInfo.type=='file'){
					$('.label_code_read').addClass('hidden');
					$('.label_can_upload').addClass('hidden');
				}else{
					$('.label_code_read').removeClass('hidden');
					$('.label_can_upload').removeClass('hidden');
				}

				var shareType = shareInfo.type;
				if (shareInfo.type=='folder'){
					if (shareInfo.code_read == 1){
						shareType = 'code_read';
					}else{
						shareType = 'folder';
					}
				}
				var share_url = G.app_host+'index.php?share/'
					+shareType+'&user='+G.user_id+"&sid="+shareInfo.sid;
				$('.content_info .share_url').val(share_url);

				//默认是否隐藏更多设置
				if (shareInfo.time_to ||
					shareInfo.share_password ||
					shareInfo['can_upload'] ||
					shareInfo.code_read||
					shareInfo.not_download){
					$('.share_setting_more').removeClass('hidden');
				};

				$('.share_remove_button').removeClass('hidden');
				$('.share_create_button').text(LNG.share_save);
			}
		}
		var bindAction = function(){
			//取消分享
			$('.share_action .share_remove_button').unbind('click').click(function(){
				remove([{type:'share',path:shareParam.sid}],function(){
					ui.f5();
				});
			});
			$('.content_info .share_more').unbind('click').click(function(){
				$('.share_setting_more').toggleClass('hidden');
			});

			//创建分享&修复分享配置
			$('.share_action .share_create_button').unbind('click').click(function(){
				//数据获取
				var param="";
				$('.share_dialog .content_info input[name]').each(function(){
					var value = urlEncode($(this).val());
					if($(this).attr('type') == 'checkbox'){
						if($(this).attr('checked')){
							value = '1';
						}else{
							value = "";
						}
					}
					param+='&'+$(this).attr('name')+'='+value;
				});
				sharePost(param,function(data){
					if(!data.code){//已存在
						Tips.tips(data);
					}else{
						Tips.tips(LNG.success,true);
						G.self_share = data.info;
						ui.f5();
						initData(data.data);
						$('.share_create_button').text(LNG.share_save);
					}
				});
				$(".aui_state_focus").remove();
			});

			$('.content_info .open_window').unbind('click').bind('click',function(){
				window.open($('input.share_url').val());
			});
			$('.content_info .qrcode').unbind('click').bind('click',function(){
				core.qrcode($('input.share_url').val());
			});

			var $share_url   = $("input.share_url");
			var share_url    = $share_url.get(0);
			$share_url.unbind('hover click').bind('hover click',function(e){
				$(this).focus();
				var selectlen=$share_url.val().length;
				if($.browser.msie){//IE
					var range = share_url.createTextRange();
					range.moveEnd('character', -share_url.value.length);
					range.moveEnd('character', selectlen);
					range.moveStart('character', 0);
					range.select();
				}else{//firfox chrome ...
				   share_url.setSelectionRange(0,selectlen);
				}
			});
		}
		initData(shareParam);
		bindAction();
	}

	var setBackground = function(url){
		$.ajax({
			url:'index.php?setting/set&k=wall&v='+urlEncode(url),
			dataType:'json',
			success:function(data){
				Tips.tips(data);
			}
		});
	};

	/*
	 * 生成快捷方式
	 * atCurrent : true:当前目录;false:桌面
	 */
	var createLink = function(path,name,type,atCurrent,callback){
		console.log(path,name,type,atCurrent,callback);
		if (path.length<1) return;
		var jsrun;
		var father = G.my_desktop;
		if(atCurrent){//生成到当前
			father = core.pathFather(path);
		}

		if (type=='folder'){
			jsrun = "ui.path.list(hashDecode('"+hashEncode(path)+"'));";
		}else{
			jsrun = "ui.path.open(hashDecode('"+hashEncode(path)+"'));";
		}
		var filename = urlEncode(father+name+'.oexe');
		var iconInfo = core.getPathIcon(path);
		if(iconInfo.icon == ''){
			iconInfo.icon = type;
		}

		$.ajax({
			url: './index.php?explorer/mkfile&path='+filename,
			type:'POST',
			dataType:'json',
			data:{content:jsonEncode({type:"app_link",content:jsrun,icon:iconInfo.icon})},
			success: function(data){
				Tips.tips(data);
				if (!data.code) return;
				ShareData.frameTop('',function(page){
					page.ui.f5();
				});
				if (typeof (callback) == 'function') callback(data.info);
			}
		});
	};
	var createProject = function(path,callback){
		if (path.length<1) return;
		var name = core.pathThis(path),
			father = core.pathFather(path);
			jsrun = 'core.explorerCode(\''+urlEncode(path)+'\');';

		var filename = urlEncode(father+name+'_project.oexe');
		$.ajax({
			url: './index.php?explorer/mkfile&path='+filename,
			type:'POST',
			dataType:'json',
			data:'content={"type":"app_link","content":"'+jsrun+'","icon":"folder.png"}',
			success: function(data){
				if (!data.code) return;
				if (typeof (callback) == 'function') callback(data.info);
			}
		});
	};
	//剪切
	var cute = function(param){
		if (param.length<1) return;
		$.ajax({
			url:'index.php?explorer/pathCute',
			type:'POST',
			dataType:'json',
			data:makeJson(param),
			error:core.ajaxError,
			success:function(data){
				Tips.tips(data);
			}
		});
	};
	// 粘贴
	var past = function(path,callback){
		var id = G.copy_fileid;
		if (!path) return;
		Tips.loading(LNG.moving);
		setTimeout(function(){
			var url='index.php?explorer/pathPast&path='+urlEncode(path)+ '&fileid=' + id;
			$.ajax({
				url:url,
				dataType:'json',
				error:core.ajaxError,
				success:function(data){
					Tips.close(data.data,data.code);
					if (typeof(callback) == 'function')callback(data.info);
				}
			});
		},50);		
	};

	
	//获取文件夹属性
	var info = function(param){
		var tpl ={};
		tpl['file_info'] = require('./tpl/fileinfo/file_info.html');
		tpl['path_info'] = require('./tpl/fileinfo/path_info.html');
		tpl['path_info_more'] = require('./tpl/fileinfo/path_info_more.html');

		if (param.length<1) param = [{path:G.this_path,type:"folder"}];//当前目录属性

		var ico_type = "info";
		if (param.length==1){
			if(param[0].type=="file"){
				ico_type = core.pathExt(param[0].path);
			}else{
				ico_type = "folder";
			}
		}

		Tips.loading(LNG.getting);
		core.fileInfo(makeJson(param),function(data){
			if (!data.code){
				Tips.close(data);return;
			}
			Tips.close(LNG.get_success,true);
			var tpl_file = 'path_info_more';
			var title = LNG.info;
			if (param.length ==1){
				tpl_file = ((param[0].type =='folder')?'path_info':'file_info');
				title = core.pathThis(param[0].path);
				if (title.length>15){
					title = title.substr(0,15)+"...  "+LNG.info
				}
			}
			var render = template.compile(tpl[tpl_file]);
			var dialogUuid = UUID();
			data.data.is_root = G.is_root;
			data.data.LNG = LNG;//模板中的多语言注入
			data.data['atime'] = date(LNG.time_type_info,data.data['atime']);
			data.data['ctime'] = date(LNG.time_type_info,data.data['ctime']);
			data.data['mtime'] = date(LNG.time_type_info,data.data['mtime']);
			data.data['size_friendly'] = core.fileSize(data.data['size']);

			var dialog = $.dialog({
				id:dialogUuid,
				padding:5,
				ico:core.iconSmall(ico_type),
				fixed: true,//不跟随页面滚动
				title:title,
				content:render(data.data),
				ok: true
			});

			//多个则偏移
			var offset = 15 * $('.aui_outer .pathinfo').length;
			dialog.DOM.wrap.css({
				'left':"+="+offset+"px",
				'top' :"+="+offset+"px"
			});
			bindInfoBoxEvent(dialogUuid,param);
		});
	};

	//文件属性查看，对话框时间绑定
	var bindInfoBoxEvent = function(dialogUuid,param){
		var $dom = $('.'+dialogUuid);
		//打开下载链接
		$dom.find('.open_window').bind('click',function(){
			window.open($dom.find('input.download_url').val());
		});
		$dom.find('.qrcode').unbind('click').bind('click',function(){
			core.qrcode($dom.find('input.download_url').val(),$dom.find('.qrcode').get(0));
		});

		//大文件md5延迟加载。
		var $md5_loading = $dom.find('.file_md5_loading');
		if($md5_loading.length == 1){
			var paramUrl = makeJson(param);
			paramUrl += '&get_md5=1';
			core.fileInfo(paramUrl,function(data){
				$md5_loading.removeClass('file_md5_loading');
				if (data.code){
					$md5_loading.html(data.data.file_md5);
				}else{
					$md5_loading.html(LNG.error);
				}
			});
		}


		//hover选中输入框
		var $download_url   = $dom.find('input.download_url');
		var download_dom    = $download_url.get(0);
		$download_url.unbind('hover click').bind('hover click',function(e){
			$(this).focus();
			var selectlen=$download_url.val().length;
			if($.browser.msie){//IE
				var range = download_dom.createTextRange();
				range.moveEnd('character', -download_dom.value.length);
				range.moveEnd('character', selectlen);
				range.moveStart('character', 0);
				range.select();
			}else{//firfox chrome ...
			   download_dom.setSelectionRange(0,selectlen);
			}
		});

		//权限修改
		$dom.find('.edit_chmod').click(function(){
			var $input = $(this).parent().find('input');
			var $button = $(this);
			$.ajax({
				url:'index.php?explorer/pathChmod&mod='+$input.val(),
				type:'POST',
				data:makeJson(param),
				beforeSend: function(){
					$button.text(LNG.loading);
				},
				error:function(data){
					$button.text(LNG.button_save);
				},
				success:function(data){
					$button.text(data.data)
						.animate({opacity:0.6},400,0)
						.delay(1000)
						.animate({opacity:1},200,0,function(){
							$button.text(LNG.button_save);
						});
					if(data.code){
						ui.f5();//刷新
					}
				}
			});
		});
	}

	var zipDownload = function(param){
		if (!core.authCheck('explorer:fileDownload')) return;
		if (param.length<1) return;

		var the_url = 'index.php?explorer/zipDownload';
		if (typeof(G['share_page']) != 'undefined'){
			the_url = 'index.php?share/zipDownload&user='+G.user+'&sid='+G.sid;
		}
		$.ajax({
			url:the_url,
			type:'POST',
			dataType:'json',
			data:makeJson(param),
			beforeSend: function(){
				Tips.loading(LNG.zip_download_ready);
			},
			error:core.ajaxError,
			success:function(data){
				Tips.close(data);
				Tips.tips(data);
				var url = 'index.php?explorer/fileDownloadRemove&path='+urlEncode(data.info);
				if (typeof(G['share_page']) != 'undefined'){
					url = 'index.php?share/fileDownloadRemove&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(data.info);
				}
				$.dialog({
					icon:'succeed',
					title:false,
					time:2,
					content:LNG.download_ready +'...'
				});
				$('<iframe src="'+url+'" style="display:none;width:0px;height:0px;"></iframe>').appendTo('body');
			}
		});
	};

	var zip = function(param,callback,fileType){
		if (param.length<1) return;
		if (!fileType) fileType = 'zip';
		$.ajax({
			url:'index.php?explorer/zip&fileType='+fileType,
			type:'POST',
			dataType:'json',
			data:makeJson(param),
			beforeSend: function(){
				Tips.loading(LNG.ziping);
			},
			error:core.ajaxError,
			success:function(data){
				Tips.close(data);
				if(data.code){
					core.playSound('drag_drop');
				}
				if (typeof (callback) == 'function') callback(data.info);
			}
		});
	};
	var unZip = function(path,callback,toThis){
		if (!path) return;
		var request = function(sendUrl){
			$.ajax({
				url:sendUrl,
				beforeSend: function(){
					Tips.loading(LNG.unziping);
				},
				error:core.ajaxError,
				success:function(data){
					Tips.close(data);
					if (typeof (callback) == 'function') callback(data);
				}
			});
		}

		var url='index.php?explorer/unzip&path='+urlEncode(path);
		if(toThis == 'to_this'){
			url += '&to_this=1';
		}
		if(toThis == 'unzip_to_folder'){//解压到文件夹
			core.api.pathSelect(
				{type:'folder',title:LNG.unzip_to},
				function(path){
				url += '&path_to='+path;
				request(url);
			});
		}else{
			request(url);
		}
	};
	// 粘贴
	var cuteDrag = function(param,dragTo,callback){
		if (!dragTo) return;
		$.ajax({
			url:'index.php?explorer/pathCuteDrag',
			type:'POST',
			dataType:'json',
			data:makeJson(param)+'&path='+urlEncode(dragTo+'/'),
			beforeSend: function(){
				Tips.loading(LNG.moving);
			},
			error:core.ajaxError,
			success:function(data){
				Tips.close(data);
				if(data.code){
					core.playSound('drag_drop');
				}
				if (typeof (callback) == 'function') callback(data.info);
			}
		});
	};
	// 创建副本
	var copyDrag = function(param,dragTo,callback,filename_auto){
		if (!dragTo) return;
		if (filename_auto == undefined){
			filename_auto = 0;
		}
		$.ajax({
			url:'index.php?explorer/pathCopyDrag',
			type:'POST',
			dataType:'json',
			data:makeJson(param)+'&path='+urlEncode(dragTo+'/')+'&filename_auto='+ Number(filename_auto),
			beforeSend: function(){
				Tips.loading(LNG.moving);
			},
			error:core.ajaxError,
			success:function(data){
				Tips.close(data);
				if(data.code){
					core.playSound('drag_drop');
				}
				if (typeof (callback) == 'function') callback(data.info);
			}
		});
	};

	//==查看剪贴板
	var clipboard = function(){
		var makeHtml = function(data,type){
			var html = '<div style="padding:20px;">null!</div>';
			if(data.length !=0 ){
				html = '<div style="height:200px;overflow:auto;padding:10px;width:400px"><b>'+LNG['clipboard_state']+LNG[type]+'</b><br/>';
				var len = 40;
				for (var i=0;i<data.length;i++) {
					var cell = data[i];
					var path = cell['path'];
					path=(path.length<len)?path:'...'+path.substr(-len);
					html += '<br/>'+cell['type']
						 +':  <a href=\'javascript:ui.pathOpen.open("'+htmlEncode(cell['path'])+'","'+cell['type']+'");\'>'+path+'</a>';
				}
				html += '</div>';
			}
			return html;
		}
		$.ajax({
			url:'index.php?explorer/clipboard',
			dataType:'json',
			error:core.ajaxError,
			success:function(data){
				if (!data.code) return;
				$.dialog({
					title:LNG.clipboard,
					padding:0,
					height:200,
					width:400,
					content:makeHtml(data.data,data.info)
				});
			}
		});
	};

	var favRemove = function(id,callback,ignoreAlert){
		var request = function(){
			$.ajax({
				url:'index.php?fav/del&favid='+id,
				dataType:'json',
				async:false,
				success:function(data){
					if (typeof (callback) == 'function') callback(data);
				}
			});
		}
		if(ignoreAlert){
			request();
			return;
		}
		$.dialog({
			id:'dialog_fav_remove',
			fixed: true,//不跟随页面滚动
			icon:'question',
			title:LNG.fav_remove,
			width:200,
			padding:"40px 20px",
			content:LNG.fav_remove+'?',
			ok:request,
			cancel: true
		});
	}


	//==添加收藏夹
	var fav = function(obj){
		if (!obj) return;
		if(trim(core.pathClear(obj.path),'/').indexOf('/')==-1){//虚拟目录根目录
			var info = core.getPathIcon(obj.path,obj.name);
			if(info.icon != ""){
				obj.ext = info.icon;
				obj.name = info.name;
			}
		}
		// var param='&name='+urlEncode(obj.name)+'&path='+urlEncode(obj.path)+'&type='+obj.type;
		// core.setting('fav'+param);
		// return;

		$.ajax({
			url:'index.php?fav/add',
			dataType:'json',
			data:obj,
			success:function(data){
				Tips.tips(data);
				if (data.code && Config.pageApp != 'desktop'){
					//ui.tree.refreshFav();
				}
			}
		});
	};

	//获取数据
	var appParam = function(dom){
		var param ={};
		param.type = dom.find("input[type=radio]:checked").val();
		param.content = dom.find("textarea").val();
		param.group   = dom.find("[name=group]").val();
		dom.find('input[type=text]').each(function(){
			var name = $(this).attr('name');
			param[name] = $(this).val();
		});
		dom.find('input[type=checkbox]').each(function(){
			var name = $(this).attr('name');
			param[name] = $(this).attr('checked')=='checked'?1:0;
		});
		return param;
	}

	var bindAppEvent = function(dom){
		dom.find('.type input').change(function(){
			var val = $(this).attr('apptype');
			dom.find('[data-type]').addClass('hidden');
			dom.find('[data-type='+val+']').removeClass('hidden');
		});

		dom.find('.app_edit_select_icon').unbind('click').bind('click',function(){
			var iconpath = G.basic_path+'static/images/file_icon/icon_app/';//root才能管理
			if (!G.is_root){
				iconpath = '';
			}
			core.api.pathSelect(
				{type:'file',title:LNG.path_api_select_file,firstPath:iconpath},  
				function(path){
				var path = core.path2url(path);
				dom.find('.app_edit_select_icon_input').val(path);
			});
		});

		dom.find(".size-full").unbind('click').bind('click',function(){
			var checked = $(this).prop("checked");
			if(checked){
				dom.find('[name=width]').val("100%");
				dom.find('[name=height]').val("100%");
			}else{
				dom.find('[name=width]').val("800");
				dom.find('[name=height]').val("600");
			}
		});
	}
	//应用添加、修改——创建文件；appstore 添加、修改——修改数据
	var appEdit = function(path,callback,action){//path——path/jsondata
		//action:user_add user_edit	root_add root_edit
		var title = LNG.app_create,dom,
			url,html,
			uuid  = UUID(),
			editpath,
			theTpl = require('./tpl/app_edit.html'),
			render = template.compile(theTpl);
		if (action == undefined){action= 'user_edit'};
		if (action == 'root_edit'){path = path;};
		if (action == 'user_edit' || action == 'root_edit'){
			title = LNG.app_edit;
			html  = render({LNG:LNG,uuid:uuid,data:path});
		}else{
			html  = render({LNG:LNG,uuid:uuid,data:{}});
		}
		$.dialog({
			fixed: true,//不跟随页面滚动
			width:450,
			id:uuid,
			padding:15,
			title:title,
			content:html,
			button:[
			   {name:LNG.preview,callback:function(){
					core.openApp(appParam(dom));
					return false;
				}},
			   {name:LNG.button_save,focus:true,callback:function(){
					var data = appParam(dom);
					switch(action){
						case 'user_add':
							var filename = urlEncode(G.this_path+data.name);
							url = './index.php?app/user_app&action=add&path='+filename;
							break;
						case 'user_edit':
							url = './index.php?app/user_app&path='+urlEncode(path.path);
							break;
						case 'root_add':url = './index.php?app/add&name='+urlEncode(data.name);break;
						case 'root_edit':url = './index.php?app/edit&name='+urlEncode(data.name)+'&old_name='+urlEncode(path.name);break;
						default:break;
					}
					$.ajax({
						url: url,
						type:'POST',
						dataType:'json',
						data:{data:urlEncode(jsonEncode(data))},
						beforeSend:function(){
							Tips.loading();
						},
						error:core.ajaxError,
						success: function(data){
							Tips.close(data);
							if (!data.code) return;
							if (action == 'root_edit' || action == 'root_add'){
								//刷新应用列表
								if (!data.code){return;};
								ShareData.frameTop('Openapp_store',function(page){
									page.App.reload();
								});
							}else{
								if (typeof (callback) == 'function'){
									callback();
								}else{
									ui.f5();
								}
							}
						}
					});
				}}
			]
		});


		dom = $('.'+uuid);
		if(!G.is_root){
			$('.appbox .appline .right a.open').remove();
		}
		//init 选中、初始化数据、显示隐藏
		if (path.group){
			dom.find('option').eq(path.group).attr('selected',1);
		}
		dom.find('.aui_content').css('overflow','inherit');
		switch(action){
			case 'user_edit' :
				dom.find('.name').addClass('hidden');
				dom.find('.desc').addClass('hidden');
				dom.find('.group').addClass('hidden');
				dom.find('option[value='+path.group+']').attr('checked',true);
				break;
			case 'user_add':
				dom.find('.desc').addClass('hidden');
				dom.find('.group').addClass('hidden');
				dom.find('[apptype=url]').attr('checked',true);
				dom.find('[data-type=url] input[name=resize]').attr('checked',true);
				dom.find('input[name=width]').attr('value','800');
				dom.find('input[name=height]').attr('value','600');
				dom.find('input[name=icon]').attr('value','oexe.png');
				break;
			case 'root_add':
				dom.find('[apptype=url]').attr('checked',true);
				dom.find('[data-type=url] input[name=resize]').attr('checked',true);
				dom.find('input[name=width]').attr('value','800');
				dom.find('input[name=height]').attr('value','600');
				dom.find('input[name=icon]').attr('value','oexe.png');
				break;
			case 'root_edit':
				dom.find('option[value='+path.group+']').attr('selected',true);
				break;
			default:break;
		}
		bindAppEvent(dom);
	};
	var appList = function(){
		core.appStore();
	};
	var appAddURL = function(url){
		if (url && url.length<4 && url.substring(0,4)!='http') return;
		$.ajax({
			url: './index.php?app/get_url_title&url='+url,
			dataType:'json',
			beforeSend:function(){
				Tips.loading();
			},
			success: function(result){
				var name = result.data;
				name = name.replace(/[\/\\]/g,'_');
				Tips.close(result);
				var data ={
					// content:"window.open('"+url+"');",
					// type: "app",
					content:url,
					type: "url",
					desc: "",
					group: "others",
					icon: "internet.png",
					name: name,
					resize: 1,
					simple: 0,
					height: "70%",
					width: "90%"
				};
				var filename = urlEncode(G.this_path+name);
				url = './index.php?app/user_app&action=add&path='+filename;
				$.ajax({
					url: url,
					type:'POST',
					dataType:'json',
					data:{data:urlEncode(jsonEncode(data))},
					success: function(data){
						Tips.close(data);
						if (!data.code) return;
						ui.f5();
					}
				});
			}
		});
	};

	return{
		strSort:strSort,
		appEdit:appEdit,
		appList:appList,
		appAddURL:appAddURL,
		share:share,
		shareBox:shareBox,

		setBackground:setBackground,
		createLink:createLink,
		createProject:createProject,
		newFile:newFile,
		newFolder:newFolder,
		rname:rname,
		unZip:unZip,
		zipDownload:zipDownload,

		//参数为json数据，可以操作多个对象
		zip:zip,
		copy:copy,
		cute:cute,
		info:info,
		remove:remove,
		cuteDrag:cuteDrag,
		copyDrag:copyDrag,

		past:past,
		clipboard:clipboard,
		fav:fav,
		favRemove:favRemove
	}
});


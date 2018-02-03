define(function(require, exports) {
	//双击或者选中后enter 打开 执行事件
	//或者打开指定文件
	var open = function(path,ext,id,uid){
		var newMove = ['rmvb','rm','mpg','avi'];
		core.filetype['movie'] = core.filetype['movie'].concat(newMove);
		if (path == undefined) return;
		if(!core.pathReadable(path)){
			Tips.tips(LNG.no_permission_read_all,false);
			core.playSound("error");
			return;
		}
		if (ext == 'folder'){
			if (Config.pageApp == 'explorer'){
				ui.path.list(path+'/',undefined,undefined,undefined,id);//更新文件列表
			}else{
				core.explorer(path);
			}
			return;
		}
		if (ext == 'oexe') {//file 为object
			//搜索中含有oexe的打开；直接打开指定oexe文件
			if (typeof(path) == 'string'){
				var file_path = path;
				if (typeof(path) != 'string') {
					file_path = path.content.split("'")[1]
				};
				core.fileGet(file_path,function(data){
					var obj = jsonDecode(data);
					obj.name = core.pathThis(file_path);
					core.openApp(obj);
				})
			}else{//列表、树目录的打开方式
				core.openApp(path);
			}
			return;
		}

		//重新获取扩展名
		if(!ext){
			ext = core.pathExt(path);
		}		

		//office编辑；预览检测
		if(officeFileCheck(ext)){
			openOffice(path,true,id,uid);
			return;
		}
		//if (!core.authCheck('explorer:fileDownload',LNG.no_permissiondownload)) return;
		if (ext == 'swf') {
			$.dialog({
				resize:true,
				fixed:true,
				ico:core.icon('swf'),
				title:core.pathThis(path),
				width:'75%',
				height:'65%',
				padding:0,
				content:core.createFlash(core.path2url(path,'',id,uid))
			});
			return;
		}

		if(inArray(core.filetype['archive_list'],ext)){
			//core.zipView(path);
			return;
		}

		if(ext == 'url'){
			core.fileGet(path,function(data){
				var match = data.match(/URL=(.*)/);
				if(match.length>=2){
					window.open(match[1]);
				}else{
					openEditor(path,id,uid);
				}
			});
			return;
		}
		if(ext == 'webloc'){//快捷方式
			core.fileGet(path,function(data){
				try{
					var xmlDoc = $($.parseXML(data));
					var url = xmlDoc.find('string').text();
					window.open(url);
				}catch(e){
					openEditor(path,id,uid);
				}
			});
			return;
		}

		if (ext=='html' || ext =='htm'){
			var url = core.path2url(path,'',id,uid);
			core.openDialog(url,core.icon('html'),core.pathThis(path));
			return;
		}
		if (inArray(core.filetype['image'],ext)){//单张图片打开
			var url = path;
			if (url.indexOf('http:') == -1) {
				url = core.path2url(url,'',id,uid);
			}
			MaskView.image(url);
			return;
		}

		if (inArray(core.filetype['music'],ext) 
			|| inArray(core.filetype['movie'],ext) ) {
			var url = core.path2url(path,false,id,uid);
			player([{
				url:url,
				name:urlDecode(core.pathThis(path)),
				ext:ext
			}]);
			return;
		}

		if(ext=='pdf'){
			var link = core.path2url(path,'',id,uid);
			var url = './lib/plugins/pdfjs/web/viewer.html?file='+urlEncode(link);
			if(canvasSupport()){
				core.openDialog(url,core.icon(ext),htmlEncode(core.pathThis(path)) );
			}else{
				var uuid = 'pdf'+UUID();
				var html = '<div id="'+uuid+'" style="height:100%;">\
				<a href="'+link+'" target="_blank" style="display:block;margin:0 auto;margin-top:80px;font-size:16px;text-align:center;">'+LNG.error+' '+LNG.download+' PDF</a></div>';
				$.dialog({
					resize:true,
					fixed:true,
					ico:core.icon(ext),
					title:core.pathThis(path),
					width:800,
					height:400,
					padding:0,
					content:html
				});
				new PDFObject({url:link}).embed(uuid);
			}
			return;
		}

		if (inArray(core.filetype['doc'],ext) ){
			openOffice(path,true,id,uid);
			return;
		}
		if (inArray(core.filetype['text'],ext)){
			openEditor(path,id,uid);//代码文件，编辑
			return ;
		}
		//未知文件
		if (Config.pageApp == 'editor'){
			Tips.tips(ext+LNG.edit_can_not,false);
		}else{
			openUnknow(path,'',id,uid);
		}
	}

	var openUnknow = function(path,tips,id,uid){
		if(tips == undefined) tips="";
		var content = '<div class="unknow_file can_select" style="width:260px;word-break: break-all;"><span>'
			+LNG.unknow_file_tips+'<br/>'+tips+'</span><br/><br/>'
			+'<a class="btn btn-default btn-nomal" href="javascript:ui.pathOpen.openEditorForce(pathHashDecode(\''+pathHashEncode(path)+'\'),'+id+');"> '+LNG.edit+' </a>&nbsp;'
			+'<a class="btn btn-success btn-nomal ml-15" href="javascript:ui.pathOpen.download(pathHashDecode(\''+pathHashEncode(path)+'\'),'+id+');"> '+LNG.unknow_file_download+' </a></div>'
		$.dialog({
			id:'open_unknow_dialog',
			fixed: true,//不跟随页面滚动
			icon:'warning',
			title:LNG.unknow_file_title,
			padding:30,
			content:content,
			cancel: true
		});
		$('.unknow_file a').unbind('click').bind('click',function(){
			$.dialog.list['open_unknow_dialog'].close();
		});
	};
	var downloadUrl = function(url){
		$.dialog({
			icon:'succeed',
			title:false,
			time:1.5,
			content:LNG.download_ready +'...'
		});

		if(isWap()){//ios不支持文件下载
			window.open(url);
		}else{
			$('<iframe src="'+url+'" style="display:none;width:0px;height:0px;"></iframe>').appendTo('body');
		}
	};
	var download = function(path,id){
		if (!core.authCheck('explorer:fileDownload',LNG.no_permissiondownload)) return;
		if (!path) return;
		if (!core.pathReadable(path)){
			Tips.tips(LNG.no_permission_read_all,false);
			core.playSound("error");
			return;
		}
		var url = 'index.php?explorer/fileDownload&access_token='+G.access_token+'&path='+urlEncode(path) + '&fileid=' + id;
		if (typeof(G['share_page']) != 'undefined') {
			url = 'index.php?share/fileDownload&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(path) + '&fileid=' + id;
		}

		if (path.substr(0,4) == 'http'){
			url = path;
		}
		downloadUrl(url);
	};
	//新的页面作为地址打开。鼠标右键，IE下打开
	var openWindow = function(path){
		if (path==undefined) return;
		if(!core.pathReadable(path)){
			Tips.tips(LNG.no_permission_read_all,false);
			core.playSound("error");
			return;
		}		
		var url=core.path2url(path);
		window.open(url);
	};
	var openEditor = function(path,id,uid){
		//if (!core.authCheck('explorer:fileDownload',LNG.no_permissiondownload)) return;
		if (!path) return;
		if(!core.pathReadable(path)){
			Tips.tips(LNG.no_permission_read_all,false);
			core.playSound("error");
			return;
		}
		var ext = core.pathExt(path);
		var iswin = (navigator.platform == "Win32") || (navigator.platform == "Windows");
		if(inArray(core.filetype['doc'],ext)){
			openOffice(path,true,id,uid);
			return;
		}
		var filename = core.pathThis(path);
		if (inArray(core.filetype['bindary'],ext) ||
			inArray(core.filetype['music'],ext) ||
			inArray(core.filetype['image'],ext) ||
			inArray(core.filetype['movie'],ext) ||
			inArray(core.filetype['doc'],ext)
			){
			//Tips.tips(ext+LNG.edit_can_not,false);
			open(path,ext);
			return;
		}
		openEditorForce(path,id,uid);
	};

	var openEditorForce = function(path,id,uid){
		var kod_top = ShareData.frameTop();
		if( typeof(kod_top.Editor) != 'undefined'){//当前为编辑器
			kod_top.Editor.add(urlEncode(path));
			return;
		}
		if (Config.pageApp == 'editor') {
			ShareData.frameChild('OpenopenEditor',function(page){
				page.Editor.add(urlEncode(path));
			});
			return;
		}
		if (ShareData.frameTop('OpenopenEditor') ) {
			//显示并且显示到最上层
			var dialog_editer = kod_top.$.dialog.list['openEditor'];
			var delay = 0;//最小化则先显示再打开
			if (dialog_editer) {
				if($(dialog_editer.DOM.wrap).css('visibility') == 'hidden'){
					delay = 200;
					dialog_editer.display(true).zIndex().focus();
				}
			}
			setTimeout(function(){
				ShareData.frameTop('OpenopenEditor',function(page){
					page.Editor.add(urlEncode(path));
				});
			},delay);
		}else{
			var the_url = './index.php?editor/edit#filename='+urlEncode(path)+ '&fileid='+id+'&this_uid='+uid;
			if (typeof(G['share_page']) != 'undefined') {
				the_url = './index.php?share/edit&user='+G.user+'&sid='+G.sid+'#filename='+urlEncode(path);
			}
			var title = htmlEncode(urlDecode(core.pathThis(path)));
			core.openDialog(the_url,core.icon('edit'),title,'openEditor');
		}
	}

	var officeFileCheck = function(ext){
		if(!G.kodOffice) return false;

		var support = ".docx.doc.odt.rtf.djvu.fb2.epub.xps.//.docm.dotm.dot.dotx.mht.//.wps.wpt.";
		support += ".xls.xlsx.ods.csv.//.xlt.xltx.xlsb.xlsm.//.et.ett.";
		support += ".pps.ppsx.ppt.pptx.odp.//.pot.potx.pptm.ppsm.potm.//.dps.dpt.";
		if(support.indexOf('.'+ext+'.') === -1) return false;
		return true;
	}
	var openOffice = function(path,isEdit,id,uid){
		var url = './index.php?explorer/officeView&access_token='+G.access_token+'&path='+urlEncode(path) + '&fileid=' + id + '&this_uid=' + uid;
		if (typeof(G['share_page']) != 'undefined') {
			url = G.app_host+'index.php?share/officeView&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(path) + '&fileid=' + id + '&this_uid=' + uid;
		}
		if (typeof(isEdit) != "undefined") {
			url += "&is_edit=1"
		}

		if(G.kodOffice == 'page'){
			window.open(url);
			return;
		}
		core.openDialog(url,core.icon(core.pathExt(path)),htmlEncode(core.pathThis(path)) );
	}

	//传入音乐播放地址，多个的话传入数组。可以扩展播放网络音乐
	var playerInstance = function(list){
		if (!list) return;
		if (typeof(list) == 'string') list=[list];
		var myPlayer = require('./myPlayer');
		myPlayer.play(list);
	};
	// 始终在最上层启动播放器
	var player = function(list){
		var top = ShareData.frameTop();
		top.ui.pathOpen.playerInstance(list);
	};
	
	//对外接口
	return{
		open:open,
		playerInstance:playerInstance,
		play:player,
		openEditor:openEditor,
		openEditorForce:openEditorForce,
		openWindow:openWindow,
		openUnknow:openUnknow,
		downloadUrl:downloadUrl,
		download:download
	}
});

//对文件打开，文件操作的封装
define(function(require, exports) {
	var pathOperate  = require('../../common/pathOperate');
	var pathOpen 	 = require('../../common/pathOpen');
	var selectByChar = undefined;//键盘选择记录

	//打开目录。更新文件列表，ajax方式
	var list = function(path,tips,callback){//
		if (path == undefined) return;
		if (path == G.this_path){
			if (tips != undefined && tips!='') {
				Tips.tips(LNG.path_is_current,'info');
			}
			return; //如果相同，则不加载。
		}
		//统一处理地址
		G.this_path = path.replace(/\\/g,'/');
		G.this_path = path.replace(/\/+/g,'/');
		if (G.this_path.substr(G.this_path.length-1) !='/') {
			G.this_path+='/';
		}

		var url = window.location.origin + window.location.pathname + window.location.search;
		window.location.href = url+ '#' + urlEncode(G.this_path);
		ui.f5Callback(function(){
			if(typeof(callback) == 'function')callback();
		});
	};
	var open = function(path,ext,id,uid){
		if (path == undefined) return;
		if (ext == 'folder'){
			ui.path.list(path+'/');//更新文件列表
			return;
		}else{
			var url = core.path2url(path,'',id,uid);
			var canOpen = ['pdf','html','htm'];
			if (ext == 'oexe') {
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
			}else if (ext == 'pdf'){
				var url = './lib/plugins/pdfjs/web/viewer.html?file='+urlEncode(core.path2url(path)) + '&fileid=' + id + '&this_uid=' + uid;
				window.location.href= url;
			}else if(  inArray(core.filetype.music,ext) 
					|| inArray(core.filetype.movie,ext) ) {
				var isAndroid = navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Adr') > -1;
				if(isAndroid){
					pathOpen.play([{
						url:url,
						name:urlDecode(core.pathThis(path)),
						ext:ext
					}]);
					try{
						setTimeout(function(){
							if($.artDialog.list.movie_player_dialog){
								$.artDialog.list.movie_player_dialog._clickMax();
							}
						},500);						
					}catch (e){}					
				}else{
					window.location.href= url;
				}
			}else if (inArray(core.filetype['doc'],ext)){
				var url = './index.php?explorer/officeView&access_token='+G.access_token+'&path='+urlEncode(path) + '&fileid=' + id + '&this_uid=' + uid;
				if (typeof(G['share_page']) != 'undefined') {
					url = G.app_host+'index.php?share/officeView&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(path) + '&fileid=' + id + '&this_uid=' + uid;
				}
				window.location.href= url;
			}else if (inArray(canOpen,ext)) {
				window.location.href= url;
			}else if (inArray(core.filetype['text'],ext)) {
				var url = G.app_host+'index.php?editor/edit#filename='+urlEncode(path)  + '&fileid=' + id + '&this_uid=' + uid;
				if (typeof(G['share_page']) != 'undefined') {
					url = G.app_host+'index.php?share/edit&user='+G.user+'&sid='+G.sid+'#filename='+urlEncode(path)  + '&fileid=' + id + '&this_uid=' + uid;
				}
				window.location.href= url;
			}else if (inArray(core.filetype['image'],ext)) {
				ui.openImage(path);
			}else{
				var url = G.app_host+'index.php?explorer/fileDownload&path='+urlEncode(path) + '&fileid=' + id + '&this_uid=' + uid;
				if (typeof(G['share_page']) != 'undefined') {
					url = G.app_host+'index.php?share/fileDownload&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(path) + '&fileid=' + id + '&this_uid=' + uid;
				}
				var content = '<div class="unknow_file" style="width:200px;word-break: break-all;"><span>'
					+LNG.unknow_file_tips+'<br/>'
					+'</span><br/><a class="btn btn-success btn-sm" href="'+url+'"> '+LNG.unknow_file_download+' </a></div>'
				$.dialog({
					fixed: true,//不跟随页面滚动
					icon:'warning',
					width:30,
					lock:true,
					background:'#000',
					opacity:0.2,
					title:LNG.unknow_file_title,
					padding:10,
					content:content,
					cancel: true
				});
			}			
		}
	}

	//查找json中，文件名所在的数组位置。
	var arrayFind = function(data,key,str){
		var m=data.length;
		for(i=0;i<m;i++){
			if(data[i][key]==str) return data[i];
		}
	};
	//重名&新建  文件[夹]名是否存在检测()
	var fileExist = function(filename){
		var list="";
		var is_exist=0;
		if (G.json_data['filelist']!=null) {
			list=arrayFind(G.json_data['filelist'],'name',filename);//重名检测
			if(list!=null){ 
				is_exist=1;
			}       
		}
		if (G.json_data['folderlist']!=null) {
			list=arrayFind(G.json_data['folderlist'],'name',filename);//重名检测
			if(list!=null){ 
				is_exist=1;
			}
		}
		return is_exist;
	}
	//获得文件名,同名则结尾自增  folder--folder(1)--folder(2)
	var getName = function(filename,ext){
		var i = 0,lastname;
		if (ext == undefined) {//文件夹
			if(!fileExist(filename)){
				return filename;
			}
			lastname = filename+'(0)';
			while(fileExist(lastname)){
				i++;
				lastname = filename+'('+i+')';
			}
			return lastname;
		}else{
			if(!fileExist(filename+'.'+ext)){
				return filename+'.'+ext;
			}
			lastname = filename+'(0).'+ext;
			while(fileExist(lastname)){        
				i++;
				lastname = filename+'('+i+').'+ext;
			}
			return lastname;            
		}
	};

	//新建文件夹
	var newFolder = function() {
		var dialog = $.dialog.prompt('',function(value){
			pathOperate.newFolder(G.this_path+value,function(){
				ui.f5();
			});
		},getName('folder'));
	};

	//新建文件夹
	var newFile = function() {
		var dialog = $.dialog.prompt('',function(value){
			pathOperate.newFile(G.this_path+value,function(){
				ui.f5();
			});
		},getName('file','txt'));
	};

	//重命名
	var rname = function(path,id) {
		var dialog = $.dialog.prompt('',function(value){
			var rname_to  = core.pathFather(path)+value;
			pathOperate.rname(path,id,rname_to,function(){
				ui.f5();
			});	
		},core.pathThis(path));
	};

	//构造参数 操作文件[夹]【选中数据】
	var getParam = function(makeArray,path,type,id){
		if (type!='folder') {
			type = 'file';
		};
		if (makeArray) {//多个数据操作
			return [{path:path,type:type,fileid:id}];
		}else{// 单个操作  返回
			return {path:path,type:type,fileid:id};
		}
	};
	return {
		//operate
		pathOperate:pathOperate,
		pathOpen:pathOpen,
		download:function(path,type,id){
			if (type=='folder') {//单个文件下载
				pathOperate.zipDownload([{path:path,type:'folder',fileid:id}]);
			}else{//多个文件或文件夹下载(压缩后下载)
				pathOpen.download(path,id);
			}
		},
		remove 	:function(path,type,id){
			pathOperate.remove(getParam(true,path,type,id),ui.f5);
		},
		copy 	:function(path,type,id){pathOperate.copy(getParam(true,path,type,id));},
		cute 	:function(path,type){pathOperate.cute(getParam(true,path,type),ui.f5);},
		info:function(path,type,id){
			//pathOperate.remove(getParam(true,path,type),null);
			pathOperate.info(getParam(true,path,type,id));
		},
		past:function(){
			pathOperate.past(G.this_path,ui.f5,G.this_fileid);
		},

		//内部特有的
		open:open,
		list:list,
		newFolder:newFolder,
		newFile:newFile,
		rname:rname
	}
});

//对文件打开，文件操作的封装
define(function(require, exports) {
	var pathOperate  = require('../../common/pathOperate');
	var pathOpen 	 = require('../../common/pathOpen');
	var selectByChar = undefined;//键盘选择记录
	ui.pathOpen = pathOpen;

	//remove rname copy cute zip unzip 
	//fav;my_group;group_all;goup_guest;recycle;share
	var checkSystemPath = function(){
		
		var selectObj = ui.fileLight.fileListSelect();
		var uid = selectObj.attr('uid');
		if(G.uid != uid){
			//Tips.tips(LNG['path_can_not_action'],'warning');
			return false;
		}
		if( G.json_data.info['path_type'] == G.KOD_USER_RECYCLE ||
			G.json_data.info['path_type'] == G.KOD_USER_SHARE){
			return true;
		}
//		if(selectObj.hasClass('systemBox')){
//			Tips.tips(LNG['path_can_not_action'],'warning');
//			return false;
//		}
		
		return true;
	}

	//打开目录。更新文件列表，ajax方式
	var list = function(path,tips,callback,noHistory,id){//
		if (path == undefined) return;
		if (Config.pageApp!='explorer') {
			core.explorer(path);
			return;
		};
		if (path == G.this_path){
			if (tips != undefined && tips!='') {
				Tips.tips(LNG.path_is_current,'info');
			}
			return; //如果相同，则不加载。
		}
		//统一处理地址
		G.this_path = path.replace(/\\/g,'/');
		G.this_path = path.replace(/\/+/g,'/');
		G.this_fileid = id
		if (G.this_path.substr(G.this_path.length-1) !='/') {
			G.this_path+='/';
		}
		if ($('.dialog_file_upload').length>0) {
			var isHidden = $('.dialog_file_upload').css("visibility")=='hidden';
			core.upload();
			if (isHidden) {
				$('.dialog_file_upload').css("visibility",'hidden');
			}
		}
		if (typeof(G.sid) != 'undefined'){
			window.location.href="#"+urlEncode(G.this_path);
		}
		core.playSound('folder_open');
		ui.tree.setSelect(G.this_path);
		if(!noHistory){
			ui.path.history.add(G.this_path);
		}
		//split 打开新目录
		if(G.user_config.list_type == 'list_split'){
			var $findFile = $(".split_box .file[data-path="+pathHashEncode(G.this_path)+"]");
			if($findFile.length == 0 || $findFile.find('.children_more_cert').length == 0){
				$(".fileList_list_split .split_box").remove();
			}else{
				$findFile.click();
				return;
			}
		}
		ui.f5Callback(function(){
			if(typeof(callback) == 'function')callback();
		});
	};
	var history = (function(){
		var historyArr = [];
		var historyMax = 60;
		var index = 0;
		var add = function(path){
			var last = historyArr.length-1;
			if (last == index && historyArr[last] == path){
				return refresh();
			}
			if (index != last) {
				historyArr = historyArr.slice(0,index+1);
			}
			if(historyArr[historyArr.length-1] != path){
				historyArr.push(path);
			}
			if(historyArr.length >= historyMax){//超过
				historyArr = historyArr.slice(1);
			}
			index = historyArr.length-1;//重置
			refresh();
		};
		var next = function(){
			if (index+1<=historyArr.length-1) {
				list(historyArr[++index],"","",true);
				refresh();
			}
		}
		var back = function(){
			if (index-1>=0) {
				list(historyArr[--index],"","",true);
				refresh();
			}
		}
		var refresh = function(){
			var className = 'disable';
			var last = historyArr.length-1;
			$('#history_next').addClass(className);
			$('#history_back').addClass(className);
			if(index==0 && last==0){
				return;
			}
			if (index>0 && index<=last){//可以后退
				$('#history_back').removeClass(className);
			}
			if (index>=0 && index!=last){//可以前进
				$('#history_next').removeClass(className);
			}
		}
		return {
			add:add,
			back:back,
			next:next,
			list:function(){
				return historyArr;
				
			}
		}
	})();


	//设置某个文件[夹]选中。传入字符串或数组
	var setSelectByFilename = function(name) {
		if (name == undefined) return;
		if (typeof(name) == 'string') {
			name = [name];
		}
		for(var i=0;i<name.length;i++){
			name[i] = trim(name[i],'/');
		}
		
		ui.fileLight.clear();
		ui.fileLight.fileListAll().each(function(key,value){
			var current_path = trim(ui.fileLight.path($(this)),'/');
			if(!current_path) return;
			if ( $.inArray(current_path,name) !=-1){
				$(this).addClass(Config.SelectClassName);
			}
		});
		ui.fileLight.select();
		ui.fileLight.setInView();
	};

	//设置某个文件[夹]选中。传入字符串或数组
	var setSelectByChar = function(ch) {
		if (ch == '') return;
		//初始化数据
		ch = ch.toLowerCase();
		if (selectByChar == undefined
			|| G.this_path != selectByChar.path
			|| ch != selectByChar.key ) {
			var arr = [];
			ui.fileLight.fileListAll().each(function(){
				var current_name = ui.fileLight.name($(this));
				var current_path = ui.fileLight.path($(this));
				if (!current_name) return;
				if (ch == current_name.substring(0,ch.length).toLowerCase()){
					arr.push(current_path);
				}
			});
			selectByChar = {key:ch,path:G.this_path,index:0,list:arr};
		}

		if (selectByChar.list.length == 0) return;//没有匹配项
		//自动从匹配结果中查找
		setSelectByFilename(selectByChar.list[selectByChar.index++]);
		if (selectByChar.index == selectByChar.list.length) {
			selectByChar.index = 0;
		}
	};

	//搜索当前文件夹 含有字母
	var setSearchByStr = function(ch) {
		if (ch == ''){
			ui.fileLight.clear();
			return;
		}
		ui.fileLight.clear();
		ui.fileLight.fileListAll().each(function(key,value){
			var current_name = ui.fileLight.name($(this));
			if (current_name.toLowerCase().indexOf(ch) != -1){
				$(ui.fileLight.fileListAll()).eq(key).addClass(Config.SelectClassName);
			}
		});
		ui.fileLight.select();
		ui.fileLight.setInView();
	};

	//重名&新建  文件[夹]名是否存在检测()
	var fileExist = function(filename,ext){
		var path = G.this_path + filename;
		if(ext == undefined){
			path = path+'/';
		}
		if($('.bodymain .file[data-path="'+pathHashEncode(path)+'"]').length!=0){
			return true;
		}else{
			return false;
		}
	}
	//获得文件名,同名则结尾自增  folder--folder(1)--folder(2)
	var getName = function(filename,ext){
		var i = 0,lastname,extAll='.'+ext;
		if (ext == undefined || ext == '') extAll = '';

		if(!fileExist(filename+extAll,ext)){
			return filename+extAll;
		}
		lastname = filename+'(0)'+extAll;
		while(fileExist(lastname,ext)){
			i++;
			lastname = filename+'('+i+')'+extAll;
		}
		return lastname;
	};
	//得到json中，获取新建文件名  dom节点的位置。
	//新建文件(保持排序队形不变)
	var getCreatePos = function(str,type){
		var list    = "",i,j,offset=0,
			folderlist  = G.json_data['folderlist'],
			filelist    = G.json_data['filelist'],
			sort_list	= folderlist,
			sort_key	= G.user_config.list_sort_field,
			sort_order  = G.user_config.list_sort_order;
		var temp_new = {'name':str,'size':0,'ext':type,'mtime':date('Y/m/d H:i:s',time())};
		if (Config.pageApp == 'desktop') {
			offset += $('.menuDefault').length+1;
		}
		if(type == 'file'){
			temp_new['ext'] = core.pathExt(str);
			sort_list = filelist;
			if (sort_order == 'up'){
				offset += folderlist.length;
			}
		}else{
			if (sort_order == 'down'){
				offset += filelist.length;
			}
		}
		for (i=0;i<sort_list.length; i++){//直到比str大，返回该位置
			if (sort_order == 'down'){
				if(pathOperate.strSort(sort_list[i][sort_key],temp_new[sort_key]) == -1){//小于
					break;
				}
			}else{
				if(pathOperate.strSort(sort_list[i][sort_key],temp_new[sort_key]) != -1){//大于等于
					break;
				}
			}
		}
		return i+offset-1;
	};


	/**
	 * 新建文件&文件夹
	 * @param  {[string]} fileType   [类型 file|folder]
	 * @param  {[string]} selectName [文件名称]
	 * @param  {[string]} ext   [扩展名]
	 * @return null
	 */
	var newFile = function(fileType,selectName,ext){
		ui.fileLight.clear();
		var pos=getCreatePos(selectName,fileType);
		var $containBox = $(Config.FileBoxSelector);
		if(G.user_config.list_type == 'list_split'){
			$containBox = $('.split_box.split_select').find('.content');
		}

		var tpl = require('./tpl/file_create.html');//模板tpl
		var render = template.compile(tpl);
		var listhtml = render({
			type:fileType,
			newname:selectName,
			ext:ext,
			list_type:G.user_config.list_type
		});

		if (pos==-1 || $containBox.find('.file').length==0){//空目录时
			$containBox.html(listhtml+$containBox.html());
		}else {
			var $pre = $containBox.find(".file:eq("+pos+")");
			if($pre.length==0){
				$pre = $containBox.find('.file').last();
			}
			if(G.user_config.list_type == 'list_split'){//分栏列表
				$pre = $('.split_box.split_select .file').last();
			}
			$(listhtml).insertAfter($pre);
		}

		//选中文件名
		var $textarea   = $(".textarea .newfile");
		var selectlen=selectName.length;
		if(fileType != 'folder' && selectName.indexOf('.')!=-1){
			selectlen=selectName.length - ext.length-1;
		}
		$textarea.textSelect(0,selectlen);
		if(G.user_config.list_type == 'list_split'){//设定宽度
			$textarea.css('width',$textarea.parents('.filename').width()-40);
		}
		if(G.user_config.list_type == 'icon'){
			$("#makefile").css({'height':$("#makefile").width()+15,'margin-left':"3px",'transition':"none"});//重置高度
			$("#makefile .textarea").css('margin-top','-13px');
		}else{
			$('#makefile .x-item-file').addClass('small');
		}
		if (Config.pageApp == 'desktop') {
			ui.resetDesktopIcon();
		}		

		//结束编辑
		var makeFinished = function(filename){
			if(trim(filename)==''){
				$("#makefile").remove();
				Tips.tips(LNG.error,'warning');
				return;
			}
			if(fileExist(filename,ext)){
				$("#makefile").remove();
				Tips.tips(LNG.path_exists,'warning');
			}else{
				var pathAt = G.this_path;
				if(G.user_config.list_type == 'list_split'){
					pathAt = ui.fileLight.path($('.file_icon_edit').parents('.split_box'));
				}
				if(fileType =='folder'){
					pathOperate.newFolder(pathAt+filename,refreshCallback);
				}else{
					pathOperate.newFile(pathAt+filename,refreshCallback);
				}
			}
		}

		ui.fileLight.setInView($('.fileContiner .file_icon_edit'));
		$textarea.focus().autoTextarea();
		$textarea.unbind('keydown').keydown(function(event) {
			if (event.keyCode == 13) {
				stopPP(event);event.preventDefault();//阻止编辑器回车
				makeFinished($textarea.attr('value'));//获取编辑器值
			}
			if ( event.keyCode == 27){//esc
				$("#makefile").remove();
			}
		}).unbind('blur').blur(function(){
			makeFinished($textarea.attr('value'));
		});
	}


	//重命名
	var rname = function() {
		var path        = "";
		var selectname  = "";//成功后选中的名称
		var selectObj   = ui.fileLight.fileListSelect();
		var selectid = selectObj.attr("fileid");
		var selectName  = ui.fileLight.name(selectObj);
		var selectPath  = core.pathFather(ui.fileLight.path(selectObj));
		var fileType  = ui.fileLight.type(selectObj);
		if(selectObj.length !=1) return;
		if(!checkSystemPath()) return;
		if(selectObj.hasClass('menuSharePath')){
			//ui.path.shareEdit();
			return;//分享、不能重命名
		}
		if(selectObj.hasClass('menuFavPath')){
			return;//收藏不可重命名
		}
		
		//编辑区
		var the_value = htmlEncode(rtrim(selectName,'.oexe'));//排除.oexe
		var edit_html = "<input class='fix' id='pathRenameTextarea' value='"+the_value+"'/>";
		if(G.user_config.list_type == 'icon'){//icon
			edit_html = "<textarea class='fix' id='pathRenameTextarea'>"+the_value+"</textarea>";
			selectObj.css({'height':selectObj.height()});//重置高度
		}
		$(selectObj).addClass('file_icon_edit').find(".title").html("<div class='textarea'>"+edit_html+"<div>");
		var $textarea   = $("#pathRenameTextarea");
		if(G.user_config.list_type == 'list_split'){
			$textarea.css({
				'width':$textarea.parents('.filename').width()-32,
				'height':$textarea.parents('.filename').height()+1
			});
		}

		//选中文件名
		var selectlen=selectName.length;
		if(fileType != 'folder' && selectName.indexOf('.')!=-1){
			selectlen=selectName.length-fileType.length-1;
		}
		if(!fileType && selectName.indexOf('.') == 0){
			$textarea.textSelect(0,selectName.length);
		}else{
			$textarea.textSelect(0,selectlen);
		}
		var makeFinished = function(rnameTo){
			if (fileType == 'oexe') rnameTo+='.oexe';
			var select_name = rnameTo;//重命名后选中文件。
			if (rnameTo!=selectName){
				fileid = selectid;
				path    = selectPath+selectName;
				rnameTo= selectPath+rnameTo;
				pathOperate.rname(path,fileid,rnameTo,refreshCallback);
			}else{
				//ui.f5(false,false);
				var displayName = selectName;
				if(displayName.substr(-5)=='.oexe'){
					displayName = displayName.substr(0,displayName.length-5);
				}
				$(selectObj).removeClass('file_icon_edit').find(".title").html(htmlEncode(displayName));
			}
		}

		$textarea.focus().autoTextarea();
		$textarea.keydown(function(event) {
			if (event.keyCode == 13) {
				event.preventDefault();stopPP(event);//阻止编辑器回车
				makeFinished($textarea.attr('value'));
			}
			if ( event.keyCode == 27){
				if (fileType == 'oexe') selectName =selectName.replace('.oexe','');
				$(selectObj).removeClass('file_icon_edit').find(".title").html(selectName);
			}
		}).unbind('blur').blur(function(){
			makeFinished($textarea.val());
		});
	};
	var refreshCallback=function(selectList){//当前目录文件变化，刷新目录
		ui.fileLight.clear();
		ui.f5Callback(function() {
			setSelectByFilename(selectList);
			if (Config.pageApp == 'explorer') {
				ui.tree.checkIfChange(G.this_path);
			}
		});
	};

	// 去除子目录包含
	// 处理：/a/b/ 屏蔽【/a/b/c/ /a/b/1.txt /a/b/c/1.txt】
	// 避免：/a/b/a.txt /a/b/a.txt.temp
	var paramClear = function(list){
		var pathArr = {};
		var result  = [];
		list.sort(function(a,b){
			return a.path == b.path?0:(a.path > b.path?1:-1);
		});
		var hasParent = function(path){
			var pathBefore = path;
			while(path!=''){
				if(typeof(pathArr[path]) != 'undefined'){//找到了
					if(pathArr[path] == 1){//已使用
						return true;
					}else{
						if(pathBefore == path){
							pathArr[path] = 1;
							return false;
						}
						return true;
					}
				}
				path = core.pathFather(path);
			}
			return false;
		}
		for (var i = 0; i < list.length; i++) {
			if(list[i].type == 'folder'){
				var key = rtrim(list[i].path,'/')+'/';
				if(!pathArr[key] && !hasParent(key)){
					pathArr[key] = 0;
				}
			}
		}
		for (var i = 0; i < list.length; i++) {
			var key = list[i].path;
			if(list[i].type == 'folder'){
				key = rtrim(key,'/')+'/';
			}
			if(!hasParent(key)){
				result.push(list[i]);
			}
		}
		return result;
	}

	//构造参数 操作文件[夹]【选中数据】
	var makeParam = function(makeArray){
		if (makeArray) {//多个数据操作
			var list = [];
			if (ui.fileLight.fileListSelect().length == 0) return list;
			ui.fileLight.fileListSelect().each(function(index){
				var path = ui.fileLight.path($(this));
				var fileid = $(this).attr("fileid");
				var uid = $(this).attr("this_uid");
				var ssid = $(this).attr("ssid");
				var upid = $(this).attr("upid");
				var type = ui.fileLight.type($(this))=='folder' ? 'folder':'file';
				list.push({path:path,type:type,fileid:fileid,ssid:ssid,upid:upid,this_uid:uid});
			});
			return paramClear(list);
		}else{// 单个操作  返回
			if (ui.fileLight.fileListSelect().length !=1) return {path:'',type:''};//默认只能打开一个
			var selectObj= ui.fileLight.fileListSelect();
			var path = ui.fileLight.path(selectObj);
			var fileid = selectObj.attr("fileid");
			var uid = selectObj.attr("this_uid");
			var ssid = selectObj.attr("ssid");
			var upid = selectObj.attr("upid");
			var type = ui.fileLight.type(selectObj);
			return {path:path,type:type,fileid:fileid,ssid:ssid,upid:upid,this_uid:uid};
		}
	};


	//获取json_data 中find为value的元素
	var getJsondataCell = function(find,value){
		for (var key in G.json_data) {
			if(key !='filelist' && key !='folderlist') continue;
			for (var i = 0; i < G.json_data[key].length; i++) {
				if(G.json_data[key][i][find] == value){
					return G.json_data[key][i];
				}
			}
		}
	}

	return {
		makeParam:makeParam,
		history:history,
		getJsondataCell:getJsondataCell,
		checkSystemPath:checkSystemPath,
		appEdit:function(create){
			if (create) {
				pathOperate.appEdit(0,0,'user_add');
			}else{
				var code = ui.fileLight.fileListSelect().attr('data-app');
				var data = jsonDecode(base64Decode(code));
				data.path = ui.fileLight.path(ui.fileLight.fileListSelect());
				pathOperate.appEdit(data);
			}
		},
		appList:function(){pathOperate.appList(makeParam().path);},
		appInstall:function(){pathOperate.appInstall(makeParam().path);},

		//open
		openEditor 	:function(){pathOpen.openEditor(makeParam().path);},
		openWindow 	:function(){
			var p = makeParam();
			if( p.type == 'folder' && 
				core.path2url(p.path).search("explorer/fileProxy") !=-1 ){
				Tips.tips(LNG.path_can_not_action,false);
				return;
			}
			pathOpen.openWindow(p.path);
		},
		open:function(path){
			if (Config.pageApp=='editor') {//编辑器中oexe打开
				pathOpen.open(path);
				return;
			}
			if (path != undefined){
				
				pathOpen.open(path);
				return;
			}
			if(ui.fileLight.fileListSelect().length == 0){
				return;
			}
			var param = makeParam();
			var selectObj= ui.fileLight.fileListSelect();

			// //打开分享
			// if (G.json_data['info'] &&
			// 	G.json_data['info']['path_type']== G.KOD_USER_SHARE){
			// 	if(G.json_data['info']['id'] == G.user_id){
			// 		//ui.path.shareOpenPath();
			// 		ui.path.shareOpenWindow();
			// 		return;
			// 	}
			// }

			if (inArray(core.filetype['image'],param.type) ) {
				//没有下载权限
				//if (!core.authCheck('explorer:fileDownload',LNG.no_permission_download)) return;
				//TODO picasa
				ui.picasa.initData();
				ui.picasa.play($(selectObj).find('.picasaImage'));
				return;
			}

			if($(selectObj).find('.file_not_exists').length!=0){
				Tips.tips(LNG['share_error_path'],false);
				return;
			}
			//oexe 的打开
			if (param.type == 'oexe') {
				var code = selectObj.attr('data-app');
				param.path = jsonDecode(base64Decode(code));
			}
			if(G.user_config.list_type == 'list_split' && param.type=='folder'){
				return;
			}
			pathOpen.open(param.path,param.type,param.fileid,param.this_uid);
		},
		play:function(){
			if (ui.fileLight.fileListSelect().length <1) return;
			var list = [];//选中单个&多个都可以播放
			ui.fileLight.fileListSelect().each(function(index){
				var pathtype = ui.fileLight.type($(this));
				if (inArray(core.filetype['music'],pathtype)
					|| inArray(core.filetype['movie'],pathtype)) {
					var path = ui.fileLight.path($(this));
					var url = core.path2url(path,false);
					list.push({
						url:url,
						name:core.pathThis(path),
						ext:pathtype
					});
				}
			});
			pathOpen.play(list);
		},

		//operate
		pathOperate:pathOperate,
		share:function(){
			pathOperate.share(makeParam());
		},
		setBackground:function(){
			var url = core.path2url(makeParam().path);
			ShareData.frameTop('',function(page){//桌面父文件夹
				page.ui.setWall(url);
			});
			ui.setWall(url);
			pathOperate.setBackground(url);
		},
		createLink:function(atCurrent){
			var p = makeParam();
			var $sel = ui.fileLight.fileListSelect().last();
			p.name = trim($sel.find('.filename').text());
			pathOperate.createLink(p.path,p.name,p.type,atCurrent,refreshCallback);
		},
		createProject :function(){
			pathOperate.createProject(makeParam().path,refreshCallback);
		},
		download:function(){
			var theList = makeParam(true);
			var fileid = makeParam().fileid
			if (theList.length==1 && theList[0]['type']=='file') {//单个文件下载
				pathOpen.download(makeParam().path,fileid);
			}else{//多个文件或文件夹下载(压缩后下载)
				pathOperate.zipDownload(theList);
			}
		},

		shareEdit:function(){
			var cell_info = getJsondataCell('path',makeParam().path);
			try {
				var share_info = G.json_data['share_list'][cell_info['sid']];
				pathOperate.shareBox(share_info);
			} catch(e) {}
		},

		shareOpenWindow:function(){
			var cell_info = getJsondataCell('path',makeParam().path);
			var shareType = cell_info.type;
			if (cell_info.type=='folder') {
				if (cell_info.code_read == 1) {
					shareType = 'code_read';
				}else{
					shareType = 'folder';
				}
			}
			var share_url = './index.php?share/'+shareType+'&user='
				+G.json_data['info']['id']+"&sid="+cell_info.sid;
			window.open(share_url);
		},
		shareOpenPath:function(){
			var param = makeParam();
			var cell_info = getJsondataCell('path',param.path);
			if(!cell_info || !G.json_data['share_list']){//分栏，打开共享多层目录
				pathOpen.open(param.path,param.type);
				return;
			}
			var share_info = G.json_data['share_list'][cell_info['sid']];
			var path = core.pathFather(share_info['path']);
			var name = core.pathThis(share_info['path']);

			if(share_info['type']=="folder"){
				ui.path.list(share_info['path'],'');
			}else{
				ui.path.list(path,'',function(){
					setSelectByFilename(name);
				});
			}
		},
		
		explorer:function(){
			core.explorer(makeParam().path);
		},
		explorerNew:function(){
			window.open('index.php?/explorer&path='+makeParam().path);
		},
		openProject:function(){
			core.explorerCode(makeParam().path);
		},
		search:function(){
			core.search('',makeParam().path);
		},
		fav:function(){
			var p=makeParam();
			var $sel = ui.fileLight.fileListSelect().last();
			p.name = trim($sel.find('.filename').text());
			pathOperate.fav(p);
		},
		recycleClear:function(){
			pathOperate.remove([{type:'recycle_clear',path:''}],function(){
				ui.f5();
			});
		},
		remove:function(ignoreAlert,shiftDelete){
			if(!checkSystemPath()) return;
			var list = makeParam(true);
			if (G.json_data['info'] && 
				G.json_data['info']['path_type']== G.KOD_USER_SHARE || G.json_data['info']['path_type'] == '{group_share}' &&
				G.json_data['info']['id'] == G.user_id &&
				trim(G.this_path,'/').indexOf('/') == -1 ) {
				$.each(list,function(i,v){//取消分享
					var cell = getJsondataCell('path',list[i]['path']);
					if(cell != undefined){//只有是分享才处理成移除分享
						list[i]['type'] = 'share';
						list[i]['path'] = cell['sid'];
					}
				});
			}
			pathOperate.remove(list,refreshCallback,ignoreAlert,shiftDelete);
			// ui.fileLight.clear();
		},
		favRemove:function(){ //多选；取消收藏。
			var $sel = $('.file.select .filename');
			$sel.each(function(index){
				var name = trim($(this).text());
				var favid = $(this).attr("favid")
				if(index != $sel.length-1){
					
					pathOperate.favRemove(favid,'',true);
				}else{
					pathOperate.favRemove(favid,function(data){
						Tips.tips(data);
						ui.tree.refreshFav();
					},true);
				}				
			});			
		},
		copy:function(){
			if(!checkSystemPath()) return;
			pathOperate.copy(makeParam(true));
		},
		cute:function(){
			if(!checkSystemPath()) return;
			pathOperate.cute(makeParam(true),ui.f5);
		},
		zip:function(fileType){
			pathOperate.zip(makeParam(true),refreshCallback,fileType);
		},
		unZip:function(createFolder){
			if(!checkSystemPath()) return;
			pathOperate.unZip(makeParam().path,ui.f5,createFolder);
		},
		cuteDrag:function(dragTo){
			pathOperate.cuteDrag(makeParam(true),dragTo,refreshCallback);
		},
		copyDrag:function(dragTo,isDragCurrent){
			pathOperate.copyDrag(makeParam(true),dragTo,refreshCallback,isDragCurrent);
		},
		copyTo:function(){
			core.api.pathSelect(
				{type:'folder',title:LNG.copy_to},
				function(path){
				pathOperate.copyDrag(makeParam(true),path,refreshCallback,false);
			});
		},
		cuteTo:function(){
			core.api.pathSelect(
				{type:'folder',title:LNG.cute_to},
				function(path){
				pathOperate.cuteDrag(makeParam(true),path,refreshCallback);
			});
		},
		info:function(){pathOperate.info(makeParam(true));},
		past:function(){
			var pathTo = G.this_path;
			if(G.user_config.list_type == 'list_split'){
				$containBox = $('.split_box.split_select');
				if($containBox.length==1){
					pathTo = ui.fileLight.path($containBox);
				}
			}
			pathOperate.past(pathTo,refreshCallback);
		},
		newFile:function(ext){
			if (ext == undefined) ext = 'txt';
			newFile('file',getName('newfile',ext),ext);
		},
		newFolder:function() {
			newFile('folder',getName(LNG.newfolder),'');
		},
		showFile:function(){
			var url = './index.php?share/file&sid='+G.sid+'&user='+G.user+'&path='+makeParam().path;
			window.open(url);
		},
		rname:rname,

		//内部特有的
		list:list,
		setSearchByStr:setSearchByStr,
		setSelectByChar:setSelectByChar,
		setSelectByFilename:setSelectByFilename,
		clipboard:pathOperate.clipboard
	}
});

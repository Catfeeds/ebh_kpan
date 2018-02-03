define(function(require, exports) {
	var pathOperate  = require('./pathOperate');
	var pathOpen     = require('./pathOpen');
	var successCallback;//节点请求成功后回调
	var isUpdateRefresh = false;//上传连续更新树目录队列方式。没有处理完不做反应，处理完后sleep 2s;
	ui.pathOpen = pathOpen;
	ui.pathOperate = pathOperate;
	var zTree;
	var viewImage = function(){
		if($('#windowMaskView').length!=0
			&& $('#windowMaskView').css('display')=='block'
			&& inArray(core.filetype['image'],makeParam().type)){
			pathOpen.open(makeParam().path,makeParam().type);
		}
	}

	//按名称排序，优化;只针对文件文件夹排序
	var treeDataSort = function(treeData,isRoot){
		//组织架构、收藏夹；不排序
		if( treeData && 
			treeData[0] &&
			$.inArray(treeData[0]['menuType'],["menuTreeGroup","menuTreeFav"]) !== -1
			){
			return treeData;
		}

		var fileList = [],folderList=[];
		for (var i = 0; i < treeData.length; i++) {
			treeData[i]['drop'] = false;
			treeData[i]['drag'] = false;

			treeData[i].name = treeData[i].name;
			if (treeData[i].isParent && treeData[i].children) {
				treeData[i].children = treeDataSort(treeData[i].children);//递归
			}
			if(treeData[i]['is_writeable']){
				// treeData[i]['drop'] = true;
				// treeData[i]['drag'] = true;
			}
			if (treeData[i].type=='folder') {
				folderList.push(treeData[i]);
			}else{
				fileList.push(treeData[i]);
			}
		}
		if( isRoot ){//根目录不排序
			return treeData;
		}

		folderList= folderList.sort(function (a, b) {
			var a = a['name'];
			var b = b['name'];
			return ui.pathOperate.strSort(a,b);
		});
		fileList= fileList.sort(function (a, b) {
			var a = a['name'];
			var b = b['name'];
			return ui.pathOperate.strSort(a,b);
		});
		return folderList.concat(fileList);
	};

	var treeOpenHistory = (function(){
		var historyList = {};
		//var treeKey = "tree_open_" + md5(window.location.href);
		var treeKey = "tree_open_" + md5(Config.pageApp);//之区分文件管理和编辑器
		var data = function(list){
			if(!LocalData.support()){
				return {};
			}
			if(list == undefined){
				var result = LocalData.getConfig(treeKey);
				return result == false ? {}: result;
			}else{
				LocalData.setConfig(treeKey,list);
			}
		}
		//reset the data
		var reset = function(treeData){
			for (var i = 0; i < treeData.length; i++) {
				var key = treeData[i].path;
				if(historyList[key] !== undefined){
					treeData[i].open = historyList[key];
				}
			}
			return treeData;
		}
		//save the status
		var save = function(){
			var nodes = zTree.getNodesByFilter(function(node){
				if(node.level==0){
					return true
				}else{
					return false
				}
			});
			var arr = {};
			for (var i = 0; i < nodes.length; i++) {
				arr[nodes[i].path] = nodes[i].open;
			}
			historyList = arr;
			data(historyList);
			return historyList;
		}
		historyList = data();
		return {
			list:function(){
				return historyList;
			},
			reset:reset,
			save:save
		}
	})();

	// 目录树操作
	var init=function(){
		$.ajax({
			url: Config.treeAjaxURL+"&type=init",
			dataType:'json',
			error:function(){
				$('#folderList').html('<div style="text-align:center;">'+LNG.system_error+'</div>');
			},
			success:function(data){
				var num = 0;
				if (!data.code){
					$('#folderList').html('<div style="text-align:center;">'+LNG.system_error+'</div>');
					return;
				}
				var treeData = treeDataSort(data.data,true);
				treeData = treeOpenHistory.reset(treeData);
				$.fn.zTree.init($("#folderList"), setting,treeData);
				$('.menuTreeRoot').addClass("curSelectedNode");
				for(var i = 0;i < treeData.length; i++){
					for(var l = 0;l < treeData[i].children.length;l++){
						$("li[class='level1']").eq(num).attr("fileid",treeData[i].children[l].fileid);
						num ++;
					}
				}
				zTree = $.fn.zTree.getZTreeObj("folderList");
			}
		});
		$('.ztree .switch').die('mouseenter').live('mouseenter',function(){
			$(this).addClass('switch_hover');
		}).die('mouseleave').live('mouseleave',function(){
			$(this).removeClass('switch_hover');
		});
		if (Config.pageApp == 'editor') {
			Mousetrap.bind('up',function(e) {
				keyAction(e,'up');
			}).bind('down',function(e) {
				keyAction(e,'down');
			}).bind('left',function(e) {
				keyAction(e,'left');
			}).bind('right',function(e) {
				keyAction(e,'right');
			});
			Mousetrap.bind('enter',function(e) {
				tree.open();
			}).bind(['del','command+backspace'],function(e) {
				tree.remove();
			}).bind('f2',function(e) {
				stopPP(e);
				tree.rname();
			}).bind(['ctrl+f','command+f'],function(e) {
				stopPP(e);
				tree.search();
			}).bind(['ctrl+c','command+c'],function(e) {
				tree.copy();
			}).bind(['ctrl+x','command+x'],function(e) {
				tree.cute();
			}).bind(['ctrl+v','command+v'],function(e) {
				tree.past();
			}).bind('alt+m',function(e) {
				tree.create('folder');
			}).bind('alt+n',function(e) {
				tree.create('file');
			});
		}
	};
	var keyAction = function(e,action){
		stopPP(e);
		var treeNode = zTree.getSelectedNodes()[0];
		if (!treeNode) return;
		switch(action){
			case 'up':
				var node = treeNode.getPreNode();
				if (!node) {
					node = treeNode.getParentNode();
				}else if(node.open && node.children.length>0) {
					while(node.open && node.children && node.children.length>=1){
						node = node.children[node.children.length-1];
					}
					//if (node.getParentNode().tId == treeNode.tId) node=treeNode;
				}
				zTree.selectNode(node);
				break;
			case 'down':
				if (treeNode.open && treeNode.children.length>=1){
					node = treeNode.children[0];
				}else{
					var tempNode = treeNode,
						node = tempNode.getNextNode()||tempNode.getParentNode().getNextNode();
					try{
						while(!node){
							tempNodlevel1e = tempNode.getParentNode();
							node = tempNode.getNextNode()||tempNode.getParentNode().getNextNode();
						}
					}catch(e){}
				}
				zTree.selectNode(node);
				break;
			case 'left':
				if (!treeNode.isParent) {
					zTree.selectNode(treeNode.getParentNode());
				}else{
					if (treeNode.open) {
						zTree.expandNode(treeNode,false);
					}else{
						zTree.selectNode(treeNode.getParentNode());
					}
				}
				break;
			case 'right':
				if (treeNode.open){
					zTree.selectNode(treeNode.children[0]);
				}else{
					zTree.expandNode(treeNode,true);
				}
				break;
			default:break;
		}
		viewImage();
	};

	var canDbClickOpen = function(){
		if(Config.pageApp=='editor'){
			return false;
		}
		return true;
	}
	var setting={
		async: {
			enable: true,
			dataType: "json",
			url:Config.treeAjaxURL,//直接上次拿到的json变量。
			autoParam:["ajax_path=path",'tree_icon=tree_icon'],//前面是value 后面是key
			dataFilter: function(treeId,parentNode,responseData){
				if (!responseData.code) return null;
				return treeDataSort(responseData.data);
			}
		},
		edit: {
			enable: true,
			showRemoveBtn: false,
			showRenameBtn: false,
			drag:{
				isCopy:false,//暂时屏蔽拖拽方式移动
				isMove:false

				// isCopy:true,
				// isMove:true,
				// inner:true,
				// prev:false,
				// next:false
			}
		},
		view: {
			showLine: false,
			selectedMulti: false,
			expandSpeed:"fast",
			dblClickExpand:false,// 双击 展开&折叠
			addDiyDom: function(treeId, treeNode) {
				var spaceWidth = 15;//相差宽度
				var switchObj = $("#" + treeNode.tId + "_switch"),
				icoObj = $("#" + treeNode.tId + "_ico");
				switchObj.remove();
				treeNode.iconSkin = treeNode.tree_icon;

				var tree_icon = treeNode.tree_icon;
				if(treeNode.ext){
					tree_icon = treeNode.ext;
				}else if(!treeNode.tree_icon){
					tree_icon = treeNode.type;
				}
				icoObj.before(switchObj)
					.before('<span id="'+treeNode.tId +'_my_ico"  class="tree_icon button">'+core.iconSmall(tree_icon)+'</span>')
					.remove();

				if(treeNode.ext!=undefined){//如果是文件则用自定义图标
					icoObj.attr('class','')
					.addClass('file '+treeNode.ext).removeAttr('style');;
				}
				if (treeNode.level >= 1) {
					var spaceStr = "<span class='space' style='display: inline-block;width:"
					 + (spaceWidth * treeNode.level)+ "px'></span>";
					switchObj.before(spaceStr);
				}

				//配置对应右键菜单
				var selector = '';
				if (treeNode['menuType'] != undefined) {
					selector = treeNode['menuType'];
				}else{
					if (treeNode.type == 'file'||treeNode.ext == 'oexe') selector ='menuTreeFile';
					if (treeNode.type == 'folder') selector ='menuTreeFolder';
				}

				var title = LNG.name+':'+treeNode.name+"\n"+LNG.size+':'+core.fileSize(treeNode.size)+"\n"
				+LNG.modify_time+':'+treeNode.mtime;
				if (treeNode.type != 'file') {
					title = treeNode.name;
				}
				switchObj.parent().addClass(selector).attr('title',title);

				//读写权限处理
				if(treeNode.is_writeable==0){
					switchObj.parent().addClass('file_not_writeable');
				}
				if(treeNode.is_readable==0){//可读可写区分setSelect
					switchObj.parent().addClass('file_not_readable');
				}
			}
		},
		callback: {//事件处理回调函数
			onClick: function(event,treeId,treeNode){
				if(treeNode.ext == 'groupRoot' || treeNode.ext == 'treeFav'){
					$('.header-right').addClass('hidden');
				}else{
					$('.header-right').removeClass('hidden');
				}
				zTree.selectNode(treeNode);
				if(Config.pageApp=='editor' && treeNode.type=='folder'){
					zTree.expandNode(treeNode);
					return;
				}
				if (Config.pageApp=='editor' || treeNode.type!='folder'){
					ui.tree.openEditor();//编辑器优先打开文件
				}else{
					ui.path.list(treeNode.path,undefined,undefined,undefined,treeNode.fileid);//更新文件列表
				}
			},
			beforeClick:function(){
				console.log(1)
				$('.curSelectedNode').removeClass("curSelectedNode");
			},
			beforeDblClick:function(){
				return true;
			},
			onCollapse: function(event,treeId,treeNode){
				if(treeNode.level == 0){//close
					treeOpenHistory.save();
				}
			},
			onExpand: function(event,treeId,treeNode){
				if(treeNode.level == 0){//open
					treeOpenHistory.save();
				}
			},
			onDblClick:function(event,treeId,treeNode){
				if( $(event.target).hasClass('switch') ||
					!canDbClickOpen()){
					return false;
				}
				zTree.expandNode(treeNode);
			},
			beforeRightClick:function(treeId, treeNode){
				zTree.selectNode(treeNode);
			},
			beforeAsync:function(treeId, treeNode){
				treeNode.ajax_name= treeNode.name;
				treeNode.ajax_path= treeNode.path;
				$("#"+treeNode.tId+"_my_ico").addClass('ico_loading');
			},
			onAsyncSuccess:function(event, treeId, treeNode, msg){//更新成功后调用
				$("#"+treeNode.tId+"_my_ico").removeClass('ico_loading');
				if (msg.data.length == 0){
					zTree.removeChildNodes(treeNode);
					return;
				}
				if (typeof(successCallback) == 'function'){
					successCallback();
					successCallback = undefined;
				}
			},
			//新建文件夹、文件、重命名后回调（input blur时调用）
			onRename:function(event, treeId,treeNode,isCancle){
				var parent = treeNode.getParentNode();
				var fileid = treeNode.fileid;
				//已存在检测
				if(zTree.getNodesByParam('name',treeNode.name,parent).length>1){
					Tips.tips(LNG.name_isexists,false);
					zTree.removeNode(treeNode);
					return;
				}

				if (treeNode.create){//新建
					var path = treeNode.path+'/'+treeNode.name;
					if (treeNode.type=='folder') {
						pathOperate.newFolder(path,function(data){
							successCallback = function(){
								var sel = zTree.getNodesByParam('name',treeNode.name,parent)[0];
								zTree.selectNode(sel);
								f5Refresh();
							}
							refresh(parent);
						});
					}else{//新建文件
						pathOperate.newFile(path,function(data){
							successCallback = function(){
								var sel = zTree.getNodesByParam('name',treeNode.name,parent)[0];
								zTree.selectNode(sel);
								f5Refresh();
							}
							refresh(parent);
						});
					}
				}else{//重命名
					var from = rtrim(treeNode.path,'/');
					var to = core.pathFather(treeNode.path)+treeNode.name;
					pathOperate.rname(from,fileid,to,function(data){
						treeNode.path = data;
						successCallback = function(){
							var sel = zTree.getNodesByParam('name',treeNode.name,parent)[0];
							zTree.selectNode(sel);
							f5Refresh();
							if (treeNode.type=='folder'){
								ui.path.list(treeNode.path);//更新文件列表
							}
						}
						refresh(parent);
					});
				}
			},
			beforeDrag: function(treeId, treeNodes){
				for (var i=0,l=treeNodes.length; i<l; i++) {
					if (treeNodes[i].drag === false) return false;
				}
				return true;
			},
			beforeDrop: function(treeId, treeNodes, targetNode, moveType){
				return targetNode ? targetNode.drop !== false : true;
			},
			onDrop:function(event, treeId, treeNodes, targetNode, moveType){
				var path = '',path_to='';
				var treeNode = treeNodes[0];
				if (!treeNode.father && !treeNode.this_path) return;

				path = treeNode.father+urlEncode(treeNode.name);
				path_to = targetNode.father+urlEncode(targetNode.name);
				pathOperate.cuteDrag([{path:path,type:treeNode.type}],path_to,function(){
					refresh(treeNode);
				});
			}
		}
	};

	//配置请求数据  通用
	var makeParam = function(makeArray){
		if (!zTree) return;
		var treeNode = zTree.getSelectedNodes()[0],
			path = '',
			type ='',
			tileid = '';
		if (!treeNode){
			return {path:'',type:''};
		}

		//打开文件夹&文件
		type = treeNode.type;
		if (type == '_null_' || type==undefined) type = 'folder';
		if (type == 'file')   type = treeNode.ext;
		if (makeArray) {//多个操作接口
			return [{path:treeNode.path,type:type,node:treeNode,fileid:treeNode.fileid}];
		}else{
			return {path:treeNode.path,type:type,node:treeNode,fileid:treeNode.fileid};
		}
	};
	//通用刷新 不传参数则刷新选中节点
	var refresh = function(treeNode){
		if (!treeNode) treeNode=zTree.getSelectedNodes()[0];
		if (!treeNode.isParent){
			treeNode = treeNode.getParentNode();
			if (!treeNode){
				ui.tree.init();return;
			}
		}
		zTree.reAsyncChildNodes(treeNode, "refresh");
	};
	var refreshFav = function(){
		refreshPath(G.KOD_USER_FAV);
		ui.f5();
	}
	var refreshGroup = function(){
		refreshFav();
		refreshPath(G.KOD_GROUP_ROOT_SELF);
		refreshPath(G.KOD_GROUP_ROOT_ALL);
	}
	var refreshPath = function(path){
		var treeNode = zTree.getNodesByParam("path",path, null);
		refresh(treeNode[0]);
	}
	var f5Refresh = function(){//树目录变化后，对应刷新文件目录
		if (Config.pageApp == 'explorer') {
			ui.f5();
		}
	};

	//对外接口
	return {
		treeOpenHistory:treeOpenHistory,
		pathOpen:pathOpen,
		treeDataSort:treeDataSort,
		init:init,
		refresh:refresh,
		refreshPath:refreshPath,
		refreshFav:refreshFav,
		refreshGroup:refreshGroup,
		zTree:function(){return zTree;},
		openEditor:function(){pathOpen.openEditor(makeParam().path);},
		openWindow:function(){pathOpen.openWindow(makeParam().path);},
		share:function(){pathOperate.share(makeParam());},
		download:function(){
			if (makeParam().type == 'folder') {
				pathOperate.zipDownload(makeParam(true));
			}else{
				pathOpen.download(makeParam().path);
			}
		},
		setSelect:function(path){
			//和当前相同则不处理
			if (!zTree) return;
			var currents = zTree.getSelectedNodes();
			if( $.isArray(currents) && 
				currents.length==1 && 
				trim(currents[0].path,'/') == trim(path,'/') ){
				return;
			}

			var node = zTree.getNodesByFilter(function(treeNode){
				if(trim(treeNode.path,'/')== trim(path,'/')){
					return true
				}else{
					return false
				}
			},true);
			if(node){
				zTree.selectNode(node,false);
			}
		},
		open:function(){
			if ($('.dialog_path_remove').length>=1) return;
			var p=makeParam();
			if (p.type == 'oexe'){
				p.path = p.node;
			}
			pathOpen.open(p.path,p.type);
		},
		fav:function(){
			var p=makeParam();
			p.name = p.node.name;

			p.node = "null";
			pathOperate.fav(p);
		},
		createLink:function(atCurrent){
			var p = makeParam();
			pathOperate.createLink(p.path,p.node.name,p.type,atCurrent,f5Refresh);
		},
		search:function(){core.search('',makeParam().path);},
		appEdit:function(){
			var p=makeParam();
			var data = p.node;data.path = p.path;
			pathOperate.appEdit(data,function(){
			refresh(p.node.getParentNode());
		});},

		//operate
		info:function(){pathOperate.info(makeParam(true));},
		copy:function(){pathOperate.copy(makeParam(true));},
		cute:function(){pathOperate.cute(makeParam(true));},
		copyTo:function(){
			core.api.pathSelect(
				{type:'folder',title:LNG.copy_to},
				function(path){
				pathOperate.copyDrag(makeParam(true),path,'',false);
			});
		},
		cuteTo:function(){
			core.api.pathSelect(
				{type:'folder',title:LNG.cute_to},
				function(path){
				pathOperate.cuteDrag(makeParam(true),path,function(){
					refreshPath();
				});
			});
		},
		favRemove:function(name){
			pathOperate.favRemove(makeParam().node.name,function(data){
				Tips.tips(data);
				refreshFav();
			});
		},
		past:function(){
			var param = makeParam();
			if (!param.node.isParent) param.node = param.node.getParentNode();
			pathOperate.past(param.path,function(){
				f5Refresh();
				refresh(param.node);
			},param.fileid);
		},
		clone:function(){
			var param = makeParam();
			if (!param.node.isParent) param.node = param.node.getParentNode();

			pathOperate.copyDrag(makeParam(true),core.pathFather(param.path),function(){
				f5Refresh();
				if(param.type=='folder'){
					refresh(param.node.getParentNode());
				}else{
					refresh(param.node);
				}
			},true);//自动重命名
		},
		remove:function(){
			var param  = makeParam(true);
			var parent = param[0].node.getParentNode();

			param[0].type = param[0].node.type;//file/folder;
			param[0].type = param[0].type=='folder'?'folder':'file';
			pathOperate.remove(param,function(){
				f5Refresh();
				refresh(parent);
			});
		},
		checkIfChange:function(explorer_path){//目录变更后自动更新节点
			if (isUpdateRefresh) return;
			isUpdateRefresh = true;
			if (!zTree) return;
			zTree.getNodesByFilter(function(treeNode){
				var path = treeNode.path;
				if( treeNode.type == 'folder' &&
					core.pathClear(path) == core.pathClear(explorer_path)){
					refresh(treeNode);
				}
				return false;
			},true);
			setTimeout(function(){
				isUpdateRefresh = false;
			},500);
		},
		explorer:function(){
			var sel = zTree.getSelectedNodes();
			if (sel.length<=0){//没有选中则先默认选中第一个
				var node = zTree.getNodes();
				zTree.selectNode(node[0]);
			}
			var path = makeParam().path;
			if(makeParam().type!='folder'){//editor 选中了文件
				path = core.pathFather(path);
			}
			core.explorer(path);
		},
		openProject:function(){
			core.explorerCode(makeParam().path);
		},
		// 创建节点 让元素进入编辑状态(编辑、新建)。保存动作在ztree的onRename回调函数中
		create:function(type){//type ='file' 'folder'
			var sel = zTree.getSelectedNodes();
			if (sel.length<=0){//工具栏新建文件（夹）
				var node = zTree.getNodes();
				zTree.selectNode(node[0]);
			}else if(sel[0].type=='file'){
				zTree.selectNode(sel[0].getParentNode());
			}

			var	param = makeParam(),
				treeNode = param.node,
				parent = treeNode.getParentNode(),
				file="newfile",i=0,
				folder=LNG.newfolder;
			if (type=='folder') {
				while(zTree.getNodesByParam('name',folder+'('+i+')',parent).length>0){
					i++;
				}
				newNode = {name:folder+'('+i+')','ext':'',type:'folder',create:true,path:param.path};
			}else{
				var type_ext = type;
				while(zTree.getNodesByParam('name',file+'('+i+').'+type_ext,parent).length>0){
					i++;
				}
				newNode = {name:file+'('+i+').'+type_ext,'ext':type_ext,type:'file',create:true,path:param.path};
			}
			if(treeNode.children != undefined){//已展开
				var treeNodeNew = zTree.addNodes(treeNode,newNode)[0];
				zTree.editName(treeNodeNew);
			}else{//新建文件&文件夹
				if (treeNode.type != 'folder') treeNode = treeNode.getParentNode();
				successCallback = function(){
					var treeNodeNew = zTree.addNodes(treeNode,newNode)[0];
					zTree.editName(treeNodeNew);
				}
				if(!treeNode.isParent){//没有子文件&文件夹
					successCallback();
				}else{
					zTree.expandNode(treeNode);
				}
			}
		},
		//分享文件的展示
		showFile:function(){
			var url = './index.php?share/file&sid='+G.sid+'&user='+G.user+'&path='+makeParam().path;
			window.open(url);
		},
		rname:function(){
			var treeNode = zTree.getSelectedNodes()[0],newNode;
			zTree.editName(treeNode);
			treeNode.beforeName = treeNode.name;
		}
	}
});

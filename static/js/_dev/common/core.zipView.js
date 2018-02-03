define(function(require, exports) {
	return function(path){
		var zTreeList;
		var setting={
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


					var info = '<span class="time">'+date(LNG.time_type,treeNode.mtime)+'</span>';
					info += '<span class="size">'+core.fileSize(treeNode.size)+'</span>';
					info += '<span class="menu_more icon-ellipsis-vertical"></span>';
					$("#" + treeNode.tId + "_span").after(info);

					switchObj.parent().addClass(treeNode.menuType);
				}
			},
			callback: {//事件处理回调函数
				onClick: function(event,treeId,treeNode){
					if($(event.target).hasClass('menu_more')){
						return;
					}
					zTreeList.selectNode(treeNode);
					pathInfoNode(treeNode);
					if(treeNode.type=='folder'){
						$("#"+treeNode.tId+'_switch').click();
					}
				},
				onCollapse: function(event,treeId,treeNode){
					resetOdd(treeId);					
				},
				onExpand: function(event,treeId,treeNode){
					resetOdd(treeId);
				},
				beforeRightClick:function(treeId, treeNode){
					if(!treeNode) return;
					pathInfoNode(treeNode);
					zTreeList.selectNode(treeNode);
				},
				onDblClick:function(event,treeId,treeNode){
					if($(event.target).hasClass('.menu_more')){
						return;
					}
					if(treeNode.type == 'file'){
						menuAction('open',zTreeList);
					}
				}
			}
		};

		var makeTree = function(theList){
			var clearCell = function(tree){
				for(var i=0;i<tree.length;i++) {
					if(tree[i] == undefined){
						delete(tree[i]);continue;
					}
					var item = tree[i];
					tree[i] = {
						name:core.pathThis(item['filename']),
						path:item['filename'],
						isParent:!!(item['child']),
						type:item['folder']?'folder':'file',
						menuType:item['folder']?'menuZipListFolder':'menuZipListFile',
						ext:core.pathExt(item['filename']),
						mtime:item['mtime'],
						index:item['index'],
						size:item['size'],
						child:item['child']
					}
					if(item['folder']){
						delete(tree[i]['ext']);
					}

					if(tree[i]['child']){
						tree[i]['children'] = tree[i]['child'];
						delete(tree[i]['child']);
						clearCell(tree[i]['children']);
					}else{
						delete(tree[i]['child']);
					}
				}
			}

			var items = {};
			for (var i = 0; i < theList.length; i++) {
				if( typeof(theList[i]['filename']) != 'string' && 
					theList[i]['stored_filename']){
					theList[i]['filename'] = theList[i]['stored_filename'];
				}
				if(typeof(theList[i]['filename']) != 'string'){
					continue;
				}
				theList[i]['filename'] = theList[i]['filename'].replace(/\\/g,'/');
				items[theList[i]['filename']] = theList[i];
			}
			
			
			//没有目录结构则补足.
			for (var key in items) {
				if(!items[key]['folder']){
					var path = core.pathFather(items[key]['filename']);
					while( (path != '' && path != '/') && 
							!items[path] &&
							!items[rtrim(path,'/')]
						){
						items[path] = {
							filename:path,
							folder:true,
							mitme:0,
							size:0,
							index:-1
						}
						path = core.pathFather(path);
					}
				}
			}

			var tree = [];
			for(var key in items){
				var cell = items[key];
				var parent_key = core.pathFather(cell['filename']);

				if(items[parent_key]) parent_key = core.pathFather(cell['filename']);
				if(items[rtrim(parent_key,'/')]) parent_key = rtrim(parent_key,'/');
				if (items[parent_key]){
					if(!items[parent_key]['child']){
						items[parent_key]['child'] = [];
					}
					items[parent_key]['child'].push(items[cell['filename']]);
				}else{
					var temp = items[cell['filename']];
					if(temp){
						tree.push(temp);
					}
				}
			}
			clearCell(tree);
			return tree;
		}

		var bindMenu = function(){
			$.contextMenu({
				selector:'.menuZipListFolder',
				className:'menuZipListFolder',
				zIndex:9999,
				callback: function(key, options) {menuAction(key);},
				items: {
					"unzip_this":{name:LNG.unzip_this,className:"unzip_this",icon:"external-link"},
					"unzip_to":{name:LNG.unzip_to,className:"unzip_to",icon:"external-link"},
					"sep1":"--------",
					"info":{name:LNG.info,className:"info",icon:"info",accesskey: "i"}
				}
			});
			$.contextMenu({
				selector:'.menuZipListFile',
				className:'menuZipListFile',
				zIndex:9999,
				callback: function(key, options) {menuAction(key);},
				items: {
					"open":{name:LNG.open,className:"open",icon:"external-link",accesskey: "o"},
					"down":{name:LNG.download,className:"down",icon:"cloud-download",accesskey: "x"},
					"sep1":"--------",
					"unzip_this":{name:LNG.unzip_this,className:"unzip_this",icon:"external-link"},
					"unzip_to":{name:LNG.unzip_to,className:"unzip_to",icon:"external-link"},
					"sep2":"--------",
					"info":{name:LNG.info,className:"info",icon:"info",accesskey: "i"}
				}
			});


			$('.menuZipListFile .menu_more,.menuZipListFolder .menu_more')
				.die('click').live('click', function(e) {
				var offset = $(this).offset();
				offset.top  += $(this).outerHeight();
				$(this).contextMenu({x:e.pageX,y:offset.top});
			});
		};
		var menuAction = function(key, zTree){
			if(zTree == undefined){
				var $tree = $(".context-menu-active").parents('.ztree');
				if( $tree.length == 0) return;
				zTree = $.fn.zTree.getZTreeObj($tree.attr('id'));
			}
			var treeNode = zTree.getSelectedNodes()[0];
			switch(key){
				case 'open':zipFileOpen(zTree,treeNode);break;
				case 'down':zipFileDownload(zTree,treeNode);break;
				case 'unzip_this':zipFileUnzip(zTree,treeNode);break;
				case 'unzip_to':zipFileUnzipTo(zTree,treeNode);break;
				case 'info':pathInfo(zTree,treeNode);break;
				default:break;
			}
		}

		var folderSizeCell = {file_num:0,folder_num:0,size:0};
		var folderSize = function(node){
			if(node.type == 'folder'){
				folderSizeCell.folder_num++;
				if(node.children){
					for (var i = 0; i < node.children.length; i++) {
						folderSize(node.children[i]);
					}
				}
			}else{
				folderSizeCell.file_num++;
				folderSizeCell.size += parseInt(node.size);
			}
		}

		var zipFileDownload = function(tree,node){
			var filePath = tree.setting.filePath;
			var fileUrl  = tree.setting.fileUrl;
			var url = fileUrl+'&download=1&index='+node.index;
			ui.pathOpen.downloadUrl(url);
		}
		var zipFileOpen = function(tree,node){
			var filePath = tree.setting.filePath;
			var fileUrl  = tree.setting.fileUrl;
			var url = fileUrl+'&index='+node.index+"&name=/"+urlEncode(node.path);
			var ext = node.ext;

			//zip内的zip则不处理
			if( ext == 'zip'){
				ext = 'unknow';
			}

			//文件太大，提示解压后
			if(node.size >= 1024*1024*30){
				Tips.tips(LNG.zipview_file_big,'warning');
				ext = 'unknow';
			}
			ui.pathOpen.open(url,ext);
		}
		var zipFileUnzipTo = function(tree,node){
			core.api.pathSelect(
				{type:'folder',title:LNG.unzip_to},
				function(path){
					zipFileUnzip(tree,node,path)
				});
		}
		var zipFileUnzip = function(tree,node,unzipTo){
			var filePath = tree.setting.filePath;
			var fileUrl  = tree.setting.fileUrl;
			if(unzipTo == undefined){
				unzipTo = G.this_path;//tree
				if(unzipTo == undefined){
					unzipTo = core.pathFather(filePath);
				}
			}
			var url = './index.php?explorer/unzip';
			$.ajax({
				url:url,
				data:{
					path:filePath,
					path_to:unzipTo,
					unzip_part:node.index
				},
				type:'POST',
				dataType:'json',
				beforeSend: function(){
					Tips.loading(LNG.unziping);
				},
				error:core.ajaxError,
				success:function(data){
					Tips.close(data);
					if(Config.pageApp == "editor"){
						ui.tree.refreshPath(core.pathFather(filePath));
						return;
					}
					ui.f5(true,true,function(){
						var thePath = unzipTo+core.pathThis(node.path);
						ui.path.setSelectByFilename(thePath);
					});
				}
			});
		}

		var pathInfoNode = function(node){
			var data = pathInfoData(node);
			var html = LNG.size+" "+data.size_friendly+' ('+data.size+' Byte)';
			if(node.type =='folder'){
				html = data.file_num +LNG.file+','+data.folder_num +LNG.folder+', '+html
			}
			$('#'+node.tId).parents('.zipViewContent').find('.bottom .info').html(html);
		}

		var pathInfoData = function(node){
			var data = {
				name:node.name,
				path:node.path,
				size:node.size,
				size_friendly:core.fileSize(node.size),
				mtime:date(LNG.time_type_info,node.mtime)
			}
			if(node.level == 0){
				data.path = data.name;
			}

			if(node.type == 'folder'){
				folderSizeCell = {file_num:0,folder_num:0,size:0};
				folderSize(node);
				$.extend(data,folderSizeCell);
				data.size_friendly = core.fileSize(data.size);
			}
			return data;
		}

		var pathInfo = function(zTree,node){
			var icoType = (node.type =='folder')?'folder':core.pathExt(node.path);
			var tplFile = (node.type =='folder')?tpl_path_info:tpl_file_info;	
			var render = template.compile(tplFile);
			var data = pathInfoData(node);
			data.LNG = LNG;

			var dialog = $.dialog({
				id:UUID(),
				padding:5,
				ico:core.iconSmall(icoType),
				fixed: true,//不跟随页面滚动
				title:core.pathThis(node.path),
				content:render(data),
				ok: true
			});
		}


		var initView = function(treeID,title){
			var render = template.compile(tpl_zipview);
			var html = render({LNG:LNG,treeID:treeID});
			var dialog = $.dialog({
				'className':'zipViewDialog',
				ico:core.icon('zip'),
				title:title,
				width:550,
				height:420,
				content:html,
				resize:true,
				padding:0,
				fixed:true
			});

			var offset = 15 * $('.zipViewContent').length;
			dialog.DOM.wrap.css({
				'left':"+="+offset+"px",
				'top' :"+="+offset+"px"
			});
		}


		var resetOdd = function(treeID){
			$("#"+treeID).find('ul:visible > li > a').each(function(index){
				$(this).removeClass('odd');
				if(index % 2 == 0){
					$(this).addClass('odd');
				}
			});
		}

		var initData = function(title,data){
			var treeData = makeTree(data);
			var treeID   = 'folderListZip'+UUID();

			treeData = ui.tree.treeDataSort(treeData);
			initView(treeID,title);
			bindMenu();

			treeData = {//根目录
				name:title,
				ext:'zip',
				mtime:'',
				isParent:true,
				open:true,
				children:treeData,
				type:'folder',
				path:'',
				index:'-1',
				menuType:'menuZipListFolder'
			}
			$.fn.zTree.init($("#"+treeID),setting,treeData);
			zTreeList = $.fn.zTree.getZTreeObj(treeID);
			resetOdd(treeID);
			pathInfoNode(zTreeList.getNodeByParam("index",'-1',null));
		}

		var init = function(path){
			var fileUrl = 'explorer/unzipList&access_token='+G.access_token+'&path='+urlEncode(path);
			if (typeof(G['share_page']) != 'undefined') {
				fileUrl = 'share/unzipList&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(path);

				//共享暂不支持预览
				ui.pathOpen.openUnknow(path);
				return;
			}
			fileUrl = G.app_host+'index.php?'+fileUrl;
			$.ajax({
				url:fileUrl,
				dataType:'json',
				beforeSend: function(){
					Tips.loading(LNG.loading);
				},
				error:core.ajaxError,
				success:function(data){
					Tips.close(data);
					if(data.code){
						initData(core.pathThis(path),data.data);
						zTreeList.setting.filePath = path;
						zTreeList.setting.fileUrl  = fileUrl;
					}else{//预览失败
						ui.pathOpen.openUnknow(path,data.data);
					}
				}
			});
		}
		init(path);
	}
});


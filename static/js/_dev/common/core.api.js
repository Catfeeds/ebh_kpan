define(function(require, exports) {
	var hookPathSelect = function(config,top,dialog){
		var $dialog = $(dialog.DOM.wrap);
		var space   = top.frames["OpenpathSelectApi"];
		var insertHtml = '<input type="text" class="path_select_input" readonly="true" disabled="true" />';
		if(config.type == 'file'){
			insertHtml += '<span class="label label-primary">'+config.allowExt+'</span>';
		}
		$(insertHtml).insertBefore($dialog.find('.aui_state_highlight'));

		var fileAllow = function(path){
			var extArr = config.allowExt.split('|');
			var ext = core.pathExt(path);
			if( config.allowExt == ''|| 
				(config.allowExt !='' && $.inArray(ext, extArr) != -1) ){
				return true;
			}
			return false;
		}
		//选中发生变更
		var selectChanged = function(){
			var $listSelect = space.ui.fileLight.fileListSelect();
			var list = [];
			if(config.single){ // 单个选择
				var $sel = $($listSelect.get(0));
				if(config.type == 'all' && $listSelect.length == 0 ){//都允许时选中不能为空
					list = {file:[],folder:[]};
				}else if(config.type == 'file' && $listSelect.length == 0){//选择文件，必须有文件
					list = [];
				}else if(config.type == 'folder'){
					list = [space.G.this_path];
					if($sel.hasClass("folderBox")){
						list = [space.ui.fileLight.path($sel)];
					}
				}else if(config.type == 'file'){
					if($sel.hasClass("fileBox")){
						var path = space.ui.fileLight.path($sel);
						if( fileAllow(path)){
							list = [path];
						}
					}
				}else if(config.type == 'all'){//all
					if($sel.hasClass("folderBox")){
						var path = space.ui.fileLight.path($sel);
						list = [{file:[],folder:[path]}];
					}else if($sel.hasClass("fileBox")){
						var path = space.ui.fileLight.path($sel);
						if( fileAllow(path)){
							list = {file:[path],folder:[]};
						}						
					}
				}
			}else{
				var fileArr = [],folderArr = [];
				$listSelect.each(function(){
					if($(this).hasClass("fileBox")){
						var path = space.ui.fileLight.path($(this));
						if( fileAllow(path)){
							fileArr.push(path);
						}
					}else if($(this).hasClass("folderBox")){
						folderArr.push(space.ui.fileLight.path($(this)));
					}
				});
				if(config.type == 'folder'){
					list = folderArr;
				}else if(config.type == 'file'){
					list = fileArr;
				}else if(config.type == 'all'){
					list = {file:fileArr,folder:folderArr};
				}
			}
			updateStatus(list);
		}

		//虚拟目录不允许操作
		var allowSelect = function(path){
			var path = trim(path,'/');
			if( path == G.KOD_GROUP_ROOT_SELF ||
				path == G.KOD_GROUP_ROOT_ALL ||
				path == G.KOD_USER_FAV ||
				path == G.KOD_USER_SHARE){
				return false;
			}
			return true;
		}
		//更新对话框状态
		var updateStatus = function(list){
			var $input = $dialog.find('.path_select_input');
			var $ok = $dialog.find('.aui_state_highlight');
			if(config.type != 'all'){
				var new_list = [];
				for (var i = 0; i < list.length; i++) {
					if(allowSelect(list[i])){
						new_list.push(list[i]);
					}
				}
				list = new_list;
			}
			
			if( list.length == 0 || 
				(config.type == 'all' && list.file.length==0 && list.folder.length==0) ){
				$ok.addClass('disable');
				$input.attr("result",'');
				$input.val("");
			}else{
				var param = hashEncode(jsonEncode(list));
				var display = "";
				if(config.single){//单个
					display = space.core.pathThis(list[0]);
				}else{
					var items = list;
					if(config.type == 'all'){
						items = list.folder.concat(list.file);
					}
					$.each(items,function(i,val){
						display += space.core.pathThis(val) + ", ";
					});
				}
				$ok.removeClass('disable');
				$input.attr("result",param);
				$input.val(display);
			}
		};
		var hookSelect = function(){
			space.ui.fileLight.select.hook("select",space.ui.fileLight,{
				before:function(){},
				after:function(){
					selectChanged();
				}
			});
		}
		if(!space.kodReady){
			space.kodReady = [];
		}
		space.kodReady.push(function(){
			hookSelect();
			selectChanged();
		});	
	}

	return {		
		//文件，文件夹选择；
		pathSelect:function(config,callback){
			var defaults = {
				type:'file',						//选择类型；file|folder|all
				title:LNG.path_api_select_file,		//标题文字
				single:true,						//是否单个 mutil
				allowExt:'',						//类型为文件时；此配置生效; 多个用|隔开； png|jpg|bmp|gif
				firstPath:false						//首次进入目录
			}
			var the_url = './index.php?/explorer&type=iframe';
			config = $.extend(defaults, config);
			if(config.firstPath){
				the_url += "&path="+config.firstPath;
			}
			var top = ShareData.frameTop();
			var dialog = top.$.dialog.open(the_url,{
				id:"pathSelectApi",
				resize:true,
				fixed:true,
				ico:core.icon('folder'),
				title:config.title,
				lock:true,
				background:"#000",
				opacity:0.1,
				width:840,
				height:420,
				ok:function() {
					if (typeof(callback) == 'function'){
						var dom = dialog.DOM.wrap;
						var result = dom.find('.path_select_input').attr('result');
						result = jsonDecode(hashDecode(result));
						if(result){
							if(config.single && config.type != 'all'){//单个或都允许时
								callback(result[0]);
							}else{
								callback(result);
							}
						}else{
							Tips.tips(LNG.error,false);
						}
					}
				},
				cancel: true
			});
			hookPathSelect(config,top,dialog);
		},
		randomImage:function(callback){
			$.getJSON("//kalcaddle.com/tools/version/?wallpage/index&lang="+G.lang+"&callback=?",function(result) {
				if (typeof(callback) == 'function'){
					callback(result);
				}
			});
		}
	};
});


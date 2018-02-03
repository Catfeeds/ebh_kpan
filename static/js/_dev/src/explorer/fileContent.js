define(function(require, exports) {
	var myPicasa    = new Picasa();
	var tpl = require('./tpl/file_list_make.html');//模板tpl
	var pageLoadMax = 200;	//分页加载数量最小值，分页时首次加载数量

	//ajax后重置数据、重新绑定事件(f5或者list更换后重新绑定)
	var ajaxLive = function(){
		ui.fileLight.init();
		if(Config.pageApp == 'desktop'){
			ui.resetDesktopIcon();
		}
		if(G.user_config.list_type == "list_split"){
			ui.fileListResize.bindSplitResize();
		}
		lazyLoadImage();
	}
	var lazyLoadImage = function(){
		//图片缩略图懒加载 桌面不做处理	
		var $container = $(".bodymain");
		if(G.user_config.list_type == "list_split"){
			//$container = $(".split_box .content");
			$container = $(".split_box").last().find(".content");//
		}
		$container.find(".lazyload_ready").lazyload({
			failure_limit : 10,
			threshold: 200,
			placeholder : G.static_path + 'images/common/loading_circle.gif',
			skip_invisible:false,
			effect : "fadeIn",
			container:$container,
			load:function(elements, settings) {
				$(this).removeClass('lazyload_ready');
			}
		}).on('error',function(){//加载失败；再次尝试加载图片
			var error_reload = $(this).data('error_reload');
			if(!error_reload){
				$(this).attr('src',$(this).attr('src')+'#'+UUID());
				$(this).data('error_reload','reload')
			}
		});
	}


	//json 排序 filed:(string)排序字段，orderby:升降序。升序为-1，降序为1
	var sortBy = function(filed,orderby) {
		var orderby = (orderby=='down')? -1 : 1;
		return function (a, b) {
			var a = a[filed];
			var b = b[filed];
			return ui.path.pathOperate.strSort(a,b)*orderby;//字符串比较；优化排序
		}
	}
	//文件列表数据填充
	var mainSetData = function(isFade){
		var html = makeHtml(G.json_data,0,getPageNumber()-1);//默认100 太多则分页加载
		if(Config.pageApp=='desktop'){//Config.PageApp
			var system = '';//系统应用
			$('.systemBox').each(function(){
				system += $(this).get(0).outerHTML;
			});
			html = system + html;
		}

		html = htmlListAction(G.json_data,html,false);
		if(G.user_config.list_type == 'list_split'){
			html = '<div class="split_box" data-path="'+pathHashEncode(G.this_path)+'"><div class="content">'+html+'<div class="content_more"></div> </div><div class="split_drag"></div></div>';
		}
		//填充到dom中-----------------------------------
		if (isFade){//动画显示,
			$(Config.FileBoxSelector)
				.hide().html(html)
				.fadeIn(Config.AnimateTime);
		}else{
			$(Config.FileBoxSelector).html(html);
		}
		//绑定数据
		if(G.user_config.list_type == 'list_split'){
			$(".split_box").data('jsonData',G.json_data);//绑定数据
		}
		ajaxLive();
	};

	var scrollDelayTimer = '';
	var bindScrollLoadMore = function(){
		var $content = $(".bodymain");
		$content.scroll(function(){
			clearTimeout(scrollDelayTimer);scrollDelayTimer=false;
			scrollDelayTimer = setTimeout(function(){
				if($content.scrollTop()==0){//首次加载不处理
					return;
				}
				loadMore();
			},100);
		});

		//split 超出个数时提示切换到list模式
		$('.splitLoadMore').live('dblclick',function(){
			$('#set_list').click();
		});
	}

	var getPageNumber = function(){
		var $last = ui.fileLight.fileListAll().last();
		var $makeHeight = $('.bodymain .fileContinerMore');
		if($last.length==0) {//初始化
			return pageLoadMax;
		}
		var totalNum = G.json_data['folderlist'].length+G.json_data['filelist'].length;
		$makeHeight.css('top',0);
		if(totalNum<pageLoadMax || G.user_config.list_type == 'list_split'){
			return pageLoadMax;
		}
		var $last = ui.fileLight.fileListAll().last();
		var file_width= $last.outerWidth()+$sizeInt($last.css('margin-right'))+3.5;//file左右的间隙
		var row_num = parseInt($(".fileContiner").width()/file_width);
		if(G.user_config.list_type != 'icon'){
			row_num = 1;
		}
		var file_height= $last.outerHeight()+$sizeInt($last.css('margin-bottom'));
		var col_num = Math.ceil($(Config.BodyContent).height()/file_height);
		var mainHeight = Math.ceil(totalNum/row_num)*file_height;
		$makeHeight.css('top',mainHeight);
		return col_num*row_num;
	}
	var resetTotalHeight = function(){
		var sel = ".bodymain .fileContiner > .file";
		var $last = $(sel).last();
		var $makeHeight = $('.bodymain .fileContinerMore');
		if($last.length==0) {
			return;
		}
		var totalNum = G.json_data['folderlist'].length+G.json_data['filelist'].length;
		$makeHeight.css('top',0);
		if(totalNum<pageLoadMax || G.user_config.list_type == 'list_split'){
			return;
		}
		var file_width= $last.outerWidth()+$sizeInt($last.css('margin-right'));
		var row_num = parseInt($(".fileContiner").width()/file_width);
		if(G.user_config.list_type != 'icon'){
			row_num = 1;
		}
		var file_height= $last.outerHeight()+$sizeInt($last.css('margin-bottom'));
		var col_num = Math.ceil($(Config.BodyContent).height()/file_height);
		var mainHeight = Math.ceil(totalNum/row_num)*file_height;
		$makeHeight.css('top',mainHeight);
	}

	var loadMoreDelayTimer;
	var loadMore = function(){
		//console.log('loadMore start');
		var $listAll = $(".bodymain .fileContiner > .file");
		var $last = $listAll.last();
		var lastIndex = $listAll.length-1;
		var totalNum = G.json_data['folderlist'].length+G.json_data['filelist'].length;
		if(lastIndex>=totalNum-1 || G.user_config.list_type == 'list_split'){
			//console.log('more return',lastIndex,totalNum);
			return;
		}
		
		var scollerTop		 = $(".bodymain").scrollTop();
		var fileBoxHeight	 = $('.bodymain').height();
		var fileBoxOffsetTop = $(".bodymain").offset().top;
		var fileBoxTop  	 = $(".fileContiner").offset().top;
		var file_height= $last.outerHeight()+$sizeInt($last.css('margin-bottom'));
		var needLastOffset = fileBoxOffsetTop + fileBoxHeight - file_height;
		if($last.offset().top<needLastOffset){
			var emptyHeight = needLastOffset - $last.offset().top;
			var pageFileNum = getPageNumber();
			var pageLoad = Math.ceil(emptyHeight/fileBoxHeight);
			var fileLastIndex = pageLoad*pageFileNum+lastIndex;//待载入的文件数
			if(fileLastIndex>totalNum){
				fileLastIndex = totalNum;
			}
			if(fileLastIndex-lastIndex>1000){
				$(".init_loading").show();
				clearTimeout(loadMoreDelayTimer);
				loadMoreDelayTimer = setTimeout(function(){
					loadMoreSet(lastIndex+1,fileLastIndex);
					$(".bodymain").scrollTop(scollerTop);
				},300);
			}else{
				loadMoreSet(lastIndex+1,fileLastIndex);
			}
		}else{
			//console.log('loadMore null');
		}
	}
	var loadMoreSet = function(from,to){
		//console.log("load more",from,to);
		var html = makeHtml(G.json_data,from,to);
		var $dom = $(html);
		$dom.appendTo('.fileContiner');
		ui.fileLight.fileListAll($(Config.FileBoxClass));
		ui.fileLight.menuAction('clear');
		lazyLoadImage();
		$(".init_loading").hide();
	}

	var makeHtml = function(jsonData,from,toIndex){
		var render = template.compile(tpl);
		var html='';
		//end排序方式重组json数据------
		//升序时，都是文件夹在上，文件在下，各自按照字段排序
		var arr = [];
		if (G.user_config.list_sort_order=='up'){
			arr = jsonData['folderlist'].concat(jsonData['filelist']);
		}else{
			arr = jsonData['filelist'].concat(jsonData['folderlist']);
		}
		if(!toIndex || toIndex>=arr.length-1){
			toIndex = arr.length-1;
		}
		for (var i=from;i<=toIndex;i++){
			var fileType = arr[i]['type']=='folder'?'_folder':'_file';
			var assign ={
				LNG:LNG,
				G:G,list:arr[i],
				index:i,
				type:G.user_config.list_type+fileType
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
		return html;
	}

	//目录展开处理
	var pathChildrenTree = function(path,callback){
		if($.type(path) == 'string'){
			var $file = $('.file[data-path="'+pathHashEncode(path)+'"]');
		}else{
			var $file = path;
			path = ui.fileLight.path($file);
		}
		if($file.length!=1){
			return;
		}
		var $cert_box = $file.find('.children_more');
		var $cert = $file.find('.children_more_cert');
		var $file_box  = $('.children_list[data-path-children="'+pathHashEncode(path)+'"]');
		var cert_width = 23;
		$cert.toggleClass('cert_open');
		$file_box.toggleClass('hidden');
		if($file_box.hasClass('child_aredy_init')){
			pathListOdd();
			return;
		}
		$file.addClass('loading_children');
		pathGet(path,function(data){
			$file.removeClass('loading_children');
			var html = makeHtml(data,0,getPageNumber()-1);//分页加载
			if(html!=''){
				html = htmlListAction(data,html,true);
			}			
			$file_box.html(html);
			ajaxLive();
			//调整奇偶行
			$file_box.addClass('child_aredy_init');
			var padding_left = cert_width+parseInt($cert_box.css('padding-left'));
			$file_box.find('.file .children_more').css('padding-left',padding_left);
			pathListOdd();
			if (typeof(callback) == 'function'){
				callback(data);
			}
		});
	}

	var htmlListAction = function(data,html,loadAllTips){
		//if (html =='') {
		//	html = '<div style="text-align:center;color:#aaa;">'+LNG.path_null+'</div>';
		//	return html;
		//}
		var arr = data['folderlist'].concat(data['filelist']);
		if(arr.length>pageLoadMax){//展开子目录，分页加载处理
			var path = core.pathFather(arr[0]['path']);
			if(G.user_config.list_type == 'list' && loadAllTips){   //
				html += '<div data-path-children="'+pathHashEncode(path)+'" class="file folderBox" data-size="0">'+
							'<div class="filename" style="width: 424px;">'+
								'<span class="children_more"></span>'+
								'<div class="ico" filetype="folder"><i class="icon-plus-sign"></i></div>'+
								'<span class="title">'+LNG.file_load_all+'</span>'+
							'</div>'+
						'</div>';
			}else if(G.user_config.list_type == 'list_split'){
				html += '<div data-path-children="'+pathHashEncode(path)+'" class="file folderBox splitLoadMore" data-size="0">'+
							'<div class="filename">'+
								'<div class="ico" filetype="folder"><i class="icon-plus-sign"></i></div>'+
								'<span class="title">'+LNG.file_load_all+'(to list)</span>'+
							'</div>'+
						'</div>';
			}
		}
		return html;
	}

	//基数偶数行样式设定
	var pathListOdd = function(){
		var index=0;
		ui.fileLight.fileListAll().each(function(){
			if($(this).parents('.hidden').length!=0){//收起的项内容不参与
				return;
			}
			if(index%2==0){
				$(this).addClass('file2');
			}else{
				$(this).removeClass('file2');
			}
			index++;
		});
	}

	//分栏，展开子目录
	var pathChildrenSplit = function(path,callback){
		var $file = $('.file[data-path="'+pathHashEncode(path)+'"]');
		var $split_box  = $(".fileList_list_split .split_box[data-path='"+pathHashEncode(path)+"']");
		if($file.length == 0 ) {
			if (typeof(callback) == 'function'){
				callback();
			}
			return;//不存在
		}
		if($split_box.length ==1){//已存在
			$split_box.nextAll().remove();
			if (typeof(callback) == 'function'){
				callback();
			}
			return;
		}
		var $fileBox = $file.parent().parent();
		pathSplitCreate(path,callback,$fileBox);
	}
	var pathSplitCreate = function(path,callback,$lastSplit){
		pathGet(path,function(data){
			if(data.path_read_write == "not_exists"){
				return callback(data);
			}
			var html = makeHtml(data,0,getPageNumber()-1);//分页加载
			html = htmlListAction(data,html,true);
			if(!$lastSplit){
				html = '<div class="split_box" data-path="'+pathHashEncode(path)+'"><div class="content">'+html+'<div class="content_more"></div></div><div class="split_drag"></div></div>';
				$(html).appendTo('.fileList_list_split').data('jsonData',data);//绑定数据
			}else if($lastSplit.nextAll('.split_box').length>0){//已经有则不清空下一个，避免闪烁
				var next = $lastSplit.next('.split_box');
				next.attr('data-path',pathHashEncode(path)).find('.content').html(html);
				next.nextAll().remove();
			}else{
				html = '<div class="split_box" data-path="'+pathHashEncode(path)+'"><div class="content">'+html+'<div class="content_more"></div></div><div class="split_drag"></div></div>';
				$(html).insertAfter($lastSplit).data('jsonData',data);//绑定数据
			}
			ajaxLive();
			if (typeof(callback) == 'function'){
				callback();
			}
		});
	}


	//刷新展开记录
	var beforeSelectFileArr = {};	//选中的文件
	var beforeListOpenArr = {};		//列表树目录及分栏展开的子目录；处理前
	var beforeListOpen = {};		//列表树目录及分栏展开的子目录；处理后
	var beforeListSplitSelect = '';	//split分栏最后选中的列
	var beforeScrollerLeft = 0;
	var f5Before = function(){
		if( G.user_config.list_type == 'icon' ||
			beforeListOpenArr.length>0){
			return;
		}
		beforeListOpenArr = {};
		beforeListOpen = {};
		if(G.user_config.list_type == 'list'){
			var $isParent = $(".child_aredy_init:visible");
			if($isParent.length<1){
				return;
			}
			$isParent.each(function(){
				var $that = $(this);
				var treeParent = beforeListOpenArr;
				var path = ui.fileLight.path($that,'data-path-children');
				beforeListOpen[path] = false;

				//回溯找到parent
				var arrIndex = [path];
				while($that.parents(".children_list").length!=0){
					$that = $that.parents(".children_list");
					arrIndex.push(ui.fileLight.path($that,'data-path-children'));
				}
				for (var i = arrIndex.length-1; i >=0; i--) {
					var key = arrIndex[i];
					if(typeof(treeParent[key]) != 'undefined'){
						treeParent = treeParent[key];
					}else{
						treeParent[key] = {};
					}
				}
			});
		}else if(G.user_config.list_type == 'list_split'){
			var treeParent = beforeListOpenArr;
			beforeScrollerLeft = $(".html5_drag_upload_box").scrollLeft();
			beforeListSplitSelect = ui.fileLight.path($('.fileList_list_split .split_box.split_select'));
			$('.fileContiner .split_box').each(function(){
				var key = ui.fileLight.path($(this));
				if(key != ""){
					treeParent[key] = {};
					treeParent = treeParent[key];
					beforeListOpen[key] = false;
				}
			});
		}
	}

	var f5After = function(callback){
		if( G.user_config.list_type == 'icon' || 
			Object.keys(beforeListOpenArr).length==0){
			f5AfterReloadFinished(callback);
			return;
		}
		if(G.user_config.list_type == 'list_split'){
			$(".fileList_list_split .split_box").remove();
		}
		f5AfterReload(beforeListOpenArr,callback);
	}
	var f5AfterReload = function(list,callback){
		$.each(list,function(key,value){
			var action = pathChildrenTree;
			if(G.user_config.list_type == 'list_split'){//展开树目录
				action = pathSplitCreate;
			}
			action(key,function(){
				beforeListOpen[key] = true;
				if(Object.keys(value).length!=0){
					f5AfterReload(value,callback);
				}else{
					f5AfterReloadFinished(callback);
				}
			});
		});
		f5AfterReloadFinished(callback);
	}

	//全部加载完成
	var f5AfterReloadFinished = function(callback){
		//console.log('load-refresh-finished:',beforeListOpen)
		for(var key in beforeListOpen){
			if(beforeListOpen[key] === false){//没有加载完
				return;
			}
		}

		$(".html5_drag_upload_box").scrollLeft(beforeScrollerLeft);
		ui.path.setSelectByFilename(beforeSelectFileArr);//不刷新数据的话，保持上次选中
		ui.fileSelect.selectSplit(beforeListSplitSelect);//分栏选中
		beforeListOpenArr = {};
		beforeListOpen = {};
		beforeSelectFileArr = {};
		beforeListSplitSelect = '';
		if (typeof(callback) == 'function'){
			callback();
		}
	}

	var f5 = function(fromServer,isAnimate,callback) {
		if(fromServer == undefined) fromServer = true; //默认每次从服务器取数据
		if(isAnimate == undefined)	isAnimate = false;	   //默认不用渐变动画
		jsonDataSortTitle();//更新列表排序方式dom
		f5Before();
		beforeSelectFileArr = ui.fileLight.getAllName();//获取选中的文件名
		if(!fromServer){//采用当前数据刷新,用于显示模式更换
			G.json_data = jsonDataSort(G.json_data);
			mainSetData(isAnimate);
			pathTypeChange(G.json_data);
			loadMore();
			resetTotalHeight();//刷新高度
			f5After(callback);
		}else{//获取服务器数据
			pathGet(G.this_path,function(data){
				G.json_data = data;
				mainSetData(isAnimate);
				pathTypeChange(G.json_data);
				loadMore();
				resetTotalHeight();//刷新高度
				f5After(callback);

				//区分页面
				if(Config.pageApp!='desktop'){
					ui.headerAddress.addressSet();//header地址栏更新
				}else{
					checkRecycle();
				}
			},function(){//error
				$(Config.FileBoxSelector).html('');
			},G.this_fileid);
		}

		//记录最后一次访问路径;桌面不记录
		if(Config.pageApp!='desktop'){
			var pre = G.user_id || G.sid;
			LocalData.set('this_path_'+pre,G.this_path);
		}
	};

	var jsonDataSort = function(jsonData){
		jsonData = jsonDatafilter(jsonData);
		var folderlist	= jsonData['folderlist'];
		var filelist	= jsonData['filelist'];
		//如果排序字段为size或ext时，文件夹排序方式按照文件名排序
		if (G.user_config.list_sort_field=='size' || G.user_config.list_sort_field=='ext' ){
			folderlist= folderlist.sort(sortBy('name',G.user_config.list_sort_order));
		}else {
			folderlist= folderlist.sort(sortBy(G.user_config.list_sort_field,G.user_config.list_sort_order));
		}
		filelist = filelist.sort(sortBy(G.user_config.list_sort_field,G.user_config.list_sort_order));
		jsonData['folderlist']=folderlist;
		jsonData['filelist']=filelist;//同步到页面数据
		return jsonData;
	}

	//加载目录;加载后做排序处理
	var pathGet = function(path,callbackSuccess,callbackError,id){
		if(G.this_path == "{user_fav}/" || G.this_path == "{group_share}/" || G.this_path == "{app}/"){
			$(".header-right").addClass("hidden");
		}else{
			$(".header-right").removeClass("hidden");
		}
		if(path == '{user_share}:null/'){
			var ajaxUrl = 'index.php?explorer/pathList&path='+urlEncode(path)+':'+ G.uid;
		}
		var ajaxUrl = 'index.php?explorer/pathList&path='+urlEncode(path)+'&fileid=' +id;
		//var ajaxUrl = 'index.php?explorer/pathList&path='+urlEncode(path)+':'+ G.uid;
		if(G.user){
			ajaxUrl = 'index.php?share/pathList&user='+G.user+'&sid='+G.sid+'&path='+urlEncode(path);
		}
		$.ajax({
			url:ajaxUrl,
			dataType:'json',
			beforeSend:function(){
				$('.tools-left .msg').stop(true,true).fadeIn(200);
			},
			success:function(data){
				$('.tools-left .msg').fadeOut(300);
				if (!data || !data.code) {
					Tips.tips(data);
					if (typeof(callbackError) == 'function'){
						callbackError();
					}
					return false;
				}
				var json_data = jsonDataSort(data.data);
				if (typeof(callbackSuccess) == 'function'){
					var folder = data.data.folderlist.length;
					var file = data.data.filelist.length;
					callbackSuccess(json_data);
					if(folder == 0 && file == 0){
						$(".none").removeClass("hidden");
					}else{
						$(".none").addClass("hidden");
					}
					
					
				}
				  
			},
			error:function(XMLHttpRequest, textStatus, errorThrown){
				$('.tools-left .msg').fadeOut(300);
				core.ajaxError(XMLHttpRequest, textStatus, errorThrown);
				if (typeof(callbackError) == 'function'){
					callbackError();
				}
			}
		});
	}

	var f5Callback = function(callback){
		f5(true,false,callback);//默认刷新数据，没有动画,成功后回调。
	};

	//分享文件夹列表
	var jsonDatafilter = function(jsonData){
		if (!jsonData) return json_data;
		if(jsonData['share_list']!=undefined){//时间处理
			self_share = jsonData['share_list'];
		}

		if(jsonData['filter_success'] === true) {
			return jsonData;
		}

		for (var key in jsonData) {
			if(key !='filelist' && key !='folderlist') continue;
			//处理文件&文件夹
			for (var i = 0; i < jsonData[key].length; i++) {
				var cell = jsonData[key][i];
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
						var info = date('Y/m/d ',cell['mtime'])/*+'  ';
						info += LNG.share_view_num+ num_view +'  '+LNG.share_download_num+num_download*/
						cell['mtime'] = info;
					}else{
						cell['mtime'] = date(LNG.time_type,cell['mtime']);
					}
				}
				cell['name'] = htmlEncode(cell['name']);
				if(cell['sid'] && cell['type'] == 'file'){
					//cell['name'] = htmlEncode(core.pathThis(cell['path']));
					cell['ext']  = htmlEncode(core.pathExt(cell['path']));
				}

				if(pathIsShare(cell['path'])){//分享标记
					cell['meta_info'] = 'path_self_share';
				}else if(pathIsFav(cell['path'])){//收藏标记；TODO
					cell['meta_info'] = 'treeFav';
				}

				if(typeof(cell['is_readable']) == 'number' && cell['is_readable']==0){
					cell['mode'] = "["+LNG.not_read+"] "+cell['mode'];
				}else if(typeof(cell['is_writeable']) == 'number' && cell['is_writeable']==1){
					cell['mode'] = "["+LNG.system_role_write+"] "+cell['mode'];
				}else if(typeof(cell['is_readable']) == 'number' && cell['is_readable']==1){
					cell['mode'] = "["+LNG.only_read+"] "+cell['mode'];
				}

				//回收站根目录
				if( jsonData['info']  &&
					jsonData['info']['path_type'] == G.KOD_USER_RECYCLE && 
					trim(jsonData['this_path'],'/') == G.KOD_USER_RECYCLE){
					cell['menuType'] = 'menuRecyclePath';
				}
			}
		}
		jsonData['filter_success'] = true;
		return jsonData;
	};

	//针对排序方式更新标题栏显示
	var jsonDataSortTitle = function(){
		var up='<i class="font-icon icon-chevron-up"></i>';
		var down='<i class="font-icon icon-chevron-down"></i>';
		$('#main_title .this')
			.toggleClass('this')
			.attr('id','')
			.find('span')
			.html("");
		$('#main_title div[field='+G.user_config.list_sort_field+']')
			.addClass('this')
			.attr('id',G.user_config.list_sort_order)
			.find('span')
			.html(eval(G.user_config.list_sort_order));
	};

	//是否为共享cellClass
	var pathIsShare = function(path){
		for(var key in G.self_share){
			if(core.pathClear(G.self_share[key]['path']) == core.pathClear(path)){
				return true;
			}
		}
		return false;
	}
	var pathIsFav = function(path){
		var favlist = G.fav_list;
		for(var key in favlist){
			if(core.pathClear(key) == core.pathClear(path)){
				return true;
			}
		}
		return false;
	}

	var checkRecycle = function(){
		//回收站检查
		$.ajax({
			url:'index.php?explorer/pathList&type=desktop&path='+G.KOD_USER_RECYCLE,
			dataType:'json',
			error:core.ajaxError,
			success:function(data){
				if (!data.code) return false;
				var image = core.icon('recycle_full');
				if (data.data.folderlist.length==0 && data.data.filelist.length==0) {
					image = core.icon('recycle');
				}
				$('.menuRecycleButton .ico').html(image);
			}
		});
	}

	//1.工具栏调整筛选【文件管理，回收站，分享根目录】对应右键菜单处理
	//2.文件管理：读写权限处理【只读，可读写】——状态处理
	//3.我在该组【您是访客，】
	//4.物理目录读写状态处理[只读，不存在]
	var pathTypeChange = function(jsonData){
		if(!jsonData['info']){
			return;//share
		}
		var info = jsonData['info'],
			kod_path_type = info['path_type'],
			path_writeable= jsonData['path_read_write'];
		var bodyClass = 'menuBodyMain menuRecycleBody menuShareBody';
		var $bodymain = $('.html5_drag_upload_box');
		
		info['can_upload'] = true;
		if( (path_writeable!=undefined && path_writeable!='writeable') ||
			(kod_path_type==G.KOD_GROUP_SHARE && info['role'] != 'owner' && G.is_root!=1)||  //不是所在的组子目录
			(kod_path_type==G.KOD_USER_SHARE && info['role'] != 'owner' && G.is_root!=1) ||  //不是自己的分享子目录
			(kod_path_type==G.KOD_GROUP_PATH && info['role']=='guest' && G.is_root!=1) ||	 //没有组写权限

			kod_path_type==G.KOD_USER_FAV ||
			kod_path_type==G.KOD_USER_RECYCLE ||
			kod_path_type==G.KOD_GROUP_ROOT_ALL ||
			kod_path_type==G.KOD_GROUP_ROOT_SELF
			){
			info['can_upload'] = false;
		}

		var system_path = [
			G.KOD_USER_SHARE,
			G.KOD_USER_FAV,
			G.KOD_GROUP_ROOT_SELF,
			G.KOD_GROUP_ROOT_ALL
		];
		//菜单处理
		if (kod_path_type==G.KOD_USER_RECYCLE) {//回收站	ok
			$bodymain.removeClass(bodyClass).addClass('menuRecycleBody');
			$('.tools-left>.btn-group')
				.addClass('hidden')
				.parent()
				.find('.kod_recycle_tool').removeClass('hidden');
		}else if (system_path.indexOf(kod_path_type) !== -1) {//系统目录
			if(core.pathClear(rtrim(G.this_path,'/')).indexOf('/') === -1){//系统虚拟目录 根目录
				$bodymain.removeClass(bodyClass).addClass('menuShareBody');
				$('.tools-left>.btn-group')
					.addClass('hidden')
					.parent()
					.find('.kod_share_tool').removeClass('hidden');
				//自己的共享根目录
				if(info['id'] == G.user_id){
					$('.menuSharePathMenu').find('.open_the_path,.share_edit,.remove').removeClass('hidden');
					$('.menuSharePathMore').find('.remove').removeClass('hidden');
				}else{
					$('.menuSharePathMenu').find('.open_the_path,.share_edit,.remove').addClass('hidden');
					$('.menuSharePathMore').find('.remove').addClass('hidden');
				}
			}else{
				$bodymain.removeClass(bodyClass).addClass('menuBodyMain');
				$('.tools-left>.btn-group')
					.addClass('hidden')
					.parent()
					.find('.kod_path_tool').removeClass('hidden');
			}
		}else{
			//还原
			$bodymain.removeClass(bodyClass).addClass('menuBodyMain');
			$('.tools-left>.btn-group')
				.addClass('hidden')
				.parent()
				.find('.kod_path_tool').removeClass('hidden');
		}
		//目录权限对应右键变化;数据请求后调用
		currentPathMenu(jsonData);
	}
	//目录权限对应右键变化;数据请求后调用
	var  currentPathMenu=function(jsonData){
		var info = jsonData['info'],
			path_read = jsonData['path_read_write'],
			kod_path_type = info['path_type'];
		var classMenu = '.createLink,.createProject,.cute,.remove,.rname,'+
						'.zip,.unzip_this,.unzip_folder,.newfile,'+
						'.newfolder,.newfileOther,.app_create,.app_install,.past,.upload,.clone';
		var theClass = "disable";//disable disabled hide
		if (info['kpan_share']) {
			//kpan共享处理
			info['can_upload'] = false;
		}
		if(info['can_upload']){
			$('ul.menufolder,ul.menuMore,ul.menufile,ul.fileContiner_menu')
				.find(classMenu).removeClass(theClass);

			$('.path_tips').hide();
			$('.kod_path_tool>button').removeClass('disabled');
		}else{
			$('.kod_path_tool>button').addClass('disabled');
			$('ul.menufolder,ul.menuMore,ul.menufile,ul.fileContiner_menu')
				.find(classMenu).addClass(theClass);
			//not_writeable not_exists
			$('.path_tips span').html(LNG.only_read);
			if( kod_path_type==G.KOD_USER_RECYCLE ||
				kod_path_type==G.KOD_USER_SHARE){
				$('.path_tips').hide();
				if (!info['kpan_share']) {
					$('.kod_path_tool>button').removeClass('disabled');
				}
				if(kod_path_type==G.KOD_USER_SHARE && G.user_id != info['id']){
					$('.kod_path_tool>button').addClass('disabled');
				}
			}else{
				$('.path_tips').show();
			}
		}

		//空间大小使用情况 自己能编辑才能看到；管理员默认可以看到
		if(	((kod_path_type==G.KOD_GROUP_PATH||kod_path_type==G.KOD_GROUP_SHARE) && G.is_root) ||
			(kod_path_type==G.KOD_GROUP_PATH && info['role']=='owner')){
			var space = jsonData['group_space_use'];
			if(space){
				var html = core.userSpaceHtml(space.size_use+'/'+space.size_max);
				$(".group_space_use").removeClass('hidden').html(html);
			}else{
				//$(".group_space_use").addClass('hidden');
			}
		}else{
			//$(".group_space_use").addClass('hidden');
		}

		//自己的使用空间
		if(jsonData['user_space']){
			var space = jsonData['user_space'];
			var html = core.userSpaceHtml(space.size_use+'/'+space.size_max);
			$('.user_space_info').html(html);
		}
		//不能存在提示
		if (path_read == 'not_exists'){//不存在处理
			$('.path_tips span').html(LNG.not_exists);
			$('.path_tips').show();
		}
		
		// if( kod_path_type==G.KOD_USER_RECYCLE ||
		// 	kod_path_type==G.KOD_USER_SHARE ||
		// 	kod_path_type==G.KOD_GROUP_SHARE ||
		// 	kod_path_type==G.KOD_GROUP_PATH){
		// 	$('ul.menufolder,ul.menuMore,ul.menufile,ul.fileContiner_menu')
		// 		.find('.share').addClass('hidden');
		// }else{
		// 	$('ul.menufolder,ul.menuMore,ul.menufile,ul.fileContiner_menu')
		// 		.find('.share').removeClass('hidden');
		// }

		//真实目录
		if(G.is_root==1 && info['admin_real_path']){
			$('.admin_real_path').removeClass('hidden');
		}else{
			$('.admin_real_path').addClass('hidden');
		}
	};

	//对外接口
	return {
		f5:f5,
		f5Callback:f5Callback,
		pathTypeChange:pathTypeChange,
		pathChildrenTree:pathChildrenTree,
		pathChildrenSplit:pathChildrenSplit,
		myPicasa:myPicasa,
		init:function(){
			$(window).bind("resize",function(){
				resetTotalHeight();
				if(Config.pageApp == 'desktop'){
					ui.resetDesktopIcon();
				}else{
					ui.headerAddress.resetWidth();//TODO
				}
				if ($('#PicasaView').css("display")!="none") {
					myPicasa.setFrameResize();
				}
			});
			bindScrollLoadMore();
			myPicasa.init(".picasaImage");
			myPicasa.initData();
		}
	}
});

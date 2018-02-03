//对文件打开，文件操作的封装
define(function(require, exports) {
	var sizeDefault = {
		filename:250,
		filetype:80,
		filesize:80,
		filetime:150,
		explorer_left_tree_width:199,
		editor_left_tree_width:199,
	};//默认值
	var sizeMin = {
		filename:150,
		filetype:60,
		filesize:60,
		filetime:120,
		explorer_left_tree_width:2,
		editor_left_tree_width:2,
	};
	var sizeConfig = sizeDefault;
	var initConfig = function(){
		if (LocalData.get('resize_config')){
			sizeConfig = jsonDecode(LocalData.get('resize_config'));
		}else{
			if(typeof(G.user_config.resize_config) != "undefined"){
				sizeConfig = jsonDecode(htmlDecode(G.user_config.resize_config));
			}
			var config = jsonEncode(sizeConfig);
			LocalData.set('resize_config',config);
		}
		$.each(sizeDefault,function(key,val){
			if(!sizeConfig[key] || sizeConfig[key]<sizeMin[key]){
				sizeConfig[key] = sizeDefault[key];
			}
		});
	}
	var saveConfig = function(){
		if(isInFrame()){//框架中不记录
			return;
		}
		var config = jsonEncode(sizeConfig);
		LocalData.set('resize_config',config);
		$.get('index.php?setting/set&k=resize_config&v='+config);
	}
	var fileTitleResize = function(theSize,$dom){
		if( G.user_config.list_type == "icon"){
			return;
		}
		if (!theSize) {
			theSize = sizeConfig;
		}
		var css = '',totalWidth = 0;
		$.each(theSize,function(key,value){
			if(key.indexOf('file')!=0) return;
			if (value<=sizeMin[key]) {
				value = sizeMin[key];
			}
			totalWidth+=value;
			css += '.fileList_list .file .'+key+',#main_title .'+key+'{width:'+value+'px;}';
		});
		css += '.fileList_list .file{width:'+(totalWidth+50)+'px;}';
		$.setStyle(css,'header_resize_width');
	}

	//设置左侧树目录宽度调整
	var fileTreeChangeSize = function(theSize,isSave,isAnimate){
		if($('.frame-left').is(":hidden")){
			return;
		}
		var key = Config.pageApp+'_left_tree_width';//editor_left_tree_width
		var temp = $.extend(true,{}, sizeConfig);
		temp[key]+= theSize;
		if (temp[key] <= sizeMin[key]) {
			temp[key] = sizeMin[key];
		}
		//设置左侧树目录宽度
		var offset = temp[key];
		var $left = $('.frame-left');
		var $drag = $('.frame-resize');
		var $right = $('.frame-right');

		//默认附近；吸附效果
		var default_width = sizeDefault[key];
		if(offset>default_width-8&&offset<default_width+8){
			offset= default_width+1;
		}

		if(isAnimate){
			var time = 400;
			$left.animate({width:offset},time);
			$drag.animate({left:offset-5},time);
			$right.animate({left:offset},time);
		}else{//拖动
			$left.css('width',offset);
			$drag.css('left',offset-5);
			$right.css('left',offset);
		}
		if(typeof(ui.setStyle)!='undefined'){
			ui.setStyle();
		}
		if(isSave){
			sizeConfig = temp;
			saveConfig();
		}
	}
	var isInFrame = function(){
		if( $.getUrlParam('type')!=undefined){
			return true;
		}else{
			return false;
		}
	}

	//发生变更
	var fileTitleChangeSize = function(key,offset,isSave){
		var temp = $.extend(true,{}, sizeConfig);
		temp[key]+= offset;
		fileTitleResize(temp);
		if(isSave){
			sizeConfig = temp;
			$.each(sizeConfig,function(key,value){
				if (value<=sizeMin[key]) {
					sizeConfig[key] = sizeMin[key];
				}
			});
			saveConfig();
		}
	}

	//文件头部绑定
	var bindHeaderResize = function(){
		if($('#main_title').hasClass('bind_init')){
			return;
		}
		fileTitleResize(sizeConfig);//初始化
		$('#main_title').addClass('bind_init');
		//分别绑定tab
		$.each(sizeDefault,function(key,value){
			$("#main_title ."+key+"_resize").drag({
				start:function(){
				},
				move:function(offsetx,offsety){
					fileTitleChangeSize(key,offsetx,false);
				},
				end:function(offsetx,offsety){
					fileTitleChangeSize(key,offsetx,true);
				}
			});
		});
	}
	var bindTreeResize = function(){
		//树目录
		var $drag_line = $('.frame-resize');
		$drag_line.drag({
			start:function(){
				$drag_line.addClass('active');
				$('.resizeMask').css('display','block');
			},
			move:function(offsetx,offsety){
				fileTreeChangeSize(offsetx,false,false);
			},
			end:function(offsetx,offsety){
				fileTreeChangeSize(offsetx,true,false);
				$drag_line.removeClass('active');
				$('.resizeMask').css('display','none');
			}
		});
	}


	//========文件图标列表，大小切换=========
	var iconSizeInit = function(){
		var size = G.user_config.file_icon_size;
		if(!size){
			size = "75";
		}
		iconSizeChange(size,false);
		iconSizeMenuSet(size);
	}
	var iconSizeMenuSet = function(size){
		$('.set-file-icon-size .file-icon-size').removeClass('selected');
		var arr = [
			['40', 'box-size-smallx'],
			['60', 'box-size-small'],
			['80', 'box-size-default'],
			['150','box-size-big'],
			['220','box-size-bigx']
		];
		var offset = 10,type = '';
		for (var i = 0; i < arr.length; i++) {
			var cur = parseInt(arr[i][0]);
			//console.log(size,arr[i],cur,cur-offset>=size && cur+offset<=size,cur-offset,cur+offset);
			if(cur-offset<=size && cur+offset>=size){
				type = arr[i][1];
				break;
			}
		}
		if(type!=''){
			$('.'+type).addClass('selected');
		}
	}
	var iconSizeSave = function(size){
		G.user_config.file_icon_size = size;
		iconSizeMenuSet(size);
		$.get('index.php?setting/set&k=file_icon_size&v='+size);
	}
	var iconSizeChange = function(size,isSave){
		var sizeUse = size;
		var min = 0,max=105,//slider
			sizeMin=30,sizeMax=250;//file size


		if(Config.pageApp == 'desktop'){
			sizeMin = 50;sizeMax = 120;
		}
		sizeUse = sizeUse <= sizeMin?sizeMin:sizeUse;
		sizeUse = sizeUse >= sizeMax?sizeMax:sizeUse;

		var top = (size - sizeMin)*max/(sizeMax-sizeMin);
		var lineHeight = 20,
			icon_margin = 10,
			width  = parseInt(sizeUse),
			height = width + lineHeight*2 - icon_margin + 5,//padding-top;
			icon_width = width-icon_margin,
			icon_height = width-icon_margin,
			meta_width = width*0.4,
			max_height = width + lineHeight*3 - icon_margin;//多两行 行+padding-bottom

		var fileSize = '.fileList_icon div.file{height:'+height+'px;width:'+width+'px;}';
		if(Config.pageApp=='desktop'){//desktop 高度固定
			height -= 5;
			fileSize = 'div.fileList_icon div.file{height:'+height+'px;width:'+width+'px;}';
		}

		//display-cell 高度和chrome不一致问题
		if($.browser.mozilla){
			icon_height -= 4;
		}

		var css =
			'div.fileList_icon div.file{max-height:'+max_height+'px;}'+fileSize+'\
			.fileList_icon .meta_info{height:'+meta_width+'px;width:'+meta_width+'px;\
				margin-right:'+(meta_width*0.16)+'px;margin-top:-'+meta_width*1.1+'px;}\
			.fileList_icon div.file .filename{width:'+width+'px;}\
			.fileList_icon div.file .filename #pathRenameTextarea,\
			.fileList_icon div.file .filename .newfile{width:'+width+'px;}\
			.fileList_icon div.file .ico{padding-left:'+icon_margin/2+'px;height:'+icon_height+'px;width:'+icon_width+'px}\
        	.fileList_icon div.file .ico.picasaImage{width:'+icon_width+'px;padding-left:'+icon_margin/2+'px;overflow:hidden;}';
		$.setStyle(css,'file_icon_resize');
		$('.slider_handle').css('top',top);
		if(isSave){//保存到服务器
			iconSizeSave(size);
		}
	}
	var bindSelectIconSize = function(){
		var before_offset,$hander = $('.slider_handle');
		$(".set_icon_size_slider").bind('click',function(e){
			stopPP(e);
			return false;
		});

		var change = function(offset){
			var min = 0,max=105,//slider
				sizeMin=30,sizeMax=250;//file size
			var x = before_offset+offset;
			x = x<min?min:x;
			x = x>max?max:x;

			var size = parseInt((x/max)*(sizeMax-sizeMin)+sizeMin);
			//size = parseInt(size/5) *5;//按5来分级
			iconSizeChange(size,false);
			return size;
		}
		$hander.drag({
			start:function(e){
				$hander.addClass('active');
				before_offset = parseInt($hander.css('top'));
			},
			move:function(offsetx,offsety,e){
				change(offsety);
			},
			end:function(offsetx,offsety,e){
				$hander.removeClass('active');
				iconSizeSave(change(offsety),true);
			}
		});

		//slider click
		var $slider = $('.slider_bg');
		$('.slider_bg').unbind('click').bind('click',function(e){
			var top = e.clientY - $slider.offset().top;
			before_offset = 0;
			change(top);
		});
	}
	
	//分栏宽度调整
	var bindSplitResize = function(){
		var resetWidth = function($dom,offsetx){
			var $box  = $dom.parent();
			var index = $('.split_box').index($box);
			var width = parseInt($box.data('before_width'))+offsetx;
			if(width<150){//最窄宽度
				return;
			}
			$($(".split_line").get(index)).css('width',width);
			$box.css('width',width);
			$('.split_box:gt('+index+')').each(function(){
				if(!$(this).hasClass('is_drag_split')){
					$(this).css('left',parseInt($(this).data('before_left'))+offsetx+'px');
				}
			});

			var arr = [];
			$('.split_box').each(function(){
				arr.push({left:$(this).css('left'),width:$(this).width()});
			});
			LocalData.set('split_box_size',jsonEncode(arr));
		}
		$(".bodymain .fileList_list_split .split_drag").drag({
			start:function(e,$dom){
				var $box = $dom.parent();
				$box.addClass('is_drag_split').data('before_width',$box.width());
				$('.split_box,.split_line').each(function(){
					$(this).data('before_left',$(this).css('left'));
				});
			},
			move:function(offsetx,offsety,e,$dom){
				resetWidth($dom,offsetx);
			},
			end:function(offsetx,offsety,e,$dom){
				//resetWidth($dom,offsetx);
				$dom.parent().removeClass('is_drag_split');
			}
		},true);

		//选中父子关系的目录
		$(".file.select_split_parent").removeClass('select_split_parent');
		$(".split_box").each(function(){
			$('.file[data-path="'+$(this).attr('data-path')+'"]').addClass('select_split_parent');
		});
		splitSizeReset();
	}

	//分栏个数发生变更，重置宽度
	var splitSizeReset = function(){
		var arr = jsonDecode(LocalData.get('split_box_size'));
		var totalWidth = 0;
		if(!arr){
			arr = [];
		}
		var resetWidth = function($dom,index){
			var info = arr[index];
			if(!info){
				info = {width:250,left:totalWidth}
			}
			totalWidth += info['width']+1;
			$dom.css({width:info['width']+'px',left:info['left']});
		}

		totalWidth = 0;
		$('.split_box').each(function(index){
			resetWidth($(this),index);
		});
		totalWidth = 0;
		$('.split_line').each(function(index){
			resetWidth($(this),index);
		});
		$(".bodymain").scrollLeft(100000);//滚动条移动到最右边
	}

	return {
		init:function(){
			initConfig();
			if(isInFrame()){//回到初始值
				sizeConfig = sizeDefault;
			}
			fileTitleResize(sizeConfig);
			bindTreeResize();
			fileTreeChangeSize(0,false,true);
			bindSelectIconSize();
		},
		initFileSize:iconSizeInit,
		bindSplitResize:bindSplitResize,
		bindHeaderResize:bindHeaderResize,
		setFileIconSize:iconSizeChange
	}
});

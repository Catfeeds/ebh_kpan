define(function(require, exports) {
	var isSelect		= false;	// 	是否多选状态
	var isDraging		= false;	//	是否拖拽状态
	var isCtrlSelect 	= false;	//  是否ctrl按住并选择
	var bindEvent = function(){
		//phone
		$(Config.FileBoxClass).die('touchstart').live('touchstart',function(event, phase, $target, data){
			if (!$(this).hasClass('select')){
				ui.fileLight.clear();
				$(this).removeClass('select');
				$(this).addClass('select');
				ui.fileLight.select();
			}else{
				ui.path.open();
			}
		});

		var dragDropAt = function($sel){
			if (($sel.hasClass(Config.TypeFolderClass) || $sel.hasClass('menuRecycleButton'))
				&& !$sel.hasClass(Config.SelectClassName)) {
				$('.selectDragTemp').removeClass('selectDragTemp');
				$sel.addClass('selectDragTemp');
			}
		}

		//拖拽移动hover时；文件夹展开——列表；分栏
		var dragHoverFile = function($file){
			// if(!isDraging || G.user_config.list_type == 'icon' || !isFolder($file)) return;
			// if(G.user_config.list_type == 'list'){
			// 	ui.fileContent.pathChildrenTree($file);
			// }else if(G.user_config.list_type == 'list_split'){
			// 	fileOpenChildrenSplit($file);
			// }
		}

		// 屏蔽对话框内操作
		$(Config.FileBoxClass).die('mouseenter').live('mouseenter',function (e) {
			if (isDraging) {//hover,hover 到文件夹时则添加目标选择类
				dragDropAt($(this));
			}
			if(!isSelect && !isDraging){//框选时，由于ctrl重选时会反选有hover
				$(this).addClass(Config.HoverClassName);
			}
			dragHoverFile($(this));
			$(this).unbind("mousedown").bind('mousedown',function(e){
				if( $(e.target).is('input') ||  //ie bug
					$(e.target).is('textarea')){
					return true;
				}
				$(this).focus();
				rightMenu.hidden();
				//列表点击目录展开
				if( $(e.target).parents('.children_more').length>0){
					ui.fileContent.pathChildrenTree($(this));
					stopPP(e);
					return false;
				}
				//已选中多个,点击可拖动以选中进行操作；点击未选中则清空
				if (!(e.ctrlKey||e.metaKey) && !e.shiftKey && !$(this).hasClass(Config.SelectClassName)) {
					ui.fileLight.clear();
					$(this).addClass(Config.SelectClassName);
					ui.fileLight.select();
					return true;
				}
				//鼠标右键,有选中，且当前即为选中
				if(e.which==3 && !$(this).hasClass(Config.SelectClassName)){
					ui.fileLight.clear();
					$(this).addClass(Config.SelectClassName);
					ui.fileLight.select();
				}
				if((e.ctrlKey||e.metaKey)) {//ctrl 跳跃选择
					if ($(this).hasClass(Config.SelectClassName)) {//已经选定 设置标志位弹起时取消选择
						isCtrlSelect = true;
					}else{
						ui.fileLight.setMenu($(this));
						$(this).addClass(Config.SelectClassName);
					}
					ui.fileLight.select();
				}
				if(e.shiftKey){//shift 连选
					var $listAll = fileList.fileListAll($(this));
					var $listSelect = fileList.fileListSelect($(this));

					var current = $listAll.index($(this));
					if ($listSelect.length == 0) {
						selectFromTo(0,current,$listAll);
					}else{//有选中，则当前元素序号对比选中的最左和最右，
						var first = $listAll.index($listSelect.first());
						var last = $listAll.index($listSelect.last());
						if (current < first) {
							selectFromTo(current,last,$listAll);
						}else if (current >last){
							selectFromTo(first,current,$listAll);
						}else{//current在frist 和 last之间
							selectFromTo(first,current,$listAll);
						}
					}
				}
				return true;
			}).unbind('mouseup').bind('mouseup',function(e){
				$('.selectDragTemp').removeClass('selectDragTemp');
				return true;
			});
		}).die('mouseleave').live('mouseleave',function(){
			$(this).removeClass(Config.HoverClassName);
			if(isDraging){
				$(this).removeClass('selectDragTemp');
			}
		}).die('click').live('click',function (e) {
			stopPP(e);//再次绑定，防止冒泡到html的click事件
			if(isDraging) return false;//拖拽并在该元素弹起，依旧保持选中

			//列表时，目录展开
			if($(this).find('.textarea').length!=0){
				return;
			}
			if($(".file-draging-box").length != 0){//多选拖拽时；在按下的元素松开会触发click
				return;
			}
			if (!(e.ctrlKey||e.metaKey) && !e.shiftKey) {//没按下ctrl和shift 清空之前选择
				ui.fileLight.clear();
				$(this).addClass(Config.SelectClassName);
				ui.fileLight.select();
				fileOpenChildrenSplit($(this));
			}else if((e.ctrlKey||e.metaKey) && isCtrlSelect) {//ctrl 跳跃选择
				isCtrlSelect = false;
				ui.fileLight.resumeMenu($(this));//恢复右键菜单id
				$(this).removeClass(Config.SelectClassName);
				ui.fileLight.select();
			}
		}).die('dblclick').live('dblclick',function (e) {
			if( $(e.target).is("textarea") ||
				$(e.target).is("input") ||
				$(e.target).hasClass("children_more") ||
				$(e.target).hasClass("children_more_cert")
				){
				return;
			}
			if (e.altKey){
				ui.path.info();
			}else {
				if(ui.fileLight.fileListSelect().length!=1){
					return;
				}
				if(G.user_config.list_type == 'list_split' && isFolder($(this))){
					var path = ui.fileLight.path($(this));
					G.this_path = '';
					$(".fileList_list_split .split_box").remove();
					ui.path.list(path);
					return;
				}
				ui.path.open();
			}
		});

		bindEventDragToTree();
		bindEventDragToAddress();

		$(Config.FileBoxTittleClass).die('dblclick').live('dblclick',function (e) {
			if(!$(this).hasClass('db_click_rename')) return true;
			var $file = $(this).parents('.file');
			if($file.hasClass('systemBox')){
				//return;
			}
			ui.path.rname();//重命名
			stopPP(e);return false;
		});
	};

	//文件拖拽到树目录
	var bindEventDragToTree = function(){
		var openDelayTimer;
		$('#folderList a').die('mouseenter').live('mouseenter',function (e) {
			if(!isDraging){
				return;
			}
			if($(this).hasClass('menuTreeFolder')){
				$(this).addClass('curDropTreeNode');
			}
			//停留超过1s则展开目录
			clearTimeout(openDelayTimer);openDelayTimer=false;
			var zTree = ui.tree.zTree();
			var treeNode = zTree.getNodeByTId($(this).parent().attr('id'));
			if(treeNode.open || !treeNode.isParent){
				return;
			}
			openDelayTimer = setTimeout(function(){
				zTree.expandNode(treeNode,true);
			},600);//延迟400ms
		}).die('mouseup').live('mouseup',function(){
			if(!isDraging){
				return;
			}
			$(this).removeClass('curDropTreeNode');
			clearTimeout(openDelayTimer);openDelayTimer=false;

			//拖拽后刷新该节点
			var zTree = ui.tree.zTree();
			var treeNode = zTree.getNodeByTId($(this).parent().attr('id'));
			setTimeout(function(){
				treeNode.isParent = true;
				zTree.reAsyncChildNodes(treeNode, "refresh");
			},100);
		}).die('mouseleave').live('mouseleave',function(){
			if(!isDraging){
				return;
			}
			$(this).removeClass('curDropTreeNode');
			clearTimeout(openDelayTimer);openDelayTimer=false;
		});
	}


	//文件拖拽到树目录
	var bindEventDragToAddress = function(){
		$('.header-middle .yarnlet a').die('mouseenter').live('mouseenter',function (e) {
			if(!isDraging) return;
			$(this).addClass('curDropToPath');
		}).die('mouseup').live('mouseup',function(){
			if(!isDraging) return;
			$(this).removeClass('curDropToPath');
		}).die('mouseleave').live('mouseleave',function(){
			if(!isDraging) return;
			$(this).removeClass('curDropToPath');
		});
	}



	//tree 拖拽
	//是否为分栏模式的文件夹——对应展开等操作
	var isFolder = function($sel){
		if(G.user_config.list_type == 'icon'){
			if(  $sel.hasClass('folderBox') ||
				 $sel.hasClass('menuRecycleButton') 
				){
				return true;
			}
			return false;
		}else if(G.user_config.list_type == 'list'){
			if(  $sel.hasClass('folderBox') ||
				 $sel.hasClass('menuRecycleButton') ||
				 $sel.find('.children_more_cert').length !=0
				){
				return true;
			}
			return false;
		}else if(G.user_config.list_type == 'list_split'){
			if(  $sel.hasClass('folderBox') ||
				 $sel.hasClass('menuRecycleButton') ||
				 $sel.find('.children_more_cert').length !=0
				){
				return true;
			}
			return false;
		}
	}

	var fileOpenChildrenSplit = function($sel){
		if( G.user_config.list_type == 'list_split' &&
			isFolder($sel) &&
			ui.fileLight.fileListSelect().length==1 ){
			var path = ui.fileLight.path($sel);
			ui.path.history.add(path);
			ui.fileContent.pathChildrenSplit(path,function(){
				selectSplit(path);
			});
		}
	}
	//移动
	var bindEventSplitBox = function(){
		var select = '.fileList_list_split .split_box';
		var split_hover  = 'split_hover';
		$(select).live('mouseenter',function (e) {
			$(select).removeClass(split_hover);
			$(this).addClass(split_hover);
		}).die('mouseleave').live('mouseleave',function(){
			$(this).removeClass(split_hover);
		}).die('click').live('click',function (e) {
			selectSplit( ui.fileLight.path($(this)) );
		}).die('mousedown').live('mousedown',function (e) {
			var $file = $(e.target).parents('.file');
			if( $file.length !=0 && 
				$file.find('.children_open').length !=0 ){//点击文件夹则不处理
				return;
			}else{
				selectSplit( ui.fileLight.path($(this)) );
			}
		});
	}

	var selectSplit = function(path){
		var $select = $('.fileList_list_split .split_box');
		var $split_dom = $('.fileList_list_split .split_box[data-path="'+pathHashEncode(path)+'"]');
		var $file_dom  = $('.fileList_list_split .split_box .file[data-path="'+pathHashEncode(path)+'"]');
		var split_select = 'split_select';
		if($split_dom.length==0){
			$split_dom = $select.last();
		}
		$select.removeClass(split_select);
		$split_dom.addClass(split_select);
		if(ui.fileLight.fileListSelect().length==0){
			$file_dom.addClass('select');
		}
		// var e = event || window.event;
		// console.log(e.ctrlKey || e.metaKey)
		// if(e.ctrlKey || e.metaKey){//多选不允许夸列
		// 	$select.not(".split_select").find(".file.select").removeClass("select");
		// }
		ui.fileLight.select();
		var jsonData = $split_dom.data('jsonData');
		if(jsonData && path){
			ui.fileContent.pathTypeChange(jsonData);

			//刷新问题处理
			G.this_path = path;
			G.json_data = jsonData;
			ui.headerAddress.addressSet();//header地址栏更新
		}
		ui.fileLight.init();
	}

	//文件：是否允许拖拽
	var ifFileCanDrag = function($sel){
		if( $sel.hasClass('menuSharePath') || //共享虚拟目录
			$sel.hasClass('systemBox')
			){
			return false;
		}
		return true;
	}
	// 拖拽文件移动
	var bindDragEvent= function(){
		var delayTime = 150;
		var dragCopyOffset = 30;
		var $self;
		var $dragBox  = false;
		var $target   = false;
		var startTime = 0;
		var hasStart  = false;
		var leftOffset= -15;
		var topOffset = 10;
		var boxTop	  = 0;
		var boxLeft	  = 0;
		var screenHeight;
		var screenWidth;
		var bodyClass = 'selectDragDraging';
		$(Config.FileBoxClass).die('mousedown').live('mousedown',function(e){
			if (e.shiftKey) return;
			if (ui.isEdit()) return true;
			if (e.which != 1 || isSelect) return true;
			$self = $(this);
			if(!ifFileCanDrag($self)){
				return;
			}
			dragStart(e);

			//事件 在 window之外操作，继续保持。//firefox会导致元素捕获不到mouseover等事件。则忽略
			if(!$.browser.mozilla) {
				if(this.setCapture) this.setCapture();
			}
			$(document).mousemove(function(e) {dragMove(e);});
			$(document).keydown(function(e) {dragMove(e);});//ctrl 按键处理
			$(document).keyup(function(e) {dragMove(e);});

			$(document).one('mouseup',function(e) {
				dragEnd(e);
				if(this.releaseCapture) {this.releaseCapture();}
			});
			//stopPP(e);return false;

			//纠结
			//阻止冒泡：防止firefox与chrome滚屏
			//不阻止冒泡：在iframe中拖拽也能响应响应问题。（page不在frame中；page直接在页面/）
		});
		var dragStart = function(e){
			rightMenu.hidden();
			isDraging = true;
			startTime = $.now();
			boxTop	  = e.pageY;
			boxLeft	  = e.pageX;
			screenHeight = $(document).height();
			screenWidth  = $(document).width();
			$target = $(e.target).parents('.file');
		};
		var dragMove = function(e){
			if (!isDraging) return true;
			window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
			if (($.now() - startTime > delayTime)  && !hasStart) {
				makeDragBox();
				$dragBox = $('.draggable-dragging');
				$dragBox.attr('data-beforeInfo',$dragBox.find('span').html());
			}
			if(!hasStart){
				return;
			}

			var x = (e.clientX >= screenWidth-50 ? screenWidth-50 : e.clientX);
			var y = (e.clientY >= screenHeight-50 ? screenHeight-50 : e.clientY);
			x = (x <= 0 ? 0 : x);
			y = (y <= 0 ? 0 : y);
			x = x - leftOffset;
			y = y - topOffset;
			$dragBox.css({'left':x,'top':y});
			dragMoveActionSetDelay(e);
			cloneBoxUpdate(x-boxLeft+leftOffset,y-boxTop+topOffset);
			return true;
		};

		//内容发生变更
		var dragDelayTimer;//快速变化屏蔽
		var dragMoveActionSetDelay = function(evt){
			clearTimeout(dragDelayTimer);dragDelayTimer=false;
			dragDelayTimer = setTimeout(function(){
				try{
					dragMoveActionSet(evt);
				}catch(e){};
			},10);
		}

		//拖拽时动作判断：移动复制到列表文件夹、移动复制到split文件夹、移动复制到树目录文件夹、删除、分享
		var dragMoveActionSet = function(evt){
			var isCtrl = evt.ctrlKey || evt.metaKey;
			var setDragInfo = function(action,path){//拖拽移动or复制状态
				if (typeof(G.sid) != 'undefined'){
					action = 'none';
				}

				//系统根目录是否可写判断；拖拽到此处
				if( path != undefined && 
					path.search(G.KOD_GROUP_PATH)!==0 && 
					path.search(G.KOD_USER_RECYCLE)!==0 && 
					core.isSystemPath(path)){
					action = 'clear';
				}
				var name = htmlEncode(core.pathThis(path));
				var before_text = ' '+$dragBox.attr('data-beforeInfo').replace(/<[^<>]+>/g,'');
				var text = {
					'copy_to':'<i class="font-icon bg-ok icon-copy"></i><b>'+LNG.copy_to+'</b>"'+name+'"',
					'move_to':'<i class="font-icon bg-ok icon-share-alt"></i><b>'+LNG.cute_to+'</b>"'+name+'"',
					'remove':'<i class="font-icon bg-error icon-trash"></i><b>'+LNG.remove+before_text+'</b>',				
					'share':'<i class="font-icon bg-ok icon-share-sign"></i><b>'+LNG.share+before_text+'</b>',

					'none':'<i class="font-icon bg-error icon-minus"></i><b>'+LNG.no_permission_write+'</b>',
					'clear':$dragBox.attr('data-beforeInfo')
				}
				if(path == G.this_path){
					text['copy_to'] = '<i class="font-icon bg-ok icon-copy"></i><b>'+LNG.clone+'</b>';
				}
				$dragBox.find('span').html(text[action]);
				$dragBox.attr('data-actionType',action);
				$dragBox.attr('data-actionPath',path);
			}
			if( $('.selectDragTemp').length != 0 || 
				$('.curDropTreeNode').length != 0 ||
				$(".curDropToPath").length != 0
				){//拖拽到文件夹

				var path = ui.fileLight.path($('.selectDragTemp'));
				//拖拽到树目录
				if($('.curDropTreeNode').length != 0){
					var treeObj = ui.tree.zTree();
					var node = treeObj.getNodeByTId($('.curDropTreeNode').parent().attr('id'));
					path = node.path;
				}
				if($(".curDropToPath").length !=0 ){
					path = $(".curDropToPath").attr('data-path');
				}

				if($('.selectDragTemp').hasClass('menuRecycleButton')){
					setDragInfo('remove');
				}else if (isCtrl) {
					setDragInfo('copy_to',path);
				}else{
					setDragInfo('move_to',path);
				}
			}else if($('.recycle_hover').length != 0){
				setDragInfo('remove');
			}else if($('.share_hover').length != 0 && ui.fileLight.fileListSelect().length<=1){
				setDragInfo('share');
			}else{//拖拽到当前列表
				if (isCtrl) {//克隆
					var path = G.this_path;
					if( G.user_config.list_type == 'list_split'&&
						$('.split_hover').length!=0){
						path = ui.fileLight.path($('.split_hover'));
					}
					setDragInfo('copy_to',path);
				}else{
					if( G.user_config.list_type == 'list_split' &&
						$('.split_hover').length!=0 &&
						!$('.split_hover').hasClass('split_select')){
						setDragInfo('move_to',ui.fileLight.path($('.split_hover')) );
					}else{
						setDragInfo('clear');
					}
				}
			}
		}
		var dragEnd = function(e){
			if (!isDraging) return false;
			isDraging = false;
			hasStart  = false;
			$('body').removeClass(bodyClass);
			if($dragBox){
				$dragBox.addClass("animated-300").addClass("flipOutXLine").fadeOut(200,function(){
					$dragBox.remove();
					$dragBox = false;
				});
			}else{
				return;
			}
			var doAction = function(action,path){
				//console.log($dragBox,action,path);
				switch(action){
					case 'copy_to':
						ui.path.copyDrag(path,true);//复制到
						break;
					case 'move_to':
						ui.path.cuteDrag(path);//移动
						break;
					case 'remove':
						ui.path.remove(true);//删除,不弹出提示层
						break;
					case 'share':
						ui.path.share();//分享
						break;
					default:break;
				}
			}
			var action = $dragBox.attr('data-actionType');
			if($.inArray(action,['copy_to','move_to','remove','share']) !=-1){
				cloneBoxRemove(false);
			}else{
				cloneBoxRemove(true);
			}
			doAction(action,$dragBox.attr('data-actionPath'));
		};
		var makeDragBox = function(){
			$('body').addClass(bodyClass);
			//移动时会挡住下面元素，导致hover不可用，
			//webkit firfox下css属性 pointer-events: none;鼠标事件穿透可解决。
			var file_num = ui.fileLight.fileListSelect().length;
			$('<div class="file draggable-dragging">'
				+'<div class="drag_number">'+file_num
				+'</div><span><i class="font-icon bg-default icon-ok"></i>'+file_num+' '+LNG.file+'</span></div>').appendTo('body');
			hasStart = true;
			setTimeout(cloneBoxCreate,20);
		};


		//拖拽影像
		var offsetSize   = 0;
		var offsetTime   = 5;
		var offsetBoxTop = 35;
		var dragDelayTime = 20;
		var dragAnimateMax = 60;
		var $select;
		var cloneBoxCreate = function(){
			clearTimeout($(".file-draging-box").data('removeDelay'));
			$(".file-draging .file").stop();
			$(".file-draging-box").remove();
			var typeArr = {
				"icon"	: "fileList_icon",
				"list"	: "fileList_list",
				"list_split" : "fileList_list_split"
			}
			var boxClass = typeArr[G.user_config.list_type];
			$("<div class='fileContiner file-draging-box'><div class='"+boxClass+" file-draging'></div></div>").appendTo("body");

			$select = $(Config.SelectClass).filter("[data-path!='']");//filter desktop systemp apps
			var $list = $select.clone();
			if($select.length >= dragAnimateMax || $.browser.msie ){
				$list = $target.clone();
			}

			$list.appendTo(".file-draging");
			$list.each(function(i){
				var $same = $(".bodymain .fileContiner .file[data-path='"+$(this).attr("data-path")+"']");
				var offset = $same.offset();
				$(this).css({
					'left':offset.left,
					'top':offset.top,
					'width':$same.width()
				});
				$(this).data({
					'data-left':offset.left,
					'data-top':offset.top,
					'data-animateTime':200 + i * offsetTime,
					'data-sizeAdd':offsetSize * i
				});
				if($(this).attr("data-path") == $target.attr("data-path")){
					$(this).addClass('handle_target');
				}
				if($list.length == 1){
					$(this).data({'data-animateTime':0});
					dragDelayTime = 0;
				}
			});
			$select.addClass('item-file-draging');

			var dragDelay = setTimeout(function(){
				$(".file-draging-box").data('animate','finished');
				var $target = $(".draggable-dragging");
				$list.each(function(i){
					var $that 		= $(this);
					var sizeAdd     = $(this).data('data-sizeAdd');
					var animateTime = $(this).data('data-animateTime');
					$(this).data('status','ready');
					$(this).animate(
						{'opacity':1},
						{
							duration: animateTime,
							easing: "swing",
							progress: function(elements, complete, remaining, start, tweenValue) {
								var offsetFrom = $that.offset();
								var offsetTo   = $target.offset();
								var x = (offsetTo.left+sizeAdd - offsetFrom.left) * complete;
								var y = (offsetTo.top+sizeAdd+offsetBoxTop - offsetFrom.top) * complete;
								$that.css({
									'left':offsetFrom.left+x,
									'top':offsetFrom.top+y
								});
						    },
						    complete:function(){
						    	$that.data('status','finished');
						    }
						}
			        );
				});
			},dragDelayTime);
			$(".file-draging-box").data('dragDelay',dragDelay);
			$(".file-draging-box").data('animate','ready');
		}

		var cloneBoxUpdate = function(x,y){
			//跟随
			if($(".file-draging-box").data('animate') != 'finished'){
				$(".file-draging .file").each(function(){
					$(this).css({
						'left':$(this).data('data-left') + x,
						'top':$(this).data('data-top') + y,
					});
				});
				return;
			}
			
			$(".file-draging .file").each(function(i){
				if($(this).data('status') != 'finished'){
					return;
				}
				var sizeAdd = $(this).data('data-sizeAdd');
				var offset  = $(".draggable-dragging").offset();
				$(this).css({
					'left':offset.left+sizeAdd,
					'top':offset.top+sizeAdd+offsetBoxTop
				});
			});
		}
		var cloneBoxRemove = function(goback){
			var num = $(".file-draging .file").length;
			clearTimeout($(".file-draging-box").data('dragDelay'));
			$(".file-draging .file").each(function(i){
				var timeOffset = i*offsetTime;
				var $same = $(".bodymain .fileContiner .file[data-path='"+$(this).attr("data-path")+"']");
				if(goback){ //回到原位
					$(this).stop().animate({
						'left':$(this).data('data-left'),
						'top':$(this).data('data-top'),
					},250+timeOffset,function(){
						$select.removeClass('item-file-draging')
					})
					.animate({opacity: 0},150,function(){
						$(this).remove();
					});
				}else{
					$same.stop().animate({'opacity':1.0},100);
					$(this).stop().animate({opacity: 0},200+timeOffset,function(){
						$(this).remove();
					});
				}
			});
			var removeDelay = setTimeout(function(){
				$(".file-draging-box").remove();
			},400 + offsetTime * num);
			$(".file-draging-box").data('removeDelay',removeDelay);
		}
	};


	// 框选 select
	var bindBoxSelectEvent = function(){
		var startX			= null;
		var startY			= null;
		var $selectDiv		= null;
		var mainOffsetTop	= 0;
		var mainOffsetLeft  = 0;
		var fileContinerHeight	= 0;
		var bodymainHeight	= 0;
		var scrollDelayTimer = '';

		//dom
		var bodyContentClass = 'bodymain';//fileContiner
		if(Config.pageApp == 'desktop'){
			bodyContentClass = 'fileContiner';
		}
		var $bodyContent = $('.'+bodyContentClass);

		$bodyContent.die('mousedown').live('mousedown',function(e){
			if ($(e.target).hasClass(bodyContentClass) &&
				($(document).width() - e.pageX<20)) {
				return;// 屏蔽滚动条上的消息
			}
			fileContinerHeight = $(".fileContiner").outerHeight();
			bodymainHeight = $bodyContent.outerHeight();
			if (ui.isEdit()) return true;
			if (e.which != 1 || isDraging) return true;

			dragSelectInit(e);
			if(this.setCapture){this.setCapture();}

			$(document).unbind('mousemove').mousemove(function(e) {
				dragSelecting(e);
			});
			$(document).one('mouseup',function(e) {
				clearTimeout(scrollDelayTimer);scrollDelayTimer=false;
				dragSelectEnd(e);
				if(this.releaseCapture) {this.releaseCapture();}
			});
			//stopPP(e);return false;
		});

		//创建模拟 选择框，框选开始
		var dragSelectInit = function(e) {
			mainOffsetLeft = $bodyContent.offset().left - $bodyContent.scrollLeft();
			mainOffsetTop  = $bodyContent.offset().top  - $bodyContent.scrollTop();
			if(G.user_config.list_type == 'list_split'){//分栏模式
				mainOffsetTop = mainOffsetTop + $(e.target).parents('.split_box').scrollTop();
			}
			if ($(e.target).parent().hasClass(Config.FileBoxClassName)
				|| $(e.target).parent().parent().hasClass(Config.FileBoxClassName)
				|| $(e.target).hasClass('fix')
			){
				return;
			}
			rightMenu.hidden();
			if (!((e.ctrlKey||e.metaKey) || e.shiftKey)) ui.fileLight.clear();
			if (!$(e.target).hasClass("ico")){// 编辑状态不可选
				startX = e.pageX - mainOffsetLeft;
				startY = e.pageY - mainOffsetTop;
				scrollDelayTimer = setTimeout(function(){
					isSelect = true;
					if ($('#selContainer').length == 0) {
						$('<div id="selContainer"></div>').appendTo(Config.FileBoxSelector);
					}
					$selectDiv = $('#selContainer');
				},100);
			}
		};

		//框选，鼠标移动中
		var dragSelecting= function(e) {
			if (!isSelect) return true;
			var mouseX = e.pageX - $bodyContent.offset().left + $bodyContent.scrollLeft();
			var mouseY = e.pageY - $bodyContent.offset().top  + $bodyContent.scrollTop();
			var the_width = Math.abs(mouseX - startX);
			var the_height= Math.abs(mouseY - startY);
			var offset = 100;
			if (mouseY>startY && the_height > fileContinerHeight-startY) {
				if (fileContinerHeight>bodymainHeight) {
					the_height = fileContinerHeight-startY;
				}
			}
			$selectDiv.css({
				'left'	: Math.min(mouseX,  startX),
				'top'	: Math.min(mouseY,  startY),
				'width' : the_width,
				'height': the_height
			});

			//优化列表过多。小于1000，则实时选中，否则只在结束时处理
			if(ui.fileLight.fileListAll().length<1000){
				setSelectFile();
			}
		};

		// ---------------- 框中选择关键算法 ---------------------
		var setSelectFile = function(){
			var _x1 = $selectDiv.offset().left - $bodyContent.offset().left + $bodyContent.scrollLeft();
			var _y1 = $selectDiv.offset().top  - $bodyContent.offset().top  + $bodyContent.scrollTop();
			var _x2 = _x1 + $selectDiv.width();
			var _y2 = _y1 + $selectDiv.height();

			var $listAll = ui.fileLight.fileListAll();
			for ( var i = 0; i < $listAll.length; i++) {
				var currentBox = $listAll[i];
				var $currentBox= $($listAll[i]);

				var scrollTop = $currentBox.parent().scrollTop();//split滚动条高度
				var x1 = currentBox.offsetLeft;//  currentBox.offsetLeft
				var y1 = currentBox.offsetTop - scrollTop;
				var x2 = x1 + $currentBox.width();
				var y2 = y1 + $currentBox.height();
				if(G.user_config.list_type == 'list_split'){//分栏模式
					x1 = x1 + $currentBox.parents('.split_box')[0].offsetLeft;
					x2 = x1 + $currentBox.width();
				}

				//判断两个矩形是否有交集
				if (Math.abs((_x1+_x2)-(x1+x2))<(_x2-_x1+x2-x1) &&
					Math.abs((_y1+_y2)-(y1+y2))<(_y2-_y1+y2-y1) ) {
					if (!$currentBox.hasClass("selectDragTemp")) {
						if ($currentBox.hasClass("selectToggleClass")){
							continue;
						}
						if ($currentBox.hasClass(Config.SelectClassName)) {
							$currentBox.removeClass(Config.SelectClassName).addClass("selectToggleClass");
							ui.fileLight.resumeMenu($currentBox);//恢复右键选择
							continue;
						}
						$currentBox.addClass("selectDragTemp");
					}
				}else {
					$currentBox.removeClass("selectDragTemp");
					if ($currentBox.hasClass("selectToggleClass")) {
						$currentBox.addClass(Config.SelectClassName).removeClass("selectToggleClass");
					}
				}
			}
		}
		//框选结束
		var dragSelectEnd = function(e) {
			if (!isSelect) return false;

			//框选结束时重新计算
			setSelectFile();
			$selectDiv.remove();
			$('.selectDragTemp').addClass(Config.SelectClassName).removeClass("selectDragTemp");
			$('.selectToggleClass').removeClass('selectToggleClass');//移除反选掉的div
			ui.fileLight.select();

			isSelect = false;
			startX	 = null;
			startY	 = null;
		};
	};

	var getFileSplitSelectBox = function($target,find){
		var $dom = $('.fileList_list_split .split_box.split_select');
		if($target){//shift 按住后的点击块选
			$dom = $target.parents('.split_box');
		}else if(ui.fileLight.fileListSelect().length!=0){
			var $sel = ui.fileLight.fileListSelect().last();
			$dom = $sel.parents('.split_box');
		}
		return $dom.find(find);
	}
	//文档列表
	var fileList = {
		fileListAll:function($target){
			if(G.user_config.list_type != 'list_split'){
				return ui.fileLight.fileListAll();
			}else{//分栏模式
				return getFileSplitSelectBox($target,'.file');
			}
		},
		fileListSelect:function($target){
			if(G.user_config.list_type != 'list_split'){
				return ui.fileLight.fileListSelect();
			}else{//分栏模式
				return getFileSplitSelectBox($target,'.file.select');
			}
		}
	}

	//获得选中文件【夹】相对位置的文件并返回
	var parsePositionDesktop = function(pose){
		var $listAll = fileList.fileListAll();
		var $listSelect = fileList.fileListSelect();//
		var totalIndex = $listAll.length-1;//总数目
		var position = 0;	//选择的位置，默认为第一个
		var rowNum = ui.getColfileNumberDesktop();		//一列的数目
		var firstIndex = $listAll.index($listSelect.first());
		var lastIndex  = $listAll.index($listSelect.last());
		switch(pose){
			case 'pageup':
			case "up":
				position = ((firstIndex <=0 || (firstIndex) % rowNum == 0)? firstIndex:firstIndex - 1);
				break;
			case "left":
				position = ((firstIndex-rowNum<=0)? 0:firstIndex-rowNum);
				break;
			case 'pagedown':
			case "down":
				position = ((lastIndex >=totalIndex || (lastIndex+1) % rowNum == 0)? lastIndex:lastIndex + 1);
				break;
			case "right":
				position = ((lastIndex+rowNum >=totalIndex)?totalIndex:lastIndex+rowNum);
				break;
			default:break;
		}
		return $listAll.eq(position);
	};

	//获得选中文件【夹】相对位置的文件并返回
	var parsePosition = function(pose){
		if(Config.pageApp == 'desktop'){
			return parsePositionDesktop(pose);
		}
		var $listAll = fileList.fileListAll();
		var $listSelect = fileList.fileListSelect();//
		var totalIndex = $listAll.length-1;//总数目
		var position = 0;//选择的位置，默认为第一个
		var rowNum = ui.getRowfileNumber();	//一行的数目
		var pageNum = ui.getPagefileNumber();
		var firstIndex = $listAll.index($listSelect.first());
		var lastIndex  = $listAll.index($listSelect.last());
		switch(pose){
			case "up":
				position = ((firstIndex-rowNum<=0)? 0:firstIndex-rowNum);
				position = getPostionFilterDisplay(position,false);
				break;
			case "left":
				position = ((firstIndex <=0)? 0:firstIndex - 1);
				break;
			case "down":
				position = ((lastIndex+rowNum >=totalIndex)?totalIndex:lastIndex+rowNum);
				position = getPostionFilterDisplay(position,true);
				break;
			case "right":
				position = ((lastIndex >=totalIndex)? lastIndex:lastIndex + 1);
				break;
			case "pageup":
				position = ((firstIndex-pageNum<=0)? 0:firstIndex-pageNum);
				position = getPostionFilterDisplay(position,false);
				break;
			case "pagedown":
				position = ((lastIndex+pageNum >=totalIndex)?totalIndex:lastIndex+pageNum);
				position = getPostionFilterDisplay(position,true);
				break;
			default:break;
		}
		return $listAll.eq(position);
	};

	/**
	 * 上下按键，处理隐藏的树目录上一个下一个问题
	 * @param  {[type]}  position [description]
	 * @param  {Boolean} isAdd   [description]
	 * @return {[type]}           [description]
	 */
	var getPostionFilterDisplay = function(position,isAdd){
		var $listAll = fileList.fileListAll();
		var $dom = $listAll.eq(position);
		var num = $listAll.length;
		while($dom.parents(".hidden").length!=0){
			if(isAdd){
				position++;
			}else{
				position--;
			}
			if(position<=0 || position>=num){
				return position;
			}
			$dom = $listAll.eq(position);
		}
		return position;
	}

	//设置选中
	var setSelectPos = function(pos){
		var $listAll = fileList.fileListAll();
		var $selectAll = fileList.fileListSelect();

		var $select,$range='',shift = false;
		if(pos.indexOf('shift+')>=0){
			shift = true;
			pos = pos.replace('shift+','');
		}
		switch (pos){
			case 'home':
				$range = $selectAll.last();
				$select = $listAll.first();
				break;
			case 'end':
				$range = $selectAll.first();
				$select = $listAll.last();
				break;
			case 'left':
				$range = $selectAll.last();
				$select = parsePosition(pos);
				break;
			case 'up':
				$range = $selectAll.last();
				$select = parsePosition(pos);
				break;
			case 'right':
				$range = $selectAll.first();
				$select = parsePosition(pos);
				break;
			case 'down':
				$range = $selectAll.first();
				$select = parsePosition(pos);
				break;
			case 'pageup':
				$range = $selectAll.last();
				$select = parsePosition(pos);
				break;
			case 'pagedown':
				$range = $selectAll.first();
				$select = parsePosition(pos);
				break;
			case 'all'://全选
				$select = $listAll;break;
			default:break;
		}

		if(folderTreeOpen(pos)){//左右按键截获
			return;
		}

		//按住shift的选择
		if(shift && $range!=''){
			var from = $listAll.index($range),to=$listAll.index($select);
			if(from>to){
				var temp = from;
				from = to;to=temp;
			}
			selectFromTo(from,to,$listAll);
			return;
		}
		fileSetSelectStatus($select);
	};

	//只选择一个
	var fileSetSelectStatus = function($sel){
		if($sel.length==0) return;
		ui.fileLight.clear();
		$sel.addClass(Config.SelectClassName);
		ui.fileLight.select();
		ui.fileLight.setInView();//列表分栏，选中后展开下一层目录

		if( G.user_config.list_type == 'list_split' && $sel.length==1){
			fileOpenChildrenSplit($(ui.fileLight.fileListSelect()[0]));
		}
	}

	/**
	 * 左右按键，展开收缩文件夹
	 * @return {[type]} [description]
	 */
	var folderTreeOpen = function(pos){
		var $focus = $(ui.fileLight.fileListSelect()[0]);
		if(G.user_config.list_type == 'icon'){
			return false;
		}
		switch (pos){
			case 'left':
				if(G.user_config.list_type =='list'){
					if($focus.find('.children_more_cert.cert_open').length==1){
						$focus.find('.children_more_cert').removeClass('cert_open');
						$focus.next().addClass('hidden');
					}else{
						var $sel = $focus.parent('.children_list').prev('.file');
						fileSetSelectStatus($sel);
					}
				}else if(G.user_config.list_type == 'list_split'){
					var $sel = $focus.parents('.split_box').prev().find('.select_split_parent');
					fileSetSelectStatus($sel);
				}
				break;
			case 'right':
				if(G.user_config.list_type =='list'){
					if($focus.find('.children_more_cert').length==1){
						ui.fileContent.pathChildrenTree($focus);
						$focus.find('.children_more_cert').addClass('cert_open');
						$focus.next().removeClass('hidden');
					}
				}else if(G.user_config.list_type == 'list_split'){
					var $sel = $focus.parents('.split_box').next().find('.file:eq(0)');
					fileSetSelectStatus($sel);
				}
				break;
			default:
				return false;
				break;
		}
		return true;
	}

	//shift 选择，ctrl+上下左右选择
	var selectFromTo = function(from,to,$listAll){
		if(Config.pageApp == 'desktop'){
			return selectFromToDesktop(from,to,$listAll);
		}		
		ui.fileLight.clear();
		for (var i = from; i <= to; i++) {
			$($listAll[i]).addClass(Config.SelectClassName);
		}
		ui.fileLight.select();
	};
	var selectFromToDesktop = function(from,to,$listAll){
		var colNum  = ui.getColfileNumberDesktop();		//一列的数目
		var rowNum  = Math.ceil(fileList.fileListAll().length / colNum);		//一行的文件数
		var from    = {row:from % colNum,col:parseInt(from / colNum)};
		var to      = {row:to % colNum,col:parseInt(to / colNum)};

		if(to.row < from.row){
			var temp = to;
			to = from;
			from = temp;
		}
		var selectItem = function(row,col){
			var index = col* colNum  + row;
			$($listAll[index]).addClass(Config.SelectClassName);
		}

		ui.fileLight.clear();
		for (var i = from.row; i <= to.row; i++) {
			var minCol = 0,maxCol = rowNum;
			if(i == from.row){
				minCol = from.col;
			}
			if(i == to.row){
				maxCol = to.col;
			}
			for (var j = minCol; j <= maxCol; j++) {
				selectItem(i,j);
			}
		}
		ui.fileLight.select();
	};


	// 文件拖拽到桌面，下载文件
	var dragOutWindow = function(){
		//拖拽下载 https://www.thecssninja.com/javascript/gmail-dragout
		$.event.props.push("dataTransfer");
		$('[draggable=true]').live("dragstart", function(evt) {
			var $this = $(this);
			var fileName = trim($this.find('.filename').text());
			var downloadUrl = core.path2url(pathHashDecode($this.attr('data-path')));
			var dataTransfer = evt.dataTransfer;
			dataTransfer.effectAllowed = 'copy';
			dataTransfer.dropEffect = 'copy';
			dataTransfer.setData("DownloadURL",'application/text:'+fileName+':'+downloadUrl);
		});
	}

	//对外接口
	return {
		init:function(){
			bindEvent();
			bindEventSplitBox();
			bindDragEvent();
			bindBoxSelectEvent();
		},
		isDraging:function(){
			return isDraging;
		},
		selectSplit:selectSplit,
		selectPos:setSelectPos//快捷键绑定
	}
});


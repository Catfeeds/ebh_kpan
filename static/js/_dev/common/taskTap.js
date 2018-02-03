define(function(require, exports) {
	var dialogs			= {};
	var dialog_focus_id = '';
	var animate_time	= 160;
	var bindTab = function(){
		$('.task_tab .tab').die('mouseenter').live('mouseenter',function (e) {
			if (!$(this).hasClass('this')){
				$(this).addClass('hover');
			}
		}).die('mouseleave').live('mouseleave',function(){
			$(this).removeClass('hover');
		});
	};
	var tabClick = function($dom){
		var id = $dom.attr('id');
		var dialog = $.dialog.list[id];
		if(dialog == undefined){
			close(id);
			return;
		}
		var dom = $('.'+id);
		if (dom.css('visibility') == 'hidden'){
			dialog.display(true).zIndex();
		}else if(dom.hasClass('aui_state_focus')){
			dialog.display(false);
		}else{
			dialog.zIndex();
		}
	}

	// 拖拽——移动
	var bindDrag = function(){
		var $self,$tabs,$drag,
			isDragInit= false,
			isDraging = false,
			first_left= 0,
			box_left  = 0,
			tab_width = 0,
			tab_margin= 0,
			tab_parent_width= 0,
			tab_parent_left = 0,
			current_animate_id;	//标签切换，当前动画所在的标签
		$('.task_tab .tab').die('mousedown').live('mousedown',function(e){
			if(e.which !=1) return;
			$self = $(this);
			dragStart(e);

			//事件 在 window之外操作，继续保持。
			if(this.setCapture) this.setCapture();
			$(document).mousemove(function(e) {dragMove(e);});
			$(document).one('mouseup',function(e) {
				dragEnd();
				if(this.releaseCapture) {this.releaseCapture();}
				//大于一定范围则认为是拖拽，停止click事件
				if(Math.abs(e.pageX - first_left)<10){
					tabClick($self);
				}
				//stopPP(e);return false;
			});
			//stopPP(e);return false;
		});
		var dragStart = function(e){
			isDragInit = true,
			isDraging = true;
			first_left = e.pageX;
			$tab_parent  = $('.task_tab');
			$tabs = $('.task_tab .tab');
			$(".tasktab-dragging").remove();
			$drag = $self.clone().addClass("tasktab-dragging").prependTo('body');

			tab_margin= $sizeInt($tabs.css('margin-right'));
			tab_parent_width = $tab_parent.width();
			tab_parent_left  = $tab_parent.get(0).getBoundingClientRect().left;
			tab_parent_left  = tab_parent_left+$(window).scrollLeft();
			box_left = $self.get(0).getBoundingClientRect().left;
			tab_width = $sizeInt($tabs.css('width'));

			var top = $self.get(0).getBoundingClientRect().top-$sizeInt($self.css('margin-top'));
			var left = e.clientX - first_left + box_left;

			$('body').prepend("<div class='dragMaskView'></div>");
			$drag.css({'width':tab_width+'px','top':top,'left':left});
			$self.css('opacity',0);
		};
		var dragMove = function(e){
			if (!isDraging) return;
			window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
			if(isDragInit==false){
				dragStart(e);
			}
			var left = e.clientX - first_left + box_left;
			if (left < tab_parent_left
				|| left > tab_parent_left+tab_parent_width-tab_width){
				return;// 拖出边界则不处理
			}
			$drag.css('left',left);
			$tabs.each(function(i) {
				var t_left = $(this).get(0).getBoundingClientRect().left;
				if (left > t_left && left < t_left+tab_width/2+tab_margin){
					if ($self.attr('id') == $(this).attr('id')) {
						return;//当前区域移动，没有超过左右过半
					}
					change($(this).attr('id'),'left');
				}
				if (left > t_left-tab_width/2+tab_margin && left < t_left){
					if ($self.attr('id') == $(this).attr('id')) {
						return;//当前区域移动，没有超过左右过半
					}
					change($(this).attr('id'),'right');
				}
			});
		};
		// 标签交换位置
		var change  = function(id,change){
			//chrome标签类似动画，动画进行中，，且为当前标签动画则继续
			if ($self.is(":animated")
				&& current_animate_id == id){
				return;
			}
			//处理上次动画结束事物
			current_animate_id = id;
			$self.stop(true,true);
			$('.insertTemp').remove();
			$tabs = $('.task_tab .tab');

			var temp,width = $self.width();
			var $move = $('.task_tab #'+id);
			var	$insert = $self.clone(true).insertAfter($self)
				.css({'margin-right':'0px','border':'none'}).addClass('insertTemp');

			if (change == 'left') {
				$self.after($move).css('width','0px');
			}else{
				$self.before($move).css('width','0px');
				$move.before($insert);
			}
			$self.animate({'width':width+'px'},animate_time);
			$insert.animate({'width':'0px'},animate_time,function(){
				$(this).remove();
				$tabs = $('.task_tab .tab');
			});
		};

		var dragEnd = function(){
			isDraging = false;
			isDragInit= false;
			startTime = 0;
			$('.dragMaskView').remove();
			if ($drag == undefined) return;
			box_left = $self.get(0).getBoundingClientRect().left;
			$drag.animate({left:box_left+'px'},animate_time,function(){
				$self.css('opacity',1);
				$(this).remove();
			});
		};
	};

	var resetWidth = function(action){
		var max_width	= 110;
		var reset_width = max_width;
		var max_width_all = max_width+12;
		var $tabs		= $('.task_tab .tab');
		var full_width	= $('.task_tab .tabs').width()-10;
		var count		= $tabs.length;

		//不用变化的个数
		var max_count = Math.floor(full_width/max_width_all);
		if (count > max_count) {
			reset_width = Math.floor(full_width/count)-12;
		}
		switch (action) {
			case 'add':
				$('.task_tab .tabs .this').css('width','0')
				.animate({'width':reset_width+'px'},animate_time);
			case 'close':
				$tabs.animate({width:reset_width+'px'},animate_time);
				break;
			case 'resize':
				$tabs.css('width',reset_width+'px');
				break;
			default:break;
		}
	}
	var add = function(id,title){
		$('.task_tab').removeClass('hidden');
		var title_hover = title.replace(/<[^>]+>/g,"");
		var html_tab = '<div class="tab taskBarMenu" id="'+id+'" title="'+title_hover+'">'+title+'</div>';
		$(html_tab).insertBefore('.task_tab .last');
		resetWidth('add');
		dialogs[id] = {id:id,name:name};
	};
	//选中
	var focus = function(selectID) {
		//添加最初标签，或者标签不存在
		$('.task_tab .this').removeClass('this');
		$('.task_tab #'+selectID).addClass('this');
		dialog_focus_id = selectID;
	};
	//删除
	var close = function(selectID) {
		$('.task_tab #'+selectID).animate({width:0},animate_time,function(){
			$('.task_tab #'+selectID).remove();
			resetWidth('close');
			if ($('.tabs .tab').length == 0
				&& Config.pageApp!='desktop') {
				var task_tab_width = 31;
				$('.task_tab').animate({bottom:'-'+task_tab_width+'px'},200,0,function(){
					$(this).css({bottom:'0px'}).addClass('hidden');
				});
			}
		});
		delete dialogs[selectID];
	};

	//绑定任务栏
	var bindDialogTitleMenu = function(){
		$('<i class="dialog_menu"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.dialog_menu',
			items: {
				"dialog_quite":{name:LNG.close,className:"dialog_quite",icon:"remove",accesskey: "q"},
				"dialog_max":{name:LNG.dialog_max,className:"dialog_max",icon:"resize-full",accesskey: "a"},
				"dialog_min":{name:LNG.dialog_min,className:"dialog_min",icon:"minus",accesskey: "i"},
				"sep1":"--------",
				"refresh":{name:LNG.refresh,className:"refresh",icon:"refresh",accesskey: "r"},
				"open_window":{name:LNG.open_ie,className:"open_window",icon:"globe",accesskey: "b"},
				"qrcode":{name:LNG.qrcode,className:"qrcode",icon:"qrcode",accesskey: "c"}
			},
			callback: function(key, options) {
				var id =options.$trigger.attr('id');
				var dialog = $.dialog.list[id];
				switch(key){
					case 'dialog_quite':dialog.close();break;
					case 'dialog_min':dialog._clickMin(false);break;
					case 'dialog_max':dialog._clickMax();break;
					case 'refresh':dialog.refresh();break;
					case 'open_window':dialog.open_window();break;
					case 'qrcode':core.qrcode(dialog.DOM.wrap.find('iframe').attr('src'));break;
					default:break;
				}
			}
		});
		$('.aui_title img,.aui_title .x-item-file').die('click').live('click',function(e){
			var offset = $(this).offset();
			offset.top  += $(this).outerHeight();
			$(this).parent().parent().contextMenu({x:e.pageX,y:offset.top});
		}).die('dblclick').live('dblclick',function(e){
			var id = $(this).parent().parent().attr('id');
			var dialog = $.dialog.list[id];
			dialog.close();
			rightMenu.hidden();
		});
	};


	//绑定任务栏 程序标签
	var bindTaskBar = function(){
		$('<i class="taskBarMenu"></i>').appendTo('#rightMenu');
		$.contextMenu({
			zIndex:9999,
			selector: '.taskBarMenu',
			items: {
				"quitOthers":{name:LNG.close_others,className:"quitOthers",icon:"remove-circle",accesskey: "o"},
				"quit":{name:LNG.close,className:"quit",icon:"remove",accesskey: "q"}
			},
			callback: function(key, options) {
				var id =options.$trigger.attr('id');
				var dialog = $.dialog.list[id];
				switch(key){
					case 'quitOthers':
						$.each($.dialog.list,function(index,dlg){
							if(id != index) dlg.close();
						});
						break;
					 case 'quit':dialog.close();break;
				}
			}
		});
	};
	//绑定任务栏
	var bindTask = function(){
		$.contextMenu({
			zIndex:9999,
			selector: '.task_tab',
			items: {
				"closeAll":{name:LNG.dialog_close_all,icon:"remove-circle",accesskey: "q"},
				"showAll":{name:LNG.dialog_display_all,icon:"th-large",accesskey: "s"},
				"hideAll":{name:LNG.dialog_min_all,icon:"remove",accesskey: "h"}
			},
			callback: function(key, options) {
				var id =options.$trigger.attr('id');
				var dialog = $.dialog.list[id];
				switch(key){
					case 'showAll':
						$.each($.dialog.list,function(index,dlg){
							dlg.display(true);
						});
						break;
					case 'hideAll':
						$.each($.dialog.list,function(index,dlg){
							dlg.display(false);
						});
						break;
					case 'closeAll':
						$.each($.dialog.list,function(index,dlg){
							dlg.close();
						});
						break;
					default:break;
				}
			}
		});
	};

	//----------------------------------------
	//交互只能完成基本功能，如果同时调用对话框，会形成死循环。
	return {
		add:add,
		focus:focus,
		close:close,
		init:function(){
			var html =
				'<div class="task_tab"><div class="tabs">'+
				'<div class="last" style="clear:both;"></div></div></div>';
			$(html).appendTo('body');
			if (Config.pageApp != 'desktop') {
				$('.task_tab').addClass('hidden');
			}
			$(window).bind("resize",function(){
				resetWidth('resize');
			});
			bindTab();
			bindDialogTitleMenu();
			bindTaskBar();
			bindTask();
			bindDrag();
		}
	}
});

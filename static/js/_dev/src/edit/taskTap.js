define(function(require, exports) {
	var bindTab = function(){
		$('.edit_tab .tab').live('mouseenter',function (e) {
			$(this).addClass('hover');
			$(this).unbind("mousedown").mousedown(function(e){
				if (e.which==1 && !$(this).hasClass('this') && !$.nodeName(e.target,'A')){
					$(this).removeClass('hover').addClass('this');
					Editor.select($(this).attr('uuid'));
					//return false;
				}
			}).unbind('mouseup').mouseup(function(e){
				if (e.which==2){//鼠标中建，关闭标签
					Editor.remove($(this).attr('uuid'));
				}
			});
		}).die('mouseleave').live('mouseleave',function(){
			$(this).removeClass('hover');
		}).die('dblclick').live('dblclick',function(e){//双击关闭标签
			//Editor.remove($(this).attr('uuid'));
			//Toolbar.doAction('fullscreen');
			stopPP(e);
		});
		$('.edit_tab').die('dblclick').live('dblclick',function(e){
			Editor.add();stopPP(e);
		});
		$('.edit_tab .tab .close').live('click',function (e) {
			var id = $(this).parent().attr('uuid');
			Editor.remove(id);
		});
	};
	var menuHidden = function(){
		$('.context-menu-list').filter(':visible').trigger('contextmenu:hide');
	};
	var bindMenu = function(){//右键绑定
		$('body').click(menuHidden).contextmenu(menuHidden);
		$.contextMenu({
			zIndex:9999,
			selector: '.edit_tab_menu',
			items: {
				"refresh":{name:LNG.refresh+'<b>F5</b>',className:"refresh_tab",icon:"refresh",accesskey: "e"},
				"sep1": "---------",
				"close":{name:LNG.close,icon:"remove",className:"close_self",accesskey: "d"},
				"close_left":{name:LNG.close_left,icon:"remove-sign",className:"close_left",accesskey: "l"},
				"close_right":{name:LNG.close_right,icon:"remove-sign",className:"close_right",accesskey: "r"},
				"close_others":{name:LNG.close_others,icon:"remove-sign",className:"close_others",accesskey: "o"},
				"sep2":"--------",
				"open_the_path":{name:LNG.open_the_path,icon:"plus",className:"edit_open_the_path",accesskey: "n"},
				"preview":{name:LNG.preview,icon:"globe",className:"edit_preview",accesskey: "p"}
			},
			callback: function(key, options) {
				var $item =options.$trigger;
				var id = $item.attr('uuid');
				switch(key){
					case 'refresh':Editor.refresh(id);break;
					case 'close':Editor.remove(id);break;
					case 'close_left':
						var index = $('.edit_tab .tabs .tab').index($item);
						$('.edit_tab .tabs .tab:lt('+index+')').each(function(){
							Editor.remove($(this).attr('uuid'));
						});
						break;
					case 'close_right':
						var index = $('.edit_tab .tabs .tab').index($item);
						$('.edit_tab .tabs .tab:gt('+index+')').each(function(){
							Editor.remove($(this).attr('uuid'));
						});
						break;
					case 'close_others':
						$('.edit_tab .tabs .tab').each(function(){
							var uuid = $(this).attr('uuid');
							if (uuid != id) {
								Editor.remove(uuid);
							}
						});
						break;
					case 'open_the_path':
						var file_name = $item.attr('title');
						if(file_name==''){
							Tips.tips(LNG.not_exists,'warning');
							return;
						}
						var path = core.pathFather(file_name);
						var top = ShareData.frameTop();
						top.core.openPath(path);//father
						break;
					case 'preview':Toolbar.doAction('preview');break;
					default:break;
				}
			}
		});
	};

	// 拖拽——移动
	var bindDrag = function(){
		var $self,$tabs,$drag,
			isDraging = false,
			isDragInit= false,
			first_left= 0,
			box_left  = 0,
			first_top = 0,
			tab_height= 0,
			tab_width = 0,
			tab_margin= 0,
			tab_parent_width= 0,
			tab_parent_left = 0,
			current_animate_id; //标签切换，当前动画所在的标签
		$('.edit_tab .tab').die('mousedown').live('mousedown',function(e){
			if ($.nodeName(e.target,'A')) {
				return ;
			}else if($.nodeName(e.target,'SPAN')) {
				$self = $(e.target).parent();
			}else {
				$self = $(this);
			}
			if(e.which!=1){
				return;
			}
			isDraging = true;
			//事件 在 window之外操作，继续保持。
			if(this.setCapture) this.setCapture();
			$(document).mousemove(function(e) {dragMove(e);});
			$(document).one('mouseup',function(e) {
				dragEnd(e);
				if(this.releaseCapture) {this.releaseCapture();}
			});
			// stopPP(e);return false;
		});
		var dragStart = function(e){
			isDragInit = true,
			first_left = e.pageX;
			first_top  = e.pageY;
			$tab_parent  = $('.edit_tab');
			$tabs = $('.edit_tab .tab');
			$(".draggable-dragging").remove();
			$drag = $self.clone().addClass("draggable-dragging").prependTo('body');

			tab_margin= $sizeInt($tabs.css('margin-right'));
			tab_parent_width = $tab_parent.width();
			tab_parent_left  = $tab_parent.get(0).getBoundingClientRect().left;
			tab_parent_left  = tab_parent_left+$(window).scrollLeft();
			box_left = $self.get(0).getBoundingClientRect().left;
			tab_width = $sizeInt($tabs.css('width'));
			tab_height = $sizeInt($tabs.css('height'));

			var top = $self.get(0).getBoundingClientRect().top-$sizeInt($self.css('margin-top'));
			var left = e.clientX - first_left + box_left;

			$('body').prepend("<div class='dragMaskView'></div>");
			$drag.css({'width':tab_width+'px','top':top,'left':left});
			$self.css('opacity',0);
		};
		var dragMove = function(e){
			if (!isDraging) return;
			if(isDragInit==false){
				dragStart(e);
			}

			var left = e.clientX - first_left + box_left;
			var top  = e.clientY - first_top + tab_height;

			// 位移小则忽略
			// if( Math.abs(e.clientX - first_left)<10 &&
			// 	Math.abs(e.clientY - first_top)<10){
			// 	left = box_left;
			// 	top  = tab_height;
			// }

			// if (left < tab_parent_left
			// 	|| left > tab_parent_left+tab_parent_width-tab_width){
			// 	return;// 拖出边界则不处理
			// }
			$drag.css({'left':left,'top':top});
			$tabs.each(function(i) {
				var t_left = $(this).get(0).getBoundingClientRect().left;
				if (left > t_left && left < t_left+tab_width/2+tab_margin){
					if ($self.attr('uuid') == $(this).attr('uuid')) {
						return;//当前区域移动，没有超过左右过半
					}
					change($(this).attr('uuid'),'left');
				}
				if (left > t_left-tab_width/2+tab_margin && left < t_left){
					if ($self.attr('uuid') == $(this).attr('uuid')) {
						return;//当前区域移动，没有超过左右过半
					}
					change($(this).attr('uuid'),'right');
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
			$tabs = $('.edit_tab .tab');

			var temp,width = $self.width();
			var $move = $('.edit_tab .tab_'+id);
			var $insert = $self.clone(true).insertAfter($self)
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
				$tabs = $('.edit_tab .tab');
			});
		};

		var dragEnd = function(e){
			//if (!isDraging) return false;
			isDraging = false;
			isDragInit= false;
			startTime = 0;
			$('.dragMaskView').remove();

			//点击事件回调会影响两个事件：选择，和拖拽弹起，
			//此处后执行，设置需要再次设置焦点;窗口大小发生变化时切换到其他tab,文本区域刷新问题。
			Editor.current() && Editor.current().focus();
			if ($drag == undefined) return;

			var box_left = $self.get(0).getBoundingClientRect().left;
			var box_top = $self.get(0).getBoundingClientRect().top;
			$drag.animate({left:box_left+'px',top:box_top+'px'},animate_time,function(){
				$self.css('opacity',1);
				$(this).remove();
			});
		};
	};

	var resetWidth = function(action,dom,selectID){
		if(action == 'remove'){
			dom.removeClass('edit_tab_menu');
		}
		var time = animate_time*1.4;
		var max_width   = 150;
		var reset_width = max_width;
		var $tabs       = $('.edit_tab .tab.edit_tab_menu');//最新的tab；动画中分开
		var full_width  = $sizeInt($('.edit_tab .tabs').width());
		var margin      = $sizeInt($tabs.css('margin-right')) + $sizeInt($tabs.css('border-right'));
		var add_width   = $sizeInt($('.edit_tab .add').css('width'))+30;
		var count       = $tabs.length;

		//不用变化的个数
		var max_count = Math.floor((full_width-add_width)/(max_width+margin));
		if (count > max_count) {
			reset_width = Math.floor((full_width - add_width)/count) - margin;
		}
		switch (action) {
			case 'add':
				$('.edit_tab .tabs .this')
					.css({'margin-top':'30px','width':reset_width})
					.stop(1,1).animate({'margin-top':'0px'},time);
				$tabs.animate({width:reset_width+'px'},time);
				break;
			case 'remove':
				if (selectID!=undefined) Editor.select(selectID);
				dom.stop(1,1).animate({'width':'0','margin-top':'+=30'},time,function(){
					dom.remove();
				});
				$tabs.stop(1,1).animate({width:reset_width+'px'},time);
				break;
			case 'resize':
				$tabs.css('width',reset_width+'px');
				break;
			default:break;
		}
	}

	return {
		rightMenu:{
			hidden:menuHidden
		},
		resetWidth:resetWidth,
		init:function(){
			bindTab();
			bindDrag();
			bindMenu();
		}
	};
});

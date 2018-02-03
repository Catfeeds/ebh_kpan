define(function(require, exports, module) {
	var bindFrameSizeEvent= function(){
		var isDraging 		= false;
		var mouseFirst		= 0;
		var leftwidthFirst 	= 0;
		var min_width		= 0;//最小宽度

		var $left = $('.frame-left');
		var $drag = $('.frame-resize');
		var $right= $('.frame-right');

		$drag.die('mousedown').live('mousedown',function(e){
			if (e.which != 1) return true;
			dragStart(e);
			//事件 在 window之外操作，继续保持。
			if(this.setCapture) this.setCapture();
			$(document).mousemove(function(e) {dragMove(e);});
			$(document).one('mouseup',function(e) {				
				dragEnd(e);
				if(this.releaseCapture) {this.releaseCapture();}
				stopPP(e);return false;
			});
			stopPP(e);
			return false;
		});
		var dragStart = function(e){
			isDraging = true;
			mouseFirst = e.pageX;
			leftwidthFirst = $('.frame-left').width();
			$drag.addClass('active');
			$('.resizeMask').css('display','block');
		};
		var dragMove = function(e){
			if (!isDraging) return true;
			var mouseOffset = e.pageX - mouseFirst;
			var offset = leftwidthFirst+mouseOffset;
			if (offset < min_width) offset = min_width;
			if (offset > $(document).width()-200) offset = $(document).width()-200;

			$left.css('width',offset);
			$drag.css('left',offset-5);
			$right.css('left',offset+1);
		};
		var dragEnd = function(e){
			if (!isDraging) return false;
			isDraging = false;
			$drag.removeClass('active');
			$('.resizeMask').css('display','none');
		};
	};
	var bindToolbar = function(){
		$('.tools-left a').click(function(e){
			var action = $(this).attr('class');
			switch(action){
				case 'home':tree.init();break;
				case 'view':tree.explorer();break;
				case 'folder':tree.create('folder');break;
				case 'file':tree.create('file');break;
				case 'refresh':tree.init();break;
				default:break;
			}
		});
	};
	return{	
		init:function(){
			bindFrameSizeEvent();
			bindToolbar();
			tree.init();
			
			Mousetrap.bind(['ctrl+s', 'command+s'],function(e) {
				e.preventDefault();e.returnvalue = false;
				ShareData.frameTop('OpenopenEditor',function(page){
					page.Editor.save();
				});
			});
		},
		setTheme:function(thistheme){
			core.setSkin(thistheme,'app_editor.css');
			ShareData.frameTop('OpenopenEditor',function(page){
				page.Editor.setTheme(thistheme);
			});
		},
		//编辑器全屏
		editorFull:function(){
			var $frame = $('iframe[name=OpenopenEditor]');
			$frame.toggleClass('frame_fullscreen');
		},
		fileHistory:function(list){
			var key = G.project;
			if(typeof(G.sid) != 'undefined'){
				key = key + "__"+ G.sid;
			}
			key = "editorHistory_"+key;
			if(list == undefined){
				var arr = LocalData.get(key);
				arr = jsonDecode(arr);
				if(!$.isArray(arr)){
					arr = [];
				}
				return arr;
			}else{
				LocalData.set(key,jsonEncode(list));
			}
		}
	}
});

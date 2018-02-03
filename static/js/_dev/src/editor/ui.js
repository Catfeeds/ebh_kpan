define(function(require, exports, module) {
	var bindToolbar = function(){
		$('.tools-left a').click(function(e){
			var action = $(this).attr('class');
			switch(action){
				case 'home':tree.init();break;
				case 'view':tree.explorer();break;
				case 'folder':tree.create('folder');break;
				case 'file':tree.create('txt');break;
				case 'refresh':tree.refresh();break;
				default:break;
			}
		});
	};
	return{	
		init:function(){
			tree.init();
			bindToolbar();
			Mousetrap.bind(['ctrl+s', 'command+s'],function(e) {
				e.preventDefault();e.returnvalue = false;
				ShareData.frameTop('OpenopenEditor',function(page){
					page.Editor.save();
				});
			});
		},
		setTheme:function(thistheme){
			core.setSkin(thistheme);
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

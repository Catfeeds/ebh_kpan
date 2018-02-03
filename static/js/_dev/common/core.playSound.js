define(function(require, exports) {
	var arr = {
		"file_remove":"file_remove.mp3",
		"recycle_clear":"recycle_clear.mp3",
		"folder_open":"folder_open.mp3",
		"window_min":"window_min.mp3",
		"error":"error_tips.mp3",
		"drag_upload":"drag_upload.mp3",
		"drag_drop":"drag_drop.mp3"//拖拽移动，zip压缩
	};

	var playSoundFile = function(sound){
		var playerKey = 'x-play-sound';
		if($('.'+playerKey).length == 0){
			$('<div style="width:0px;height:0px;" class="'+playerKey+'"></div>').appendTo('body');
		}
		var url = G.static_path+"others/sound/"+sound;
		var myPlayer = require('./myPlayer');
		myPlayer.playSound(url,$('.'+playerKey));
	}
	//对外接口
	return {
		playSoundFile:playSoundFile,
		playSound:function(type){
			if(G && G.user_config && G.user_config.sound_open == '1'){
				setTimeout(function(){
					playSoundFile(arr[type]);
				},100);
			}
		}
	}
});


define(function(require, exports) {
	var downloadUrl = 'index.php?share/fileDownload&user='+G.user+'&sid='+G.sid;
	var showUrl = 'index.php?share/fileProxy&user='+G.user+'&sid='+G.sid;
	if(G.param_rewrite=="1"){
		downloadUrl = downloadUrl.replace("index.php?","index.php/");
	}
	var initTopbar =function(){
		//非文件页面

		if(G.share_info['type']!='file' && typeof(G.path)!='undefined'){//文件预览
			showUrl+= '&path='+G.path;
			downloadUrl+= '&path='+G.path;
			$('.btn.button_my_share').hide();
			$('.share_info_user .btn-group').show();//下载+分享
		}else{
			$('.btn.button_my_share').show();
			$('.share_info_user .btn-group').hide();//分享
		}
		if (G.share_info['type']=='file') {
			$('.btn.button_my_share').hide();
			$('.share_info_user .btn-group').show();//下载+分享
		}

		if(G.share_info['not_download'] == '1'){
			downloadUrl = "javascript:Tips.tips('"+LNG.share_not_download_tips+"',false);"
		}

		//信息展示
		$('.share_info_user').removeClass('hidden');
		$('.btn_download').attr('href',downloadUrl);
		var time = date('Y/m/d H:i:s',G.share_info['mtime']);
		$('.topbar .time').html(time);
		if (G.share_info['type'] == 'file') {
			$('.topbar .size').html(G.share_info['size']);
		};
		$('.topbar .info').html(LNG.share_view_num+G.share_info['num_view']+'  '+
								LNG.share_download_num+G.share_info['num_download']);
		$('#button_share').die('click').live('click',function(){
			share();
		});
	}
	return{	
		init:initTopbar
	}
});

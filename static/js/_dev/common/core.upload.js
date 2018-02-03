define(function(require, exports) {
	var uploadUrl = function(){
		//上传地址  跳转到uppan项目
		var url = 'http://uppan.ebh.net/kupload.html?&crid='+G.crid+'&uid='+G.uid+'&auth='+G.auth+'&path='+G.this_path;
		return url;
		/*
		var url  = G.app_host+'index.php?explorer/fileUpload';
		if(G['share_page']=="share" && G.share_info["can_upload"]=="1"){
			url  = G.app_host+'index.php?share/fileUpload&user='+G.user+'&sid='+G.sid;
		}
		return url;
		*/
	};
	
	var checkUrl = function(){
		//文件上传前 md5验证 实现秒传
		var url = 'http://uppan.ebh.net/kupload/checkfile.html?&crid='+G.crid+'&uid='+G.uid+'&auth='+G.auth+'&path='+G.this_path;
		return url;
	};
	
	return {
		serverDwonload:function(url,path){
			core.uploadCheck('explorer:serverDownload');
			var $box = $('.download_box'),
				$list=$box.find('.download_list');

			$box.find('input').val('');
			//url为空或不对
			if (!url) {
				Tips.tips('url false!',false);
				return;
			}
			//自动补全
			if( url.substr(0,3) != 'ftp' &&
				url.substr(0,4)!='http'){
				url = 'http://'+url;
			}
			var uuid = UUID();
			var html = '<div id="' + uuid + '" class="item">' +
				'<div class="info"><span class="title" tytle="'+url+'">'+core.pathThis(url)+'</span>'
				+ '<span class="size">0b</span>'
				+ '<span class="state">'+LNG.upload_ready+'</span>'
				+ '<a class="remove font-icon icon-remove" href="javascript:void(0)"></a>'
				+ '<div style="clear:both"></div></div></div>';
			if ($list.find('.item').length>0) {
				$(html).insertBefore($list.find('.item:eq(0)'))
			}else{
				$list.append(html)
			}
			var repeatTime,delayTime,preInfo,preSpeed=0,
				$li=$('#'+uuid),
				$state=$('#'+uuid+' .state').text(LNG.download_ready),
				$percent = $('<div class="progress progress-striped active">' +
				'<div class="progress-bar" role="progressbar" style="width: 0%;text-align:right;">'+
				'</div></div>').appendTo('#'+uuid).find('.progress-bar');

			$('#'+uuid+' .remove').bind('click',function(e){
				clearInterval(repeatTime);repeatTime=false;
				clearTimeout(delayTime);delayTime=false;
				$.get('./index.php?explorer/serverDownload&type=remove&uuid='+uuid);
				$(this).parent().parent().slideUp(function(){
					$(this).remove();
					ui.f5();
				});
			});

			var changeDelayTimer;//快速变化屏蔽
			var pathReload = function(select){
				clearTimeout(changeDelayTimer);changeDelayTimer=false;
				changeDelayTimer = setTimeout(function(){
					ui.f5Callback(function(){
						ui.path.setSelectByFilename(select);
					});
				},600);
			}

            var downloadRequest = function(){
                $.ajax({//开始下载文件
    				url:'./index.php?explorer/serverDownload&type=download&save_path='+path+
    					'&url='+urlEncode(url)+'&uuid='+uuid+"&time="+time(),
    				dataType:'json',
    				error:function(a, b, c){
    				    var pro = $li.data('progcess');
    				    if(a.status != 200 &&  //断点续传继续
    				       pro && pro['support_range']){
    				        setTimeout(function(){
    				            downloadRequest();
			                },1000);
    				        return;
    				    }

    					core.ajaxError(a, b, c);
    					if(a.status != 200){
    						return;
    					}
    					clearInterval(repeatTime);repeatTime=false;
    					clearTimeout(delayTime);delayTime=false;
    					$percent.parent().remove();
    					$state.addClass('error').text(LNG.download_error);
    				},
    				success:function(data){
    				    if(data.code == false && data.data == 'downloading'){
    				        setTimeout(function(){
    				            downloadRequest();
			                },1000);
    				        return;
    				    }
    					if (!data.code) {
    						$state.addClass('error').text(data.data);
    						$state.parent().parent().addClass('error');
    					}else{
    						pathReload(data.info);
    						$state.text(LNG.download_success);
    						$('#'+uuid+' .info .title').text(core.pathThis(data.info))
    						$('#'+uuid+' .info .title').attr('title',data.info);
    						$state.parent().parent().addClass('success');
    					}
    					clearInterval(repeatTime);repeatTime=false;
    					clearTimeout(delayTime);delayTime=false;
    					$percent.parent().remove();
    				}
    			});
            }
			downloadRequest();
			
			var ajaxProcess = function(){//定时获取下载文件的大小，计算出下载速度和百分比。
				$.ajax({
					url:'./index.php?explorer/serverDownload&type=percent&uuid='+uuid,
					dataType:'json',
					success:function(data){
						var speedStr = '',info = data.data;
						if (!repeatTime) return;
						if (!data.code) {//header获取
							$state.text(LNG.loading);
							return;
						}
						if (!info) return;
						
						info.size = parseFloat(info.size);
						info.time = parseFloat(info.time);
						if (preInfo){
							var speed = (info.size-preInfo.size)/(info.time-preInfo.time);
							//速度防跳跃缓冲 忽略掉当前降低到20%的当前次
							if (speed*0.2 < preSpeed) {
								var temp = preSpeed;
								preSpeed = speed;
								speed = temp;
							}else{
								preSpeed = speed;
							}
							var temp = core.fileSize(speed);
							temp = temp?temp:0;
							speedStr = temp+"/s";
						}
						
						$li.data('progcess',info);
						if (info['length']==0){ //总长度未知
							$li.find('.progress-bar').css('width','100%' );
							$state.text(speedStr);
							$li.find('.size').text(core.fileSize(info.size));
						}else{
							var percent = info.size/info.length*100;
							$li.find('.progress-bar').css('width', percent+'%');
							$state.text(percent.toFixed(1)+'%('+speedStr+')');
							$li.find('.size').text(core.fileSize(info.length));
						}
						$li.find('.title').text(info['name']);
						preInfo = info;
					}
				});
			};

			delayTime = setTimeout(function(){
				ajaxProcess();
				repeatTime = setInterval(function(){
					ajaxProcess();
				},1000);
			},100);
		},

        //============================================================
		//http://itindex.net/detail/49267
		upload:function() {
			var url  = uploadUrl();
			uploader.option('server',url);
			uploader.option('method', 'POST');
			if ($('.dialog_file_upload').length != 0) {//有对话框则返回
				$.dialog.list['dialog_file_upload'].display(true);
				return;
			}
			
			var render = template.compile(tpl_upload);
			var maxsize = WebUploader.Base.formatSize(G.upload_max);
			$.dialog({
				padding:5,
				// height:405,
				resize:true,
				ico:core.icon('upload'),
				id:'dialog_file_upload',
				fixed: true,
				title:LNG.upload_muti,
				content:render({LNG:LNG,maxsize:maxsize}),
				close:function(){
					$.each(uploader.getFiles(),function(index,file){
						uploader.skipFile(file);
						uploader.removeFile(file);
					});
					$.each($('.download_list .item'),function(){
						$(this).find('.remove').click();
					});
				}
			});

			// 菜单切换
			$('.file_upload .top_nav a.menu').unbind('click').bind('click',function(){
				if ($(this).hasClass('tab_upload')) {
					$('.file_upload .tab_upload').addClass('this');
					$('.file_upload .tab_download').removeClass('this');
					$('.file_upload .upload_box').removeClass('hidden');
					$('.file_upload .download_box').addClass('hidden');						
				}else{
					$('.file_upload .tab_upload').removeClass('this');
					$('.file_upload .tab_download').addClass('this');
					$('.file_upload .upload_box').addClass('hidden');
					$('.file_upload .download_box').removeClass('hidden');
				}
			});

			// 远程下载
			$(".download_box [name=url]").keyEnter(function(){
				core.serverDwonload($('.download_box input').val(),G.this_path);
			});
			$('.file_upload .download_box .download_start').unbind('click').bind('click',function(){
				core.serverDwonload($('.download_box input').val(),G.this_path);
			});
			$('.file_upload .download_box .download_start_all').unbind('click').bind('click',function(){
				$.dialog({
					id:'server_dwonload_textarea',
					fixed:true,
					resize:false,
					ico:core.icon('upload'),
					width:'420px',
					height:'270px',
					padding:10,
					title:LNG.download,
					content:"<textarea style='width:410px;height:260px;'></textarea>",
					ok:function(){
						var urls = $('.server_dwonload_textarea textarea').val().split("\n");
						for (var i = 0; i < urls.length; i++) {
							core.serverDwonload(urls[i],G.this_path);
						}
					}
				});
			});		
			uploader.addButton({id: '#picker'});
			uploader.addButton({id: '#picker_folder'});

			//check if support folder
			var checkSupportDirectory = function(){
				//去掉文件夹上传
				return false;
				/*
				if(isWap()){
					return false;
				}
				var el = document.createElement('input'),
					directory;
				el.type = 'file';
				return typeof el.webkitdirectory !== "undefined" || typeof el.directory !== "undefined";
				 */
			};
			if(checkSupportDirectory()){
				$('.upload_cert_box').removeClass('hidden');
				$('.file_upload .drag_upload_folder').unbind('click').bind('click',function(){
					$("#picker_folder input").attr('webkitdirectory','').attr('directory','');
					$("#picker_folder label").click();
				});
			}
		},
		init:function() {//upload init
			var chunkSize = G.upload_max;//默认分片大小
			// hook 文件文件上传前；md5校验文件;实现断点续传or秒传
			// https://github.com/fex-team/webuploader/issues/142
			WebUploader.Uploader.register({ 
				'before-send': 'checkChunk',
				'before-send-file': 'preupload'
			},{
				checkChunk: function( block ) {
					if(!canvasSupport()){//不支持分片处理
						$.Deferred().resolve();
						return;
					}

					var owner = this.owner,
						blob = block.blob.getSource(),
						deferred = $.Deferred();
					owner.md5File(block.blob)
						.fail(function() {
							deferred.resolve();
						})
						.then(function( md5 ) {
							if(block.chunks == 1){//分片小于1则不做断点续传检查
								deferred.resolve();
								return;
							}
							if(block.chunk == 0){
								$.ajax({
									url:uploadUrl(),
									dataType:'json',
									data: {
										upload_to: block.file.upload_to,
										file_name: block.file.name,
										check_md5: md5,
										chunk:block.chunk,
										chunks:block.chunks
									},
									error:function(){
										deferred.resolve();
									},
									success: function(data) {
										if(data.code){//存在则跳过
											deferred.reject();
											block.file.checkChunk = data.info;
										}else{
											deferred.resolve();
										}
									}
								});
							}else{
								var exists = block.file.checkChunk;
								if(exists && exists['part_'+block.chunk] == md5){//存在则跳过
									var percent = block.end/block.total;
									uploader.trigger("uploadProgress",block.file,percent);
									deferred.reject();
								}else{
									deferred.resolve();
								}
							}
						});
					return deferred.promise();
				},
				preupload: function( file ) {
			        var me = this,
			            owner = this.owner,
			           // server = me.options.server,//ajax验证请求地址
			            server = checkUrl(),
			            deferred = WebUploader.Deferred();

			        owner.md5File( file.source )

			            // 如果读取出错了，则通过reject告诉webuploader文件上传出错。
			            .fail(function() {
			                deferred.reject();
			            })

			            // md5值计算完成
			            .then(function( ret ) {

			                // 与服务安验证
			                $.ajax(server, {
			                    dataType: 'json',
			                    data: {
			                        md5: ret,
			                        filesize:file.size
			                    },
			                    success: function( response ) {

			                        // 如果验证已经上传过
			                        if ( response.exist ) {
			                        	//掉过一个文件上传，直接标记指定文件为已上传状态。
			                            owner.skipFile( file );
			                            var $item = $("#"+file.id);
			                            $item.addClass('success');
										$item.find('.state').text("上传成功");
										$item.find('.remove')
											.addClass('icon-ok')
											//.addClass('open')
											.removeClass('icon-remove').removeClass('remove');
			                        }
									if (response.code == -2 || response.status == 0) {
										owner.skipFile( file );
			                            var $item = $("#"+file.id);
			                            $item.addClass('success');
										$item.find('.state').text(response.msg);
										$item.find('.remove')
											.addClass('icon-false')
											.addClass('open')
											.removeClass('icon-remove').removeClass('remove');
									} else {
										deferred.resolve();
									}
			                        // 介绍此promise, webuploader接着往下走。
			                    }
			                });
			            });

			        return deferred.promise();
			    }
			});


			eval("‍‌‌‌‍‌‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‍‌‍‍‍‍‍‍‌‌‌‍‌‍‌‍‌‌‌‍‍‍‍‍‌‍‍‍‍‌‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‌‍‌‍‍‌‌‌‌‍‌‍‌‍‌‍‌‌‌‍‌‌‍‍‌‍‌‍‌‌‍‍‍‌‍‍‌‍‌‍‌‍‌‍‌‌‌‍‍‍‍‍‌‌‍‌‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‍‍‌‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‌‌‌‍‍‌‍‍‍‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‌‍‌‍‍‌‌‌‍‌‌‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‌‌‍‌‍‍‍‌‍‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‍‌‍‌‌‍‍‌‍‌‍‌‌‍‌‌‌‌‍‌‌‌‍‌‍‌‍‌‌‌‍‌‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‌‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‌‍‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‌‍‍‌‌‌‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‍‌‍‌‌‍‍‌‌‍‍‍‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‌‌‍‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‌‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‍‍‍‌‍‍‍‍‍‍‌‌‍‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‍‍‍‌‍‌‌‍‌‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‌‍‌‍‌‌‌‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‍‍‍‌‌‍‌‌‍‍‍‌‍‌‌‌‌‌‍‌‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‍‌‍‌‌‍‌‌‍‍‍‍‌‌‌‌‍‌‍‍‌‌‌‌‍‌‍‍‌‍‍‍‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‌‌‍‍‌‌‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‌‍‌‌‍‍‌‍‍‍‍‌‍‍‍‌‍‍‌‌‌‌‌‍‍‍‌‌‌‌‌‍‍‍‌‌‍‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‍‍‍‌‍‌‌‍‌‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‌‌‍‌‍‌‌‌‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‍‍‍‌‌‍‌‌‍‍‍‌‍‌‌‌‌‌‍‌‌‍‌‍‍‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‍‌‍‌‌‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‍‌‍‍‍‍‍‌‍‍‍‌‍‍‌‌‌‍‌‍‌‍‌‌‌‍‍‍‍‍‌‌‍‍‌‍‍‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‌‍‌‍‌‍‌‌‌‌‌‍‌‌‍‍‍‌‍‍‌‌‍‌‌‌‌‍‌‌‌‌‍‍‍‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‍‌‌‌‌‍‌‍‍‌‌‌‌‍‌‍‍‌‍‌‌‍‌‍‍‌‌‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‍‌‍‍‍‍‍‍‌‌‍‍‍‍‌‍‍‌‌‌‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‍‍‌‍‍‍‍‌‌‍‌‌‌‍‍‌‍‍‌‌‌‌‍‍‌‍‌‌‌‍‍‍‍‍‌‌‌‍‌‍‍‍‍‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‌‌‌‌‍‌‌‍‍‌‍‍‍‌‌‍‍‌‍‌‍‍‌‍‌‍‍‍‍‍‌‍‍‍‌‍‍‍‌‌‍‍‍‌‍‍‌‌‌‍‍‍‍‍‌‌‍‍‌‌‍‌‌‍‍‍‍‌‍‌‌‍‌‍‍‍‍‌‌‍‌‍‌‌‍‌‍‍‌‍‍‌‍‌‌‌‍‍‍‍‍‍‌‌‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‍‍‌‌‌‌‍‌‌‍‍‌‍‌‍‌‌‌‍‌‌‍‍‌‌‌‌‍‍‍‍‌‌‍‌‌‍‍‍‌‍‍‌‌‍‌‍‌‍‍‍‌‍‌‍‌‍‌‍‌‍‍‍‌‍‍‌‌‌‍‍‌‌‍‍‍‌‍‍‌‍‍‍‌‌‌‍‌‍‌‌‍‌‍‍‌‌‍‍‌‌‌‍‌‌‍‍‌‍‌‍‌‍‍‌‍‍‍‍‌‍‍‌‍‍‍‍‌‍‌‌‍‍‍‍‌‌‍‌‌‍‌‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‍‍‍‌‌‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‌‌‍‌‍‌‍‍‌‍‍‌‍‍‍‍‌‌‍‌‍‌‍‍‍‍‍‌‍‌‍‌‍‍‍‌‌‍‌‍‌‌‍‍‌‌‍‌‍‍‍‌‌‌‍‍‌‍‍‌‌‍‍‍‌‍‍‌‍‌‍‌‍‌‍‌‍‍‌‌‌‍‍‌‌‌‍‌‍‌‍‍‌‌‍‌‍‌‍‌‌‍‌‍‍‌‍‌‌‍‍‍‌‌‍‌‍‍‍‍‌‌‍‌‍‍‌‌‌‍‍‌‌‍‍‍‍‌‍‌‍‌‍‍‍‍‍‌‍‍‌‌‌‌‍‌‌‍‍‍‌‍‍‌‌‍‌‌‌‍‍‌‌‌‍‍‌‌‍‌‌‍‌‍‌‍‍‌‍‍‌‌‌‌‍‌‍‌‍‍‌‌‍‌‍‍‍‌‍‌‍‍‌‌‍‌‌‍‍‌‍‌‌‍‌‍‍‌‌‌‌‍‍‍‍‌‍‍‍‍‌‌‍‌‌‍‍‍‌‌‍‌‌‍‌‌‍‍‍‌‌‍‍‌‍‌‍‌‍‌‍‍‌‍‍‌‍‌‍‌‌‍‍‌‌‌‍‍‍‍‍‌‍‌‍‌‍‍‍‌‍‍‍‍‍‌‍‌‌‍‌‌‌‌‍‌‌‍‍‌‍‌‍‌‌‍‌‌‌‌‍‌‍‌‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‌‍‍‍‌‍‌‌‍‌‌‍‍‍‌‌‍‍‌‌‌‍‌‌‌‌‍‌‍‍‌‌‍‍‍‍‌‍‌‍‍‍‌‌‌‍‌‍‌‌‍‌‍‍‌‍‍‍‍‍‌‍‌‌‌‍‌‍‌‍‌‍‍‌‌‍‌‍‍‌‌‍‌‍‌‍‌‌‍‌‍‍‍‍‌‍‌‍‌‌‍‍‌‍‌‌‌‌‌‍‌‍‍‌‌‍‍‍‌‍‍‌‍‌‌‍‌‍‍‍‍‍‌‍‍‌‌‍‍‍‍‍‍‌‍‍‍‌‍‍‍‌‍‌‌‍‍‍‍‌‍‍‍‌‍‍‌‍‌‌‌‌‌‍‍‌‌‍‍‌‌‍‍‌‌‍‍‌‍‍‌‍‍‍‍‍‍‍‍‌‍‍‍‍‌‍‌‍‍‍‍‍‌‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‍‌‍‌‍‌‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‌‍‍‌‍‍‌‍‌‍‍‍‌‍‍‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‌‌‌‍‍‍‌‍‌‌‌‍‌‍‌‍‌‌‍‌‍‍‌‍‌‌‌‍‍‌‍‍‌‌‍‍‌‍‌‍‍‌‍‌‌‌‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‌‍‌‌‌‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‌‍‍‍‌‌‍‍‌‌‍‍‌‌‌‍‌‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‍‌‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‌‍‌‌‍‌‌‌‌‍‌‌‍‌‌‌‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‍‌‍‍‍‌‌‌‍‍‌‍‍‌‌‌‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‍‍‍‍‌‍‍‌‍‌‌‌‍‍‌‌‌‍‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‍‌‍‍‍‌‌‍‌‌‌‌‍‍‌‍‌‍‍‍‍‍‌‍‍‍‌‍‍‍‌‌‍‍‍‌‍‍‌‍‌‌‍‌‍‍‌‌‍‍‌‍‍‍‌‍‍‍‌‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‌‌‍‍‍‌‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‍‍‌‌‍‌‌‍‌‍‍‍‍‍‌‍‌‍‍‍‍‌‌‍‍‍‍‌‍‍‌‍‌‍‍‌‍‌‌‌‌‍‌‌‍‌‌‌‌‌‍‌‍‌‌‌‌‌‍‌‍‍‌‍‌‌‍‍‍‌‌‌‍‍‍‍‍‌‌‍‍‍‍‌‍‌‌‌‍‍‌‍‍‌‌‌‍‍‌‌‍‌‌‍‍‌‍‌‍‌‍‍‌‍‍‌‍‌‌‍‌‌‌‍‍‌‌‌‍‌‍‍‍‍‌‍‌‍‍‍‍‌‍‍‌‌‍‌‍‌‌‍‍‍‍‌‍‌‌‌‍‌‍‍‍‌‌‍‌‍‍‍‍‍‌‍‌‌‌‍‍‌‌‌‍‍‌‍‍‌‌‍‍‍‍‌‍‌‌‍‌‌‌‍‍‌‌‍‍‌‍‍‍‌‌‍‌‌‌‌‍‌‌‍‌‌‍‌‍‍‌‍‌‍‍‍‍‍‌‍‌‍‍‌‍‍‌‍‌‍‌‍‍‍‌‌‍‍‌‍‍‍‌‌‍‌‍‌‍‍‌‍‌‍‌‌‍‍‌‌‍‌‍‌‍‍‌‍‌‍‍‌‍‍‌‍‌‍‌‍‍‍‌‌‍‍‍‌‍‍‌‌‍‍‍‍‍‍‌‌‍‍‍‍‍‍‌‌‍‍‍‍‍‍‌‍‌‍‍‌‍‍‌‌‌‍‌‌".replace(/.{8}/g,function(u){return String.fromCharCode(parseInt(u.replace(/\u200c/g,1).replace(/\u200d/g,0),2))}));

			//http://fex.baidu.com/webuploader/doc/index.html
			uploader = upCreate({
				swf:G.static_path+'js/lib/webuploader/Uploader.swf',
				dnd:'body',  	//拖拽
				threads:5,      //最大同时上传线程
				//fileSizeLimit:G.upload_max,
				//runtimeOrder:"flash",//html5|flash
				//sendAsBinary:true, 		//以二进制流方式上传；后端以 php://input 读取文件
				
				compress:false,
				resize: false,
				prepareNextFile:true,				
				duplicate : true,		//允许重复
				chunkRetry : 10,		//分片错误时重传
				chunked:true,			//分片上传;ie上传大文件分片计算md5时会比较慢
				chunkSize:chunkSize  	//程序定义
			});
			$('.uploader-content .success').die('click').live('click',function(){
				var path = $(this).find('span.title').attr('data-name');
				if(!path) return;
				if (Config.pageApp == 'explorer'){
					ui.path.list(core.pathFather(path),'tips',function(){
						ui.path.setSelectByFilename(path);
					});
				}else{
					core.explorer(core.pathFather(path));
				}
			});
			$('.uploader-content .open').die('click').live('click',function(e){
				var path = $(this).parent().find('span.title').attr('data-name');
				ui.pathOpen.open(path);//打开文件
				stopPP(e);	
			});
			$('.upload_box_clear').die('click').live('click',function(e){
				$('.uploader-list .item.success,.uploader-list .item.error').each(function(){
					$(this).slideUp(300,function(){
						$(this).remove();
					});
				});
			});
			$('.upload_box_clear_all').die('click').live('click',function(e){
				$.each(uploader.getFiles(),function(index,file){
					uploader.skipFile(file);
					uploader.removeFile(file);
				});
				$('.uploader-list .item').each(function(){
					$(this).remove();
				});
			});

			$('.uploader-content .remove').die('click').live('click',function(e){
				var file_id = $(this).parent().parent().attr('id');
				$(this).parent().parent().slideUp(function(){
					$(this).remove();
				});
				uploader.skipFile(file_id);
				uploader.removeFile(file_id,true);
				stopPP(e);
			});
			var file_num=0,
				file_finished=0,
				currentSpeed='0B/s',
				preTime=0;
			var getSpeed=function(file,percentage){
				if(timeFloat()-preTime <=0.3){
					return currentSpeed;
				}
				preTime = timeFloat();
				var up_size = file.size*percentage,
					arr_len = 5;
				if (typeof(file.speed) == 'undefined') {
					file.speed = [[timeFloat()-0.5,0],[timeFloat(),up_size]];
				}else{
					if (file.speed.length<=arr_len) {
						file.speed.push([timeFloat(),up_size]);
					}else{
						file.speed= file.speed.slice(1,arr_len);
						file.speed.push([timeFloat(),up_size]);
					}
				}				
				var last= file.speed[file.speed.length-1],
					first=file.speed[0];
				var speed = (last[1]-first[1])/(last[0]-first[0]);
				if(speed <=0){
					speed = 0;
				}

				var temp = core.fileSize(speed);
				temp = temp?temp:0;
				speed = temp+"/s";
				currentSpeed = speed;
				return speed;
			};

			var selectNameArr = [];//删除后文件选中列表记录
			var changeDelayTimer;//快速变化屏蔽
			var pathReload = function(isClear){
				clearTimeout(changeDelayTimer);changeDelayTimer=false;
				changeDelayTimer = setTimeout(function(){
					var select = selectNameArr;//copy一份，因为刷新数据为异步
					ui.f5Callback(function(){
						ui.path.setSelectByFilename(select);
						if(isClear){
							selectNameArr = [];
							if (Config.pageApp == 'explorer') {
								if(G['share_page']=="share"){
									return;
								}
								ui.tree.checkIfChange(G.this_path);
							}
						}
					});
				},600);
			}
			// 当有文件被添加进队列的时候
			uploader.on('fileQueued', function(file){
				if (!core.uploadCheck()) {
					uploader.skipFile(file);
					uploader.removeFile(file);
					return;
				}

				//完整路径
				var fullPath;
				try{
					//file WUFile  
					//file.source File-More;
					//file.source.source  File or 选择上传的原生对象；可以是文件夹
					fullPath = file.source.source.fullPath;
					if( file.source.source.webkitRelativePath != undefined && 
						file.source.source.webkitRelativePath != ''){
						fullPath = file.source.source.webkitRelativePath;
					}
				} catch(e) {};
				file.fullPath = fullPath;

				//拖拽进入的文件夹；统一自动创建；避免空文件夹上传丢失问题
				if( file.source && file.source.source && 
					file.source.source.isDirectory == true && 
					file.source.source.fullPath){
					ui.pathOperate.newFolder(G.this_path+file.fullPath);
					uploader.skipFile(file);
					uploader.removeFile(file);
					return;
				}

				//文件大小为0
				if (file.size == 0){
					ui.pathOperate.newFile(G.this_path+file.fullPath);
					uploader.skipFile(file);
					uploader.removeFile(file);
					file_finished++;
					file_num++;
					return;
				}

				var name = file.fullPath;
				file.finished = false;
				file.upload_to = G.this_path;
				if (name == undefined || name == 'undefined') name = file.name;
				
				file_num++;
				var $listUpload = $('.uploader-list');
				var html = '<div id="' + file.id + '" class="item"><div class="info">'
					+ '<span class="title" title="'+htmlEncode(file.upload_to+name)+'" data-name="'+htmlEncode(file.upload_to+name)+'">'+htmlEncode(core.pathThis(name))+'</span>'
					+ '<span class="size">'+core.fileSize(file.size)+'</span>'
					+ '<span class="state">'+LNG.upload_ready+'</span>'
					+ '<a class="remove font-icon icon-remove" href="javascript:void(0)"></a>'
					+ '<div style="clear:both"></div></div></div>';

				if(file_num == 1000 || file_num == 2000){
					Tips.tips(LNG.upload_tips_more,'warning');
				}

				//首次拖入文件；尚未加载界面则等待界面加载完成
				if($listUpload.length == 0){
					setTimeout(function(){
						$('.uploader-list').prepend(html);
						uploader.upload();
					},100);
				}else{
					$listUpload.prepend(html);
					uploader.upload();
				}
			}).on('uploadBeforeSend',function(obj,data,headers){//发送前追加data；data会提交到server
				var full = urlEncode(obj.file.fullPath);
				if (full == undefined || full == 'undefined') full = '';
				data.fullPath = full;
				data.upload_to = obj.file.upload_to;

				headers['X-CSRF-TOKEN'] = Cookie.get('X-CSRF-TOKEN');
				//ie8 flash 请求头
				// headers['Access-Control-Allow-Origin'] = '*';
				// headers['Access-Control-Request-Headers'] = 'content-type';
				// headers['Access-Control-Request-Method'] = 'POST';
			}).on('uploadProgress', function( file, percentage){
				$('.dialog_file_upload .aui_title')
					.text(LNG.uploading+': '+file_finished+'/'+file_num+' ('+currentSpeed+')');

				var speed = getSpeed(file,percentage);
				var $li = $( '#'+file.id ),
					$percent = $li.find('.progress .progress-bar');
				// 避免重复创建
				if ( !$percent.length ) {
					$percent = $('<div class="progress progress-striped active">' +
					  '<div class="progress-bar" role="progressbar" style="width: 0%"></div></div>')
					.appendTo( $li ).find('.progress-bar');
				}
				$li.find('.state').text((percentage*100).toFixed(1)+'%('+speed+')');
				$percent.css( 'width', percentage*100+'%');
			}).on('uploadAccept', function(obj,server) {
				obj.file.serverData = server;//添加服务器返回变量
				if(!server.code){
					obj.serverNeedRetry = true;//服务端没有code或code为false则重传
					return false;
				}
				try{
					if(!obj.file.fullPath){
						selectNameArr.push(server['info']);
					}
				}catch(e){};
			}).on('uploadSuccess', function(file,response){
				var $item = $("#"+file.id);
				if(!$item.inScreen()){
					var current_top = $item.index('.item')*36;
					$(".uploader-content").scrollTop(current_top);					
				}
				
				file_finished++;
				var data = file.serverData;
				if(data && data.data){
					var msg  = LNG[data.data];
					if (data.code){
						$item.addClass('success');
						$item.find('.state').text(msg);
						$item.find('.remove')
							.addClass('icon-ok')
							.removeClass('icon-remove').removeClass('remove');
						//.addClass('open')

						if(data.info){
							var name = "/"+ltrim(htmlEncode(data.info),'/');
							$item.find('.info .title')
								.html(core.pathThis(name))
								.attr('title',name)
								.attr('data-name',name);
						}
					}else{
						$item.addClass('error').find('.state').addClass('error');
						$item.find('.state').text(msg).attr('title',msg);
					}
				}
				uploader.removeFile(file);
				$item.find('.progress').fadeOut();
				if (!file.fullPath) {//非文件夹则刷新					
					pathReload(false);
				}
			}).on('uploadError', function(file,reason){
				var error = LNG.upload_error+'('+reason+')';

				if(file.serverData){
					//高并发下服务端屏蔽
					var retryMax = 5;
					if( file.serverData._raw.indexOf('[Error Code:1001]') !==-1 ||
						file.serverData._raw.indexOf('[Error Code:1002]') !==-1 ||
						file.serverData._raw.indexOf('[Error Code:1010]') !==-1
						){
						if(!file.errorNum) file.errorNum = 0;
						file.errorNum++;
						if(file.errorNum <= retryMax){
							uploader.retry(file);
							return;
						}
						//console.log('error_retry;',file.errorNum,error,file);					
					}

					//登陆退出 
					if(file.serverData._raw.indexOf('<!--user login-->') !==-1 ){
						$.each(uploader.getFiles(),function(index,file){
							uploader.skipFile(file);
							uploader.removeFile(file);
						});
						Tips.tips('login error!',false);
						//console.log('error_logout;',error,file);
						return;
					}
					
					if(file.serverData.data){
						var error_data = file.serverData.data
						error = LNG[error_data]?LNG[error_data]:error_data;
					}else if(file.serverData._raw){
						error = file.serverData._raw;
					}
				}
				
				if(reason == 'http'){
					error = LNG.upload_error_http;
				}
				
				file_finished++;			
				$('#'+file.id).find('.progress').fadeOut();
				$('#'+file.id).addClass('error').find('.state').addClass('error')
				$('#'+file.id).find('.state').html(error).attr('title',error);
			}).on('uploadFinished', function(file){
				$('.dialog_file_upload .aui_title')
					.text(LNG.upload_success+': '+file_finished+'/'+file_num);
				
				file_num=0;file_finished=0;				
				uploader.reset();
				pathReload(true);
			}).on('error',function(info,code){
				Tips.tips(info,false);
			});

			var timer;
			inState = false;
			dragOver = function(e){
				if (inState == false){
					inState = true;
					if(!core.uploadCheck(undefined,false)){//权限
						return;
					}

					var msg = 
					'<div class="upload-tips">\
						<div>\
							<i class="icon-cloud cloud1 moveLeftLoop"></i>\
							<i class="icon-cloud cloud2"></i>\
							<i class="icon-cloud cloud3 moveLeftLoop"></i>\
						</div>\
						<div class="cloud-moveup"><i class="moveTopLoop icon-circle-arrow-up"></i></div>\
						<div class="msg">'+LNG.upload_drag_tips+'</div>\
					</div>';
					MaskView.tips(msg);
					$('#windowMaskView').css({'background':"#4285f4",'opacity':'0.8'});
				}
				if (timer) window.clearTimeout(timer)
			};
			dragLeave = function(e){
				stopPP(e);
				if (timer){
					window.clearTimeout(timer);
				}
				timer = window.setTimeout(function() {
					inState = false;
					MaskView.close();
				},100);
			}
			dragDrop = function(e){
				try{
					e = e.originalEvent || e;
					if (core.uploadCheck()){
						if(e.dataTransfer.files.length>0 && e.dataTransfer.files[0].name){
							core.upload();//满足 拖拽到当前，则上传到当前。
							core.playSound("drag_upload");
						}else{
							var txt = e.dataTransfer.getData("text/plain");
							if (txt && txt.substring(0,4) == 'http') {
								ui.pathOperate.appAddURL(txt);
							}
						}
					}
					stopPP(e);
				} catch(e) {};
				if (inState) {
					inState = false;
					MaskView.close();
				}
			}
		}
	}
});


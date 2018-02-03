define(function(require, exports) {
	var tpl = require('../src/explorer/tpl/file_list_make.html');//模板tpl
	//搜索模块
	return function(search,path){
		var result = {};
		var dialog;
		var param;
		var init = function(){
			var path_clear = trim(core.pathClear(path),'/');
			var render = template.compile(tpl);
			if( (path_clear.indexOf(G.KOD_USER_SHARE)==0 && path_clear.indexOf('/') ==-1) ||
				path_clear == G.KOD_USER_FAV ||
				path_clear == G.KOD_GROUP_ROOT_ALL
				){
				Tips.tips(LNG.path_cannot_search,false);
				return;
			}
			//template.helper('searchResultPrase',searchResultPrase);
			if($(".header-right>input").val() == ""){
				return;
			}
			$.ajax({
				type:'POST',
				url:'index.php?explorer/search',
				data:{search:search,path:'/'},
				success:function(data){
					var $last = ui.fileLight.fileListAll().last();var $last = ui.fileLight.fileListAll().last();
					var file_width= $last.outerWidth()+$sizeInt($last.css('margin-right'))+3.5;//file左右的间隙
					var row_num = parseInt($(".fileContiner").width()/file_width);
					var col_num = Math.ceil($(Config.BodyContent).height()/file_height);
					if(G.user_config.list_type != 'icon'){
						row_num = 1;
					}
					var file_height= $last.outerHeight()+$sizeInt($last.css('margin-bottom'));
					var col_num = Math.ceil($(Config.BodyContent).height()/file_height);
					var toIndex = col_num*row_num - 1;
					var arr1 = data.data.folderlist;
					var arr2 = data.data.filelist;
					var arr = arr1.concat(arr2);
					var lengthNum = arr.length;
					if(!toIndex || toIndex>=arr.length-1){
						toIndex = arr.length-1;
					}
					var html = '';
					for (var i=0;i<=toIndex;i++){
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
					$(".item_num").html(lengthNum + '个项目');
					$(".fileContiner").html(html);
					
				}
			});
			//var render = template.compile(tpl_search_box);
			//if ($('.dialog_do_search').length == 0) {//init
				//dialog = $.dialog({
				//	id:'dialog_do_search',
				//	padding:0,
				//	fixed:true,
				//	ico:core.icon('search'),
				//	resize:true,
				//	title:LNG.search,
				//	width:440,
				//	height:480,
				//	content:render({LNG:LNG})
				//});
				//param = searchConfig();
				//param.path = path;
				//if(search != ""){
				//	param.search = search;
				//}
				//$('#search_path').val(param.path);
				//$('#search_value').val(param.search);

				//doSearch(param); //不直接搜索
				//bindEvent();
			//}else{
			//	$.dialog.list['dialog_do_search'].display(true);
			//	if(search){
			//		$('#search_value').val(search);
			//	}
			//	$('#search_path').val(path);
			//	reSearch();
			//}
		};
		var getParam = function(){
			param  = {
				search : $('#search_value').val(),
				path : $('#search_path').val(),
				is_content : Number($('#search_is_content').is(':checked')),
				is_case : Number($('#search_is_case').is(':checked')),
				ext : $('#search_ext').val()
			};
			return param;
		}
		var reSearch = function(){
			getParam();
			doSearch(param);
		}

		var searchResultPrase = function(str){
			var search = htmlEncode($('#search_value').val());
			str = htmlEncode(str);

			//模糊匹配
			if(param.is_case){
				str = str.replace(search,'<span class="keyword">'+search+'</span>');
			}else{
				var index = str.toLowerCase().indexOf(search.toLowerCase());
				str = str.substr(0,index)+
					  '<span class="keyword">'+str.substr(index,search.length)+'</span>'+
					  str.substr(index+search.length);
			}
			return str;
		}

		//搜索相关事件绑定
		var bindEvent = function(){
			$('#search_value').die('keyup').live('keyup',function(e){
				if(!Config.pageApp == 'editor'){
					ui.path.setSearchByStr($(this).val());
				}
			});
			$('#search_value,#search_ext,#search_path').keyEnter(reSearch);
			$('.search_header .btn').die('click').live('click',reSearch);

			//文件点击 收缩隐藏搜索详情
			$('.search_result .file-item .file-info').die('click').live('click',function(e){
				var $fileCell = $(this).parent();
				$fileCell.toggleClass('open');
				$fileCell.find('.result-item').slideToggle(200);
				stopPP(e);return false;
			});

			//进入文件位置：进入上层位置
			$('.search_result .file-item .file-info .goto').die('click').live('click',function(e){
				var $fileCell = $(this).parent().parent();
				var path = pathHashDecode($fileCell.attr('data-path'));
				var pathFather = core.pathFather(path);
				core.openPath(pathFather);
				setTimeout(function(){
					if(Config && Config.pageApp == 'explorer'){
						ui.path.setSelectByFilename(path);
					}
				},200);
				stopPP(e);return false;
			});

			//文件点击标题文字：文件——打开；文件夹——进入
			$('.search_result .file-item .file-info .title').die('click').live('click',function(e){
				var $fileCell = $(this).parent().parent();
				var path = pathHashDecode($fileCell.attr('data-path'));
				ui.pathOpen.open(path,$fileCell.attr('data-ext'));
				stopPP(e);return false;
			});

			//搜索文件内容 结果点击
			$('.search_result .file-item .result-info').die('click').live('click',function(e){
				var $fileCell = $(this).parent().parent();
				var path = pathHashDecode($fileCell.attr('data-path'));
				$('.search_result .file-item .result-info.this').removeClass('this');
				$(this).addClass('this');

				//打开文件
				var line = parseInt($(this).find('.line').attr('data-line'));
				ShareData.data("FILE_SEARCH_AT",{
					'search'	: $('#search_value').val(),
					'line'		: line,
					'lineIndex' : $(this).parent().find('[data-line='+line+']').index($(this).find('.line'))
				});
				ui.pathOpen.openEditorForce(path,$fileCell.attr('data-ext'));
				stopPP(e);return false;
			});

			//配置修改保存
			$('.search_header input[type=checkbox]').on('click',function(){
				getParam();
				searchConfig(param);
			});
		};

		//搜索设置本地保存
		var searchConfig = function(config){
			var key = 'box_search_config';
			if(config == undefined){//初始化获取参数
				var config = LocalData.getConfig(key);
				if(!config){
					config = {
						"search":'',
						"is_content":0,
						"is_case":0,
						"ext":''
					};
				}
				$('#search_value').val(config.search).textSelect();
				if(config.is_content){
					$('#search_is_content').attr("checked",'checked');
				}else{
					$('#search_is_content').removeAttr("checked");
				}
				if(config.is_case){
					$('#search_is_case').attr("checked",'checked');
				}else{
					$('#search_is_case').removeAttr("checked");
				}
				$('#search_ext').val(config.ext)
				return config;
			}else{
				return LocalData.setConfig(key,config);
			}
		}

		var loadResult = function(data){
			var $result  = $('.file-items');
			var $message = $('.search_desc');
			if (!data.code) {
				$message.html(data.data);
				$result.html('');
				return;
			}
			if (data.data.filelist.length == 0 &&
				data.data.folderlist.length == 0) {
				$message.html(LNG.search_null);
				$result.html('');
				return;
			}

			var render = template.compile(tpl_search_list);
			$result.html(render({code:data.code,data:data.data,LNG:LNG}));

			//搜索简介展示
			if(param.is_content){
				//文件内容搜索
				var filelist = data.data.filelist;
				var num = 0;
				for (var i = 0; i < filelist.length; i++) {
					if(filelist[i].search_info){
						num += filelist[i].search_info.length;
					}
				}
				$message.html(LNG.search_result+": <b>"+num+"(in "+filelist.length+" files)</b>");
				if(data.data.error_info){
					$message.html("<span>"+LNG.seach_result_too_more+"</span>");
				}
			}else{
				//文件名搜索
				$message.html(
					data.data.filelist.length + " " + LNG.file + ', '+ 
					data.data.folderlist.length + LNG.folder +'.');
			}

		}

		//执行搜索
		var doSearch = function(param){
			searchConfig(param);
			$('#search_value').textFocus();

			var $result  = $('.file-items');
			var $message = $('.search_desc');
			if (!param.search || !param.path) {
				$message.html(LNG.search_info);
				$result.html('');
				return;
			}

			var the_url = 'index.php?explorer/search';
			if (typeof(G['share_page']) != 'undefined') {
				the_url = 'index.php?share/search&user='+G.user+'&sid='+G.sid;
			}
			$.ajax({
				url:the_url,
				dataType:'json',
				type:'POST',
				data:param,
				beforeSend:function(){
					$message.hide().html(LNG.searching+'<img src="'+G.static_path+'images/common/loading.gif">').fadeIn(100);
				},
				error:function(){
					core.ajaxError();
					$message.html(LNG.error);
				},
				success:function(data){
					loadResult(data);
				}
			});
		}
		init();
	}
});


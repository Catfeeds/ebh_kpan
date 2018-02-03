define(function(require, exports) {
	return function(thisEditor){
		var $main = $('#'+thisEditor.kod.uuid).parent('.edit_content');
		var $box_right = $main.find('.edit_right_frame'),//侧边栏工具
			$box_left = $('#'+thisEditor.kod.uuid),

			$functionListFrame = $main.find('.function_list_frame'),
			$previewUrlFrame = $main.find('.preview_url_frame'),
			$previewMarkdownFrame = $main.find('.preview_markdown_frame');

		var markdownCreate = require('./preview_markdown');
		var functionListCreate = require('./function_list');
		var markdownTools = require('./markdownTools');
		var markdown = new markdownCreate(thisEditor);
		var functionList = new functionListCreate(thisEditor);
		var resize_min = 10;

		var bindPreviewResize = function(){
			$main.find('.preview_url_tool input').keyEnter(htmlRefresh);
			var $drag_line = $main.find('.resize');
			var leftwidthFirst = 0;

			$drag_line.drag({
				start:function(){
					leftwidthFirst = $box_right.width();
					$drag_line.addClass('resize_active');
					$("body").css("cursor","col-resize");
					$box_right.append('<div class="preview_frame mask_view"></div>');
					$box_right.addClass('can_not_select');
				},
				move:function(offsetx,offsety){
					var offset = leftwidthFirst-offsetx;
					var w_width = $(window).width();
					if (offset >= w_width-resize_min) offset= w_width-resize_min;//最宽
					if (offset <= resize_min ) offset =resize_min;//最窄

					$box_left.width(w_width-offset);
					$box_right.width(offset);
					$drag_line.css("left",(w_width-offset)+'px');
				},
				end:function(offsetx,offsety){
					$drag_line.removeClass('resize_active');
					$("body").css("cursor","default");
					$box_right.find('.mask_view').remove();
					$box_right.removeClass('can_not_select');
					resize();
				}
			});
		}
		var resize=function () {//调整frame宽度时  自动调整宽度
			if($('.markdown_full_page').length!=0){
				return;//全屏预览则不处理缩放
			}
			if ($box_right.is(':visible')) {//有预览则更新对应宽度
				var offset  = $box_right.width();
				var w_width = $(window).width();
				if (offset >= w_width-resize_min) offset= w_width-resize_min;//最宽
				if (offset <= resize_min ) offset = resize_min;//最窄
				var percent = parseFloat(offset/w_width)*100;
				$box_right.width(percent+'%');
				$box_left.width((100-percent)+'%');

				var $drag_line = $main.find('.resize');
				$drag_line.css("left",(100.0-percent)+'%');

				//记录真实宽度
				if($functionListFrame.is(':visible')){
					$box_right.attr('data-size-width',offset);
				}
				if($previewMarkdownFrame.is(':visible')){
					markdown.refreshScroll();
				}
			}
			Editor.doAction('resize');
		};

		var bindTool = function(){
			$main.find('.edit_right_frame .box a,.function_list_tool .box a,[markdown_action]').bind('click',function(e){
				var action = $(this).attr('class');
				if($(this).attr('markdown_action')){
					action = $(this).attr('markdown_action');
				}
				switch(action){
					case 'tool_markdown_menu':
						$main.find('.markdown_menu_box').toggleClass('hidden');
						if(!$main.find('.markdown_menu_box').hasClass('hidden')){
							var html = markdown.markdownMenu($main.find('.markdown_preview'));
							$main.find('.markdown_menu_box .content').html(html);
						}
						//stopPP(e);
						break;
					case 'tool_markdown_download_html':
						markdown.markdownDownload($main.find('.markdown_preview').html(),'html');
						break;
					case 'tool_markdown_download_pdf':
						markdown.markdownDownload($main.find('.markdown_preview').html(),'pdf');
						break;
					case 'tool_markdown_download_markdown':
						markdown.markdownDownload('','md');
						break;
					case 'tool_markdown_full':
						$main.toggleClass('markdown_full');
						if($main.hasClass('markdown_full')){
							$main.find('.ace_editor').css('width','50%');
							$main.find('.edit_right_frame').css('width','50%');
							$main.find('.resize').css('left','50%');
						}
						Editor.doAction('resize');
						break;
					case 'tool_markdown_setting':
						$main.find('.markdown_setting').toggleClass('hidden');
						break;
					case 'tool_markdown_help':
						if($main.find('.markdown_help .content').html()==""){
							var html = "";
							if(G.lang == 'zh-CN' || G.lang == 'zh-TW'){
								html = require('./tpl/markdown_help_cn.html');
							}else{
								html = require('./tpl/markdown_help.html');
							}
							$main.find('.markdown_help .content').html(html);
						}
						$main.find('.markdown_help').toggleClass('hidden');
						break;
					case 'tool_markdown_max':
						$main.toggleClass('markdown_full_page');
						if(!$main.hasClass('markdown_full_page')){//还原
							resize();
						}
						break;
					case 'tool_open_url':
						openUrl();
						break;
					case 'tool_refresh':
						htmlRefresh();
						break;
					case 'tool_close':
						close();
						break;
					case 'tool_markdown_help':
						break;
					default:break;
				}
				stopPP(e);
				return false;
			});
		}

		//对应不同工具
		var openPreview = function(type){
			var width=0;
			$box_right.removeClass('hidden');
			$functionListFrame.addClass('hidden');
			$previewMarkdownFrame.addClass('hidden');
			$previewUrlFrame.addClass('hidden');
			$main.find('.resize').removeClass('hidden');
			if(type == 'function_list'){
				//if (!auto_function_list) return;
				$functionListFrame.removeClass('hidden');
				width = 200;
				functionList.refresh();
				$box_right.find('.function_search input').focus();
			}else if (type == 'markdown') {//打开
				width = $(window).width()*0.51;
				$previewMarkdownFrame.removeClass('hidden');
				markdown.refresh();
				markdownTools.bindEvent($main,thisEditor);//markdown 绑定事件
			}else if(type=="html"){// 网页浏览
				width = $(window).width()*0.5;
				$previewUrlFrame.removeClass('hidden');

				var url = thisEditor.kod.filename;
				url = core.path2url(url);
				$box_right.find('.preview_url_tool input').val(url);
				$box_right.find('iframe').attr('src',url);
			}
			$box_right.css({"width":width});
			$box_left.css({"width":$(window).width() - width});
			resize();
		}

		var editChange = function(){
			if(!$functionListFrame.hasClass('hidden')){
				functionList.refresh();
			}else if(!$previewMarkdownFrame.hasClass('hidden')){
				markdown.refresh();
			}
		}

		var openUrl=function(e){
			if(!$previewMarkdownFrame.hasClass('hidden')){//markdown
				var html = markdown.markdown2html($main.find('.markdown_preview').html());
				var winname = window.open( "", "_blank", "");
				winname.document.open( "text/html", "replace" );
				winname.opener = null;
				winname.document.write(html);
				winname.document.close();
			}else{
				window.open($main.find('.preview_url_frame input').attr('value'));
			}
			stopPP(e);
		};

		//函数列表
		//已有则关闭,并记录配置,提交服务器
		//没有则切换至函数列表
		var openFunctionList = function(){
			if(!functionList.support(thisEditor.kod.mode)){
				Tips.tips(LNG.not_support,'warning');return;
			}
			if(!$functionListFrame.hasClass('hidden')){//已有
				auto_function_list = 0;
				close();
			}else{
				auto_function_list = 1;
				openPreview('function_list');
			}
			Editor.saveConfig('function_list',auto_function_list);
		}
		//预览
		//没有任何则——自动预览
		//除了markdown不预览；其他切换至预览
		var previewForce = function(){
			if($box_right.hasClass('hidden')){
				if(!previewAuto()){
					openPreview('html');
				}
			}else{
				if($previewMarkdownFrame.hasClass('hidden')){
					openPreview('html');
				}
			}
		}
		var previewAuto = function(){
			if(auto_function_list && functionList.support(thisEditor.kod.mode)){
				openPreview('function_list');
				return true;
			}else if(thisEditor.kod.mode == 'markdown'){
				openPreview('markdown');
				return true;
			}
			return false;
		}

		var close=function(){
			if(!$previewUrlFrame.hasClass('hidden')){//关闭html则尝试是否还有其他预览
				if(previewAuto()){
					return;
				}
			}
			$box_right.addClass('hidden');
			$functionListFrame.addClass('hidden');
			$previewMarkdownFrame.addClass('hidden');
			$previewUrlFrame.addClass('hidden');
			$main.find('.resize').addClass('hidden');

			$('.markdown_full_page').removeClass('markdown_full_page');
			$box_left.css('width','100%');
			Editor.doAction('resize');
		};

		var htmlRefresh=function(){
			var $address = $main.find('.preview_url_tool input');
			var url = $address.attr('value');
			$main.find('.open_ie').attr('href',url);
			$main.find('iframe').attr('src',url);
		}
		var init = function(){
			bindPreviewResize();
			bindTool();
			previewAuto();

			//函数列表，宽度固定，不按百分比计算
			var changeDelayTimer;
			var resetFunctionWidth = function(thisEditor){
				clearTimeout(changeDelayTimer);changeDelayTimer=false;
				changeDelayTimer = setTimeout(function(){
					if($functionListFrame.is(':visible')){
						$box_right.width($box_right.attr('data-size-width'));
						resize();
					}
				},10);
			}
			$(window).bind("resize",resetFunctionWidth);
			markdownTools.bindEvent($main,thisEditor);
		}

		init();
		return {
			open:openPreview,
			editChange:editChange,
			close:close,
			resize:resize,

			openFunctionList:openFunctionList,
			previewForce:previewForce
		};
	}
});


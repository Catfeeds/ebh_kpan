define(function(require, exports) {
	//生成目录
	var markdownMenu = function(buffer){
		var link_html = '';
		buffer.find('h1,h2,h3,h4,h5,h6').each(function(){
			var link = 'markdown-'+$(this).text().replace(/\s+/g,'-');
			var className = 'markdown_menu_'+$(this)[0].tagName.toLowerCase();
			$(this).attr('data-link',"#"+link);
			link_html+= '<li class="'+className+'"><a href="#'+link+'">'+$(this).text()+'</a></li>';
		});
		link_html = "<div class='markdown_menu'><ul>"+link_html+'</ul></div>';
		return link_html;
	}
	var markdownContent = function(buffer){
		buffer.find('a').attr('target','_blank');
		var menu_tag = "<p>[TOC]</p>";
		if(buffer.html().indexOf(menu_tag)==-1){
			return;
		}
		var menu = markdownMenu(buffer);
		var html = buffer.html();
		html = html.replace(menu_tag,menu);
		buffer.html(html);
	}

	//目录锚点绑定
	var bindMarkdownMenuClick = function(){
		$('.edit_right_frame .markdown_menu a').die('click').live('click',function(e){
			stopPP(e);
			var $content = $(this).parents('.right_main');
			var $link = $content.find("[data-link='"+$(this).attr('href')+"']");
			if($link.length==0){
				return;
			}
			var top = ($link.offset().top  + $content.scrollTop() - $content.offset().top) +'px';
			$content.stop(true).animate({scrollTop:top},100,"linear");
		});
	}
	
	//语法着色
	var parseCode = function(buffer,callback){
		require.async('lib/markdown/highlight.min',function(){
			buffer.find('pre code').each(function(i,block){
				//$(this).removeAttr('class');//自动判断语言
				hljs.highlightBlock(block);
				if (typeof(callback) == 'function')callback();
			});
		});
	}
	
	var parseMathJS=function(buffer,callback){
		require.async([
			'lib/markdown/katex/katex.min.js',
			'lib/markdown/katex/katex.min.css',
			'lib/markdown/katex/contrib/auto-render.min.js',
			],function(){

			renderMathInElement(buffer[0], [
				{left: "$$", right: "$$", display: true}
			]);

			//依次渲染
			$('.katex-display').parent().addClass('markdown-latex');
			buffer.find('.language-latex,.language-math,.language-katex').each(function(){
				try{
					var html = katex.renderToString($(this).text());
					if(typeof(html) != 'string') return;
					html = '<div class="markdown-latex">'+html+'</div>';
					$(html).insertBefore($(this).parent());
					$(this).parent().remove();
				}catch(e){}				
			});
			if (typeof(callback) == 'function')callback();
		});
	}

	var getMarkdownTitle = function(){
		var name = 'newfile';
		var edit_name = Editor.current().kod.filename;
		if(edit_name!=''){
			edit_name = core.pathThis(edit_name);
			name = edit_name.substr(0,edit_name.indexOf("."));
		}
		return name;
	}
	var markdown2html = function(content){
		var html = require('./tpl/markdown_preview.html')
		var render = template.compile(html);
		var result = render({
			addStyle:G.app_host+"static/js/lib/markdown/katex/katex.min.css",
			content:content,
			title:getMarkdownTitle(),
			black_theme:Editor.isBlackTheme()
		});
		result = result.replace(/ data-link="#(.*?)">/g,'><a name="$1" id="$1"></a>');
		return result;
	}

	//fileType html,md,pdf
	var markdownDownload=function(content,fileType){
		var name = getMarkdownTitle()+'.'+fileType;
		switch(fileType){
			case 'html':
				$.htmlDownload(markdown2html(content),name);
				break;
			case 'md':
				var the_editor = Editor.current();
				var code = the_editor.getValue();
				$.htmlDownload(code,name);
				break;
			case 'pdf':
				$.htmlPrint(markdown2html(content));
				break;
			default:break;
		}
	};

	//========================
	//
	return function(){
		var the_editor;
		var $thePreview;
		var $thePreviewContiner;
		var isFirstEditorScroll = false,
			isFirstHtmlScroll = false;

		var init = function(){
			the_editor = Editor.current();
			if (!the_editor|| typeof(the_editor.focus) == 'undefined'){
				return;
			}
			var uuid = the_editor.kod.uuid;
			$thePreview = $("#"+uuid).parent().find('.markdown_preview');
			$thePreviewContiner = $("#"+uuid).parent().find('.edit_right_frame .right_main');

			bindHtmlScroll();
			bindEditorScroll();
			bindMarkdownMenuClick();
		}
		var refresh = function(isReset){
			require.async('lib/markdown/markdown-it.min',function(){
				if (!$thePreview || $thePreview.length==0){
					return;
				}
				var md = window.markdownit({html:true,breaks:true});
				var code = the_editor.getValue();
				var html = md.render(code);
				var $buffer = $('.markdown_make_buffer');
				if($buffer.length == 0){
					$("<div class='markdown_make_buffer hidden'></div>").appendTo('body');
					$buffer = $('.markdown_make_buffer');
				}
				$buffer.html(html);
				markdownContent($buffer);
				parseCode($buffer,function(){
					$thePreview.html($buffer.html());
				});
				if($thePreview.html().length==0 || isReset===true){
					$thePreview.html($buffer.html());
				}
				$thePreview.html($buffer.html());
				//refreshScroll();

				// 公式处理
				parseMathJS($buffer,function(){
					$thePreview.html($buffer.html());
					$buffer.remove();
					refreshScroll();
				});
			});
		}



		var bindEditorScroll = function(){
			var hasMarkdown= function(){
				return !$thePreviewContiner.find('.preview_markdown_frame').hasClass('hidden');
			}

			var changeDelayTimer;//快速变化屏蔽
			the_editor.session.on("changeScrollTop", function(scrollTop){
				if(!isFirstHtmlScroll && hasMarkdown()){
					isFirstEditorScroll = true;
					setScroll(true);
					clearTimeout(changeDelayTimer);changeDelayTimer=false;
					changeDelayTimer = setTimeout(function(){
						isFirstEditorScroll = false;
					},1000);
				}
			});
			the_editor.on("change", function(e){
				if(!isFirstHtmlScroll && hasMarkdown()){
					isFirstEditorScroll = true;
					refreshScroll(function(){
						setScroll(true);
						clearTimeout(changeDelayTimer);changeDelayTimer=false;
						changeDelayTimer = setTimeout(function(){
							isFirstEditorScroll = false;
						},1000);
					});
				}
			});
		}
		var bindHtmlScroll = function(){
			return;//暂时关闭html滚动内容滚动
			var changeDelayTimer;//快速变化屏蔽
			$thePreviewContiner.unbind('scroll').bind('scroll',function(){
				var $parent = $thePreviewContiner.parents('.edit_content');
				if($('.markdown_full_page').length>0){
					return;
				}
				if(!isFirstEditorScroll){
					isFirstHtmlScroll = true;
					setScroll(false);
					clearTimeout(changeDelayTimer);changeDelayTimer=false;
					changeDelayTimer = setTimeout(function(){
						isFirstHtmlScroll = false;
					},1000);
				}
			});
		}

		var markdownTitle=[];
		var htmlTitle=[];
		var markdownTitleMake = function() {
			if( typeof(the_editor.kod.mode) == 'undefined' ||
				the_editor.kod.mode!='markdown'){
				return;
			}
			markdownTitle=[];
			var text = "\n...\n"+the_editor.getValue();
			var start_before = 0;
			var md = window.markdownit();
			var json = md.parse(text,{references: {}});
			var tagArr = ['h1','h2','h3','h4','h5','h6'];
			for (var i = 0; i < json.length; i++) {
				if($.inArray(json[i]['tag'],tagArr)>=0 && json[i]['type']=="heading_open"){
					var p_screen = the_editor.session.documentToScreenPosition(json[i]['map'][0]-1,2);
					var end = p_screen.row * the_editor.renderer.lineHeight;
					markdownTitle.push({
						"start":start_before,
						"end":end,
						"height":end-start_before
					});
					start_before = end;
				}
			}
			//var reg = /^ *```.*\n[\s\S]*?\n```|(^[ \t>-]*\#{1,6}[ \t]+)/gm;
			//text.replace(reg,function(match,title,offset) {});
		};

		var htmlTitleMake = function() {
			if (!$thePreviewContiner || $thePreviewContiner.length==0){
				return;
			}
			htmlTitle=[];
			var start_before = 0,
				scroller_top = $thePreviewContiner.scrollTop();
			$thePreview.find("h1,h2,h3,h4,h5,h6").each(function() {
				var end = $(this).position().top + scroller_top + parseInt($(this).css('margin-top'));
				htmlTitle.push({
					start:start_before,
					end:end,
					height:end-start_before
				});
				start_before = end;
			});
		};

		var changeDelayTimer;//快速变化屏蔽
		var refreshScroll = function(callback){
			clearTimeout(changeDelayTimer);changeDelayTimer=false;
			changeDelayTimer = setTimeout(function(){
				markdownTitleMake();
				htmlTitleMake();
				if (typeof (callback) == 'function'){
					callback();
				}
			},200);
		}

		var setScroll = function(isScrollEditor){
			//console.log("editor change",isFirstEditorScroll,isFirstHtmlScroll,';move:',isScrollEditor?'edit':'html');
			var editorTop = the_editor.session.getScrollTop();
			var htmlTop   = $thePreviewContiner.scrollTop();
			var move = function(srcScrollList,srcTop,destMoveList,moveAction){
				var findIndex = -1,findTitle;
				for (var i = 0; i < srcScrollList.length; i++) {//找到滚动条内最后一条title
					findIndex = i;findTitle = srcScrollList[i];
					if(srcTop<srcScrollList[i]['end']){
						break;
					}
				}
				//console.log('setScroll;find:',findIndex,';md:',markdownTitle.length,';html:',htmlTitle.length);
				if(findIndex === -1 || destMoveList.length<=findIndex) {
					return;
				}
				var posInSection = (srcTop - findTitle.start) / findTitle.height;
				var destTitle = destMoveList[findIndex];
				var destScrollTop = destTitle.start + destTitle.height * posInSection;

				if(findIndex==srcScrollList.length-1 && srcTop>=findTitle.end-5){
					destScrollTop = destTitle.end;
				}
				moveAction(destScrollTop);
			}
			if(isScrollEditor){//scrollEditor  moveHtml
				move(markdownTitle,editorTop,htmlTitle,function(dest){
					$thePreviewContiner.stop(true).animate({scrollTop:dest},100,"linear");
					//$thePreviewContiner.scrollTop(dest);
				});
			}else{//预览滚动， 自动定位编辑器位置
				//预览滚动到底部
				if(htmlTop+$thePreviewContiner.height()>=$thePreviewContiner.prop("scrollHeight")-5){
					the_editor.gotoLine(the_editor.session.getLength());
				}else{
					move(htmlTitle,htmlTop,markdownTitle,function(dest){
						the_editor.session.setScrollTop(dest);
					});
				}
			}
		}
		init();
		return {
			refresh:refresh,
			refreshScroll:refreshScroll,

			markdownMenu:markdownMenu,
			markdown2html:markdown2html,
			markdownDownload:markdownDownload
		}
	}
});


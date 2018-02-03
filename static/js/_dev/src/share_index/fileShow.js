define(function(require, exports) {
	var downloadUrl = 'index.php?share/fileDownload&user='+G.user+'&sid='+G.sid;
	var showUrl = 'index.php?share/fileProxy&user='+G.user+'&sid='+G.sid;
	if(G.param_rewrite=="1"){
		downloadUrl = downloadUrl.replace("index.php?","index.php/");
	}
	var init =function(){
		if (typeof(G.share_info) != "undefined"){
			var ext = core.pathExt(G.share_info.path);
			G.path = htmlDecode(G.path);
			G.share_info.path = htmlDecode(G.share_info.path);
			if(G.share_info['type']!='file'){
				showUrl+= '&path='+urlEncode(G.path);
				downloadUrl+= '&path='+G.path;
			}
			if(G.share_info['not_download'] == '1'){
				downloadUrl = "javascript:Tips.tips('"+LNG.share_not_download_tips+"',false);"
			}
			topbar.init();
			fileShow(ext);
		}else{
			$(".share_info").addClass('hidden');
		}
	};
	var showBindary = function(){
		var ext = core.pathExt(G.share_info.path);
		var box = $('.bindary_box');
		box.removeClass('hidden');
		box.find('.name').html(htmlEncode(G.share_info.name));
		box.find('.ico').html(core.icon(ext));
		box.find('.btn_download').attr('href',downloadUrl);
		var time = date('Y/m/d h:i',G.share_info['mtime']);
		box.find('.share_time').html(time);
		box.find('.size span').html(G.share_info['size']);
		$('body').addClass('can_select');
	};

	var htmlHexEncode=function(str){
		var res=[];
		for(var i=0;i < str.length;i++)
			res[i]=str.charCodeAt(i).toString(16);
		return "&#"+String.fromCharCode(0x78)+res.join(";&#"+String.fromCharCode(0x78))+";";//x ，防止ff下&#x 转义
	};
	var showCode = function(){
		var ace_tools = ace.require("ace/ext/language_tools");
		var aceModeList = ace.require("ace/ext/modelist");

		var hookNet = ace.require("ace/lib/net");
		hookNet.loadScript.hook("loadScript",hookNet,function (){
			if(typeof(arguments[0]) == "string" && arguments[0].search('mode-php.js') !== -1){
				arguments[0] = arguments[0].replace('mode-php.js','mode-phhp.js');
			}
			return arguments;
		});
		ace.config.moduleUrl.hook("moduleUrl",ace.config,function (){
			if(arguments[0].search('php_worker') !== -1){
				arguments[0] = arguments[0].replace('php_worker','phhp_worker');
			}
			return arguments;
		});
		$.get(showUrl,function(data){
			var theMode = aceModeList.getModeForPath(G.share_info.path).mode;
			var html = '<pre class="code" id="ace_text_show">'+ htmlHexEncode(data)+'</pre>';
			$('.content_box').addClass('show_code').append(html);

			var this_editor = ace.edit('ace_text_show');
			this_editor.setTheme("ace/theme/tomorrow");//tomorrow monokai
			this_editor.setReadOnly(true);
			this_editor.setShowPrintMargin(false);//代码宽度提示
			this_editor.getSession().setMode(theMode);
			this_editor.getSession().setTabSize(4);
			this_editor.getSession().setUseWrapMode(1);
			this_editor.setFontSize(15);
		});
	}
	var showMarkdown = function(){
		require.async('lib/markdown/markdown-it.min',function(){
			var md = window.markdownit({html:true,breaks:true});
			$.get(showUrl,function(data){
				var html = md.render(data);
				var $content = $('.content_box');
				$content.addClass('markdown_preview can_select').append(html);

				// TOC 目录
				$content.find('a').attr('target','_blank');
				var menu_tag = "<p>[TOC]</p>";
				if($content.html().indexOf(menu_tag)!=-1){
					var makeMarkdownMenu = function(buffer){
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
					var menu = makeMarkdownMenu($content);
					var html = $content.html();
					html = html.replace(menu_tag,menu);
					html = html.replace(/ data-link="#(.*?)">/g,'><a name="$1" id="$1"></a>');
					$content.html(html);
				}

				//代码高亮 & 公式
				require.async('lib/markdown/highlight.min',function(){
					$('.content_box').find('pre code').each(function(i,block){
						$(this).removeAttr('class');//自动判断语言
						hljs.highlightBlock(block);
					});
				});

				require.async([
					'lib/markdown/katex/katex.min.js',
					'lib/markdown/katex/katex.min.css',
					'lib/markdown/katex/contrib/auto-render.min.js',
					],function(){

					renderMathInElement($content[0], [
						{left: "$$", right: "$$", display: true}
					]);
					//依次渲染
					$('.katex-display').parent().addClass('markdown-latex');
					$content.find('.language-latex,.language-math,.language-katex').each(function(){
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

			});
		});
	}
	var showPlayer = function(){
		var play_url = G.app_host+showUrl;
		var myPlayer = require('../../common/myPlayer');
		myPlayer.play([{
			url:play_url,
			name:G.share_info.name,
			ext:core.pathExt(G.share_info.path)
		}]);
	}

	//文件展示
	var fileShow = function(ext){
		if (ext=='html' || ext =='htm'){
			// show_iframe();
			// return;
		}
		if (ext=='md'){//markdown
			showMarkdown();
			return;
		}

		if (ext == 'swf') {
			var html = core.createFlash(htmlEncode(showUrl),'');
			$('.content_box').addClass('show_swf').append(html);
			return;
		}
		if (inArray(core.filetype['image'],ext)){//单张图片打开
			var html = '<img src="'+htmlEncode(showUrl)+'"/>';
			$('.content_box').addClass("show_image").append(html);
			return;
		}
		
		if (inArray(core.filetype['movie'],ext) ||
			inArray(core.filetype['music'],ext)){
			showPlayer();
			return;
		}
		if (inArray(core.filetype['doc'],ext) || ext=='pdf'){
			var path = G.share_info.path;
			if(G.share_info['type']!='file'){
				path=G.path;
			}
			var url = G.app_host+'index.php?share/officeView&user='+G.user+'&sid='+G.sid+'&path='+path;
			var html = '<iframe src="'+url+'" frameborder="0" class="show_office"></iframe>';
			$('.frame-main').addClass('office_page').append(html);
			$('.content_box').addClass('hidden');
			return;
		}
		if (inArray(core.filetype['text'],ext)){
			showCode();
			return;
		}
		showBindary();
	};
	return{
		init:init
	}
});

define(function(require, exports) {
	tpl_search_box  = require('./tpl/search.html');
	tpl_search_list = require('./tpl/search_list.html');
	tpl_upload    = require('./tpl/upload.html');
	tpl_file_info = require('./tpl/fileinfo/file_info.html');
	tpl_path_info = require('./tpl/fileinfo/path_info.html');
	tpl_zipview   = require('./tpl/zipview.html');
	
	var search = require('./core.search');
	var tools  = require('./core.tools');//_dev
	var upload = require('./core.upload');
	var api    = require('./core.api');
	var playSound  = require('./core.playSound');
	var zipView    = require('./core.zipView');
	
	//目录作为数据放置到html 转义与反转义
	pathHashEncode = function(str){
		return hashEncode(str);
	};
	pathHashDecode = function(str){
		return hashDecode(str);
	};

	var initFirst = function(){
		window.require = require;
		template.config('escape',false);
		template.config('compress',true);
		template.helper('core',core);
		template.helper('window',window);
		if(typeof(G) != 'undefined'){
			if(G.is_root!=1){
				$(".menu_system_setting").remove();
			}
			if( G.is_root ||
				AUTH['system_member:get']==1 ||
				AUTH['system_group:get']==1){
			}else{
				$(".menu_system_group").remove();
			}
			if(G.user_config && G.user_config.animate_open == '0'){
				$.dialog.defaults.animate = false;
			}
			resetHost();
		}

		//右键
		

		if($.dialog.defaults.animate){
			loadRipple(//点击波纹效果
				['a','button','.context-menu-item','#picker',".menuShareButton",".menuRecycleButton",".section .list"],
				[".disabled",".disable",".ztree",'.disable-ripple']//排除
			);
		}
		$('a,img').attr('draggable','false');

		$.ajaxSetup({
			headers: {
				'X-CSRF-TOKEN':Cookie.get('X-CSRF-TOKEN')
			}
		});

		//电脑端手机端切换
		$(".common_footer [forceWap]").click(function(e){
			var type = $(this).attr('forceWap');
			Cookie.set('forceWap',type);
			window.location.reload();
		});
		core.setSkinDiy();
		core.tools.init();
		playserSupport();

		//依次执行注册的初始化回调方法
		if($.type(window.kodReady) == 'array'){
			for (var i=0; i < window.kodReady.length; i++) {
				window.kodReady[i]();
			}
		}
		titleTips();
	}
	var resetHost = function(){
		var port = window.location.port ? ":"+window.location.port : "";
		G.web_host = window.location.protocol+"//"+window.location.hostname+port+"/";
		G.app_host = rtrim(G.web_host,'/') + window.location.pathname.replace("index.php",'');
	}
	var playserSupport = function(){
		var support = {
			ie:{
				music:['mp3','m4a','aac'],
				movie:['mp4','m4v','flv','mov','f4v']
			},
			chrome:{//default chrome,firefox,edge
				music:['mp3','wav','m4a','aac','oga','ogg','webma'],
				movie:['mp4','m4v','flv','mov','f4v','ogv','webm','webmv']
			}
			//safari 已经禁用了flash
		}
		var isIE = !!window.ActiveXObject || "ActiveXObject" in window;
		var key = 'chrome';
		if(isIE){//$.browser.version ;;ie11不能通过ua判断
			key = 'ie';
		}
		core.filetypes.music = support[key].music;
		core.filetypes.movie = support[key].movie;
	}

	var titleTips = function(){
		if(isWap()){
			return;
		}
		require.async([
			"lib/poshytip/jquery.poshytip.js",
			"lib/poshytip/skin.css",
			],function(){
				var $title = $('[title]');
				$title.poshytip({
					className: 'ptips-skin',
					liveEvents: true,
					slide: false,
					alignTo: 'cursor',
					alignX: 'right',
					alignY: 'bottom',
					showAniDuration:150,
					hideAniDuration:200,
					//followCursor:true,
					//hoverClearDelay:500,
					offsetY:10,
					offsetX:20,
					showTimeout:function(){
						var timeout = 1500;
						if($(this).attr('title-timeout')){
							timeout = parseInt($(this).attr('title-timeout'));
						}
						return timeout;
					},
					content:function(){
						var str = $(this).data("title.poshytip");
						if($(this).attr('title-data')){
							var $target = $($(this).attr('title-data'));
							if($target.is('input') || $target.is('textarea')){
								str = $target.val();
							}else{
								str = $target.html();
							}
						}
						str = str?str:"";
						return str.replace(/\n/g,"<br/>");
					}
				});

				$('body').bind('mousedown click',function(){
					$($title).poshytip('hide');
					$(".ptips-skin").remove();
				});
				$('input,textarea').live('focus',function(){
					$($title).poshytip('hide');
					$(".ptips-skin").remove();
				});
		})
	}
	
	
	return {
		search:search,
		init:initFirst,
		serverDwonload:upload.serverDwonload,
		upload:upload.upload,
		uploadInit:upload.init,
		playSound:playSound.playSound,
		playSoundFile:playSound.playSoundFile,
		zipView:function(path){
			new zipView(path);
		},
		tools:tools,
		api:api,

		// ".docx.doc.odt.rtf.djvu.fb2.epub.xps.//.docm.dotm.dot.dotx.mht.//.wps.wpt.";
		// ".xls.xlsx.ods.csv//.xlt.xltx.xlsb.xlsm.//.et.ett.";
		// ".pps.ppsx.ppt.pptx.odp//.pot.potx.pptm.ppsm.potm.//.dps.dpt.";
		filetypes : {
			'image'	: ['jpg','jpeg','png','bmp','gif','ico','svg','cur',"webp"],
				//'tif','tiff'
			'music'	: ['mp3','wav','m4a','aac','oga','ogg','webma'],
				//'mid','wma','midi','m3a','aif','ac3','ram','m4b','mka','mp1','mx3','mp2'
			'movie'	: ['mp4','m4v','flv','mov','f4v','ogv','webm','webmv'],
				//'mp4v''wmv','avi','3gp','asf','mpg','rmvb','rm','mkv','mpeg','vob','mpv','ogm','qt'，'m2ts','mts','mpe'
			'doc'	: ['doc','docx','docm','xls','xlsx','xlsb','xlsm','ppt','pptx','pptm'],
			'archive':['zip','tar','gz','tgz','ipa','apk',    'rar','7z','iso','bz2','zx','z','arj'],
			'archive_list':['zip','tar','gz','tgz','ipa','apk',    'rar','7z','iso','zx','z','arj'],
			'text'	: [ 
				"txt","textile",'oexe','inc','csv','log','asc','tsv','lnk','url','webloc','meta',"localized",
				"xib","xsd","storyboard","plist","csproj","pch","pbxproj","local","xcscheme","manifest","vbproj",
				"strings",'jshintrc','sublime-project','readme','changes',"changelog",'version','license','changelog',

				"abap","abc","as","asp",'aspx',"ada","adb","htaccess","htgroups","htgroups",
				"htpasswd","asciidoc","adoc","asm","a","ahk","bat","cmd","cpp","c","cc","cxx","h","hh","hpp",
				"ino","c9search_results","cirru","cr","clj","cljs","cbl","cob","coffee","cf","cson","cakefile",
				"cfm","cs","css","curly","d","di","dart","diff","patch","dockerfile","dot","dummy","dummy","e",
				"ge","ejs","ex","exs","elm","erl","hrl","frt","fs","ldr","ftl","gcode","feature",".gitignore",
				"glsl","frag","vert","gbs","go","groovy","haml","hbs","handlebars","tpl","mustache","hs","hx",
				"html","hta","htm","xhtml","eex","html.eex","erb","rhtml","html.erb","ini",'inf',"conf","cfg","prefs","io",
				"jack","jade","java","ji","jl","jq","js","jsm","json","jsp","jsx","latex","ltx","bib",
				"lean","hlean","less","liquid","lisp","ls","logic","lql","lsl","lua","lp","lucene","Makefile","makemakefile",
				"gnumakefile","makefile","ocamlmakefile","make","md","markdown","mask","matlab","mz","mel",
				"mc","mush","mysql","nix","nsi","nsh","m","mm","ml","mli","pas","p","pl","pm","pgsql","php",
				"phtml","shtml","php3","php4","php5","phps","phpt","aw","ctp","module","ps1","praat",
				"praatscript","psc","proc","plg","prolog","properties","proto","py","r","cshtml","rd",
				"rhtml","rst","rb","ru","gemspec","rake","guardfile","rakefile","gemfile","rs","sass",
				"scad","scala","scm","sm","rkt","oak","scheme","scss","sh","bash","bashrc","sjs","smarty",
				"tpl","snippets","soy","space","sql","sqlserver","styl","stylus","svg","swift","tcl","tex",
				"toml","twig","swig","ts","typescript","str","vala","vbs","vb","vm","v","vh",
				"sv","svh","vhd","vhdl","wlk","wpgm","wtest","xml","rdf","rss","wsdl","xslt","atom","mathml",
				"mml","xul","xbl","xaml","xq","yaml","yml","vcproj","vcxproj","filters",

				"cer","reg","config","pem",'srt','ass'
			],
			'bindary':['bin',"hex",'zip','pdf','swf','gzip','rar','arj','tar','gz','cab','tbz','tbz2','lzh',
				'uue','bz2','ace','exe','so','dll','chm','rtf','odp','odt','pages','class','psd',
				'ttf','fla','7z','dmg','iso','dat','ipa','lib','a','apk','so','o']
		},
		//针对ace modelist 扩展名对应高亮的扩展
		fileOpenMode:{
			'ini':['inc','inf','strings'],
			'xml':["xib","xsd","storyboard","plist","csproj","pch","pbxproj","xcscheme","config","vcproj","vcxproj","filters","webloc"],
			'json':['oexe','jshintrc','sublime-project'],
			'markdown':['readme','changes','version','license','changelog']
		},
		
		//address;fav-tree;create-link
		getPathIcon:function(info,pathName){// path_type,id,role
			pathName = pathName==undefined?"":pathName;
			if($.type(info) == 'string'){
				var path = trim(trim(info),'/');
				info = {};
				if(path.substring(0,1) != "{" || path.split("/").length>1){
					return {icon:"",name:""};
				}
				info.path_type = path.match(/\{.*\}/);
				info.id = path.split(":")[1];
			}

			var arr = {};
			arr[G.KOD_USER_SHARE] = {icon:'userSelf',name:LNG.my_share};
			arr[G.KOD_GROUP_PATH] = {icon:'groupSelfOwner'};
			arr[G.KOD_GROUP_SHARE] = {icon:'groupGuest'};//has name

			arr[G.KOD_USER_RECYCLE] = {icon:'recycle',name:LNG.recycle}; 
			arr[G.KOD_USER_FAV] = {icon:'treeFav',name:LNG.fav};
			arr[G.KOD_GROUP_ROOT_SELF] = {icon:'groupSelfRoot',name:LNG.my_kod_group};
			arr[G.KOD_GROUP_ROOT_ALL] = {icon:'groupRoot',name:LNG.kod_group};

			var result = arr[info['path_type']];
			if(info['path_type'] == G.KOD_USER_SHARE && G.user_id != info['id']){
				result = {icon:'user',name:pathName};
			}else if(info['path_type'] == G.KOD_GROUP_PATH && info['role']=='owner'){
				result = {icon:'groupSelfOwner'};
			}
			if(result == undefined) result = {icon:"",name:""};
			if(result.name == undefined) result.name = pathName;
			return result;
		},
		isSystemPath:function(path,checkRead){
			var path = trim(trim(path),'/');
			if( path == undefined 
				|| path.substring(0,1) != "{" 
				|| path.split("/").length>1){
				return false;
			}
			var pathType = path.match(/\{.*\}/);
			var arr = [
				G.KOD_USER_SHARE,
				//G.KOD_GROUP_PATH,
				G.KOD_GROUP_SHARE,
				G.KOD_USER_RECYCLE,
				G.KOD_USER_FAV,
				G.KOD_GROUP_ROOT_SELF,
				G.KOD_GROUP_ROOT_ALL
			];
			var result = false;
			if($.inArray(pathType[0], arr) !== -1){
				result = true;
			}
			return result;
		},

		pathPre:function(path){
			path = trim(trim(path),'/');
			if( path == undefined || path.substring(0,1) != "{"){
				return "";
			}
			var pathType = path.match(/\{.*\}/);
			return pathType[0];
		},

		contextmenu:function(event){
			try{
				rightMenu.hidden();
			}catch(e){};
			//return true;
			var e = event || window.event;
			if (!e) return true;
			if ( (e && $(e.target).is('textarea'))
				|| $(e.target).is('input')
				|| $(e.target).is('p')
				|| $(e.target).is('pre')

				|| $(e.target).parents(".can_right_menu").length!=0
				|| $(e.target).parents(".topbar").length!=0
				|| $(e.target).parents(".edit_body").length!=0
				|| $(e.target).parents(".aui_state_focus").length!=0
				){
				return true;
			}
			return false;
		},
		//获取当前文件名
		pathThis:function(beforePath){
			if(!beforePath || beforePath=='/') return '';
			var path  = rtrim(this.pathClear(beforePath),'/');
			var index = path.lastIndexOf('/');
			var name  =  path.substr(index+1);

			//非服务器路径
			if (name.search('fileProxy')==0) {
				name = urlDecode(name.substr(name.search('&path=')));
				var arr = name.split('/');
				name = arr[arr.length -1];
				if (name=='') name = arr[arr.length -2];
			}
			return name;
		},
		pathClear:function(beforePath){
			if(typeof(beforePath) == 'function'){
				return;
			}
			if(!beforePath) return '';
			var path = beforePath.replace(/\\/g, "/");
			path = path.replace(/\/+/g, "/");
			//path = rtrim(path,'/');
			path = path.replace(/\.+\//g, "/");
			return path;
		},
		//获取文件父目录
		pathFather:function(beforePath){
			var path = rtrim(this.pathClear(beforePath),'/');
			var index = path.lastIndexOf('/');
			return path.substr(0,index+1);
		},
		//获取路径扩展名
		pathExt:function(beforePath){
			var path = trim(beforePath,'/');
			if(path.lastIndexOf('/')!=-1){
				path = path.substr(path.lastIndexOf('/')+1);
			}
			if(path.lastIndexOf('.')!=-1){
				return path.substr(path.lastIndexOf('.')+1).toLowerCase();
			}else{
				return path.toLowerCase();
			}
		},

		//绝对路径转url路径
		path2url :function(beforePath,testHttp,id,uid){
			if (beforePath.substr(0,4) == 'http') return beforePath;
			/*if(testHttp == undefined) testHttp = true;//尝试转换为http真实路径;只允许root用户
			var the_url,path = this.pathClear(beforePath);
			var ext = this.pathExt(path);
			var	pathUrlEncode = function(beforePath){//路径urlEncode
				if(!beforePath) return '';
				var path = urlEncode(beforePath);
				path = path.replace(/%2F/g,  "/");
				return path;
			};
			//user group
			if (G.is_root && testHttp &&
				path.substring(0,G.web_root.length) == G.web_root){//服务器路径下
				the_url = G.web_host+pathUrlEncode(path.replace(G.web_root,''));
			}else{*/
				the_url = G.app_host+'index.php?explorer/fileProxy&access_token='+G.access_token+'&path=' +urlEncode(beforePath) + '&fileid=' + id + '&this_uid=' + uid;
				if (typeof(G['share_page']) != 'undefined') {
					the_url = G.app_host+'index.php?share/fileProxy&user='+G.user+'&sid='+G.sid+'&path=' +urlEncode(beforePath) + '&fileid=' + id + '&this_uid=' + uid;
				}
			//}
			return the_url;
		},
		path3url :function(id){
			var the_url = G.app_host+'index.php?explorer/fileProxy&access_token='+G.access_token+'&fileid=' +id;
			return the_url;
		},
		pathReadable:function(path){//TODO 列表展开&分栏模式判断
			if(typeof(G.json_data)!="object"){
				return true;
			}
			var the_list;
			the_list=G.json_data['filelist'];
			for (var i=0;i<the_list.length;i++){
				if(the_list[i].path == path){
					if(the_list[i]['is_readable']==undefined || the_list[i]['is_readable'] == 1){
						return true;
					}else{
						return false;
					}
				}
			}
			the_list=G.json_data['folderlist'];
			for (var i=0;i<the_list.length;i++){
				if(the_list[i].path == path){
					if(the_list[i]['is_readable']==undefined || the_list[i]['is_readable'] == 1){
						return true;
					}else{
						return false;
					}
				}
			}
			return true;
		},
		pathCurrentWriteable:function(){
			if(Config.pageApp == "editor"){
				return false;
			}else{
				if(!G.json_data.info){
					return false;
				}
				return G.json_data.info.can_upload;
			}
		},
		authCheck:function(type,msg){
			if (G.is_root) return true;
			if (!AUTH.hasOwnProperty(type)) return true;
			if (AUTH[type]) {
				return true;
			}else{
				if (msg == undefined) {
					msg = LNG.no_permission
				}
				Tips.tips(msg,false);
				return false;
			}
		},
		ajaxError:function(xhr, textStatus, errorThrown){
			var error = xhr.responseText;
			var dialog = $.dialog.list['ajaxErrorDialog'];
			Tips.close(LNG.system_error,false);
			//已经退出或者返回的是登陆或授权页面
			if (error.substr(0,17) == '<!--user login-->') {
				setTimeout(function(){
					var page = ShareData.frameTop();
					page.location.reload();
				},500);
				return;
			}
			if(xhr.status == 0 && error==''){
				error = '网络连接错误 (net::ERR_CONNECTION_RESET)，连接已重置<br/>请联系主机商或网管，检查防火墙配置！';
			}
			error = '<div class="ajaxError">'+error+'</div>';
			if (dialog) {
				dialog.content(error);
			}else{
				$.dialog({
					id:'ajaxErrorDialog',
					padding:0,
					width:'60%',
					height:'50%',
					fixed:true,
					resize:true,
					ico:core.icon('error'),
					title:'ajax error',
					content:error
				});
			}			
		},
		fileGet:function(path,callback,errorCallback) {
			var newpath = 'filename=' + path; 
			var theKey = 'filename';//file_url;
			if (path.substr(0,4) == 'http'){
				theKey = 'file_url';
			}
			var requestUrl = './index.php?editor/fileGet&'+theKey+'='+urlEncode(newpath);
			if (typeof(G['share_page']) != 'undefined') {
				requestUrl = './index.php?share/fileGet&user='+G.user+'&sid='+G.sid+'&'+theKey+'='+urlEncode(path);
			}
			if(path.substr(0,'./index.php?'.length) == './index.php?'){
				requestUrl = path;
			}
			//Tips.loading(LNG.getting);
			$.ajax({
				url:requestUrl,
				dataType:'json',
				error:function(XMLHttpRequest, textStatus, errorThrown){
					//Tips.close(LNG.error,false);
					core.ajaxError(XMLHttpRequest, textStatus, errorThrown);
					if (typeof(errorCallback) == 'function')errorCallback();
				},
				success:function(data){
					//Tips.close(data);
					if (typeof(callback) == 'function')callback(data.data.content,data,requestUrl);
				}
			});
		},
		fileInfo:function(param,callback){
			var url = 'index.php?explorer/pathInfo';
			if (typeof(G['share_page']) != 'undefined'){
				url = 'index.php?share/pathInfo&user='+G.user+'&sid='+G.sid;
			}
			$.ajax({
				url:url,
				type:'POST',
				dataType:'json',
				data:param,
				error:core.ajaxError,
				success:function(data){
					if (typeof(callback) == 'function')callback(data);
				}
			});
		},
		fileLink:function(path,callback){
			var param = 'list=[{"type":"file","path":"'+urlEncode(path)+'"}]&viewPage=1';
			this.fileInfo(param,function(data){
				var url = data.code?data.data.download_path:false;
				if(!url){
					Tips.tips(LNG.no_permission_action+"==>"+LNG.group_role_pathinfo,false);
					return;
				}
				if (typeof(callback) == 'function')callback(url);
			});
		},
		// setting 对话框
		setting:function(setting){
			if (setting == undefined){
				if (G.is_root) {
					setting = 'system';
				}else{
					setting = 'user';
				}
			}
			if (!ShareData.frameTop('Opensetting_mode')) {
				$.dialog.open('./index.php?setting#'+setting,{
					id:'setting_mode',
					fixed:true,
					ico:core.icon('setting'),
					resize:true,
					title:LNG.setting,
					width:950,
					height:600
				});
			}else{
				ShareData.frameTop('Opensetting_mode',function(page){
					page.Setting.setGoto(setting);
					$.dialog.list['setting_mode'].display(true);
				});
			}
		},
		copyright:function(){
			var tpl_list = require('./tpl/copyright.html');
			var render = template.compile(tpl_list);
			var top = ShareData.frameTop();
			top.art.dialog({
				id:"copyright_dialog",
				bottom:0,
				right:0,
				simple:true,
				resize:false,
				title:LNG.about+' kod',
				width:425,
				padding:'0',
				fixed:true,
				content:render({LNG:LNG,G:G})
			});
			top.$('.copyright_dialog').addClass('animated-700 zoomIn');
		},
		qrcode:function(url,follow){
			if(url.substr(0,2)=='./'){
				url = G.app_host+url.substr(2);
			}
			var image = './index.php?user/qrcode&url='+quoteHtml(urlEncode(url));
			var html = "<a href='"+quoteHtml(url)+"' s='"+url+"' target='_blank'><img src='"+image+"' style='border:1px solid #eee;'/></a>";
			$.dialog({
				follow:follow,
				fixed:true,
				resize:false,
				title:LNG.qrcode,
				padding:30,
				content:html
			});
		},
		appStore:function(){
			var top = ShareData.frameTop();
			top.$.dialog.open('./index.php?app',{
				id:'app_store',
				fixed:true,
				ico:core.icon('appStore'),
				resize:true,
				title:LNG.app_store,
				width:900,
				height:550
			});
		},
		openWindow:function(url){
			var top = ShareData.frameTop();
			var dialog = top.$.dialog.open(url,{
				fixed:true,
				resize:true,
				width:"80%",
				height:'75%'
			});
			return dialog;
		},
		openDialog:function(url,ico,title,name) {
			if (!url) return;
			if (name == undefined) name = 'openDialog'+UUID();

			var html = "<iframe frameborder='0' name='Open"+name+"' src='"+htmlEncode(url)+
					"' style='width:100%;height:100%;border:0;'></iframe>";
			var top = ShareData.frameTop();
			var dialog = top.$.dialog({
				id:name,
				fixed:true,
				title:title,
				ico:ico,
				width:'75%',
				height:'70%',
				padding:0,
				content:html,
				resize:true
			});
			return dialog;
		},
		openApp:function(app){
			if (app.type == 'url') {//打开url
				var icon = app.icon;
				if (app.icon.search(G.static_path)==-1 && app.icon.substring(0,4) !='http') {
					icon = G.static_path + 'images/file_icon/icon_app/' + app.icon;
				}

				//高宽css px或者*%
				if (typeof(app.width)!='number' && app.width.search('%') === -1){
					app.width = parseInt(app.width);
				}
				if (typeof(app.height)!='number' && app.height.search('%') === -1){
					app.height = parseInt(app.height);
				}
				if(!app.width ) app.width = '90%';
				if(!app.height ) app.height = '70%';
				var dialog_info = {
					resize:app.resize,
					fixed:true,
					ico:core.iconSrc(icon),
					title:app.name.replace('.oexe',''),
					width:app.width,
					height:app.height,
					simple:app.simple,
					padding:0
				}

				var top = ShareData.frameTop();
				if(core.pathExt(app.content)=='swf'){
					dialog_info['content'] = core.createFlash(app.content);
					top.$.dialog(dialog_info);
				}else{
					top.$.dialog.open(app.content,dialog_info);
				}
			}else{
				var exec = app.content;
				eval('{'+exec+'}');
			}
			//$('.aui_state_focus').removeClass('dialog-simple');
		},
		update:function(action){
			setTimeout(function(){
				var url = base64Decode('Ly9zdGF0aWMua2FsY2FkZGxlLmNvbS91cGRhdGUvbWFpbi5qcw==')+'?a='+UUID();
				require.async(url,function(up){
					try{
						up.todo('check');
					}catch(e){};
				});
			},200);
		},
		openPath:function(path){
			if (typeof(Config)!='undefined' && Config.pageApp == 'explorer'){
				ui.path.list(path,'tips');
			}else{
				core.explorer(path);
			}
		},
		explorer:function (path,title) {
			if (path == undefined) path = '';
			if (title == undefined) title=core.pathThis(path);

			var the_url = './index.php?/explorer&type=iframe&path='+path;
			if (typeof(G['share_page']) != 'undefined') {
				the_url = './index.php?share/folder&type=iframe&user='+G.user+'&sid='+G.sid+'&path='+path;
			}

			var top = ShareData.frameTop();
			var dialog = top.$.dialog.open(the_url,{
				className:"dialogExplorer",
				resize:true,
				fixed:true,
				ico:core.icon('folder'),
				title:title,
				width:"80%",
				height:'75%'
			});

			//多个则偏移
			var offset = 20 * top.$('.dialogExplorer').length;
			dialog.DOM.wrap.css({
				'left':"+="+offset+"px",
				'top' :"+="+offset+"px"
			});
		},
		explorerCode:function (path) {
			if (path == undefined) path = '';
			var the_url = 'index.php?/editor&project='+path;
			if (typeof(G['share_page']) != 'undefined') {
				the_url = './index.php?share/code_read&user='+G.user+'&sid='+G.sid+'&project='+path;
			}
			// $.dialog.open(the_url,{
			// 	resize:true,fixed:true,
			// 	ico:core.icon('folder'),
			// 	title:core.pathThis(path),
			// 	width:"85%",height:"75%"
			// });
			window.open(the_url);
		},

		//加载完后替换
		setSkinFinished:function(){
			//Tips.close();
			var skin = $('.setSkin_finished').attr('src');
			if (skin){
				$("#link_css_list").attr("href",skin);
				$('.setSkin_finished').remove();
			}
		},
		setSkin:function(theme){
			LocalData.set('theme',theme);
			G.user_config.theme = theme;
			var url = G.static_path+'style/skin/'+theme+'.css';
			if(url != $('#link_css_list').attr('href')){ //同一个主题则不再重复加载
				$('body').append('<img src="'+url+'" onload="core.setSkinFinished();" onerror="core.setSkinFinished();" class="hidden setSkin_finished">');
			}
			this.setSkinDiy();
		},
		setSkinDiy:function(){
			if(!G.user_config){
				return;
			}
			var theme = LocalData.get('theme');
			var themeStyleId = 'kod_diy_style';
			var config = LocalData.getConfig(themeStyleId);
			if( typeof(config) != 'object' && 
				typeof(G.user_config.theme_diy) == 'object'){
				config = G.user_config.theme_diy;
			}
			if(typeof(config) != 'object'){
				config = {
					bg_blur:1,
					bg_image:G.static_path+"images/wall_page/9.jpg",
					bg_type:"color",
					start_color:"#456",
					end_color:"#000",
					color_rotate:"200"
				};
				LocalData.setConfig(themeStyleId,config);
			}
			G.user_config.theme_diy = config;

			var style = "";
			if(theme == 'diy' && config){//diy
				var theme_diy = require('./tpl/theme_diy.html');
				var render = template.compile(theme_diy);
				style  = render(config);
			}
			$.setStyle(style,themeStyleId);
		},

		//编辑器全屏 编辑器调用父窗口全屏
		editorFull:function(){
			var $frame = $('iframe[name=OpenopenEditor]');
			$frame.toggleClass('frame_fullscreen');
			// if($.dialog.list['openEditor'] ){
			// 	$.dialog.list['openEditor']._clickMax();
			// }
			//core.fullScreen();
		},
		language:function(lang){
			Cookie.set('kod_user_language',lang,24*365);//365 day
			window.location.reload();
		},
		//全屏&取消
		fullScreen:function(){
			if ($('body').attr('fullScreen') == 'true') {
				core.exitfullScreen();
			}
			$('body').attr('fullScreen','true');
			var top = ShareData.frameTop();
			var docElm = top.document.documentElement;
			if (docElm.requestFullscreen) {
				docElm.requestFullscreen();
			}else if (docElm.mozRequestFullScreen) {
				docElm.mozRequestFullScreen();
			} else if (docElm.webkitRequestFullScreen) {
				docElm.webkitRequestFullScreen();
			}
		},
		exitfullScreen:function(){
			$('body').attr('fullScreen','false');
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}else if(document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}else if(document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
		},
		//flash构造
		createFlash:function(swf,flashvars,id){
			var uuid = UUID();
			if (typeof(id)=='undefined' || id=='') {
				id = uuid;
			}

			var classID = '';
			if($.browser.msie && parseInt($.browser.version) < 9){
				classID = 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"';
			}
			var html = 
			'<object type="application/x-shockwave-flash" class="'+uuid+'" '+classID+' name="'+id+'" id="'+id
			+'" data="'+swf+'" width="100%" height="100%" tabindex="-1" >'
			+	'<param name="movie" value="'+swf+'"/>'
			+	'<param name="allowfullscreen" value="true" />'
			+	'<param name="allowscriptaccess" value="always" />'
			+	'<param name="allowScriptAccess" value="always" />'
			+	'<param name="flashvars" value="'+flashvars+'" />'
			+	'<param name="wmode" value="transparent" />'
			+'</object><div class="aui_loading" id="'+uuid+'_loading"><span>loading..</span></div>';

			//loading
			setTimeout(function(){
				var $swf = $('.'+uuid);
				if($swf.length !=1){//播放器属于最上层；桌面打开文件管理
					var top = ShareData.frameTop();
					$swf = top.$('.'+uuid);
				}
				if($swf.length !=1){
					return;
				}
				var time = 0;
				var flash = $swf[0];
				var interval = setInterval(function () {
					try {
						time++;
						if(Math.floor(flash.PercentLoaded()) == 100) { //轮询flash的某个方法即可
							$swf.next('.aui_loading').remove();
							clearInterval(interval);interval=null;
						}else{
							if(time>100){//10s还未加载
								$swf.next('.aui_loading').remove();
								clearInterval(interval);interval=null;
							}
						}
					}catch (ex) {}
				},100);
			},50);
			return html;
		},
		userSpaceHtml:function(str){
			var arr = str.split('/');
			var size_use = parseFloat(arr[0]);
			var size_max = parseFloat(arr[1])*1073741824;
			var size_use_display = core.fileSize(parseFloat(arr[0]));
			var size_max_display = core.fileSize(size_max);

			var html = size_use_display+'/';
			var percent = 100.0*size_use/size_max;
			if(percent>=100){
				percent = 100;
			}

			var warning = "";
			if(percent>=80){
				warning = "warning";
			}
			if(size_max==0 || isNaN(size_max)){
				html+= LNG.space_tips_full;
				percent = '0%';
			}else{
				html+= size_max_display;
				percent = percent+'%';
			}
			html = "<div class='space_info_bar'>"+
			"<div class='space_process'><div class='space_process_use "+
				warning+"' style='width:"+percent+"'></div></div>"+
			"<div class='space_info'>"+html+"</div>"+
			"</div>";
			return html;
		},
		fileSize:function(size,pointNum){
			if(size==undefined||size==''){
				return ''
			}
			if(pointNum==undefined){
				pointNum = 1;
			}
			if (size <= 1024) return parseInt(size)+"B";
			size = parseInt(size);
			var unit = {
				'G' : 1073741824,	// pow( 1024, 3)
				'M' : 1048576,		// pow( 1024, 2)
				'K' : 1024,		// pow( 1024, 1)
				'B' : 1			// pow( 1024, 0)
			};
			for (var key in unit) {
				if (size >= unit[key]){
					return (size/unit[key]).toFixed(pointNum)+key;
				}
			}
		},
		uploadCheck:function(type,showTips){
			showTips = showTips == undefined ? true:showTips;
			if(G['share_page']=="share"){
				return G.share_info["can_upload"]=="1";
			}
			if (type == undefined) {
				type = 'explorer:fileUpload';
			}
			if (!G.is_root &&
				AUTH.hasOwnProperty(type) &&
				AUTH[type]!=1){
				if(showTips){
					Tips.tips(LNG.no_permission,false);
				}				
				return false;
			}
			if (G.json_data && !G.json_data['info']['can_upload']){
				if(showTips){
					if(core.isSystemPath(G.this_path)){
						Tips.tips(LNG.path_can_not_action,false);
					}else{
						Tips.tips(LNG.no_permission_write,false);
					}
				}
				return false;
			}
			return true;
		}
	};
});


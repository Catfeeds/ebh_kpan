define(function(require, exports) {
	var bindEvent = function(){
		//地址栏点击，更换地址。
		$("#yarnball li a").die('click').live('click',function(e) {
			var path = $(this).attr('data-path');
			gotoPath(path);
			stopPP(e);
		});

		//$("#yarnball").die('click').live('click',function(){
		//	$("#yarnball").css('display','none');
		//	$("#yarnball_input").css('display','block');
		//	$("#yarnball_input input").focus();
		//	return true;
		//});

		//地址栏
		var $address = $("#yarnball_input input");
		$address.die('blur').live('blur',function(){
			gotoPath( $address.val() );
		}).keyEnter(function(){
			gotoPath( $address.val() );
		});

		// 头部功能绑定
		//enter搜索
		$('.header-right input').keyEnter(function(e){
			core.search($('.header-right input').val(),G.this_path);
		});
		$('.header-right input').bind('keyup focus',function(){
			ui.path.setSearchByStr($(this).val());
		});
		$('.header-content a,.header-content button').click(function(e){
			var action = $(this).attr('id');
			switch (action){
				case 'history_back':ui.path.history.back();break;
				case 'history_next':ui.path.history.next();break;
				case 'refresh':
					ui.f5(true,true);
					ui.tree.init();
					break;
				case 'home':ui.path.list(G.myhome);break;
				case 'fav':
					ui.path.pathOperate.fav({
						path:G.this_path,
						type:'folder',
						name:$("ul.yarnball li:last .title_name").html()
					});
					break;
				case 'goto_father':gotoFather();break;
				case 'setting':core.setting();break;
				case 'search':
					core.search($('.header-right input').val(),G.this_path);
					break;
				default:break;
			}
			return true;
		});
	};



	//更新地址栏
	var addressSet = function(resetAddress){
		var path = G.this_path;
		inputPath(G.this_path);
		$("#yarnball_input").css('display','none');
		$("#yarnball").css('display','block');

		 //地址可点击html拼装，与input转换
		var makeHtml = function(address) {
			var add_first = '<li class="yarnlet first"><a title="@1@" data-path="@1@" style="z-index:{$2};"><span class="left-yarn"></span>{$3}</a></li>\n';
			var add_more = '<li class="yarnlet "><a title="@1@" data-path="@1@" style="z-index:{$2};">{$3}</a></li>\n';
			address = address.replace(/\/+/g,'/');
			var arr = address.split('/');
			if (arr[arr.length - 1] == '') {
				arr.pop();
			}
			var this_address = arr[0]+'/';
			var li = add_first.replace(/@1@/g,this_address);
			var key = arr[0];
			var key_pre = '';
			if (G.json_data.info && G.json_data.info.path_type && arr[0] != '') {//特殊目录处理
				var iconInfo = core.getPathIcon(G.json_data['info'],G.json_data['info']['name']);
				key_pre = '<span class="address_ico">'+core.iconSmall(iconInfo.icon)+'</span>';
				key = iconInfo.name;
			}
			li = li.replace('{$2}',arr.length);
			li = li.replace('{$3}',key_pre+'<span class="title_name">'+htmlEncode(key)+"</span>");
			var html = li;
			for (var i=1,z_index=arr.length-1; i<arr.length; i++,z_index--){
				this_address += htmlEncode(arr[i])+'/';
				li = add_more.replace(/@1@/g,this_address);
				li = li.replace('{$2}',z_index);
				li = li.replace('{$3}','<span class="title_name">'+htmlEncode(arr[i])+"</span>");
				html += li;
			}
			return '<ul class="yarnball">'+html+'</ul>';
		};
		if(resetAddress == undefined){
			$("#yarnball").html(makeHtml(path));
		}
		resetWidth();
	};
	//自适应宽度
	var resetWidth = function(){
		$(".yarnball").stop(true,true);
		var box_width = $('#yarnball').innerWidth();
		var need_width = 0;
		$('#yarnball li a').each(function(index){
			need_width += $(this).outerWidth()+ parseInt($(this).css('margin-left'))+5;
		});

		var m_width = box_width - need_width;
		if(m_width<=0){
			$(".yarnball")
				.css('width',need_width +'px')
				.css('left',m_width+'px');
		}else{
			$(".yarnball").css({'left':'0px','width':box_width +'px'});
		}
	};

	var inputPath = function(path){
		var $input = $("#yarnball_input .path");
		if(path != undefined){//set
			$input.val(path);
		}else{//get
			var result = $input.val();
			result = rtrim(core.pathClear(result))+'/';
			return result;
		}
	}

	//地址栏enter或者 点击go按钮，main更换地址
	var gotoPath = function(path,resetAddress){
		ui.path.list(path);
		addressSet(resetAddress);
	};
	//转到上层目录
	var gotoFather = function(){
		var path = inputPath();
		if (path=='/' || path.indexOf('/')==-1) {
			Tips.tips(LNG.path_is_root_tips,'warning');
			return;
		};
		var gopath=core.pathFather(path);
		ui.path.list(gopath);
		addressSet();
	};
	return {
		init:bindEvent,
		addressSet:addressSet,
		resetWidth:resetWidth,
		gotoFather:gotoFather,
	}
});



define(function(require, exports) {
	var api = 'index.php?fav/';
	var init = function(setting){
		$.ajax({
			url:api+'get',
			dataType:'json',
			async:false,
			success:function(data){
				if (!data.code) {
					Tips.tips(data);return;
				}
				makeHtml(data.data,setting);
			},
			error:function(){
				return false;
			}
		});
	};
	var makeHtml = function(favData,setting){
		var html="<tr class='title'>"+
			"<td class='name'>"+htmlEncode(LNG.name)+"<span>("+LNG.can_not_repeat+")</span></td>"+
			"<td class='path'>"+htmlEncode(LNG.address)+"<span>("+LNG.absolute_path+")</span></td>"+
			"<td class='action'>"+LNG.action+"</td>"+
			"</tr>";
		for (var i in favData){
			html+=
			"<tr class='favlist' name='"+htmlEncode(favData[i]['name'])+"' path='"+htmlEncode(favData[i]['path'])+"'>"+
			"   <td class='name'><input type='text' id='sname' value='"
				+htmlEncode(favData[i]['name'])+"' /></td>"+
			"   <td class='path'><input type='text' id='spath' value='"
				+htmlEncode(favData[i]['path'])+"' /></td>"+
			"   <td class='action'>"+
			"		<button class='btn btn-default btn-sm edit'>"+LNG.button_save_edit+"</button>"+
			"		<button class='btn btn-default btn-sm del'>"+LNG.button_del+"</button>"+
			"   </td>"+
			"</tr>";
		}
		$('table#list').html(html);

		if (setting && setting.substring(0,4) == 'fav&') {//如果是添加收藏
			var name =  setting.split('&')[1].split('=')[1];
			var path =  setting.split('&')[2].split('=')[1];
			var type =  setting.split('&')[3].split('=')[1];
			name = htmlEncode(urlDecode(name));
			path = htmlEncode(urlDecode(path));

			var htmltr=
			"<tr class='favlist' name='' path=''>"+
			"   <input type='hidden' id='stype' value='"+type+"' />"+
			"   <td class='name'><input type='text' id='sname' value='"+name+"' /></td>"+
			"   <td class='path'><input type='text' id='spath' value='"+path+"' /></td>"+
			"   <td class='action'>"+
			"		<button class='btn btn-default btn-sm addsave'>"+LNG.button_save+"</button>"+
			"		<button class='btn btn-default btn-sm addexit'>"+LNG.button_cancel+"</button>"+
			"   </td>"+
			"</tr>";
			$(htmltr).insertAfter("table#list tr:last");
		}
	}
	
	//添加收藏记录，dom操作。
	var add = function(){
		var htmltr=
		"<tr class='favlist' name='' path=''>"+
		"   <input type='hidden' id='stype' value='folder' />"+
		"   <td class='name'><input type='text' id='sname' value='' /></td>"+
		"   <td class='path'><input type='text' id='spath' value='' /></td>"+
		"   <td class='action'>"+
		"		<button class='btn btn-default btn-sm addsave'>"+LNG.button_save+"</button>"+
		"		<button class='btn btn-default btn-sm addexit'>"+LNG.button_cancel+"</button>"+
		"   </td>"+
		"</tr>";
		$(htmltr).insertAfter("table#list tr:last");
	};
	var addEsc = function(){
		var obj=$(this).parent().parent();//定位到tr
		$(obj).detach();
	};
	//添加一条收藏记录，后保存
	var addSave = function(){
		var obj=$(this).parent().parent();//定位到tr
		var name=$(obj).find('#sname').val();
		var path=$(obj).find('#spath').val();
		var type=$(obj).find('#stype').val();
		if (name=='' || path ==''){
			Tips.tips(LNG.not_null,'error');
			return false;
		}
		$.ajax({
			url:api+'add&name='+urlEncode(name)+'&path='+urlEncode(path)+'&type='+type,
			dataType:'json',
			success:function(data){
				Tips.tips(data);
				if (data.code){
					$(obj).attr('name',name);
					$(obj).attr('path',path);
					var htmlaction=
					"<button class='btn btn-default btn-sm edit'>"+LNG.button_save_edit+"</button>"+
					"<button class='btn btn-default btn-sm del'>"+LNG.button_del+"</button>";
					$(obj).find('td.action').html(htmlaction);
					ShareData.frameTop('',function(page){
						page.ui.tree.refreshFav();
					});
				}
			}
		});
	};
	//编辑一条收藏记录
	var editSave = function(){
		var obj=$(this).parent().parent();//定位到tr
		var name=$(obj).attr('name');
		var name_to=$(obj).find('#sname').val();
		var path_to=$(obj).find('#spath').val();
		if (name_to=='' || path_to ==''){
			Tips.tips(LNG.not_null,'error');
			return false;
		}
		$.ajax({
			dataType:'json',
			url:api+'edit&name='+urlEncode(name)+'&name_to='+urlEncode(name_to)+'&path_to='+urlEncode(path_to),
			success:function(data){
				Tips.tips(data);
				if (data.code){
					$(obj).attr('name',name_to);
					ShareData.frameTop('',function(page){
						page.ui.tree.refreshFav();
					});
					init();
				}
			}
		});
	};
	//删除一条收藏记录
	var del = function(){
		var obj=$(this).parent().parent();//定位到tr
		var name=$(obj).attr('name');
		$.ajax({
			url:api+'del&name='+urlEncode(name),
			dataType:'json',
			async:false,
			success:function(data){
				Tips.tips(data);
				if (data.code){
					$(obj).detach();
					ShareData.frameTop('',function(page){
						page.ui.tree.refreshFav();
					});
				}
			}
		});
	};

	var bindEvent = function(){
		$('.fav .add').live('click',add);
		$('.fav .addexit').live('click',addEsc);
		$('.fav .addsave').live('click',addSave);
		$('.fav .edit').live('click',editSave);
		$('.fav .del').live('click',del);
	};
	bindEvent();

	return{
		init:init
	}
});



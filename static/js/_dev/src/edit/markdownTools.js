// var editor = Editor.current();
// var md=(
define(
function(require, exports) {
	var getEditor = function(){
		return Editor.current();
	}
	var items = {
		"bold":{type:"inline",tag:"**",insert:"**${1:Bold Text}**",title:"Bold<Strong> (Ctrl-B)","class":"bold"},
		"italic":{type:"inline",tag:"*",insert:"*${1:Italic Text}*",title:"Italic<em> (Ctrl-I)","class":"italic"},
		"strikethrough":{type:"inline",tag:"~~",insert:"~~${1:Strikethrough Text}~~",title:"Strikethrough<del>","class":"strikethrough"},

		"h1":{type:"head",insert:"# ",title:"Header 1 <h1>","class":"text-height"},
		"h2":{type:"head",insert:"## ",title:"Header 2 <h2>"},
		"h3":{type:"head",insert:"### ",title:"Header 3 <h3>"},
		"h4":{type:"head",insert:"#### ",title:"Header 4 <h4>"},
		"h5":{type:"head",insert:"###### ",title:"Header 5 <h5>"},
		// "h6":{type:"head",insert:"####### ",title:"Header 6 <h6>"},
		"quote":{type:"head",insert:"> ",title:"Quote <blockquote> (Ctrl-Q)","class":"quote-left"},
		"list_order":{type:"head",insert:" 1. ",title:"Unordered list <ol> (Ctrl-O)","class":"list-ol"},
		"list_unorder":{type:"head",insert:" - ",title:"Ordered list <ul> (Ctrl-U)","class":"list-ul"},
		"list_task":{type:"head",insert:"- [ ] ",title:"Incomplete task list","class":"check-empty"},
		"list_task_complete":{type:"head",insert:"- [x] ",title:"Complete task list","class":"check"},

		"line":{type:"insert",insert:"\n\n\n----\n$1",title:"Line <hr>","class":"minus"},
		"link":{type:"insert",insert:"[${1:}](http://$2)",title:"Link <a> (Ctrl-L)","class":"link"},
		"image":{type:"image",insert:"![${1:}](http://$2)",title:"Image <img> (Ctrl-G)","class":"picture"},
		"table":{type:"insert",insert:"\n\n\n| header 1    | header 2    |\n| ----------- | ----------- |\n| row 1 col 1 | row 1 col 2 |\n| row 2 col 1 | row 2 col 2 |\n\n",title:"Table <table>","class":"table"},

		"code":{type:"inlineBlock",title:"Code <pre><code> (Ctrl-K)","class":"code",
			inline:{tag:"`",insert:"`${1:Code}`"},//单行内选择，或没选择
			block:{tag:"\n```\n",insert:"\n```\n${1:code}\n```\n"}//选了整行(trim)或选者多行 没选——空行；
		},
		"math":{type:"inlineBlock",title:"Math (Ctrl-M)","class":"superscript",
			inline:{tag:"$$",insert:"$$${1:Math}$$"},
			block:{tag:"\n```\n",insert:"\n```math\n${1:}\n```\n"}
		}
	}

	// 行内元素左右加入标签；已经有则去除标签；处理后选中
	var inline = function(editor,item,key){
		var selectedText = editor.session.getTextRange(editor.getSelectionRange());
		var insert = item.insert;
		if(selectedText!==""){
			insert = insert.replace(/\{1:.*\}/g,"{1:"+selectedText+"}")
		}
		if(selectedText !== ""){//选中，判断前后是否已经含有标签；有标签则去除标签
			var range = editor.getSelectionRange();
			var rangeBefore = {
				start:{row:range.start.row,column:range.start.column - item.tag.length},
				end:range.start
			};
			var rangeAfter = {
				start:range.end,
				end:{row:range.end.row,column:range.end.column+item.tag.length}
			};
			if( editor.session.getTextRange(rangeBefore) == item.tag &&
				editor.session.getTextRange(rangeAfter) == item.tag){
				editor.selection.setSelectionRange({start:rangeBefore.start,end:rangeAfter.end});
				insert = "${1:"+selectedText+"}";
			}
		}
		ace.snippetManager.insertSnippet(editor,insert);
	}

	//TODO: null->h1->h2->h3->h4->h5->null; list<->order list
	var head = function(editor,item,key){
		var range = editor.getSelectionRange();
		var insertArr = [],removeArr = [];

		//全有则移除；全没有或都有则增加
		var headRangeArr = [];
		var lineNum = range.end.row - range.start.row + 1;
		var hasNum = 0;
		for (var i = 0; i < lineNum; i++) {
			var rangeHead = {
				start:{row:range.start.row+i,column:0},
				end:{row:range.start.row+i,column:item.insert.length}
			}
			headRangeArr.push(rangeHead);
			if(editor.session.getTextRange(rangeHead) == item.insert){
				hasNum++;
			}
		}

		//循环处理
		for (var i = 0; i < lineNum; i++) {
			var rangeTemp = headRangeArr[i];
			if(lineNum == hasNum){
				editor.session.doc.remove(rangeTemp);
			}else{
				editor.session.doc.insert({row:rangeTemp.start.row,column:0},item.insert);
			}
		}
	}
	var insert = function(editor,item,key){
		var selectedText = editor.session.getTextRange(editor.getSelectionRange());
		var insert = item.insert;
		if(selectedText!==""){
			insert = insert.replace(/\{1:.*\}/g,"{1:"+selectedText+"}")
		}
		ace.snippetManager.insertSnippet(editor,insert);
	}
	var inlineBlock = function(editor,item,key){
		var selectedText = editor.session.getTextRange(editor.getSelectionRange());
		var range = editor.getSelectionRange();
		var lineText = editor.session.getLine(range.start.row);

		//多行插入：选择了多行；or 选择的内容等于当前行内容
		var cell = {type:"inline",tag:item.inline.tag,insert:item.inline.insert,title:item.title};
		if( range.start.row != range.end.row ||
			selectedText === lineText.replace(/(^\s*)|(\s*$)/g,"") ){
			cell = {type:"inline",tag:item.block.tag,insert:item.block.insert,title:item.title};
		}
		inline(editor,cell);
	}

	var toolHtml = function(){
		var sort = [
			"bold","italic","strikethrough","|",
			//"h1","h2","h3","h4","|",
			"h1",
			"line","quote","list_order","list_unorder","|",
			"link","image","code","table","math"
		];
		var html = "";
		$.each(sort,function(index,key){
			if(key == '|'){
				html += "<span class='md-tools md-tools-split'>|</span>";
			}else{
				var item = items[key];
				var className = "class='md-tools md-tools-"+key+" " + (item["class"]?"icon-"+item["class"]:"") +"' ";
				html += "<a href='javascript:void(0);' title='"+item.title+"' "+className+" data-action='"+key+"'></a>";
			}			
		});
		return html;
	}

	var insertImage = function(editor){
		core.api.pathSelect(
			{type:'file',title:LNG.path_api_select_image,allowExt:"png|jpg|bmp|gif|jpeg|ico|svg|tiff"},
			function(path){
			core.fileLink(path,function(url){
				var name = core.pathThis(path);
				var insert = '!['+name+']('+url+')';
				ace.snippetManager.insertSnippet(editor,insert);
			});			
		});
	}

	var doAction = function(key){
		var item = items[key];
		var editor = getEditor();
		if(!item || !editor) return;
		switch(item.type){
			case "inline":inline(editor,item,key);break;
			case "head":head(editor,item,key);break;
			case "insert":insert(editor,item,key);break;
			case "inlineBlock":inlineBlock(editor,item,key);break;
			case "image":insertImage(editor);break;//image insert改为获取图片url
			default:break;
		}
		getEditor().focus();
	}

	var bindEvent = function($prent){
		$prent.find('.md-tools[data-action]').bind('click',function(){
			var action = $(this).attr('data-action');
			doAction(action);
		});
	}
	var bindHotkey = function(editor){
		$.each(items,function(key){
			var item = items[key];
			if(item.title && item.title.match(/\((.*)\)/)){
				var bindKey = item.title.match(/\((.*)\)/)[1];
				var macKey = bindKey.replace('Ctrl','Command');
				editor.commands.addCommand({
					name:key,
					bindKey: {win:bindKey,mac:macKey},
					exec: function (editor) {
						if(editor.session.$modeId == "ace/mode/markdown"){
							doAction(key);
						}						
					}
				});
			}
		});
	}
	return{
		bindEvent:function($parent,editor){
			$parent.find('.toolbar .content').html(toolHtml());
			bindEvent($parent);
			if(editor.session.$modeId == "ace/mode/markdown"){
				bindHotkey(editor);
			}
		},
		doAction:doAction
	}
}
);
// )();

define(function(require, exports, module) {
	//匹配参数 \([\w,\s\*\[\]\<\>&]*\)
	//匹配c函数修饰与返回值：([\w*]+\s+)+\*?
	var language_match={
		"php":[//ok
			{
				reg:/\n.*?\s*function\s+([_\w]+)\s*\(.*\)*/g,
				//reg:/\n.*\s+function\s*([_\w]+)\s*\(.*\)*/g,
				reg_name:/.*function\s+(.*\))/,
				reg_index:1,//name对应匹配的位置eg:\1
				type_extents:{//匹配后再次匹配内容，匹配成功则加入type标记
					'function_value':/\s*(private|protected)\s*/,
					'function_var':/\s*(public)\s*/,
				},
				type:'function'
			},
			{
				reg:/\s*class\s+(\w*)\s*.*\{/g,
				reg_name:/\s*class\s+(\w*)\s*.*\{/,
				reg_index:1,
				type:'class'
			}
		],
		"javascript":[ //ok js函数参数匹配；优化压缩后的匹配；一行匹配多个函数
			{//var test = function()
				reg:/\s*([\$\w'"\[\]\.]+)\s*=\s*function\s*\([\w,\s\*\[\]\<\>&$]*\)\s*\{/g,
				reg_name:/\s*([\$\w'"\[\]\.]+)\s*=\s*function\s*(.*)/,
				reg_index:1,
				reg_name_all:[1,2],
				type:'function function_var'
			},
			{//function test()
				reg:/\s*function\s+([\w\s]+)\s*\([\w,\s\*\[\]\<\>&$]*\)\s*\{/g,
				reg_name:/\s*function\s+([\w\s]+)\s*(.*)/,
				reg_index:1,
				reg_name_all:[1,2],
				type:'function function_define'
			},
			{//a:function()
				reg:/\s*([\w\.]+)\s*:\s*function\s*\([\w,\s\*\[\]\<\>&$]*\)\s*\{/g,
				reg_name:/\s*([\w\.]+)\s*:\s*function\s*(\([\w,\s\*\[\]\<\>&$]*\))/,
				reg_index:1,
				reg_name_all:[1,2],
				type:'function function_value'
			}
			// ,
			// {//function 匿名函数
			//     reg:/[\(,]+\s*(function\s*\([\w,\s\*\[\]\<\>&$]*\))\s*{/g,
			//     reg_name:/(function.*)\s*{/g,
			//     reg_index:0,
			//     type:'function function_define'
			// }
		],
		"python":[//ok
			{// class MethodCommenter
				reg:/\s*class\s+(\w+)\s*\(/g,
				reg_name:/\s*class\s+(\w+)\s*\(/,
				reg_index:1,
				type:'class'
			},
			{//def getSort(arr)
				reg:/\s*def\s+(\w+)\s*\(.*\)/g,
				reg_name:/\s*def\s+(\w+)\s*\(.*\)/,
				reg_index:1,
				type:'function'
			}
		],
		"ruby":[//ok
			{// class MethodCommenter
				reg:/\s*class\s+(\w+)\s*/g,
				reg_name:/\s*class\s+(\w+)\s*/,
				reg_index:1,
				type:'class'
			},
			{//def getSort(arr)
				reg:/\s*def\s+(\w+)\s*/g,
				reg_name:/\s*def\s+(\w+)\s*/,
				reg_index:1,
				type:'function'
			}
		],
		"golang":[//ok
			{// class MethodCommenter
				reg:/\s*class\s+(\w+)\s*/g,
				reg_name:/\s*class\s+(\w+)\s*/,
				reg_index:1,
				type:'class'
			},
			{//def getSort(arr)
				reg:/\s*func\s+(\w+)\s*.*\{/g,
				reg_name:/\s*func\s+(\w+)\s*/,
				reg_index:1,
				type:'function'
			}
		],
		"java":[//ok
			{
				reg:/\s*(final)?\s*(public|private|protected)\s*.*\s+(\w+)\s*\(.*\).*\{/g,
				reg_name:/\s*(final)?\s*(public|private|protected)\s*.*\s+(\w+)\s*\(.*\).*\{/,
				reg_index:3,
				type:'function'
			},
			{
				reg:/\s*class\s+(\w+)\s*/g,
				reg_name:/\s*class\s+(\w+)\s*/,
				reg_index:1,
				type:'class'
			}
		],
		"csharp":[//ok
			{
				reg:/\s*(public|private|protected)\s*.*\s+(\w+)\s*\(.*\).*/g,
				reg_name:/\s*(public|private|protected)\s*.*\s+(\w+)\s*\(.*\).*/,
				reg_index:2,
				type:'function'
			},
			{
				reg:/\s*class\s+(\w+)\s*/g,
				reg_name:/\s*class\s+(\w+)\s*/,
				reg_index:1,
				type:'class'
			}
		],

		"actionscript":[//ok
			{
				reg:/\s*function\s*(\w+)\s*\(.*\).*\s*\{/g,
				reg_name:/\s*function\s*(\w+)\s*\(.*\).*\s*\{/,
				reg_index:1,
				type:'function'
			},
			{
				reg:/\s*class\s+(\w+)\s*.*\{/g,
				reg_name:/\s*class\s+(\w+)\s*.*\{/,
				reg_index:1,
				type:'class'
			}
		],
		"objectivec":[//ok
			{//-(int) test:(){};
				reg:/[\+-]\s*\(.*\)\s*(\w+)\s*\:\s*\(.*/g,
				reg_name:/[\+-]\s*\(.*\)\s*(\w+)\s*\:\s*\(.*/,
				reg_index:1,
				type:'function'
			},
			{//-(int) test{};
				reg:/[\+-]\s*\([^:\{\}]*\)\s*(\w*)\s*\{/g,
				reg_name:/[\+-]\s*\([^:\{\}]*\)\s*(\w*)\s*\{/,
				reg_index:1,
				type:'function'
			},
			{//@implementation BLEDeviceViewController
				reg:/@implementation\s+(\w*)/g,
				reg_name:/@implementation\s+(\w*)/,
				reg_index:1,
				type:'class'
			},
			{//#pragma mark - BleClientDelegate
				reg:/#pragma\s+(mark\s+)?(.*)/g,
				reg_name:/#pragma\s+(mark\s+)?(.*)/,
				reg_index:2,
				type:'mark'
			}
		],
		"c_cpp":[//
			{// int *test(int argc, char const *argv[])
				reg:/([\w*]+\s+)+\*?(\w+)\s*\([\w\s\n\*\/\<\>\[\]\.&,:-]*\)\s*\{/g,
				reg_name:/\s+(\w+)\s*\(/,
				reg_index:1,
				type:'function'
			},
			{//void Robot::closedb(){  Robot::~Robot(){
				reg:/\s*(\w+)::~?(\w+)\s*\([\w\s\n\*\/\<\>\[\]\.&,:-]*\)\s*\{/g,
				reg_name:/\s*(\w+)::~?(\w+)\s*\(/,
				reg_index:2,
				type:'function function_define'
			},
			{// class CkxlolDlgBuild : public CDialogEx
				reg:/\s*class\s+(\w+)\s*:/g,
				reg_name:/\s*class\s+(\w+)\s*:/,
				reg_index:1,
				type:'class'
			}
			// {// template <class T,int MAXSIZE> void Stack<T, MAXSIZE>::push(T const& elem)
			//  reg:/\s*template\s*\<[\w,\s\*\[\]\<\>]*\>\s*.*(\w+)\s*\(/g,
			//  reg_name:/(\w+\s*)+\s(\*?\w+)\s*\(/,
			//  reg_index:2,
			//  type:'function function_define'
			// },
		]
	};

	//正则匹配查找；并定位字符所在位置。
	var regExec = function (str,regInfo){
		var match_list = str.match(regInfo.reg);
		if (!match_list) return;
		var result = [],
			match_len=match_list.length,
			str_start=0,
			current_str=str;
		//console.log(111,match_list,match_list.length);
		for(var i=0;i<match_len;i++){
			var info = {};
			info.the_match = match_list[i];
			var match_name = info.the_match.match(regInfo.reg_name);
			if (!match_name || match_name.length<regInfo.reg_index || !match_name[regInfo.reg_index]){//匹配出错则跳过
				//console.log('跳过',match_name,match_name,regInfo,regInfo.reg_index);
				continue;
			}

			info.name = match_name[regInfo.reg_index];
			var matchPos = current_str.indexOf(info.the_match);
			var nameMatchPos = info.the_match.indexOf(info.name);
			info.pos_start = str_start+matchPos+nameMatchPos;
			info.pos_end = info.pos_start+info.name.length;

			//展示全部
			if (typeof(regInfo['reg_name_all']) != "undefined") {
				info.name = '';
				var arr = regInfo['reg_name_all'];
				for (var j = 0; j < arr.length; j++) {
					info.name += match_name[arr[j]];
					//console.log(arr,match_name,arr[j])
				}
			}

			//console.log(info.name,'----',match_name,'-----',info.the_match,regInfo.reg_name);
			//从剩下的str中匹配
			str_start=str_start + matchPos+info.the_match.length;
			current_str = str.substr(str_start);
			info.type = regInfo.type;

			//匹配内容后再次匹配，成功后加入对应的类型
			if (typeof(regInfo['type_extents']) != "undefined") {
				$.each(regInfo['type_extents'],function(key,reg){
					if(info.the_match.match(reg)){
						info.type+= ' '+key;
					}
				});
			}
			result.push(info);
		}
		return result;
	}

	//listMake(editor.getValue(),'php');
	 var listMake = function(string,type){
		if (typeof(language_match[type]) == 'undefined') return;
		var regMatch = language_match[type];
		var matchResult = [];
		//匹配多个类型
		for (var i = 0; i < regMatch.length; i++) {
			var matchType = regExec(string,regMatch[i]);
			if (matchType) {
				Array.prototype.push.apply(matchResult,matchType);
			}
		}

		//排序
		matchResult.sort(function(a, b) {
			var filed = 'pos_start';
			if (a[filed] < b[filed]) { return -1; }
			if (a[filed] >= b[filed]) { return 1; }
		});
		//根据在字符串的位置，定位行列数
		var strArr = string.split('\n');
		var matchIndex = 0,//函数列表的位置
			info = matchResult[matchIndex],//函数列表位置pose
			strPose=0;//字符串截止到当前行当前位置
		for (var line = 0;line<strArr.length;line++){
			if (!info) break;
			while (info && info.pos_start >= strPose && info.pos_start<=strPose+strArr[line].length) {
				matchResult[matchIndex].range = {//range 追加到info
					start:{row:line,column:info.pos_start-strPose},
					end:  {row:line,column:info.pos_end-strPose}
				};
				matchIndex++;
				info = matchResult[matchIndex];//
			}
			strPose = strPose+strArr[line].length+1;//=1 回车符
		}
		return matchResult;
	};
	var outStr = function(str){
		str = str.replace(/[\r\n {]+/ig,' ');
		str = str.replace(/"/ig,"'");
		str = str.replace(/\</ig,"&lt;");
		str = str.replace(/\>/ig,"&gt;");
		return str;
	};

	return function(theEditor){
		var listHtml= '';//每次函数刷新后记录
		var listHtmlEmpty = '<div class="cell_null">No outline for the active view</div>';
		var $main = $('#'+theEditor.kod.uuid).parent();
		var $searchInput = $main.find('.function_search input');
		var $functionListBox = $main.find('.function_list_box');

		var refresh = function(){
			var editor = Editor.current();
			if (!editor|| typeof(editor.kod) == 'undefined'){
				$functionListBox.html(listHtmlEmpty);
				return;
			}
			var trim = function(str){
				var s = str.replace(/(^\s*)|(\s*$)/g,"");
				return s.replace(/(\{$)/,"");
			};
			var type   = editor.kod.mode,
				list = listMake(editor.getValue(),type);
			if (typeof(list) == 'undefined' || list.length==0){
				$functionListBox.html(listHtmlEmpty);
				return;
			}

			var curline = editor.getCursorPosition().row;
			listHtml = '';
			for (var i = 0;i<list.length; i++){
				var info = list[i],range=info.range;
				if (!range) continue;
				if (i<list.length-1&& curline>=list[i].range.start.row
					&& list[i+1].range
					&& curline< list[i+1].range.start.row){
					info.type += ' row_select';
				}
				if (i==list.length-1 && curline>=list[i].range.start.row){
					info.type += ' row_select';
				}
				var range_html = range.start.row+','+range.start.column+','+
								 range.end.row+','+range.end.column;
				var range_title = trim(trim(info.the_match)).substr(0,150);
				listHtml+= '<div class="list_row '+outStr(info.type)+' " title="'+outStr(range_title)+
					'" data-range="'+range_html+'">' +
					'<span class="icon"></span>'+
					'<span class="cell">'+outStr(info.name)+'</span></div>'
			}
			if(!$searchInput.val()){
				functionSearch($searchInput.val());
			}
			selectFunctionDisplay();
		};
		var functionSearch = function(search){
			if(listHtml==''){
				$functionListBox.html(listHtmlEmpty);
				return;
			}
			if(!search || search==''){
				$functionListBox.html(listHtml);
				selectFunctionDisplay();
				return;
			}

			var $list = $("<div>"+listHtml+"</div>");
			$list.find('.cell').each(function(){
				var text  = $(this).text();
				var index = text.toLowerCase().indexOf(search.toLowerCase());
				if(index!= -1){//忽略大小写的查找标记。
					text = text.substr(0,index)+'<b>'+text.substr(index,search.length)+'</b>'+text.substr(index+search.length);
					$(this).html(text);
				}else{
					$(this).parent().remove();
				}
			});
			$functionListBox.html($list.html());
			selectFunction($($functionListBox.find(".list_row").get(0)));
		}

		var selectFunction = function($dom){
			if($dom.length!=1){
				return;
			}
			$functionListBox.find('.list_row').removeClass('row_select');
			$dom.addClass("row_select");
			var range_str = $dom.attr('data-range');
			var range_arr = range_str.split(',');
			var range     = {//range 追加到info
				start:{row:parseInt(range_arr[0]),column:parseInt(range_arr[1])},
				end:  {row:parseInt(range_arr[2]),column:parseInt(range_arr[3])}
			}
			if (!Editor.current()) return;
			Editor.current().revealRange(range);
			$searchInput.textFocus();
		}
		var selectFunctionDisplay = function(){
			//设置选中的滚动条位置；有滚动条
			var $box = $functionListBox;
			if( $box.outerHeight() == $box.prop("scrollHeight")){
				return;
			}
			var start = $box.scrollTop();
			var end   = start + $box.height();
			var index = $box.find('.row_select').index();
			var row_height = $box.find(".list_row:eq(0)").outerHeight();

			var scroll_to = $box.scrollTop();
			if(index*row_height<start){
				scroll_to = index*row_height;
			}else if((index+1)*row_height>end){
				scroll_to = index*row_height-$box.height()+row_height;
			}
			//$box.stop(1,0).animate({'scrollTop':scroll_to+'px'},200);
			$box.scrollTop(scroll_to);
		}

		//绑定点击事件
		var init = function(){
			var clickClass = 'mouse_is_down';
			$functionListBox.delegate('.list_row','mouseover mousedown mouseout mouseup',function (event) {
				var $this = $(this);
				switch(event.type){
					case 'mouseover':
						if(!$this.parent().hasClass(clickClass)){
							$this.addClass("row_hover");
						}else{
							selectFunction($this);
						}
						break;
					case 'mousedown':
						selectFunction($this);
						$this.parent().addClass(clickClass);
						break;
					case 'mouseout':
						$this.removeClass("row_hover");
						break;
					case 'mouseup':
						$this.parent().removeClass(clickClass);
						//$searchInput.textFocus();
						break;
					default:break;
				}
			});
			$functionListBox.bind('mouseup',function(){
				$searchInput.textFocus();
			});

			//窗口外松起处理
			$functionListBox.bind('mousedown',function(e){
				if (e.which != 1) return true;
				if($functionListBox.setCapture) $functionListBox.setCapture();
				$(document).one('mouseup',function(e) {
					$functionListBox.removeClass(clickClass);
					if($functionListBox.releaseCapture) {$functionListBox.releaseCapture();}
				});
			});

			var searchChange = function(){
				var search = $searchInput.val();
				functionSearch(search);
				if(search==''){
					$main.find('.search_reset').addClass('hidden');
				}else{
					$main.find('.search_reset').removeClass('hidden');
				}
			}
			$searchInput.unbind('keydown').bind('keydown',function(e){
				switch(e.keyCode){
					case 37:break;
					case 39:break;
					case 38://up
						if($main.find(".row_select").prev().length!=0){
							selectFunction($main.find(".row_select").prev());
							selectFunctionDisplay();
						}
						stopPP(e);
						break;
					case 40://down
						if($main.find(".row_select").next().length!=0){
							selectFunction($main.find(".row_select").next());
							selectFunctionDisplay();
						}
						stopPP(e);
						break;
					case 27://esc
					case 13://enter
						selectFunction($main.find(".row_select"));
						$searchInput.val("");
						searchChange();
						Editor.current() && Editor.current().focus();
						stopPP(e);
						break;
					default:
						setTimeout(searchChange,5);
						break;
				}
			});
			$main.find('.search_reset').unbind('click').bind('click',function(){
				$searchInput.val("");
				searchChange();
				Editor.current() && Editor.current().focus();
			});
		}

		init();
		return {
			refresh:refresh,
			support:function(mode){
				if($.inArray(mode,objectKeys(language_match)) == -1){
					return false;
				}else{
					return true;
				}
			}
		}
	}
});


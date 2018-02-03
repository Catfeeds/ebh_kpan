<?php

$djoffice = APPHOST.'/lib/plugins/officeView/djoffice/';
function get_file_type($path) {
    $ext = get_path_ext($path);
    if ($ext  == "doc" || $ext  == "docx") {
        return "doc";
    }else if($ext  == "xls" || $ext  == "xlsx"||$ext  == "et"||$ext  == "csv") {
        return "xls";
    }else if($ext  == "ppt" || $ext  == "pptx" ) {
        return "ppt";
    }else if($ext  == "wps") {
        return "wps";
    }
}
?>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" scroll="no">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <title>office editor</title>
    <meta name="MSSmartTagsPreventParsing" content="True" />
    <meta http-equiv="MSThemeCompatible" content="Yes" />
    <meta name="renderer" content="webkit">
    <link href="<?php echo STATIC_PATH;?>style/common.css?ver=<?php echo KOD_VERSION;?>" rel="stylesheet"/>
    <link href="<?php echo STATIC_PATH;?>style/font-awesome/css/font-awesome.css?ver=<?php echo KOD_VERSION;?>" rel="stylesheet"/>
</head>
<body>

<style type="text/css" media="all">
    body{overflow:hidden;padding:0}
    .office_topbar{position:relative;width:100%;height:35px;background:#f6f6f6;border-bottom:1px solid #f6f6f6;}
    #weboffice_container{position:absolute;top:35px;bottom:0px;left:0px;right:0px;}
    #activex_error{margin-top:10%;line-height:1.5em;}
    #activex_error table{margin: 0 auto;}
    #activex_error table td{border:1px solid #cad9ea; padding:0 1em 0;height:30px;line-height:30px;}
</style>

<div class="office_topbar"> 
    <div class="btn-group">
        <button type="button" class="btn btn-success" onclick="save()">&nbsp;保&nbsp;存&nbsp;</button>
        <button type="button" class="btn btn-default" onclick="FullScreen()">&nbsp;全&nbsp;屏&nbsp;</button>
        <button type="button" class="btn btn-default" onclick="showPrintDialog()">&nbsp;打&nbsp;印&nbsp;</button>
    </div>
</div>
<div id="weboffice_container"></div>
<div id="activex_error">
    <table border="1" style="border:1px solid #cad9ea"> 
        <tr><td colspan="2" style="color:#f90;">您的电脑缺少插件，无法继续演示，您可能需要安装以下控件。</td></tr>
        <tr>
            <td>1. 兼容火狐或者谷歌浏览器插件，需要先安装的。安装后请重启浏览器</td>
            <td><a href="<?php echo $djoffice;?>ffactivex-setup-r39.exe">点击下载</a></td>
        </tr>
        <tr>
            <td>2. webOffice控件，确保安装兼容插件后请下载安装此控件，安装后记得重启浏览器哦</td>
            <td><a href="<?php echo $djoffice;?>Setup.exe">点击下载</a></td>
        </tr>
        <tr><td colspan="2">3. 您的电脑需要已经安装有office 或者 wps</td></tr>
    </table>
</div>

<script type="text/javascript" src="<?php echo STATIC_PATH;?>js/lib/jquery-1.8.0.min.js"></script>
<script type="text/javascript" src="<?php echo STATIC_PATH;?>js/lib/jquery-lib.js"></script>
<script type="text/javascript" src="<?php echo STATIC_PATH;?>js/lib/util.js"></script>
<script type="text/javascript">
    var current_path="<?php echo APPHOST;?>/lib/plugins/officeView/";
    var file_get_url="<?php echo $file_url;?>";
    var file_type="<?php echo get_file_type($this->in['path']);?>";
    var file_save_path="<?php echo APPHOST.'index.php?explorer/officeSave&from_activex=1&path='.rawurlencode($this->in['path']).'&access_token='.access_token_get();?>";

    var webObj;//
    function loadWebOffice(){
        var officeDom;
        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf("msie")>=0 || ua.indexOf("trident")>=0) {
        	officeDom = "<object id=WebOfficeObject height='100%' width='100%' style='LEFT: 0px; TOP: 0pxz-index:1;position:relative' "+
        	"classid='clsid:E77E049B-23FC-4DB8-B756-60529A35FAD5' codeBase='<?php echo $djoffice;?>Weboffice.cab#version=7,0,1,0' >"
            officeDom +="<param name='_ExtentX' value='6350'><param name='_ExtentY' value='6350'></OBJECT>";
        }else if (ua.indexOf("chrome")>=0 || ua.indexOf("firefox")>=0) {
            officeDom = "<object id=WebOfficeObject TYPE='application/x-itst-activex' clsid='{E77E049B-23FC-4DB8-B756-60529A35FAD5}'"+
            " event_NotifyCtrlReady='NotifyCtrlReady' progid='' height='100%' width='100%' style='LEFT: 0px;"+
            " TOP: 0px;z-index:1;position:relative' codeBase='<?php echo $djoffice;?>Weboffice.cab#version=7,0,1,0' >"+
            "<param name='_ExtentX' value='6350'><param name='_ExtentY' value='6350'><param name='wmode' value='transparent'></OBJECT>";
        }
        $('#weboffice_container').html(officeDom);
        webObj = document.getElementById("WebOfficeObject");
    }
    $(document).ready(function(e) {
        loadWebOffice();
        setTimeout(function(){
            checkActivex();
            weboffice_init();
        },300);
    });
    function weboffice_init() {
        try {
            webObj.LoadOriginalFile(file_get_url,file_type);
            webObj.ShowToolBar = 0;	// 隐藏工具栏 0为隐藏; 1为显示
            //webObj.HideMenuArea("hideall", "", "", "");	//隐藏开始菜单栏			
            webObj.SetTrackRevisions(0);					//不修订
            webObj.ShowRevisions(0);						//不显示修订
            webObj.SetToolBarButton2("Menu Bar", 1, 4)
            webObj.OptionFlag |= 0x0080;//显示进度条
        } catch (e) {
            showTips("您的电脑缺少插件，无法继续演示."+e.description);
            $('.office_topbar').remove();
            $('#weboffice_container').remove();
        }
    }
    function httppost() {
        webObj.HttpInit(); //初始化HTTP引擎。
        webObj.HttpAddPostCurrFile("file","");//设置上传当前文件,文件标识为FileBlod。 
        var ispost = webObj.HttpPost(file_save_path);//上传数据。　
        if (ispost.indexOf('succeed')>-1) {
            showTips("文档保存成功！",true);
            //webObj.engine.setAsync(false); //设置方法调用是否同步，false表示同步
        } else {
            showTips("文档保存失败！" + ispost);
        }
    }
    function FullScreen() {
        try {
            webObj.FullScreen = true;
        } catch (e) {
            //showTips("异常\r\nError:" + e + "\r\nError Code:" + e.number + "\r\nError Des:" + e.description);
        }
    }
    function showTips(msg,code) {
        if(!code){
            code = false;
        }
        Tips.tips(msg,code)
    }
    function save() {
        var tempPath = webObj.GetTempFilePath();//获取本地临时路径
        if (webObj.SaveTo(tempPath) >= 0) {
         	webObj.DeleteFile(tempPath);
        }
		httppost();
    }
    function showPrintDialog() {
        try {
            webObj.PrintDoc(1);
        } catch (e) {
            showTips("异常\r\nError:" + e + "\r\nError Code:" + e.number + "\r\nError Des:" + e.description);
        }
    }
    function checkActivex(){
        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf("chrome")>=0 || ua.indexOf("firefox")>=0) {
            var mimetype = navigator.mimeTypes["application/x-itst-activex"];
            if(!mimetype){
                $('.office_topbar').remove();
                $('#weboffice_container').remove();
            }
        }
    }
    // var openTimer = setInterval(function(){
    //     FullScreen();
    // },200);
    // setTimeout(function(){
    //     clearInterval(openTimer);
    // },5000);
</script> 

</body>
</html>

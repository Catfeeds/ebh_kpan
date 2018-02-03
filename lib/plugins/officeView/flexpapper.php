<?php
    @set_time_limit(0);
    @ignore_user_abort(true);
    $this_path = APPHOST.'/lib/plugins/officeView/flexpapper/';
    $cmd_doc2pdf = $GLOBALS['config']['settings']['office_server_doc2pdf'];
    $cmd_pdf2swf = $GLOBALS['config']['settings']['office_server_pdf2swf'];

    //构造文件名 文档md5追加系统key的md5
    $file_md5  = @md5_file($image);//文件md5
    if (strlen($file_md5)<5) {
        $file_md5 = md5($this->path);
    }
    $file_name = md5($file_md5.$this->config['setting_system']['system_password']);
    $file_path = TEMP_PATH.'office_file/';
    if (!file_exists($file_path.'index.html')) {
        mk_dir($file_path);
        touch($file_path.'index.html');
    }

    $file_pdf = $file_path.$file_name.'.pdf';
    $file_swf = $file_path.substr($file_name,0,10).'.swf';
    $the_file = $file_path.$file_name.'.'.get_path_ext($this->path);
    $command2pdf = sprintf($cmd_doc2pdf,$the_file,$file_pdf);//doc2pdf
    $command2swf = sprintf($cmd_pdf2swf,$file_swf,$file_pdf);//pdf2swf

    if (file_exists($file_swf)) {//存在，则检测时间
        $create_file = false;
        $info_file = file_info($this->path);
        $info_swf = file_info($file_swf);
        //修改时间对比,最新的有变更则删除现有
        if ($info_swf['mtime']<$info_file['mtime']) {
            del_file($file_swf);
        }
    }
    if(!file_exists($file_swf)){
        //copy一份到临时目录，避免中文文件名
        if (!file_exists($the_file)) {
            copy($this->path,$the_file);
        }
        //转换到pdf
        if (!file_exists($file_pdf)) {
            exec($command2pdf);
        }
        //转换到swf
        if (!file_exists($file_swf)) {
            exec($command2swf);
        }
        del_file($the_file);
        //del_file($file_pdf);
    }

    if (!file_exists($file_swf)) {
        show_tips("文档转换失败！");
    }
    header('Cache-Control:no-cache,must-revalidate');  
    header('Pragma:no-cache');

    $file_url = APPHOST.'data/temp/office_file/'.substr($file_name,0,10).'.swf';
    $language = LANGUAGE_TYPE;
    if ($language == 'zh_CN' || $language == 'zh_TW') {
        $language = 'zh_CN';
    }else{
        $language = 'en_US';
    }
?>

<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
        <meta http-equiv="pragma" content="no-cache" />
        <title>flash预览</title>
        <link rel="stylesheet" type="text/css" href="<?php echo $this_path;?>css/flexpaper.css"/>
        <script type="text/javascript" src="<?php echo STATIC_PATH;?>js/lib/jquery-1.8.0.min.js"></script>  
        <script type="text/javascript" src="<?php echo $this_path;?>js/flexpaper.js"></script>
        <script type="text/javascript" src="<?php echo $this_path;?>js/flexpaper_handlers.js"></script>
    </head>
    <body>
        <div id="documentViewer" style="position:absolute;top: 0px;left:0px;right:0px;bottom: 0px;"></div>
        <script type="text/javascript">
            $('#documentViewer').FlexPaperViewer(
                {config:{
                    SWFFile:"<?php echo $file_url;?>",
                    jsDirectory:"<?php echo $this_path.'js/';?>",
                    cssDirectory:"<?php echo $this_path;?>",

                    Scale:0.6,//初始化缩放比例
                    ZoomTransition:'easeOut',//缩放样式
                    ZoomTime:0.5,//从一个缩放比例变为另一个缩放比例所需时间
                    ZoomInterval:0.2,//缩放比例之间间隔
                    FitPageOnLoad:true,//初始化时自适应页面
                    FitWidthOnLoad : true,
                    FullScreenAsMaxWindow : true,
                    ProgressiveLoading :true,
                    MinZoomSize : 0.2,
                    MaxZoomSize : 5,
                    SearchMatchAll : true,
                    InitViewMode : 'Portrait',
                    RenderingOrder : 'flash',
                    StartAtPage : '',
                    ViewModeToolsVisible : true,
                    ZoomToolsVisible : true,
                    NavToolsVisible : true,
                    CursorToolsVisible : true,
                    SearchToolsVisible : true,
                    WMode : 'window',
                    localeChain:'<?php echo $language;?>'
                    }                
                }
            );
        </script>
    </body>
</html>

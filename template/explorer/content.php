<!--主面板-->
<div class="frame-main">
	<div class='frame-left'>
		
				<div class="top_left">
					<a href="./" class="topbar_menu title"><img src='<?=getavater($this->user)?>' style="width:30px;height:30p;border-radius:50%;margin-right: 10px;" /><?php echo $this->user['username'];?></a>
					
				
				
				</div>
			
		<ul id="folderList" class="ztree">
				
		</ul>
		<div class="bottom_box">
			<div class="user_space_info"></div>
			<div class="group_space_use">
				<div class='space_info_bar'>
					<div class='space_process'>
						<div class="space_process_use "></div>
					</div>
				<div class='space_info'>/1.0G</div>
				</div>
			</div>
			<?php if($isTeacher){?>
			<div class="box_content">
				<div class="cell menuShareButton"><span><?php echo $L['my_share'];?></span></div>
				<div style="clear:both"></div>
			</div>
			<?php } ?>
		</div>
	</div><!-- / frame-left end-->

	<div class='frame-resize'></div>
	<div class='frame-right'>
		<div class="frame-header">
			<div class="header-content">
				<div class="header-left">
					<div class="btn-group btn-group-sm">
						<button class="btn btn-default" id='history_back' title='<?php echo $L['history_back'];?>' type="button">
							<i class="font-icon icon-angle-left"></i>
						</button>
						<button class="btn btn-default" id='history_next' title='<?php echo $L['history_next'];?>' type="button">
							<i class="font-icon icon-angle-right"></i>
						</button>
					</div>
				</div><!-- /header left -->

				<div class='header-middle'>
					<button class="btn btn-default btn-left-radius ml-10" id='home' title='<?php echo $L['root_path'];?>'>
						<i class="font-icon icon-home"></i>
					</button>
					<div id='yarnball' title="<?php echo $L['address_in_edit'];?>"></div>
					<div id='yarnball_input'><input type="text" name="path" value="" class="path" id="path"/></div>

					<!--<button class="btn btn-default" id='fav' title='<?php echo $L['add_to_fav'];?>' type="button">
						<i class="font-icon icon-star"></i>
					</button>-->
					<!-- <button class="btn btn-default" id='refresh' title='<?php echo $L['refresh_all'];?>' type="button">
						<i class="font-icon icon-refresh"></i>
					</button> -->
					<button class="btn btn-default btn-right-radius" id='goto_father' title='<?php echo $L['go_up'];?>' type="button">
						<i class="font-icon icon-circle-arrow-up"></i>
					</button>
					<div class="path_tips" title="<?php echo $L['only_read_desc'];?>" title-timeout="0"><i class="icon-warning-sign"></i><span></span></div>
				</div><!-- /header-middle end-->
				<div class="topbar">
					<div class="content">
						<div class="top_right">
							<?php if(!isset($config['settings']['language'])){ ?>
							<div class="menu_group">
								<a id='topbar_language' data-toggle="dropdown" href="#" class="topbar_menu">
								<i class='font-icon icon-flag'></i><?php echo $L['setting_language'];?><b class="caret"></b>
								</a>
								<ul class="dropdown-menu topbar_language pull-right animated menuShow" role="menu" aria-labelledby="topbar_language">
									<?php
										$tpl = "";
										foreach ($config['setting_all']['language'] as $key => $value) {
											$name = $value[0];
											$select = LANGUAGE_TYPE == $key ? "this":"";
											$tpl .= "<li><a href='javascript:core.language(\"{$key}\");' title=\"{$key}/{$value[1]}/{$value[2]}\" class='{$select}'><i class='lang-flag flag-{$key}'></i>{$name}</a></li>";
										}
										echo $tpl;
									?>
								</ul>
							</div>
							<?php } ?>
							<a class="topbar_menu" href="javascript:core.setting('theme');"><i class="font-icon icon-dashboard"></i><?php echo $L['setting_theme'];?></a>
						
							<a class="topbar_menu" href="javascript:core.fullScreen();"><i class="font-icon icon-fullscreen"></i><?php echo $L['full_screen'];?></a>
							<!--<div class="menu_group">
								<a href="#" id='topbar_user' data-toggle="dropdown" class="topbar_menu"><i class="font-icon icon-user"></i>&nbsp;<b class="caret"></b></a>
								<ul class="dropdown-menu menu-topbar_user pull-right animated menuShow" role="menu" aria-labelledby="topbar_user">
									<li class="menu_system_setting"><a href="javascript:core.setting('system');"><i class="font-icon icon-cog"></i><?php echo $L['system_setting'];?></a></li>
									<li class="menu_system_group"><a href="javascript:core.setting('member');"><i class="font-icon icon-group"></i><?php echo $L['setting_member'];?></a></li>
									<li class="menu_system_user"><a href="javascript:core.setting('user');"><i class="font-icon icon-user"></i><?php echo $L['setting_user'];?></a></li>
									<li class="menu_system_theme"><a href="javascript:core.setting('theme');"><i class="font-icon icon-dashboard"></i><?php echo $L['setting_theme'];?></a></li>
									<li class="menu_system_full"><a href="javascript:core.fullScreen();"><i class="font-icon icon-fullscreen"></i><?php echo $L['full_screen'];?></a></li>
									<li class="menu_system_help"><a href="javascript:core.setting('help');"><i class="font-icon icon-question"></i><?php echo $L['setting_help'];?></a></li>
									<li class="menu_system_about"><a href="javascript:core.setting('about');"><i class="font-icon icon-info-sign"></i><?php echo $L['setting_about'];?></a></li>
									<li role="presentation" class="divider"></li>
									<li class="menu_system_logout"><a href="./index.php?user/logout"><i class="font-icon icon-signout"></i><?php echo $L['ui_logout'];?></a></li>
								</ul>
							</div>-->
						</div>
					</div>
				</div>		
				<div class='header-right'>
					<input type="text" name="seach" class="btn-left-radius" style="width:120px!important;"/>
					<button class="btn btn-default btn-right-radius" id='search' title='<?php echo $L['search'];?>' type="button">
						<i class="font-icon icon-search"></i>
					</button>
				</div>
			</div>
		</div><!-- / header end -->
		<div class="frame-right-main">
			<div class="tools">
				<div class="tools-left tools-left-share    <?php if(ST!='share'){echo 'hidden';}?>">
					<!-- 文件功能 -->
					<div class="btn-group btn-group-sm kod_path_tool">
						<button id='selectAll' class="btn btn-default" type="button">
							<i class="font-icon icon-check"></i><?php echo $L['selectAll'];?>
						</button>
						<button id='upload' class="btn btn-default" type="button">
							<i class="font-icon icon-cloud-upload"></i><?php echo $L['upload'];?>
						</button>

						<button id='download' class="btn btn-default" type="button">
							<i class="font-icon icon-download"></i><?php echo $L['download'];?>
						</button>
					</div>
					<span class='msg'><?php echo $L['path_loading'];?></span>
					<div class="clear"></div>
				</div>
				<div class="tools-left tools-left-explorer <?php if(ST=='share'){echo 'hidden';}?>">
					<!-- 回收站tool -->
					<div class="btn-group btn-group-sm kod_recycle_tool hidden fl-left">
						<button id='recycle_clear' class="btn btn-default" type="button">
				        	<i class="font-icon icon-folder-close-alt"></i><?php echo $L['recycle_clear'];?>
				        </button>
					</div>

					<!-- 分享 tool -->
					<div class="btn-group btn-group-sm kod_share_tool hidden fl-left">
						<button id='refresh' class="btn btn-default" type="button">
				        	<i class="font-icon icon-refresh"></i><?php echo $L['refresh'];?>
				        </button>
					</div>

					<!-- 文件功能 -->
					<div class="btn-group btn-group-sm kod_path_tool fl-left">
				        <button id='newfolder' class="btn btn-default" type="button">
				        	<i class="font-icon icon-folder-close-alt"></i><?php echo $L['newfolder'];?>
				        </button>
				        <button id='upload' class="btn btn-default" type="button">
				        	<i class="font-icon icon-cloud-upload"></i><?php echo $L['upload'];?>
				        </button>

				        <div class="btn-group btn-group-sm">
					    <button type="button" class="btn btn-default btn-sm toolPathMore" style="margin-right:40px;">
					      <i class="font-icon icon-ellipsis-horizontal"></i><?php echo $L['button_more'];?>&nbsp;<span class="caret"></span>
					    </button>
						</div>

                        <!--<div class="btn-group btn-group-sm menu-theme-list">-->
                        		<!--<button id="set_theme" title="<?php echo $L['setting_theme'];?>" type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown">
                        			<i class="font-icon icon-folder-close-alt"></i>&nbsp;&nbsp;<?php echo $L['app_group_all'];?>&nbsp;&nbsp;&nbsp;&nbsp;<span class="caret"></span>
                        		</button>
                        		<ul class="dropdown-menu pull-right dropdown-menu-theme animated menuShow" style="min-width:50px!important;width:110px!important;">
                        			 <li class="list list_all" theme="app_group_all"><a href="javascript:vido(0); draggable="false""><i class="font-icon icon-folder-close-alt"></i>&nbsp;&nbsp;<?php echo $L['app_group_all'];?></a></li>
                                     <li class="list list_document" theme="document"><a href="javascript:vido(0); draggable="false""><i class="font-icon icon-file"></i>&nbsp;&nbsp;&nbsp;<?php echo $L['document'];?></a></li>
                                     <li class="list list_movie" theme="movie"><a href="javascript:vido(0); draggable="false""><i class="font-icon icon-film"></i>&nbsp;&nbsp;<?php echo $L['theme_diy_movie'];?></a></li>
                                     <li class="list list_image" theme="theme_diy_image"><a href="javascript:vido(0); draggable="false""><i class="font-icon icon-picture"></i>&nbsp;&nbsp;<?php echo $L['theme_diy_image'];?></a></li>
                                     <li class="list list_music" theme="music"><a href="javascript:vido(0); draggable="false""><i class="font-icon icon-headphones"></i>&nbsp;&nbsp;<?php echo $L['theme_diy_music'];?></a></li>
                                     <li class="list list_zipbox" theme="group_role_zipbox"><a href="javascript:vido(0); draggable="false""><i class="font-icon icon-folder-close"></i>&nbsp;&nbsp;<?php echo $L['group_role_zipbox'];?></a></li>
                        		</ul>-->
                        <!--</div>-->
            		

					<div class="admin_real_path hidden fl-left ml-10">
						<button type="button" class="btn btn-default btn-sm dlg_goto_path">
							<i class="font-icon icon-folder-open"></i>
						</button>
	                </div>
					<span class='msg fl-left'><?php echo $L['path_loading'];?></span>
					<div class="clear"></div>
				</div>
				<div class="tools-right">
					<div class="btn-group btn-group-sm">
					  <button id='set_icon' title="<?php echo $L['list_icon'];?>" type="button" class="btn btn-default">
					  	<i class="font-icon icon-th"></i>
					  </button>
					  <button id='set_list' title="<?php echo $L['list_list'];?>" type="button" class="btn btn-default">
					  	<i class="font-icon icon-list"></i>
					  </button>
					  <button id='set_list_split' title="<?php echo $L['list_list_split'];?>" type="button" class="btn btn-default">
					  	<i class="font-icon icon-columns"></i>
					  </button>

					  <div class="btn-group btn-group-sm menu-theme-list">
					    <button id="set_theme" title="<?php echo $L['setting_theme'];?>" type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown">
					      <i class="font-icon icon-dashboard"></i>&nbsp;&nbsp;<span class="caret"></span>
					    </button>
					    <ul class="dropdown-menu pull-right dropdown-menu-theme animated menuShow">
						    <?php
						    	$arr = explode(',',$config['setting_all']['themeall']);
						    	foreach ($arr as $value) {
						    		echo "<li class='list' theme='{$value}'><a href='javascript:void(0);'>".$L['theme_'.$value]."</a></li>\n";
						    	}
							?>
					    </ul>
					  </div>
					</div>
					<div class="set_icon_size">
						<span class="dropdown-toggle" data-toggle="dropdown">
					    	<i class="font-icon icon-zoom-in"></i>
					    </span>
					    <ul class="dropdown-menu set_icon_size_slider animated menuShow">
						    <div class="slider_bg"></div>
						    <div class="slider_handle"></div>
					    </ul>
					</div>
				</div>
				<div style="clear:both"></div>
			</div><!-- end tools -->
			<div id='list_type_list' class="hidden">
				<div id="main_title">
					<div class="filename" field="name"><?php echo $L['name'];?><span></span></div><div class="resize filename_resize"></div>
					<div class="filetype" field="ext"><?php echo $L['type'];?><span></span></div><div class="resize filetype_resize"></div>
					<div class="filesize" field="size"><?php echo $L['size'];?><span></span></div><div class="resize filesize_resize"></div>
					<div class="filetime" field="mtime"><?php echo $L['modify_time'];?><span></span></div><div class="resize filetime_resize"></div>
					<div class="promulgator" field="gator" style="width:215px;float: left;cursor: pointer;overflow: hidden;line-height: 25px;height: 25px;border-right: 1px solid #eee;padding-left: 10px;margin-left: -10px;font-size: 1em;color: #448;"><?php echo $L['promulgator'];?><span></span></div><div class="resize filetime_resize"></div>
					<div style="clear:both"></div>

				</div>
			</div>
			</div><!-- list type 列表排序方式 -->

			<div class='bodymain html5_drag_upload_box menuBodyMain'>
				<div class="none hidden" style="width:344px;height:392px;background:url(../../static/images/common/none.png) no-repeat;position:absolute;left:50%;top:50%;margin-left:-172px;margin-top:-196px;"></div>
				<div class="list_split_box hidden">
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
					<div class="split_line"></div>
				</div>
				<div class="fileContiner"></div>
				<div class="fileContinerMore"></div>
			</div><!-- html5拖拽上传list -->
			<div class="file_select_info">
				<span class="item_num"></span>
				<span class="item_select"></span>
			</div>
		</div>
	</div><!-- / frame-right end-->
</div>
<!-- / frame-main end-->


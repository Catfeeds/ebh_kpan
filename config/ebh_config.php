<?php
$config = array(
    'title'=>'e板会-开启云教学互动时代',
    'keywords'=>'e板会',
    'description'=>'e板会',
    'ebhdb'=>array(
        'dbtype' => 'mysql',
        'dbdriver' => 'mysqli',
        'tablepre' => 'ebh_',
        'pconnect' => false,
        'dbcharset' => 'utf8',
        'autoload' => true,
        'dbhost' => '192.168.0.24',
        'dbuser' => 'root',
        'dbport' => 3306,
        'dbpw' => '123456',
        'dbname' => 'ebh2',
         'slave' => array(
             array(
                 'dbhost' => '192.168.0.24',
                 'dbuser' => 'root',
                 'dbport' => 3306,
                 'dbpw' => '123456',
                 'dbname' => 'ebh2',
             )
         )
    ),
	'pandb'=>array(
	    'dbtype' => 'mysql',
	    'dbdriver' => 'mysqli',
	    'tablepre' => 'pan_',
	    'pconnect' => false,
	    'dbcharset' => 'utf8',
	    'autoload' => true,
	    'dbhost' => '192.168.0.24',
	    'dbuser' => 'root',
	    'dbport' => 3306,
	    'dbpw' => '123456',
	    'dbname' => 'pan2',
	     'slave' => array(
	         array(
	             'dbhost' => '192.168.0.24',
	             'dbuser' => 'root',
	             'dbport' => 3306,
	             'dbpw' => '123456',
	             'dbname' => 'pan2',
	         )
	     )
	),
    'auto_helper'=>array(
        'ebhcommon'
    ),
    //cookie设置
    'cookie'=>array(
        'prefix'=>'ebh_',
        'domain'=>'.ebh.net',
        'alldomain'=>1, //设置此选项代表当前的主域名，级别高于domain
        'path'=>'/'
    ),
    //log
    'log'=>array(
        'log_path'=>'',                 //日志路径，为空为网站log目录
        'enable'=>true,            //启用日志
        'loglevel'=>1                  //记录日志级别，大于此级别的日志不予记录
    ),
	'cache'=>array(
				'driver'=>'memcache',
				'servers'=>array(
						array('host'=>'192.168.0.24','port'=>11200)
				)
	),
    'cache_redis'=>array(
        'driver'=>'redis',
        'servers'=>array(
            array('host'=>'192.168.0.24','port'=>6379)
        )
    ),
    //输出编码等设置
    'output'=>array('charset'=>'UTF-8'),
    //安全设置
    'security'=>array('authkey'=>'SFDSEFDSDF'),
    //设置WEB服务器软件类型
    'web'=>array('type'=>'nginx')
);
return $config;
<?php 
/**
 * test demo
 */
class demo extends EbhController{
	function __construct()    {
		parent::__construct();
	}

	/**
	 * index
	 */
	public function index() {
		
		//测试加载上传配置
		$_UP = Ebh::app()->getConfig()->load('upconfig');
		//var_dump($_UP);
		
		//测试加载基础配置
		$config = Ebh::app()->security;
		//var_dump($config);
		
		//测试input传值
		$input = Ebh::app()->getInput();
		$get = $input->get();
		$post = $input->post();
		$request = $input->request();
		$cookie = $input->cookie();
		
		//var_dump($post);
		//var_dump($request);
		
		//var_dump($cookie);
		
		
		//测试uri
		//$uri = Ebh::app()->getUri();
		//var_dump($uri);
		
		//测试log
		//log_message(12333);
		
		//测试获取网校信息
		$roominfo = $this->roominfo;
		var_dump($roominfo);
		$crid = $this->crid;
		var_dump($crid);
		
		echo demo;
	}

}

<?php
/**
* 网校缓存业务库，主要用于处理平台网校的缓存数据，并提供读和更新策略支持
* 所有缓存都区分网校
* 网校数据模块一般与数据库表名对应，如课件 则 module=courseware
*/
class Roomcache {
	var $cache = NULL;
	var $cachelist = array();
	var $cacheType = 'redis';	//可选redis和memcache
	var $updatekey = 'keys_';	//更新的缓存key前缀，后面需要跟上crid和模块名
	//当前使用网校数据缓存的模块，如果需要添加新的允许模块，可以在此处添加后再调用缓存方法
	//模块名称一般跟数据库表做对应，不以不同业务区分
	//其中item 包括网校资讯 广告等
	
	var $allowmodule = array(
		'roominfo',		//网校信息，包含classroom模块对应的数据，常用语或者网校详情信息，根据域名或crid或者网校数据
		'navigator',	//网校导航
		'teacher',		//教师个人信息
		'paypackage',	//服务包
		'payitem',		//服务项
		'news',			//网校资讯,模块资讯等
		'playlog',		//学生课件学习记录
		'item',			//网校广告 ad 等 ,总平台相关资讯
		'custommessage',	//网校模块自定义信息，首页自定义信息，自定义富文本
		'courseware',	//课件
		'survey',		//调查问卷
		'sendinfo',		//公告
        'user',     //用户
        'folder',       //课程
		'other'			//其他组合的缓存，如课件 网校等需要组合多表数据的列表，可以统一放到此处，other不能设置永久缓存，只能设置失效缓存，避免无法更新
	);
	/**
	* 缓存业务操作类
	* 将不同网校的缓存数据做分类
	*/
    public function __construct() {
		if($this->cacheType == 'memcached') {
			$this->cache = Ebh::app()->getCache();
		} else {
			$this->cache = Ebh::app()->getCache('cache_redis');
		}
	}
	/**
	* 获取网校对应缓存
	* @param $crid int 网校ID
	* @param $module string 数据模块，如 courseware folder credit 等一般跟数据库表名做对应
	* @param $param string 获取条件
	*/
	public function getCache($crid,$module,$param) {
		if(is_array($param)) {
			$param = implode($param);
		}
		$memkey = md5($param);
		$cachekey = "{$crid}_{$module}_{$memkey}";
		if(isset($this->cachelist[$cachekey]))
			return $this->cachelist[$cachekey];
		$memvalue = $this->cache->get($cachekey);
		$memvalue = unserialize($memvalue);
		return $memvalue;
	}
	/**
	* 设置网校对应缓存
	* @param $crid int 网校ID
	* @param $module string 数据模块，如 courseware folder credit 等一般跟数据库表名做对应
	* @param $param string 获取条件
	* @param $value string 对应的值
	* @param $cacheTime int 缓存超时时间（秒），0表示不设置超时
	* @param $needupdate bool 是否需要动态更新，如果需要，则会加入到缓存动态更新池中
	*/
	public function setCache($crid,$module,$param,$value,$cacheTime = 0,$needupdate = FALSE) {
		if(!in_array($module,$this->allowmodule)) {	//不在允许的缓存内，则不生成缓存
			log_message("$module 为非法的网校缓存模块");
			return FALSE;
		}
		if(is_array($param)) {
			$param = implode($param);
		}
		if ($module == 'other' && $cacheTime == 0) {	//不允许对 other的数据模块设置长效缓存
			$cacheTime = 300;
		}
		$memkey = md5($param);
		$cachekey = "{$crid}_{$module}_{$memkey}";
		$servalue = serialize($value);
		$this->cache->set($cachekey,$servalue,$cacheTime);
		if($needupdate) {	//需要根据数据更新时，将模块相关的信息放到一个缓存中，数据更新则更新此缓存。
			$updatekey = $this->updatekey.$crid.'_'.$module;
			if($this->cacheType == 'memcached') {
				$updatevalues = $this->cache->get($updatekey);
				if(empty($updatevalues)) {
					$updatevalues = array();
				}
				$updatevalues[$cachekey] = 1;
				$this->cache->set($updatekey,serialize($updatevalues),31536000);	//memcache缓存1年
			} else {
				$this->cache->hset($updatekey,$cachekey,1);
			}
		}
	}
	/**
	*更新网校模块对应缓存，可能会更新多个缓存
	*对于缓存数据需要后台手工更新时，对应后台的操作逻辑需要调用此代码
	*如需要更新网校下的课件缓存时候，则更新 updateCache(crid,'courseware');
	*/
	public function removeCaches($crid,$module) {
		$updatekey = $this->updatekey.$crid.'_'.$module;
		$updatevalues = NULL;
		if($this->cacheType == 'memcached') {
			$updatevalues = $this->cache->get($updatekey);
			if(!empty($updatevalues)){
				$updatevalues = unserialize($updatevalues);
			}
		} else {
			$updatevalues = $this->cache->hget($updatekey);
		}
		if(!empty($updatevalues)) {
			foreach($updatevalues as $cachekey=>$cache) {
				$this->cache->remove($cachekey);
			}
			$this->cache->remove($updatekey);

		}
	}
	/**
	* 更新单个缓存
	* @param $crid int 网校ID
	* @param $module string 数据模块，如 courseware folder credit 等一般跟数据库表名做对应
	* @param $param string 获取条件
	*/
	public function removeCache($crid,$module,$param) {
		if(is_array($param)) {
			$param = implode($param);
		}
		$memkey = md5($param);
		$cachekey = "{$crid}_{$module}_{$memkey}";
		$this->cache->remove($cachekey);
	}
}
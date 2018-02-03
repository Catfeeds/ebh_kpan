<?php
/**
 * 缓存类
 */
class CCache {
    private $driver = 'memcache';
    private $cacheobj = NULL;
    public function __construct($config) {
        if(empty($config) || empty($config['servers'])) {
            log_message('miss cache config.');
            return FALSE;
        }
        if(!empty($config['driver'])) {
            $this->driver = $config['driver'];
        }
        $classname = $this->driver.'_driver';
        $classpath = SYS_PATH.'cache/drivers/'.$classname.'.php';
        require $classpath;
        $cacheobj = new $classname($config['servers']);
        $cacheobj->init();
        $this->cacheobj = $cacheobj;
    }
    /**
     * 获取$key对应的缓存值
     * @param string $key
     * @return mixed
     */
    public function get($key) {
        return $this->cacheobj->get($key);
    }
    /**
     * 将$key对应的值存到缓存
     * @param string $key
     * @param mixed $value 可序列化的值
     * @param int $timeout 超时时间，以秒为单位
     * @return bool 成功时返回 TRUE， 或者在失败时返回 FALSE. 
     */
    public function set($key,$value,$timeout=0) {
        $result = $this->cacheobj->set($key,$value,$timeout);
		if($this->driver == 'memcache' && $result) {	//设置缓存 同时也设置缓存的key到module中
			$this->setcachekey($key);
		}
		return $result;
    }
    /**
     * 将缓存中的$key对应值从缓存中删除
     * @param string $key
     * @param int $timeout 删除超时时间，若为0则直接删除，否则待超时时间到后删除
     * @return bool 成功时返回 TRUE， 或者在失败时返回 FALSE. 
     */
    public function remove($key,$timeout = 0) {
        return $this->cacheobj->remove($key,$timeout);
    }
	/**
	* 根据给定模块和数据查询参数获取缓存的key值
	* 此方法会将每个模块下新的key保存到数组并放入缓存中，便于后期清理
	* @param string $module 模块，一般每个Model类或一个数据表对应一个模块，如课件就为courseware 课程 folder
	* @param array $param 查询参数 如 
	*/
	// public function getcachekey($module,$param) {
	// 	$cachekey = '';
	// 	if(is_array($param)) {
	// 		foreach($param as $pkey=>$pvalue) {
	// 			$cachekey .= $pkey.'_'.$pvalue;
	// 		}
	// 	} else {
	// 		$cachekey .= $param;
	// 	}
	// 	$cachekey = $module.'_'.md5($cachekey);
	// 	return $cachekey;
	// }
    public function getcachekey($module,$param) {
        return $module.'_'.md5(serialize($param));
    }
	/**
	* 将缓存的key放到module的缓存键值数组中，便于总后台手动清空缓存
	* 目前只支持memcache，待以后改进
	* @param string $cachekey 缓存的key值
	*/
	private function setcachekey($cachekey) {
		return TRUE;
		$ipos = strpos($cachekey,'_');
		if($ipos>0) {
			$module = substr($cachekey,0,$ipos);
			$keyarr = $this->get($module);	//获取模块下所有的key数组
			$newflag = FALSE;
			if(empty($keyarr)) {	//将新加的缓存key放入模块数组
				$keyarr = array($cachekey=>TRUE);
				$newflag = TRUE;
			} else if(!isset($keyarr[$cachekey])) {
				$keyarr[$cachekey] = TRUE;
				$newflag = TRUE;
			}
			if($newflag)	//是新的key则进行模块key缓存的更新
				$this->set($module,$keyarr,0);
		}
	}
	/*
	哈希表设置
	*/
	public function hset($name,$key,$value){
    	return $this->cacheobj->hset($name,$key,$value);
    }
	/**
	*填充hash表的值
	*@param string $name hash表的名字
	*@param array $arr hash表名对应的键值对 如 array('key1'=>'value1','key2'=>'value2') 相当于 hset($name,'key1','value1')和hset($name,'key2','value2')
	*/
	public function hMset($name,$arr){
    	return $this->cacheobj->hMset($name,$arr);
    }
	/*
	哈希表读取
	*/
	public function hget($name,$key = null,$serialize=false){
    	return $this->cacheobj->hget($name,$key,$serialize);
    }
	/*
	哈希表key+1
	*/
	public function hIncrBy($name, $key, $num = 1){
		return $this->cacheobj->hIncrBy($name, $key, $num);
	}
	/*
	哈希表key删除
	*/
	public function hdel($name,$key=null){
		return $this->cacheobj->hdel($name,$key);
	}
	/*
	哈希表删除
	*/
	public function del($name){
		return $this->cacheobj->del($name);
	}

	
	/**
	 *向集合添加元素
	 */
	public function sadd($skey,$array){
		return $this->cacheobj->sadd($skey,$array);
	}
	/**
	 *从集合删除元素
	 */
	public function srem($skey,$array){
		return $this->cacheobj->srem($skey,$array);
	}
	/**
	 *返回集合中随机一个元素并删除该元素
	 */
	public function spop($skey){
		return $this->cacheobj->spop($skey);
	}
	/**
	 *获取集合成员
	 */
	public function smembers($key){
		return $this->cacheobj->smembers($key);
	}
	
	/**
	 * @author eker
	 * @desc 增加一个魔术方法 当调用本类不存在的方法时 去memcache_driver/redis_driver中去找
	 * @param unknown $function_name
	 * @param unknown $args
	 */
	function __call($function_name, $args)
	{//log_message(var_export($args,true));
		if(method_exists($this->cacheobj,$function_name)==TRUE){
			return call_user_func_array(array($this->cacheobj, $function_name), $args);
		}else{
			$message = 	"你所调用的函数：$function_name(参数：<br />".var_export($args,true).")不存在！";
			log_message($message);
			return false;
		}
	}
}
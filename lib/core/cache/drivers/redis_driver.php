<?php
/**
 * Redis 操作，支持 Master/Slave 的负载集群
 *
 * @author ywl
 */
class redis_driver {
	
    private $_isUseCluster = false; //是否使用 M/S 的读写集群方案
    private $_sn = 0; //Slave 句柄标记
	private $_config = array();
    private $_linkHandle = array( //服务器连接句柄
								'master'=>null, //只支持一台 Master
								'slave'=>array(), //可以有多台 Slave
    						);
    
    
    /**
     * 构造函数
     *
     * @param boolean $isUseCluster 是否采用 M/S 方案
     */
    public function __construct($config,$isUseCluster=false){
        $this->_isUseCluster = $isUseCluster;
		$this->_config = $config;
    }
	
    /**
     * 初始化
     */
	public function init(){
		//添加主服务器
		$config = $this->_config[0];
		$cresult = $this->connect($config);
		if(!$cresult) {
			log_message('redis connect error');
		}
		if($this->_isUseCluster == true){
			//添加从服务器
			foreach($this->_config['slave'] as $s){
				$this->connect($s,false);
			}
		}
	}
	   
    /**
     * 连接服务器,注意：这里使用长连接，提高效率，但不会自动关闭
     *
     * @param array $config Redis服务器配置
     * @param boolean $isMaster 当前添加的服务器是否为 Master 服务器
     * @return boolean
     */
    public function connect($config=array('host'=>'127.0.0.1','port'=>6379), $isMaster=true){
        // default port
        if(!isset($config['port'])){
            $config['port'] = 6379;
        }
        // 设置 Master 连接
        if($isMaster){
            $this->_linkHandle['master'] = new Redis();
            $ret = $this->_linkHandle['master']->pconnect($config['host'],$config['port']);
        }else{
            // 多个 Slave 连接
            $this->_linkHandle['slave'][$this->_sn] = new Redis();
            $ret = $this->_linkHandle['slave'][$this->_sn]->pconnect($config['host'],$config['port']);
            ++$this->_sn;
        }
        return $ret;
    }
       
    /**
     * 关闭连接
     *
     * @param int $flag 关闭选择 0:关闭 Master 1:关闭 Slave 2:关闭所有
     * @return boolean
     */
    public function close($flag=2){
        switch($flag){
            // 关闭 Master
            case 0:
                $this->getRedis()->close();
            break;
            // 关闭 Slave
            case 1:
                for($i=0; $i<$this->_sn; ++$i){
                    $this->_linkHandle['slave'][$i]->close();
                }
            break;
            // 关闭所有
            case 2:
                $this->getRedis()->close();
                for($i=0; $i<$this->_sn; ++$i){
                    $this->_linkHandle['slave'][$i]->close();
                }
            break;
        }
        return true;
    }
       
    /**
     * 得到 Redis 原始对象可以有更多的操作
     *
     * @param boolean $isMaster 返回服务器的类型 true:返回Master false:返回Slave
     * @param boolean $slaveOne 返回的Slave选择 true:负载均衡随机返回一个Slave选择 false:返回所有的Slave选择
     * @return redis object
     */
    public function getRedis($isMaster=true,$slaveOne=true){
        // 只返回 Master
        if($isMaster){
            return $this->_linkHandle['master'];
        }else{
            return $slaveOne ? $this->_getSlaveRedis() : $this->_linkHandle['slave'];
        }
    }
       
    /**
     * 写缓存
     *
     * @param string $key 组存KEY
     * @param string $value 缓存值
     * @param int $expire 过期时间， 0:表示无过期时间
     */
    public function set($key, $value, $expire=0){
        // 永不超时
        if($expire == 0){
            $ret = $this->getRedis()->set($key, $value);
        }else{
            $ret = $this->getRedis()->setex($key, $expire, $value);
        }
        return $ret;
    }
    
    /**
     * 同时设置一个或多个key-value对。
     * @example $array=array('date'=>'2012.3.5','time'=>'9.09a.m.');
     */
    public function mset($array){
    	return $this->getRedis()->mset($array);
    }
    
    /**
     * 返回所有(一个或多个)给定key的值。
     * @param unknown $array
     */
    public function mget($keyarray){
    	return $this->getRedis()->mget($keyarray);
    }

    /**
     * 将一个或多个 member 元素加入到集合 key 当中，已经存在于集合的 member 元素将被忽略。
     * @param unknown $skey
     * @param unknown $array
     */
    public function sadd($skey,$array){
    	return $this->getRedis()->sadd($skey,$array);
    }
    
    /**
     * 在key集合中移除指定的元素.
     * @param unknown $skey
     * @param unknown $array
     */
    public function srem($skey,$array){
    	return $this->getRedis()->srem($skey,$array);
    }
    
    /**
     * 返回集合 key 中的所有成员
     * @param unknown $skey
     */
    public function smembers($skey){
    	return $this->getRedis()->smembers($skey);
    }
	
	/**
     * 单独设置key过期时间
     * @param int $time
     */
    public function expire($key,$time){
    	return $this->getRedis()->expire($key,$time);
    }
    
    /**
     * 用来以Unix时间戳格式设置键的到期时间
     * @param unknown $key
     * @param unknown $timestamp
     */
    public function expireAt($key,$timestamp){
    	return $this->getRedis()->expireAt($key,$timestamp);
    }
	
    /**
     * 读缓存
     *
     * @param string $key 缓存KEY,支持一次取多个 $key = array('key1','key2')
     * @return string || boolean  失败返回 false, 成功返回字符串
     */
    public function get($key){
        //是否一次取多个值
        $func = is_array($key) ? 'mGet' : 'get';
        //没有使用M/S
        if(! $this->_isUseCluster){
            return $this->getRedis()->{$func}($key);
        }
		//使用了 M/S
        return $this->_getSlaveRedis()->{$func}($key);
    }
    
    /**
     * 条件形式设置缓存，如果 key 不存时就设置，存在时设置失败
     *
     * @param string $key 缓存KEY
     * @param string $value 缓存值
     * @return boolean
     */
    public function setnx($key, $value){
        return $this->getRedis()->setnx($key, $value);
    }
       
    /**
     * 删除缓存
     *
     * @param string || array $key 缓存KEY，支持单个健:"key1" 或多个健:array('key1','key2')
     * @return int 删除的健的数量
     */
    public function remove($key){
        // $key => "key1" || array('key1','key2')
        return $this->getRedis()->delete($key);
    }
       
    /**
     * 值加加操作,类似 ++$i ,如果 key 不存在时自动设置为 0 后进行加加操作
     *
     * @param string $key 缓存KEY
     * @param int $default 操作时的默认值
     * @return int　操作后的值
     */
    public function incr($key,$default=1){
        if($default == 1){
            return $this->getRedis()->incr($key);
        }else{
            return $this->getRedis()->incrBy($key, $default);
        }
    }
       
    /**
     * 值减减操作,类似 --$i ,如果 key 不存在时自动设置为 0 后进行减减操作
     *
     * @param string $key 缓存KEY
     * @param int $default 操作时的默认值
     * @return int　操作后的值
     */
    public function decr($key,$default=1){
        if($default == 1){
            return $this->getRedis()->decr($key);
        }else{
            return $this->getRedis()->decrBy($key, $default);
        }
    }

    /**
     * 清空当前数据库
     *
     * @return boolean
     */
    public function clear(){
        return $this->getRedis()->flushDB();
    }

	/**
	 * 链表头插入一个元素
	 * @param unknown $key
	 * @param unknown $value
	 */
    public function lpush($key,$value){
        return $this->getRedis()->lpush($key,$value);
    }
	
    /**
     * 返回链表的长度
     * @param unknown $key
     */
    public function llen($key){
    	return $this->getRedis()->llen($key);
    }
    
    /**
     * 返回列表 key 中，下标为 index 的元素
     * @param unknown $index
     */
    public function lindex($key,$index){
    	return $this->getRedis()->lindex($key,$index);
    }
    /**
     * 链表尾部插入一个元素
     * @param unknown $key
     * @param unknown $value
     */
    public function rpush($key,$value){
    	return $this->getRedis()->rpush($key,$value);
    }
    /**
     * 返回链表的头元素
     */
    public function lpop($key){
        return $this->getRedis()->lpop($key);
    }
    
    /**
     * 返回列表 key 中指定区间内的元素，区间以偏移量 start 和 stop 指定
     */
    public function lrange($key,$start,$end){
        return $this->getRedis()->lrange($key,$start,$end);    
    }
    
    
    /**
     * 删除链表节点
     * @param unknown $key
     * @param unknown $value
     * @param number $count
     */
    public function lrem($key,$value,$count=0){
    	return $this->getRedis()->lrem($key,$value,$count);
    }
    
    /**
     * 剪切key对应的链接，切[start, stop]一段并把改制重新赋给key
     */
    public function ltrim($key,$start,$stop){
    	return $this->getRedis()->ltrim($key,$start,$stop);
    }

    
    /**
     * 获取指定Key的指定成员的分数。
     * @param unknown $key
     * @param unknown $member
     */
    public function zScore($key ,$member){
    	return $this->getRedis()->zScore($key,$member);
    }
    
    /**
     * 指定Key中的指定成员增加指定的分
     * @param unknown $key
     * @param number $increment
     * @param unknown $member
     */
    public function zIncrBy($key, $increment=1, $member ){
    	
    	return $this->getRedis()->zIncrBy($key, $increment, $member);
    }
    
    
    
    /**
     *    set hash opeation
     */
    public function hset($name,$key,$value){
        if(is_array($value)){
            return $this->getRedis()->hset($name,$key,serialize($value));    
        }
        return $this->getRedis()->hset($name,$key,$value);
    }
	/**
	*填充hash表的值
	*@param string $name hash表的名字
	*@param array $arr hash表名对应的键值对 如 array('key1'=>'value1','key2'=>'value2') 相当于 hset($name,'key1','value1')和hset($name,'key2','value2')
	*/
	public function hMset($name,$arr) {
		return $this->getRedis()->hMset($name,$arr);
	}
    /**
     *    get hash opeation
     */
    public function hget($name,$key = null,$serialize=false){
        if($key){
            $row = $this->getRedis()->hget($name,$key);
            if($row && $serialize){
                $row = unserialize($row);
            }
            return $row;
        }
        return $this->getRedis()->hgetAll($name);
    }

    /**
     *    delete hash opeation
     */
    public function hdel($name,$key = null){
        if($key){
            return $this->getRedis()->hdel($name,$key);
        }
        return $this->getRedis()->hdel($name);
    }
	public function del($name){
		return $this->getRedis()->del($name);
	}
	public function hIncrBy($name, $key, $num = 1){
		return $this->getRedis()->hIncrBy($name, $key, $num);
	}
    /**
     * Transaction start
     */
    public function multi(){
        return $this->getRedis()->multi();    
    }
    /**
     * Transaction send
     */

    public function exec(){
        return $this->getRedis()->exec();    
    }

    /* =================== 以下私有方法 =================== */
     
    /**
     * 随机 HASH 得到 Redis Slave 服务器句柄
     *
     * @return redis object
     */
    private function _getSlaveRedis(){
    	// 就一台 Slave 机直接返回
    	if($this->_sn <= 1){
    		return $this->_linkHandle['slave'][0];
    	}
    	// 随机 Hash 得到 Slave 的句柄
    	$hash = $this->_hashId(mt_rand(), $this->_sn);
    	return $this->_linkHandle['slave'][$hash];
    }
     
    /**
     * 根据ID得到 hash 后 0～m-1 之间的值
     *
     * @param string $id
     * @param int $m
     * @return int
     */
    private function _hashId($id,$m=10){
    	//把字符串K转换为 0～m-1 之间的一个值作为对应记录的散列地址
    	$k = md5($id);
    	$l = strlen($k);
    	$b = bin2hex($k);
    	$h = 0;
    	for($i=0;$i<$l;$i++)
    	{
    	//相加模式HASH
    		$h += substr($b,$i*2,2);
    	}
    	$hash = ($h*1)%$m;
    	return $hash;
    }

    //返回并且删除key对应set中的随机一个元素,成功返回1，集合或者key不存在返回0
    public function spop($skey){
        return $this->getRedis()->spop($skey);
    }
}
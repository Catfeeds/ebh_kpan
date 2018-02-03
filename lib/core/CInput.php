<?php

/**
 * CInput输入类，主要针对$_GET（QUERY_STRING）和$_POST的包装
 */
class CInput {

    var $gets = NULL;
    private $prefix = 'ebh_';
    private $domain = '.ebh.net';
    private $path = '/';
	private $alldomain = 0;
    var $user_agent = FALSE;    //客户端浏览器USER_AGENT信息
    var $ip_address = FALSE;    //客户端地址

    public function __construct($config = array()) {
        //$this->uri = Ebh::app()->getUri();
        if (isset($config['prefix'])) {
            $this->prefix = $config['prefix'];
        }
        if (isset($config['domain'])) {
            $this->domain = $config['domain'];
        }
        if (isset($config['path'])) {
            $this->path = $config['path'];
        }
		if (isset($config['path'])) {
            $this->path = $config['path'];
        }
		if (isset($config['alldomain'])) {
            $this->alldomain = $config['alldomain'];
        }
    }

    /**
     * 获取get对应值
     * @param string $key get对应的key，为NULL时则获取整个get数组
     * @param boolean $xss 是否进行xss过滤
     * @return string 返回get值
     */
    public function get($key = NULL, $xss = TRUE) {
        if (!isset($this->gets)) {
            $this->gets = $_GET;
        }
        if ($key == NULL && $this->gets != NULL){
            $value = $this->gets;
            if ($xss) {  //过滤处理，预留
                $value = safefilter($value);
            }
            return $value;
        }
        if ($this->gets === NULL || !isset($this->gets[$key]))
            return NULL;
        $value = $this->gets[$key];
        if ($xss) {  //过滤处理，预留
            $value = safefilter($value);
        }
        return $value;
    }

    /**
     * 获取post对应值
     * @param string $key post对应的key，为NULL时则获取整个post数组
     * @param boolean $xss 是否进行xss过滤
     * @return string 返回post值
     */
    public function post($key = NULL, $xss = TRUE) {
        if ($key == NULL){
            $value = $_POST;
            if ($xss) {  //过滤处理，预留
                $value = safefilter($value);
            }
            return $value;
        }
        if (!isset($_POST[$key])) {
            return NULL;
        }
        $value = $_POST[$key];
        if ($xss) {  //过滤处理，预留
            //$value = safefilter($value);
        }
        return $value;
    }

    /**
     * 合并post,get
     * @param string $key request对应的key，为NULL时则获取整个request数组
     * @param boolean $xss 是否进行xss过滤
     * @return array
     */
    public function request($key = NULL,$xss = TRUE){
        //返回的存储数组
        $param = array();
        $_post =  $this->post();
        $_get = $this->get();
        //合并get/post
        if(!empty($_get) && !empty($_post)){
            $param = array_merge($_get,$_post);
        }elseif(!empty($_get) && empty($_post)){
            $param = $_get;
        }elseif(empty($_get) && !empty($_post)){
            $param = $_post;
        }
        
        if ($key == NULL) {
            return ($xss==TRUE) ? safefilter($param) : $param;
        }
        if (!isset($param[$key])) {
            return FALSE;
        }
        $value = $param[$key];
        if ($xss) {  //过滤处理，预留
            $value = safefilter($value);
        }
        return $value;
    }
    
    /**
     * 获取cookie对应值
     * @param string $key post对应的key，为NULL时则获取整个cookie数组
     * @param boolean $xss 是否进行xss过滤
     * @return string 返回cookie值
     */
    public function cookie($key = NULL, $xss = TRUE) {
        if ($key == NULL)
            return $_COOKIE;
        $key = $this->prefix . $key;
        if (!isset($_COOKIE[$key])) {
            return FALSE;
        }
        $value = $_COOKIE[$key];
        if ($xss) {  //过滤处理，预留
            //$value = safefilter($value);
        }
        return $value;
    }

    /**
     * 设置cookie值
     * @param string $key cookie key
     * @param string $value cookie value
     * @param int $life cookie有效期，以秒为单位
     * @return boolean 返回是否设置成功
     */
    public function setcookie($key, $value, $life = 0) {
        if (empty($key))
            return FALSE;
        $key = $this->prefix . $key;
        $expire = 0;
        if(!empty($life)) {
            $expire = SYSTIME + $life;
        }
		$domain = $this->domain;
		if(!empty($this->alldomain)) {	//如果设置alldomain值，则默认去当前主域名左右cookie域
			//$uri = Ebh::app()->getUri();
			//$domain = $uri->curdomain;
		}
        setcookie($key, $value, $expire, $this->path, $domain, $_SERVER['SERVER_PORT'] == 443 ? 1 : 0);
        return TRUE;
    }

    /**
     * 获取客户端浏览器user_agent信息
     * @return string 返回user_agent信息
     */
    public function user_agent() {
        if ($this->user_agent !== FALSE) {
            return $this->user_agent;
        }
        $this->user_agent = (!isset($_SERVER['HTTP_USER_AGENT'])) ? FALSE : $_SERVER['HTTP_USER_AGENT'];
        return $this->user_agent;
    }
    /**
     * 获取客户端IP地址
     * @return string IP_ADDRESS
     */
    public function getip() {
        if ($this->ip_address !== FALSE)
            return $this->ip_address;
        if (!empty($_SERVER["HTTP_CLIENT_IP"]))
            $this->ip_address = $_SERVER["HTTP_CLIENT_IP"];
        else if (!empty($_SERVER["HTTP_X_FORWARDED_FOR"]))
            $this->ip_address = $_SERVER["HTTP_X_FORWARDED_FOR"];
        else if (!empty($_SERVER["REMOTE_ADDR"]))
            $this->ip_address = $_SERVER["REMOTE_ADDR"];
        else
            $this->ip_address = "127.0.0.1";
        return $this->ip_address;
    }
	/**
	*获取客户端信息
	*/
	public function getClient() {
		$userAgent = $this->user_agent();
		if(empty($userAgent))
			return FALSE;
		$userAgent = strtolower($userAgent);
		//处理系统信息
		$sys = 'other';
        $vendor = '';
		if(strpos($userAgent,'ipad') !== FALSE) {
			$sys = 'iPad';
		} else if(strpos($userAgent,'iphone') !== FALSE) {
			$sys = 'iPhone';
		} else if(strpos($userAgent,'android') !== FALSE) {
			$sys = 'Android';
		} else if(strpos($userAgent,'linux') !== FALSE) {
			$sys = 'Linux';
		} else if(strpos($userAgent,'windows mobile') !== FALSE || strpos($userAgent,'windows ce') !== FALSE ) {
			$sys = 'Windows Mobile';
		} else if(strpos($userAgent,'windows') !== FALSE) {	//windows 则设置版本
			if(strpos($userAgent,'windows nt 5.0') !== FALSE || strpos($userAgent,'windows 2000') !== FALSE) {
				$sys = 'Win2000';
			} else if(strpos($userAgent,'windows nt 5.1') !== FALSE || strpos($userAgent,'windows xp') !== FALSE) {
				$sys = 'WinXP';
			} else if(strpos($userAgent,'windows nt 5.2') !== FALSE || strpos($userAgent,'windows 2003') !== FALSE) {
				$sys = 'Win2003';
			} else if(strpos($userAgent,'windows nt 6.0') !== FALSE || strpos($userAgent,'windows Vista') !== FALSE) {
				$sys = 'WinVista';
			} else if(strpos($userAgent,'windows nt 6.1') !== FALSE || strpos($userAgent,'windows 7') !== FALSE) {
				$sys = 'Win7';
			} else if(strpos($userAgent,'windows nt 6.2') !== FALSE || strpos($userAgent,'windows 8') !== FALSE) {
				$sys = 'Win8';
			} else if(strpos($userAgent,'windows nt 6.3') !== FALSE || strpos($userAgent,'windows 8.1') !== FALSE) {
				$sys = 'Win8.1';
			} else if(strpos($userAgent,'windows nt 10') !== FALSE || strpos($userAgent,'windows 10') !== FALSE) {
				$sys = 'Win10';
			}    
		} else if(strpos($userAgent,'mac') !== FALSE) {
			$sys = 'Mac';
		} else if(strpos($userAgent,'X11') !== FALSE) {
			$sys = 'Unix';
		}
        //处理浏览器厂家
        if(strpos($userAgent,'micromessenger') !== FALSE) {
            $vendor = '微信';
        } else if(strpos($userAgent,'maxthon') !== FALSE) {
            $vendor = '遨游';
        } else if(strpos($userAgent,'qqbrowser') !== FALSE) {
            $vendor = 'QQ';
        } else if(strpos($userAgent,'metasr') !== FALSE) {
            $vendor = '搜狗';
        } else if(strpos($userAgent,'metasr') !== FALSE) {
            $vendor = '搜狗';
        } 
		//处理浏览器和版本信息
		$browser = '';
		$broversion = 0;
		if(preg_match('/trident\/([\d.]+)/',$userAgent,$matchs)) {
			$broversion = intval($matchs[1]);
			$browser = 'IE';
			$broversion = $broversion + 4;
		} else if(preg_match('/rv:([\d.]+)\) like gecko/',$userAgent,$matchs)) {
			$broversion = $matchs[1];
			$browser = 'IE';
		} else if(preg_match('/msie ([\d.]+)/',$userAgent,$matchs)) {
			$broversion = $matchs[1];
			$browser = 'IE';
		} else if(preg_match('/firefox\/([\d.]+)/',$userAgent,$matchs)) {
			$broversion = $matchs[1];
			$browser = 'Firefox';
		} else if(preg_match('/chrome\/([\d.]+)/',$userAgent,$matchs)) {
			$broversion = $matchs[1];
			$browser = 'Chrome';
		} else if(preg_match('/opera.([\d.]+)/',$userAgent,$matchs)) {
			$broversion = $matchs[1];
			$browser = 'Opera';
		} else if(preg_match('/version\/([\d.]+).*safari/',$userAgent,$matchs)) {
			$broversion = $matchs[1];
			$browser = 'Safari';
		} 
        $ip = $this->getip();

		$client = array('system'=>$sys,'browser'=>$browser,'broversion'=>$broversion,'vendor'=>$vendor,'ip'=>$ip);
		return $client;
	}
	
	/**
	 * 获取网校crid
	 */
	public function  getCrid(){
		$crid = 0;
		$requestCrid = $this->request('crid');
		if(!empty($requestCrid)){
			$crid = intval($requestCrid);
		}else{
			$cookieCrid = $this->cookie('crid');
			if(!empty($cookieCrid)){
				$crid = intval($cookieCrid);
			}
		}
		
		return $crid;
	}
	
}
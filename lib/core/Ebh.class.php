<?php
class Ebh extends Application {
	private static $_app;
	
	protected $db = null;
	protected $_classes = null;
	private $_models = array(); // 已加载model类

	public function __construct() {
		//parent::__construct();
		$this->init();
		$this->register();
		$this->setApplication($this);
	}
	/**
	 * 初始化应用
	 */
	public function init() {
		$appconfig = BASIC_PATH.'config/ebh_config.php';
		$this->_config = $appconfig;
		//加载配置文件
		if (is_string($this->_config)) {
			$config = require ($this->_config);
			if (is_array($config)) {
				foreach ($config as $key => $value) {
					$this->$key = $value;
				}
			}
		}
		// 加载helper
		foreach ($this->auto_helper as $helper) {
			$this->helper($helper);
		}
		// 加载数据库应用
		if ($this->db['autoload']) {
			$this->getDb();
		}
	}
	/**
	 * 加载类库
	 *
	 * @param string $libname
	 *        	jw 修改加载lib文件添加path用于加载lib目录中指定路径的类文件
	 *        	如果需要加载lib下Live目录下的文件则使用 Ebh::app()->lib('Sata','Live');
	 *
	 *        	实际加载路径为 lib/Live/Sata.php
	 */
	public function lib($libname, $path = '') {
		if (!isset($this->_classes[$libname])) {
			if ($path != '') {
				$path = $path . '/' . $libname;
			} else {
				$path = $libname;
			}
			$libpath = LIB_PATH . $path . '.php';
			if (!file_exists($libpath)) {
			}
			require ($libpath);
			if (!class_exists($libname)) {
				echo "$libname class not exists";
			}
			$this->$libname = new $libname();
			$this->_classes[$libname] = $this->$libname;
			return $this->$libname;
		}
		return $this->$libname;
	}
	
	/**
	 * 加载辅助方法
	 * @param string $helpername 辅助方法库方法
	 */
	public function helper($helpername) {
		if (!isset($this->_helpers[$helpername])) {
			require_once (FUNCTION_DIR . $helpername . '.function.php');
			$this->_helpers[$helpername] = TRUE;
		}
	}
	
	/**
	 * 返回CInput输入类
	 */
	public function getInput() {
		if (isset($this->_classes['input'])) {
			return $this->_classes['input'];
		}
		$cinput = new CInput($this->cookie);
		$this->_classes['input'] = $cinput;
		return $cinput;
	}
	/**
	 * 设置当前实例
	 *
	 * @param object $app
	 *        	当前实例引用
	 */
	public static function setApplication($app) {
		self::$_app = $app;
	}
	/**
	 * 返回当前应用实例
	 *
	 * @return object 当前应用实例
	 */
	public static function app() {
		return self::$_app;
	}
	/**
	 * 返回DB类
	 */
	public function getDb() {
		if (isset($this->_classes['db'])) {
			return $this->_classes['db'];
		}
		$db = new CDb($this->db);
		$this->_classes['db'] = $db;
		return $db;
	}
	/**
	 * 返回日志类
	 */
	public function getLog() {
		if (isset($this->_classes['log'])) {
			return $this->_classes['log'];
		}
		$clog = new CLog($this->log);
		$this->_classes['log'] = $clog;
		return $clog;
	}
	/**
	 * 返回其他DB类，$name为config文件的其他段配置
	 */
	public function getOtherDb($name) {
		if (isset($this->_classes[$name])) {
			return $this->_classes[$name];
		}
		$db = new CDb($this->$name);
		$this->_classes[$name] = $db;
		return $db;
	}
	/**
	 * 返回缓存类
	 */
	public function getCache($cachetype = null) {
		if (isset($this->_classes['cache']) && empty($cachetype)) {
			return $this->_classes['cache'];
		}
		if (isset($this->_classes['cache_redis'])) {
			return $this->_classes['cache_redis'];
		}
		if (!empty($cachetype)) {
			$ccache = new CCache($this->$cachetype);
			$this->_classes['cache_redis'] = $ccache;
		} else {
			$ccache = new CCache($this->cache);
			$this->_classes['cache'] = $ccache;
		}
		return $ccache;
	}
	/**
	 * 加载model类
	 *
	 * @param string $modelname
	 *        	模板名称
	 * @return object model对象
	 */
	public function model($modelname) {
		$modelname = ucfirst(strtolower($modelname));
		if (isset($this->_models[$modelname])) {
			return $this->_models[$modelname];
		}
		$modelclass = $modelname . 'Model';
		$modelpath = MODEL_PATH . $modelclass . '.php';
		if (!file_exists($modelpath)) {
			echo 'error:model file not exists:' . $modelpath;
		}
		require $modelpath;
		$this->_models[$modelname] = new $modelclass();
		return $this->_models[$modelname];
	}

	/**
     * 返回CConfig配置类
     */
    public function getConfig() {
        if (isset($this->_classes['config'])) {
            return $this->_classes['config'];
        }
        $cconfig = new CConfig();
        $this->_classes['config'] = $cconfig;
        return $cconfig;
    }

	/**
	 * 自动加载类方法
	 *
	 * @param string $classname类名
	 */
	public static function autoload($classname) {
		if (isset(self::$_coreClasses[$classname])) {
			include CORER_DIR . self::$_coreClasses[$classname];
		} else {
			return false;
		}
	}
	/**
	 * 错误处理方法，收集所有的错误信息并记录
	 */
	public static function ebh_error_handler($error_level, $error_message, $error_file, $error_line, $error_context) {
		$uri = $_SERVER['REQUEST_URI'];
		if(stripos($error_file,'.cache_data')!==false){
			return TRUE;
		}
		log_message("error_level:$error_level error_message:$error_message error_file:$error_file error_line:$error_line uri:$uri");
	}
	/**
	 *
	 * @var array 核心类路径对应表
	 */
	private static $_coreClasses = array(
			'CDb' => 'db/CDb.php',
			'CLog' => 'CLog.php',
			'CConfig' => 'CConfig.php',
			'CResult' => 'db/CResult.php',
			'CModel' => 'CModel.php', 
			//'CRouter' => 'CRouter.php',
			//'CUri' => 'CUri.php', 
			'CInput' => 'CInput.php',
			'CCache' => 'cache/CCache.php'
	);
	
	/**
	 * 自动注册类加载方法和错误处理
	 */
	private function register(){
		spl_autoload_register(array(&$this, 'autoload'));
		set_error_handler(array(&$this, 'ebh_error_handler'),E_ALL ^ E_NOTICE ^ E_WARNING);
	}
}
//spl_autoload_register(array('Ebh', 'autoload'));
//set_error_handler(array('Ebh', 'ebh_error_handler'));

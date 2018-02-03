<?php
/**
 * 错误日志类
 */
class CLog {
    protected $_log_path = '';  //日志存放路径
    protected $_enable = true;  //是否启用日志
    protected $_level = array('ERROR' => '1', 'DEBUG' => '2',  'INFO' => '3', 'ALL' => '4');
    protected $_loglevel = 1;   //默认只记录error级别的日志
    protected $_date_fmt	= 'Y-m-d H:i:s';
    public function __construct($config) {
        if(isset($config['enable'])) {
            $this->_enable = $config['enable'];
        }
        if(isset($config['loglevel'])) {
            $this->_loglevel = $config['loglevel'];
        }
        $this->_log_path = (empty($config['log_path'])) ? S_ROOT.'logs/' : $config['log_path'];
    }
    /**
     * 写入日志
     * @param string $level 日志错误级别
     * @param string $message 日志内容
     * @param boolean $php_error 是否为PHP自带错误，此参数目前用于打印PHP堆栈信息
     * @return boolean 是否写入日志成功
     */
    public function log($msg, $level = 'error', $php_error = false) {
        if($this->_enable === FALSE) {
            return false;
        }
        $level = strtoupper($level);
        if(!isset($this->_level[$level]) || $this->_level[$level] > $this->_loglevel) {
            return false;
        }
        $message = '';
        $filepath = $this->_log_path.'log-'.date('Y-m-d').'.php';
        if(!file_exists($filepath)) {
            $message .= "<"."?php  if ( ! defined('IN_EBH')) exit('No direct script access allowed'); ?".">\n\n";
        }
        $message .= $level.'  -  '.date($this->_date_fmt). ' --> '."\n".$msg."\n";
		if($php_error) {	//添加PHP调用堆栈信息
			$infolines = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
			foreach($infolines as $infokey=>$infoline) {
				if($infokey == 0 || $infokey == 1)
					continue;
				$linemsg = $infoline['function'].'() '.$infoline['file'].':'.$infoline['line']."\n";
				$message .= $linemsg;
			}
			$message .= 'REQUEST_URI '.$_SERVER['REQUEST_URI']."\n";
		}
		$message .= "\n";
        $fp = @fopen($filepath, 'a');
        @flock($fp, LOCK_EX);
        @fwrite($fp, $message);
		@flock($fp, LOCK_UN);
		@fclose($fp);
        return true;
    }
}
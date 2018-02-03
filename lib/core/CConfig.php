<?php
/**
 * CConfig配置类
 */
class CConfig {
    public function __construct() {
    }
    public function load($config) {
        if(isset($this->$config)) {
            return $this->$config;
        }
        $configpath = CONFIG_PATH.$config.'.php';
        require $configpath;
        $this->$config = $$config;
        return $this->$config;
    }
    
}
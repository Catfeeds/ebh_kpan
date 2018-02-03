<?php
/**
 * memcache
 * @author Admi驱动类nistrator
 */
class memcache_driver {
    private $mem = NULL;
    private $servers = NULL;
    public function __construct($servers) {
        $this->mem = new Memcache();
        $this->servers = $servers;
    }
    public function init() {
        foreach ($this->servers as $server) {
            $this->mem->addserver($server['host'], $server['port'],TRUE,100,1,15,TRUE,"memcachefail");
        }
    }
    public function get($key) {
        return $this->mem->get($key);
    }
    public function set($key,$value,$expire) {
        return $this->mem->set($key, $value, MEMCACHE_COMPRESSED,$expire);
    }
    public function remove($key,$timeout = 0) {
        return $this->mem->delete($key,$timeout);
    }
}
function memcachefail($host,$port) {
	log_message("memcached connect error with $host:$port");
}
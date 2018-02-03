<?php

/**
 * 数据库驱动程序基类
 */
class CDb {
    var $dbdriver = 'mysqli';
    var $tablepre = '';
    var $pconnect = FALSE;
    var $dbcharset = 'utf8';
    var $slave = FALSE; //从数据库配置
    var $master_conn = NULL;   //主数据库连接对象，写数据都是真对这个数据库
    var $slave_conns = array(); //从数据库连接对象数据
    var $_trans_status = TRUE;  //事务状态
    var $_trans_enable = TRUE;
	var $cur_con = NULL;	//当前选择的数据库源连接编号，如为NULL 则按照系统原则，如果为0表示主数据库连接，1为第一个从数据库连接
    var $query_nums = 0;    //查询次数
    var $error = '';
    var $dbhost;
    var $dbuser;
    var $dbpw;
    var $dbname;
    var $dbport;
    /**
     * 初始化
     * @param array $config 配置数组对象
     */
    function __construct($config = array()) {
        if (is_array($config)) {
            foreach ($config as $key => $value) {
                $this->$key = $value;
            }
        }
        $this->init();
    }

    /**
     * 初始化数据库类
     */
    function init() {
        $dbpath = SYS_PATH.'db/'.$this->dbdriver.'/'.  $this->dbdriver.'_driver'.'.php';
        $cname = 'C'.ucfirst($this->dbdriver).'_driver';
        class_exists('CMysqli_driver') or require $dbpath;
        if (is_resource($this->master_conn) OR is_object($this->master_conn)) {
            return TRUE;
        }
        $this->master_conn = new $cname($this->dbhost,  $this->dbuser,  $this->dbpw,  $this->dbname,  $this->dbport);
        if(!$this->master_conn || $this->master_conn->connect_error !== FALSE) {
            log_message('数据库连接错误:'.$this->master_conn->connect_error,'error');
            die('系统错误，请稍后再试！');
            return false;
        }
        $this->master_conn->_set_charset($this->dbcharset);
		if(!empty($this->slave)) {
			foreach ($this->slave as $sconfig) {
				$slave_con = new $cname($sconfig['dbhost'],$sconfig['dbuser'],$sconfig['dbpw'],$sconfig['dbname'],$sconfig['dbport']);
				if (!$slave_con || $slave_con->connect_error !== FALSE) {
					log_message('slave数据库连接错误:'.$slave_con->connect_error,'error');
					continue;
				}
				$slave_con->_set_charset($this->dbcharset);
				$this->slave_conns[] = $slave_con;
			}
		}
        return true;
    }
    function select_db() {
        return $this->_select_db($this->dbname);
    }
    /**
     * 
     * @param string $charset数据库编码
     * @return boolean 是否设置正确
     */
    function set_charset($charset) {
        if(!$this->_set_charset($charset)) {
            return FALSE;
        }
        return TRUE;
    }
	/**
	*设置当前连接的数据库源编号，目前只支持设置为0的情况，即使用主服务器功能
	*@param int $cur 当前连接的数据库源编号
	*/
	function set_con($cur = NULL) {
		if($cur === 0) {
			$this->cur_con = 0;
		}
	}
	/**
	*重置当前连接的数据库源编号
	*/
	function reset_con() {
		$this->cur_con = NULL;
	}
    /**
     * 执行SQL语句，并返回结果集对象Mysqli_result
     * @param string $sql
     * @return 返回结果集对象Mysqli_result
     */
    public function query($sql,$return_object = TRUE) {
        if($this->master_conn == NULL) {
            $this->init();
        }
        $result = $this->simple_query($sql);
        if($result === FALSE) {
            $this->_trans_status = FALSE;
        }
        $this->query_nums ++;
        if(!$return_object) {
            return $result;
        }
        $driver = $this->dbdriver;
        $classname = 'C'.ucfirst($driver).'_result';
        if(!class_exists($classname)) {
            $classpath = SYS_PATH.'db/'.$driver.'/'.$driver.'_result.php';
            require $classpath;
        }
        $resultobj = new $classname($result);
        return $resultobj;
    }
    /**
     * 执行SQL语句
     * @param string $sql
     * @return type 返回执行结果，执行失败返回false，执行成功 如果更新/删除语句则为true，查询语句则返回Mysqli_Result对象
     */
    public function simple_query($sql) {
        $result = false;
        if($this->master_conn == NULL) {
            $this->init();
        }
        if($this->master_conn != NULL) {
            if (!empty($this->slave_conns) && strtoupper(substr($sql, 0,6)) == 'SELECT' && $this->cur_con !== 0) {  //查询用从数据库
                if (count($this->slave_conns) == 1)
                    $con = $this->slave_conns[0];
                else {
                    $slavekey = mt_rand(0, count($this->slave_conns) - 1);
                    $con = $this->slave_conns[$slavekey];
                }
                    
            } else {    //否则用主数据库
                $con = $this->master_conn;
            }
			if ($this->cur_con === 0 && strtoupper(substr($sql, 0,6)) == 'SELECT') {	//兼容kingshard强制从主库查询
				$sql = substr($sql, 0,6).'/*master*/'.substr($sql, 6);
			}
            $result = $con->_execute($sql);
            if(!$result) {
                $this->error = $con->error_msg();
                log_message('Query error:'.$this->error."\r\n SQL:".$sql,'error',TRUE);
            }
        }
        return $result;
    }
    /**
     * insert 表记录
     * @param string $tablename插入表名
     * @param Array $param 记录字段值数组对象
     * @return 插入成功返回新生成的记录id，否则返回0
     */
    public function insert($tablename,$param) {
        if(empty($tablename) || empty($param))
            return false;
        $keys = array();
        $values = array();
        foreach ($param as $key=>$value) {
            $keys[] = '`'.$key.'`';
            $values[] = $this->escape($value);
        }
        $sql = 'insert into '.$tablename.'('.  implode(',', $keys).') values ('.  implode(',', $values).')';
        $this->query($sql,FALSE);
        return $this->insert_id();
    }
    /**
     * 转义变量，使得变量可用于数据库查询
     * @param mix $str
     * @return string 
     */
    public function escape($str) {
        if(is_string($str)) {
            $str = "'".$this->master_conn->escape_str($str)."'";
        } else if(is_bool($str)) {
            $str = ($str == true) ? 1 : 0;
        } else if(is_null($str)) {
            $str = 'NULL';
        }
        return $str;
    }
    /**
     * 单独转义字符串
     * @param mix $str
     * @return string
     */
    public function escape_str($str) {
        return $this->master_conn->escape_str($str);
    }

    /**
     * 更新表记录
     * @param string $talename表名
     * @param array $param更新字段值对应的数组
     * @param array $where 更新的条件
     * @param array $sparam 更新字段值对应的数组,它与@param的不同是不对字段和字段的值进行处理，
     * 主要用于字段值得自增等处理，如@sparam = array('viewnum'=>'viewnum + 1')
     * @return boolean
     */
    public function update($talename,$param = array(),$where,$sparam = array()) {
        if(empty($talename) || (empty($param) && (empty($sparam))) || empty($where))
            return false;
        $wherearr = array();
        if(is_array($where)) {
            foreach ($where as $wkey=>$wvalue) {
                $wherearr[] = $wkey.' = '.$this->escape($wvalue);
            }
        } else {
            $wherearr[] = $where;
        }
        $fieldlist = array();
        foreach ($param as $key=>$value) {
            $fieldlist[] = $key .'='. $this->escape($value);
        }
        foreach ($sparam as $key=>$value) {
            $fieldlist[] = $key .'='. $value;
        }
        $sql = 'UPDATE '.$talename.' SET '.implode(',', $fieldlist).' WHERE '.  implode(' AND ', $wherearr);
        $result = $this->query($sql,FALSE);
        if($result === FALSE)
            return FALSE;
        return $this->affected_rows();
    }
    /**
     * 删除表记录
     * @param string $talename表名
     * @param type $where where条件
     * @return boolean 返回影响行数
     */
    public function delete($talename,$where) {
        if(empty($where))
            return false;
        $wherearr = array();
        if(is_array($where)) {
            foreach ($where as $wkey=>$wvalue) {
                $wherearr[] = $wkey.' = '.$this->escape($wvalue);
            }
        } else {
            $wherearr[] = $where;
        }
        $sql = 'DELETE FROM '.$talename.' WHERE '.  implode(' AND ', $wherearr);
        $this->query($sql,FALSE);
        return $this->affected_rows();
    }
    /**
     * 获取事务执行状态
     * @return boolean 
     */
    public function trans_status() {
        return $this->_trans_status;
    }
    /**
     * 返回新生成的记录id
     * @return int 返回新生成的记录id
     */
    public function insert_id() {
        return $this->master_conn->_insert_id();
    }
    /**
     * 返回上次SQL语句影响行数
     * @return int 返回上次SQL语句影响行数
     */
    public function affected_rows() {
        return $this->master_conn->_affected_rows();
    }
     /**
     * 开始事务
     * @return boolean
     */
    public function begin_trans() {
        $this->_trans_status = TRUE;
        $this->simple_query('SET AUTOCOMMIT=0');
	$this->simple_query('START TRANSACTION'); // can also be BEGIN or BEGIN WORK
	return TRUE;
    }
    /**
     * 提交事务
     * @return boolean
     */
    public function commit_trans() {
        $this->simple_query('COMMIT');
	$this->simple_query('SET AUTOCOMMIT=1');
	return TRUE;
    }
    /**
     * 事务回滚
     * @return boolean
     */
    public function rollback_trans() {
        $this->simple_query('ROLLBACK');
	$this->simple_query('SET AUTOCOMMIT=1');
	return TRUE;
    }
    function __destruct() {
        $this->master_conn = NULL;
        unset($this->slave_conns);
    }
}
<?php
/**
 * 数据库结果集类
 */
class CResult {
    var $resultobj = NULL;
    public function __construct($obj) {
        $this->resultobj = $obj;
    }

    public function row_array() {
         if(empty($this->resultobj) || !is_object($this->resultobj)) {
            return false;
        }
        $row = $this->resultobj->fetch_array(MYSQLI_ASSOC);
        return $row;
        //return $this->_row_array();
    }
    public function list_array($key = '') {
        return $this->_list_array($key);
    }
    public function list_field($field = '') {
        return $this->_list_field($field);
    }
    public function __destruct() {
        $this->close();
    }
}
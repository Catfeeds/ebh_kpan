<?php

/**
 * mysqli 驱动类
 */
class CMysqli_driver{
    var $conn_id = FALSE;
    var $connect_error = FALSE;
    public function __construct($dbhost,$dbuser,$dbpw,$dbname,$dbport = '') {
        if(empty($dbport)) {
            $conn_id = @new mysqli($dbhost, $dbuser,$dbpw, $dbname);
        } else {
            $conn_id = @new mysqli($dbhost, $dbuser,$dbpw, $dbname, $dbport);
        }
        if ($conn_id->connect_error) {
            $this->connect_error = $conn_id->connect_error;
            $conn_id = NULL;
        }
        $this->conn_id = $conn_id;
    }
    public function db_connect() {
        if(empty($this->dbport)) {
            $conn_id = @new mysqli($this->dbhost,  $this->dbuser,$this->dbpw,  $this->dbname);
        } else {
            $conn_id = @new mysqli($this->dbhost,  $this->dbuser,$this->dbpw,  $this->dbname,  $this->dbport);
        }
        if ($conn_id->connect_error) {
            $this->error = $conn_id->connect_error;
            $conn_id = null;
            return NULL;
        }
        return $conn_id;
    }
    public function db_pconnect() {
        return $this->db_connect();
    }
    public function _execute($sql) {
        $result= $this->conn_id->query($sql);
        return $result;
    }
    public function _select_db($dbname) {
        return $this->conn_id->select_db($dbname);
    }
    public function _set_charset($charset) {
        return $this->conn_id->set_charset($charset);
    }
    public function _insert_id() {
        return $this->conn_id->insert_id;
    }
    public function _affected_rows() {
        return $this->conn_id->affected_rows;
    }
    /**
     * 
     * @param type $str
     */
    public function escape_str($str,$like = FALSE) {
        if(is_array($str)) {
            foreach($str as $key =>$value) {
                $str[$key] = $this->escape_str($value, $like);
            }
            return $str;
        }
        if(is_object($this->conn_id) && method_exists($this->conn_id, 'real_escape_string')) {
            $str = $this->conn_id->real_escape_string($str);
        }
        return $str;
    }
    public function error_no() {
        return $this->conn_id->error_no;
    }
    public function error_msg() {
        return $this->conn_id->error;
    }
    function close() {
        if(!empty($this->conn_id) && !is_null($this->conn_id)) {
            $this->conn_id->close();
        }
    }
    function __destruct() {
        $this->close();
    }
}
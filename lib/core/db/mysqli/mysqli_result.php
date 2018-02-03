<?php

/**
 * Description of mysqli_result
 *
 * @author Administrator
 */
class CMysqli_result extends CResult {
    public function _row_array() {
        if(empty($this->resultobj) || !is_object($this->resultobj)) {
            return false;
        }
        $row = $this->resultobj->fetch_array(MYSQLI_ASSOC);
        return $row;
    }
    public function _list_array($key = '') {
        if(empty($this->resultobj) || !is_object($this->resultobj)) {
            return false;
        }
        $resultarr = array();
        if(empty($key)) {
            while($row = $this->resultobj->fetch_array(MYSQLI_ASSOC)) {
                $resultarr[] = $row;
            }
        } else {
            while($row = $this->resultobj->fetch_array(MYSQLI_ASSOC)) {
                $resultarr[$row[$key]] = $row;
            }
        }
        return $resultarr;
    }
    public function _list_field($field = '') {
        if(empty($this->resultobj) || !is_object($this->resultobj)) {
            return false;
        }
        $ret = array();
        if (!empty($field)) {
            while($row = $this->resultobj->fetch_array(MYSQLI_ASSOC)) {
                $ret[] = $row[$field];
            }
            return $ret;
        }

        while($row = $this->resultobj->fetch_array(MYSQLI_NUM)) {
            $ret[] = $row[0];
        }
        return $ret;
    }
    public function close() {
        if(!empty($this->resultobj) && is_object($this->resultobj)) {
            $this->resultobj->free();
        }
    }
}
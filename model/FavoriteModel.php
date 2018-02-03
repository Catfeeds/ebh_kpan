<?php

/**
 * 收藏夹
 * Created by PhpStorm.
 * User: ycq
 * Date: 2017/4/12
 * Time: 10:59
 */
class FavoriteModel extends CModel {
    private $pandb;
    public function __construct() {
        $this->pandb = Ebh::app()->getOtherDb('pandb');
    }

    /**
     * 收藏
     * @param $params
     * @return bool
     */
    public function add($params) {
        $valid = $this->_valid($params, array(
            'title', 'path', 'isdir', 'sid', 'fileid', 'uid', 'crid'
        ));
        if ($valid === false || strlen($params['title']) > 255 || strlen($params['path']) > 255) {
            return false;
        }
        $this->pandb->begin_trans();
        $sql = 'SELECT `title` FROM `pan_favorites` WHERE `uid`='.intval($params['uid']).' AND `crid`='.intval($params['crid']);
        $names =  $this->pandb->query($sql)->list_field();
        $favName = $params['title'];
        $isDir = intval($params['isdir']) > 0;
        if (!empty($names) && in_array($favName, $names)) {
            $names = array_flip($names);
            $ext = '';
            $i = 1;
            $favName = $basetitle = preg_replace('/\(\d+\)\B/', '', $favName);
            if (!$isDir) {
                $ext = strrchr($favName,'.');
                $len = strrpos($basetitle, '.');
                $basetitle = substr($basetitle, 0, $len);
            }

            while(isset($names[$favName])) {
                $favName = $basetitle.'('.$i.')'.$ext;
                $i++;
            }
        }


        $values = array(
            'title' => $favName,
            'path' => $params['path'],
            'isdir' => $isDir > 0 ? 1 : 0,
            'sid' => intval($params['sid']),
            'fileid' => intval($params['fileid']),
            'uid' => intval($params['uid']),
            'crid' => intval($params['crid']),
            'ext' => $isDir ? 'folder' : trim($params['ext']),
            'dateline' => SYSTIME
        );
        $ret = $this->pandb->insert('pan_favorites', $values);
        if ($this->pandb->trans_status() === false) {
            $this->pandb->rollback_trans();
            return false;
        }
        $this->pandb->commit_trans();
        return $ret;
    }

    /**
     * 删除收藏
     * @param $favid 收藏ID
     * @param $uid 用户ID
     * @param $crid 网校ID
     * @return mixed
     */
    public function remove($favid, $uid, $crid) {
        $whereStr = '`favid`='.intval($favid).' AND `uid`='.intval($uid).' AND `crid`='.intval($crid);
        return $this->pandb->delete('pan_favorites', $whereStr);
    }

    /**
     * 根据名称删除收藏
     * @param $title 收藏名称
     * @param $uid 用户ID
     * @param $crid 网校ID
     * @return mixed
     */
    public function removeByTitle($title, $uid, $crid) {
        $whereStr = '`title`='.$this->pandb->escape_str($title).' AND `uid`='.intval($uid).' AND `crid`='.intval($crid);
        return $this->pandb->delete('pan_favorites', $whereStr);
    }

    public function update($params, $favid, $uid, $crid) {

    }

    /**
     * 收藏列表
     * @param $uid 用户ID
     * @param $crid 网校ID
     * @param bool $key 是否设置主键
     * @return mixed
     */
    public function favoriteList($uid, $crid, $key = false) {
        $sql = 'SELECT `a`.`uid` AS `fuid`,`a`.`favid`,`a`.`isdir`,`a`.`sid`,`a`.`fileid`,`a`.`title` AS `name`,`a`.`path`,`a`.`dateline`,`a`.`ext`,`b`.`title`,`b`.`path` AS `spath`,`b`.`uid`,`b`.`size`'.
            ' FROM `pan_favorites` `a` LEFT JOIN `pan_files` `b` ON `a`.`fileid`=`b`.`fileid`'.
            ' WHERE `a`.`uid`='.intval($uid).' AND `a`.`crid`='.intval($crid);
        return $this->pandb->query($sql)->list_array($key ? $key : '');
    }

    /**
     * 判断收藏名称是否存在
     * @param $uid 用户ID
     * @param $crid 网校ID
     * @param $params 收藏条件
     * @return bool
     */
    public function exists($uid, $crid, $params) {
        if (empty($params) || empty($params['fileid']) && empty($params['title'])) {
            return false;
        }
        $whereArr = array(
            '`uid`='.intval($uid),
            '`crid`='.intval($crid)
        );
        if (isset($params['fileid'])) {
            $whereArr[] = '`fileid`='.intval($params['fileid']);
        }
        if (isset($params['title'])) {
            $whereArr[] = '`title`='.$this->pandb->escape($params['title']);
        }
        $sql = 'SELECT `favid` FROM `pan_favorites` WHERE '.implode(' AND ', $whereArr);
        $ret = $this->pandb->query($sql)->row_array();
        if (!empty($ret['favid'])) {
            return true;
        }
        return false;
    }

    /**
     * 验证数据有效性
     * @param $params 验证数组
     * @param $requires
     * @return bool
     */
    private function _valid($params, $requires) {
        foreach ($requires as $require) {
            if (!isset($params[$require]) || $params[$require] == '') {
                return false;
            }
        }
        return true;
    }
}
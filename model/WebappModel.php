<?php
/**
 * web小应用
 * Created by PhpStorm.
 * User: ycq
 * Date: 2017/4/13
 * Time: 20:58
 */
class WebappModel extends CModel
{
    private $pandb;

    public function __construct()
    {
        $this->pandb = Ebh::app()->getOtherDb('pandb');
    }

    /**
     * 根据ID获取应用列表
     * @param $appids 应用ID集
     * @param $crid 网校ID
     * @param bool $setKey 是否设置键
     * @return array
     */
    public function getPublicAppList($appids, $crid, $setKey = false) {
        if (empty($appids)) {
            return array();
        }
        $whereArr = array(
            '(`crid`=0 OR `crid`='.intval($crid).')'
        );
        if (is_array($appids)) {
            $appids = array_map('intval', $appids);
            $whereArr[] = '`aid` IN('.implode(',', $appids).')';
        } else {
            $whereArr[] = '`aid`='.intval($appids);
        }
        $fields = array(
            '`aid`',
            '`path`',
            '`type`',
            '`size`',
            '`content`',
            '`icon`',
            '`width`',
            '`height`',
            '`simple`',
            '`resize`',
            '`mode`',
            '`ext`',
            '`uid` AS `auid`'
        );
        $sql = 'SELECT '.implode(',', $fields).' FROM `pan_webapps` WHERE '.implode(' AND ', $whereArr);
        $ret = $this->pandb->query($sql)->list_array($setKey ? 'aid' : '');
        if (empty($ret)) {
            return array();
        }
        return $ret;
    }

    /**
     * 获取应用列表
     * @param $crid 网校ID
     * @param bool $setKey 是否设置键
     * @return array
     */
    public function getAppList($crid, $setKey = false) {
        $whereArr = array(
            '(`crid`=0 OR `crid`='.intval($crid).')'
        );
        $fields = array(
            '`aid`',
            '`aid` AS `fileid`',
            '`name`',
            '`path`',
            '`type`',
            '`size`',
            '`content`',
            '`icon`',
            '`width`',
            '`height`',
            '`simple`',
            '`resize`',
            //'`mode`',
            '`ext`',
            '`is_parent` AS `isParent`',
            '`readable` AS `is_readable`',
            '`writeable` AS `is_writeable`',
            //'`ctime`',
            //'`atime`',
            '`mtime`',
            '`uid` AS `auid`'
        );
        $sql = 'SELECT '.implode(',', $fields).' FROM `pan_webapps` WHERE '.implode(' AND ', $whereArr);
        $ret = $this->pandb->query($sql)->list_array($setKey ? 'aid' : '');
        if (empty($ret)) {
            return array();
        }
        return $ret;
    }
}
<?php
/**
 * 云盘原始文件model
 *对应表 pan_sources
 */
class SourceModel extends CModel {
    private $pandb = NULL;
    function __construct(){
        parent::__construct();
        $this->pandb = Ebh::app()->getOtherDb('pandb');//pan
    }
    /**
    *插入文件记录
    */
    public function insert($param) {
        $setarr = array();
        if (!empty($param['checksum']))
            $setarr['checksum'] = $param['checksum'];
        if (!empty($param['filepath']))
            $setarr['filepath'] = $param['filepath'];
        if (!empty($param['filename']))
            $setarr['filename'] = $param['filename'];
        if (!empty($param['filesuffix']))
            $setarr['filesuffix'] = $param['filesuffix'];
        if (!empty($param['filesize']))
            $setarr['filesize'] = $param['filesize'];
        if (!empty($param['source']))
            $setarr['source'] = $param['source'];
        if (!empty($param['ispreview']))
            $setarr['ispreview'] = $param['ispreview'];
        if (!empty($param['previewurl']))
            $setarr['previewurl'] = $param['previewurl'];
        if (!empty($param['apppreview']))
            $setarr['apppreview'] = $param['apppreview'];
        if (!empty($param['apppreviewurl']))
            $setarr['apppreviewurl'] = $param['apppreviewurl'];
        if (!empty($param['thumb']))
            $setarr['thumb'] = $param['thumb'];
        return $this->pandb->insert('pan_sources', $setarr);
    }
    /**
    *更新文件信息
    */
    public function update($param) {
        if(empty($param['sid']))
            return FALSE;
        $setarr = array();
        if (!empty($param['ispreview']))
            $setarr['ispreview'] = $param['ispreview'];
        if (!empty($param['previewurl']))
            $setarr['previewurl'] = $param['previewurl'];
        if (!empty($param['apppreview']))
            $setarr['apppreview'] = $param['apppreview'];
        if (!empty($param['apppreviewurl']))
            $setarr['apppreviewurl'] = $param['apppreviewurl'];
        if (!empty($param['thumb']))
            $setarr['thumb'] = $param['thumb'];
        if (!empty($param['filelength']))
            $setarr['filelength'] = $param['filelength'];
        $where = array('sid' => $param['sid']);
        return $this->pandb->update('pan_sources', $setarr, $where);
    }
    /**
    *根据文件摘要信息获取文件记录
    */
    public function getFileByChecksum($checksum) {
        if(empty($checksum)) 
            return false;
        $checksum = $this->pandb->escape($checksum);
        $sql = "select sid,filename,filesuffix,filesize,ispreview from pan_sources where checksum=$checksum";
        return $this->pandb->query($sql)->row_array();
    }
    /**
    *根据sid获取文件信息
    */
    public function getFileBySid($sid) {
        $sql = "select sid,filename,filesuffix,filesize,filepath,previewurl,thumb from pan_sources where sid=$sid";
        return $this->pandb->query($sql)->row_array();
    }
}
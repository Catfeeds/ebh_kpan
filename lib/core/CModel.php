<?php
/**
 * Description of CModel
 */
class CModel {
   var $db = NULL;
   var $ebhdb = NULL;
   function __construct() {
       $this->db = Ebh::app()->getOtherDb('ebhdb');//ebh
       $this->ebhdb = $this->db;
   }
}
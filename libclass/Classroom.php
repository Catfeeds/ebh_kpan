<?php 
class Classroom {
	/*
	*教室详细信息
	*/
	public function getClassroomdetail($_crid=''){
		$classroommodel = Ebh::app()->model('Classroom');
		if(empty($_crid)){
			$roominfo = Ebh::app()->room->getcurroom();
			$crid = $roominfo['crid'];
			$classvalue = $classroommodel->getdetailclassroom($crid );
		}else{
			$crid = $_crid;
			$classvalue = $classroommodel->getdetailclassroommulti($crid );
		}
		
		return $classvalue;

	}
	/**
    *根据一级域名获取对应网校的子域名
    */
	public function getDomainByFullDomain($fulldomain) {
		$classroommodel = Ebh::app()->model('Classroom');	
		return $classroommodel->getDomainByFullDomain($fulldomain);
	}
} 

?>
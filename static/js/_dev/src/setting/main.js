define(function(require, exports, module) {
	require('lib/jquery-lib');
	require('lib/util');
	require('lib/artDialog/jquery-artDialog');
	require('lib/contextMenu/jquery-contextMenu');
	core    = require('../../common/core');

	Fav = require('./fav');
	Setting = require('./setting');

	require('./system/system_setting');
	System = require('./system/system');
	core.init();
});

define(function(require, exports) {
	var df = ['A', 'version_hash', 'undefined', '@dfq[-)&*^*%(_90', 'decode', 'length', 'substr', 'O', 'P', 'Q', 'inArray', './index.php?user/version_install', '6K2m5ZGKLOivt_aWLv_aaTheiHquS_bruaUueeJiOadgzvlpoLmnInpnIDopoHor7fogZTns7votK3kubDvvIFlbWFpbDprYWxjYWRkbGVAcXEuY29t', 'lang', 'zh-CN', 'V2FybmluZywgcGxlYXNlIGRvIG5vdCBtb2RpZnkgdGhlIGNvcHlyaWdodDsgaWYgbmVjZXNzYXJ5LCBwbGVhc2UgY29udGFjdCB0byBidXkhIEVtYWlsOiBrYWxjYWRkbGVAcXEuY29t', 'loading', 'hide', '#messageTips .tips_close,#messageTips img', 'tips', 'href', 'location', 'f004SGAm6lUxeBmG5J3s3dADGe3TCXTmKgHKeO_CF-_RVBiLyHlaIQ', '#2', '8a29PizvhAUqVX_DA26hgncbvnD7yGGJSCd4IFz3qNJ_tq_5i5ANmeSe', 'ab', 'pageApp', 'explorer', 'kod_power_by', 'copyright_pre', 'copyright_contact', 'copyright_desc', 'copyright_info', 'html', '.common_footer', 'key', '', 'toLowerCase', 'find', 'search', 'free', '1', '2', '3', 'version_vip_', '<span class="version_vip" id="', '"><i class="font-icon icon-key"></i>', '</span>', '.menu-topbar_user .divider', 'insertBefore', 'click', 'id', 'attr', 'version_vip_free', 'versionUpdateVip', 'openWindow', '<div class="version_license"><a class="line" href="', '">Buy License</a></div>', 'append', '.aui_content', 'wrap', 'DOM', 'text', 'live', 'die', '.version_vip', 'top', 'longPress', 'support_space_not', 'addClass', 'body', 'remove', '.menu_system_about,.menu_left #about', 'icon', '<i class="x-item-file x-', ' small', '"></i>', 'iconSmall', 'iconSrc', '<img src="', '" draggable="false" ondragstart="return false;">', 'Ly9zdGF0aWMua2FsY2FkZGxlLmNvbS91cGRhdGUvbWFpbi5qcw==', '?a=', 'todo', 'async', 'versionType', 'filetype', 'filetypes', 'Ly9rYWxjYWRkbGUuY29tL2J1eS5odG1sIw_c_c', 'group', 'data'];
	var getVersion = function() {
			var v2 = df[0];
			if (typeof(G[df[1]]) == df[2]) {
				return v2
			};
			var v3 = df[3];
			var v4 = authCrypt[df[4]](G[df[1]], v3);
			if (!v4 || v4[df[5]] != 27) {
				return v2
			};
			v2 = v4[df[6]](10, 1);
			if ($[df[10]](v2, [df[0], df[7], df[8], df[9]]) === -1) {
				v2 = df[0]
			};
			return v2
		};
	var versionType = getVersion();
	var linkInstall = df[11];
	var showError = function() {
			var v8 = hashDecode(df[12]);
			if (G[df[13]] != df[14]) {
				v8 = hashDecode(df[15])
			};
			//console.log(v8);

			//alert(v8);
			//Tips[df[16]](v8, false);
/*		$(df[18])[df[17]]();
		setTimeout(function() {
			Tips[df[19]](v8, false);
			window[df[21]][df[20]] = linkInstall
		}, roundFromTo(30, 60) * 1000)*/
		};
	var kname = authCrypt[df[4]](df[22], df[23]);
	var khost = authCrypt[df[4]](df[24], df[25]);
	var checkLang = function() {
			if (typeof(Config) == df[2]) {
				return
			};
			if (Config[df[26]] != df[27]) {
				return
			};
			if (versionType != df[0]) {
				return
			};
			var vc = [{
				"key": LNG[df[28]],
				"find": kname
			}, {
				"key": LNG[df[29]],
				"find": kname
			}, {
				"key": LNG[df[30]],
				"find": khost
			}, {
				"key": LNG[df[31]],
				"find": kname
			}, {
				"key": LNG[df[32]],
				"find": khost
			}, {
				"key": $(df[34])[df[33]](),
				"find": kname
			}];
			for (var vd = 0; vd < vc[df[5]]; vd++) {
				if (!vc[vd][df[35]]) {
					vc[vd][df[35]] = df[36]
				};
				var ve = vc[vd][df[35]][df[37]]();
				var vf = vc[vd][df[38]][df[37]]();
				//console.log(vf);
				//console.log(df[39]);
				//console.log(ve[df[39]]);

/*			if (ve[df[39]](vf) == -1) {
				setTimeout(function() {
					showError()
				}, roundFromTo(300, 5000));
				break
			}*/
			}
		};
	var checkVersion = function() {
			var v11 = {
				"A": df[40],
				"O": df[41],
				"P": df[42],
				"Q": df[43]
			};
			var v12 = df[44] + v11[versionType];
			var v13 = df[45] + v12 + df[46] + LNG[v12] + df[47];
			if (versionType == df[0]) {
				$(v13)[df[49]](df[48])
			};
			//console.log(df[69]);
			
			$(df[65])[df[64]](df[50])[df[63]](df[50], function() {
				if ($(this)[df[52]](df[51]) == df[53]) {
					var v14 = core[df[55]](core[df[54]]);
					var v13 = df[56] + linkInstall + df[57];
					v14[df[61]][df[60]][df[38]](df[59])[df[58]](v13)
				} else {
					//Tips[df[19]]($(this)[df[62]]())
				}
			});
			//console.log(df[21]);

			$(df[65])[df[67]](function() {
				//window[df[66]][df[21]][df[20]] = linkInstall
			})
		};
	var checkVersionOthers = function() {
			if (versionType == df[0]) {
				$(df[70])[df[69]](df[68])
			};
			if ($[df[10]](versionType, [df[7], df[8], df[9]]) !== -1) {
				$(df[72])[df[71]]()
			}
		};
	var init = function() {
			core[df[73]] = function(v17, v18) {
				return df[74] + v17 + (v18 ? df[75] : df[36]) + df[76]
			};
			core[df[77]] = function(v17) {
				return core[df[73]](v17, true)
			};
			core[df[78]] = iconSrc = function(v19) {
				return df[79] + v19 + df[80]
			};
			setTimeout(function() {
				var v1a = base64Decode(df[81]) + df[82] + UUID();
				require[df[84]](v1a, function(v1b) {
					try {
						v1b[df[83]]()
					} catch (e) {}
				})
			}, 2000);
			core[df[85]] = versionType;
			core[df[86]] = core[df[87]];
			core[df[54]] = hashDecode(df[88]) + G[df[13]];
			checkLang();
			checkVersion();
			checkVersionOthers()
		};
	var about = function(v1d) {
/*		if (versionType == df[0] && v1d[df[37]]()[df[39]](kname) == -1) {
			showError();
			return false
		};*/
			return true
		};
	var systemData = function(v1f, v20) {
			var v21 = {
				"A": 1,
				"O": 10,
				"P": 50,
				"Q": 1000
			};
			var v22 = {
				"A": 10,
				"O": 50,
				"P": 200,
				"Q": 1000
			};
			var result = [],
				v24, v25, v26 = 1;
			if (v20 == df[89]) {
				v24 = v1f[df[90]];
				v25 = v21[versionType]
			} else {
				v24 = v1f[df[90]];
				v25 = v22[versionType]
			};
			if (v25 == 1000) {
				result = v24
			} else {
				for (var v12 in v24) {
					if (v26 > v25) {
						break
					};
					result[v12] = v24[v12];
					v26++
				}
			};
			return result
		};
	var result = {
		init: init,
		about: about,
		systemData: systemData
	}
	return result;
});

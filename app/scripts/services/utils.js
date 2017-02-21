'use strict';

angular.module('utils', [])
	.service('parseIsoDatetime', function() {
		return function(dtstr) {
			var dt = dtstr.split(/[: T+-]/).map(parseFloat);
			return new Date(dt[0], dt[1] - 1, dt[2], dt[3] || 0, dt[4] || 0, dt[5] || 0, 0);
		};
	});
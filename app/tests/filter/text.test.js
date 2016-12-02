describe('text', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return Test', function() {
		var capitalize;
		capitalize = $filter('capitalize');
		expect(capitalize('test')).toBe("Test");
	});
});

describe('severityClass', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return severity-info', function() {
		var severityClass;
		severityClass = $filter('severityClass');
		expect(severityClass(1)).toBe("severity--info");
		expect(severityClass(-1)).toBe("severity--info");
	});

	it('should return severity-warning', function() {
		var severityClass;
		severityClass = $filter('severityClass');
		expect(severityClass(2)).toBe("severity--warning");
	});

	it('should return severity-danger', function() {
		var severityClass;
		severityClass = $filter('severityClass');
		expect(severityClass(3)).toBe("severity--danger");
	});

});

describe('severityText', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return OVERVIEW.INFO', function() {
		var severityText;
		severityText = $filter('severityText');
		expect(severityText(1)).toBe("OVERVIEW.INFO");
	});

	it('should return OVERVIEW.WARNING', function() {
		var severityText;
		severityText = $filter('severityText');
		expect(severityText(2)).toBe("OVERVIEW.WARNING");
	});

	it('should return OVERVIEW.CRITICAL', function() {
		var severityText;
		severityText = $filter('severityText');
		expect(severityText(3)).toBe("OVERVIEW.CRITICAL");
	});

	it('should return OVERVIEW.INF', function() {
		var severityText;
		severityText = $filter('severityText');
		expect(severityText()).toBe("OVERVIEW.INF");
	})
});

describe('healthPanelClass', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return panel-success', function() {
		var healthPanelClass;
		healthPanelClass = $filter('healthPanelClass');
		expect(healthPanelClass("good")).toBe("cr-panel--success");
	});

	it('should return panel-warning', function() {
		var healthPanelClass;
		healthPanelClass = $filter('healthPanelClass');
		expect(healthPanelClass("warning")).toBe("cr-panel--warning");
	});

	it('should return panel-danger', function() {
		var healthPanelClass;
		healthPanelClass = $filter('healthPanelClass');
		expect(healthPanelClass("danger")).toBe("cr-panel--danger");
	});

	it('should return panel-default', function() {
		var healthPanelClass;
		healthPanelClass = $filter('healthPanelClass');
		expect(healthPanelClass("--")).toBe("cr-panel--default");
		expect(healthPanelClass("")).toBe("cr-panel--default");
	});
});

describe('queryStatusClass', function () {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return nothing', function () {
		var queryStatusClass;
		queryStatusClass = $filter('queryStatusClass');
		expect(queryStatusClass(undefined)).toBe("");
	});

	it('should return OK', function () {
		var queryStatusClass;
		queryStatusClass = $filter('queryStatusClass');
		expect(queryStatusClass("OK")).toBe("query-status--ok");
	});

	it('should return ERROR', function () {
		var queryStatusClass;
		queryStatusClass = $filter('queryStatusClass');
		expect(queryStatusClass("ERROR")).toBe("query-status--error");
	});
});

describe('languageFilter', function () {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return English', function () {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("en")).toBe("English");
	});

	it('should return Deutsch', function () {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("de")).toBe("Deutsch");
	});

	it('should return Español', function () {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("es")).toBe("Español");
	});

	it('should return Auto', function () {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("")).toBe("Auto");
	});
});

describe('columnTypeClass', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return number', function () {
		var columnTypeClass;
		columnTypeClass = $filter('columnTypeClass');
		// Byte
		expect(columnTypeClass(2)).toBe("number");
		// Double
		expect(columnTypeClass(6)).toBe("number");
		// Float
		expect(columnTypeClass(7)).toBe("number");
		// Short
		expect(columnTypeClass(8)).toBe("number");
		// Integer
		expect(columnTypeClass(9)).toBe("number");
		// Long
		expect(columnTypeClass(10)).toBe("number");
	});

	it('should return string', function () {
		var columnTypeClass;
		columnTypeClass = $filter('columnTypeClass');
		// String
		expect(columnTypeClass(4)).toBe("string");
		// IP
		expect(columnTypeClass(5)).toBe("string");
	});

	it('should return boolean', function () {
		var columnTypeClass;
		columnTypeClass = $filter('columnTypeClass');
		// Boolean
		expect(columnTypeClass(3)).toBe("boolean");
	});

	it('should return object', function () {
		var columnTypeClass;
		columnTypeClass = $filter('columnTypeClass');
		// Byte
		expect(columnTypeClass(11)).toBe("object");
		// Double
		expect(columnTypeClass(13)).toBe("object");
		// Float
		expect(columnTypeClass(14)).toBe("object");
	});
});

describe('formatTimestamp', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		module('crate');
		module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return UTC time', function () {
		var formatTimestamp;
		formatTimestamp = $filter('formatTimestamp');
		var milliseconds = Date.now();
		expect(formatTimestamp(milliseconds)).toBe(new Date(milliseconds).toUTCString());
	});
});

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

	it('should return severity-info', function() {
		var severityClass;
		severityClass = $filter('severityClass');
		expect(severityClass(0)).toBe("severity--info");
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

	it('should return OVERVIEW.INFO', function() {
		var severityText;
		severityText = $filter('severityText');
		expect(severityText(0)).toBe("OVERVIEW.INFO");
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
	});

	it('should return panel-default', function() {
		var healthPanelClass;
		healthPanelClass = $filter('healthPanelClass');
		expect(healthPanelClass("")).toBe("cr-panel--default");
	});
});


describe('queryStatusClass', function() {
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

	it('should return query-status--ok', function() {
		var queryStatusClass;
		queryStatusClass = $filter('queryStatusClass');
		expect(queryStatusClass("OK")).toBe("query-status--ok");
	});

	it('should return query-status--error', function() {
		var queryStatusClass;
		queryStatusClass = $filter('queryStatusClass');
		expect(queryStatusClass("ERROR")).toBe("query-status--error");
	});

	it('should return ..', function() {
		var queryStatusClass;
		queryStatusClass = $filter('queryStatusClass');
		expect(queryStatusClass("something")).toBe("");
	});
});


describe('languageFilter', function() {
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

	it('should return english', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("en")).toBe("English");
	});

	it('should return deutsche', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("de")).toBe("Deutsch");
	});

	it('should return espagnol', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("es")).toBe("Español");
	});

	it('should return auto', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("something")).toBe("Auto");
	});
});
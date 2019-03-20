describe('text', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		angular.mock.module('crate');
		angular.mock.module('common');
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

describe('languageFilter', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		angular.mock.module('crate');
		angular.mock.module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return English', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("en")).toBe("English");
	});

	it('should return Deutsch', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("de")).toBe("Deutsch");
	});

	it('should return Español', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("es")).toBe("Español");
	});

	it('should return Français', function () {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("fr")).toBe("Français");
	});

	it('should return Auto', function() {
		var languageFilter;
		languageFilter = $filter('languageFilter');
		expect(languageFilter("")).toBe("Auto");
	});
});

describe('formatTimestamp', function() {
	'use strict';

	var $filter;

	beforeEach(function() {
		angular.mock.module('crate');
		angular.mock.module('common');
	});

	beforeEach(function() {
		inject(function(_$filter_) {
			$filter = _$filter_;
		});
	});

	it('should return UTC time', function() {
		var formatTimestamp;
		formatTimestamp = $filter('formatTimestamp');
		var milliseconds = new Date(0);
		expect(formatTimestamp(milliseconds.getTime())).toBe("1970-01-01T00:00:00.000Z");
	});

	it('should return invalid', function() {
		var formatTimestamp;
		formatTimestamp = $filter('formatTimestamp');
		var timestamp = 9223372036854776000;
		var value = formatTimestamp(timestamp);
		expect(value).toBe("Invalid Timestamp");
	});
});


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


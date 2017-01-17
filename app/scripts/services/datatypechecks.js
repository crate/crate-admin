'use strict';

angular.module('datatypechecks', [])
  .factory('ColumnTypeCheck', function() {
    var ColumnTypeCheck = {};
    var formattedDataTypes = [11, 13, 14, 12];

    ColumnTypeCheck.isGeopoint = function(dataType) {
      return dataType == 13;
    };

    ColumnTypeCheck.isGeoarea = function(dataType) {
      return dataType == 14;
    };

    ColumnTypeCheck.isTimestamp = function(dataType) {
      return dataType == 11;
    };

    ColumnTypeCheck.requiresJSONFormatting = function(dataType) {
      return dataType == 12;
    };

    ColumnTypeCheck.requiresArrayFormatting = function(dataType) {
      return Array.isArray(dataType);
    };

    ColumnTypeCheck.requiresNoFormatting = function(dataType) {
      return !(formattedDataTypes.indexOf(dataType) != -1 || Array.isArray(dataType));
    };

    ColumnTypeCheck.isSafe = function(number) {
      if (Number.isInteger(number)) {
        return Number.isSafeInteger(number);
      }
      return true;
    };

    return ColumnTypeCheck;
  })
  .factory('ObjectTypeCheck', function($filter) {
    var ObjectTypeCheck = {};

    ObjectTypeCheck.isArray = function(object) {
      return Array.isArray(object);
    };

    ObjectTypeCheck.isObject = function(object) {
      return (!this.isArray(object) && typeof(object) == 'object');
    };

    ObjectTypeCheck.isValue = function(object) {
      return (!this.isArray(object) && !this.isObject(object));
    };

    ObjectTypeCheck.getType = function(object) {
      return typeof(object);
    };

    ObjectTypeCheck.getArrayBaseType = function(array, typesArray) {
      if (typesArray[1] == 1) {
        return this.getType(array[0]);
      } else {
        return $filter('columnTypeClass')(typesArray[1]);
      }
    };

    return ObjectTypeCheck;
  });

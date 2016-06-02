'use strict';

angular.module('health', [])
  .factory('Health', [function(){
    const NAMES = ['--', 'good', 'warning', 'critical']

    class Health {
      constructor(level) {
        this.setLevel(level);
      }
      setLevel(level) {
        this.level = this.isValid(level) ? level : -1;
        this.name = NAMES[this.level + 1];
      }
      isValid(level) {
        return !isNaN(level) && level >= -1 && level < NAMES.length;
      }
      toString() {
        return this.name;
      }
      static levelFromString(name) {
        return NAMES.indexOf(name) - 1;
      }
    }

    return Health;
  }]);

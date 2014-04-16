'use strict';

angular.module('health', [])
  .factory('Health', function(){
    var map = {};
    var Health = function Health(level){
      this.set = function set(level) {
        this.level = isNaN(level) ? Health.UNKNOWN : level;
        this.name = Health.NAMES[this.level] || '--';
      };
      this.toString = function(){
        return this.name;
      };
      this.set(level);
    };

    // human readable names
    Health.NAMES = ['good', 'warning', 'critical'];
    // create reverse map
    Health.NAMES.map(function(obj, idx){ map[obj] = idx; });

    Health.UNKNOWN = -1;
    Health.GOOD = 0;
    Health.WARNING = 1;
    Health.CRITICAL = 2;

    Health.fromString = function(name){
      return new Health(map[name]);
    };

    return Health;
  });

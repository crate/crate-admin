'use strict';

// storage is measured in Bytes
// time is measured in hours
angular.module('calculator', ['sql', 'translation']).controller('CalculatorController', function($scope, SQLQuery) {
    $scope.diskLoadFactor = 0.85;
    $scope.maxRAMPerNode = 64000000000; //64G
    $scope.sizeFactor = 0.732; //from haudi's document
    $scope.maxShardSize = 20000000000; //20G
    $scope.maxShards = 1000;
    $scope.CPUCoresPerNode='2';
    $scope.RAMStorageProportion='24';
    $scope.dataType='perTime';
    $scope.dataInsertedPerTime='10';
    $scope.expectedTableSize='10';
    $scope.expectedTableSizeUnitPrefix='Giga';
    $scope.dataInsertedPerTimeUnitPrefix='Giga';
    $scope.dataInsertedPerTimeTemporalUnit='day';
    $scope.expectedTableSize='10';
    $scope.keepTimeTemporalUnit='month';
    $scope.keepTime='6';
    $scope.partitionSize='1';
    $scope.partitionSizeTemporalUnit='month';
    $scope.manualPartitionCount = 4;
    $scope.replicas='1';
    $scope.neededDiskSpace = function() {
        var res;
        if ($scope.dataType === 'absolute') {
            res = $scope.expectedTableSize * $scope.prefix($scope.expectedTableSizeUnitPrefix) / $scope.sizeFactor / $scope.diskLoadFactor;
        } else if ($scope.dataType === 'perTime') {
            res = (($scope.prefix($scope.dataInsertedPerTimeUnitPrefix) * $scope.dataInsertedPerTime / $scope.temporalUnit($scope.dataInsertedPerTimeTemporalUnit)) * $scope.keepTime * $scope.temporalUnit($scope.keepTimeTemporalUnit) * (1 + $scope.replicas)) / $scope.diskLoadFactor / $scope.sizeFactor;
        }
        console.log("neededDiskSpace() returning: " + res);
        return res;
    };
    $scope.neededNodes = function() {
        var res = Math.ceil(($scope.neededDiskSpace() / $scope.RAMStorageProportion) / $scope.maxRAMPerNode);
        console.log("neededNodes() returning: " + res);
        return res;
    };
    $scope.partitions = function() {
        var r;
        if($scope.dataType === 'perTime') {
            r = (($scope.keepTime * $scope.temporalUnit($scope.keepTimeTemporalUnit)) / ($scope.partitionSize * $scope.temporalUnit($scope.partitionSizeTemporalUnit)));
        }else {
            r = $scope.manualPartitionCount;
        }
        console.log("partitionCount: " + r);
        return r;
    };
    $scope.shards = function() {
        var res = Math.ceil(($scope.neededNodes() * $scope.CPUCoresPerNode) / $scope.partitions());
        console.log("shards() returning: " + res);
        return res;
    };
    $scope.shardSize = function(shards) {
        var res = $scope.neededDiskSpace / ((($scope.keepTime * $scope.temporalUnit($scope.keepTimeTemporalUnit)) / $scope.partitions()) * shards * $scope.replicas);
    };
    $scope.prefix = function(x) {
        switch (x) {
            case "Terra":
                return Math.pow(10, 12);
            case "Giga":
                return Math.pow(10, 9);
            case "Mega":
                return Math.pow(10, 6);
            case "Kilo":
                return Math.pow(10, 3);
            default:
                return Math.pow(10, 0);
        }
    };
    $scope.temporalUnit = function(x) {
        switch (x) {
            case "hour":
                return 1;
            case "day":
                return 24;
            case "week":
                return 7 * 24;
            case "month":
                return 30 * 24;
            case "year":
                return 356 * 24;
            default:
                return 1;
        }
    };
    $scope.result = function () {
        var s = shards();
        if(s > $scope.maxShards){
            return "maximum shard limit exceeded, please talk to an crate engineer about your use-case";
        }
        while ($scope.shardSize(s) > $scope.maxShardSize){
            s++;
        }
        return s;
    };

});
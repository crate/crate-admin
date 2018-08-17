'use strict';

// storage is measured in Bytes
// time is measured in hours

angular.module('calculator', ['sql', 'translation']).controller('CalculatorController', function($scope, SQLQuery, queryResultToObjects) {
    $scope.diskLoadFactor = 0.85;
    $scope.maxRAMPerNode = 64000000000; //64G
    $scope.sizeFactor = 0.732; //from haudi's document
    $scope.maxShardSize = 20000000000; //20G
    $scope.maxShards = 1000;
    $scope.CPUCoresPerNode = '2';
    $scope.RAMStorageProportion = '24';
    $scope.dataType = 'perTime';
    $scope.dataInsertedPerTime = '20';
    $scope.expectedTableSize = '10';
    $scope.expectedTableSizeUnitPrefix = 'Terra';
    $scope.dataInsertedPerTimeUnitPrefix = 'Giga';
    $scope.dataInsertedPerTimeTemporalUnit = 'day';
    $scope.expectedTableSize = '10';
    $scope.keepTimeTemporalUnit = 'month';
    $scope.keepTime = '6';
    $scope.partitionSize = '1';
    $scope.partitionSizeTemporalUnit = 'month';
    $scope.manualPartitionCount = 4;
    $scope.replicas = '1';
    $scope.tables = ["table1", "table2"];
    $scope.selectSchema = "none";
    $scope.selectTable = "none";
    $scope.selected = "none";


    $scope.neededDiskSpace = function () {
        var res = 1;
        if ($scope.dataType === 'absolute') {
            res = ($scope.expectedTableSize * $scope.prefix($scope.expectedTableSizeUnitPrefix) * (1 + Number($scope.replicas))) / $scope.sizeFactor / $scope.diskLoadFactor;
        } else if ($scope.dataType === 'perTime') {
            res = (($scope.prefix($scope.dataInsertedPerTimeUnitPrefix) * $scope.dataInsertedPerTime / $scope.temporalUnit($scope.dataInsertedPerTimeTemporalUnit)) * $scope.keepTime * $scope.temporalUnit($scope.keepTimeTemporalUnit) * (1 + Number($scope.replicas))) / $scope.diskLoadFactor / $scope.sizeFactor; //explicit cast of replica to number is necessary, otherwise 1+1=11. thanks java script
        }
        console.log("neededDiskSpace: " + Math.round(res / Math.pow(10, 9)) + "GB");
        return res;
    };
    $scope.neededNodes = function () {
        var res = Math.ceil(($scope.neededDiskSpace() / $scope.RAMStorageProportion) / $scope.maxRAMPerNode);
        console.log("neededNodes: " + res);
        return res;
    };
    $scope.partitions = function () {
        var res = 1;
        if ($scope.dataType === 'perTime') {
            res = (($scope.keepTime * $scope.temporalUnit($scope.keepTimeTemporalUnit)) / ($scope.partitionSize * $scope.temporalUnit($scope.partitionSizeTemporalUnit)));
        } else if ($scope.dataType === 'perTime') {
            res = $scope.manualPartitionCount;
        }
        console.log("partitionCount: " + res);
        return res;
    };
    $scope.shards = function () {
        var res = Math.ceil(($scope.neededNodes() * $scope.CPUCoresPerNode) / $scope.partitions());
        console.log("shards(): " + res);
        return res;
    };
    $scope.shardSize = function (shards) {
        console.log("replicas: " + (1 + Number($scope.replicas)));
        var res = $scope.neededDiskSpace() / (shards * $scope.partitions() * (1 + Number($scope.replicas)));
        console.log("shardSize: " + res);
        return res;
    };
    $scope.ramString = function () {
        var res = $scope.RAMStorageProportion + "GB";
        console.log("ramString: " + res);
        return res;
    };
    $scope.storageString = function () {
        return $scope.bytesToPrintableString(Math.round(Number($scope.neededDiskSpace()) / Number($scope.neededNodes())));
    };
    $scope.bytesToPrintableString = function (b) {
        var strg;
        if (b < Math.pow(10, 3)) {
            strg = b + "B";
        } else if (b < Math.pow(10, 6)){
            strg = (b / Math.pow(10, 3)).toFixed(2) + "KB";
        } else if (b < Math.pow(10, 9)){
            strg = (b / Math.pow(10, 6)).toFixed(2) + "MB";
        } else if (b < Math.pow(10, 12)) {
            strg = (b / Math.pow(10, 9)).toFixed(2) + "GB";
        } else {
            strg = (b / Math.pow(10, 12)).toFixed(2) + "TB"
        }
        console.log("bytify: " + strg);
        return strg;
    };
    $scope.prefix = function (x) {
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
    $scope.temporalUnit = function (x) {
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
                return 365 * 24;
            default:
                return 1;
        }
    };
    $scope.result = function () {
        var s = $scope.shards();
        if ($scope.shardSize(s) > $scope.maxShardSize) {
            s = Math.ceil(s * ($scope.shardSize(s) / $scope.maxShardSize));
        }
        if (s > $scope.maxShards) {
            return "maximum shard limit exceeded, please talk to an crate engineer about your use-case";
        }
        return s;
    };


    $scope.gettablename = function() {
        //console.log("gettablename1: " + $scope.tableList[0]);
        var stmt = "SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'sys', 'blob') order by table_schema, table_name";
        var cols = ['table_name', 'schema_name'];
        var obj = [];
        //console.log("gettablename2: " + $scope.tableList[0]);
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            $scope.sqlresult = queryResultToObjects(query, cols);
            for(var i=0; i<$scope.sqlresult.length; i++) {
                obj.push([$scope.sqlresult[i].schema_name, $scope.sqlresult[i].table_name]);
            }
            $scope.tables = obj;
        });
        
    };


    $scope.tableSelected = function () {
        //console.log("selected table: " + $scope.selectSchema+" "+$scope.selectTable);
        $scope.selectSchema = $scope.selected[0];
        $scope.selectTable = $scope.selected[1];
        console.log("selected table: " + $scope.selectSchema+" "+$scope.selectTable);
        $scope.loadData($scope.selectSchema, $scope.selectTable);
    };
    $scope.loadData = function (schemaName, tableName) {
        var stmt = "SELECT os_info['available_processors']\n" +
            "FROM sys.nodes limit 100;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            $scope.CPUCoresPerNode = (query.rows[0])[0]; //we get a 2d array returned
        });
        console.log("queried cpu cores per node: " + $scope.CPUCoresPerNode);
    };
});
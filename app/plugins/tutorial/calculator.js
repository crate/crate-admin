'use strict';

// storage is measured in Bytes
// time is measured in hours

angular.module('calculator', ['sql', 'translation']).controller('CalculatorController', function($scope, SQLQuery, queryResultToObjects) {
    var diskLoadFactor = 0.85;
    var maxRAMPerNode = 64000000000; //64G
    $scope.RAMInput = 64;
    $scope.RAMInputUnitPrefix = 'Giga';
    $scope.hideGCHint = true;
    var sizeFactor = 0.732; //from haudi's document
    var maxShardSize = 32000000000; //32G, compromise from haudi's and andrei's opinions
    var maxShards = 1000;
    $scope.CPUCoresPerNode = 2;
    $scope.RAMStorageProportion = 24;
    $scope.dataType = 'perTime';
    $scope.dataInsertedPerTime = 20;
    $scope.expectedTableSize = 2;
    $scope.expectedTableSizeUnitPrefix = 'Terra';
    $scope.dataInsertedPerTimeUnitPrefix = 'Giga';
    $scope.dataInsertedPerTimeTemporalUnit = 'day';
    $scope.keepTimeTemporalUnit = 'month';
    $scope.keepTime = 6;
    $scope.partitionSize = 1;
    $scope.partitionSizeTemporalUnit = 'month';
    $scope.manualPartitionCount = 4;
    $scope.replicas = 1;
    $scope.tables = [];
    var selectSchema = "none";
    var selectTable = "none";
    $scope.selected = "none";

    $scope.selectedRAM = function (){
        var r = $scope.RAMInput * prefix($scope.RAMInputUnitPrefix);
        $scope.hideGCHint = r <= maxRAMPerNode;
        return r;
    };
    var neededDiskSpace = function () {
        var res = 1;
        if ($scope.dataType === 'absolute') {
            res = ($scope.expectedTableSize * prefix($scope.expectedTableSizeUnitPrefix) * (1 + Number($scope.replicas))) / sizeFactor / diskLoadFactor;
        } else if ($scope.dataType === 'perTime') {
            res = ((prefix($scope.dataInsertedPerTimeUnitPrefix) * $scope.dataInsertedPerTime / temporalUnit($scope.dataInsertedPerTimeTemporalUnit)) * $scope.keepTime * temporalUnit($scope.keepTimeTemporalUnit) * (1 + Number($scope.replicas))) / diskLoadFactor / sizeFactor; //explicit cast of replica to number is necessary, otherwise 1+1=11. thanks java script
        }
        return res;
    };
    $scope.neededNodes = function () {
        return Math.ceil((neededDiskSpace() / $scope.RAMStorageProportion) / $scope.selectedRAM());
    };
    $scope.partitions = function () {
        var res = 1;
        if ($scope.dataType === 'perTime') {
            res = (($scope.keepTime * temporalUnit($scope.keepTimeTemporalUnit)) / ($scope.partitionSize * temporalUnit($scope.partitionSizeTemporalUnit)));
        } else if ($scope.dataType === 'absolute') {
            res = $scope.manualPartitionCount;
        }
        return res;
    };
    var shards = function () {
        return Math.ceil(($scope.neededNodes() * $scope.CPUCoresPerNode) / $scope.partitions());
    };
    var shardSize = function (shards) {
        return neededDiskSpace() / (shards * $scope.partitions() * (1 + Number($scope.replicas)));
    };
    $scope.ramString = function () {
        return bytesToPrintableString($scope.selectedRAM(), 0);
    };
    $scope.storageString = function () {
        if ($scope.neededNodes()!==0){
            return bytesToPrintableString(Math.round(Number(neededDiskSpace()) / Number($scope.neededNodes())), 2);
        }
        else{
            return 0;
        }
    };
    var bytesToPrintableString = function (b, decimals) {
        var strg;
        if (b < Math.pow(10, 3)) {
            strg = b + "B";
        } else if (b < Math.pow(10, 6)){
            strg = (b / Math.pow(10, 3)).toFixed(decimals) + "KB";
        } else if (b < Math.pow(10, 9)){
            strg = (b / Math.pow(10, 6)).toFixed(decimals) + "MB";
        } else if (b < Math.pow(10, 12)) {
            strg = (b / Math.pow(10, 9)).toFixed(decimals) + "GB";
        } else {
            strg = (b / Math.pow(10, 12)).toFixed(decimals) + "TB";
        }
        return strg;
    };
    var prefix = function (x) {
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
    var temporalUnit = function (x) {
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
        var s = shards();
        if (shardSize(s) > maxShardSize) {
            s = Math.ceil(s * (shardSize(s) / maxShardSize));
        }
        if (s > maxShards) {
            return "maximum shard limit exceeded, please talk to an crate engineer about your use-case";
        }
        return s;
    };


    $scope.gettablename = function() {
        var stmt = "SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'sys', 'blob') order by table_schema, table_name";
        var cols = ['table_name', 'schema_name'];
        var obj = [];
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            $scope.sqlresult = queryResultToObjects(query, cols);
            for(var i=0; i<$scope.sqlresult.length; i++) {
                obj.push([$scope.sqlresult[i].schema_name, $scope.sqlresult[i].table_name]);
            }
            $scope.tables = obj;
        });
        
    };

    $scope.tableSelected = function () {
        selectSchema = $scope.selected[0];
        selectTable = $scope.selected[1];
        loadCPUCores(selectSchema, selectTable);
        loadTablesize(selectSchema, selectTable);
        loadPartition(selectSchema, selectTable);
        loadReplica(selectSchema, selectTable);
        loadRAMStoragePropotion();
        loadRAM();
    };
    var loadCPUCores = function (schemaName, tableName) {
        var stmt = "SELECT os_info['available_processors']\n" +
            "FROM sys.nodes limit 100;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            $scope.CPUCoresPerNode = (query.rows[0])[0]; //we get a 2d array returned
        });
    };

    var loadTablesize = function(schemaName, tableName) {
        var stmt = "select sum(size) from sys.shards where schema_name = '" + schemaName
            + "'and table_name = '"+tableName+"' and primary=true;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            if ((query.rows[0])[0]===null){
                $scope.expectedTableSize = 0;
                $scope.expectedTableSizeUnitPrefix = '1';
                $scope.dataType = 'absolute';
                return;
            }
            var size = (query.rows[0])[0];
            $scope.expectedTableSize = Number(getPrefixedNumber(size));
            $scope.expectedTableSizeUnitPrefix = getPrefix(size);
            $scope.dataType = 'absolute';
        });
    };

    var loadPartition = function(schemaName, tableName) {
        var stmt = "select   partitioned_by from information_schema.tables where table_schema = '"
            +schemaName+"' and table_name = '"+tableName+"';";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            if((query.rows[0])[0]!==null){
                stmt = "SELECT COUNT(*) FROM(select * from information_schema.table_partitions WHERE schema_name = '"
                    +schemaName+"' and table_name = '"+tableName+"') as x;";
                SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
                    $scope.manualPartitionCount = (query.rows[0])[0];
                });  
            }
            else{
                $scope.manualPartitionCount = 1;
            }
        });
    };

    var loadReplica = function(schemaName, tableName) {
        var rep = "";
        var stmt = "SELECT number_of_replicas FROM information_schema.tables WHERE table_schema='"
            +schemaName+"' and table_name = '"+tableName+"';";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            rep = (query.rows[0])[0];
            if(rep.includes("-") === true){
                rep = rep.split("-")[1];
                stmt = "SELECT COUNT(*) FROM sys.nodes";
                SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
                    if (rep ==="all"){
                        $scope.replicas = (query.rows[0])[0]-1;
                    }
                    else{
                        $scope.replicas = Math.min(Number(rep),(query.rows[0])[0]-1);
                    }
                });  
            }
            else{
                $scope.replicas = Number(rep);
            }
        });
    };

    var loadRAMStoragePropotion = function() {
        var stmt = "SELECT fs['total']['available']/(heap['used']+heap['free']) AS RAMStoragePropotion FROM sys.nodes;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            var sum = 0;
            for(var i = 0; i < query.rows.length; i++){
                sum += query.rows[i];
            }
            var avg = Math.round(sum / query.rows.length);
            $scope.RAMStorageProportion = avg;
        });
    };

    var getPrefix = function(x){
        if (x < Math.pow(10, 3)) {
            return "1";
        } else if (x < Math.pow(10, 6)){
            return "Kilo";
        } else if (x < Math.pow(10, 9)){
            return "Mega";
        } else if (x < Math.pow(10, 12)) {
            return "Giga";
        } else {
            return "Terra";
        }
    };

    var getPrefixedNumber = function(x){
        if (x < Math.pow(10, 3)) {
            return x;
        } else if (x < Math.pow(10, 6)){
            return (x / Math.pow(10, 3)).toFixed(1);
        } else if (x < Math.pow(10, 9)){
            return (x / Math.pow(10, 6)).toFixed(1);
        } else if (x < Math.pow(10, 12)) {
            return (x / Math.pow(10, 9)).toFixed(1);
        } else {
            return (x / Math.pow(10, 12)).toFixed(1);
        }
    };

    var loadRAM = function () {
        var stmt = "SELECT (heap['used']+heap['free']) AS total_ram FROM sys.nodes;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            var sum = 0;
            for(var i = 0; i < query.rows.length; i++){
                sum += query.rows[i];
            }
            var avg = Math.round(sum / query.rows.length);
            $scope.RAMInputUnitPrefix = getPrefix(avg);
            $scope.RAMInput = Number(getPrefixedNumber(avg));
        });
    };
});

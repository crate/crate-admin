'use strict';

// storage is measured in Bytes
// time is measured in hours

angular.module('calculator', ['sql', 'translation']).controller('CalculatorController', function($scope, SQLQuery, queryResultToObjects) {
    $scope.diskLoadFactor = 0.85;
    $scope.maxRAMPerNode = 64000000000; //64G
    $scope.RAMInput = 64;
    $scope.RAMInputUnitPrefix = 'Giga';
    $scope.hideGCHint = true;
    $scope.sizeFactor = 0.732; //from haudi's document
    $scope.maxShardSize = 32000000000; //32G, compromise from haudi's and andrei's opinions
    $scope.maxShards = 1000;
    $scope.CPUCoresPerNode = 2;
    $scope.RAMStorageProportion = 24;
    $scope.dataType = 'perTime';
    $scope.dataInsertedPerTime = 20;
    $scope.expectedTableSize = 2;
    $scope.expectedTableSizeUnitPrefix = 'Terra';
    $scope.dataInsertedPerTimeUnitPrefix = 'Giga';
    $scope.dataInsertedPerTimeTemporalUnit = 'day';
    $scope.expectedTableSize = 10;
    $scope.keepTimeTemporalUnit = 'month';
    $scope.keepTime = 6;
    $scope.partitionSize = 1;
    $scope.partitionSizeTemporalUnit = 'month';
    $scope.manualPartitionCount = 4;
    $scope.replicas = 1;
    $scope.tables = ["table1", "table2"];
    $scope.selectSchema = "none";
    $scope.selectTable = "none";
    $scope.selected = "none";

    $scope.selectedRAM = function (){
        var r = $scope.RAMInput * $scope.prefix($scope.RAMInputUnitPrefix);
        $scope.hideGCHint = r <= $scope.maxRAMPerNode;
        console.log("hideGCHint: " + $scope.hideGCHint);
        return r;
    };
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
        var res = Math.ceil(($scope.neededDiskSpace() / $scope.RAMStorageProportion) / $scope.selectedRAM());
        console.log("neededNodes: " + res);
        return res;
    };
    $scope.partitions = function () {
        var res = 1;
        if ($scope.dataType === 'perTime') {
            res = (($scope.keepTime * $scope.temporalUnit($scope.keepTimeTemporalUnit)) / ($scope.partitionSize * $scope.temporalUnit($scope.partitionSizeTemporalUnit)));
        } else if ($scope.dataType === 'absolute') {
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
        var res = $scope.bytesToPrintableString($scope.selectedRAM(), 0);
        console.log("ramString: " + res);
        return res;
    };
    $scope.storageString = function () {
        if ($scope.neededNodes()!==0){
            return $scope.bytesToPrintableString(Math.round(Number($scope.neededDiskSpace()) / Number($scope.neededNodes())), 2);
        }
        else{
            return 0;
        }
    };
    $scope.bytesToPrintableString = function (b, decimals) {
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
        $scope.loadCPUCores($scope.selectSchema, $scope.selectTable);
        $scope.loadTablesize($scope.selectSchema, $scope.selectTable);
        $scope.loadPartition($scope.selectSchema, $scope.selectTable);
        $scope.loadReplica($scope.selectSchema, $scope.selectTable);
        $scope.loadRAMStoragePropotion();
        $scope.loadRAM();
    };
    $scope.loadCPUCores = function (schemaName, tableName) {
        var stmt = "SELECT os_info['available_processors']\n" +
            "FROM sys.nodes limit 100;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            $scope.CPUCoresPerNode = (query.rows[0])[0]; //we get a 2d array returned
        });
        console.log("queried cpu cores per node: " + $scope.CPUCoresPerNode);
    };

    $scope.loadTablesize = function(schemaName, tableName) {
        var stmt = "select sum(size) from sys.shards where schema_name = '" + schemaName
            + "'and table_name = '"+tableName+"' and primary=true;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            if ((query.rows[0])[0]==null){
                $scope.expectedTableSize = 0;
                $scope.expectedTableSizeUnitPrefix = '1';
                $scope.dataType = 'absolute';
                return;
            }
            var size = (query.rows[0])[0];
            $scope.expectedTableSize = Number($scope.getPrefixedNumber(size));
            $scope.expectedTableSizeUnitPrefix = $scope.getPrefix(size);
            $scope.dataType = 'absolute';
        });
    };

    $scope.loadPartition = function(schemaName, tableName) {
        var stmt = "select   partitioned_by from information_schema.tables where table_schema = '"
            +schemaName+"' and table_name = '"+tableName+"';";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            if((query.rows[0])[0]!=null){
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

    $scope.loadReplica = function(schemaName, tableName) {
        var rep = "";
        var stmt = "SELECT number_of_replicas FROM information_schema.tables WHERE table_schema='"
            +schemaName+"' and table_name = '"+tableName+"';";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            rep = (query.rows[0])[0];
            console.log("^^^^^^^^^^^^^^^^^ "+ $scope.replicas);
            if(rep.includes("-") === true){
                rep = rep.split("-")[1];
                console.log("^^^^^^^^^^^^^^^^^ "+ $scope.replicas);
                stmt = "SELECT COUNT(*) FROM sys.nodes";
                SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
                    console.log("^^^^^^^^^^^^^^^^^ "+ (query.rows[0])[0]);
                    if (rep ==="all"){
                        console.log("^^^^^^^^^^^^^^^^^ in all "+ (query.rows[0])[0]);
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

    $scope.loadRAMStoragePropotion = function() {
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

    $scope.getPrefix = function(x){
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

    $scope.getPrefixedNumber = function(x){
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

    $scope.loadRAM = function () {
        var stmt = "SELECT (heap['used']+heap['free']) AS total_ram FROM sys.nodes;";
        SQLQuery.execute(stmt, {}, false, false, false, false).then(function (query) {
            var sum = 0;
            for(var i = 0; i < query.rows.length; i++){
                sum += query.rows[i];
            }
            var avg = Math.round(sum / query.rows.length);
            $scope.RAMInputUnitPrefix = $scope.getPrefix(avg);
            $scope.RAMInput = Number($scope.getPrefixedNumber(avg));
        });
    };
});

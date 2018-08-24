'use strict';

angular.module('testing', ['sql', 'translation']).controller('testingController', function($scope, $window, SQLQuery, queryResultToObjects) {
    
    $scope.selectedSchema = "";
    $scope.selectedTable = "";
    var flag1 = "0";
    $scope.getschema = function() {
        if (flag1=="0"){
            var stmt = 'select schema_name from information_schema.schemata order by schema_name;'
            var cols = ['schema_name'];
            var obj = [];
            SQLQuery.execute(stmt, {}, false, false, false, false)
                .then(function (query) {
                    $scope.sqlresult = queryResultToObjects(query, cols);
                })
            for(var i=0; i<$scope.sqlresult.length; i++) {
    		    obj.push($scope.sqlresult[i].schema_name);
    		}
    		$scope.schemaList = obj;
            flag1="1";
        }
    };
    var flag2 = "0";
    $scope.getTablename = function(num1) {
        if (flag2=="0" || num1 =="1"){
            var stmt = "SELECT table_name FROM information_schema.tables WHERE table_schema ='"+$scope.selectedSchema+"';";
            var cols = ['table_name'];
            var obj = [];
            SQLQuery.execute(stmt, {}, false, false, false, false)
                .then(function (query) {
                    $scope.sqlresult2 = queryResultToObjects(query, cols);
                })
            for(var i=0; i<$scope.sqlresult2.length; i++) {
                obj.push($scope.sqlresult2[i].table_name);
            }
            $scope.tableList = obj;
            flag2="1";
        }
    };

});
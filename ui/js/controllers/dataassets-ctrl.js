/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('DataAssetsCtrl', ['$scope', '$http', '$config', '$location', 'toaster', '$timeout', '$route', '$filter', function ($scope, $http, $config, $location, toaster, $timeout, $route, $filter) {

      var allDataassets = $config.uri.dataassetlist;
      var ts = null;
      var start = 0;
      var number = 10;
      var originalRowCollection = undefined;

      $scope.isIE = function() {
            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");
            if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)){
               return true; 
            }
            else {
               return false;
            }
        }

      $scope.paging = function(tableState){
        console.log(tableState);
        ts = tableState;
        // tableState.pagination.numberOfPages = $scope.rowCollection.length/10 + 1;
        start = tableState.pagination.start || 0;
        number = tableState.pagination.number || 10;

        if(start == 0 && !$scope.rowCollection){
          $http.get(allDataassets,{cache: true}).then(function successCallback(data) {
            originalRowCollection = new Array();
            angular.forEach(data.data,function(db){
              angular.forEach(db,function(table){
                originalRowCollection.push(table);
              });
            });

            $scope.rowCollection = angular.copy(originalRowCollection);

            $scope.displayed = $scope.rowCollection.slice(start, start+number);
            tableState.pagination.numberOfPages = Math.ceil($scope.rowCollection.length/number);
          },function errorCallback(data){
            console.log(data);
            toaster.pop('error','Get data assets failed',data.data.message);
          });
        }else{
          $scope.displayed = $scope.rowCollection.slice(start, start+number);
        }
      }

      var include = function(keyword, str) {
        if(keyword == undefined || keyword == null){
          return true;
        } else if(str == undefined || str == null){
          return false;
        } else{
          var value = keyword.trim().toLowerCase();
          return str.trim().toLowerCase().includes(value);
        }
      };

      var findValue = function(keyword, assetItem) {
        var date = $filter('date')(assetItem.timestamp, 'M/d/yy h:mm a')
        return include(keyword, assetItem.assetName)
          || include(keyword, assetItem.assetType)
          || include(keyword, assetItem.owner)
          || include(keyword, assetItem.system)
          || include(keyword, assetItem.assetHDFSPath)
          || include(keyword, date);
      };

      $scope.$watch('keyword', function(newValue){
        if(originalRowCollection){
          start = 0;
          if(newValue == undefined || newValue == ''){
            $scope.rowCollection = angular.copy(originalRowCollection);
          }else{
            var result = [];
            for (var i = 0; i < originalRowCollection.length; i++) {
              var item = originalRowCollection[i];
              if(findValue(newValue, item)){
                result.push(item);
              }
            };
            $scope.rowCollection = angular.copy(result);
          }
          $scope.displayed = $scope.rowCollection.slice(start, start+number);
          ts.pagination.numberOfPages = Math.ceil($scope.rowCollection.length/number);
        }
      });

		$scope.remove = function(row) {
			$scope.selectedRow = row;
			$('#confirm-delete').modal('show');

		};

		$scope.sendDeleteRequest = function() {
			$http.delete($config.uri.deletedataasset+'/'+$scope.selectedRow._id).then(function successCallback(data){

					$('#confirm-delete').modal('hide');
          var index = $scope.rowCollection.indexOf($scope.selectedRow);
          $scope.rowCollection.splice(index, 1);

          index = $scope.displayed.indexOf($scope.selectedRow);
          $scope.displayed.splice(index, 1);

			// }).error(function(data, status){
   //      toaster.pop('error', 'Error when deleting record', data);
   //    });
            },function errorCallback(response) {
               toaster.pop('error', 'Error when deleting record', response.message);
       });


		}

    $scope.$on('$viewContentLoaded', function() {
        $scope.$emit('initReq');
    });

  }]);


});

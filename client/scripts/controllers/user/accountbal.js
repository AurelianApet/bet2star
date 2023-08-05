'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
  .controller('AccountBalCtrl', function ($rootScope, $scope, $position, UserInfo_service, $interval, $http, Server_api_url) {

    UserInfo_service.checkUrl();

    $('#heading').text("User Account Bal Dashboard");
    UserInfo_service.setHeading("User Account Bal Dashboard");

	var data = $.param({ user_id: UserInfo_service.getUserId()});
    $http.post(Server_api_url + 'user/user_wallet', data, UserInfo_service.http_config)
    .success(function (data, status, headers, config) {
      $scope.wallet = data.user_wallet;
    });
    
  });

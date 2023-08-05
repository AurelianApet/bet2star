'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
  .controller('OnlineSales', function ($rootScope, $scope, $position, UserInfo_service, $interval, $http, Server_api_url) {

    UserInfo_service.checkUrl();

    $('#heading').text("Admin Online Users Sales Dashboard");
    UserInfo_service.setHeading("Admin Online Users Sales Dashboard");

    $http.post(Server_api_url + 'setting/get_setting', {}, UserInfo_service.http_config)
    .success(function (data, status, headers, config) {
      if (data.result == 1) {
        var week_no = data.setting.current_week;

        var all_weeks = data.all_weeks;
        var data = $.param({week_no : data.setting.current_week});
        $http.post(Server_api_url + 'bet/summary_user', data, UserInfo_service.http_config)
        .success(function (data, status, headers, config) {
          $rootScope.usersummary = data.user_summary;
        });

        $http.post(Server_api_url + 'bet/summary_online', $.param({}), UserInfo_service.http_config)
        .success(function (data, status, headers, config) {
          $rootScope.onlinesummary = data.onlinesummary;
        });
      }
    });

  });

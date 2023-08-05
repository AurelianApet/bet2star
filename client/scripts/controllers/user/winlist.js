'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
  .controller('WinListCtrl', function ($rootScope, $scope, $position, UserInfo_service, $interval, $http, Server_api_url) {

    UserInfo_service.checkUrl();

    $('#heading').text("User Win List Dashboard");
    UserInfo_service.setHeading("User Win List Dashboard");

    $http.post(Server_api_url + 'setting/get_setting', data, UserInfo_service.http_config)
    .success(function (data, status, headers, config) {
      if (data.result == 1) {
        var data = $.param({week: data.setting.current_week, player_id: UserInfo_service.getId(), status: 'Active'});
        $http.post(Server_api_url + 'bet/bet_all', data, UserInfo_service.http_config)
        .success(function (data, status, headers, config) {
          if (data.result == 1) {
            var usersummary = {
                options : [],
                sales: [],
                total_sales: 0,
                win: [],
                total_win: 0,
                status: "",
                bal_agent: 0,
                bal_company: 0,
              };

              for (var i = 0; i < data.requests.length; i ++) {
                var index = usersummary.options.findIndex(function (elem) {
                  return elem == data.requests[i].option;
                });

                if (index == -1) {
                  usersummary.options.push(data.requests[i].option);
                  usersummary.sales.push(0);
                  usersummary.win.push(0);
                  index = usersummary.options.length - 1;
                }

                usersummary.sales[index] += data.requests[i].stake_amount;
                usersummary.total_sales += data.requests[i].stake_amount;
                usersummary.win[index] += data.requests[i].won_amount;
                usersummary.total_win += data.requests[i].won_amount;
              }

              if (usersummary.total_sales > usersummary.total_win) {
                usersummary.bal_company = usersummary.total_sales - usersummary.total_win;
                usersummary.status = "green";
              }
              else {
                usersummary.bal_agent = usersummary.total_win - usersummary.total_sales;
                usersummary.status = "red";
              }

              $rootScope.usersummary = usersummary;
            }
          });
        }
      });

    var data = $.param({ win_result: "Win", player_id: UserInfo_service.getId()});

    $http.post(Server_api_url + 'bet/bet_all', data, UserInfo_service.http_config)
    .success(function (data, status, headers, config) {
      for (var i = 0; i < data.requests.length; i++) {
        var gamelist = [];
        if (data.requests[i].type == 'Group') {
          for (var j = 0; j < data.requests[i].gamelist.length; j++)
            gamelist.push(data.requests[i].gamelist[j].under + '(' + data.requests[i].gamelist[j].list.toLocaleString() + ')');
        }
        else
          gamelist = data.requests[i].gamelist;
        data.requests[i].gamelist = gamelist.toLocaleString();
        data.requests[i].bet_time = new Date(data.requests[i].bet_time).toLocaleString('SV',{
          timeZone: "Africa/Lagos"
        })
        var scorelist = [];
        if (data.requests[i].type == 'Group') {
          for (var j = 0; j < data.requests[i].scorelist.length; j++)
            scorelist.push(data.requests[i].scorelist[j].under + '(' + data.requests[i].scorelist[j].list.toLocaleString() + ')');
        }
        else
          scorelist = data.requests[i].scorelist;
        data.requests[i].scorelist = scorelist.toLocaleString();
      }
      $rootScope.betsummary = data.requests;
    });


  });

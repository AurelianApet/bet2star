'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
  .controller('BetResultsCtrl', function ($rootScope, $scope, $position, UserInfo_service, $interval, $http, Server_api_url) {

    UserInfo_service.checkUrl();

    $('#heading').text("Staff Result Summary");
    UserInfo_service.setHeading("Staff Result Summary");

    $rootScope.filter_betstatus = 'Active';

    var data = $.param({ user_role: 'agent', user_staff: UserInfo_service.getUser()._id });
    $http.post(Server_api_url + 'user/user_all', data, UserInfo_service.http_config)
      .success(function (agentdata, status, headers, config) {

        var filter = [];

        for (var i = 0; i < agentdata.users.length; i++) {
          filter.push({ agent_id: agentdata.users[i]._id });
        }

        var data = $.param({ $or: filter });

        $http.post(Server_api_url + 'bet/summary_total', data, UserInfo_service.http_config)
          .success(function (data, status, headers, config) {
            $rootScope.totalsummary = data.total_summary;
          });

        $http.post(Server_api_url + 'bet/summary_agent', data, UserInfo_service.http_config)
          .success(function (data, status, headers, config) {
            $rootScope.agentsummary = data.agent_summary;
          });

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
      })

    // var gamelist = ["1,2,3,4,5", "1,2,3,4", "2,3,4,5", "3,4,5,6", "1,2,3,5"];
    // var winresult = ["Loss", "Win", "Win"];

    // $rootScope.betsummary = [];
    // for (var i = 1; i < 100; i++) {
    //   var amt = Math.floor(Math.random() * 1000);
    //   var won_amount = Math.floor(Math.random() * 10000);
    //   var win = Math.floor(Math.random() * 2);

    //   $rootScope.betsummary.push({
    //     no: i,
    //     bet_id: 111 + i + 14,
    //     player: 'Player1',
    //     option: '100-1',
    //     under: 'U3',
    //     week: 10 + i % 5,
    //     amt: amt,
    //     game_list: gamelist[Math.floor(Math.random() * 4)],
    //     score_list: '1,2',
    //     apl: 100,
    //     status: 'Active',
    //     win_result: winresult[win],
    //     won_amount: win ? won_amount : 0,
    //     tsn: 12234 + i,
    //     terminal: 'Terminal ' + (i % 4 + 1),
    //     agent: 'Agent 1',
    //     bet_time: '2018/5/4 12:30:21',
    //     repeat: i,
    //     // won_amount_1: won_amount,
    //     // amt_2: amt,
    //   });
    // }

  });

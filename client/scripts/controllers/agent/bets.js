'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
  .controller('BetsCtrl', function ($rootScope, $scope, $position, UserInfo_service, $interval, Server_api_url, $http) {

	UserInfo_service.checkUrl();

	$('#heading').text("Agent Bets Dashboard");
	UserInfo_service.setHeading("Agent Bets Dashboard");

	var data = $.param({ agent_id: UserInfo_service.getUser()._id });

	$http.post(Server_api_url + 'bet/bet_all', data, UserInfo_service.http_config)
	  .success(function (data, status, headers, config) {
		for (var i = 0; i < data.requests.length; i++) {
		  var gamelist = [];
		  if (data.requests[i].type == "Nap/Perm")
			gamelist = data.requests[i].gamelist;
		  else {
			for (var j = 0; j < data.requests[i].gamelist.length; j++)
			  gamelist.push(data.requests[i].gamelist[j].under + '(' + data.requests[i].gamelist[j].list.toLocaleString() + ')');
		  }
		  data.requests[i].gamelist = gamelist.toLocaleString();
		  data.requests[i].bet_time = new Date(data.requests[i].bet_time).toLocaleString('SV',{
            timeZone: "Africa/Lagos"
          })
		  var scorelist = [];
		  if (data.requests[i].type == "Nap/Perm")
			scorelist = data.requests[i].scorelist;
		  else {
			for (var j = 0; j < data.requests[i].scorelist.length; j++)
			  scorelist.push(data.requests[i].scorelist[j].under + '(' + data.requests[i].scorelist[j].list.toLocaleString() + ')');
		  }
		  data.requests[i].scorelist = scorelist.toLocaleString();
		}
		$rootScope.betsummary = data.requests;
	  });


  });

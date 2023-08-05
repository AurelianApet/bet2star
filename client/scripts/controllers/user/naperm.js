'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
	.controller('NapermGameCtrl', function ($rootScope, $scope, $position, UserInfo_service, $interval, $http, Server_api_url) {

		UserInfo_service.checkUrl();

		$('#heading').text("Welcome " + UserInfo_service.getUserName());
		UserInfo_service.setHeading("Welcome " + UserInfo_service.getUserName());

		var data = $.param({ _id: UserInfo_service.getId()});
		$http.post(Server_api_url + 'user/user_wallet', data, UserInfo_service.http_config)
		.success(function (data, status, headers, config) {
			$scope.wallet = data.user_wallet;

			var userinfo = UserInfo_service.getUser();
			userinfo.user_wallet = $scope.wallet;
			UserInfo_service.setUser(userinfo);
			var options = data.user_options;
			$http.post(Server_api_url + 'setting/get_setting', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {

				if (data.result == 1) {
					var temp = []; 
					var k = 0;
					for(var i = 0 ; i < data.cur_week.options.length ; i++)
					{
						for(var j = 0 ; j < options.length ; j++)
						{
							if(data.cur_week.options[i].status == "true" && options[j].status == "true")
							{
								if(options[j].name == data.cur_week.options[i].name)
								{
									temp[k] = options[j];
									k++;
								}
							}
						}
					}
					data.cur_week.options = temp;
					$scope.cur_week = data.cur_week;
					$scope.odd = $scope.cur_week.options[0].name;
					$scope.close_at = new Date(data.cur_week.close_at);
					$scope.validity = new Date(data.cur_week.validity);
				}
			});
		});

		var data = $.param({ status: true });
		$http.post(Server_api_url + 'game/game_all', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {
				function compare(a, b) {
					if (a.game_no < b.game_no)
						return -1;

					return a.game_no > b.game_no;
				}
				data.requests.sort(compare);
				$scope.games = data.requests;
				$scope.option = "";
			});

		var data = $.param({});

		$scope.data = [];
		$scope.under = [false, false, false, true, false, false, false];
		$scope.groupCnt = 1;
		$scope.unders = [3, 4, 5, 6];
		$scope.groups = ["A", "B", "C", "D", "E", "F"];
		$scope.groupVals = [0, 0, 0, 0, 0, 0];
		$scope.gameString = "";
		$scope.gameliststr = [];
		$scope.gameType = "Nap/Perm";
		$scope.groupUnder = 3;
		$scope.selectcnt = 0;
		$scope.odd = "";
		$scope.stake_amount = "";
		$scope.ticket_no = "";

		var gamelist = [];

		var currentGroup = "group1";
		var currentGroupIndex = 0;

		for (var i = 1; i < 50; i++)
			$scope.data[i] = "";


		$interval(function () {
			var data = $.param({ status: true });
			$http.post(Server_api_url + 'game/game_all', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {
				function compare(a, b) {
					if (a.game_no < b.game_no)
						return -1;

					return a.game_no > b.game_no;
				}
				data.requests.sort(compare);
				$scope.games = data.requests;

				var data = $.param({ _id: UserInfo_service.getId()});
				$http.post(Server_api_url + 'user/user_wallet', data, UserInfo_service.http_config)
				.success(function (data, status, headers, config) {
					var options = data.user_options;

					var data = $.param({});

					$http.post(Server_api_url + 'setting/get_setting', data, UserInfo_service.http_config)
					.success(function (data, status, headers, config) {
						if (data.result == 1) {
							$scope.cur_week = data.cur_week;
							
							var temp = []; 
							var k = 0;
							for(var i = 0 ; i < data.cur_week.options.length ; i++)
							{
								for(var j = 0 ; j < options.length ; j++)
								{
									if(data.cur_week.options[i].status == "true" && options[j].status == "true")
									{
										if(options[j].name == data.cur_week.options[i].name)
										{
											temp[k] = options[j];
											k++;
										}
									}
								}
							}

							data.cur_week.options = temp;
							$scope.cur_week = data.cur_week;							

							if($scope.odd != '')
							{
								var index = $scope.cur_week.options.findIndex(function (elem) { return elem.name == $scope.odd; })
								if(index == -1)
									$scope.odd = '';
								else
									$scope.odd = $scope.cur_week.options[0].name;
							}
							else
								$scope.odd = $scope.cur_week.options[0].name;
							
							$scope.close_at = new Date(data.cur_week.close_at);
							$scope.validity = new Date(data.cur_week.validity);

							for (var i = 0; i < 50; i++) {
								if ($scope.data[i] != '')
								{
									var index = $scope.games.findIndex(function (elem) { return parseInt(elem.game_no) == i; })
									if(index == -1)
										$scope.data[i] = "";
								}
							}
							makeString();
						}
					});
				});			

				
			});
		}, 120000);

		$scope.onSelectGroup = function (groupIndex) {
			currentGroup = "group" + (groupIndex + 1);
			currentGroupIndex = groupIndex;
		}

		var makeString = function () {

			var totalGroupValue = 0;
			var retValue = 1;

			$scope.gameString = "";
			$scope.gameliststr = [];


			for (var i = 0; i < $scope.groupCnt; i++) {
				totalGroupValue += $scope.groupVals[i];
			}

			var maxunder = 0;

			if ($scope.gameType == "Nap/Perm") {
				for (var j = 6; j >= 3; j--) {
					if ($scope.under[j])
						break;
				}
				if (j < 3) {
					alert("Select Under");
					return -1;
				}
				maxunder = j;
			}
			else {
				maxunder = $scope.groupUnder;
			}

			if (totalGroupValue > maxunder) {
				alert("Select Group Value Correctly");
				return -2;
			}

			gamelist = [];

			if ($scope.gameType == "Nap/Perm") {
				var underlist = [];

				for (var i = 3; i <= 6; i++) {
					if ($scope.under[i])
						underlist.push(i);
				}

				for (var i = 0; i < 50; i++) {
					if ($scope.data[i] == 'group1')
						gamelist.push(i);
				}

				if (gamelist.length == 0) {
					return -3;
				}

				if (maxunder > gamelist.length) {
					retValue = -4;
				}

				$scope.gameString = underlist.toString() + " From " + gamelist.toString();
				$scope.gameliststr = [$scope.gameString];
			}
			else {
				var gameliststr = [];

				for (var i = 0; i < $scope.groupCnt; i++) {
					var sublist = [];
					for (var j = 0; j < 50; j++) {
						if ($scope.data[j] == 'group' + (i + 1))
							sublist.push(j);
					}

					if (sublist.length != 0 && $scope.groupVals[i] > 0) {
						gameliststr.push($scope.groups[i] + ':' + $scope.groupVals[i] + '(' + sublist.toString() + ')');
						gamelist.push({ under: $scope.groupVals[i], list: sublist });
					}

					if ($scope.groupVals[i] > sublist.length)
						retValue = -5;
				}

				$scope.gameString = gameliststr.toString();
				$scope.gameliststr = gameliststr;

				if (gameliststr.length == $scope.groupCnt && totalGroupValue < maxunder)
					$scope.groupCnt++;

				if (totalGroupValue != maxunder)
					retValue = -6;
			}
			return retValue;
		}

		$scope.onChangeOdd = function (oddname) {
			$scope.odd = oddname;
		}

		$scope.onChangeUnder = function (undername) {
			if ($scope.gameType == "Group") {
				$scope.groupUnder = undername;
			}
			makeString();
		}

		$scope.toggleMatch = function (id) {
			if ($scope.data[id] == "") {
				if ($scope.gameType == "Nap/Perm" || $scope.groupVals[currentGroupIndex] > 0)
					$scope.data[id] = currentGroup;
			}
			else {
				$scope.data[id] = "";
			}
			makeString();			
		}

		$scope.onChangeGroupVal = function (id) {
			makeString();
		}

		$scope.onChangeGameType = function () {
			if ($scope.gameType == "Nap/Perm") {
				$scope.under = [false, false, false, true, false, false, false];
			}
			else {
				$scope.groupUnder = 3;
				$scope.groupCnt = 1;
				$scope.groupVals = [0, 0, 0, 0, 0, 0];
			}
			for (var i = 1; i < 50; i++)
				$scope.data[i] = "";
			$scope.gameString = "";
			$scope.gameliststr = [];
		}

		$scope.onStake = function () {

			var data = $.param({ status: true });
			$http.post(Server_api_url + 'game/game_all', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {
				function compare(a, b) {
					if (a.game_no < b.game_no)
						return -1;

					return a.game_no > b.game_no;
				}
				data.requests.sort(compare);
				$scope.games = data.requests;

				for (var i = 0; i < 50; i++) {
					if ($scope.data[i] != '')
					{
						var index = $scope.games.findIndex(function (elem) { return parseInt(elem.game_no) == i; })
						if(index == -1)
							$scope.data[i] = "";
					}
				}
				
				var data = $.param({ user_id: UserInfo_service.getUserId()});
				$http.post(Server_api_url + 'user/user_wallet', data, UserInfo_service.http_config)
				.success(function (data, status, headers, config) {
					var options = data.user_options;
					$http.post(Server_api_url + 'setting/get_setting', $.param({}), UserInfo_service.http_config)
					.success(function (data_stake, status, headers, config) {

						$scope.cur_week = data_stake.cur_week;
							
						var temp = []; 
						var k = 0;
						for(var i = 0 ; i < data_stake.cur_week.options.length ; i++)
						{
							for(var j = 0 ; j < options.length ; j++)
							{
								if(data_stake.cur_week.options[i].status == "true" && options[j].status == "true")
								{
									if(options[j].name == data_stake.cur_week.options[i].name)
									{
										temp[k] = options[j];
										k++;
									}
								}
							}
						}
						data_stake.cur_week.options = temp;
						$scope.cur_week = data_stake.cur_week;
						if($scope.odd != '')
						{
							var index = $scope.cur_week.options.findIndex(function (elem) { return elem.name == $scope.odd; })
							if(index == -1)
								$scope.odd = '';
						}
						
						$scope.close_at = new Date(data_stake.cur_week.close_at);
						$scope.validity = new Date(data_stake.cur_week.validity);

						var retValue = makeString();

						switch (retValue) {
							case -1:
								return;
							case -2:
								return;
							case -3:
								alert("Select Matches");
								return;
							case -4:
								alert("Select Matches More");
								return;
							case -5:
								alert("Select Matches More");
								return;
							case -6:
								alert("Sum of Group Values must be " + $scope.groupUnder);
								return;
						}

						if (makeString() == false) {
							alert("Select Matches Correctly");
							return;
						}

						if ($scope.odd == "") {
							alert("Select Odd");
							return;
						}

						if ($scope.stake_amount == "" || $scope.stake_amount == 0) {
							alert("Input Stake Amount");
							return;
						}

						if ($scope.stake_amount > $scope.wallet) {
							alert("Wallet is not enough");
							return;
						}

						var _id = UserInfo_service.getId();
						var unders = [];

						if ($scope.gameType == "Nap/Perm") {
							for (var i = 3; i <= 6; i++) {
								if ($scope.under[i])
									unders.push(i);
							}
						}
						else if ($scope.gameType == "Group") {
							unders.push($scope.groupUnder);
						}

						$scope.ticket_no = UserInfo_service.getUserId() + Math.floor(Math.random() * 9000000 + 1000000);

						var data = $.param({
							player_id: _id,
							type: $scope.gameType,
							under: unders,
							gamelist: gamelist,
							stake_amount: $scope.stake_amount,
							option: $scope.odd,
							ticket_no: $scope.ticket_no,
						});

						$scope.understr = "Under" + unders.toString();
						var max_stake = 0;
						var min_stake = 0;
						if (data_stake.result == 1) {
							

							max_stake = data_stake.cur_week.max_stake;
							min_stake = data_stake.cur_week.min_stake;

							if(min_stake <= $scope.stake_amount && $scope.stake_amount <= max_stake){
								$http.post(Server_api_url + 'bet/bet_add', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										alert("Success");
										$scope.resultBet = data.bet;
										$scope.bet_time = new Date(data.bet.bet_time);

										var userinfo = UserInfo_service.getUser();
										userinfo.user_wallet -= $scope.stake_amount;

										UserInfo_service.setUser(userinfo);

									}
									else {
										alert(data.message);
									}							

									$scope.data = [];
									$scope.under = [false, false, false, true, false, false, false];
									$scope.groupCnt = 1;
									$scope.unders = [3, 4, 5, 6];
									$scope.groups = ["A", "B", "C", "D", "E", "F"];
									$scope.groupVals = [0, 0, 0, 0, 0, 0];
									$scope.gameString = "";
									$scope.gameliststr = [];
									$scope.gameType = "Nap/Perm";
									$scope.groupUnder = 3;
									$scope.selectcnt = 0;
									$scope.odd = $scope.cur_week.options[0].name;
									$scope.stake_amount = "";
									$scope.ticket_no = "";
								});
							}
							else{
								alert('Stake amount invalid');
				        		return;
							}
						}
					});
				});
					
			});
			
		}
		$scope.onPrint = function () {
			var data = $.param({ status: true });
			$http.post(Server_api_url + 'game/game_all', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {
				function compare(a, b) {
					if (a.game_no < b.game_no)
						return -1;

					return a.game_no > b.game_no;
				}
				data.requests.sort(compare);
				$scope.games = data.requests;

				for (var i = 0; i < 50; i++) {
					if ($scope.data[i] != '')
					{
						var index = $scope.games.findIndex(function (elem) { return parseInt(elem.game_no) == i; })
						if(index == -1)
							$scope.data[i] = "";
					}
				}
				
				var data = $.param({ user_id: UserInfo_service.getUserId()});
				$http.post(Server_api_url + 'user/user_wallet', data, UserInfo_service.http_config)
				.success(function (data, status, headers, config) {
					var options = data.user_options;
					$http.post(Server_api_url + 'setting/get_setting', $.param({}), UserInfo_service.http_config)
					.success(function (data_stake, status, headers, config) {

						$scope.cur_week = data_stake.cur_week;
							
						var temp = []; 
						var k = 0;
						for(var i = 0 ; i < data_stake.cur_week.options.length ; i++)
						{
							for(var j = 0 ; j < options.length ; j++)
							{
								if(data_stake.cur_week.options[i].status == "true" && options[j].status == "true")
								{
									if(options[j].name == data_stake.cur_week.options[i].name)
									{
										temp[k] = options[j];
										k++;
									}
								}
							}
						}
						data_stake.cur_week.options = temp;
						$scope.cur_week = data_stake.cur_week;
						if($scope.odd != '')
						{
							var index = $scope.cur_week.options.findIndex(function (elem) { return elem.name == $scope.odd; })
							if(index == -1)
								$scope.odd = '';
						}
						
						$scope.close_at = new Date(data_stake.cur_week.close_at);
						$scope.validity = new Date(data_stake.cur_week.validity);


						var retValue = makeString();

						switch (retValue) {
							case -1:
								return;
							case -2:
								return;
							case -3:
								alert("Select Matches");
								return;
							case -4:
								alert("Select Matches More");
								return;
							case -5:
								alert("Select Matches More");
								return;
							case -6:
								alert("Sum of Group Values must be " + $scope.groupUnder);
								return;
						}

						if (makeString() == false) {
							alert("Select Matches Correctly");
							return;
						}

						if ($scope.odd == "") {
							alert("Select Odd");
							return;
						}

						if ($scope.stake_amount == "" || $scope.stake_amount == 0) {
							alert("Input Stake Amount");
							return;
						}

						if ($scope.stake_amount > $scope.wallet) {
							alert("Wallet is not enough");
							return;
						}

						var _id = UserInfo_service.getId();
						var unders = [];

						if ($scope.gameType == "Nap/Perm") {
							for (var i = 3; i <= 6; i++) {
								if ($scope.under[i])
									unders.push(i);
							}
						}
						else if ($scope.gameType == "Group") {
							unders.push($scope.groupUnder);
						}

						$scope.ticket_no = UserInfo_service.getUserId() + Math.floor(Math.random() * 9000000 + 1000000);

						var data = $.param({
							player_id: _id,
							type: $scope.gameType,
							under: unders,
							gamelist: gamelist,
							stake_amount: $scope.stake_amount,
							option: $scope.odd,
							ticket_no: $scope.ticket_no,
						});

						$scope.understr = "Under" + unders.toString();

						var max_stake = 0;
						var min_stake = 0;
						if (data_stake.result == 1) {
							max_stake = data_stake.cur_week.max_stake;
							min_stake = data_stake.cur_week.min_stake;

							if(min_stake <= $scope.stake_amount && $scope.stake_amount <= max_stake){
								$http.post(Server_api_url + 'bet/bet_add', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										alert("Success");
										$scope.resultBet = data.bet;
										$scope.bet_time = new Date(data.bet.bet_time);

										var userinfo = UserInfo_service.getUser();
										userinfo.user_wallet -= $scope.stake_amount;

										UserInfo_service.setUser(userinfo);

										var timer = $interval(function () {
											document.body.innerHTML = document.getElementById('printableArea').innerHTML;

											window.print();

											window.location.reload();
											$interval.cancel(timer);
											$scope.data = [];
											$scope.under = [false, false, false, true, false, false, false];
											$scope.groupCnt = 1;
											$scope.unders = [3, 4, 5, 6];
											$scope.groups = ["A", "B", "C", "D", "E", "F"];
											$scope.groupVals = [0, 0, 0, 0, 0, 0];
											$scope.gameString = "";
											$scope.gameliststr = [];
											$scope.gameType = "Nap/Perm";
											$scope.groupUnder = 3;
											$scope.selectcnt = 0;
											$scope.odd = $scope.cur_week.options[0].name;
											$scope.stake_amount = "1000";
											$scope.ticket_no = "";
										}, 100);

									}
									else {
										alert(data.message);
										$scope.data = [];
										$scope.under = [false, false, false, true, false, false, false];
										$scope.groupCnt = 1;
										$scope.unders = [3, 4, 5, 6];
										$scope.groups = ["A", "B", "C", "D", "E", "F"];
										$scope.groupVals = [0, 0, 0, 0, 0, 0];
										$scope.gameString = "";
										$scope.gameliststr = [];
										$scope.gameType = "Nap/Perm";
										$scope.groupUnder = 3;
										$scope.selectcnt = 0;
										$scope.odd = $scope.cur_week.options[0].name;
										$scope.stake_amount = "1000";
										$scope.ticket_no = "";
									}
								})
							}else{
								alert('stake amount is greater than max stake');
				        		return;
							}
						}
					});
				});
			});
		}
	});

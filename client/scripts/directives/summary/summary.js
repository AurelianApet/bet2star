'use strict';

/**
 * @ngdoc directive
 * @name izzyposWebApp.directive:adminPosHeader
 * @description
 * # adminPosHeader
 */
angular.module('betting')
	.directive('summary', function () {
		return {
			templateUrl: 'scripts/directives/summary/summary.html',
			restrict: 'E',
			replace: true,
			scope: {
				'title': '@',
				'filtertype': '@',
				'totalsummary': '@',
				'usersummary': '@',
				'agentsummary': '@',
				'staffsummary': '@',
				'terminalsummary': '@',
				'betsummary': '@',
				'winlist': '@',
				'onlinesummary': '@',
				'removescorelist': '@',
				'samebetrepeatasc': '@',
				'voidenable': '@',
				'statushide': '@',
				'weeklyreport': '@',
			},
			controller: function ($scope, UserInfo_service, $state, $interval, $location, $rootScope, Server_api_url, $http) {

				$scope.filtershow = [
					[false, false, false, false, false, false, false, false, false, false],
					[true, true, true, true, true, true, true, true, true, false],
					[true, true, true, true, true, true, false, true, false, false],
					[true, false, false, false, false, false, true, false, false, false],
					[true, true, true, true, true, true, true, true, true, true],
					[true, true, true, true, true, true, false, false, false, false],
					[true, false, false, false, false, false, true, true, false, true],
					[true, false, false, false, false, false, false, false, false, true],
					[true, false, false, false, false, false, true, true, false, false],
					[true, false, false, false, false, false, false, true, false, false],
					[true, false, false, false, false, false, false, false, false, false],
				];

				$scope.filtersize = [0, 2, 2, 4, 2, 2];
				$scope.user_role = UserInfo_service.getUserRole();
				$scope.daterange = {
					date_from: "",
					date_to: "",
				};

				var data = $.param({});

				$http.post(Server_api_url + 'setting/get_setting', data, UserInfo_service.http_config)
					.success(function (data, status, headers, config) {
						if (data.result == 1) {
							$rootScope.currentweek = data.setting.current_week;
							$rootScope.allweek = [];
							$scope.allweek = [];
							$scope.weeklist = {};
							for (var i = 0; i < data.all_weeks.length; i++){
								$rootScope.allweek.push(data.all_weeks[i].week_no);
								$scope.allweek.push(data.all_weeks[i].week_no);
								$scope.weeklist[data.all_weeks[i].week_no] = data.all_weeks[i];
							}
							$rootScope.alloption = [];
							for (var i = 0; i < data.cur_week.options.length; i++)
								$rootScope.alloption.push(data.cur_week.options[i].name);
						}

						var date_from = flatpickr("#date_from", {
							minDate: new Date(data.cur_week.start_at).toLocaleString('SV',{
								timeZone: "Africa/Lagos"
							}),
							maxDate: new Date(data.cur_week.close_at).toLocaleString('SV',{
								timeZone: "Africa/Lagos"
							}),
						});
						var date_to = flatpickr("#date_to", {
							minDate: new Date(data.cur_week.start_at).toLocaleString('SV',{
								timeZone: "Africa/Lagos"
							}),
							maxDate: new Date(data.cur_week.close_at).toLocaleString('SV',{
								timeZone: "Africa/Lagos"
							}),
						});

						date_from.set("onChange", function (d) {
							date_to.set("minDate", d); //increment by one day
							// $scope.onfilterchanged(10);
						});
						date_to.set("onChange", function (d) {
							date_from.set("maxDate", d);
							// $scope.onfilterchanged(11);
						});

						$rootScope.allstaff = [];
						$rootScope.allagent = [];
						$rootScope.allterminal = [];

						if (UserInfo_service.getUserRole() == 'admin') {
							var data = $.param({ user_role: 'staff' });
							$http.post(Server_api_url + 'user/user_all', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										for (var i = 0; i < data.users.length; i++)
											$rootScope.allstaff.push(data.users[i].user_id);
									}
								})

							data = $.param({ user_role: 'agent' });
							$http.post(Server_api_url + 'user/user_all', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										for (var i = 0; i < data.users.length; i++)
											$rootScope.allagent.push(data.users[i].user_id);
									}
								})

							data = $.param({});

							$http.post(Server_api_url + 'terminal/terminal_all', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										for (var i = 0; i < data.terminals.length; i++)
											$rootScope.allterminal.push(data.terminals[i].terminal_no);
									}
								})
						}
						else if (UserInfo_service.getUserRole() == 'agent') {
							$rootScope.allagent.push(UserInfo_service.getUser().user_id);

							data = $.param({ agent_id: UserInfo_service.getUser()._id });

							$http.post(Server_api_url + 'terminal/terminal_all', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									for (var i = 0; i < data.terminals.length; i++)
										$rootScope.allterminal.push(data.terminals[i].terminal_no);
								})
						}
						else if (UserInfo_service.getUserRole() == 'staff') {
							var data = $.param({ user_role: 'agent', user_staff: UserInfo_service.getUser()._id });
							$http.post(Server_api_url + 'user/user_all', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										$rootScope.allagent = [];
										for (var i = 0; i < data.users.length; i++) {
											$rootScope.allagent.push(data.users[i].user_id);
											var snd = $.param({ agent_id: data.users[i]._id });

											$http.post(Server_api_url + 'terminal/terminal_all', snd, UserInfo_service.http_config)
												.success(function (result, status, headers, config) {
													for (var i = 0; i < result.terminals.length; i++)
														$rootScope.allterminal.push(result.terminals[i].terminal_no);
												})
										}
									}
								})
						}

						$scope.filter = {
							weekno: $rootScope.currentweek,
							repeat: "",
							status: $rootScope.filter_betstatus == undefined ? 'ALL' : $rootScope.filter_betstatus,
							tsn: "",
							amt: "",
							bets_above: "",
							staff: $rootScope.filter_staff ? $rootScope.filter_staff : "ALL",
							agent: $rootScope.filter_agent ? $rootScope.filter_agent : "ALL",
							terminal: $rootScope.filter_terminal ? $rootScope.filter_terminal : "ALL",
							option: "ALL",
							repeatorder: "",
						}

						$rootScope.filter_staff = "ALL";
						$rootScope.filter_agent = "ALL";
						$rootScope.filter_terminal = "ALL";

						var totalsummarytable, usersummarytable, agentsummarytable, staffsummarytable, onlinesummarytable, terminalsummarytable, betsummarytable;
						var filter0 = function (settings, data, dataIndex) { return true };
						var filter1 = function (settings, data, dataIndex) { return true };
						var filter2 = function (settings, data, dataIndex) { return true };
						var filter3 = function (settings, data, dataIndex) { return true };
						var filter4 = function (settings, data, dataIndex) { return true };
						var filter5 = function (settings, data, dataIndex) { return true };

						var timer = $interval(function () {

							$.fn.dataTable.ext.search[0] = filter1;
							$.fn.dataTable.ext.search[1] = filter2;
							$.fn.dataTable.ext.search[2] = filter3;
							$.fn.dataTable.ext.search[3] = filter4;
							$.fn.dataTable.ext.search[4] = filter5;

							var cancel_timer = true;

							if ($scope.totalsummary) {
								totalsummarytable = $('#totalsummary').dataTable({
									"sScrollX": '99%',
									"dom": 'Bfrtip',
									"bPaginate": false,
									"bInfo": false,
									"buttons": [
										'copy', 'csv', 'excel', 'pdf', 'print'
									],
									"bFilter": false,
								});
							}

							if ($scope.usersummary) {
								usersummarytable = $('#usersummary').dataTable({
									"sScrollX": '99%',
									"dom": 'Bfrtip',
									"bPaginate": false,
									"bInfo": false,
									"buttons": [
										'copy', 'csv', 'excel', 'pdf', 'print'
									],
									"bFilter": false,
								});
							}

							if ($scope.terminalsummary) {
								terminalsummarytable = $('#terminalsummary').dataTable({
									"sScrollX": '99%',
									"bPaginate": false,
									"dom": 'Bfrtip',
									"buttons": [
										'copy', 'csv', 'excel', 'pdf', 'print'
									],
								});
								terminalsummarytable.fnSort([[1, 'asc']]);
								filter5 = function (settings, data, dataIndex) {
									return parseInt(data[0], 10) === parseInt($scope.filter.weekno, 10);
								};
								$.fn.dataTable.ext.search[4] = filter5;
								terminalsummarytable.fnDraw();
							}

							if ($scope.betsummary) {
								cancel_timer = false
								if($rootScope.betsummary)
								{
									betsummarytable = $('#betsummary').dataTable({
										"sScrollX": '99%',
										"dom": 'Bfrtip',
										"buttons": [
											'copy', 'csv', 'excel', 'pdf', 'print'
										],
										"bAutoWidth": false,
										"columnDefs": [
											{ "orderable": false, "targets": [ 8, 9, 12 ] }
										]
									});
									// betsummarytable.api().rows.add($rootScope.betsummary);
									betsummarytable.fnSetColumnVis(17, false, true);
									betsummarytable.fnSetColumnVis(18, false, true);
									betsummarytable.fnSetColumnVis(19, false, true);

									betsummarytable.fnFilter("week_"+$scope.filter.weekno, 5);
									if ($scope.filter.status != 'ALL')
										betsummarytable.fnFilter($scope.filter.status, 10);

									// calcRepeat();
									betsummarytable.fnDraw();
									cancel_timer = true
								}
							}

							if ($scope.agentsummary) {
								cancel_timer = false
								if($rootScope.agentsummary)
								{
									agentsummarytable = $('#agentsummary').dataTable({
										"sScrollX": '99%',
										"bPaginate": false,
										"dom": 'Bfrtip',
										"buttons": [
											'copy', 'csv', 'excel', 'pdf', 'print'
										],
										rowsGroup: [0, 1, 2, 6, 8, 9, 10, 11],
									});

									filter5 = function (settings, data, dataIndex) {
										return parseInt(data[0], 10) === parseInt($scope.filter.weekno, 10);
									};
									$.fn.dataTable.ext.search[4] = filter5;
									agentsummarytable.fnDraw();

									// agentsummarytable.fnFilter("week_"+$scope.filter.weekno, 12);
									cancel_timer = true
								}
							}

							if ($scope.staffsummary) {
								cancel_timer = false
								if($rootScope.staffsummary)
								{
									staffsummarytable = $('#staffsummary').dataTable({
										"sScrollX": '99%',
										"bPaginate": false,
										"dom": 'Bfrtip',
										"buttons": [
											'copy', 'csv', 'excel', 'pdf', 'print'
										],
									});

									filter5 = function (settings, data, dataIndex) {
										return parseInt(data[0], 10) === parseInt($scope.filter.weekno, 10);
									};
									$.fn.dataTable.ext.search[4] = filter5;
									staffsummarytable.fnDraw();
									// staffsummarytable.fnFilter("week_"+$scope.filter.weekno, 9);
									cancel_timer = true
								}
							}
							if ($scope.onlinesummary) {
								cancel_timer = false
								if($rootScope.onlinesummary)
								{
									onlinesummarytable = $('#onlinesummary').dataTable({
										"sScrollX": '99%',
										"bPaginate": false,
										"dom": 'Bfrtip',
										"buttons": [
											'copy', 'csv', 'excel', 'pdf', 'print'
										],
									});

									onlinesummarytable.fnSort([[1, 'asc']]);

									filter5 = function (settings, data, dataIndex) {
										return parseInt(data[0], 10) === parseInt($scope.filter.weekno, 10);
									};
									$.fn.dataTable.ext.search[4] = filter5;
									onlinesummarytable.fnDraw();
									// onlinesummarytable.fnFilter("week_"+$scope.filter.weekno, 7);
									cancel_timer = true
								}
								
							}

							// $scope.onfilterchanged(6);
							// $scope.onfilterchanged(7);
							// $scope.onfilterchanged(10);

							if(cancel_timer)
								$interval.cancel(timer);
						}, 1000);

						$('#betsummary').on('click', '.void', function (e) {
							var id = $(this).closest('tr').data('id');

							var data = $.param({ _id: id });
							var nRow = $(this).parents('tr')[0];

							$http.post(Server_api_url + 'bet/bet_voidrequest', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										// betsummarytable.fnUpdate('Void', nRow, 10, true);
										betsummarytable.fnUpdate('<span>Waiting</span>', nRow, 20, true);
										// betsummarytable.fnUpdate('<a class="unvoid" href="javascript:;">Unvoid</a>', nRow, 20, true);
									}
									else
										alert(data.message);
								})
						});

						$('#betsummary').on('click', '.unvoid', function (e) {
							var id = $(this).closest('tr').data('id');

							var data = $.param({ _id: id });
							var nRow = $(this).parents('tr')[0];

							$http.post(Server_api_url + 'bet/bet_unvoid', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										betsummarytable.fnUpdate('Active', nRow, 10, true);
										betsummarytable.fnUpdate('<a class="void" href="javascript:;">Void</a>', nRow, 20, true);
									}
									else
										alert(data.message);
								})
						});

						var calcRepeat = function () {
							var datas = betsummarytable.api().rows({ filter: 'applied' }).data();
							var repeats = Array(datas.length);
							var sameas = Array(datas.length);
							for (var i = 0; i < datas.length; i++) {
								if (sameas[i] != undefined) {
									repeats[i] = repeats[sameas[i]];
								}
								else {
									repeats[i] = 1;
									for (var j = i + 1; j < datas.length; j++) {
										if (datas[i][6] == datas[j][6]) {
											repeats[i]++;
											sameas[j] = i;
										}
									}
								}
								betsummarytable.fnUpdate(repeats[i], datas[i][0] - 1, 17, false, false);
							}
						}
						$scope.onWeekSelected = function () {
							var date_from = flatpickr("#date_from", {
								minDate: new Date($scope.weeklist[$scope.filter.weekno].start_at),
								maxDate: new Date($scope.weeklist[$scope.filter.weekno].close_at),
							});
							var date_to = flatpickr("#date_to", {
								minDate: new Date($scope.weeklist[$scope.filter.weekno].start_at),
								maxDate: new Date($scope.weeklist[$scope.filter.weekno].close_at),
							});

							date_from.set("onChange", function (d) {
								date_to.set("minDate", d); //increment by one day
								// $scope.onfilterchanged(10);
							});
							date_to.set("onChange", function (d) {
								date_from.set("maxDate", d);
								// $scope.onfilterchanged(11);
							});
						}
						$scope.onfilterchanged = function () {
							if ($scope.betsummary) {
								// switch (filterid) {
									// case 0:
										if(betsummarytable != undefined)
											betsummarytable.fnFilter("week_"+$scope.filter.weekno, 5);
										// $scope.weeklist[$scope.filter.weekno].start_at;

								        var data = $.param({week_no : $scope.filter.weekno});

								        $http.post(Server_api_url + 'bet/summary_total', data, UserInfo_service.http_config)
								          .success(function (data, status, headers, config) {
								            $rootScope.totalsummary = data.total_summary;
								          });

								        if(UserInfo_service.getUserRole() == "admin")
								        {
								        	$http.post(Server_api_url + 'bet/summary_user', data, UserInfo_service.http_config)
									        .success(function (data, status, headers, config) {
									            $rootScope.usersummary = data.user_summary;
									        });
								        }
								        else if(UserInfo_service.getUserRole() == "user")
								        {
								        	var data = $.param({ player_id: UserInfo_service.getId(), week: $scope.filter.weekno });
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
								        
								        
									// 	break;
									// case 1:
										filter1 = function (settings, data, dataIndex) {
											if ($scope.filter.repeat == null || $scope.filter.repeat == '')
												return 1;
											return parseInt(data[17], 10) >= parseInt($scope.filter.repeat, 10);
										};
										$.fn.dataTable.ext.search[0] = filter1;
									// 	break;
									// case 9:
										if ($scope.filter.repeatorder == "Increasing")
											betsummarytable.fnSort([[17, 'asc'], [18, 'asc']]);
										else if ($scope.filter.repeatorder == "Decreasing")
											betsummarytable.fnSort([[17, 'desc'], [18, 'desc']]);
									// 	break;
									// case 2:
										if ($scope.filter.status == "ALL")
											betsummarytable.fnFilter('', 10);
										else
											betsummarytable.fnFilter($scope.filter.status, 10);
									// 	break;
									// case 3:
										betsummarytable.fnFilter($scope.filter.tsn, 13);
									// 	break;
									// case 4:
										betsummarytable.fnFilter($scope.filter.amt, 19);
									// 	break;
									// case 5:
										filter2 = function (settings, data, dataIndex) {
											if ($scope.filter.bets_above == null || $scope.filter.bets_above == '')
												return 1;
											return parseInt(data[$scope.winlist ? 18 : 19], 10) >= parseInt($scope.filter.bets_above, 10);
										};
										$.fn.dataTable.ext.search[1] = filter2;
										betsummarytable.fnDraw();
									// 	break;
									// case 6:
										if ($scope.filter.agent == 'ALL')
											betsummarytable.fnFilter('', 15);
										else
											betsummarytable.fnFilter($scope.filter.agent, 15);
									// 	break;
									// case 7:
										if ($scope.filter.terminal == 'ALL')
											betsummarytable.fnFilter('', 14);
										else
											betsummarytable.fnFilter($scope.filter.terminal, 14);
									// 	break;
									// case 8:
										if ($scope.filter.option == 'ALL')
											betsummarytable.fnFilter('', 3);
										else
											betsummarytable.fnFilter($scope.filter.option, 3);
									// 	break;
									// case 10:
										var __date_from = $('#date_from')[0].value;

										var _date_from = new Date(__date_from).getTime();
										
										filter3 = function (settings, data, dataIndex) {
											if (__date_from == null || __date_from == '')
												return 1;
											var bet_time = new Date(data[16]).getTime();
											return bet_time >= _date_from;
										};
										$.fn.dataTable.ext.search[2] = filter3;
										betsummarytable.fnDraw();
									// 	break;
									// case 11:
										var __date_to = $('#date_to')[0].value;

										var _date_to = new Date(__date_to).getTime();
										filter4 = function (settings, data, dataIndex) {
											if (__date_to == null || __date_to == '')
												return 1;
											var bet_time = new Date(data[16]).getTime();
											return bet_time <= _date_to;
										};
										$.fn.dataTable.ext.search[3] = filter4;
										betsummarytable.fnDraw();
										// break;
								}

								// if (filterid != 1)
								// 	calcRepeat();
								// betsummarytable.fnDraw();
							// }

							if ($scope.staffsummary) {
								// switch (filterid) {
									// case 0:
										if(!$scope.betsummary){
											
											var data = $.param({week_no : $scope.filter.weekno, terminal_no: { $ne: 'user' }});
								            $http.post(Server_api_url + 'bet/summary_total', data, UserInfo_service.http_config)
								            .success(function (data, status, headers, config) {
								              $rootScope.totalsummary = data.total_summary;
								            });
								        }
									// case 10:
									if(staffsummarytable != undefined){
										if ($scope.filter.staff == 'ALL')
											staffsummarytable.fnFilter('', 1);
										else
											staffsummarytable.fnFilter($scope.filter.staff, 1);
									}
										// break;
								// }
							}

							if ($scope.agentsummary) {

								// switch (filterid) {
									// case 10:
									if(agentsummarytable != undefined){
										if ($scope.filter.staff == 'ALL')
											agentsummarytable.fnFilter('', 1);
										else
											agentsummarytable.fnFilter($scope.filter.staff, 1);

										if ($scope.filter.agent == 'ALL')
											agentsummarytable.fnFilter('', 2);
										else
											agentsummarytable.fnFilter($scope.filter.agent, 2);
										if ($scope.filter.terminal == 'ALL')
											agentsummarytable.fnFilter('', 3);
										else
											agentsummarytable.fnFilter($scope.filter.terminal, 3);
										if(!$scope.betsummary){
											var data = $.param({week_no : $scope.filter.weekno, terminal_no: { $ne: 'user' }});
								            $http.post(Server_api_url + 'bet/summary_total', data, UserInfo_service.http_config)
								            .success(function (data, status, headers, config) {
								              $rootScope.totalsummary = data.total_summary;
								            });

								        }
									}
									// 	break;
									// case 6:
										
									// 	break;
									// case 7:
										
									// 	break;
									// case 0:
										
								// }

								// if(!$scope.betsummary){
								// 	switch (filterid) {
								// 		case 10:
								// 			if ($scope.filter.staff == 'ALL')
								// 				agentsummarytable.fnFilter('', 0);
								// 			else
								// 				agentsummarytable.fnFilter($scope.filter.staff, 0);
								// 			break;
								// 		case 6:
								// 			if ($scope.filter.agent == 'ALL')
								// 				agentsummarytable.fnFilter('', 1);
								// 			else
								// 				agentsummarytable.fnFilter($scope.filter.agent, 1);
								// 			break;
								// 		case 7:
								// 			if ($scope.filter.terminal == 'ALL')
								// 				agentsummarytable.fnFilter('', 2);
								// 			else
								// 				agentsummarytable.fnFilter($scope.filter.terminal, 2);
								// 			break;
								// 	}
								// 	var data = $.param({week_no : $scope.filter.weekno});
							 //        $http.post(Server_api_url + 'bet/summary_total', data, UserInfo_service.http_config)
							 //        .success(function (data, status, headers, config) {
							 //          $rootScope.totalsummary = data.total_summary;
							 //        });

							 //        $http.post(Server_api_url + 'bet/summary_agent', data, UserInfo_service.http_config)
							 //        .success(function (data, status, headers, config) {
							 //          $rootScope.agentsummary = data.agent_summary;
							 //        });
								// }
							}

							if ($scope.terminalsummary) {
								// switch (filterid) {
									// case 6:
										var data = $.param({week_no : $scope.filter.weekno, terminal_no: { $ne: 'user' }});

									    $http.post(Server_api_url + 'bet/summary_total', data, UserInfo_service.http_config)
									      .success(function (data, status, headers, config) {
									        $rootScope.totalsummary = data.total_summary;
									      });
										if ($scope.filter.agent == 'ALL')
											terminalsummarytable.fnFilter('', 1);
										else
											terminalsummarytable.fnFilter($scope.filter.agent, 1);
									// 	break;
									// case 7:
										if ($scope.filter.terminal == 'ALL')
											terminalsummarytable.fnFilter('', 2);
										else
											terminalsummarytable.fnFilter($scope.filter.terminal, 2);
										// break;
								// }
							}

							if($scope.onlinesummary){
								// switch (filterid) {
									// case 0 :
											var data = $.param({week_no : $scope.filter.weekno});
											$http.post(Server_api_url + 'bet/summary_user', data, UserInfo_service.http_config)
									        .success(function (data, status, headers, config) {
									            $rootScope.usersummary = data.user_summary;
									        });

									        filter5 = function (settings, data, dataIndex) {
												return parseInt(data[0], 10) === parseInt($scope.filter.weekno, 10);
											};
											$.fn.dataTable.ext.search[4] = filter5;
											onlinesummarytable.fnDraw();

									        // onlinesummarytable.fnFilter("week_"+$scope.filter.weekno, 7);
									        

										// break;
								// }
							}

							// if (filterid != 1) {
							//   calcRepeat();
							// }
						}
						$('#search_form').on("keypress", function (e) {
							if(e.keyCode === 13){
								$scope.onfilterchanged();
							}
						});

					})
			}
		}
	});
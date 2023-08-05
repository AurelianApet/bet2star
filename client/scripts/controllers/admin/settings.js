'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
	.controller('SettingsCtrl', function ($rootScope, $scope, $position, UserInfo_service, $interval, $http, Server_api_url, $state, $location) {

		UserInfo_service.checkUrl();

		$('#heading').text("Admin Settings Dashboard");
		UserInfo_service.setHeading("Admin Settings Dashboard");

		var data = $.param({});

		$http.post(Server_api_url + 'setting/get_setting', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {
				if (data.result == -1) {
					alert(data.message);
				}
				else if (data.result == 1) {
					data.cur_week.start_at = new Date(data.cur_week.start_at).toLocaleString('SV',{
						timeZone: "Africa/Lagos"
					});
					data.cur_week.close_at = new Date(data.cur_week.close_at).toLocaleString('SV',{
						timeZone: "Africa/Lagos"
					});
					data.cur_week.validity = new Date(data.cur_week.validity).toLocaleString('SV',{
						timeZone: "Africa/Lagos"
					});

					$scope.risk_manager = data.setting.risk_manager[0];
					$scope.current_week = data.cur_week;
					$scope.clear_weeks = "";
					$scope.options = data.cur_week.options;
					$scope.weeks = data.all_weeks;
					$scope.selected_week = angular.copy(data.cur_week);
					$scope.bet_cnt = data.bet_cnt;
					$scope.credittoadd = 0;
					var counter = $scope.options.length + 1;

					var edit_start_at = flatpickr("#edit_start_time", { maxDate: data.cur_week.close_at, defaultDate: data.cur_week.start_at});
					var edit_close_at = flatpickr("#edit_end_time", { minDate: (new Date(data.cur_week.start_at).fp_incr(1)), defaultDate: data.cur_week.close_at});
					var edit_validity = flatpickr("#edit_valid_time", { minDate: (new Date(data.cur_week.close_at).fp_incr(1)), defaultDate: data.cur_week.validity});

					edit_close_at.set("onChange", function (d) {
						edit_start_at.set("maxDate", d);
						edit_validity.set('minDate', d.fp_incr(1));
					});

					edit_start_at.set("onChange", function (d) {
						edit_close_at.set("minDate", d.fp_incr(1)); //increment b
					});

					$scope.set_curweek = function () {
						var setMinStake = $("#set_min_stake").val();
						var setMaxStake = $("#set_max_stake").val();
						var edit_start_time = $("#edit_start_time").val();
						var edit_end_time = $("#edit_end_time").val();
						var edit_valid_time = $("#edit_valid_time").val();
						if(setMinStake <= 0 || setMinStake == ""){
							alert("min stake invalid");
							return;
						}
						if(setMaxStake <= 0 || setMaxStake == ""){
							alert("max stake invalid");
							return;
						}
						if(setMaxStake < setMinStake){
							alert("max stake higher than min stake");
							return;
						}

						var data = $.param({ 
							current_week: $scope.selected_week.week_no,
							start_at: edit_start_time,
							close_at: edit_end_time,
							validity: edit_valid_time,
							min_stake: setMinStake, 
							max_stake: setMaxStake
						});

						$http.post(Server_api_url + 'setting/set_current', data, UserInfo_service.http_config)
							.success(function (data, status, headers, config) {
								if (data.result == 1) {
									$http.post(Server_api_url + 'setting/get_setting', $.param({}), UserInfo_service.http_config)
									.success(function (data, status, headers, config) {
										var options = data.cur_week.options;
										var data = $.param({});
										$http.post(Server_api_url + 'terminal/terminal_all', data, UserInfo_service.http_config)
											.success(function (data, status, headers, config) {
												if (data.result == 1) {
													var terminals = data.terminals;
													var datasend = [];
													for (var i = 0; i < terminals.length; i++) {
														var terminal_options = [];
														for (var j = 0; j < options.length; j++) {
															terminal_options[j] = {
																"status": options[j].status,
																"name": options[j].name,
																"current": "true",
																"commission": options[j].commission
															};
														}
														datasend.push({ _id: terminals[i]._id, options: terminal_options });
													}

													var user_options = [];

													for (var i = 0; i < options.length; i++) {
														user_options[i] = {
															"status": options[i].status,
															"name": options[i].name,
															"commission": options[i].commission,
														};
													}

													var data = $.param({ data: datasend, options: user_options });
													$http.post(Server_api_url + 'setting/set_option', data, UserInfo_service.http_config)
														.success(function (data, status, headers, config) {
															window.location.reload();
														});
												}
											});
									});
									
								}
								else {
									alert(data.message);
								}
							})
							.error(function (data, status, headers, config) {
								alert("connection error");
							})
					}

					$scope.setRiskManager = function () {
						var data = $.param($scope.risk_manager);

						$http.post(Server_api_url + 'setting/set_riskmanager', data, UserInfo_service.http_config)
							.success(function (data, status, headers, config) {
								if (data.result == 1) {
									alert("success");
								}
								else {
									alert(data.message);
								}
							})
							.error(function (data, status, headers, config) {
								alert("connection error");
							})
					}

					$scope.addCommission = function () {
						if (nEditing !== null && nEditing != nRow) {
							/* Currently editing - but not this row - restore the old before continuing to edit mode */
							$('#editConfirmModal').modal();
						}
						else {
							var isNew = true;
							var data = $.param({ name: counter + '-1', commission: 100 });
							$http.post(Server_api_url + 'setting/option_add', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										var aiNew = oTable.fnAddData([
											counter,
											counter + '-1',
											100,
											'<button type="button" data-id=' + counter + '-1' + ' class="btn_optsts btn btn-success btn-circle"><i class="fa fa-check"></i></button>',
											'<a class="edit" href="javascript:;">Edit</a>',
											'<a class="delete" href="javascript:;">Delete</a>',
										]);

										var nRow = oTable.fnGetNodes(aiNew[0]);
										nRow.dataset["id"] = counter;

										nEditing = nRow;
										counter++;
										
										editRow(oTable, nRow, isNew);
									}
									else {
										alert(data.message);
									}
								})
								.error(function (data, status, headers, config) {
								});
						}
					}

					$scope.saveCommission = function () {
						$http.post(Server_api_url + 'setting/get_setting', $.param({}), UserInfo_service.http_config)
						.success(function (data, status, headers, config) {
							var options = data.cur_week.options;
							var data = $.param({});
							$http.post(Server_api_url + 'terminal/terminal_all', data, UserInfo_service.http_config)
							.success(function (data, status, headers, config) {
								if (data.result == 1) {
									var terminals = data.terminals;
									var datasend = [];
									for (var i = 0; i < terminals.length; i++) {
										var terminal_options = [];
										for (var j = 0; j < options.length; j++) {
											terminal_options[j] = {
												"status": options[j].status,
												"name": options[j].name,
												"current": "true",
												"commission": options[j].commission
											};
										}
										datasend.push({ _id: terminals[i]._id, options: terminal_options });
									}

									var user_options = [];

									for (var i = 0; i < options.length; i++) {
										user_options[i] = {
											"status": options[i].status,
											"name": options[i].name,
											"commission": options[i].commission,
										};
									}

									var data = $.param({ data: datasend, options: user_options });
									$http.post(Server_api_url + 'setting/set_option', data, UserInfo_service.http_config)
									.success(function (data, status, headers, config) {
										alert("Set commission is success!");
									});
								}
							});
						});
					}

					function restoreRow(oTable, nRow) {
						var aData = oTable.fnGetData(nRow);
						var jqTds = $('>td', nRow);

						for (var i = 0, iLen = jqTds.length; i < iLen; i++) {
							oTable.fnUpdate(aData[i], nRow, i, false);
						}

						oTable.fnDraw();
					}

					function editRow(oTable, nRow, flag) {
						if(!flag){
							var aData = oTable.fnGetData(nRow);
							var jqTds = $('>td', nRow);
							jqTds[1].innerHTML = '<input style="width: 100%;" type="text" class="form-control input-small" value="' + aData[1] + '">';
							jqTds[2].innerHTML = '<input style="width: 100%;" type="text" class="form-control input-small" value="' + 100 + '">';
							jqTds[4].innerHTML = '<a class="edit .update-commission" href="">Save</a>';
							jqTds[5].innerHTML = '<a class="cancel" href="">Cancel</a>';
							oTable.fnDraw();
						}else{
							var aData = oTable.fnGetData(nRow);
							var jqTds = $('>td', nRow);
							jqTds[1].innerHTML = '<input style="width: 100%;" type="text" class="form-control input-small" value="' + aData[1] + '">';
							jqTds[2].innerHTML = '<input style="width: 100%;" type="text" class="form-control input-small" value="' + 100 + '">';
							jqTds[4].innerHTML = '<a class="edit" href="">Save</a>';
							jqTds[5].innerHTML = '<a class="cancel" href="">Cancel</a>';
							oTable.fnDraw();
						}
					}

					function saveRow(oTable, nRow) {
						var aData = oTable.fnGetData(nRow);
						var jqInputs = $('input', nRow);
						var flag_valid = false;
						console.log($("#commissionTable").find(".update-commission").length);
						var data = $.param({ oldname: aData[1], newname: jqInputs[0].value, commission: jqInputs[1].value });
						if (aData[1] == jqInputs[0].value && aData[2] == jqInputs[1].value) {
							restoreRow(oTable, nRow);
							return;
						}

						var count = 0;
						for(var com = 0 ; com < $scope.options.length; com++){
							if(jqInputs[0].value == $scope.options[com]["name"])
								count++;
						}
						if($("#commissionTable").find(".update-commission").length == 0 && count == 0){
							flag_valid = true;
						}
						if($("#commissionTable").find(".update-commission").length == 1 && count == 1){
								flag_valid = true;
						}
						if($("#commissionTable").find(".update-commission").length == 0 && count == 1 && aData[2] != jqInputs[1].value){
							flag_valid = true;
						}
						if(flag_valid){
							$http.post(Server_api_url + 'setting/option_edit', data, UserInfo_service.http_config)
							.success(function (data, status, headers, config) {
								if (data.result == 1) {
									$('[data-id="' + aData[1] + '"]')[0].dataset['id'] = jqInputs[0].value;
									oTable.fnUpdate(jqInputs[0].value, nRow, 1, false);
									oTable.fnUpdate(jqInputs[1].value, nRow, 2, false);
									oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 4, false);
									oTable.fnUpdate('<a class="delete" href="">Delete</a>', nRow, 5, false);
									oTable.fnDraw();
								}
								else {
									alert(data.message);
								}
							})
							.error(function (data, status, headers, config) {
							})
						}
						else{
							alert("new option already exists");
							restoreRow(oTable, nRow);
						}

					}

					function cancelEditRow(oTable, nRow) {
						var jqInputs = $('input', nRow);
						// oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
						oTable.fnUpdate(jqInputs[0].value, nRow, 1, false);
						oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 3, false);
						oTable.fnDraw();
					}

					var table = $('#commissionTable');
					var oTable;

					setTimeout(function () {
						oTable = table.dataTable({
							"order": [
								[0, "desc"]
							],

							// set the initial value
							"sScrollX": '99%',
							"scrollCollapse": true,
							"language": {
								"lengthMenu": " _MENU_ records"
							}, dom: 'Bfrtip',
							buttons: [
								'copy', 'csv', 'excel', 'pdf', 'print'
							],
						});
					});

					var tableWrapper = $("#gameTable_wrapper");

					tableWrapper.find(".dataTables_length select").select2({
						showSearchInput: false //hide search box with special css class
					}); // initialize select2 dropdown

					var nEditing = null;
					var nNew = false;

					// $('#gameTable_new').click(function (e) {
					// 	e.preventDefault();

					// 	if (nNew && nEditing) {
					// 		if (confirm("Previose row not saved. Do you want to save it ?")) {
					// 			saveRow(oTable, nEditing); // save
					// 			$(nEditing).find("td:first").html("Untitled");
					// 			nEditing = null;
					// 			nNew = false;

					// 		} else {
					// 			oTable.fnDeleteRow(nEditing); // cancel
					// 			nEditing = null;
					// 			nNew = false;

					// 			return;
					// 		}
					// 	}

					// 	var aiNew = oTable.fnAddData(['', '', '', '', '', '', '']);
					// 	var nRow = oTable.fnGetNodes(aiNew[0]);
					// 	editRow(oTable, nRow);
					// 	nEditing = nRow;
					// 	nNew = true;
					// });

					table.on('click', '.btn_optsts', function (e) {
						e.preventDefault();

						var btn = this;
						var id = this.dataset['id'];
						var newstatus = $(btn).hasClass('btn-danger');						

						var data = $.param({
							option: id,
							status: newstatus,
						});

						$http.post(Server_api_url + 'setting/option_editstatus', data, UserInfo_service.http_config)
							.success(function (data, status, headers, config) {
								if (data.result == 1) {
									if (newstatus) {
										$(btn).removeClass('btn-danger');
										$(btn).addClass('btn-success');
										btn.innerHTML = '<i class="fa fa-check"></i>';
									}
									else {
										$(btn).removeClass('btn-success');
										$(btn).addClass('btn-danger');
										btn.innerHTML = '<i class="fa fa-times"></i>';
									}
								}
							});

					})

					table.on('click', '.delete', function (e) {
						e.preventDefault();

						if (nEditing !== null && nEditing != nRow) {
							/* Get the row as a parent of the link that was clicked on */
							var nRow = $(this).parents('tr')[0];

							if (nEditing !== null && nEditing != nRow) {
								/* Currently editing - but not this row - restore the old before continuing to edit mode */
								$('#editConfirmModal').modal();
							} else if (nEditing == nRow && this.innerHTML == "Save") {
								/* Editing this row and want to save it */
								saveRow(oTable, nEditing);
								nEditing = null;
								// $('#saveConfirmModal').modal();
							}
						}
						else {
							var id = $(this).closest('tr').data('id');
							$('#deleteConfirmModal').data('id', id).modal('show');
						}
					});

					$('#delete_item').click(function () {
						var id = $('#deleteConfirmModal').data('id');
						var data = $.param({ name: $('[data-id=' + id + ']')[0].cells[1].innerText });

						$http.post(Server_api_url + 'setting/option_delete', data, UserInfo_service.http_config)
							.success(function (data, status, headers, config) {
								if (data.result == 1) {
									oTable.fnDeleteRow($('[data-id=' + id + ']')[0]);
								}
								else {
									alert(data.message);
								}
							})
							.error(function (data, status, headers, config) {
								alert("connection error");
							})

						$('#deleteConfirmModal').modal('hide');
					});

					table.on('click', '.cancel', function (e) {
						e.preventDefault();

						if (nNew) {
							oTable.fnDeleteRow(nEditing);
							nNew = false;
						} else {
							restoreRow(oTable, nEditing);
							nEditing = null;
						}
					});

					table.on('click', '.edit', function (e) {
						e.preventDefault();

						/* Get the row as a parent of the link that was clicked on */
						var nRow = $(this).parents('tr')[0];

						if (nEditing !== null && nEditing != nRow) {
							/* Currently editing - but not this row - restore the old before continuing to edit mode */
							$('#editConfirmModal').modal();
						} else if (nEditing == nRow && this.innerHTML == "Save") {
							/* Editing this row and want to save it */
							saveRow(oTable, nEditing);
							nEditing = null;
							// $('#saveConfirmModal').modal();
						} else {
							/* No edit in progress - let's start one */
							editRow(oTable, nRow, false);
							nEditing = nRow;
						}
					});

					/************************************************************
					 *					  Week Settings					   *
					 ************************************************************/

					var current = new Date();

					// alert(current.toISOString());

					$scope.weekmodel = {
						week_no: "",
						start_at: "",
						close_at: "",
						validity: "",
						void_bet: "00:30:00",
						min_stake: "1000",
						max_stake: "10000",
					};

					var start_at = flatpickr("#start_at", { minDate: new Date() });
					var close_at = flatpickr("#close_at", { minDate: new Date() });
					var validity = flatpickr("#validity", { minDate: new Date() });

					start_at.set("onChange", function (d) {
						close_at.set("minDate", d.fp_incr(1)); //increment by one day
					});

					close_at.set("onChange", function (d) {
						start_at.set("maxDate", d);
						validity.set('minDate', d.fp_incr(1));
					});

					$scope.onNewWeek = function () {

						var void_bet = $scope.weekmodel.void_bet;
						
						if ($scope.weekmodel.week_no == "" || $scope.weekmodel.week_no == null) {
							alert("Input Week No");
							return;
						}

						$scope.weekmodel.start_at = $('#start_at').val();

						if ($scope.weekmodel.start_at == "" || $scope.weekmodel.start_at == null) {
							alert("Input Start Date");
							return;
						}

						$scope.weekmodel.close_at = $('#close_at').val();

						if ($scope.weekmodel.close_at == "" || $scope.weekmodel.close_at == null) {
							alert("Input Close Date");
							return;
						}

						$scope.weekmodel.validity = $('#validity').val();

						if ($scope.weekmodel.validity == "" || $scope.weekmodel.validity == null) {
							alert("Input Validity");
							return;
						}

						if ($scope.weekmodel.void_bet == "" || $scope.weekmodel.void_bet == null || $scope.weekmodel.void_bet.length != 8) {
							alert("Input Void Bet Time");
							return;
						}

						$scope.weekmodel.min_stake = $("#min_stake").val();
						if($scope.weekmodel.min_stake < 0 || $scope.weekmodel.min_stake == null){
							alert("Input Min Stake No");
							return;
						}

						$scope.weekmodel.max_stake = $("#max_stake").val();
						if($scope.weekmodel.max_stake < 0 || $scope.weekmodel.max_stake == null){
							alert("Input Max Stake No");
							return;
						}
						if($scope.weekmodel.min_stake > $scope.weekmodel.max_stake){
							alert("Min Stake larger than Max Stake");
							return;
						}

						// var startDate = Date.parse($scope.weekmodel.start_at);
						// var closeDate = Date.parse($scope.weekmodel.close_at);
						// var validityDate = Date.parse($scope.weekmodel.validity);
						// var voidbetTime = Date.parse($scope.weekmodel.void_bet);

						var void_bet = $scope.weekmodel.void_bet;

						var data = $.param({
							week_no: $scope.weekmodel.week_no,
							start_at: $scope.weekmodel.start_at,
							close_at: $scope.weekmodel.close_at,
							validity: $scope.weekmodel.validity,
							void_bet: (parseInt(void_bet.substr(0, 2)) * 3600 + parseInt(void_bet.substr(3, 2)) * 60 + parseInt(void_bet.substr(6, 2))) * 1000,
							options: $scope.options,
							min_stake: $scope.weekmodel.min_stake,
							max_stake: $scope.weekmodel.max_stake
						});

						// var data = $.param({
						//   week_no: $scope.weekmodel.week_no,
						//   start_at: startDate,
						// });

						$http.post(Server_api_url + 'week/week_edit', data, UserInfo_service.http_config)
							.success(function (data, status, headers, config) {
								alert('success');
								window.location.reload();
							})
							.error(function (data, status, header, config) {
								alert('fail');
							});
						// alert($scope.weekmodel);
						// alert($scope.weekmodel.start_at);
					};
				}
			})
			.error(function (data, status, header, config) {
				alert("Could not connect to Server");
			});

		$scope.onClearPlacedBet = function () {
			var data = $.param({});

			$http.post(Server_api_url + 'bet/clearbets', data, UserInfo_service.http_config)
				.success(function (data, status, headers, config) {
				});
		}
		$scope.onClearWeeksBet = function () {

			if($scope.clear_weeks.pop() != "@"){
				$(".select2-selection__choice").remove();
				return;
			}
			var data = $.param({clear_weeks: $scope.clear_weeks});

			$http.post(Server_api_url + 'bet/clear_selected_bets', data, UserInfo_service.http_config)
				.success(function (data, status, headers, config) {
					$scope.clear_weeks = "";
					$(".select2-selection__choice").remove();
				});
		}

		$scope.onChangeSelectedWeek = function () {
			var week_no = $scope.selected_week.week_no;
			var newSelect = $scope.weeks.find(function (elem) {
				return elem.week_no == week_no;
			});

			newSelect.start_at = new Date(newSelect.start_at).toLocaleString('SV',{
				timeZone: "Africa/Lagos"
			});
			newSelect.close_at = new Date(newSelect.close_at).toLocaleString('SV',{
				timeZone: "Africa/Lagos"
			});
			newSelect.validity = new Date(newSelect.validity).toLocaleString('SV',{
				timeZone: "Africa/Lagos"
			});
			$scope.selected_week.start_at = newSelect.start_at;
			$scope.selected_week.close_at = newSelect.close_at;
			$scope.selected_week.validity = newSelect.validity;
			$scope.selected_week.max_stake = newSelect.max_stake;
			$scope.selected_week.min_stake = newSelect.min_stake;

			var edit_start_at = flatpickr("#edit_start_time", { maxDate: newSelect.close_at});
			var edit_close_at = flatpickr("#edit_end_time", { minDate: newSelect.start_at});
			var edit_validity = flatpickr("#edit_valid_time", { minDate: newSelect.close_at});

			var edit_start_at = flatpickr("#edit_start_time", { maxDate: newSelect.close_at, defaultDate: newSelect.start_at});
			var edit_close_at = flatpickr("#edit_end_time", { minDate: (new Date(newSelect.start_at).fp_incr(1)), defaultDate: newSelect.close_at});
			var edit_validity = flatpickr("#edit_valid_time", { minDate: (new Date(newSelect.close_at).fp_incr(1)), defaultDate: newSelect.validity});

			edit_close_at.set("onChange", function (d) {
				edit_start_at.set("maxDate", d);
				edit_validity.set('minDate', d.fp_incr(1));
			});

			edit_start_at.set("onChange", function (d) {
				edit_close_at.set("minDate", d.fp_incr(1)); //increment b
			});
		}
		$scope.onAddCredit = function () {
			var data = $.param({ credit: $scope.credittoadd });

			$http.post(Server_api_url + 'terminal/credit_add', data, UserInfo_service.http_config)
				.success(function (data, status, headers, config) {
					if (data.result == 1) {
						alert('Success');
					}
					else {
						alert(data.message);
					}
				});
		}

		$scope.onRemoveCredit = function () {
			var data = $.param({ });

			$http.post(Server_api_url + 'terminal/credit_remove', data, UserInfo_service.http_config)
				.success(function (data, status, headers, config) {
					if (data.result == 1) {
						alert('Success');
					}
					else {
						alert(data.message);
					}
				});
		}

        $("#multi_weeks").select2({
		    placeholder: "select a week"
		});
	});

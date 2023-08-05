'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
	.controller('PlayersCtrl', function ($http, $rootScope, $scope, $position, UserInfo_service, $interval, Server_api_url) {

		UserInfo_service.checkUrl();

		$('#heading').text("Admin Online Users Dashboard");
		UserInfo_service.setHeading("Admin Online Users Dashboard");

		var data = $.param({ user_role: 'user' });
		var terminal_ids = [];

		$http.post(Server_api_url + 'user/user_all', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {
				$scope.playerData = data.users;
				var counter;

				// $http.post(Server_api_url + 'terminal/terminal_all', data, UserInfo_service.http_config)
				// 	.success(function (data, status, headers, config) {
						if (data.result == 1) {
							$scope.options = data.options;
						}
						else
							counter = 1;

						$scope.addPlayer = function () {

							if (nEditing !== null && nEditing != nRow) {
								/* Currently editing - but not this row - restore the old before continuing to edit mode */
								// $('#editConfirmModal').modal();
							}
							else {

								var aiNew = oTable.fnAddData([
									'',
									'Player' + counter,
									'123456',
									'Player' + counter,
									'Player' + counter,
									'Player' + counter,
									'Player' + counter,
									'Player' + counter,
									'Player' + counter,
									$scope.options,
									'<a class="edit" href="javascript:;">Edit</a>',
									'<a class="delete" href="javascript:;">Delete</a>',
								]);

								var nRow = oTable.fnGetNodes(aiNew[0]);
								nRow.dataset["id"] = counter;

								nEditing = nRow;
								counter++;

								var data = $.param({
									user_id: 'Player' + counter,
									user_password_show: '123456',
									user_email: 'Player' + counter,
									user_firstname: 'Player' + counter,
									user_lastname: 'Player' + counter,
									user_phonenumber: 'Player' + counter,
									user_address: 'Player' + counter,
									user_role: 'user',
									options: $scope.options
								});

								$http.post(Server_api_url + 'user/user_edit', data, UserInfo_service.http_config)
									.success(function (data, status, headers, config) {
										oTable.fnUpdate(data.user._id, nRow, 0, false);
										oTable.fnUpdate(data.user.user_createdat, nRow, 8, false);
										// 
										var divoption = '<div class="col" style="text-align:center;width:300px;">';

										for (var i = 0; i <$scope.options.length; i++) {
											divoption += '<div class="form-group" style="display:inline-flex;">';
											divoption += '<label style="width:50px;margin-top: 8px;">';
											divoption += $scope.options[i].name;
											divoption += ' : </label>';
											divoption += '<button data-id = "' + data.user._id + '" data-index = "' + i + '" type="button" class="btn_optsts btn btn-success btn-circle" style="margin:4px 8px 1px 0px;"><i class="fa fa-check"></i></button>';
											divoption += '<label style="margin-top: 8px;margin-right: 4px;">Commission :</label>';
											divoption += '<input type="number" id = "cms_' + data.user._id + '_' + i + '" min=1 max=100 style="margin-bottom: 5px;width: 70px;" class="form-control input-small" value="100">';
											divoption += '</div>';
										}
										divoption += '</div>';

										oTable.fnUpdate(divoption, nRow, 9, false);
										oTable.fnDraw();
										return;
										editRow(oTable, nRow);
									})
									.error(function (data, status, header, config) {
									});
							}
						}

						function restoreRow(oTable, nRow) {
							var aData = oTable.fnGetData(nRow);
							var jqTds = $('>td', nRow);

							for (var i = 0, iLen = jqTds.length; i < iLen; i++) {
								oTable.fnUpdate(aData[i], nRow, i, false);
							}

							oTable.fnDraw();
						}

						function editRow(oTable, nRow) {
							var aData = oTable.fnGetData(nRow);
							var jqTds = $('>td', nRow);
							jqTds[0].innerHTML = aData[0];
							jqTds[1].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[1] + '">';
							jqTds[2].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[2] + '">';
							jqTds[3].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[3] + '">';
							jqTds[4].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[4] + '">';
							jqTds[5].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[5] + '">';
							jqTds[6].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[6] + '">';
							jqTds[7].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[7] + '">';
							jqTds[8].innerHTML = aData[8];
							jqTds[9].innerHTML = aData[9];
							jqTds[10].innerHTML = '<a class="edit" href="">Save</a>';
							jqTds[11].innerHTML = '<a class="cancel" href="">Cancel</a>';

							oTable.fnDraw();
						}

						function saveRow(oTable, nRow) {
							var jqInputs = $('input', nRow);
							// oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
							oTable.fnUpdate(jqInputs[0].value, nRow, 1, false);
							oTable.fnUpdate(jqInputs[1].value, nRow, 2, false);
							oTable.fnUpdate(jqInputs[2].value, nRow, 3, false);
							oTable.fnUpdate(jqInputs[3].value, nRow, 4, false);
							oTable.fnUpdate(jqInputs[4].value, nRow, 5, false);
							oTable.fnUpdate(jqInputs[5].value, nRow, 6, false);
							oTable.fnUpdate(jqInputs[6].value, nRow, 7, false);
							oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 10, false);
							oTable.fnUpdate('<a class="delete" href="">Delete</a>', nRow, 11, false);

							var aData = oTable.fnGetData(nRow);

							var data = $.param({
								_id: aData[0],
								user_id: aData[1],
								user_password_show: aData[2],
								user_email: aData[3],
								user_firstname: aData[4],
								user_lastname: aData[5],
								user_phonenumber: aData[6],
								user_address: aData[7],
							});

							$http.post(Server_api_url + 'user/user_edit', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									oTable.fnDraw();
								})
								.error(function (data, status, header, config) {
								});
						}

						function cancelEditRow(oTable, nRow) {
							var jqInputs = $('input', nRow);
							oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
							oTable.fnUpdate(jqInputs[1].value, nRow, 1, false);
							oTable.fnUpdate(jqInputs[2].value, nRow, 2, false);
							oTable.fnUpdate(jqInputs[3].value, nRow, 3, false);
							oTable.fnUpdate(jqInputs[4].value, nRow, 4, false);
							oTable.fnUpdate(jqInputs[5].value, nRow, 5, false);
							oTable.fnUpdate(jqInputs[6].value, nRow, 6, false);
							oTable.fnUpdate('<a class="edit" href="">Edit</a>', nRow, 7, false);
							oTable.fnDraw();
						}

						var table = $('#usersTable');
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

						$('#gameTable_new').click(function (e) {
							e.preventDefault();

							if (nNew && nEditing) {
								if (confirm("Previose row not saved. Do you want to save it ?")) {
									saveRow(oTable, nEditing); // save
									$(nEditing).find("td:first").html("Untitled");
									nEditing = null;
									nNew = false;

								} else {
									oTable.fnDeleteRow(nEditing); // cancel
									nEditing = null;
									nNew = false;

									return;
								}
							}

							var aiNew = oTable.fnAddData(['', '', '', '', '', '']);
							var nRow = oTable.fnGetNodes(aiNew[0]);
							editRow(oTable, nRow);
							nEditing = nRow;
							nNew = true;
						});

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
								/*if (confirm("Are you sure to delete this row ?") == false) {
								 return;
								 }*/

								/* $('button.btnDelete').on('click', function (e) {
								 e.preventDefault();
								 var id = $(this).closest('tr').data('id');
								 $('#myModal').data('id', id).modal('show');
								 });
						
								 $('#btnDelteYes').click(function () {
								 var id = $('#myModal').data('id');
								 $('[data-id=' + id + ']').remove();
								 $('#myModal').modal('hide');
								 });*/

								var id = $(this).closest('tr').data('id');
								var nRow = $(this).parents('tr')[0];
								$('#deleteConfirmModal').data('id', id).modal('show');


								$('#delete_item').click(function () {
									var id = $('#deleteConfirmModal').data('id');

									var data = $.param({
										_id: id,
									});


									$http.post(Server_api_url + 'user/user_delete', data, UserInfo_service.http_config)
										.success(function (data, status, headers, config) {
											if (data.result == 1) {
												if ($('[data-id=' + id + ']')[0] != undefined)
													oTable.fnDeleteRow($('[data-id=' + id + ']')[0]);
											}
										})
										.error(function (data, status, header, config) {
										});
								});


								/*$('#deleteConfirmModal').modal({ backdrop: 'static', keyboard: false })
								 .one('click', '#delete_item', function (e) {
								 // var aiNew = oTable.fnAddData(['', '', '', '', '', '']);
								 var nRow = oTable.fnGetNodes();
								 console.log(nRow);
								 oTable.fnDeleteRow(nRow[0]);
						
								 });*/
							}
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
								editRow(oTable, nRow);
								nEditing = nRow;
							}
						});
					// });
						table.on('click', '.btn_optsts', function (e) {
							e.preventDefault();
							var btn = this;
							var id = this.dataset['id'];
							var num = this.dataset['index'];
							var newstatus = $(btn).hasClass('btn-danger');

							function hasSameId(element, index, array) {
								return element._id == id;
							}
							var index = $scope.playerData.findIndex(hasSameId);
							if(index != -1)
							{
								$scope.playerData[index].options[num].status = newstatus;
								var data = $.param({
									_id: id,
									options: $scope.playerData[index].options
								});

								$http.post(Server_api_url + 'user/user_edit', data, UserInfo_service.http_config)
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
							}
						});
						$scope.savePlayerCommission = function () {
							var data = $.param({ user_role: 'user' });
							$http.post(Server_api_url + 'user/user_all', data, UserInfo_service.http_config)
								.success(function (data, status, headers, config) {
									if (data.result == 1) {
										var users = data.users;
										var datasend = [];
										for (var i = 0; i < users.length; i++) {
											for (var j = 0; j < users[i].options.length; j++) {
												if (users[i].options[j].current) {
													var commission = $('#cms_' + users[i]._id + '_' + j).val().trim() == "" ? 0 : parseFloat($('#cms_' + users[i]._id + '_' + j).val());
													$('#cms_' + users[i]._id + '_' + j).val(commission);
													users[i].options[j].commission = commission;
												}
											}
											datasend.push({ _id: users[i]._id, options: users[i].options });
										}

										var data = $.param({ data: datasend });
										$http.post(Server_api_url + 'user/user_save_commission', data, UserInfo_service.http_config)
											.success(function (data, status, headers, config) {
												alert("success")
											});
									}
								});
						};
			})
			.error(function (data, status, header, config) {
				alert('fail');
			});

	});

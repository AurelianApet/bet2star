'use strict';

require('rootpath')();

var md5 = require('md5');
var nodemailer = require('nodemailer');

var model_user = require('server/app/models/user.model');
var model_bet = require('server/app/models/bet.model');
var model_counter = require('server/app/models/counter.model');
var model_setting = require('server/app/models/setting.model');
var model_week = require('server/app/models/week.model');
var model_terminal = require('server/app/models/terminal.model');
var model_game = require('server/app/models/game.model');
var model_summary = require('server/app/models/summary.model');
var model_deleterequest = require('server/app/models/deleterequest.model');
var env_config = require('server/config/development');
var crypto = require('crypto');
var crypt = require('crypt');
var bin = require('charenc').bin;

var service = require('server/app/controllers/service.controller');


var self = this;

exports.login = function (req, res) {

	if (req.body.sn == "" || req.body.sn == undefined) {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.password == undefined) {
		return res.status(200).json({
			result: 1001,
			message: "password required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.status != true) {
			return res.status(200).json({
				result: 1002,
				message: "terminal is not allowed"
			});
		}

		if (terminal.password != md5(req.body.password)) {
			return res.status(200).json({
				result: 1002,
				message: "wrong password"
			});
		}

		crypto.randomBytes(32, (err, token) => {
			if (err) throw err;

			terminal.token = token.toString('hex');
			terminal.save();

			function possibleOption(option) {
				return option.current == 'true' && option.status == 'true';
			}

			var options = [];

			for (var i = 0; i < terminal.options.length; i++) {
				if (terminal.options[i].status == 'true' && terminal.options[i].current == 'true') {
					options.push(terminal.options[i].name);
				}
			}

			var unders = [];

			for (var i = 0; i < 4; i++) {
				if (terminal.unders[i] == 'true') {
					unders.push('U' + (i + 3));
				}
			}

			model_setting.findOne({}, function (err, setting) {

				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				model_week.findOne({ week_no: setting.current_week }, function (err, cur_week) {

					if (!cur_week) {
						return res.status(200).json({
							result: -1,
							message: "week does not exist."
						});
					}

					model_game.find({ week_no: cur_week.week_no, status: true }).sort({ game_no: 1 }).exec(function (err, games) {

						var games_send = [];
						for (var i = 0; i < games.length; i++) {
							games_send.push(games[i].game_no);
						}

						return res.status(200).json({
							result: 1,
							message: "success",
							data: {
								sn: terminal.terminal_no,
								token: terminal.token,
								default_type: terminal.default_type,
								default_sort: terminal.default_sort,
								default_under: terminal.default_under,
								possible_sort: options,
								possible_under: unders,
								games: games_send,
								week: cur_week.week_no,
								start_at: cur_week.start_at,
								close_at: cur_week.close_at,
								validity: cur_week.validity,
								void_bet: cur_week.void_bet,
								credit_limit: terminal.credit_limit
							}
						});
					})
				})
			})
		});
	});

}

var calcTerminalSummary = function (terminal_no, agent_id, option, commission, week_no) {
	if (!commission || commission == "")
		commission = 0;
	model_summary.findOneAndRemove({ summary_id: terminal_no + option + week_no }, function (err, summary) {
		var summary = new model_summary({
			terminal_no: terminal_no,
			agent_id: agent_id,
			option: option,
			commission: commission,
			week_no: week_no,
			summary_id: terminal_no + option + week_no,
		});
		model_bet.find({ week: week_no, terminal_id: summary.terminal_no, option: summary.option, status: 'Active' }, function (err, bets) {
			for (var k = 0; k < bets.length; k++) {
				summary.sales += bets[k].stake_amount;
				summary.win += bets[k].won_amount;
			}
			summary.payable = summary.sales * summary.commission / 100;
			summary.save();
		});
	});
}

exports.reset = function (req, res) {

	if (req.body.sn == "" || req.body.sn == undefined) {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		function possibleOption(option) {
			return option.current == 'true' && option.status == 'true';
		}

		var options = [];

		for (var i = 0; i < terminal.options.length; i++) {
			if (terminal.options[i].status == 'true' && terminal.options[i].current == 'true') {
				options.push(terminal.options[i].name);
			}
		}

		var unders = [];

		for (var i = 0; i < 4; i++) {
			if (terminal.unders[i] == 'true') {
				unders.push('U' + (i + 3));
			}
		}

		model_setting.findOne({}, function (err, setting) {

			if (!setting) {
				return res.status(200).json({
					result: -1,
					message: "no setting"
				});
			}

			if (setting.current_week == undefined) {
				return res.status(200).json({
					result: -1,
					message: "no current weekno"
				});
			}

			model_week.findOne({ week_no: setting.current_week }, function (err, cur_week) {

				if (!cur_week) {
					return res.status(200).json({
						result: -1,
						message: "week does not exist."
					});
				}

				model_game.find({ week_no: cur_week.week_no, status: true }).sort({ game_no: 1 }).exec(function (err, games) {

					var games_send = [];
					for (var i = 0; i < games.length; i++) {
						games_send.push(games[i].game_no);
					}

					return res.status(200).json({
						result: 1,
						message: "success",
						data: {
							sn: terminal.terminal_no,
							token: terminal.token,
							default_type: terminal.default_type,
							default_sort: terminal.default_sort,
							default_under: terminal.default_under,
							possible_sort: options,
							possible_under: unders,
							games: games_send,
							week: cur_week.week_no,
							start_at: cur_week.start_at,
							close_at: cur_week.close_at,
							validity: cur_week.validity,
							void_bet: cur_week.void_bet,
							credit_limit: terminal.credit_limit
						}
					});
				})
			})
		})
	});

}


exports.make_bet = function (req, res) {

	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		model_user.find({ _id: terminal.agent_id }, function (err, agent) {


			model_setting.findOne({}, function (err, setting) {

				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				model_week.findOne({ week_no: setting.current_week }, function (err, cur_week) {
					if (!cur_week)
						return res.status(200).json({
							result: -1,
							message: "no current weekno"
						});

					if (cur_week.start_at.getTime() > Date.now() || cur_week.close_at.getTime() < Date.now()) {
						return res.status(200).json({
							result: -1,
							message: "coming soon"
						});
					}

					req.body.ticket_no = req.body.sn + Math.floor(Math.random() * 9000000 + 1000000);

					model_bet.findOne({ ticket_no: req.body.ticket_no }, function (err, bet) {

						model_bet.find({ week: cur_week.week_no, terminal_id: terminal._id }, function (err, bets) {

							var resultBets = [];
							var bet_time = Date();

							model_game.find({ status: true, week_no: cur_week.week_no }, function (err, gamelists) {

								for (var l = 0; l < req.body.bets.length; l++) {
									req.body.bets[l].gamelist.sort(function (a, b) { return a - b });

									if (req.body.bets[l].option == "" || req.body.bets[l].option == undefined)
										req.body.bets[l].option = terminal.default_sort;

									if (req.body.bets[l].under == undefined || req.body.bets[l].under.length == 0)
										req.body.bets[l].under = [parseInt(terminal.default_under.substring(1))];

									var mismatch_games = [];
									var mismatch_games_str = "";

									if (req.body.bets[l].type == 'Group') {
										for (var kk = 0; kk < req.body.bets[l].gamelist.length; kk++) {
											for (var jj = 0; jj < req.body.bets[l].gamelist[kk].list.length; jj++) {
												function hasGame(element, index, array) {
													return element.game_no == req.body.bets[l].gamelist[kk].list[jj];
												}
												var index = gamelists.findIndex(hasGame);
												if (index == -1) {
													mismatch_games.push(req.body.bets[l].gamelist[kk].list[jj]);
													mismatch_games_str += req.body.bets[l].gamelist[kk].list[jj] + " ";
												}
											}

										}

										if (mismatch_games.length > 0) {
											resultBets.push({
												result: 1004,
												message: mismatch_games_str + ': mismatch numbers',
												type: req.body.bets[l].type,
												option: req.body.bets[l].option,
												under: req.body.bets[l].under,
												gamelist: req.body.bets[l].gamelist,
												stake_amount: req.body.bets[l].stake_amount
											});
											continue;
										}
									}
									else if (req.body.bets[l].type == "Nap/Perm") {
										for (var kk = 0; kk < req.body.bets[l].gamelist.length; kk++) {
											function hasGame(element, index, array) {
												return element.game_no == req.body.bets[l].gamelist[kk];
											}
											var index = gamelists.findIndex(hasGame);
											if (index == -1) {
												mismatch_games.push(req.body.bets[l].gamelist[kk]);
												mismatch_games_str += req.body.bets[l].gamelist[kk] + " ";
											}
										}
										if (mismatch_games.length > 0) {
											resultBets.push({
												result: 1004,
												message: mismatch_games_str + ': mismatch numbers',
												type: req.body.bets[l].type,
												option: req.body.bets[l].option,
												under: req.body.bets[l].under,
												gamelist: req.body.bets[l].gamelist,
												stake_amount: req.body.bets[l].stake_amount
											});
											continue;
										}
									}


									if (req.body.bets[l].stake_amount < terminal.min_stake) {
										resultBets.push({
											result: 1004,
											message: 'stake amount is less than min_stake',
											type: req.body.bets[l].type,
											option: req.body.bets[l].option,
											under: req.body.bets[l].under,
											gamelist: req.body.bets[l].gamelist,
											stake_amount: req.body.bets[l].stake_amount
										});
										continue;
									}

									if (req.body.bets[l].stake_amount > terminal.max_stake) {
										resultBets.push({
											result: 1004,
											message: 'stake amount is greater than max_stake',
											type: req.body.bets[l].type,
											option: req.body.bets[l].option,
											under: req.body.bets[l].under,
											gamelist: req.body.bets[l].gamelist,
											stake_amount: req.body.bets[l].stake_amount
										});
										continue;
									}

									if (terminal.credit_limit < req.body.bets[l].stake_amount) {
										resultBets.push({
											result: 1004,
											message: 'credit lack',
											type: req.body.bets[l].type,
											option: req.body.bets[l].option,
											under: req.body.bets[l].under,
											gamelist: req.body.bets[l].gamelist,
											stake_amount: req.body.bets[l].stake_amount
										});
										continue;
									}

									var newBet = new model_bet({
										bet_time: bet_time,
										ticket_no: req.body.ticket_no,
										terminal_id: terminal._id,
										agent_id: terminal.agent_id,
										stake_amount: req.body.bets[l].stake_amount,
										gamelist: req.body.bets[l].gamelist,
										week: cur_week.week_no,
										under: req.body.bets[l].under,
										option: req.body.bets[l].option,
										type: req.body.bets[l].type
									});

									newBet.bet_id = Math.floor(Math.random() * 9000000 + 1000000);

									var total_stake = 0;

									for (var i = 0; i < bets.length; i++) {
										if (bets[i].type != req.body.bets[l].type)
											continue;

										if (bets[i].option != req.body.bets[l].option)
											continue;

										var flagSame = false;

										if (newBet.type == 'Group') {

											if (bets[i].gamelist.length == newBet.gamelist.length) {
												for (var j = 0; j < newBet.gamelist.length; j++) {
													newBet.gamelist[j].list.sort(function (a, b) { return a - b });
													bets[i].gamelist[j].list.sort(function (a, b) { return a - b });
													if (bets[i].gamelist[j].under[0] != newBet.gamelist[j].under[0])
														break;
													if (bets[i].gamelist[j].list.length != newBet.gamelist[j].list.length)
														break;
													for (var k = 0; k < newBet.gamelist[j].list.length; k++)
														if (bets[i].gamelist[j].list[k] != newBet.gamelist[j].list[k])
															break;
													if (k != newBet.gamelist[j].list.length)
														break;
												}
												if (j == newBet.gamelist.length) {
													flagSame = true;
													total_stake += bets[i].stake_amount;
												}
											}

										}
										else if (newBet.type == 'Nap/Perm') {
											newBet.gamelist.sort(function (a, b) { return a - b });
											bets[i].gamelist.sort(function (a, b) { return a - b });
											if (newBet.gamelist.length == bets[i].gamelist.length) {
												for (var j = 0; j < newBet.gamelist.length; j++) {
													if (newBet.gamelist[j] != bets[i].gamelist[j])
														break;
												}
												if (j == newBet.gamelist.length) {
													flagSame = true;
													total_stake += bets[i].stake_amount;
												}
											}
										}
									}

									if (flagSame) {

										if (total_stake + req.body.bets[l].stake_amount > terminal.max_stake) {
											resultBets.push({
												result: 1004,
												message: 'stake amount is greater than max_stake',
												type: req.body.bets[l].type,
												option: req.body.bets[l].option,
												under: newBet.under,
												gamelist: req.body.bets[l].gamelist,
												stake_amount: req.body.bets[l].stake_amount
											});
											continue;
										}
									}

									var line = 0;

									if (newBet.type == "Nap/Perm") {
										var n = newBet.gamelist.length;
										line = 0;
										for (var i = 0; i < newBet.under.length; i++) {
											if (newBet.under[i] <= n) {
												var eachline = 1;
												for (var j = 0; j < newBet.under[i]; j++)
													eachline = eachline * (n - j) / (j + 1);
												line += eachline;
											}
										}
									}
									else if (newBet.type == "Group") {
										line = 1;
										for (var i = 0; i < newBet.gamelist.length; i++) {
											var eachline = 1;
											var subunder = newBet.gamelist[i].under;
											var n = newBet.gamelist[i].list.length;
											for (var k = 0; k < subunder.length; k++) {

												if (subunder[k] == 0)
													continue;

												if (subunder[k] > n) {
													line = 0;
													break;
												}
												for (var j = 0; j < subunder[k]; j++)
													eachline = eachline * (n - j) / (j + 1);
											}

											line = line * eachline;
										}
									}

									if (line == 0) {
										console.log("apl is zero");
										resultBets.push({
											result: 1003,
											message: 'apl is zero',
											type: newBet.type,
											option: newBet.option,
											under: newBet.under,
											gamelist: newBet.gamelist,
											stake_amount: newBet.stake_amount
										});
										continue;
									}

									newBet.apl = newBet.stake_amount / line;

									terminal.credit_limit -= newBet.stake_amount;
									terminal.save();

									newBet.save(function (err, result) {
										if (err) {
											return res.status(200).json({
												result: -1,
												message: err.message
											});
										}
										var commission = 0;
										var option = terminal.options.find(function (elem) { return elem.name == newBet.option; })
										if (option)
											commission = option.commission;
										calcTerminalSummary(terminal._id, terminal.agent_id, newBet.option, commission, cur_week.week_no);
										// calcTerminalSummary(terminal.terminal_no, agent[0].user_id, newBet.option, commission, cur_week.week_no);
									});

									bets.push(newBet);

									resultBets.push({
										result: 1,
										message: 'success',
										type: newBet.type,
										option: newBet.option,
										under: newBet.under,
										gamelist: newBet.gamelist,
										stake_amount: newBet.stake_amount,
										bet_id: newBet.bet_id,
										apl: newBet.apl
									});
								}
								return res.status(200).json({
									result: 1,
									message: 'success',
									data: {
										ticket_no: req.body.ticket_no,
										bet_time: bet_time,
										week: cur_week.week_no,
										agent_id: agent.user_id,
										terminal_id: terminal.terminal_no,
										bets: resultBets
									},
								});
							});

						});

					})
				})
			});
		});
	})

}

exports.results = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}
		model_setting.findOne({}, function (err, setting) {

			var week_no = req.body.week;

			if (!week_no) {
				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				week_no = setting.current_week;
			}

			model_game.find({ week_no: week_no, status: true, checked: true }).sort({ game_no: 1 }).exec(function (err, games) {

				var games_send = [];
				for (var i = 0; i < games.length; i++) {
					games_send.push(games[i].game_no);
				}
				return res.status(200).json({
					result: 1,
					message: "success",
					data: {
						week: week_no,
						drawn: games_send
					}
				});
			})
		})
	})
}

exports.reprint = function (req, res) {

	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	if (req.body.ticket_no == undefined || req.body.ticket_no == "") {
		return res.status(200).json({
			result: 1001,
			message: "ticket_no required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		model_bet.find({ ticket_no: req.body.ticket_no }, function (err, bets) {

			if (bets.length == 0) {
				return res.status(200).json({
					result: 1002,
					message: "ticket_no dose not exist"
				});
			}

			var bet_time = bets[0].bet_time;
			var week = bets[0].week;
			var agent_id = bets[0].agent_id;
			var terminal_id = terminal.terminal_no;//bets[0].terminal_id;
			var bet_id = bets[0].bet_id;

			bets = bets.map(function (obj) {
				return {
					type: obj.type,
					option: obj.option,
					under: obj.under,
					gamelist: obj.gamelist,
					stake_amount: obj.stake_amount,
					bet_id: obj.bet_id,
					apl: obj.apl
				}
			})

			var agent_id = "";

			model_user.findOne({ _id: terminal.agent_id }, function (err, agent) {
				agent_id = agent.user_id;
				return res.status(200).json({
					result: 1,
					message: "success",
					data: {
						ticket_no: req.body.ticket_no,
						bet_time: bet_time,
						week: week,
						agent_id: agent_id,
						terminal_id: terminal_id,
						bets: bets
					}
				});
			});

		})
	})
}

exports.win_list = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required",
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist",
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch",
			});
		}

		var page_count = 20;
		var current_page = req.body.current_page;

		if(current_page <= 0){
			return res.status(200).json({
				result: 1002,
				message: "current_page mismatch",
			});
		}

		if(!current_page)
			current_page = 1;

		model_setting.findOne({}, function (err, setting) {

			var week_no = req.body.week;

			if (!week_no) {
				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				week_no = setting.current_week;
			}

			// var data = { terminal_id: req.body.sn, win_result: "Win", week: week_no };
			var data = { terminal_id: terminal._id, win_result: "Win", week: week_no };

			if (req.body.ticket_no != undefined)
				data['ticket_no'] = req.body.ticket_no;

			model_bet.find(data, function (err, bets) {
				var win_list = [];
				for (var i = 0; i < bets.length; i++) {
					var index = win_list.findIndex(function (elem) {
						return elem.ticket_no == bets[i].ticket_no;
					});

					if (index == -1) {
						win_list.push({
							ticket_no: bets[i].ticket_no,
							bet_id: [],
							amount: [],
							total_winning: 0,
							bet_time: bets[i].bet_time,
						})
						index = win_list.length - 1;
					}

					if (bets[i].bet_id == undefined)
						bets[i].bet_id = "";

					win_list[index].bet_id.push(bets[i].bet_id);
					win_list[index].amount.push(bets[i].won_amount);
					win_list[index].total_winning += bets[i].won_amount;
				}

				var total_count = win_list.length;
				var last_page = Math.ceil(total_count / page_count);
				var page_list = [];
				if(current_page <= last_page)
				{
					var last_num = current_page * page_count;
					last_num = last_num > total_count ? total_count : last_num;
					for (var i = (current_page - 1) * page_count; i < last_num; i++) {
						page_list.push(win_list[i]);
					}
				}
				

				var agent_id = "";

				model_user.findOne({ _id: terminal.agent_id }, function (err, agent) {
					agent_id = agent.user_id;
					return res.status(200).json({
						result: 1,
						message: "success",
						data: {
							week: week_no,
							agent_id: agent_id,
							current_page: current_page,
							last_page: last_page,
							win_list: page_list
						}
					});
				});


			})

		})
	})
}

exports.report = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		model_setting.findOne({}, function (err, setting) {

			var week_no = req.body.week;

			if (!week_no) {
				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				week_no = setting.current_week;
			}

			model_week.findOne({ week_no: week_no }, function (err, cur_week) {

				if (!cur_week) {
					return res.status(200).json({
						result: -1,
						message: "week does not exist."
					});
				}

				model_summary.find({ week_no: week_no, terminal_no: terminal._id }, function (err, summaries) {

					model_bet.find({terminal_id: terminal._id, week: week_no, status: "Active"}, function (err, bets) {
						var terminal_summary = {
							total_sale: 0,
							total_payable: 0,
							total_win: 0,
							bal_agent: "",
							bal_company: "",
							status: ""
						};

						var odd_summary = [];

						for (var i = 0; i < summaries.length; i++) {
							terminal_summary.total_sale += summaries[i].sales;
							terminal_summary.total_payable += summaries[i].payable;
							terminal_summary.total_win += summaries[i].win;
							
							var count = 0;
							if(summaries[i].sales > 0)
							{
								bets.map(function (obj) {
									if (obj.option == summaries[i].option)
									{
										count++;
									}
								})
							}
							odd_summary.push({
								option: summaries[i].option,
								count: count,
								sale: summaries[i].sales,
								payable: summaries[i].payable,
								win: summaries[i].win,
							});
						}

						if (terminal_summary.total_payable > terminal_summary.total_win) {
							terminal_summary.bal_company = terminal_summary.total_payable - terminal_summary.total_win;
							terminal_summary.status = 'green';
						}
						else {
							terminal_summary.bal_agent = terminal_summary.total_win - terminal_summary.total_payable;
							terminal_summary.status = 'red';
						}

						var agent_id = "";

						model_user.findOne({ _id: terminal.agent_id }, function (err, agent) {
							agent_id = agent.user_id;
							return res.status(200).json({
								result: 1,
								message: "success",
								data: {
									week: week_no,
									agent_id: agent_id,
									terminal_summary: terminal_summary,
									odd_summary: odd_summary,
									close_at: cur_week.close_at
								}
							});
						});
					})


				})
			})
		})

	})
}

exports.credit_limit = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}
		return res.status(200).json({
			result: 1,
			message: "success",
			data: {
				credit_limit: terminal.credit_limit
			}
		});
	})
}

exports.logout = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		crypto.randomBytes(32, (err, token) => {
			if (err) throw err;

			terminal.token = token.toString('hex');
			terminal.save();
		})

		return res.status(200).json({
			result: 1,
			message: "success"
		});
	})
}

exports.void_bet = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		model_bet.findOne({ bet_id: req.body.bet_id }, function (err, bet) {

			if (!bet) {
				return res.status(200).json({
					result: 1002,
					message: "bet_id dose not exist"
				});
			}
			model_week.findOne({ week_no: bet.week }, function (err, week) {
				if (!week) {
					return res.status(200).json({
						result: -1,
						message: "week dose not exist"
					});
				}

				if (Date.now() - week.close_at.getTime() > 0) {
					return res.status(200).json({
						result: 1004,
						message: "bet does not change in past week"
					});
				}

				if (Date.now() - bet.bet_time.getTime() > week.void_bet) {
					return res.status(200).json({
						result: 1003,
						message: "void time passed"
					});
				}

				model_game.find({ week_no: week.week_no, status: true }, function (err, games) {
					if (!games) {
						return res.status(200).json({
							result: -1,
							message: "game does not exist",
						});
					}

					if(bet.type == "Nap/Perm")
					{
						for (var i = 0; i < bet.gamelist.length; i++) {
							function findGame(element) {
								return element.game_no == bet.gamelist[i];
							}
							var index = games.findIndex(findGame);
	
							
							if(index == -1)
							{
								return res.status(200).json({
									result: 1003,
									message: "void failed"
								});
							}
						}
					}
					else
					{
						for (var j = 0; j < bet.gamelist.length; j++) {
							var list = bet.gamelist[j]["list"]

							for (var k = 0; k < list.length; k++) {
								function findGame(element) {
									return element.game_no == list[k];
								}
								var index = games.findIndex(findGame);
		
								
								if(index == -1)
								{
									return res.status(200).json({
										result: 1003,
										message: "void failed"
									});
								}
							}
						}
					}

					var newRequest = new model_deleterequest({ bet_id: bet._id, terminal_id: terminal._id, agent_id: terminal.agent_id });
					newRequest.save(function (err, request) {
						if (err) {
							return res.status(200).json({
								result: 1003,
								message: "already requested"
							});
						}
						return res.status(200).json({
							result: 1,
							message: "success"
						});
					})
				})
			})
		})
	})
}

exports.password_change = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	if (req.body.new_password == undefined || req.body.new_password == "") {
		return res.status(200).json({
			result: 1001,
			message: "enter new password"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			}); s
		}

		terminal.password_show = crypt.bytesToBase64(bin.stringToBytes(req.body.new_password));
		terminal.password = md5(req.body.new_password);
		terminal.save();

		return res.status(200).json({
			result: 1,
			message: "success"
		});
	})
}

exports.void_list = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		model_setting.findOne({}, function (err, setting) {

			var week_no = req.body.week;

			if (!week_no) {
				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				week_no = setting.current_week;
			}

			model_bet.find({ terminal_id: terminal._id, status: "Void", week: week_no }, function (err, bets) {

				bets = bets.map(function (obj) {
					return {
						bet_id: obj.bet_id,
						type: obj.type,
						option: obj.option,
						under: obj.under,
						gamelist: obj.gamelist,
						stake_amount: obj.stake_amount,
						apl: obj.apl,
						ticket_no: obj.ticket_no
					}
				})

				var agent_id = "";

				model_user.findOne({ _id: terminal.agent_id }, function (err, agent) {
					agent_id = agent.user_id;
					return res.status(200).json({
						result: 1,
						message: "success",
						data: {
							week: week_no,
							agent_id: agent_id,
							void_list: bets
						}
					});
				});


			})
		})

	})
}

exports.search = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}

		model_setting.findOne({}, function (err, setting) {

			var week_no = req.body.week;

			if (!week_no) {
				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				week_no = setting.current_week;
			}

			if (!req.body.searchword)
				req.body.searchword = "";

			if (!req.body.is_ticketid)
				req.body.is_ticketid = 0;

			if(req.body.is_ticketid == 1)
			{
				model_bet.find({
					ticket_no: req.body.searchword,
					terminal_id: terminal._id,
					week: week_no,
				}, function (err, bets) {
					bets = bets.map(function (obj) {
						if (obj.win_result != "")
							return {
								bet_id: obj.bet_id,
								type: obj.type,
								option: obj.option,
								under: obj.under,
								gamelist: obj.gamelist,
								stake_amount: obj.stake_amount,
								apl: obj.apl,
								ticket_no: obj.ticket_no,
								status: obj.status,
								won_amount: obj.won_amount,
								win_result: obj.win_result
							}
						else
							return {
								bet_id: obj.bet_id,
								type: obj.type,
								option: obj.option,
								under: obj.under,
								gamelist: obj.gamelist,
								stake_amount: obj.stake_amount,
								apl: obj.apl,
								ticket_no: obj.ticket_no,
								status: obj.status
							}
					})
	
					return res.status(200).json({
						result: 1,
						message: "success",
						data: {
							week: week_no,
							search_result: bets
						}
					});
				})
			}
			else
			{
				model_bet.find({
					bet_id: req.body.searchword,
					terminal_id: terminal._id,
					week: week_no,
				}, function (err, bets) {
					bets = bets.map(function (obj) {
						if (obj.win_result != "")
							return {
								bet_id: obj.bet_id,
								type: obj.type,
								option: obj.option,
								under: obj.under,
								gamelist: obj.gamelist,
								stake_amount: obj.stake_amount,
								apl: obj.apl,
								ticket_no: obj.ticket_no,
								status: obj.status,
								won_amount: obj.won_amount,
								win_result: obj.win_result
							}
						else
							return {
								bet_id: obj.bet_id,
								type: obj.type,
								option: obj.option,
								under: obj.under,
								gamelist: obj.gamelist,
								stake_amount: obj.stake_amount,
								apl: obj.apl,
								ticket_no: obj.ticket_no,
								status: obj.status
							}
					})
	
					return res.status(200).json({
						result: 1,
						message: "success",
						data: {
							week: week_no,
							search_result: bets
						}
					});
				})
			}

			

		})
	})
}

exports.ticket_list = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}
		model_setting.findOne({}, function (err, setting) {

			var week_no = req.body.week;

			if (!week_no) {
				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				week_no = setting.current_week;

				model_bet.find({terminal_id: terminal._id,week: week_no}).sort({ bet_time: -1 }).exec(function (err, bets) {
					var ticket_list = [];
					
					for(var i = 0; i < bets.length; i++)
					{
						var index = ticket_list.findIndex(function (elem) { return elem == bets[i].ticket_no; });
						if(index == -1 && ticket_list.length < 7)
							ticket_list.push(bets[i].ticket_no)
					}
					return res.status(200).json({
						result: 1,
						message: "success",
						data: {
							ticket_list: ticket_list
						}
					});
				})
			}

		})
	})
}

exports.bet_counts = function (req, res) {
	if (req.body.sn == undefined || req.body.sn == "") {
		return res.status(200).json({
			result: 1001,
			message: "sn required"
		});
	}

	if (req.body.token == undefined || req.body.token == "") {
		return res.status(200).json({
			result: 1001,
			message: "token required"
		});
	}

	model_terminal.findOne({ terminal_no: req.body.sn }, function (err, terminal) {
		if (!terminal) {
			return res.status(200).json({
				result: 1002,
				message: "sn dose not exist"
			});
		}

		if (terminal.token != req.body.token) {
			return res.status(200).json({
				result: 1002,
				message: "token mismatch"
			});
		}
		model_setting.findOne({}, function (err, setting) {

			var week_no = req.body.week;

			if (!week_no) {
				if (!setting) {
					return res.status(200).json({
						result: -1,
						message: "no setting"
					});
				}

				if (setting.current_week == undefined) {
					return res.status(200).json({
						result: -1,
						message: "no current weekno"
					});
				}

				week_no = setting.current_week;
			}
			model_bet.count({terminal_id: terminal._id, week: week_no, status: "Active"}, function (err, bets_count) {
				
				return res.status(200).json({
					result: 1,
					message: "success",
					data: {
						week: week_no,
						bets_counts: bets_count
					}
				});
			})
			

		})
	})
}







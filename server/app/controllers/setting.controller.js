'use strict';

require('rootpath')();

var md5 = require('md5');
var nodemailer = require('nodemailer');

var model_setting = require('server/app/models/setting.model');
var model_week = require('server/app/models/week.model');
var model_bet = require('server/app/models/bet.model');
var model_summary = require('server/app/models/summary.model');
var env_config = require('server/config/development');

var service = require('server/app/controllers/service.controller');

var model_terminal = require('server/app/models/terminal.model');
var model_user = require('server/app/models/user.model');

var self = this;

exports.set_currentweek = function (req, res) {
    model_setting.findOne({}, function (err, result) {
        var setting;
        if (result)
            setting = result;
        else
            setting = new model_setting({});

        setting.current_week = req.body.current_week;
        var start_at = req.body.start_at;
        var close_at = req.body.close_at;
        var validity = req.body.validity;
        var min_stake = req.body.min_stake;
        var max_stake = req.body.max_stake;

        model_week.findOneAndUpdate(
            { week_no: setting.current_week }, 
            { $set: {
                start_at: start_at,
                close_at: close_at,
                validity: validity,
                min_stake: min_stake, 
                max_stake:max_stake} 
            }, { new: true }, function (err1, result) {
            if (err1) {
                return res.status(200).json({
                    result: -1,
                    message: err.message
                });
            }else{
                model_week.findOne({ week_no: setting.current_week }, function (err, week) {
                    if (!week) {
                        return res.status(200).json({
                            result: -1,
                            message: "no current week",
                        });
                    }

                    setting.save(function (err, result) {
                        if (err) {
                            return res.status(200).json({
                                result: -1,
                                message: err.message
                            });
                        }
                        return res.status(200).json({
                            result: 1,
                            message: "success",
                            setting: result,
                            cur_week: week,
                        });

                    });

                });
            }
        });
    });
}

exports.get_setting = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {
            return res.status(200).json({
                result: -1,
                message: "no setting"
            });
        }

        model_week.findOne({ week_no: setting.current_week }, function (err, week) {
            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }

            model_week.find({ status: 'active' }, function (err, allweeks) {
                if (err) {
                    return res.status(200).json({
                        result: -1,
                        message: err.message,
                    });
                }

                model_bet.count({week: setting.current_week, status: "Void"}, function (err, bet_cnt) {

                    return res.status(200).json({
                        result: 1,
                        message: "current seting",
                        setting: setting,
                        cur_week: week,
                        all_weeks: allweeks,
                        bet_cnt: bet_cnt,
                    });
                });
            })
        });
    });
}

exports.set_riskmanager = function (req, res) {
    model_setting.findOne({}, function (err, result) {
        var setting;

        if (result)
            setting = result;
        else
            setting = new model_setting({});

        setting.risk_manager = req.body;

        setting.save(function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: -1,
                    message: err.message
                });
            }

            return res.status(200).json({
                result: 1,
                message: "success",
                setting: result,
            });
        });
    });
}

exports.get_currentweek = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                     // no setting
            return res.status(200).json({
                result: -1,
                message: err.message
            });
        }

        var current_week = setting.current_week;

        if (!current_week) {                    // no current week
            return res.status(200).json({
                result: -1,
                message: err.message
            });
        }

        return res.status(200).json({
            result: 1,
            message: 'success',
            current_week: current_week,
        });
    });
}

exports.all_options = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                     // no setting
            return res.status(200).json({
                result: -1,
                message: "no setting",
            });
        }

        var cur_weekno = setting.current_week;

        if (!cur_weekno) {                    // no current weekno
            return res.status(200).json({
                result: -1,
                message: "no current weekno",
            });
        }

        model_week.findOne({ week_no: cur_weekno }, function (err, week) {
            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }

            return res.status(200).json({
                result: 1,
                message: "all option",
                options: week.options,
            });

        });

    });
}

exports.add_option = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                     // no setting
            return res.status(200).json({
                result: -1,
                message: "no setting",
            });
        }

        var cur_weekno = setting.current_week;

        if (!cur_weekno) {                    // no current weekno
            return res.status(200).json({
                result: -1,
                message: "no current weekno",
            });
        }

        model_week.findOne({ week_no: cur_weekno }, function (err, week) {
            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }

            if (!week.options)
                week.options = [];

            if (!req.body.name) {               // requst err
                return res.status(200).json({
                    result: -1,
                    message: "no option",
                });
            }

            function hasSameName(element, index, array) {
                return element.name == req.body.name;
            }

            if (week.options.findIndex(hasSameName) != -1) { // requst err
                return res.status(200).json({
                    result: -1,
                    message: "option exists",
                });
            }

            week.options.push({ name: req.body.name, commission: req.body.commission, status: "true" });
            week.save(function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: -1,
                        message: err.message
                    });
                }

                return res.status(200).json({
                    result: 1,
                    message: "success",
                });

            });

        });

    });
}

exports.edit_option = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                     // no setting
            return res.status(200).json({
                result: -1,
                message: "no setting",
            });
        }

        var cur_weekno = setting.current_week;

        if (!cur_weekno) {                    // no current weekno
            return res.status(200).json({
                result: -1,
                message: "no current weekno",
            });
        }

        model_week.findOne({ week_no: cur_weekno }, function (err, week) {
            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }

            if (!week.options)
                week.options = [];

            if (!req.body.oldname) {               // requst err
                return res.status(200).json({
                    result: -1,
                    message: "no old name",
                });
            }

            if (!req.body.newname) {               // requst err
                return res.status(200).json({
                    result: -1,
                    message: "no new name",
                });
            }

            if (!req.body.commission) {               // requst err
                return res.status(200).json({
                    result: -1,
                    message: "no commission",
                });
            }

            model_bet.find({option: req.body.oldname, week: week.week_no}, function (err, bets) {
                
                if(bets.length != 0)
                {
                    return res.status(200).json({
                        result: -1,
                        message: "no change name",
                    });
                }

                function hasOldName(element, index, array) {
                    return element.name == req.body.oldname;
                }

                var index = week.options.findIndex(hasOldName);

                week.options[index].name = req.body.newname;
                week.options[index].commission = req.body.commission;

                model_week.findOneAndUpdate({ week_no: week.week_no }, { $set: week }, { new: true }, function (err, result) {
                    if (err) {
                        return res.status(200).json({
                            result: -1,
                            message: err.message
                        });
                    }

                });

                return res.status(200).json({
                    result: 1,
                    message: "success",
                });
            });

        });

    });
}

exports.edit_optionstatus = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                     // no setting
            return res.status(200).json({
                result: -1,
                message: "no setting",
            });
        }

        var cur_weekno = setting.current_week;

        if (!cur_weekno) {                    // no current weekno
            return res.status(200).json({
                result: -1,
                message: "no current weekno",
            });
        }

        model_week.findOne({ week_no: cur_weekno }, function (err, week) {
            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }

            var index = week.options.findIndex(function (elem) {
                return elem.name == req.body.option;
            });

            week.options[index].status = req.body.status;

            // week.save();
            model_week.findOneAndUpdate({ week_no: week.week_no }, { $set: week }, { new: true }, function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: -1,
                        message: err.message
                    });
                }

                return res.status(200).json({
                    result: 1,
                    message: "success",
                });

            });

        });

    });
}

exports.delete_option = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                     // no setting
            return res.status(200).json({
                result: -1,
                message: "no setting",
            });
        }

        var cur_weekno = setting.current_week;

        if (!cur_weekno) {                    // no current weekno
            return res.status(200).json({
                result: -1,
                message: "no current weekno",
            });
        }

        model_week.findOne({ week_no: cur_weekno }, function (err, week) {
            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }

            if (!week.options)
                week.options = [];

            if (!req.body.name) {               // requst err
                return res.status(200).json({
                    result: -1,
                    message: "no name",
                });
            }

            model_bet.find({option: req.body.name, week: week.week_no}, function (err, bets) {

                if(bets.length != 0)
                {
                    return res.status(200).json({
                        result: -1,
                        message: "option can not delete",
                    });
                }

                function hasSameName(element, index, array) {
                    return element.name == req.body.name;
                }

                var index = week.options.findIndex(hasSameName);

                if (index == -1) { // requst err
                    return res.status(200).json({
                        result: -1,
                        message: "option does not exist",
                    });
                }

                if (week.options.length <= 1) {
                    return res.status(200).json({
                        result: -1,
                        message: "at least one option should be exist",
                    });
                }

                week.options.splice(index, 1);

                model_week.findOneAndUpdate({ week_no: week.week_no }, { $set: week }, { new: true }, function (err, result) {
                    if (err) {
                        return res.status(200).json({
                            result: -1,
                            message: err.message
                        });
                    }

                    return res.status(200).json({
                        result: 1,
                        message: "success",
                    });

                });
            });

        });

    });
}

exports.set_prize = function (req, res) {
    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                     // no setting
            return res.status(200).json({
                result: -1,
                message: "no setting",
            });
        }

        var cur_weekno = setting.current_week;

        if (!cur_weekno) {                    // no current weekno
            return res.status(200).json({
                result: -1,
                message: "no current weekno",
            });
        }

        model_week.findOne({ week_no: cur_weekno }, function (err, week) {
            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }

            week.options = req.body.options;
            week.save(function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: -1,
                        message: err.message
                    });
                }

                return res.status(200).json({
                    result: 1,
                    message: "success",
                    week: result,
                });

            });

        });

    });

}

exports.set_option = function (req, res) {
    for (var i = 0; i < req.body.data.length; i++) {
        model_terminal.findOneAndUpdate({ _id: req.body.data[i]._id }, { $set: req.body.data[i] }, { new: true }, function (err, result) {
            if (!result) {
                return res.status(200).json({
                    result: -1,
                    message: "fail",
                    _id: req.body.data[i]._id,
                });
            }
        });
    }

    model_user.find({ user_role: 'user' }, function (err, users) {
        for(var i = 0; i < users.length; i++)
        {
            var data = {
                _id: users[i]._id,
                options: req.body.options,
            };
            model_user.findOneAndUpdate({ _id: users[i]._id }, { $set: data }, { new: true }, function (err, result) {
            });
        }
    });
    return res.status(200).json({
        result: 1,
        message: "success",
    });
}


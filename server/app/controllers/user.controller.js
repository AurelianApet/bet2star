'use strict';

require('rootpath')();

var md5 = require('md5');
var crypt = require('crypt');
var bin = require('charenc').bin;
var nodemailer = require('nodemailer');

var model_user = require('server/app/models/user.model');
var model_setting = require('server/app/models/setting.model');
var env_config = require('server/config/development');
var model_week = require('server/app/models/week.model');

var service = require('server/app/controllers/service.controller');

var self = this;

exports.user_all = function (req, res) {

    model_setting.findOne({}, function (err, setting) {

        if (!setting) {                  // no setting
            return res.status(200).json({
                result: -1,
                message: 'no setting',
            });
        }

        var current_week = setting.current_week;

        if (!current_week) {                    // no current week
            return res.status(200).json({
                result: -1,
                message: err.message
            });
        }
        model_week.findOne({ week_no: current_week }, function (err, week) {

            if (!week) {
                return res.status(200).json({
                    result: -1,
                    message: "no current week",
                });
            }
            var options = week.options;

            model_user.find(req.body, function (err, users) {
                if (!users) {
                    return res.status(200).json({
                        result: 0,
                        message: "no " + req.body.role,
                    });
                }
                for (var i = 0; i < users.length; i++) {

                    for (var j = 0; j < users[i].options.length; j++) {
                        users[i].options[j].current = "false";
                    }
                    for (var j = 0; j < options.length; j++) {
                        function hasSameName(element, index, array) {
                            return element.name == options[j].name;
                        }
                        var index = users[i].options.findIndex(hasSameName);

                        if (index == -1) {
                            users[i].options.push({ name: options[j].name, commission: options[j].commission });
                            index = users[i].options.length - 1;
                        }

                        if (users[i].options[index].status == undefined)
                            users[i].options[index].status = "true";
                        
                        if (users[i].options[index].commission == undefined)
                            users[i].options[index].commission = options[j].commission;

                        users[i].options[index].current = "true";                        
                    }

                    model_user.findOneAndUpdate({ _id: users[i]._id }, { $set: users[i] }, { new: true }, function (err, result) {
                            
                    });

                    if(users[i].user_password_show != null)
                        users[i].user_password_show = bin.bytesToString(crypt.base64ToBytes(users[i].user_password_show));
                }

                return res.status(200).json({
                    result: 1,
                    message: "all " + req.body.role,
                    users: users,
                    options: options,
                });
            });
        });
    });
}

exports.user_edit = function (req, res) {

    if (req.body.user_password_show != "" && req.body.user_password_show != undefined){
        req.body.user_password = md5(req.body.user_password_show);
        req.body.user_password_show = crypt.bytesToBase64(bin.stringToBytes(req.body.user_password_show));
    }
    if (req.body._id != undefined) {
        model_user.findOneAndUpdate({ _id: req.body._id }, { $set: req.body }, { new: true }, function (err, result) {
            if (!result) {
                return res.status(200).json({
                    result: -1,
                    message: "_id not exist"
                });
            }
            else {
                return res.status(200).json({
                    result: 1,
                    message: "success"
                });
            }
        });
    }
    else {

        if (req.body.user_password == undefined)
            req.body.user_password = md5('123456');

        req.body.user_token = service.token_generator(30);
        req.body.user_createdat = Date();
        var user = new model_user(req.body);

        user.save(function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: -1,
                    message: err.message
                });
            }
            // self.send_email(result.id, result.user_email, "signup");
            return res.status(200).json({
                result: 1,
                message: "success",
                user: result,
            });
        });
    }

}

exports.player_edit = function (req, res) {

    if (req.body.user_password != "" && req.body.user_password != undefined){
        req.body.user_password = md5(req.body.user_password);
        req.body.user_password_show = crypt.bytesToBase64(bin.stringToBytes(req.body.user_password_show));
    }

    if (req.body._id) {
        model_user.findOneAndUpdate({ _id: req.body._id }, { $set: req.body }, { new: true }, function (err, result) {
            if (!result) {
                return res.status(200).json({
                    result: -1,
                    message: "_id not exist"
                });
            }
            else {
                return res.status(200).json({
                    result: 1,
                    message: "success"
                });
            }
        });
    }
    else {

        if (req.body.user_password == undefined)
            req.body.user_password = md5('123456');
        var user = new model_user({
            user_id: req.body.user_id,
            user_email: req.body.user_email,
            user_password: req.body.user_password,
            user_token: service.token_generator(30),
            user_firstname: req.body.user_firstname,
            user_lastname: req.body.user_lastname,
            user_birthday: req.body.user_birthday,
            user_role: 'agent',
            user_address: req.body.user_address,
            user_city: req.body.user_city,
            user_phonenumber: req.body.user_phonenumber,
            user_avatar: "",
            user_status: true,
            user_createdat: Date(),
        });

        user.save(function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: -1,
                    message: err.message
                });
            }
            // self.send_email(result.id, result.user_email, "signup");
            return res.status(200).json({
                result: 1,
                message: "success",
                user: result,
            });
        });
    }

}

exports.staff_edit = function (req, res) {

    if (req.body.user_password != "" && req.body.user_password != undefined){
        req.body.user_password = md5(req.body.user_password);
        req.body.user_password_show = crypt.bytesToBase64(bin.stringToBytes(req.body.user_password_show));
    }

    if (req.body._id) {
        model_user.findOneAndUpdate({ _id: req.body._id }, { $set: req.body }, { new: true }, function (err, result) {
            if (!result) {
                return res.status(200).json({
                    result: -1,
                    message: "_id not exist"
                });
            }
            else {
                return res.status(200).json({
                    result: 1,
                    message: "success"
                });
            }
        });
    }
    else {

        if (req.body.user_password == undefined)
            req.body.user_password = md5('123456');
        var user = new model_user({
            user_id: req.body.user_id,
            user_email: req.body.user_email,
            user_password: req.body.user_password,
            user_token: service.token_generator(30),
            user_firstname: req.body.user_firstname,
            user_lastname: req.body.user_lastname,
            user_birthday: req.body.user_birthday,
            user_role: 'staff',
            user_address: req.body.user_address,
            user_city: req.body.user_city,
            user_phonenumber: req.body.user_phonenumber,
            user_avatar: "",
            user_status: true,
            user_createdat: Date(),
        });

        user.save(function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: -1,
                    message: err.message
                });
            }
            // self.send_email(result.id, result.user_email, "signup");
            return res.status(200).json({
                result: 1,
                message: "success",
                staff: result,
            });
        });
    }
}

exports.user_delete = function (req, res) {
    model_user.remove({ _id: req.body._id }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: 0,
                message: "fail"
            });
        }

        return res.status(200).json({
            result: 1,
            message: "success",
            user: result,
        });
    });
}

exports.user_wallet = function (req, res) {
    model_user.findOne(req.body, function (err, user) {
        if (!user) {
            return res.status(200).json({
                result: 0,
                message: "fail"
            });
        }
        if (user.user_wallet == null) {
            return res.status(200).json({
                result: 0,
                message: "fail"
            });
        }
        return res.status(200).json({
            result: 1,
            message: "success",
            user_wallet: user.user_wallet,
            user_options: user.options,
        });
    });
}

exports.user_save_commission = function (req, res) {

    for (var i = 0; i < req.body.data.length; i++) {
        model_user.findOneAndUpdate({ _id: req.body.data[i]._id }, { $set: req.body.data[i] }, { new: true }, function (err, result) {
            if (!result) {
                return res.status(200).json({
                    result: -1,
                    message: "fail",
                    _id: req.body.data[i]._id,
                });
            }
        });
    }
    return res.status(200).json({
        result: 1,
        message: "success",
    });
}
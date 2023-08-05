'use strict';

require('rootpath')();

var md5 = require('md5');
var nodemailer = require('nodemailer');

var crypt = require('crypt');
var bin = require('charenc').bin;

var model_user = require('server/app/models/user.model');
var model_setting = require('server/app/models/setting.model');
var model_week = require('server/app/models/week.model');
var env_config = require('server/config/development');

var service = require('server/app/controllers/service.controller');

var self = this;

exports.user_login = function (req, res) {
    model_user.find({}, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: 0,
                message: "no user"
            });
        }

        var flag = false;

        for (var i = 0; i < result.length; i++) {
            if ((result[i].user_id == req.body.user_nameoremail || result[i].user_email == req.body.user_nameoremail) && result[i].user_password == md5(req.body.user_password)) {
                flag = true;
                if (result[i].user_status == true) {
                    return res.status(200).json({
                        result: 1,
                        userInfo: result[i],
                    });
                }
                else {
                    return res.status(200).json({
                        result: 2,
                        message: "status is false"
                    });
                }

            }
        }

        if (flag == false)
            return res.status(200).json({
                result: 0,
                message: "no user"
            });

    });
}

exports.user_signup = function (req, res) {

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

            model_user.findOne({ user_email: req.body.user_email }, function (err, result) {
                if (!result) {
                    model_user.findOne({ user_id: req.body.user_id }, function (err, result) {
                        if (!result) {

                            var user_option = [];
                            for (var i = 0; i < options.length; i++) {
                                
                                user_option.push({ 
                                    name: options[i].name,
                                    status: "true",
                                    current: "true"
                                });                        
                            }
                            var user = new model_user({
                                user_id: req.body.user_id,
                                user_email: req.body.user_email,
                                user_password: md5(req.body.user_password),
                                user_token: service.token_generator(30),
                                user_firstname: req.body.user_firstname,
                                user_lastname: req.body.user_lastname,
                                user_birthday: req.body.user_birthday,
                                user_role: 'user',
                                user_address: req.body.user_address,
                                user_city: req.body.user_city,
                                user_phonenumber: req.body.user_phonenumber,
                                user_avatar: "",
                                user_status: true,
                                user_createdat: Date(),
                                options: user_option,
                                user_password_show: crypt.bytesToBase64(bin.stringToBytes(req.body.user_password)),
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
                                });
                            });
                        }
                        else {
                            return res.status(200).json({
                                result: -2,
                                message: "id repeat"
                            });
                        }
                    });

                }
                else {
                    return res.status(200).json({
                        result: -3,
                        message: "email repeat"
                    });
                }
            });
        });
    });

}

exports.send_email = function (user_id, user_email, mode, res) {
    var new_password = "";

    var smtpTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: env_config.account_eamil,
            pass: env_config.email_pass
        },
    });

    switch (mode) {
        case "signup":
            var url = "confirm_signup?user_id=" + user_id;

            var mailOptions = {
                from: env_config.account_eamil,
                to: user_email,
                subject: 'User SignUp',
                html: '<a href="' + env_config.server_api_url + url + '">Confirm</a>'
            };
            break;
        case "forgot_password":
            // var url = "/forgot_password/" + user_id;

            new_password = service.token_generator(10);

            var mailOptions = {
                from: env_config.account_eamil,
                to: user_email,
                subject: 'Forgot Password',
                html: '<p>New Password: ' + new_password + '</p>'
            };

            console.log(mailOptions)
            break;
        default:
            break;
    }

    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log("Mail sent error", error);
            smtpTransport.close();
            return res.status(200).json({
                result: 0,
                message: "Mail sent error"
            });

        } else {
            console.log("Mail sent success");
            smtpTransport.close();

            if (mode == "forgot_password") {
                var updateData = {
                    user_password: md5(new_password),
                    user_password_show: crypt.bytesToBase64(bin.stringToBytes(new_password)),
                }

                model_user.findOneAndUpdate({ _id: user_id }, { $set: updateData }, { new: true }, function (err, user) {
                    if (err) {
                        console.log("Mail sent error", err.message);
                        return res.status(200).json({
                            result: 0,
                            message: "Mail sent error"
                        });
                    }
                    console.log("Mail sent success");
                    return res.status(200).json({
                        result: 1
                    });
                });
            }
            else {
                console.log("Mail sent success");
            }

        }
    });
}

exports.confirm_signup = function (req, res) {
    model_user.findOne({ _id: req.query.user_id }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: 0,
                message: "no user"
            });
        }
        var updateData = {
            status: true
        }

        model_user.findOneAndUpdate({ _id: req.query.user_id }, { $set: updateData }, { new: true }, function (err, user) {
            if (err) {
                return res.status(500).send({ message: err.message });
            }
            return res.status(200).json({
                result: 1
            });
        });
    });
}

exports.forgot_password = function (req, res) {
    model_user.findOne({ user_email: req.body.user_email }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: 0,
                message: "User is not registered."
            });
        }

        if (result.user_status == false) {
            return res.status(200).json({
                result: 2,
                message: "User status is false"
            });
        }

        self.send_email(result._id, result.user_email, "forgot_password", res);
    });
}


'use strict';
/**
 * @ngdoc function
 * @name sbAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the sbAdminApp
 */
angular.module('betting')
  .controller('ForgotCtrl', function ($rootScope, $http, $scope, $position, $state, UserInfo_service, Server_api_url) {

  	$scope.user_email = '';

    $('body').addClass('bg-black');

    function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    }

    $scope.onResetPassword = function () {

		if (validateEmail($scope.user_email) == false) {
			alert('Input Your Email Correctly');
			return;
		}

		swal({
			title: "Forgot Password",
			text: "Would you like to reset password this account?",
			type: "info",
			showCancelButton: true,
			closeOnConfirm: false,
			showLoaderOnConfirm: true
		}, function () {
			var data = $.param({
				user_email: $scope.user_email,
			});

			$http.post(Server_api_url + 'forgot_password', data, UserInfo_service.http_config)
			.success(function (data, status, headers, config) {
			    if (data.result == 0)
			    	swal("Error :" + data.message);
			    else if (data.result == 2)
			        swal("Error :" + data.message);
			    else if (data.result == 1) {
		      		swal("Your password successfully reset and send your email.");
		      		$state.go('login');
			    }
			})
			.error(function (data, status, header, config) {
			    swal("Your Request Failed!");
			});
		});

    }
  });

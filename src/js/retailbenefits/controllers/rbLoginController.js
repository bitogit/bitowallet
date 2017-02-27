'use strict';

angular.module('copayApp.controllers').controller('rbLoginController', function($scope, $ionicHistory, $log, retailBenefitsService, popupService, gettextCatalog) {
  $scope.loginCredentials = {
    email: null,
    password: null
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    retailBenefitsService.needLogin(function (err, needLogin) {
      if (!needLogin) {
        $ionicHistory.goBack();
      }
    });

    // loading
    // get udat cb(resp, err):
    //    resp -> show udat
    //    err -> show form
    // submit:
    //   link user account cb(resp, err):
    //     err -> show err
    //     resp -> get udat cb(resp, err):
    //        err -> show form
    //        resp -> show form

    // rb card controller
    // get udat cb(resp, err):
    //   err -> hide
    //   resp -> show udat
  });

  $scope.login = function(loginCredentials) {
    retailBenefitsService.login(loginCredentials.email, loginCredentials.password, function (err, data) {
      if (err) {
        $log.error(err);
        popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      else {
        popupService.showAlert("Bitovation", "Login success!", function() {
          $ionicHistory.goBack();
        });
      }
    });
  };

  $scope.goHome = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.home');
  };
});

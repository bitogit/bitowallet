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
  });

  $scope.login = function(loginCredentials) {
    retailBenefitsService.login(loginCredentials.email, loginCredentials.password, function (err, data) {
      if (err) {
        $log.error(err);
        popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      else {
        $ionicHistory.goBack();
        retailBenefitsService.clearNextStep();
      }
    });
  };

  $scope.goHome = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.home');
  };
});

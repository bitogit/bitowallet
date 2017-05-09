'use strict';

angular.module('copayApp.controllers').controller('rbRegisterController', function($scope, $state, $ionicHistory, $log, retailBenefitsService, popupService, gettextCatalog) {
  $scope.registerCredentials = {
    email: null,
    password: null
  };
  $scope.passwordVisible = false;

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    retailBenefitsService.checkLoggedIn(function (err, isLoggedIn) {
      if (isLoggedIn) {
        $ionicHistory.goBack();
      }
    });
  });

  $scope.register = function(registerCredentials) {
    retailBenefitsService.register(registerCredentials.email, registerCredentials.password, function (err, data) {
      if (err) {
        $log.error(err);
        popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      else {
        $ionicHistory.removeBackView();
        retailBenefitsService.clearNextStep();
        $state.go('tabs.home');
      }
    });
  };
});

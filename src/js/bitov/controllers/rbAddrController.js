'use strict';

angular.module('copayApp.controllers').controller('rbAddrController', function($scope, $ionicHistory, $log, retailBenefitsService, popupService, gettextCatalog, walletService, profileService) {
  $scope.addr = null;
  $scope.generated = null;
  $scope.walletName = "";

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    retailBenefitsService.needAddress(function (needAddr) {
      if (!needAddr) {
        $ionicHistory.goBack();
        return;
      }
      var wallets = profileService.getWallets();
      if (wallets.length === 0) {
        return;
      }
      walletService.getAddress(wallets[0], false, function (err, addr) {
        if (err) {
          $log.error(err);
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.addr = addr;
        $scope.generated = addr;
        $scope.walletName = wallets[0].name;
      });
    });
  });

  $scope.submit = function() {
    retailBenefitsService.submitAddress($scope.addr, function (err, data) {
      if (err) {
        $log.error(err);
        popupService.showAlert(gettextCatalog.getString('Error'), err);
      }
      else {
        $ionicHistory.goBack();
        retailBenefitsService.clearAddressStep();
      }
    });
  };

  $scope.goHome = function() {
    $ionicHistory.removeBackView();
    $state.go('tabs.home');
  };
});

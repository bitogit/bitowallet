'use strict';

angular.module('copayApp.controllers').controller('tabSettingsController', function($rootScope, $timeout, $scope, $state, appConfigService, $ionicModal, $log, lodash, uxLanguage, platformInfo, profileService, feeService, configService, externalLinkService, bitpayAccountService, bitpayCardService, storageService, glideraService, gettextCatalog, buyAndSellService, popupService, retailBenefitsService) {
  $scope.bitovationLoggedIn = false;

  var updateConfig = function() {
    $scope.currentLanguageName = uxLanguage.getCurrentLanguageName();
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.wallets = profileService.getWallets();
    $scope.buyAndSellServices = buyAndSellService.getLinked();

    configService.whenAvailable(function(config) {
      $scope.unitName = config.wallet.settings.unitName;
      $scope.selectedAlternative = {
        name: config.wallet.settings.alternativeName,
        isoCode: config.wallet.settings.alternativeIsoCode
      };

      // TODO move this to a generic service
      bitpayAccountService.getAccounts(function(err, data) {
        if (err) $log.error(err);
        $scope.bitpayAccounts = !lodash.isEmpty(data);

        $timeout(function() {
          $rootScope.$apply();
        }, 10);
      });

      // TODO move this to a generic service
      bitpayCardService.getCards(function(err, cards) {
        if (err) $log.error(err);
        $scope.bitpayCards = cards && cards.length > 0;

        $timeout(function() {
          $rootScope.$apply();
        }, 10);
      });
    });
  };

  $scope.openExternalLink = function() {
    var url = appConfigService.supportUrl;
    var optIn = true;
    var title = null;
    var message = gettextCatalog.getString('Help and support information is available at the website.');
    var okText = gettextCatalog.getString('Open');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isCordova = platformInfo.isCordova;
    $scope.isDevel = platformInfo.isDevel;
    $scope.appName = appConfigService.nameCase;
    configService.whenAvailable(function(config) {
      $scope.locked = config.lock && config.lock.method;
      if (!$scope.locked || $scope.locked == 'none')
        $scope.method = gettextCatalog.getString('Disabled');
      else
        $scope.method = $scope.locked.charAt(0).toUpperCase() + config.lock.method.slice(1);
    });
    retailBenefitsService.checkLoggedIn(function (err, isLoggedIn) {
      $scope.bitovationLoggedIn = isLoggedIn;
    });
  });

  $scope.logoutRB = function() {
    popupService.showConfirm("Confirm Logout", "Are you sure?", "Logout", "Cancel", function (ok) {
      if (ok) {
        retailBenefitsService.logout(function() {
          $scope.rbUserData = {};
          retailBenefitsService.registerNextStep();
          $state.go('tabs.home');
        });
      }
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    updateConfig();
  });

});

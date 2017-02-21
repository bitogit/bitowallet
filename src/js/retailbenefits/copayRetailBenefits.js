'use strict';

var module = angular.module('copayAddon.retailBenefits', []);

angular.module('copayAddon.retailBenefits')
    .config(function ($stateProvider) {
      $stateProvider
          .state('test', {
            url: '/test',
            walletShouldBeComplete: true,
            needProfile: true,
            views: {
              'main': {
                templateUrl: 'views/retailbenefits/test.html'
              }
            }
          });
    })
    .run(function (addonManager, $state) {
      addonManager.registerAddon({
      });
    });

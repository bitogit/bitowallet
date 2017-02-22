'use strict';

var module = angular.module('copayAddon.retailBenefits', []);

angular.module('copayAddon.retailBenefits')
  .config(function ($stateProvider) {
    $stateProvider
      .state('rb.login', {
        url: '/bit-login',
        needProfile: true,
        walletShouldBeComplete: true,
        views: {
          'login': {
            controller: 'rbLoginController',
            templateUrl: 'views/retailbenefits/login.html'
          },
          // info card
        }
      });
  })
  .run(function (addonManager, nextStepsService, $state) {
    nextStepsService.register({
      title: 'Link Bitovation Account',
      name: 'linkbitovation',
      icon: 'icon-buy-bitcoin',
      sref: 'rb.login',
    });
    addonManager.registerAddon({});
  });

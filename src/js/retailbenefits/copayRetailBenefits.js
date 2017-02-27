'use strict';

var module = angular.module('copayAddon.retailBenefits', []);

angular.module('copayAddon.retailBenefits')
  .config(function ($stateProvider) {
    $stateProvider
      .state('tabs.bitovLogin', {
        url: '/bitovationLogin',
        views: {
          'tab-home@tabs': {
            controller: 'rbLoginController',
            templateUrl: 'views/retailbenefits/login.html'
          }
        }
      });
  })
  .run(function (addonManager, nextStepsService, $state) {
    nextStepsService.register({
      title: 'Link Bitovation Account',
      name: 'linkbitovation',
      icon: 'icon-buy-bitcoin',
      sref: 'tabs.bitovLogin',
    });
    addonManager.registerAddon({});
  });

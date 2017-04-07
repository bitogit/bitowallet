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
  .run(function (retailBenefitsService, $log) {
    if (retailBenefitsService.hasCredentials()) {
      retailBenefitsService.needLogin(function (err, needLogin) {
        if (needLogin) {
          retailBenefitsService.registerNextStep();
        }
      });
    }
  });

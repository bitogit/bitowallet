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
      })
      .state('tabs.bitovRegister', {
        url: '/bitovationRegister',
        views: {
          'tab-home@tabs': {
            controller: 'rbRegisterController',
            templateUrl: 'views/retailbenefits/register.html'
          }
        }
      })
      .state('tabs.bitovAddr', {
        url: '/bitovationAddr',
        views: {
          'tab-home@tabs': {
            controller: 'rbAddrController',
            templateUrl: 'views/retailbenefits/addr.html'
          }
        }
      });
  })
  .run(function (retailBenefitsService, $log) {
    if (retailBenefitsService.hasCredentials()) {
      retailBenefitsService.checkLoggedIn(function (err, isLoggedIn) {
        if (!isLoggedIn) {
          retailBenefitsService.registerNextStep();
        }
        else {
          retailBenefitsService.needAddress(function(needAddr) {
            if (needAddr) {
              retailBenefitsService.registerAddressStep();
            }
          })
        }
      });
    }
  });

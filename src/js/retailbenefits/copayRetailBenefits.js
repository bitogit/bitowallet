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
  .run(function (nextStepsService, retailBenefitsService, $log) {
    if (retailBenefitsService.hasCredentials()) {
      retailBenefitsService.needLogin(function (err, needLogin) {
        if (needLogin) {
          $log.info("NEED LOGIN");
          nextStepsService.register({
            title: 'Link Bitovation Account',
            name: 'linkbitovation',
            icon: 'icon-buy-bitcoin',
            sref: 'tabs.bitovLogin'
          });
        }
        else {
          $log.info("HAVE LOGIN");
          retailBenefitsService.getUserData(function (err, userData) {
            if (err) {
              $log.error(err);
            }
            else {
              $log.info("USERDATA!", userData);
            }
          })
        }
      });
    }
  });

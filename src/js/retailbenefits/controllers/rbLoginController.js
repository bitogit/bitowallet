'use strict';

angular.module('copayApp.controllers').controller('rbLoginController', function($scope, $ionicHistory, retailBenefitsService, lodash) {
  console.log("IN CONTROLLER");

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    console.log("HIT THE PLACE");

    if (lodash.isEmpty($scope.service)) {
      $ionicHistory.goBack();
    }

    retailBenefitsService.init();

    // loading
    // get udat cb(resp, err):
    //    resp -> show udat
    //    err -> show form
    // submit:
    //   link user account cb(resp, err):
    //     err -> show err
    //     resp -> get udat cb(resp, err):
    //        err -> show form
    //        resp -> show form

    // rb card controller
    // get udat cb(resp, err):
    //   err -> hide
    //   resp -> show udat
  });
});

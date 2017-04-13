'use strict';

angular.module('copayApp.services').factory('retailBenefitsService', function($http, $log, $window, platformInfo, storageService, lodash, nextStepsService) {
  var root = {};
  var credentials = {};
  var rbState = {
    authData: {},
    authState: 'init', // anonymous, loggingIn, authenticated, expired, refreshingAccessToken
    userData: {}
  };

  var saveState = function(cb) {
    storageService.setRetailBenefitsState(rbState, cb);
  };

  var setCredentials = function() {
    if (!$window.externalServices || !$window.externalServices.wordpress) {
      return;
    }

    var wp = $window.externalServices.wordpress;

    credentials.WP_HOST = wp.host;
  };

  var _get = function(endpoint) {
    return {
      method: 'GET',
      url: credentials.WP_HOST + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + rbState.authData['token']
      }
    };
  };

  var _post_auth = function(endpoint, data) {
    return {
      method: 'POST',
      url: credentials.WP_HOST + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + rbState.authData['token']
      },
      data: data
    };
  };

  var loadStoredStateThen = function(cb) {
    if (rbState.authState === 'init') {
      storageService.getRetailBenefitsState(function (err, storedRBState) {
        if (err) return cb(err);
        if (storedRBState !== null) {
          lodash.assign(rbState, storedRBState);
        }
        cb();
      });
    }
    else {
      cb();
    }
  };

  root.hasCredentials = function () {
    return 'WP_HOST' in credentials;
  };

  root.needLogin = function(cb /* (err, needLogin) */) {
    loadStoredStateThen(function(err) {
      if (err) return cb(err, true);
      return rbState.authState === 'authenticated';
    })
  };

  root.login = function(username, password, cb /* (err, authState) */) {
    $http({
      method: 'POST',
      url: credentials.WP_HOST + '/sso/v1/auth',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        username: username,
        password: password
      }
    }).then(function(resp) {
      rbState.authState = 'authenticated';
      rbState.authData = resp.data;

      if (rbState.userData && resp.data && ('address' in resp.data)) {
        rbState.userData.address = resp.data.address;
      }
      saveState(function (err) {
        if (err) return cb(err);
        cb(null, rbState.authState);
      });
    }, function(resp) {
      if (resp.statusText === 'Forbidden') {
        return cb("Invalid username or password");
      }
      cb("An error occurred");
      $log.error("Got " + resp.statusText + " while trying to login");
    });
  };

  root.getUserData = function (cb) {
    // CB called multiple times, once with cached, once with updated
    loadStoredStateThen(function () {
      cb(null, rbState.userData);
      $http(_get('/sso/v1/account')).then(function(resp) {
        if (!resp.data) {
          return cb("No data returned");
        }
        rbState.userData = resp.data;
        if (rbState.authData && ('address' in rbState.authData)) {
          rbState.userData.address = rbState.authData.address;
        }
        saveState(function (err) {
          if (err) return cb(err);
          cb(err, rbState.userData);
        });
      }, function(data) {
        return cb('RetailBenefits getUserData ERROR: ' + data.statusText);
      });
    });
  };

  root.registerNextStep = function() {
    nextStepsService.registerFirst({
      title: 'Link Bitovation Account',
      name: 'linkbitovation',
      icon: 'icon-bitov',
      sref: 'tabs.bitovLogin'
    });
  };

  root.clearNextStep = function() {
    nextStepsService.unregister('linkbitovation');
  };

  root.needAddress = function(cb /* bool needsAddress */) {
    loadStoredStateThen(function() {
      if ('authData' in rbState) {
        if (!('token' in rbState.authData)) {
          return cb(false);
        }
        if ('address' in rbState.authData && rbState.authData['address'] !== null) {
          return cb(false);
        }
      }
      return cb(true);
    });
  };

  root.submitAddress = function(addr, cb /* err */) {
    $http(_post_auth('/sso/v1/address', {address:addr})).then(function(data) {
      rbState.authData.address = addr;
      rbState.userData.address = addr;
      saveState(function (err) {
        if (err) return cb(err);
        cb(null);
      });
    }, function(data) {
      return cb('RetailBenefits submitAddress ERROR: ' + data.statusText);
    });
  };

  root.registerAddressStep = function() {
    nextStepsService.registerFirst({
      title: 'Submit Reward Address',
      name: 'rewardaddress',
      icon: 'icon-bitov',
      sref: 'tabs.bitovAddr'
    });
  };

  root.clearAddressStep = function (){
    nextStepsService.unregister('rewardaddress');
  };

  root.logout = function(cb) {
    storageService.setRetailBenefitsState({}, function() {
      storageService.removeRetailBenefitsState(cb);
      root.clearAddressStep();
      rbState = {};
    });
  };

  setCredentials();
  return root;
});

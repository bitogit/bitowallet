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

  var getAuthURL = function() {
    return credentials.WP_HOST + '/sso/v1/auth';
  };

  var _get = function(endpoint, nonce) {
    return {
      method: 'GET',
      url: credentials.WP_HOST + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-WP-Nonce': nonce
      },
      withCredentials: true
    };
  };

  var _post = function(endpoint, data, nonce) {
    return {
      method: 'POST',
      url: credentials.WP_HOST + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-WP-nonce': nonce
      },
      data: data,
      withCredentials: true
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
    var req = {
      method: 'POST',
      url: getAuthURL(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        username: username,
        password: password
      },
      withCredentials: true
    };

    $http(req).then(function(data) {
      rbState.authState = 'authenticated';
      rbState.authData = data.data;
      saveState(function (err) {
        if (err) return cb(err);
        cb(null, rbState.authState);
      });
    }, function(data) {
      if (data.statusText === 'Unauthorized') {
        return cb("Invalid username or password");
      }
      cb("An error occurred");
      $log.error("Got " + data.statusText + " while trying to login");
    });
  };

  root.getUserData = function (cb) {
    // CB called multiple times, once with cached, once with updated
    loadStoredStateThen(function () {
      cb(null, rbState.userData);
      $http(_get('/sso/v1/account', rbState.authData['wp-nonce'])).then(function(data) {
        rbState.userData = data.data;
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
      console.log(rbState);
      if ('authData' in rbState) {
        if (!('wp-nonce' in rbState.authData)) {
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
    $http(_post('/sso/v1/address', {address:addr}, rbState.authData['wp-nonce'])).then(function(data) {
      rbState.authData.address = addr;
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
      title: 'Submit reward address to Bitovation',
      name: 'rewardaddress',
      icon: 'icon-bitcoin',
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

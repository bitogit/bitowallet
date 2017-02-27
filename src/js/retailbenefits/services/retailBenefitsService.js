'use strict';

angular.module('copayApp.services').factory('retailBenefitsService', function($http, $log, $window, platformInfo, storageService) {
  /*
  State:
  - AuthResponse
    - Auth token
    - Expires in
    - Refresh token
  - Auth expire date
  - User data
    - Email
    - Pending Bitcoin Credit
    - Total Bitcoin Credit

  Auth States:
  - Anonymous
  - LoggingIn
  - Authenticated
  - Expired
  - RefreshingAccessToken

  Actions:
  - Get user data -> cb({user data}, err)
    - Anonymous -> cb({}, anon)
    - LoggingIn -> cb({}, loading)
    - RefreshingAccessToken -> cb({}, loading)
    - // Show loading
    - // Check state -> cb({cached}, cache)
    - Expired -> RefreshAccessToken
    - Authenticated -> get -> cb({resp}, null) -> // cache
    - cb({}, err)

  - RefreshAccessToken
    - Anonymous -> cb({}, anon)
    - LoggingIn, RefreshingAccessToken -> cb({}, loading)
    - Authenticated, Expired -> cb({resp}, null)

  - Link user account -> cb({auth response}, err)
    - LoggingIn, RefreshingAccessToken -> cb({}, loading)
    - // Show loading
    - post -> cb({resp}, null) -> state

  */

  var root = {};
  var credentials = {};
  var rbState = {
    authData: {},
    authState: 'init', // anonymous, loggingIn, authenticated, expired, refreshingAccessToken
    authExpiresAt: null,
    userData: {}
  };

  var saveState = function(cb) {
    storageService.setRetailBenefitsState(rbState, cb);
  };

  var setCredentials = function() {
    if (!$window.externalServices || !$window.externalServices.retailbenefits) {
      return;
    }

    var rb = $window.externalServices.retailbenefits;

    credentials.HOST = rb.host;
    credentials.CLIENT_ID = rb.client_id;
    credentials.CLIENT_SECRET = rb.client_secret;
  };

  var getAuthURL = function() {
    return credentials.HOST + '/v3/oauth/token';
  };


  var refreshForAuthState = function(refreshToken, cb) {
    var req = {
      method: 'POST',
      url: getAuthURL(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type: 'refresh_token',
        client_id: credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        refresh_token: refreshToken
      }
    };

    $http(req).then(function(data) {
      $log.info('RetailBenefits Authorization Access Token: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('RetailBenefits Authorization Access Token: ERROR ' + data.statusText);
      return cb('RetailBenefits Authorization Access Token: ERROR ' + data.statusText);
    });
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.HOST + '/v3' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  var _post = function(endpoint, token, data) {
    return {
      method: 'POST',
      url: credentials.HOST + '/v3' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
  };

  /*
  root.sellPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/sell', token, null, data)).then(function(data) {
      $log.info('Glidera Sell Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Sell Price: ERROR ' + data.statusText);
      return cb('Glidera Sell Price: ERROR ' + data.statusText);
    });
  };
  */

  var getAccessToken = function(cb) {
    var now = new Date();

    if (rbState.authState == 'init') {
      storageService.getRetailBenefitsState(function (err, storedRBState) {
        if (err) return cb(err);
        if (storedRBState != null) {
          _.assign(rbState, storedRBState);
        }
      });
    }

    if (rbState.authExpiresAt != null && rbState.authExpiresAt < now) {
      rbState.authState = 'expired';
      if ('refresh_token' in rbState.authData) {
        rbState.authState = 'refreshingAccessToken';
        refreshForAuthState(rbState.authData['refresh_token'], function (err, data) {
          if (err) return cb(err);
          rbState.authData = data;
          rbState.authState = 'authenticated';
          saveState();
          $log.info("Refreshed and got:", data);
          cb(null, rbState.authData['access_token']);
        });
      }
    }
    else if ('access_token' in rbState) {
      cb(null, rbState.authData['access_token']);
    }
    else {
      cb(rbState.authState);
    }
  };

  root.needLogin = function(cb) {
    $log.debug("Checking need login...");

    getAccessToken(function(err, token) {
      if (err || !token) {
        cb(null, true);
      }
      else {
        cb(null, false);
      }
    })
  };

  root.login = function(username, password, cb) {
    var req = {
      method: 'POST',
      url: getAuthURL(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type: 'password',
        client_id: credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        username: username,
        password: password
      }
    };

    $http(req).then(function(data) {
      $log.info('RetailBenefits Authorization Access Token: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('RetailBenefits Authorization Access Token: ERROR ' + data.statusText);
      return cb('RetailBenefits Authorization Access Token: ERROR ' + data.statusText);
    });
  };

  root.getUserData = function (cb) {
    cb("not implemented");
  };

  setCredentials();
  return root;
});

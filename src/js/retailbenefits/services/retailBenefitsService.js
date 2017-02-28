'use strict';

angular.module('copayApp.services').factory('retailBenefitsService', function($http, $log, $window, platformInfo, storageService, lodash) {
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

  var accessTokenExpired = function () {
    return 'created_at' in rbState.authData && 'expires_in' in rbState.authData &&
            new Date((rbState.authData['created_at'] + rbState.authData['expires_in']) * 1000) < new Date()
  };

  var loadStoredStateThen = function(cb) {
    if (rbState.authState == 'init') {
      storageService.getRetailBenefitsState(function (err, storedRBState) {
        if (err) return cb(err);
        if (storedRBState != null) {
          lodash.assign(rbState, storedRBState);
        }
        cb();
      });
    }
    else {
      cb();
    }
  };

  var getAccessToken = function(cb) {
    loadStoredStateThen(function(err) {
      if (err) return cb(err);
      if (accessTokenExpired()) {
        rbState.authState = 'expired';
        if ('refresh_token' in rbState.authData) {
          rbState.authState = 'refreshingAccessToken';
          refreshForAuthState(rbState.authData['refresh_token'], function (err, data) {
            if (err) return cb(err);
            rbState.authData = data;
            rbState.authState = 'authenticated';
            saveState(function (err) {
              if (err) return cb(err);
              cb(null, rbState.authData['access_token']);
            });
          });
        }
      }
      else if ('access_token' in rbState.authData) {
        cb(null, rbState.authData['access_token']);
      }
      else {
        cb(rbState.authState);
      }
    });
  };

  root.hasCredentials = function () {
    return 'HOST' in credentials && 'CLIENT_ID' in credentials && 'CLIENT_SECRET' in credentials;
  };

  root.needLogin = function(cb) {
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
      rbState.authState = 'authenticated';
      rbState.authData = data.data;
      saveState(function (err) {
        if (err) return cb(err);
        return cb(null, rbState.authState);
      });
    }, function(data) {
      $log.error('RetailBenefits Authorization Access Token: ERROR ' + data.statusText);
      return cb('RetailBenefits Authorization Access Token: ERROR ' + data.statusText);
    });
  };

  root.getUserData = function (cb) {
    // CB called multiple times, once with cached, once with updated
    cb(null, rbState.userData);
    getAccessToken(function (err, token) {
      if (err) return cb(err);
      $http(_get('/account', token)).then(function(data) {
        if (!data.data || data.data.length < 1) {
          return cb("Incorrect user data returned");
        }
        rbState.userData = data.data[0];
        saveState(function (err) {
          if (err) return cb(err);
          cb(err, rbState.userData);
        });
      }, function(data) {
        $log.error('RetailBenefits getUserData ERROR' + data.statusText);
        return cb('RetailBenefits getUserData ERROR' + data.statusText);
      });
    });
  };

  setCredentials();
  return root;
});

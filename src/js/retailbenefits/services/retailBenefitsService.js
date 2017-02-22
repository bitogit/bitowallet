'use strict';

angular.module('copayApp.services').factory('retailBenefitsService', function($http, $log, $window, platformInfo, storageService) {
  var root = {};
  var credentials = {};
  var isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;

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

  States:
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

  var setCredentials = function() {
    if (!$window.externalServices || !$window.externalServices.retailbenefits) {
      return;
    }

    var rb = $window.externalServices.retailbenefits;

    credentials.HOST = rb.host;
    credentials.CLIENT_ID = rb.client_id;
    credentials.CLIENT_SECRET = rb.client_secret;
  };

  root.getAuthURL = function() {
    return credentials.HOST + '/v3/oauth/token';
  };

  root.removeToken = function(cb) {
    storageService.removeRetailBenefitsToken(function() {
      return cb();
    });
  };

  root.getToken = function(username, password, cb) {
    var req = {
      method: 'POST',
      url: root.getAuthURL(),
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

  root.getAccessToken = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/oauth/token', token)).then(function(data) {
      $log.info('Glidera Access Token Permissions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Access Token Permissions: ERROR ' + data.statusText);
      return cb('Glidera Access Token Permissions: ERROR ' + data.statusText);
    });
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

  root.init = function(accessToken, cb) {
    $log.debug('Init Retail Benefits...');

    var rb = {
      token: null
    };

    var getToken = function(cb) {
      if (accessToken) {
        cb(null, accessToken);
      } else {
        storageService.getRetailBenefitsToken(cb);
      }
    };

    getToken(function(err, accessToken) {
      if (err || !accessToken) return cb();
      else {
        root.getAccessToken(accessToken, function(err, p) {
          if (err) {
            return cb(err);
          } else {
            glidera.token = accessToken;
            glidera.permissions = p;
            return cb(null, glidera);
          }
        });
      }
    });
  };


  var register = function() {
    if (isWindowsPhoneApp) return;

    storageService.getGlideraToken(credentials.NETWORK, function(err, token) {
      if (err) return cb(err);

      buyAndSellService.register({
        name: 'glidera',
        logo: 'img/glidera-logo.png',
        location: 'US Only',
        sref: 'tabs.buyandsell.glidera',
        configSref: 'tabs.preferences.glidera',
        linked: !!token,
      });
    });
  };

  setCredentials();
  register();
  return root;
});


import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Object.extend({

  authCookieName: 'esri_auth',

  portalBaseUrl: 'https://www.arcgis.com/',

  signoutUrl: Ember.computed('portalBaseUrl', function () {
    // baseURL is basically deprecated, in preference of rootURL.
    // So, we will use baseURL if present, but prefer rootURL
    let base = ENV.baseURL || ENV.rootURL;
    return this.get('portalBaseUrl') + '/sharing/rest/oauth2/signout?redirect_uri=' + window.location.protocol + '//' + window.location.host + base;
  }),

  /**
   * Initialize the adapter
   * As it starts up we basically check for various configuration
   * options, and update the defaults
   */
  init () {
    this._super.init && this._super.init.apply(this, arguments);
    if (ENV.APP.authCookieName) {
      this.set('authCookieName', ENV.APP.authCookieName);
    }
     // Unless working against a portal instance, this can be left as the default
    if (ENV.torii.providers['arcgis-oauth-bearer'].portalUrl) {
      this.set('portalBaseUrl', ENV.torii.providers['arcgis-oauth-bearer'].portalUrl);
    } else {
      Ember.warn('ENV.torii.providers[\'arcgis-oauth-bearer\'].portalUrl not defined. Defaulting to https://www.arcgis.com');
    }
  },

  /**
   * Promisified getJson
   */
  _getJson (url) {
    return new Ember.RSVP.Promise(function (resolve, reject) {
      Ember.$.ajax({
        url: url,
        dataType: 'json',
        success: Ember.run.bind(null, function (data) {
          if (data.error) {
            Ember.debug('torii:adapter:arcgis-oauth-bearer:open portals/self call shows token was not valid.');
            reject(data);
          } else {
            resolve(data);
          }
        }),
        error: Ember.run.bind(null, reject)
      });
    });
  },

  /**
   * Open a session by fetching portal/self from
   * the portal
   */
  open (authentication) {
    let token = authentication.authorizationToken.token;
    let expires = Date.now() + (authentication.authorizationToken.expires_in * 1000); // seconds from now

    // Ember.debug('torii:adapter:arcgis-oauth-bearer:open token...' + token);
    let portalSelfUrl = this.get('portalBaseUrl') + '/sharing/rest/portals/self?f=json&token=' + token;

    let signoutUrl = this.get('signoutUrl');
    // Ember.debug('signoutUrl ' + signoutUrl);
    // now use the token to call portal self
    // TODO: If we have a cookie but the token is invalid (i.e. for a different portal)
    // then this call will return a 499-in-a-200.
    return this._getJson(portalSelfUrl)
    .then((portal) => {
      Ember.debug('torii:adapter:arcgis-oauth-bearer:open got response from portal/self & assigning to session');

      if (ENV.torii.providers['arcgis-oauth-bearer'].loadGroups) {
        // make a request to get user's groups
        let username = portal.user.username;
        let userUrl = `${this.get('portalBaseUrl')}/sharing/rest/community/users/${username}?f=json&token=${token}`;
        return Ember.RSVP.hash({
          portalResponse: portal,
          userResponse: this._getJson(userUrl)
        });
      } else {
        return {
          portalResponse: portal,
          userResponse: portal.user
        };
      }
    })
    .then((result) => {
      // separate the portal and user so they are separate props on the session object
      let user = result.userResponse;
      let portal = result.portalResponse;
      // drop the user node from the portalSelf response
      delete portal.user;

      // TODO find a cleaner means to handle this iframe jiggery pokery
      if (!ENV.torii.providers['arcgis-oauth-bearer'].display || ENV.torii.providers['arcgis-oauth-bearer'].display !== 'iframe') {
        // basically - if we are not using the iframe, we need to handle the
        // login persistence ourselves so cook up an object and stuff it
        // in localStorage
        let cookieData = this._createCookieData(token, expires, user, portal);
        this._store('torii-provider-arcgis', cookieData);
      }

      return {
        portal: portal,
        currentUser: user,
        token: token,
        signoutUrl: signoutUrl
      };
    });
  },

  /**
   * Close a session (aka log out the user)
   */
  close () {
    return new Ember.RSVP.Promise(function (resolve /*, reject */) {
      // always nuke the localStorage things
      if (window.localStorage) {
        window.localStorage.removeItem('torii-provider-arcgis');
      }
      // TODO find a cleaner means to handle this iframe jiggery pokery
      if (ENV.torii.providers['arcgis-oauth-bearer'].display && ENV.torii.providers['arcgis-oauth-bearer'].display === 'iframe') {
        throw new Error('To log out of ArcGIS Online, you should redirect the browser to ' + this.get('signoutUrl'));
      }
      resolve();
    });
  },

  /**
   * Rehydrate a session by looking for the esri_auth cookie
   */
  fetch () {
    console.debug('torii-provider-arcgis.fetch called...');
    let self = this;
    return new Ember.RSVP.Promise(function (resolve, reject) {
      // try for a cookie...
      let result = self._checkCookie(self.get('authCookieName'));
      // failing that look in localStorage
      if (!result.valid) {
        result = self._checkLocalStorage('torii-provider-arcgis');
      }

      if (result.valid) {
        // degate to the ope function to do the work...
        Ember.debug('Fetch has valid client-side information... opening session...');

        // calcuate expires_in based on current timestamp
        let now = Date.now();
        let expiresIn = (result.authData.expires - now) / 1000;

        // create the expected object for open
        let authData = {
          authorizationToken: {
            token: result.authData.token,
            expires_in: expiresIn
          }
        };
        resolve(self.open(authData));
      } else {
        Ember.debug('Fetch did not find valid client-side information... rejecting');
        reject();
      }
    });
  },

  /**
   * Checks local storage for auth data
   */
  _checkLocalStorage (keyName) {
    Ember.debug('torii:adapter:arcgis-oauth-bearer:checkLocalStorage keyName ' + keyName);
    let result = {
      valid: false
    };

    if (window.localStorage) {
      let stored = window.localStorage.getItem(keyName);
      if (stored) {
        result.authData = JSON.parse(stored);
        if (new Date(result.authData.expires) > new Date()) {
          Ember.debug('torii:adapter:arcgis-oauth-bearer:checkLocalStorage authdata has not expired yet ');
          result.valid = true;
        }
      }
    }
    return result;
  },

  /**
   * Stores auth data in local storage
   */
  _store (keyName, object) {
    if (window.localStorage) {
      window.localStorage.setItem(keyName, JSON.stringify(object));
    }
  },

  /**
   * Helper to ensure consisten serialization
   */
  _createCookieData (token, expires, user, portal) {
    let data = {
      token: token,
      accountId: user.orgId,
      create: user.created,
      culture: user.culture,
      customBaseUrl: portal.customBaseUrl,
      email: user.username,
      expires: expires,
      persistent: false,
      region: user.region,
      role: user.role
    };
    return data;
  },

  /**
   * Check for and validate a cookie by name
   */
  _checkCookie (cookieName) {
    let result = {
      valid: false
    };

    let cookieString = decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(cookieName).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;// eslint-disable-line

    if (cookieString) {
      // Ember.debug('torii:adapter:arcgis-oauth-bearer:checkCookie: Found cookie...');
      // parse it
      let cookieData = JSON.parse(cookieString);
      // check if it has expired

      if (new Date(cookieData.expires) > new Date()) {
        // ok it's still valid... we still don't know if
        // it is valid for the env we are working with so but we will return it
        Ember.debug('torii:adapter:arcgis-oauth-bearer:checkCookie: cookie has not expired yet...');
      } else {
        // There is an occasional bug where it seems that we can have valid tokens
        // with expires values in the past. Where this gets really odd is that
        // when we make a call to /authorize ahd this borked cookie is sent along
        // the cookie is not overwritten w/ an updated cookie.
        // Thus, we return the auth data in either case
        Ember.debug('torii:adapter:arcgis-oauth-bearer:checkCookie: cookie has expired - but we are still going to try to use it');
      }
      result.authData = cookieData;
      result.valid = true;
    }
    return result;
  }

});

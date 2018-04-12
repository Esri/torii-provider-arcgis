/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

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
   * Open a session by fetching portal/self from
   * the portal
   */
  open (authentication) {
    // TODO?: If we have a cookie but the token is invalid (i.e. for a different portal)
    // then this call will return a 499-in-a-200.

    // instantiate an auth session from what's in the cookie
    if (!authentication.session) {
      authentication.session = arcgisRest.UserSession.deserialize(authentication.authorizationToken.serializedSession);
    }

    let signoutUrl = this.get('signoutUrl');
    
    // session is hydrated with the portal info and token
    return arcgisRest.getSelf({
      authentication: authentication.session
    })
      .then((portal) => {
        Ember.debug('torii:adapter:arcgis-oauth-bearer:open got response from portal/self & assigning to session');

        if (ENV.torii.providers['arcgis-oauth-bearer'].loadGroups) {
          // make a request to get user's groups
          let username = portal.user.username;

          const userUrl = arcgisRest.getPortalUrl({
            authentication: authentication.session
          }) + `/community/users/${username}`

          return arcgisRest.request(userUrl, {
            authentication: authentication.session
          })
            .then(response => {
              return Ember.RSVP.hash({
                portalResponse: portal,
                userResponse: response,
                session: authentication.session
              })
            })
        } else {
          return {
            portalResponse: portal,
            userResponse: portal.user,
            session: authentication.session
          };
        }
      })
      .then((result) => {
        // separate the portal and user so they are separate props on the session object
        let user = result.userResponse;
        let portal = result.portalResponse;
        // drop the user node from the portalSelf response
        delete portal.user;

        // always store the information
        let expires = Date.now() + (result.session.tokenDuration * 1000);
        let cookieData = this._createCookieData(result.session.token, expires, user, portal, result.session.serialize());
        this._store('torii-provider-arcgis', cookieData);

        return {
          portal: portal,
          currentUser: user,
          token: result.session.token,
          signoutUrl: signoutUrl,
          serializedSession: result.session.serialize()
        };
    })
  },

  /**
   * Close a session (aka log out the user)
   */
  close () {
    return new Ember.RSVP.Promise((resolve /*, reject */) => {
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
            expires_in: expiresIn,
            serializedSession: result.authData.serializedSession
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
   * Helper to ensure consistent serialization
   */
  _createCookieData (token, expires, user, portal, session) {
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
      role: user.role,
      serializedSession: session
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

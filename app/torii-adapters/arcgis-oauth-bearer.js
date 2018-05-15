/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Object.extend({

  authCookieName: 'esri_auth',

  portalBaseUrl: 'https://www.arcgis.com/',

  /**
   * Get the signout url
   */
  signoutUrl: Ember.computed('portalBaseUrl', function () {
    // baseURL is basically deprecated, in preference of rootURL.
    // So, we will use baseURL if present, but prefer rootURL
    let base = ENV.baseURL || ENV.rootURL;
    return this.get('portalBaseUrl') + '/sharing/rest/oauth2/signout?redirect_uri=' + window.location.protocol + '//' + window.location.host + base;
  }),

  /**
   * Friendlyer means to get provider settings
   */
  settings: Ember.computed('ENV.torii.providers', function () {
    return ENV.torii.providers['arcgis-oauth-bearer'];
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
    if (this.get('settings').portalUrl) {
      this.set('portalBaseUrl', this.get('settings').portalUrl);
    } else {
      Ember.warn('ENV.torii.providers[\'arcgis-oauth-bearer\'].portalUrl not defined. Defaulting to https://www.arcgis.com');
    }
  },


  /**
   * This is called from the provider.open method, and it's job is to
   * fetch additional information from the Portal and populate the torii session service
   */
  open (authentication) {
    let debugPrefix = 'torii adapter.open:: ';
    // create the sessionInfo object that we return at the end of this
    // it is *close* to the object passed in, but it is different
    const sessionInfo = {
      authType: authentication.properties.authType || 'token',
      withCredentials: authentication.properties.withCredentials,
      token: authentication.properties.token
    };
    // instantiate an auth session from what's in the cookie/url hash
    if (!authentication.authMgr) {
      Ember.debug(`${debugPrefix} Creating an AuthMgr`);
      // create the arcgis-rest-js auth manager aka UserSession
      sessionInfo.authMgr = this._createAuthManager(authentication.properties);
    } else {
      Ember.debug(`${debugPrefix} Recieved an AuthMgr`);
      sessionInfo.authMgr = authentication.authMgr;
    }

    let portalSelfPromise;
    // check if authentication.hash contains a portalSelf object
    if (authentication.properties.portalSelf) {
      // webTier has likely occured, so we can side-step the portalSelf call..
      portalSelfPromise = Ember.RSVP.resolve(authentication.properties.portalSelf);
      // get rid of the property so it does not get used in other contexts..
      delete authentication.properties.portalSelf;
    } else {
      // we have to fetch portalSelf
      portalSelfPromise = arcgisRest.getSelf({ authentication: sessionInfo.authMgr });
    }

    return portalSelfPromise
      .then((portal) => {
        Ember.debug(`${debugPrefix} Recieved portal and user information`);
        sessionInfo.portal = portal;
        sessionInfo.currentUser = portal.user;
        // reomvoe the user prop from the portal
        delete sessionInfo.portal.user;
        // check if we should load the user's groups...
        if (this.get('settings.loadGroups')) {
          Ember.debug(`${debugPrefix} Fetching user groups`);
          return this._fetchUserGroups(sessionInfo.currentUser.username, sessionInfo.authMgr)
            .then((userResponse) => {
              // use this user object...
              sessionInfo.currentUser = userResponse;
              return sessionInfo;
            });
        } else {
          return sessionInfo;
        }
      })
      .then((sessionInfo) => {
        // unless web-tier, store the information
        if (sessionInfo.authType !== 'web-tier') {
          sessionInfo.expires = sessionInfo.authMgr.tokenExpires.getTime();
          let cookieData = this._createCookieData(sessionInfo);
          this._store('torii-provider-arcgis', cookieData);
          sessionInfo.signoutUrl = this.get('signoutUrl');
        }
        /**
         * This is what is attached into the torii session service, which we access
         * in Ember apps as `session`
         */
        return sessionInfo;

    })
    .catch((ex) => {
      console.error(`${debugPrefix} exception occured ${ex}`);
    });
  },

  /**
   * Fetch the user's groups
   */
  _fetchUserGroups (username, authMgr) {
    // create the url
    const userUrl = arcgisRest.getPortalUrl({
      authentication: authMgr
    }) + `/community/users/${username}`
    // fire off the request...
    return arcgisRest.request(userUrl, { authentication: authMgr });
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
      if (this.get('settings.display') && this.get('settings.display') === 'iframe') {
        throw new Error('To log out of ArcGIS Online, you should redirect the browser to ' + this.get('signoutUrl'));
      }
      resolve();
    });
  },

  /**
   * Rehydrate a session by looking for:
   * - the esri_auth cookie or
   * - localStorage::torii-provider-arcgis
   */
  fetch () {
    let debugPrefix = 'torii adapter.fetch:: ';
    // try for a cookie...
    let savedSession = this._checkCookie(this.get('authCookieName'));
    // failing that look in localStorage
    if (!savedSession.valid) {
      savedSession = this._checkLocalStorage('torii-provider-arcgis');
    }

    // Did we get something from cookie or local storage?
    if (savedSession.valid) {
      Ember.debug(`${debugPrefix} Rehydrating session`);
      // normalize the authData hash...
      let authData = this._rehydrateSession(savedSession.properties);
      // degate to the open function to do the work...
      return this.open(authData);
    } else {
      // This is configurable so we don't even have this option for AGO
      if (this.get('settings.webTier')) {
        Ember.debug(`${debugPrefix} no local session information found. Attempting web-tier...`);
        let portalUrl = this.get('portalBaseUrl');
        return this.attemptWebTierPortalSelfCall(portalUrl)
          .then((authData) => {
            // try to open the session.
            return this.open(authData);
          })
          .catch((ex) => {
            Ember.debug(`${debugPrefix} Web-tier failed. User is not logged in. ${ex}`);
            throw new Error(`WebTier Auth not successful.`);
          });
      } else {
          Ember.debug(`${debugPrefix} Web-tier not attempted. Web-tier not enabled for this application.`);
          throw new Error(`WebTier Auth not successful.`);
      }
    }
  },

  /**
   * Attempt to call porta/self sending same-origin credentials
   * If we get a response that has a user object and user.username
   * then we have successfully authenticated using web-tier auth.
   */
  attemptWebTierPortalSelfCall (portalUrl) {
    let debugPrefix = 'torii adapter.attemptWebTierPortalSelfCall:: ';
    // we make the portal/self call directly using fetch so we can control things
    return fetch(`${portalUrl}/sharing/rest/portals/self?f=json`, { credentials: 'same-origin' })
      .then((response) => {
        return response.json();
      })
      .then((portalSelf) => {
        // many times the portal will return information w/o a token, so we
        // really want to check if we got the user back... if we did... THEN we
        // are pretty sure some web-tier auth has happened... we think.
        if (portalSelf.user && portalSelf.user.username) {
          Ember.debug(`${debugPrefix} Web-tier authentication succeeded.`);
          // in addition to returning the payload, the porta/self call should also
          // have set the esri_auth cookie... which we will now read...
          let result = this._checkCookie(this.get('authCookieName'));
          result.properties.portal = portalUrl;
          result.properties.withCredentials = true;
          let authData = this._rehydrateSession(result.properties);
          // We are sending along the portalSelf we already have so we can short circuit
          // and not make the same call again...
          authData.properties.portalSelf = portalSelf;
          return authData;
        } else {
          // we are not web-tier authenticated...
          Ember.debug(`${debugPrefix} Web-tier portal/self call succeeded but user was not returned. User is not logged in.`);
          throw new Error(`WebTier Auth not successful.`);
        }
      })
      .catch((ex) => {
        Ember.debug(`${debugPrefix} Web-tier authentication failed. User is not logged in. ${ex}`);
        throw new Error(`WebTier Auth not successful.`);
      });
  },
  /**
   * Given a hash of authentication infomation
   * create a UserSession object, whic is an IAuthenticationManager
   * which is used by arcgis-rest::request
   */
  _createAuthManager (settings) {
    let debugPrefix = 'torii adapter._createAuthManager:: ';
    Ember.debug(`${debugPrefix} Creating AuthMgr`);
    let portalUrl = this.get('settings').portalUrl + '/sharing/rest';
    let options = {
      clientId: settings.clientId,
      username: settings.username,
      token: settings.token,
      tokenDuration: parseInt(settings.expires_in),
      portal: portalUrl
    };
    // but if we happen to pass it in, use that...
    if (settings.portal) {
      options.portal = settings.portal;
    }
    // set the tokenExpires date...
    options.tokenExpires = new Date();
    options.tokenExpires.setMinutes(options.tokenExpires.getMinutes() + (options.tokenDuration -1 ));
    // create the arcgis-rest-js auth manager aka UserSession
    return new arcgisRest.UserSession(options);
  },

  _rehydrateSession (sessionInfo) {
    // create the authData object for open
    let session = {
      properties: sessionInfo
    };
    // calcuate expires_in based on current timestamp
    // web-tier auth cookie does not have the expires property
    // that is because the browser has user creds which never expire.
    // However, arcgis-rest-js's UserSession and request systems
    // expect an expiry so we will simply create one set to 8 hours
    let now = Date.now();
    let expiresIn = 8 * 60; // 8 hous

    if (sessionInfo.expires) {
      // that said, if the hash does have an expires value (which is minutes from now)
      // then we should use that (but converted to a timestamp)
      expiresIn = (sessionInfo.expires - now) / 1000;
    }
    session.properties.expires_in = expiresIn;

    // if a poral prop is on the hash - in this case it's the portalUrl
    if (sessionInfo.portal) {
      session.properties.portal = sessionInfo.portal + '/sharing/rest';
    }
    // finally, if the hash has a serializeSession, deserialize it
    if (sessionInfo.serializedSession) {
      session.authMgr = arcgisRest.UserSession.deserialize(sessionInfo.serializedSession);
      // remove  the prop...
      delete session.properties.serializedSession;
    }
    // and return the object
    return session;
  },

  /**
   * Checks local storage for auth data
   */
  _checkLocalStorage (keyName) {
    let debugPrefix = 'torii adapter.checkLocalStorage:: ';

    let result = {
      valid: false
    };

    if (window.localStorage) {
      let stored = window.localStorage.getItem(keyName);
      if (stored) {
        result.properties = JSON.parse(stored);
        if (new Date(result.properties.expires) > new Date()) {
          Ember.debug(`${debugPrefix} Found session information in Local Storage.`);
          result.valid = true;
        } else {
          Ember.debug(`${debugPrefix} Found *expired* session information in Local Storage.`);
        }
      } else {
        Ember.debug(`${debugPrefix} No session information found in Local Storage.`);
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
  _createCookieData (sessionInfo) {
    let data = {
      accountId: sessionInfo.currentUser.orgId,
      authType: sessionInfo.authType,
      create: sessionInfo.currentUser.created,
      culture: sessionInfo.currentUser.culture,
      customBaseUrl: sessionInfo.portal.customBaseUrl,
      email: sessionInfo.currentUser.username,
      expires: sessionInfo.expires,
      region: sessionInfo.currentUser.region,
      role: sessionInfo.currentUser.role,
      serializedSession: sessionInfo.authMgr.serialize(),
      token: sessionInfo.token,
      withCredentials: sessionInfo.withCredentials,
    };
    return data;
  },

  /**
   * Check for and validate a cookie by name
   */
  _checkCookie (cookieName) {
    let debugPrefix = 'torii adapter.checkCookie:: ';
    let result = {
      valid: false,
      properties: {}
    };

    let cookieString = decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(cookieName).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;// eslint-disable-line

    if (cookieString) {
      // Ember.debug('torii:adapter:arcgis-oauth-bearer:checkCookie: Found cookie...');
      // parse it
      let cookieData = JSON.parse(cookieString);
      // check if it has expired

      if (new Date(cookieData.expires) > new Date()) {
        // ok it's still valid... we still don't know if
        // it is valid for the env we are working with, but we will return it
        Ember.debug(`${debugPrefix} Cookie session has not expired yet`);
      } else {
        // There is an occasional bug where it seems that we can have valid tokens
        // with expires values in the past. Where this gets really odd is that
        // when we make a call to /authorize ahd this borked cookie is sent along
        // the cookie is not overwritten w/ an updated cookie.
        // Thus, we return the auth data in either case
        Ember.debug(`${debugPrefix} Cookie session has expired - but we are still going to try to use it`);
      }
      result.properties = cookieData;
      // check if we have the auth_tier prop in the cookie...
      // this is only present when web-tier auth is configured for Portal
      if (cookieData.auth_tier) {
        // ensure it's not present in the properties
        delete result.properties.auth_tier;
        // we have web-tier
        result.properties.withCredentials = true;
        result.properties.authType = 'web-tier';
      }
      result.valid = true;
    } else {
      Ember.debug(`${debugPrefix} No session information found in Cookie.`);
    }
    return result;
  }

});

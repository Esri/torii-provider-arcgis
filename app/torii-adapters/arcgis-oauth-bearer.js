/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import { resolve, Promise } from 'rsvp';

import { warn, debug } from '@ember/debug';
import EmberObject, { computed } from '@ember/object';
import ENV from '../config/environment';
import fetch from 'fetch';
import { UserSession, platformSelf } from "@esri/arcgis-rest-auth";
import { request } from "@esri/arcgis-rest-request";
import { getSelf, getUserUrl } from "@esri/arcgis-rest-portal";
import {
  getPortalRestUrl
} from 'torii-provider-arcgis/utils/url-utils';


export default EmberObject.extend({

  authCookieName: 'esri_apoc',


  portalBaseUrl: 'https://www.arcgis.com/',

  /**
   * Get the signout url
   */
  signoutUrl: computed('portalBaseUrl', function () {
    // baseURL is basically deprecated, in preference of rootURL.
    // So, we will use baseURL if present, but prefer rootURL
    let base = ENV.baseURL || ENV.rootURL;
    return this.get('portalBaseUrl') + '/sharing/rest/oauth2/signout?redirect_uri=' + window.location.protocol + '//' + window.location.host + base;
  }),

  /**
   * Friendlyer means to get provider settings
   */
  settings: computed('ENV.torii.providers', function () {
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
      warn('ENV.torii.providers[\'arcgis-oauth-bearer\'].portalUrl not defined. Defaulting to https://www.arcgis.com');
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
      debug(`${debugPrefix} Creating an AuthMgr`);
      // create the arcgis-rest-js auth manager aka UserSession
      sessionInfo.authMgr = this._createAuthManager(authentication.properties);
    } else {
      debug(`${debugPrefix} Recieved an AuthMgr`);
      sessionInfo.authMgr = authentication.authMgr;
    }

    let portalSelfPromise;
    // check if authentication.hash contains a portalSelf object
    if (authentication.properties.portalSelf) {
      debug(`${debugPrefix} Recieved a portalSelf - not making xhr`);
      // webTier has likely occured, so we can side-step the portalSelf call..
      portalSelfPromise = resolve(authentication.properties.portalSelf);
      // get rid of the property so it does not get used in other contexts..
      delete authentication.properties.portalSelf;
    } else {
      // we have to fetch portalSelf
      debug(`${debugPrefix} Did not recieved a portalSelf - making xhr via AGRjs::getSelf`);
      portalSelfPromise = getSelf({ authentication: sessionInfo.authMgr, fetch });
    }

    return portalSelfPromise
      .then((portal) => {
        debug(`${debugPrefix} Recieved portal and user information`);
        sessionInfo.portal = portal;
        sessionInfo.currentUser = portal.user;
        // use the portal to assign the `.portal` to the authMgr
        // authMgr expects a protocol, possible ports and paths
        sessionInfo.authMgr.portal = getPortalRestUrl(portal);
        // reomvoe the user prop from the portal
        delete sessionInfo.portal.user;
        // check if we should load the user's groups...
        if (this.get('settings.loadGroups')) {
          debug(`${debugPrefix} Fetching user groups`);
          return this._fetchUserGroups(sessionInfo.currentUser.username, sessionInfo.authMgr)
            .then((userResponse) => {
              // use this user object...
              sessionInfo.currentUser = userResponse;
              debug(`${debugPrefix} Returning session`);
              return sessionInfo;
            })
            .catch((ex) => {
              debug(`${debugPrefix} exception occured getting groups ${ex}`);
              throw new Error(`${debugPrefix} exception occured ${ex}`);
            })
        } else {
          return sessionInfo;
        }
      })
      .then((sessionInfo) => {
        // unless web-tier, store the information
        if (sessionInfo.authType !== 'web-tier') {
          sessionInfo.expires = sessionInfo.authMgr.tokenExpires.getTime();
          if (!sessionInfo.portal.isPortal) {
            // No need to store auth info in local storage on Enterprise Sites
            // since no custom domains
            let sessionData = this._serializeSession(sessionInfo);
            this._store('torii-provider-arcgis', sessionData);
          }
          sessionInfo.signoutUrl = this.get('signoutUrl');
        }
        /**
         * This is what is attached into the torii session service, which we access
         * in Ember apps as `session`
         */
        return sessionInfo;

    })
    .catch((ex) => {
      debug(`${debugPrefix} exception occured ${ex}`);
      throw new Error(`${debugPrefix} exception occured ${ex}`);
    });
  },

  /**
   * Fetch the user's groups
   */
  _fetchUserGroups (username, authMgr) {
    // create the url
    const userUrl = getUserUrl(authMgr)
    // fire off the request...
    return request(userUrl, {
      authentication: authMgr,
      httpMethod: "GET",
      fetch
    });
  },
  /**
   * Close a session (aka log out the user)
   */
  close () {
    return new Promise((resolve /*, reject */) => {
      // always nuke the localStorage things
      if (window.localStorage) {
        window.localStorage.removeItem('torii-provider-arcgis');
      }
      // TODO find a cleaner means to handle this iframe jiggery pokery
      // if (this.get('settings.display') && this.get('settings.display') === 'iframe') {
      //   throw new Error('To log out of ArcGIS Online, you should redirect the browser to ' + this.get('signoutUrl'));
      // }
      resolve();
    });
  },
  redirectUri: computed('settings', function (){
    let uri = '';
    if (this.get('settings.customRedirectUri')) {
      // get it...
      uri = this.get('settings.customRedirectUri');
      // if it does not contains a protocol,
      if (!uri.includes('http')) {
        // ensure a slash...
        if (uri[0] !== '/') {
          uri = `/${uri}`;
        }
        uri =`${this._currentBaseUrl()}${uri}`;
      }
    } else {
      // Set the redirectUri to the redirect.html that's in the addon's public
      // folder and exposed at /<addon-name>/redirect.html
      // By default torii redirects to the whole ember app, which can be really slow
      // given that it's just 10 lines of js that's needed
      if (ENV.baseURL || ENV.rootURL) {
        let path = ENV.baseURL || ENV.rootURL;
        uri = this._currentBaseUrl() + path + 'torii-provider-arcgis/redirect.html';
      } else {
        uri = this._currentBaseUrl() + '/' + 'torii-provider-arcgis/redirect.html';
      }
    }
    return uri;
  }),
  _currentBaseUrl: function () {
    return [window.location.protocol, '//', window.location.host].join('');
  },

  /**
   * Rehydrate a session by looking for:
   * - the esri_auth cookie or
   * - localStorage::torii-provider-arcgis
   */
  fetch () {
    let debugPrefix = 'torii adapter.fetch:: ';
    const clientId = this.get('settings.apiKey');
    const portal = this.get('settings.portalUrl') + '/sharing/rest';
    const redirectUri = this.get('redirectUri');
    // We want to prefer the cookie over localStorage. This is so that
    // a user can switch accounts / ENV's @ AGO, and the app should use
    // that set of creds, vs what may be in localStorage. If there is
    // no cookie, (which is the case for apps not hosted @ *.arcgis.com)
    // then we look in localStorage
    return this._tryEncryptedCookie(clientId, portal, redirectUri)
    .then((savedSession) => {
      if (!savedSession.valid) {
        savedSession = this._checkLocalStorage('torii-provider-arcgis');
      }
      if (savedSession.valid) {
        debug(`${debugPrefix} Session is valid, rehydrating session...`);
        // normalize the authData hash...
        let authData = this._rehydrateSession(savedSession.properties);
        // degate to the open function to do the work...
        return this.open(authData);
      } else {
        // This is configurable so we don't even have this option for AGO
        if (this.get('settings.webTier')) {
          debug(`${debugPrefix} no local session information found. Attempting web-tier...`);
          let portalUrl = this.get('portalBaseUrl');
          return this.attemptWebTierPortalSelfCall(portalUrl)
            .then((authData) => {
              // try to open the session.
              return this.open(authData);
            })
            .catch((ex) => {
              debug(`${debugPrefix} Web-tier failed. User is not logged in. ${ex}`);
              throw new Error(`WebTier Auth not successful.`);
            });
        } else {
            debug(`${debugPrefix} Web-tier not attempted. Web-tier not enabled for this application.`);
            throw new Error(`WebTier Auth not enabled for this application.`);
        }
      }
    })
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
          debug(`${debugPrefix} Web-tier authentication succeeded.`);
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
          debug(`${debugPrefix} Web-tier portal/self call succeeded but user was not returned. User is not logged in.`);
          throw new Error(`WebTier Auth not successful.`);
        }
      })
      .catch((ex) => {
        debug(`${debugPrefix} Web-tier authentication failed. User is not logged in. ${ex}`);
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
    debug(`${debugPrefix} Creating AuthMgr`);

    // default to the portal as defined in the torii config
    let portalUrl = this.get('settings').portalUrl + '/sharing/rest';
    debug(`${debugPrefix} Torii Config PortalUrl: ${portalUrl}`);
    // --------------------------------------------------------------------
    // for AGO, the cookie will have urlKey and customBaseUrl,
    // but we can't use this because we may be authenticating against a
    // different environment - so we *must* use the portalUrl from the
    // configuration so that the portal/self call will reject using the
    // token from the rehydrated
    // if (settings.urlKey && settings.customBaseUrl) {
    //   portalUrl = `https://${settings.urlKey}.${settings.customBaseUrl}/sharing/rest`;
    // }
    // --------------------------------------------------------------------
    let options = {
      clientId: settings.clientId,
      // in an ArcGIS Online cookie, the username is tagged as an email.
      username: settings.username ? settings.username : settings.email,
      token: settings.token,
      tokenDuration: parseInt(settings.expires_in),
      portal: portalUrl
    };
    // but if we happen to pass it in, use that...
    if (settings.portal) {
      options.portal = settings.portal;
    }
    // set the tokenExpires date...
    let expires = Date.now() + (options.tokenDuration * 1000);
    options.tokenExpires = new Date(expires);
    debug(`${debugPrefix} got expiresIn value of ${options.tokenDuration} seconds which equates to ${options.tokenExpires}`);
    // create the arcgis-rest-js auth manager aka UserSession
    let sess = new UserSession(options);
    return sess;
  },

  _rehydrateSession (sessionInfo) {
    let debugPrefix = 'torii adapter._rehydrateSession:: ';
    // debug(`${debugPrefix} Rehydrating session ${JSON.stringify(sessionInfo,null,2)}`);
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
    let expiresIn = 8 * 60 * 60; // 8 hours, in seconds
    if (sessionInfo.expires) {
      debug(`${debugPrefix} sessionInfo.expires ${sessionInfo.expires} ${new Date(sessionInfo.expires)}`);
      // that said, if the hash does have an expires value (which is a timestamp in ms)
      // then we should use that (converted to seconds from now)
      expiresIn = Math.floor((sessionInfo.expires - now) / 1000);
      debug(`${debugPrefix} which is ${expiresIn} seconds from now.`);
    }
    session.properties.expires_in = expiresIn;

    // if a poral prop is on the hash - in this case it's the portalUrl
    if (sessionInfo.portal && sessionInfo.portal.indexOf('sharing/rest') === -1 ) {
      session.properties.portal = sessionInfo.portal + '/sharing/rest';
    }
    // Previously we had serialized UserSession into localStorage
    // however, that led to issues with cross-env cookies (QA vs PROD vs DEV)
    // Using the hash we originally used pre- ArcGIS Rest JS, does not
    // have this issue.
    session.authMgr = this._createAuthManager(sessionInfo);
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
          debug(`${debugPrefix} Found session information in Local Storage.`);
          result.valid = true;
        } else {
          debug(`${debugPrefix} Found *expired* session information in Local Storage.`);
        }
      } else {
        debug(`${debugPrefix} No session information found in Local Storage.`);
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
  _serializeSession (sessionInfo) {
    let data = {
      accountId: sessionInfo.currentUser.orgId,
      authType: sessionInfo.authType,
      create: sessionInfo.currentUser.created,
      culture: sessionInfo.currentUser.culture,
      customBaseUrl: sessionInfo.portal.customBaseUrl,
      // to mimic the ArcGIS Online cookie, we tag the username as an email.
      email: sessionInfo.currentUser.username,
      expires: sessionInfo.expires,
      region: sessionInfo.currentUser.region,
      role: sessionInfo.currentUser.role,
      // serializing the session actually complicates other things
      //serializedSession: sessionInfo.authMgr.serialize(),
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
        debug(`${debugPrefix} Cookie session has not expired yet`);
      } else {
        // There is an occasional bug where it seems that we can have valid tokens
        // with expires values in the past. Where this gets really odd is that
        // when we make a call to /authorize ahd this borked cookie is sent along
        // the cookie is not overwritten w/ an updated cookie.
        // Thus, we return the auth data in either case
        debug(`${debugPrefix} Cookie session has expired - but we are still going to try to use it`);
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
      debug(`${debugPrefix} No session information found in Cookie.`);
    }
    return result;
  },

  /**
   * The encrypted platform cookie is not accessible from javascript
   * so we just shoot this off, and it may or may not return with a token.
   * @param {*} clientId
   * @param {*} portal
   * @param {*} redirectUri
   */
  _tryEncryptedCookie (clientId, portal, redirectUri) {
    let result = {
      valid: false,
      properties: {}
    };

    return platformSelf(clientId, redirectUri, portal)
    .then((response) => {
      const currentTimestamp = new Date().getTime();
      const tokenExpiresTimestamp = currentTimestamp + (response.expires_in * 1000);
      // Construct the session and return it
      result.properties = {
        portal: response.portalUrl,
        clientId,
        username: response.username,
        token: response.token,
        expires: tokenExpiresTimestamp,
        ssl: true
      };
      result.valid = true;
      return result;
    })
    .catch((err) => {
      debug(`torii.adapter._tryEncryptedCookie: ${err}. Returning no auth`);
      return result;
    });
  }

});

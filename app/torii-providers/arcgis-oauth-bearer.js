/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

/**
 * arcgis-oauth.js
 *
 * torii provider that works with ArcGIS.com oauth
 */
 import { debug } from '@ember/debug';
 import Provider from 'torii/providers/oauth2-bearer';
 import { configurable } from 'torii/configuration';
 import QueryString from './query-string';
 import ENV from '../config/environment';


 var ArcGISOAuth = Provider.extend({

   name: 'arcgis-oauth-bearer',

   // Allow the portalUrl to be passed in, but default to ago
   portalUrl: configurable('portalUrl', 'https://www.arcgis.com'),

   path: '/sharing/oauth2/authorize',

   // construct the authorize end-point url based on the portalUrl
   baseUrl: configurable('baseUrl', function () {
     return `${this.get('portalUrl')}${this.get('path')}`;
   }),

   showSocialLogins: configurable('showSocialLogins', false),

   display: configurable('display', 'default'),

   expiration: configurable('expiration', 20160),

   locale: configurable('locale', 'en-us'),
   // -----------------------------------------------------------------------
   // Note: I tried a number of things to get rid of these eslint errors,
   // and every thing I did caused things to #FAIL. Apparently torii relies
   // on this is some way. :-(
   // -----------------------------------------------------------------------
   // eslint-disable-next-line ember/avoid-leaking-state-in-ember-objects
   requiredUrlParams: ['response_type', 'showSocialLogins', 'display', 'expiration', 'locale'],
   // eslint-disable-next-line ember/avoid-leaking-state-in-ember-objects
   optionalUrlParams: ['client', 'parent', 'autoAccountCreateForSocial', 'socialLoginProviderName'],
   // eslint-disable-next-line ember/avoid-leaking-state-in-ember-objects
   responseParams: ['token', 'state', 'expires_in', 'username'],

   customRedirectUri: configurable('customRedirectUri', ''),

   _currentBaseUrl: function () {
     return [window.location.protocol, '//', window.location.host].join('');
   },

   buildQueryString: function(options){
     const requiredParams = this.get('requiredUrlParams'); // ['response_type', 'showSocialLogins', 'display', 'expiration', 'locale']; // this.get('requiredUrlParams');
     const optionalParams = this.get('optionalUrlParams');

     const qs = QueryString.create({
       provider: this,
       requiredParams: requiredParams,
       optionalParams: optionalParams,
       options
     });

     return qs.toString();
  },

  buildUrl: function(options){
    let base = this.get('baseUrl');
    if (options.portalUrl || options.path) {
      base = options.portalUrl || this.get('portalUrl');
      const path = options.path || this.get('path');
      base = `${base}${path}`;
    }
    delete options.portalUrl;
    delete options.path;

    const qs = this.buildQueryString(options);

    return [base, qs].join('?');
  },

  /**
  * shows the pop-up/iframe - we override the base implementation so
  * we can merge the passed in options into the object before we show
  * the login
  */
  open: function (options) {
    let debugPrefix = 'torii provider.open:: ';
    options = options || {};

    if (options.remoteServiceName) {
      // torii uses this to determine whether a popout or an iframe is used
      // we need to be able to pass this option in at runtime
      this.set('configuredRemoteServiceName', options.remoteServiceName);
      delete options.remoteServiceName;
    }

    const display = options.display || this.get('display');
    if (display === 'iframe') {
      // the display parameter is sent on the url querystring
      // if we are using an iframe, we need to set the parent to the current domain
      options.parent = this._currentBaseUrl(); // window.location.protocol + '//' + window.location.hostname;
    }

    let uri = '';
    // Check for a customized redirect uri. This can be useful if your app
    // is hosted by rails or some other server-side rendering system, or
    // if you have multiple apps fronted by nginx and you want to centralize
    // the redirects.
    if (this.get('customRedirectUri')) {
      // get it...
      uri = this.get('customRedirectUri');
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

    if (options.redirectUriQueryString) {
      // redirectUriQueryString allows us to pass queryParams through to the consuming app to be handled after login
      const separator = uri.includes('?') ? '&' : '?';
      uri = `${uri}${separator}${options.redirectUriQueryString}`;
    }

    this.set('redirectUri', uri);

    let name = this.get('name');
    let url = this.buildUrl(options);
    let responseParams = this.get('responseParams');
    // hopefully someone can explain to me the whole camelize() thing someday
    let clientId = this.get('clientId');
    let portalUrl = this.get('portalUrl') + '/sharing/rest';
    let redirectUri = this.get('redirectUri') + `?clientId=${clientId}`;

    // open the popup/iframe and start polling localStorage for the auth info...
    return this.get('popup').open(url, responseParams, options)
      .then(function (authData) {
        // hey look! Auth info! Let's check if we're missing anything we need...
        var missingResponseParams = [];
        responseParams.forEach(function (param) {
          if (authData[param] === undefined) {
            missingResponseParams.push(param);
          }
      });
      // if so, throw w an error. This would only happen if AGO/Portal changed it's response structure
      if (missingResponseParams.length) {
        throw new Error(`${debugPrefix} The response from the provider is missing these required response params: ${missingResponseParams.join(', ')}`);
      }
      // the server sends the username back on the hash url encoded but we should work with it decoded
      // it will get url encoded again anytime we need to use it in a url
      authData.username = decodeURIComponent(authData.username);
      // attach in more info that arcgisRest wants
      authData.clientId = clientId;
      authData.portal = portalUrl;
      // if we went through a sign-in process, then we're not dealing w/ web-tier auth...
      // thus we never have to send the IWA user credentials
      authData.withCredentials = false;
      authData.authType = 'token';
      debug(`${debugPrefix} is returning with data...`);
      // this hash it passed over to the adapter.open method
      return {
        properties: authData,
        provider: name,
        redirectUri: redirectUri
      };
    });
  }

 });

 export default ArcGISOAuth;

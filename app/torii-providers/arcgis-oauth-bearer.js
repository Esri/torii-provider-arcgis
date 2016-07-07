/**
 * arcgis-oauth.js
 *
 * torii provider that works with ArcGIS.com oauth
 */
 import Provider from 'torii/providers/oauth2-bearer';
 import {configurable} from 'torii/configuration';
 import ENV from '../config/environment';
 import Ember from 'ember';

 var ArcGISOAuth = Provider.extend({
   name: 'arcgis-oauth-bearer',

   //Allow the portalUrl to be passed in, but default to ago
   portalUrl: configurable('portalUrl', 'https://www.arcgis.com'),

   //construct the authorize end-point url based on the portalUrl
   baseUrl: configurable('baseUrl', function(){
     return this.get('portalUrl') + '/sharing/oauth2/authorize';
   }),

   showSocialLogins: configurable('showSocialLogins', false),

   display: configurable('display', 'default'),

   expiration: configurable('expiration', 20160),

   locale: configurable('locale', 'en-us'),

   //These params must be present in on the provider
   requiredUrlParams: ['response_type','showSocialLogins', 'display', 'expiration', 'locale'],
   // additional params that this provider accepts
   optionalUrlParams: ['client', 'parent'],
   //params the provider will extract from the redirected url
   responseParams:    ['token','state','expires_in'],


   _currentBaseUrl: function (){
      return [window.location.protocol,'//',window.location.host].join('');
    },
   /**
    * shows the pop-up/iframe - we override the base implementation so
    * we can merge the passed in options into the object before we show
    * the login
    */
   open: function(options){
     options = options || {};

     if(this.get('display') === 'iframe'){
       //if we are using an iframe, we need to set the parent to the current domain
       options.parent = window.location.protocol + '//' + window.location.hostname;
     }

     //since we want any passed in options to map up to the optional params...
     this.setProperties(options);

     //Set the redirectUri to the redirect.html that's in the addon's public
     //folder and exposed at /<addon-name>/redirect.html
     //By default torii redirects to the whole ember app, which can be really slow
     //given that it's just 10 lines of js that's needed

     let redirect = 'torii-provider-arcgis/redirect.html';
     if(ENV.baseURL){
       redirect = ENV.baseURL + redirect;
     }else{
       redirect = '/' + redirect;
     }
     this.set('redirectUri',  this._currentBaseUrl() + redirect);


     var name        = this.get('name'),
         url         = this.buildUrl(),
         redirectUri = this.get('redirectUri'),
         responseParams = this.get('responseParams');



     return this.get('popup').open(url, responseParams, options)
      .then(function(authData){
         var missingResponseParams = [];

         responseParams.forEach(function(param){
           if (authData[param] === undefined) {
             missingResponseParams.push(param);
           }
         });

         if (missingResponseParams.length){
           throw new Error("The response from the provider is missing " +
                 "these required response params: " + missingResponseParams.join(', '));
         }
         Ember.debug('session.open is returning with data...');
         return {
           authorizationToken: authData,
           provider: name,
           redirectUri: redirectUri
         };
       });
   }

 });

export default ArcGISOAuth;

/**
 * arcgis-oauth.js
 *
 * torii provider that works with ArcGIS.com oauth
 */
 import Provider from 'torii/providers/oauth2-bearer';
 import {configurable} from 'torii/configuration';

 var ArcGISOAuth = Provider.extend({
   name: 'arcgis-oauth-bearer',

   //Allow the portalUrl to be passed in, but default to ago
   portalUrl: configurable('portalUrl', 'https://www.arcgis.com'),

   //construct the authorize end-point url based on the portalUrl
   baseUrl: configurable('baseUrl', function(){
     return this.get('portalUrl') + '/sharing/oauth2/authorize';
   }),

   showSocialLogins: configurable('showSocialLogins', true),

   //These params must be present in on the provider
   requiredUrlParams: ['response_type','showSocialLogins'],
   // additional params that this provider accepts
   optionalUrlParams: ['client', 'display', 'expiration','parent'],
   //params the provider will extract from the redirected url
   responseParams:    ['token','state'],


   /**
    * shows the pop-up/iframe - we override the base implementation so
    * we can merge the passed in options into the object before we show
    * the login
    */
   open: function(options){

     //since we want any passed in options to map up to the optional params...
     this.setProperties(options);

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

         return {
           authorizationToken: authData,
           provider: name,
           redirectUri: redirectUri
         };
       });
   }

 });

export default ArcGISOAuth;

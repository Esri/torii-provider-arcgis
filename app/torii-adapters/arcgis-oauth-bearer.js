import Ember from 'ember';
import ENV from '../config/environment';

export default Ember.Object.extend({

  authCookieName: 'esri_auth',

  portalBaseUrl: 'https://www.arcgis.com/',

  signoutUrl: Ember.computed('portalBaseUrl', function(){
    return this.get('portalBaseUrl')  + '/sharing/rest/oauth2/signout?redirect_uri=' + window.location.protocol + '//' + window.location.host + ENV.baseURL;
  }),

  /**
   * Initialize the adapter
   * As it starts up we basically check for various configuration
   * options, and update the defaults
   */
  init(){
     if(ENV.APP.authCookieName){
        this.set('authCookieName', ENV.APP.authCookieName);
     }
     //Unless working against a portal instance, this can be left as the default
     if(ENV.APP.portalBaseUrl){
       this.set('portalBaseUrl', ENV.APP.portalBaseUrl);
     }else{
       Ember.warn('ENV.APP.portalBaseUrl not defined. Defaulting to https://www.arcgis.com');
     }
  },

  /**
   * Open a session by fetching portal/self from
   * the portal
   */
  open (authentication){
    Ember.debug('Open called...');
    let token = authentication.authorizationToken.token;
    Ember.debug('Got token...' + token);
    let portalSelfUrl = this.get('portalBaseUrl') + '/sharing/rest/portals/self?f=json&token=' + token;
    Ember.debug('PortalselfUrl ' + portalSelfUrl);
    let signoutUrl = this.get('signoutUrl');
    // Ember.debug('signoutUrl ' + signoutUrl);
    //now use the token to call portal self
    return new Ember.RSVP.Promise(function(resolve, reject){
      Ember.debug('arcgis-oauth-bearer:adapter:open making portal/self call...');
      Ember.$.ajax({
        url: portalSelfUrl,
        dataType: 'json',
        success: Ember.run.bind(null, resolve),
        error: Ember.run.bind(null, reject)
      });

    }).then((portal)=>{
      Ember.debug('arcgis-oauth-bearer:adapter:open got response from portal/self & assigning to session');
      // The returned object is merged onto the session (basically).

      //separate the portal and user so they are separate props on the
      //session object
      let user = portal.user;
      delete portal.user;
      return {
        portal: portal,
        currentUser:user,
        token: token,
        signoutUrl: signoutUrl
      };
    });
  },

  /**
   * Close a session (aka log out the user)
   */
  close(){
    return new Ember.RSVP.Promise(function(resolve, reject){
      throw new Error(
        'To log out of ArcGIS Online, you should redirect the browser to ' + this.get('signoutUrl') );
    });
  },

  /**
   * Rehydrate a session by looking for the esri_auth cookie
   */
  fetch(){
    let self = this;
    return new Ember.RSVP.Promise(function(resolve, reject){
      let cookieData = self._checkCookie(self.get('authCookieName'));
      if(cookieData.valid){
        //degate to the ope function to do the work...
        Ember.debug('Fetch has valid cookie... opening session...');
        resolve( self.open({authorizationToken: {token: cookieData.cookie.token}}) );
      }else{
        Ember.debug('Fetch did not get a cookie... rejecting');
        reject();
      }
    });
  },


  /**
   * Check for and validate a cookie by name
   */
  _checkCookie(cookieName){
    let result = {
      valid: false
    };

    let cookieString = decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(cookieName).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;

    if(cookieString){
      Ember.debug('arcgis-oauth-bearer:checkCookie: Found cookie...');
      //parse it
      let cookieData = JSON.parse(cookieString);
      //check if it has expired
      if(new Date(cookieData.expires) > new Date() ){
        //ok it's still valid... we still don't know if
        //it is valid for the env we are working with
        //but we will return it
        Ember.debug('arcgis-oauth-bearer:checkCookie: cookie has not expired yet...');
        result.cookie = cookieData;
        result.valid = true;
      }else{
        Ember.debug('arcgis-oauth-bearer:checkCookie: cookie has expired.');
      }
    }
    return result;
  },



});

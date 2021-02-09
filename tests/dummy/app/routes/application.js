/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Route from '@ember/routing/route';

import { debug } from '@ember/debug';
import { inject as service } from '@ember/service';
export default Route.extend({
  session: service(),
  async beforeModel() {
    // try to re-hydrate old sessions
    return this._initSession();
  },
  /**
   * Initialize the session, picking up identity from either cookie or local storage
   */
  _initSession () {
    const session = this.get('session');
    return session.fetch()
      .then(() => {
        debug('User has been automatically logged in... ');
        return {success: true, status: 'authenticated'};
      })
      .catch((ex) => {
        debug(`No cookie/localstorage entry was found, user is anonymous... ${ex}`);
        return {success: true, status: 'anonymous'};
      });
  },
  actions: {
    accessDenied: function () {
      this.transitionTo('signin');
    },
    signout: function () {
      // we cache this because it's incorrect after we close the session out
      const loc = this.get('session.signoutUrl');
      // redirect through /oauth2/signout?redirect_uri=
      return this.session.close()
      .then(() =>{
        // only redirect through if we're on *arcgis.com 
        if (window.location.origin.indexOf('.arcgis.com') > -1) {
          window.location = loc;
        }
        
      })
      // depending on the type of auth, we need to do different things
      // if (ENV.torii.providers['arcgis-oauth-bearer'].display && ENV.torii.providers['arcgis-oauth-bearer'].display === 'iframe') {
      //   // redirect the window to the signout url
      //   window.location = this.get('session.signoutUrl');
      // } else {
      //   this.get('session').close();
      //   window.location = this.get('session.signoutUrl') 
      //   // this.transitionTo('index');
      // }
    }
  }
});

/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Route from '@ember/routing/route';
import ENV from '../config/environment';
import { debug } from '@ember/debug';
export default Route.extend({
  beforeModel() {
    // try to re-hydrate old sessions
    // this._initSession();
  },
  /**
   * Initialize the session, picking up identity from either cookie or local storage
   */
  _initSession () {
    return this.get('session').fetch()
      .then(() => {
        debug('User has been automatically logged in... ');
        return {success: true, status: 'authenticated'};
      })
      .catch(() => {
        debug('No cookie/localstorage entry was found, user is anonymous... ');
        return {success: true, status: 'anonymous'};
      });
  },
  actions: {
    accessDenied: function () {
      this.transitionTo('signin');
    },
    signout: function () {
      // depending on the type of auth, we need to do different things
      if (ENV.torii.providers['arcgis-oauth-bearer'].display && ENV.torii.providers['arcgis-oauth-bearer'].display === 'iframe') {
        // redirect the window to the signout url
        window.location = this.get('session.signoutUrl');
      } else {
        this.get('session').close();
        // this.transitionTo('index');
      }
    }
  }
});

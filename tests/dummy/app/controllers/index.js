/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Ember from 'ember';
import ENV from '../config/environment';
export default Ember.Controller.extend({

  /**
   * Should we show signin/signout
   */
  isTokenAuth: Ember.computed('session', function () {
    return this.get('session.authType') === 'token';
  }),
  isWebTier: Ember.computed.not('isTokenAuth'),
  badDomain: Ember.computed('model', function () {
    // logic to show a warning if iframe style is requested...
    if (ENV.torii.providers['arcgis-oauth-bearer'].remoteServiceName &&
        ENV.torii.providers['arcgis-oauth-bearer'].remoteServiceName === 'iframe') {
      if (window.location.hostname.toLowerCase().indexOf('arcgis.com') > -1) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  })
});

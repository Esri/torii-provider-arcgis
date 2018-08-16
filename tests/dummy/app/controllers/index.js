/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import { not } from '@ember/object/computed';

import { computed } from '@ember/object';
import Controller from '@ember/controller';
import ENV from '../config/environment';
export default Controller.extend({

  /**
   * Should we show signin/signout
   */
  isTokenAuth: computed('session', function () {
    return this.get('session.authType') === 'token';
  }),
  isWebTier: not('isTokenAuth'),
  badDomain: computed('model', function () {
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

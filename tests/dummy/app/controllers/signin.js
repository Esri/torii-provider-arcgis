/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import { computed } from '@ember/object';

import Controller from '@ember/controller';
import ENV from '../config/environment';
export default Controller.extend({

  usingIframe: computed('ENV.torii', function () {
    return (ENV.torii.providers['arcgis-oauth-bearer'].display && ENV.torii.providers['arcgis-oauth-bearer'].display === 'iframe');
  }),

  badDomain: computed('model', function () {
    // logic to show a warning if iframe style is requested...
    if (this.get('usingIframe')) {
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

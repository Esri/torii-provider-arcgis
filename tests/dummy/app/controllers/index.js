import Ember from 'ember';
import ENV from '../config/environment';
export default Ember.Controller.extend({

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

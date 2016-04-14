import Ember from 'ember';
import ENV from '../config/environment';
export default Ember.Controller.extend({

  usingIframe: Ember.computed('ENV.torii', function(){
    return (ENV.torii.providers['arcgis-oauth-bearer'].display && ENV.torii.providers['arcgis-oauth-bearer'].display === 'iframe');
  }),

  badDomain: Ember.computed('model', function(){
    //logic to show a warning if iframe style is requested...
    if(this.get('usingIframe')){
      if(window.location.hostname.toLowerCase().indexOf('arcgis.com') > -1){
        return false;
      }else{
        return true;
      }
    }else{
      return false;
    }

  })
});

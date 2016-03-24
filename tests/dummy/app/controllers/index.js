import Ember from 'ember';

export default Ember.Controller.extend({
  badDomain: Ember.computed('model', function(){
    return !(window.location.hostname.toLowerCase().indexOf('arcgis.com') > -1);
  })
});

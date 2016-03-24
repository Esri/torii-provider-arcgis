import Ember from 'ember';
import ENV from '../config/environment';
export default Ember.Route.extend({

  //
  // onDeactivate: function(){
  //   Ember.debug('route:signin:deactivate fired...');
  // }.on('deactivate'),

  deactivate: function(){
    Ember.debug('route:signin:deactivate fired...');
  },

  actions: {
    signin: function(){

      let parent = window.location.protocol + '//' + window.location.hostname;

      this.get('session').open('arcgis-oauth-bearer', {
          parent: parent,
          display:'iframe'
        })
        .then((authorization) => {
          Ember.debug('AUTH SUCCESS: ', authorization);
          //transition to some secured route or... so whatever is needed
          this.controller.transitionToRoute('secure');
        })
        .catch((err)=>{
          Ember.debug('AUTH ERROR: ', err);
        });
    },

    /**
     * In order to show the iframe when this route loads
     * we add a didTransition hook, and then schedule the
     * session.open to be called after it's rendered
     */
    didTransition: function(){
      Ember.debug('route:signin:didTransition');

      this.controller.set('showSignInButton', false);

      let parent = window.location.protocol + '//' + window.location.hostname;
      Ember.run.schedule('afterRender', this, function(){
        this.get('session').open('arcgis-oauth-bearer', {
            parent:parent,
            display:'iframe'
          })
          .then((authorization) => {
            Ember.debug('AUTH SUCCESS: ', authorization);
            //transition to secured route
            this.controller.transitionToRoute('secure');
          })
          .catch((err)=>{
            Ember.debug('AUTH ERROR: ' + JSON.stringify(err));
          });
      });
    }
  }
});

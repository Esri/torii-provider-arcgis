import Ember from 'ember';
export default Ember.Route.extend({

  actions: {
    accessDenied: function() {
      this.transitionTo('signin');
    }
  }
});

import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('signin');
  this.authenticatedRoute('secure');
  this.route('rolesecure');
  this.route('gatekeeper');
});

export default Router;

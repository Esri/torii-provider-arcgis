/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import { inject as service } from '@ember/service';

import Route from '@ember/routing/route';

export default Route.extend({

  session: service('session'),

  // just some simple props to juggle things
  // between the beforeModel hook, which is where
  // we would usually do checks, and the model hook
  // where we prep the model
  isOrgAdmin: false,
  hasOpenDataAdmin: false,
  isAuthenticated: false,
  isInDCProdOrg: false,
  portalHostName:'',

  /**
   * Normally you would do any required role or priviledge
   * checks in beforeModel hook and transitionTo signin or
   * a not-authorized route.
   */
  beforeModel () {
    // let session = this.get('session');
    // if( session.get('isAuthenticated') === false ){
    //   this.transitionTo('signin');
    // }
  },

  /**
   * This is just here so we can force the controller to reset
   * the model when this route is reloaded with an un-authenticated user
   * THIS IS NOT NEEDED IN MOST APPS
   */
  resetController (controller /*, isExiting, transition */) {
    this.setProperties({
      isOrgAdmin: false,
      hasOpenDataAdmin: false,
      isAuthenticated: false,
      isInDCProdOrg: false
    });
    controller.set('model', null);
  },

  /**
   * For our demo, we are using the session to create a model
   * specifying the various auth states from the session
   */
  model () {
    let session = this.get('session');

    if (session.get('isAuthenticated')) {
      this.set('isAuthenticated', true);
      this.set('hasOpenDataAdmin', session.hasPrivilege('opendata:user:openDataAdmin'));
      this.set('isOrgAdmin', session.isInRole('org_admin'));
      this.set('isInDCProdOrg', session.isInOrg('bkrWlSKcjUDFDtgw'));
    }

    // let depChk = this.get('session.portalHostName');
    // Ember.debug('OrgPortalUrl should have thrown a deprecated warning but returned a value shown --> ' + depChk);

    return {
      isAuthenticated: this.get('isAuthenticated'),
      isOrgAdmin: this.get('isOrgAdmin'),
      hasOpenDataAdmin: this.get('hasOpenDataAdmin'),
      isInDCProdOrg: this.get('isInDCProdOrg'),
      portalHostName: this.get('session.portalHostName')
    };
  }
});

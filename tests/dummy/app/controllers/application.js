/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Ember from 'ember';
export default Ember.Controller.extend({

  /**
   * Should we show signin/signout
   */
  isTokenAuth: Ember.computed('session', function () {
    return this.get('session.authType') === 'token';
  }),
  isWebTier: Ember.computed.not('isTokenAuth'),
});

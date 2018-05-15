/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Ember from 'ember';
export default Ember.Controller.extend({

  /**
   * Should we show signin/signout
   */
  isTokenAuth: Ember.computed('session.authType', function () {
    return this.getWithDefault('session.authType', 'token') === 'token';
  }),
  isWebTier: Ember.computed.not('isTokenAuth'),
});

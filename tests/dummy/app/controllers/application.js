/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import { not } from '@ember/object/computed';

import { computed } from '@ember/object';
import Controller from '@ember/controller';
export default Controller.extend({

  /**
   * Should we show signin/signout
   */
  isTokenAuth: computed('session.authType', function () {
    return this.getWithDefault('session.authType', 'token') === 'token';
  }),
  isWebTier: not('isTokenAuth'),
});

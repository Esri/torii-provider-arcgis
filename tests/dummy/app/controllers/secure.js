/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Ember from 'ember';
export default Ember.Controller.extend({

  isMemberOfOpenData: Ember.computed('session', function () {
    return this.get('session').isGroupMember('17d516cf609c4e90b798205e7d26ce5e');
  }),

  isMemberOfNonGroup: Ember.computed('session', function () {
    return this.get('session').isGroupMember('NOT-A-GROUP');
  })
});

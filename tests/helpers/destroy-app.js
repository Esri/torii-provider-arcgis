/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Ember from 'ember';

export default function destroyApp (application) {
  Ember.run(application, 'destroy');
}

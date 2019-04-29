/*
 * Copyright (c) 2016-2019 Esri
 * Apache-2.0
*/

/* eslint-env node */
'use strict';

module.exports = {

  name: require('./package').name,

  isDevelopingAddon: function () {
    return false;
  }
};

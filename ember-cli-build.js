/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

/* jshint node:true */
/* global require, module */
var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
const env = EmberAddon.env() || 'development';

module.exports = function (defaults) {
  console.log(`BUILD: Env is ${env}`);
  var app = new EmberAddon(defaults, {
    // only needed so that the addon's dummy app can be run in IE
    'ember-cli-babel': {
      includePolyfill: true
    }
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  return app.toTree();
};

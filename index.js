/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

/* eslint-env node */
'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'torii-provider-arcgis',

  isDevelopingAddon: function () {
    return true;
  },

  included( /* app */ ) {
    this._super.included.apply(this, arguments);
    // bundle scripts from vendor folder
    this.import('vendor/@esri/arcgis-rest-request/request.umd.js');
    this.import('vendor/@esri/arcgis-rest-auth/auth.umd.js');
    this.import('vendor/shims/@esri/arcgis-rest-request.js');
    this.import('vendor/shims/@esri/arcgis-rest-auth.js');
  },

  treeForVendor(vendorTree) {
    var arcgisRequestTree = new Funnel(path.dirname(require.resolve('@esri/arcgis-rest-request/dist/umd/request.umd.js')), {
      files: ['request.umd.js', 'request.umd.js.map'],
      destDir: '@esri/arcgis-rest-request'
    });

    var arcgisAuthTree = new Funnel(path.dirname(require.resolve('@esri/arcgis-rest-auth/dist/umd/auth.umd.js')), {
      files: ['auth.umd.js', 'auth.umd.js.map'],
      destDir: '@esri/arcgis-rest-auth'
    });

    var treesToMerge = [arcgisRequestTree, arcgisAuthTree];
    // if we got a vendorTree, and add it in
    if (vendorTree) {
      treesToMerge.unshift(vendorTree);
    }

    return new MergeTrees(treesToMerge);
  }
};

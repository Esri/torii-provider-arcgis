/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

/* jshint node: true */
'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');

module.exports = {
  name: 'torii-provider-arcgis',

  isDevelopingAddon: function () {
    return true;
  },

  included(app) {
    this._super.included.apply(this, arguments);
    // bundle scripts from vendor folder
    this.import('vendor/@esri/arcgis-rest-request/arcgis-rest-request.umd.js');
    this.import('vendor/@esri/arcgis-rest-auth/arcgis-rest-auth.umd.js');
  },

  treeForVendor(vendorTree) {
    var arcgisRequestTree = new Funnel(path.dirname(require.resolve('@esri/arcgis-rest-request/dist/umd/arcgis-rest-request.umd.js')), {
      files: ['arcgis-rest-request.umd.js', 'arcgis-rest-request.umd.js.map'],
      destDir: '@esri/arcgis-rest-request'
    });

    var arcgisAuthTree = new Funnel(path.dirname(require.resolve('@esri/arcgis-rest-auth/dist/umd/arcgis-rest-auth.umd.js')), {
      files: ['arcgis-rest-auth.umd.js', 'arcgis-rest-auth.umd.js.map'],
      destDir: '@esri/arcgis-rest-auth'
    });


    var treesToMerge = [vendorTree, arcgisRequestTree, arcgisAuthTree];

    return new MergeTrees(treesToMerge);
  }
};

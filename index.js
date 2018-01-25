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

    this.import('vendor/arcgis-rest-request/arcgis-rest-request.umd.js');
    // this.import('vendor/shims/arcgis-rest-request/arcgis-rest-request.js');
  },

  treeForVendor(vendorTree) {
    var arcgisRestRequestTree = new Funnel(path.dirname(require.resolve('@esri/arcgis-rest-request/dist/umd/arcgis-rest-request.umd.js')), {
      files: ['arcgis-rest-request.umd.js', 'arcgis-rest-request.umd.js.map'],
      destDir: 'arcgis-rest-request'
    });

    var treesToMerge = [vendorTree, arcgisRestRequestTree];

    return new MergeTrees(treesToMerge);
  }
};

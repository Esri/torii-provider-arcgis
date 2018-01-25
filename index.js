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
  },

  treeForVendor(vendorTree) {
    var arcgisRestRequestTree = new Funnel(path.dirname(require.resolve('@esri/arcgis-rest-request/dist/umd/arcgis-rest-request.umd.js')), {
      files: ['arcgis-rest-request.umd.js', 'arcgis-rest-request.umd.js.map'],
      destDir: '@esri/arcgis-rest-request'
    });

    var treesToMerge = [vendorTree, arcgisRestRequestTree];

    return new MergeTrees(treesToMerge);
  }
};

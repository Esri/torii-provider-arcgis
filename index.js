/*    Copyright 2017 Esri
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License. */

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

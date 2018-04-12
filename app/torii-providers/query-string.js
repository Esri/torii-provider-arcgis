/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Ember from 'ember';

/*
  NOTE: this is mostly the same implementation as the default torii implementation
          the difference is that it takes an `options` which it uses when constructing the querystring
*/

var camelize = Ember.String.camelize,
    get      = Ember.get;

function isValue(value){
  return (value || value === false);
}

function getParamValue(obj, paramName, optional){
  var camelizedName = camelize(paramName),
      value         = get(obj, camelizedName);

  if (!optional) {
    if ( !isValue(value) && isValue(get(obj, paramName))) {
      throw new Error(
        'Use camelized versions of url params. (Did not find ' +
        '"' + camelizedName + '" property but did find ' +
        '"' + paramName + '".');
    }

    if (!isValue(value)) {
      throw new Error(
        'Missing url param: "'+paramName+'". (Looked for: property named "' +
        camelizedName + '".'
      );
    }
  }

  return isValue(value) ? encodeURIComponent(value) : undefined;
}

function getOptionalParamValue(obj, paramName){
  return getParamValue(obj, paramName, true);
}

export default Ember.Object.extend({
  init: function() {
    this.obj               = this.provider;
    this.urlParams         = Ember.A(Ember.copy(this.requiredParams)).uniq();
    this.optionalUrlParams = Ember.A(Ember.copy(this.optionalParams || [])).uniq();

    this.optionalUrlParams.forEach(function(param){
      if (this.urlParams.indexOf(param) > -1) {
        throw new Error("Required parameters cannot also be optional: '" + param + "'");
      }
    }, this);
  },

  toString: function() {
    const urlParams = this.urlParams;
    const optionalUrlParams = this.optionalUrlParams;
    const obj = this.obj;
    const keyValuePairs = Ember.A([]);

    const options = this.get('options');
    const optionsKeys = Object.keys(options);

    urlParams.forEach((paramName) => {
      if (!optionsKeys.includes(paramName)) {
        var paramValue = getParamValue(obj, paramName);
        keyValuePairs.push([paramName, paramValue]);
      }
    });

    optionalUrlParams.forEach((paramName) => {
      if (!optionsKeys.includes(paramName)) {
        var paramValue = getOptionalParamValue(obj, paramName);
        if (isValue(paramValue)) {
          keyValuePairs.push([paramName, paramValue]);
        }
      }
    });

    optionsKeys.forEach((paramName) => {
      keyValuePairs.push([paramName, encodeURIComponent(options[paramName])]);
    });

    return keyValuePairs.map(function(pair){
      return pair.join('=');
    }).join('&');
  }
});

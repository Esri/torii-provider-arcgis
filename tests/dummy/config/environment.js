/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/
/* eslint-env node  */
module.exports = function (environment) {
  let TARGET = process.env.TARGET || 'development';
  console.info(`TARGET: ${TARGET}`);
  var ENV = {
    modulePrefix: 'dummy',
    environment: environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // normal app stuff in here
    },
    torii: {
      sessionServiceName: 'session',
      providers: {
        'arcgis-oauth-bearer': {
          apiKey: 'zDbzLJW6W4tcxHkj', // production,
          portalUrl: 'https://www.arcgis.com',
          loadGroups: true,
          webTier: false
        }
      }
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (TARGET === 'surge') {
    ENV.locationType = 'hash';
    ENV.rootURL = '/torii-provider-arcgis/';
  }

  if (TARGET === 'ecs' || environment === 'ecs') {
    console.info('Setting ENV for ecs');
    ENV.locationType = 'hash';
    ENV.torii.providers['arcgis-oauth-bearer'].webTier = true;
    ENV.torii.providers['arcgis-oauth-bearer'].apiKey = 'arcgisonline';
    ENV.torii.providers['arcgis-oauth-bearer'].portalUrl = 'https://dev0003027.esri.com/portal';
    ENV.torii.providers['arcgis-oauth-bearer'].portalUrl = '../..';
    ENV.rootURL = '/portal/apps/torii';
  }

  return ENV;
};

/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/
import EmberRouter from '@ember/routing/router';

import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function () {
  this.route('signin');
  this.authenticatedRoute('secure');
  this.route('rolesecure');
  this.route('gatekeeper');
});

export default Router;

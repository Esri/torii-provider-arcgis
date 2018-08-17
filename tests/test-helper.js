/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import Application from '../app';
import config from '../config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';

setApplication(Application.create(config.APP));

start();

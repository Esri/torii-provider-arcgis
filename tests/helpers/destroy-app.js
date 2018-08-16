/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import { run } from '@ember/runloop';

export default function destroyApp(application) {
  run(application, 'destroy');
}

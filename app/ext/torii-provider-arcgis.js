/**
 * ext/torii-provider-arcgis.js
 *
 * This file simply re-opens the Torii Session object,
 * using the GateKeeper mixin
 */
import ToriiSession from 'torii/services/torii-session';
import GateKeeper   from 'torii-provider-arcgis/mixins/gatekeeper';

ToriiSession.reopen(GateKeeper);



/**
 * Given a portal hash, construct the correct portal hostname
 */
export function getPortalHostname (portal) {
  if (portal.isPortal) {
    return  portal.portalHostname;
  } else {
    return portal.urlKey ? `${portal.urlKey}.${portal.customBaseUrl}` : portal.portalHostname;
  }

}

/**
 * Given a portal hash, return the correct full url
 * accounting for protocol, ports, and possible paths
 */
export function getPortalUrl (portal) {
  let host = getPortalHostname(portal);
  let insertPort = false;
  const parts = splitUrl(host);
  // now check for protocols & ports...
  if (portal.allSSL || parts.protocol === 'https') {
    // assign the port regardless of what it is...
    parts.port = portal.httpsPort
    parts.protocol = 'https';
    // only inject if https port is not 443
    insertPort = portal.httpsPort !== 443;
  } else {
    insertPort = parts.port !== 443;
  }

  return assembleUrl(parts, insertPort);
}

/**
 * Disassemble a url into a hash of parts so we can reason about it
 */
export function splitUrl (url) {
  let result = {};
  if (hasProtocol(url)) {
    let parts = url.split('://');
    result.protocol = parts[0];
    result.location = parts[1];
  } else if (isProtocolRelative(url)) {
    result.protocol = 'https';
    result.location = url.split('//')[1];
  } else {
    // let's assume we want to use https
    result.protocol = 'https';
    result.location = url;
  }
  // host is the location before the / if present...
  let chk =  getHost(result.location.split('/'));
  result.host = chk.host;
  result.path = chk.path;

  if (hasPort(result.host)) {
    // order matters here...
    result.port = result.host.split(':')[1];
    result.host = result.host.split(':')[0];
  } else {
    result.port = portFromProtocol(result.protocol);
  }
  return result;
}

/**
 * Assemble a full url from a hash of parts, optionally forcing a port
 */
function assembleUrl (parts, insertPort = false) {
  let result;
  if (insertPort) {
    result = `${parts.protocol}://${parts.host}:${parts.port}`;
  } else {
    result = `${parts.protocol}://${parts.host}`;
  }

  if (parts.path) {
    result = `${result}/${parts.path}`;
  }
  return result;
}

/**
 * Helpers
 */
function hasProtocol (url) {
  return /^https?:\/\//.test(url);
}

function isProtocolRelative (url) {
  return /^\/\//.test(url);
}

function portFromProtocol (protocol) {
  return protocol === 'https' ? 443 : 80;
}

function hasPort (host) {
  return /:\d*$/.test(host);
}

function getHost ([host, ...path]) {
  return {
    host,
    path: path.join('/')
  };
}

import {
  getPortalHostname,
  splitUrl,
  getPortalUrl
} from 'dummy/utils/url-utils';
import { module, test } from 'qunit';

module('Unit | Utility | url utils');

test('constructs portalUrl using urlKey and customBaseUrl', function(assert) {
  let result = getPortalHostname({urlKey: 'foo', customBaseUrl: 'mapsqa.arcgis.com', portalHostname: 'other.foo.com'});
  assert.equal(result, 'foo.mapsqa.arcgis.com')
});

test('returns portalHostname if urlKey not defined', function(assert) {
  let result = getPortalHostname({customBaseUrl: 'mapsqa.arcgis.com', portalHostname: 'other.foo.com'});
  assert.equal(result, 'other.foo.com')
});

test('returns portalHostname if isPortal', function(assert) {
  let result = getPortalHostname({urlKey: 'wat', isPortal: true, customBaseUrl: 'mapsqa.arcgis.com', portalHostname: 'other.foo.com'});
  assert.equal(result, 'other.foo.com')
});

test('returns portalHostname if isPortal', function(assert) {
  let result = getPortalHostname({urlKey: 'wat', isPortal: true, customBaseUrl: 'mapsqa.arcgis.com', portalHostname: 'other.foo.com'});
  assert.equal(result, 'other.foo.com')
});

test('splitUrl full test', function (assert) {
  let r = splitUrl('https://some.url.com:4652/some-path/thing?q=string&other=12');
  assert.equal(r.protocol, 'https', 'should parse the protocol');
  assert.equal(r.port, 4652, 'should get port from url');
  assert.equal(r.host, 'some.url.com', 'should split out the host');
  assert.equal(r.path, 'some-path/thing?q=string&other=12', 'should split out the path');
})

test('splitUrl infers port if not present', function (assert) {
  let r = splitUrl('https://some.url.com/some-path/thing?q=string&other=12');
  assert.equal(r.protocol, 'https', 'should parse the protocol');
  assert.equal(r.port, 443, 'should infer port from protocol');
  assert.equal(r.host, 'some.url.com', 'should split out the host');
  assert.equal(r.path, 'some-path/thing?q=string&other=12', 'should split out the path');
})

test('splitUrl assume https if protocol not present', function (assert) {
  let r = splitUrl('some.url.com/some-path/thing?q=string&other=12');
  assert.equal(r.protocol, 'https', 'should assume the protocol is https');
  assert.equal(r.port, 443, 'should infer port from protocol');
  assert.equal(r.host, 'some.url.com', 'should split out the host');
  assert.equal(r.path, 'some-path/thing?q=string&other=12', 'should split out the path');
})

test('splitUrl assume https if protocol relative', function (assert) {
  let r = splitUrl('//some.url.com/some-path/thing?q=string&other=12');
  assert.equal(r.protocol, 'https', 'should assume the protocol is https');
  assert.equal(r.port, 443, 'should infer port from protocol');
  assert.equal(r.host, 'some.url.com', 'should split out the host');
  assert.equal(r.path, 'some-path/thing?q=string&other=12', 'should split out the path');
})

test('splitUrl returns defaults if just a host is passed', function (assert) {
  let r = splitUrl('some.url.com');
  assert.equal(r.protocol, 'https', 'should assume the protocol is https');
  assert.equal(r.port, 443, 'should infer port from protocol');
  assert.equal(r.host, 'some.url.com', 'should split out the host');
  assert.equal(r.path, '', 'should have empty path');
})

test('splitUrl works for a portalHostname with port and path', function (assert) {
  let r = splitUrl('some.url.com:7362/someportal');
  assert.equal(r.protocol, 'https', 'should assume the protocol is https');
  assert.equal(r.port, 7362, 'should extract the port');
  assert.equal(r.host, 'some.url.com', 'should split out the host');
  assert.equal(r.path, 'someportal', 'should have path');
})

test('getPortalUrl should work for an allSSL AGO portal', function (assert) {
  let r = getPortalUrl({
    allSSL: true,
    isPortal: false,
    urlKey: 'dcdev',
    customBaseUrl: 'mapsqa.arcgis.com',
    portalHostname: 'qaext.arcgis.com',
    httpsPort:443,
    httpPort: 80
  });
  assert.equal(r, 'https://dcdev.mapsqa.arcgis.com', 'should work for an AGO Org');
});

test('getPortalUrl should work for an allSSL Enterprise portal', function (assert) {
  let r = getPortalUrl({
    allSSL: true,
    isPortal: true,
    customBaseUrl: 'mapsqa.arcgis.com',
    portalHostname: 'some.company.org/myportal',
    httpsPort:8443,
    httpPort: 8080
  });
  assert.equal(r, 'https://some.company.org:8443/myportal', 'should work for an Enterprise Org');
});

test('getPortalUrl should work for an Enterprise portal with port in hostname', function (assert) {
  let r = getPortalUrl({
    allSSL: false,
    isPortal: true,
    customBaseUrl: 'mapsqa.arcgis.com',
    portalHostname: 'some.company.org:7080/myportal',
    httpsPort:7443,
    httpPort: 7080
  });
  assert.equal(r, 'https://some.company.org:7443/myportal', 'should work for an Enterprise Org');
});

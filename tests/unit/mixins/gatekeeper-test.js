/*
 * Copyright (c) 2016-2018 Esri
 * Apache-2.0
*/

import EmberObject from '@ember/object';
import GatekeeperMixin from 'torii-provider-arcgis/mixins/gatekeeper';
import { module, test } from 'qunit';

module('Unit | Mixin | gatekeeper');

// Replace this with your real tests.
test('returns current user', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  subject.set('currentUser', {username: 'dbouwman'});
  assert.equal(subject.get('currentUser.username'), 'dbouwman');
});

test('isAdmin- pass', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let user = {
    username: 'fakeuser',
    role: 'org_admin'
  };
  subject.set('currentUser', user);
  assert.expect(1);
  assert.ok(subject.isAdmin());
});

test('isAdmin - fail', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let user = {
    username: 'fakeuser',
    role: 'org_admin',
    roleId: 'blarg'
  };
  subject.set('currentUser', user);
  assert.expect(1);
  assert.notOk(subject.isAdmin());
});

test('isInRole', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let user = {
    username: 'fakeuser',
    role: 'someTestRole'
  };
  subject.set('currentUser', user);
  assert.expect(2);
  assert.ok(subject.isInRole('someTestRole'));
  assert.notOk(subject.isInRole('otherRole'));
});

test('isInAnyRole', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let user = {
    username: 'fakeuser',
    role: 'someTestRole'
  };
  subject.set('currentUser', user);
  assert.expect(6);
  assert.ok(subject.isInAnyRole(['fooRole', 'someTestRole', 'bazRole']));
  assert.ok(subject.isInAnyRole(['someTestRole', 'bazRole']));
  assert.ok(subject.isInAnyRole(['fooRole', 'someTestRole']));
  assert.ok(subject.isInAnyRole(['someTestRole']));
  assert.notOk(subject.isInRole(['otherRole']));
  assert.notOk(subject.isInRole(['otherRole', 'fooRole']));
});

test('hasPrivilege', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let user = {
    username: 'fakeuser',
    privileges: ['fake:one', 'fake:two', 'fake:three']
  };
  subject.set('currentUser', user);
  assert.expect(4);
  assert.ok(subject.hasPrivilege('fake:one'));
  assert.ok(subject.hasPrivilege('fake:two'));
  assert.ok(subject.hasPrivilege('fake:three'));
  assert.notOk(subject.isInRole('other:fake'));
});

test('hasAnyPrivilege', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let user = {
    username: 'fakeuser',
    privileges: ['fake:one', 'fake:two', 'fake:three']
  };
  subject.set('currentUser', user);
  assert.expect(5);
  assert.ok(subject.hasAnyPrivilege(['fake:one', 'some:other']));
  assert.ok(subject.hasAnyPrivilege(['yet:another', 'fake:one', 'some:other']));
  assert.ok(subject.hasAnyPrivilege(['yet:another', 'fake:two', 'some:other']));
  assert.ok(subject.hasAnyPrivilege(['fake:three']));
  assert.notOk(subject.hasAnyPrivilege(['other:fake']));
});

test('hasAllPrivileges', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let user = {
    username: 'fakeuser',
    privileges: ['fake:one', 'fake:two', 'fake:three']
  };
  subject.set('currentUser', user);
  assert.expect(5);
  assert.ok(subject.hasAllPrivileges(['fake:one', 'fake:two']));
  assert.ok(subject.hasAllPrivileges(['fake:one', 'fake:three']));
  assert.ok(subject.hasAllPrivileges(['fake:two', 'fake:three']));
  assert.ok(subject.hasAllPrivileges(['fake:three']));
  assert.notOk(subject.hasAllPrivileges(['other:fake', 'fake:one']));
});

test('isInOrg', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let portal = {
    id: 'ABC123'
  };
  subject.set('portal', portal);
  assert.expect(2);
  assert.ok(subject.isInOrg('ABC123'));
  assert.notOk(subject.isInOrg('123ABC'));
});

test('isInAnyOrg', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  let portal = {
    id: 'ABC123'
  };
  subject.set('portal', portal);
  assert.expect(3);
  assert.ok(subject.isInAnyOrg(['OTHER', 'ABC123', 'MORE']));
  assert.ok(subject.isInAnyOrg(['ABC123']));
  assert.notOk(subject.isInAnyOrg(['OTHER']));
});

test('userHubHome', function (assert) {
  let GatekeeperObject = EmberObject.extend(GatekeeperMixin);
  let subject = GatekeeperObject.create();
  const customHomeUrl = 'my home url';
  subject.set('portal', {
    id: 'ABC123',
    portalProperties: { hub: { settings: { hubHome: customHomeUrl } } },
  });
  assert.equal(subject.userHubHome, customHomeUrl, 'userHubHome is an alias for portalProperties.hub.settings.hubHome if set');

  const urlKey = 'my-org';
  subject.set('portal', {
    id: 'ABC123',
    portalProperties: { hub: { settings: { hubHome: null } } },
    urlKey
  });
  subject.set('portalUrl', 'https://orgname.mapsqa.arcgis.com');
  assert.equal(subject.userHubHome, `https://${urlKey}.hubqa.arcgis.com`, 'userHubHome correctly generated if portalProperties.hub.settings.hubHome unset');
});

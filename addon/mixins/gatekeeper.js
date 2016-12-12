/**
 * mixins/gatekeeper.js
 *
 * Used to extend the ToriiSession with ArcGIS specific helper methods
 *
 */
import Ember from 'ember';

export default Ember.Mixin.create({
  /**
   * Check if the current user is in a specific role
   * In ArcGIS Online, users can only have a single role.
   */
  isInRole (role) {
    let user = this.get('currentUser');

    if (user) {
      return user.role === role;
    } else {
      return false;
    }
  },

  /**
   * Is the specified priviledge is the list of priviledges
   * assigned to the current user?
   */
  hasPrivilege (privilege) {
    let user = this.get('currentUser');
    if (user) {
      return (user.privileges.indexOf(privilege) > -1);
    } else {
      return false;
    }
  },

  /**
   * Does the current user have any of the passed in privileges
   */
  hasAnyPrivilege (privileges) {
    let result = false;
    // check that we have an array
    if (Ember.isArray(privileges)) {
      for (var i = 0; i < privileges.length; i++) {
        if (this.hasPrivilege(privileges[i])) {
          result = true;
        }
      }
    } else {
      Ember.warn('Session.hasAnyPrivilege was not passed an array. Please use .hasPrivilege instead.');
    }
    return result;
  },

  /**
   * Allows for quick check if a user is in a set of roles
   */
  isInAnyRole (roles) {
    let result = false;
    // check that we have an array
    if (Ember.isArray(roles)) {
      for (var i = 0; i < roles.length; i++) {
        if (this.isInRole(roles[i])) {
          result = true;
        }
      }
    } else {
      Ember.warn('Session.isInAnyRole was not passed an array. Please use .isInRole instead.');
    }
    return result;
  },

  /**
   * Check if the user is in a specific org.
   * This is used in conjunction with feature flags
   * to control access to features under development
   */
  isInOrg (orgId) {
    let portal = this.get('portal');
    if (portal) {
      return (portal.id === orgId);
    } else {
      return false;
    }
  },

  /**
   * Allows for a quick check if a user is a member of
   * any of a set of orgs
   */
  isInAnyOrg (orgs) {
    let result = false;
    // check that we have an array
    if (Ember.isArray(orgs)) {
      for (var i = 0; i < orgs.length; i++) {
        if (this.isInOrg(orgs[i])) {
          result = true;
        }
      }
    } else {
      Ember.warn('Session.isInAnyOrg was not passed an array. Please use .isInOrg instead.');
    }
    return result;
  },

  /**
   * Returns a protocol-less hostname for the Portal
   */
  portalHostName: Ember.computed('isAuthenticated', function () {
    let result;
    if (this.get('isAuthenticated')) {
      const portal = this.get('portal');
      const urlKey = portal.urlKey;
      result = portal.portalHostname;

      if (urlKey) {
        result = `${urlKey}.${portal.customBaseUrl}`;
      }
    } else {
      const config = Ember.getOwner(this).resolveRegistration('config:environment');
      result = config.torii.providers['arcgis-oauth-bearer'].portalUrl;
      result = result.replace(/https?:\/\//, '');
    }
    return result;
  }),

  /**
   * Deprecated - use portalHostName
   */
  orgPortalUrl: Ember.computed.deprecatingAlias('portalHostName', {
    id: 'torii-provider-arcgis::orgPortalUrl',
    until: '10.0.0'
  })
});

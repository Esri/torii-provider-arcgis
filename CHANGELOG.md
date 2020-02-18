# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic
Versioning](http://semver.org/).

## [3.2.0]
### Added
- `arcgis-oath-bearer::open` handles `redirectUriQueryString` option by appending it to the redirectUri

## [3.1.0]
### Changed
- url decode username we get back on the url hash

## [3.0.0]

### Changed
- allow `customRedirectUri` to be a path (i.e. /redirect.html) instead of just a full url. If a path, prepend the current window.location.
- ArcGIS REST JS v2.x is now used under the hood
- ember-auto-import is now used to load ArcGIS REST JS

## [2.2.1]
### Changed
- nothing - release snafu

## [2.2.0]
### Changed
- added `@esri/arcgis-rest-common-types` to dependencies

## [2.1.2]
### Changed
- upgraded to ember-fetch 6.2.0

## [2.1.1]
### Fixed
- bug where subsequent reloads would keep extending the token expiry by a massive factor. On the third reload, the timestamp was so large it was an invalid date.

## [2.1.0]
### Changed
- do not serialize `UserSession` into local storage
- when fetching portalSelf, always use the url from the torii config, as this forces an existing token to be used against the configured API, which will cause things to reject if we have a valid token that's for a different environment (DEV/QA/PROD)


## [2.0.1]
### Fixed
- set isDevelopingAddon to false

## [2.0.0]
### Breaking Change
- `session.authMgr.portal` will now be the full ssl org portal url, using the ports and paths from the portalSelf hash

## [1.1.6]
### Fixed
- match behavior of ArcGIS Online cookie, which caches usernames as an `email`.

## [1.1.5]
### Fixed
- correctly cache `username` and `email` when an authentication session is initiated.

## [1.1.4]
### Changed
- bump arcgis-rest-js dependencies to `v1.7.1`
- use shims instead of relying on the `arcgisRest` global.

### Fixed
- use a `GET` to fetch user metadata to sidestep situations in which a `302` redirect doesn't pass along the request body.

## [1.1.3]
### Fixed
- adapter was not but should have been `throw`-ing an exception out of `open`

## 1.1.2
### Eaten by npm...

## 1.1.1
### Fixed
- removed debugger in `redirect.html`

## 1.1.0
### Changed
- bumped arcgis-rest-js dependencies to 1.2.1

## 1.0.3
### Changed
- typo in the 1.0.3 change


## 1.0.2
### Changed
- include the `request.umd.js` file which is the actual current build output from ArcGIS Rest JS

## 1.0.1
### Changed
- fixed eslint error re: unused var in `/app/ext/torii-provider-arcgis.js`
- fixed for Ember 2.18.x build error when vendorTree is null

## 1.0.0
### Added
- support for web-tier authentication
- `session.authType` with values of `token` or `web-tier`
- `session.withCredentials`, will be `true` if `authType === web-tier`
- `session.authMgr` which is an `IAuthenticationManager` to allow consuming apps to pass this into `arcgis-rest-js` methods
- added `npm run build:ecs` which sets a `TARGET` env var to allow the `ecs` target to use the production build of ember.

### Changed
- uses `arcgis-rest-js` internally

## [0.12.0] - 2018-01-22
### Changed
- upgrade torii to 0.9.6

## 0.11.0
### Added
- isPublicUser CP on session
- isCommunityOrgUser CP on session
- isEsriUser CP on session

## 0.10.0
### Changed
- always store token - even if using iframe. This is because portal may not set the `esri_auth` cookie during it's login process, if it's not perfectly configured. So - we will just always store the credentials ourselves.

## 0.9.0
### Changed
- upgrade to torii v 0.8.4 for compatibility with ember > 2.12.0

## 0.8.1
### Changed
- when constructing the url for iframed oauth, pass the port with the `parent` param, as Firefox now requires an exact match including port on the `X-Frame-Options` header

## 0.8.0

### Added
- ability to change remoteServiceName at runtime

## 0.7.0
## Added
- isLevelOne and isLevelTwo CPs to session

## Fixed
- null reference error because this was undefined

## Changed
- arcgis-oauth-bearer handles options differently - we now do not `set` the options on the bearer
- arcgis-oath-bearer now handles additional queryString params: autoAccountCreateForSocial & socialLoginProviderName

## [0.6.0]
### Added
- `isAdmin()` which will returnt true if `role === 'org_admin' && !roleId` - which is how we know if a user is a FULL org admin
-

## [0.5.0]
### Added
- configuration option to loadGroups during sign-in process. This makes an additional xhr to `/community/users/{username}` which returns the users groups.
- added `isGroupMember` to the gatekeeper which is exposed as `session.isGroupMember(groupId)` in consuming applications

## [0.4.3]
### Fixed
- typo in gatekeeper.js

## [0.4.2]
### Changed
- fix error in portalHostname (it used `portalHostName` instead of `portalHostname` from portal.self)
- deprecate `portalHostName` in favor of `portalHostname`

## [0.4.1]
### Changed
- removed all use of `ENV.APP.portalBaseUrl` in favor of `ENV.torii.providers['arcgis-oauth-bearer'].portalUrl`

## [0.4.0]
#### Added
- support for `ENV.rootURL` while still using `ENV.baseURL` if that is set
- portalHostName returns protocol-less hostname for Authenticated and Unauthenticated sessions.
#### Changed
- orgPortalUrl marked as deprecated

### Changed
- now using a fork of torii master that is ~0.8+


## [0.3.0]
#### Added
- orgPortalUrl CP on session service mixin

### Changed
- upgrade to ember 2.8

## [0.2.5]
#### Added
- option to configure a `customRedirectUri` in the `torii:{...}` config section, allowing greater flexibility with where the oAuth redirect page lives.
- bumped to node 6.3.0 in `.nvmrc` and `.travis.yml`

## [0.2.4]
#### Changed
- `redirect_uri` now respects `ENV.baseURL` if set

#### Added
- gh-pages deploy

## [0.2.3]
#### Changed
- removed gratuitous logging

## [0.2.2]
### Changed
-  the provider finds a cookie with a token, and makes the portals/self call but gets a 200 response that contains an error payload, reject the promise so that the app does not *think* the user is logged in.

## [0.2.1]
- withdrawn

## [0.2.0]
### Added
- option to redirect to static page for *much* faster iframe auth flows

## [0.1.2]
### Changed
- fixed typo in some logic in the dummy

## [0.1.1]
### Added
- gatekeeper service
- gatekeeper route + template
- fixed .nvmrc typo

## [0.0.3]
### Changed
- minor updates to readme and package.json

## [0.0.2]
### Added
- Example app can sign out when using Application auth

## [0.0.1]
### Added
- support for iframe (\*.argis.com only apps) oAuth
- support for application (pop-up) oAuth

[Unreleased]: https://github.com/Esri/torii-provider-arcgis/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/Esri/torii-provider-arcgis/compare/v2.2.1...v3.0.0
[2.2.1]: https://github.com/Esri/torii-provider-arcgis/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Esri/torii-provider-arcgis/compare/v2.1.2...v2.2.0
[2.1.2]: https://github.com/Esri/torii-provider-arcgis/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/Esri/torii-provider-arcgis/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/Esri/torii-provider-arcgis/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/Esri/torii-provider-arcgis/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Esri/torii-provider-arcgis/compare/v1.1.6...v2.0.0
[1.1.6]: https://github.com/Esri/torii-provider-arcgis/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/Esri/torii-provider-arcgis/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/Esri/torii-provider-arcgis/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/Esri/torii-provider-arcgis/compare/v1.1.1...v1.1.3
[0.12.0]: https://github.com/Esri/torii-provider-arcgis/compare/v0.11.0...v0.12.0

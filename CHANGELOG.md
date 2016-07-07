# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).
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

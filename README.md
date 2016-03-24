# Ember CLI Torii Provider ArcGIS

ArcGIS authentication provider for Torii, packaged as an Ember CLI Addon.

## Usage

Create a project using ember-cli. If you have an existing ember-cli project, skip this step.

```
$ ember new my-new-app
```

Add Torii and the ArcGIS Provider to the project

```
$ ember install torii
$ ember install torii-provider-arcgis
```

Now edit `/config/environment.js` to add your Torii provider configuration.

```
module.exports = function(environment) {
  var ENV = {

   // ... other ENV config stuff here

   torii:{
      providers: {
        'arcgis-oauth-bearer': {
          appId: 'APP CLIENT ID GOES HERE',
          redirect_uri: 'APP REDIRECT URI GOES HERE',
          state: "STATE" // For CSRF, should be random & unguessable
        }
      }
    }
  };

  return ENV;
};
```

## ArcGIS Authentication Options

The ArcGIS Platform has a few types of authentication, based on OAuth2. For all the details, please consult the [documentation](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Authorize/02r300000214000000/).




## Running the Addon Locally

The torii example app at ArcGIS.com is configured to use
`http://torii-example.com:4200/redirect.html` as their redirect
uri, so you will need to make an alias in your hosts file that points
**torii-example.com** to localhost, and you must view the examples from
that same host.

To use the ArcGIS Online authentication you need to run the app on **localui.arcgis.com** so you should also make an alias for this.

To add this hostname on a Mac:
  * `sudo vim /etc/hosts`
  * Add `127.0.0.1 torii-example.com`
  * Add `127.0.0.1 localui.arcgis.com`

The `/etc/hosts` equivalent filepath on Windows is:
`%SystemRoot%\system32\drivers\etc\hosts`.

For more info, see [Hosts at wikipedia](http://en.wikipedia.org/wiki/Hosts_(file)).


## Contributing

* `git clone` this repository
* `npm install`
* `bower install`

## Running Test App

* `ember server --dummy`
* Visit your app at http://localhost:4200.

## Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

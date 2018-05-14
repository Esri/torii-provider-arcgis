## ArcGIS Cookies and Web-Tier Auth

When portal is setup to use web-tier auth (typically via Active Directly or some LDAP), on the first request to the portal, the WebAdaptor demands creds from the browser.

The browser sends the creds if the current user is logged in to the correct domain etc, else it shows the browser-based auth dialog.

Once creds are supplied and validated, the browser makes the request for the page again, and sends the auth headers, and the app loads. However, no `esri_auth` cookie is set at this point.

### /sharing/rest/portals/self and Auth Headers
Making a request to `/sharing/rest/portals/self` without a token, but with the auth headers *will* cause a cookie to be returned, along with the normal payload.

### Cookie from Portal, WebAdaptor using IWA
Note: this cookie does not have an expires property. The token will expire though.
```json
{
  "portalApp": true,
  "email": "dave7351@AVWORLD",
  "privacy": "public",
  "token": "hYrdFaZXJFjrT-SOMEGNAR-TOKEN",
  "accountId": "0123456789ABCDEF",
  "role": "account_admin",
  "ssl": true,
  "culture": "en",
  "region": "",
  "auth_tier": "web",
  "username": "dave7351@AVWORLD",
  "allSSL": true,
  "secure": true
}
```

In testing this, I hacked up this page, and dropped it into an IWA configured portal's `/apps/iwatest` folder.
```html
<html>
<script>
fetch('https://dev0001870.esri.com/portal/sharing/rest/portals/self?f=json',
{
 credentials: 'same-origin'
})
.then((response) => {
  response.json();
})
.then((json) => {
  console.dir(json);
  let cookieName = 'esri_auth';
  let cookieString = decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(cookieName).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
  let cookieObj = JSON.parse(cookieString);
  alert(`token: ${cookieObj.token}`);
})
</script>
</html>
```

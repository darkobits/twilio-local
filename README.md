<a href="#top" id="top">
  <img src="https://user-images.githubusercontent.com/441546/41648545-10f441fa-742e-11e8-9972-edd7aee92207.png" style="max-width: 100%">
</a>
<p align="center">
  <a href="https://www.npmjs.com/package/@darkobits/twilio-local"><img src="https://img.shields.io/npm/v/@darkobits/twilio-local.svg?style=flat-square"></a>
  <a href="https://travis-ci.org/darkobits/twilio-local"><img src="https://img.shields.io/travis/darkobits/twilio-local.svg?style=flat-square"></a>
  <a href="https://david-dm.org/darkobits/twilio-local"><img src="https://img.shields.io/david/darkobits/twilio-local.svg?style=flat-square"></a>
  <a href="https://www.codacy.com/app/darkobits/twilio-local"><img src="https://img.shields.io/codacy/coverage/cca0bb56a34240afababa1164dfda134.svg?style=flat-square"></a>
  <a href="https://github.com/conventional-changelog/standard-version"><img src="https://img.shields.io/badge/conventional%20commits-1.0.0-027dc6.svg?style=flat-square"></a>
  <a href="https://github.com/sindresorhus/xo"><img src="https://img.shields.io/badge/code_style-XO-e271a5.svg?style=flat-square"></a>
</p>

`twilio-local` improves the experience of developing [Twilio applications](https://www.twilio.com/docs/api/rest/applications) locally.

### Features

- Manages secure tunneling with `ngrok`.
- Creates a unique Twilio application for each session.
- Watches and reloads your source files when they change using `nodemon`.

## Install

```bash
$ npm install --save-dev @darkobits/twilio-local
```

## Use

Add a script to your project's `package.json` that calls `twilio-local`:

```json
{
  "scripts": {
    "start": "twilio-local"
  }
}
```

## Configuration

The following parameters must be provided for `twilio-local` to function:

|Name|Type|Default|Description|
|---|---|---|---|
|`accountSid`|`string`|N/A|Your Twilio account SID, available from the [Twilio Console](https://www.twilio.com/console).|
|`authToken`|`string`|N/A|Your Twilio auth token, available from the [Twilio Console](https://www.twilio.com/console).|

The following parameters may be provided based on your preferences and application's requirements:

|Name|Type|Default|Description|
|---|---|---|---|
|`friendlyName`|`string`|N/A|Optional prefix for per-session Twilio application names.|
|`voiceMethod`|`string`|`'GET'`|HTTP method Twilio should use to reach your server's voice endpoint.|
|`voiceUrl`|`string`|N/A|Endpoint that Twilio will use to route incoming voice requests.|
|`smsMethod`|`string`|`'GET'`|HTTP method Twilio should use to reach your server's SMS endpoint.|
|`smsUrl`|`string`|N/A|Endpoint that Twilio will use to route incoming SMS requests.|
|`statusCallbackMethod`|`string`|`'GET'`|HTTP method Twilio should use to reach your server's status endpoint.|
|`statusCallback`|`string`|N/A|Endpoint that Twilio will use to route status requests.|
|`entry`|`string`|N/A|Entrypoint to your application. If not provided, `nodemon` functionality will not be used.|
|`openConsole`|`boolean`|`false`|Whether to open the Twilio console for the ephemeral application once tunneling is set up.|
|`protocol`|`string`|`'http'`|[Tunneling protocol](https://github.com/bubenshchykov/ngrok#options) to use with `ngrok`.|
|`port`|`number`|`8080`|[Local port](https://github.com/bubenshchykov/ngrok#options) that your server will run on.|

All options may be provided to `twilio-local` in the following ways:

1. Via command-line arguments (in `kebab-case`). See `twilio-local --help`.
2. Via a configuration file named `twilio-local.config.js` in your project root.
3. Via environment variables (or a `.env` file) that begin with `TWILIO_`. For example, the environment variable `TWILIO_AUTH_TOKEN` will be mapped to the `authToken` option.

**Note:** You should not put sensitive information, such as your application SID or auth token, in source control. Instead, place them in a `.env` file, and `twilio-local` will load them automatically.

## Example

> `📄 .env`

```bash
# This will set the 'applicationSid' option, so you can omit it from source.
TWILIO_APPLICATION_SID=<Your Twilio application SID.>

# This will set the 'authToken' option, so you can omit it from source.
TWILIO_AUTH_TOKEN=<Your Twilio auth token.>

# If your application also respects the PORT environment variable, you can
# configure it *and* twilio-local's 'port' option in one go!
PORT=9000
```

> `📄 twilio-local.config.js`

```js
module.exports = {
  // Optional prefix to use in the names twilio-local generates.
  friendlyName: 'kittens',
  // Your application may register the following endpoints, as needed:
  voiceUrl: '/twilio-voice',
  smsUrl: '/twilio-sms',
  statusUrl: '/twilio-status',
  // Relative path to your application's entrypoint that twilio-local will run
  // using nodemon.
  entry: './src/index.js'
};
```

Given the above configuration, `twilio-local` will configure tunneling and file-watching. Navigating to your Twilio console, you should see something like the following:

![](https://user-images.githubusercontent.com/441546/37274123-ff1de73a-2598-11e8-9395-3c63d25da5d7.png)

You can now click the "Call" button to place a test call to your local development server. As you make changes locally, your server will be restarted. When `twilio-local` is terminated (via `SIGINT`, for example) the Twilio application will be removed from your account and the `ngrok` tunnel will be closed.

## FAQ

**1. Can I just use `twilio-local` to create an emphemeral Twilio application and set up tunneling?**

Yes. Simply omit an `entry` option in your configuration and `twilio-local` won't use `nodemon` to watch your source files.

**2. Can I tell `twilio-local` to configure the voice/sms/status endpoints of an existing Twilio application?**

While this may be added at some point in the future, it is not encouraged for the following reasons:

- Modifying the configuration of an existing Twilio application is not a best-practice.
- The server backing the Twilio application is short-lived, so it follows that the Twilio application itself should be short-lived. This is why `twilio-local` creates an ephemeral Twilio application that is destroyed when you quit `twilio-local`.

**3. Arent the ngrok URL(s) created by `twilio-local` accessible to the public?**

`ngrok` generates a random URL for each tunnel/session. In addition to this, `twilio-local` configures the tunnel to require HTTP Basic authentication using a username and password pair that is randomly-generated for every session. These credentials are then provided to Twilio so that it may authenticate against the public `ngrok` URL.

Additionally, your server should be validating incoming HTTP requests to ensure they originated from Twilio. At the very least, this would involve checking that the `AccountSid` in the Twilio payload matches your own. For more robust request validation, Twilio offers HMAC-based [validation methods](https://www.twilio.com/docs/libraries/reference/twilio-node/3.17.3/global.html#validateRequest) as part of the [`twilio-node`](https://github.com/twilio/twilio-node) client library.

Therefore, an attacker would need at least the following in order to spoof a request to your server:

- The random username and password generated by `twilio-local`.
- The random URL generated by `ngrok`.
- Your Twilio account SID.

# Credits

`twilio-local` was made possile thanks to the herculean efforts of these fantastic tools:

- [ngrok](https://ngrok.com/) - Expose your localhost to the web.
- [nodemon](http://nodemon.io/) - Monitor for any changes in your node.js application and automatically restart the server - perfect for development.
- [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) - Find and load configuration from a package.json property, rc file, or CommonJS module.


## &nbsp;
<p align="center">
  <br>
  <img width="24" height="24" src="https://cloud.githubusercontent.com/assets/441546/25318539/db2f4cf2-2845-11e7-8e10-ef97d91cd538.png">
</p>

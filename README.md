<a href="#top" id="top">
  <img src="https://user-images.githubusercontent.com/441546/37270800-6e41baf8-258d-11e8-89b2-f21229421e95.png">
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

# Features

- Manages secure tunneling with `ngrok`.
- Creates a unique Twilio application for each session.
- Watches and reloads your source files when they change using `nodemon`.

# Install

```bash
$ npm i @darkobits/twilio-local
```

# Use

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
|`accountSid`|`String`|N/A|Your Twilio account SID, available from the [Twilio Console](https://www.twilio.com/console).|
|`authToken`|`String`|N/A|Your Twilio auth token, available from the [Twilio Console](https://www.twilio.com/console).|
|`protocol`|`String`|`'http'`|[Tunneling protocol](https://github.com/bubenshchykov/ngrok#options) to use with `ngrok`.|
|`port`|`Number`|`8080`|[Local port](https://github.com/bubenshchykov/ngrok#options) that your server will run on.|

The following parameters may be provided based on your preferences and application's requirements:

|Name|Type|Default|Description|
|---|---|---|---|
|`friendlyName`|`String`|N/A|Name for per-session Twilio applications.|
|`voiceMethod`|`String`|`'GET'`|HTTP method Twilio should use to reach your server's voice endpoint.|
|`voiceUrl`|`String`|N/A|Endpoint that Twilio will use to route incoming voice requests.|
|`smsMethod`|`String`|`'GET'`|HTTP method Twilio should use to reach your server's SMS endpoint.|
|`smsUrl`|`String`|N/A|Endpoint that Twilio will use to route incoming SMS requests.|
|`statusCallbackMethod`|`String`|`'GET'`|HTTP method Twilio should use to reach your server's status endpoint.|
|`statusCallback`|`String`|N/A|Endpoint that Twilio will use to route status requests.|
|`entry`|`String`|N/A|Entrypoint to your application. If not provided, `nodemon` functionality will not be used.|
|`open`|`Boolean`|`true`|Whether to open the Twilio console for the temporary application once tunneling is set up.|

All options may be provided to `twilio-local` in the following ways:

- Via a configuration file named `twilio-local.config.js` in your project root.
- Via command-line arguments. (See `twilio-local --help`)
- Via environment variables (or a `.env` file) that begin with `TWILIO_`. For example, the environment variable `TWILIO_AUTH_TOKEN` will be mapped to the `authToken` option.

**Note:** You should not put sensitive information, such as your application SID or auth token, in source control. Instead, place them in a `.env` file, and `twilio-local` will load them automatically.

**💡 Protip:** To configure the port for your application's server **and** `twilio-local` from the same place, set a `PORT` environment variable or `.env` entry.

# Example

> `.env`

```bash
TWILIO_APPLICATION_SID=<Your Twilio application SID.>
TWILIO_AUTH_TOKEN=<Your Twilio auth token.>

# Our application will also read this variable when determining what port to use.
PORT=9000
```

> `twilio-local.config.js`

```js
module.exports = {
  friendlyName: 'Kittens',

  // Use the default method (GET) for all endpoints.
  voiceUrl: '/twilio-voice',
  smsUrl: '/twilio-sms',
  statusUrl: '/twilio-status',

  // Relative path to our application's entrypoint.
  entry: './src/index.js'
};
```

Given the above configuration, `twilio-local` will configure tunneling and file-watching, then open a browser:

![](https://user-images.githubusercontent.com/441546/37274123-ff1de73a-2598-11e8-9395-3c63d25da5d7.png)

You can now click the "Call" button to place a test call to your local development server. As you make changes locally, your server will be restarted. When `twilio-local` is terminated (via `SIGINT`, for example) the Twilio application will be removed from your account and the `ngrok` tunnel will be closed.

# FAQ

> Can I just use `twilio-local` to create an emphemeral Twilio application and set up tunneling?

Yes. Simply omit an `entry` option in your configuration and `twilio-local` won't use `nodemon` to watch your source files.

> Can I tell `twilio-local` to configure the voice/sms/status endpoints of an existing Twilio application?

While this may be added at some point in the future, it is not encouraged for the following reasons:

- Modifying the configuration of an existing Twilio application is not a best-practice.
- The server backing the Twilio application is short-lived, so it follows that the Twilio application itself should be short-lived.

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

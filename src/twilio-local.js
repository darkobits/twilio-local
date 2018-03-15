import path from 'path';

import querystring from 'querystring';
import axios from 'axios';
import chalk from 'chalk';
import ngrok from 'ngrok';
import nodeCleanup from 'node-cleanup';
import nodemon from 'nodemon';
import open from 'open';
import uuid from 'uuid/v4';

import {DEFAULT_METHOD, DEFAULT_PORT, DEFAULT_PROTO} from 'etc/constants';
import log from 'lib/log';
import validateConfig from 'lib/validate-config';
import {canReadFile, toFormattedStr, parseAjvErrors} from 'lib/utils';


export default async function TwilioLocal (userConfig = {}) {
  const config = Object.assign({
    /**
     * Twilio Account SID.
     *
     * See: https://www.twilio.com/console
     *
     * @type {string}
     */
    accountSid: '',

    /**
     * Twilio Auth token.
     *
     * See: https://www.twilio.com/console
     *
     * @type {string}
     */
    authToken: '',

    /**
     * Friendly name, used to prefix the name generated for the Twilio
     * application.
     *
     * See: https://www.twilio.com/docs/api/rest/applications#instance
     *
     * @type {string}
     */
    friendlyName: '',

    /**
     * HTTP method that Twilio will use for voice webhooks.
     *
     * See: https://www.twilio.com/docs/api/rest/applications#instance
     *
     * @type {string}
     */
    voiceMethod: DEFAULT_METHOD,

    /**
     * Route to append to the URL we get from ngrok to construct a complete URL
     * for voice webhooks.
     *
     * See: https://www.twilio.com/docs/api/rest/applications#instance
     *
     * @type {string}
     */
    voiceUrl: null,

    /**
     * HTTP method that Twilio will use for SMS webhooks.
     *
     * See: https://www.twilio.com/docs/api/rest/applications#instance
     *
     * @type {string}
     */
    smsMethod: DEFAULT_METHOD,

    /**
     * Route to append to the URL we get from ngrok to construct a complete URL
     * for SMS webhooks.
     *
     * See: https://www.twilio.com/docs/api/rest/applications#instance
     *
     * @type {string}
     */
    smsUrl: null,

    /**
     * HTTP method that Twilio will use for status webhooks.
     *
     * See: https://www.twilio.com/docs/api/rest/applications#instance
     *
     * @type {string}
     */
    statusCallbackMethod: DEFAULT_METHOD,

    /**
     * Route to append to the URL we get from ngrok to construct a complete URL
     * for status webhooks.
     *
     * See: https://www.twilio.com/docs/api/rest/applications#instance
     *
     * @type {string}
     */
    statusCallback: null,

    /**
     * Tunnel protocol to use for ngrok.
     *
     * See: https://github.com/bubenshchykov/ngrok#options
     *
     * @type {string}
     */
    protocol: DEFAULT_PROTO,

    /**
     * Local port to point the ngrok tunnel to.
     *
     * See: https://github.com/bubenshchykov/ngrok#options
     *
     * @type {number}
     */
    port: DEFAULT_PORT,

    /**
     * Whether to open a Twilio console once the application has been created.
     *
     * @type {boolean}
     */
    open: true,

    /**
     * If provided, will use this file as an entry-point to a consumer's
     * application. Once an ngrok tunnel and ephemeral Twilio application have
     * been created, this file will be executed using nodemon.
     *
     * @type {string}
     */
    entry: ''
  }, userConfig);


  /**
   * Reference to the public URL that will be returned by ngrok.
   *
   * @type {string}
   */
  let ngrokUrl;


  /**
   * Reference to the application JSON blob returned by Twilio.
   *
   * @type {object}
   */
  let app;


  /**
   * Reference to the axios Twilio client we will create.
   *
   * @type {object}
   */
  let client;


  /**
   * Removes the ephemeral Twilio application and closes the ngrok tunnel.
   */
  function doCleanup () {
    return Promise.all([
      app && client({method: 'DELETE', url: `/Applications/${app.sid}.json`}),
      ngrokUrl && ngrok.kill()
    ])
    .then(() => {
      if (app && ngrokUrl) {
        log.info('Cleanup done.');
      }
    })
    .catch(err => {
      log.error('cleanup', err);
    });
  }


  /**
   * Handles tear-down on errors and process termination.
   *
   * @param {number} code
   * @param {string} signal
   */
  function nodeCleanupHandler (code, signal) {
    log.silly('exit', `Receied exit signal "${chalk.yellow(signal)}".`);

    doCleanup()
    .then(() => {
      process.exit(code); // eslint-disable-line unicorn/no-process-exit
    });

    nodeCleanup.uninstall();

    // Tell node-cleanup to keep the process running.
    return false;
  }


  // Register cleanup handler.
  nodeCleanup(nodeCleanupHandler);


  try {
    // ----- [1] Validate Configuration ----------------------------------------

    validateConfig(config);

    const validationErrors = validateConfig.errors;

    // This will log all configuration options at the 'verbose' log level.
    log.verbose('config', toFormattedStr(config));

    // If the provided configuration is invalid, throw.
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      throw new Error(`Invalid configuration:\n${parseAjvErrors(validationErrors)}`);
    }


    // ----- [1] Create Ngrok Tunnel -------------------------------------------

    ngrokUrl = await ngrok.connect({
      proto: config.protocol,
      addr: config.port,
      region: 'us'
    });

    log.silly('ngrok', `Tunnel created. URL: ${ngrokUrl}`);


    // ----- [2] Create Ephemeral Twilio Application ---------------------------

    // Create Twilio client.
    client = axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`,
      auth: {
        username: config.accountSid,
        password: config.authToken
      }
    });

    // Create Twilio application.
    app = (await client({
      method: 'POST',
      url: `/Applications.json`,
      data: querystring.stringify({
        // Dynamic application name.
        FriendlyName: [
          config.friendlyName || false,
          'TwilioLocal',
          uuid().substr(0, 8)
        ].filter(i => i).join('-'),

        // Voice endpoint.
        VoiceMethod: config.voiceMethod,
        VoiceUrl: `${ngrokUrl}${config.voiceUrl || ''}`,

        // SMS endpoint.
        SmsMethod: config.smsMethod,
        SmsUrl: `${ngrokUrl}${config.smsUrl || ''}`,

        // Status callback endpoint.
        StatusCallbackMethod: config.statusCallbackMethod,
        StatusCallback: `${ngrokUrl}${config.statusCallback || ''}`
      })
    })).data;

    log.info('twilio', 'Created app:', chalk.bold(app.friendly_name));

    // Log info about VoiceUrl mapping.
    if (app.voice_url) {
      log.info('twilio', [
        'Voice: ',
        chalk.dim('(' + app.voice_method.toLowerCase() + ')'),
        chalk.green(app.voice_url),
        '=>',
        chalk.green(`${config.protocol}://localhost:${config.port}${config.voiceUrl || ''}`)
      ].join(' '));
    }

    // Log info about SmsUrl mapping.
    if (app.sms_url) {
      log.info('twilio', [
        'SMS:   ',
        chalk.dim('(' + app.sms_method.toLowerCase() + ')'),
        chalk.green(app.sms_url),
        '=>',
        chalk.green(`${config.protocol}://localhost:${config.port}${config.smsUrl || ''}`)
      ].join(' '));
    }

    // Log info about StatusCallback mapping.
    if (app.status_callback) {
      log.info('twilio', [
        'Status:',
        chalk.dim('(' + app.status_callback_method.toLowerCase() + ')'),
        chalk.green(app.status_callback),
        '=>',
        chalk.green(`${config.protocol}://localhost:${config.port}${config.statusCallback || ''}`)
      ].join(' '));
    }

    // Log Twilio's response.
    Object.keys(app).forEach(key => {
      log.silly('twilio', `- ${key}: ${app[key]}`);
    });

    // Open Twilio console.
    if (config.open) {
      open(`https://www.twilio.com/console/voice/twiml/apps/${app.sid}`);
    }


    // ----- [4] Start Local Server --------------------------------------------

    if (config.entry) {
      const absEntry = path.resolve(process.cwd(), config.entry);
      const entryDir = path.parse(absEntry).dir;

      if (await canReadFile(absEntry)) {
        log.info('nodemon', `Starting server at ${chalk.green(config.entry)}.`);
      } else {
        throw new Error(`Entry is not readable: ${absEntry}`);
      }

      nodemon(`${config.inspect ? '--inspect' : ''} --exec babel-node --watch ${entryDir} ${absEntry}`)
      .on('start', () => {
        log.silly('nodemon', `Started.`);
      })
      .on('restart', changedFiles => {
        log.info('nodemon', `${chalk.green(changedFiles[0])} changed; restarting.`);
      })
      .on('quit', () => {
        log.silly('nodemon', `Stopped.`);
      })
      .on('error', err => {
        log.error('nodemon', err.message);
      });
    } else {
      log.info(null, 'Ready.');
    }
  } catch (err) {
    // If we catch an error, perform cleanup tasks then re-throw it to kill the
    // process.
    await doCleanup();
    throw err;
  }
}

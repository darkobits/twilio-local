import path from 'path';
import querystring from 'querystring';
import url from 'url';
import util from 'util';

import axios, {AxiosInstance} from 'axios';
import chalk from 'chalk';
import fs from 'fs-extra';
import ngrok, {INgrokOptions} from 'ngrok';
import nodeCleanup from 'node-cleanup';
// @ts-ignore
import nodemon from 'nodemon';
import opn from 'opn';
import pkgDir from 'pkg-dir';
import uuid from 'uuid/v4';

import {DEFAULT_METHOD, DEFAULT_PORT, DEFAULT_PROTO} from 'etc/constants';
import {LooseObject, ITwilioLocalConfig} from 'etc/types';
import log from 'lib/log';
import {parseAjvErrors} from 'lib/utils';
import validateConfig from 'lib/validate-config';


export default async function TwilioLocal(userConfig?: ITwilioLocalConfig) {
  const config = {
    voiceMethod: DEFAULT_METHOD,
    smsMethod: DEFAULT_METHOD,
    statusCallbackMethod: DEFAULT_METHOD,
    protocol: DEFAULT_PROTO,
    port: DEFAULT_PORT,
    openConsole: false,
    ...userConfig
  } as ITwilioLocalConfig;


  /**
   * Reference to the public URL that will be returned by ngrok.
   */
  let ngrokUrl: string;


  /**
   * Reference to the application JSON blob returned by Twilio when we create
   * the ephemeral application.
   */
  let app: {
    [index: string]: string;
    friendly_name: string;
    sid: string;
    sms_method: string;
    sms_url: string;
    status_callback_method: string;
    status_callback: string;
    voice_method: string;
    voice_url: string;
  };


  /**
   * Name of the ephemeral Twilio application and HTTP basic auth username to
   * use on the ngrok tunnel.
   */
  let applicationName: string;


  /**
   * HTTP basic auth password to use with Twilio + ngrok.
   */
  const password = uuid().substr(0, 8);


  /**
   * Reference to the axios Twilio client we will create.
   */
  let client: AxiosInstance;


  /**
   * Removes the ephemeral Twilio application and closes the ngrok tunnel.
   */
  async function doCleanup() {
    try {
      await Promise.all([ // tslint:disable-line no-unnecessary-type-assertion
        app && client({
          method: 'DELETE',
          url: `/Applications/${app.sid}.json`
        }),
        ngrokUrl && ngrok.kill()
      ] as Array<any>);

      if (app && ngrokUrl) {
        log.info('Cleanup done.');
      }
    } catch (err) {
      log.error('cleanup', err);
    }
  }


  /**
   * Handles tear-down on errors and process termination.
   */
  function nodeCleanupHandler(code: number, signal: string): boolean {
    log.silly('exit', `Receied exit signal "${chalk.yellow(signal)}".`);

    doCleanup().then(() => process.exit(code)); // tslint:disable-line no-floating-promises
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
    log.verbose('config', util.inspect(config));

    // If the provided configuration is invalid, throw.
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      throw new Error(`Invalid configuration:\n${parseAjvErrors(validationErrors)}`);
    }

    // Compute Twilio application name.
    applicationName = `${config.friendlyName || ''}-TwilioLocal-${uuid().substr(0, 8)}`;


    // ----- [2] Create Ngrok Tunnel -------------------------------------------

    const rawNgrokUrl = await ngrok.connect({
      proto: config.protocol,
      addr: config.port,
      region: 'us',
      auth: `${applicationName}:${password}`
    } as INgrokOptions);

    // Add HTTP Basic authentication to URL.
    const parsedNgrokUrl = url.parse(rawNgrokUrl);
    parsedNgrokUrl.auth = `${applicationName}:${password}`;
    ngrokUrl = url.format(parsedNgrokUrl).replace(/\/$/, '');

    log.silly('ngrok', `Tunnel created. URL: ${ngrokUrl}`);


    // ----- [3] Create Ephemeral Twilio Application ---------------------------

    // Create Twilio client.
    client = axios.create({
      baseURL: `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`,
      auth: {
        username: config.accountSid,
        password: config.authToken
      }
    });

    // Build Twilio API request payload.
    const data: LooseObject = {
      FriendlyName: [
        config.friendlyName || false,
        'TwilioLocal',
        uuid().substr(0, 8)
      ].filter(i => i).join('-')
    };

    // Voice endpoint.
    if (config.voiceUrl) {
      data.VoiceMethod = config.voiceMethod;
      data.VoiceUrl = `${ngrokUrl}${config.voiceUrl || ''}`;
    }

    // SMS endpoint.
    if (config.smsUrl) {
      data.SmsMethod = config.smsMethod;
      data.SmsUrl = `${ngrokUrl}${config.smsUrl || ''}`;
    }

    // Status callback endpoint.
    if (config.statusCallback) {
      data.StatusCallbackMethod = config.statusCallbackMethod;
      data.StatusCallback = `${ngrokUrl}${config.statusCallback || ''}`;
    }

    // Create Twilio application.
    app = (await client({
      method: 'POST',
      url: '/Applications.json',
      data: querystring.stringify(data)
    })).data;

    log.info('twilio', 'Created app:', chalk.bold(app.friendly_name));

    // Log info about VoiceUrl mapping.
    if (app.voice_url) {
      log.info('twilio', [
        'Voice: ',
        chalk.dim(`(${app.voice_method.toLowerCase()})`),
        chalk.green(app.voice_url),
        '=>',
        chalk.green(`${config.protocol}://localhost:${config.port}${config.voiceUrl || ''}`)
      ].join(' '));
    }

    // Log info about SmsUrl mapping.
    if (app.sms_url) {
      log.info('twilio', [
        'SMS:   ',
        chalk.dim(`(${app.sms_method.toLowerCase()})`),
        chalk.green(app.sms_url),
        '=>',
        chalk.green(`${config.protocol}://localhost:${config.port}${config.smsUrl || ''}`)
      ].join(' '));
    }

    // Log info about StatusCallback mapping.
    if (app.status_callback) {
      log.info('twilio', [
        'Status:',
        chalk.dim(`(${app.status_callback_method.toLowerCase()})`),
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
    if (config.openConsole) {
      opn(`https://www.twilio.com/console/voice/twiml/apps/${app.sid}`); // tslint:disable-line no-floating-promises
    }


    // ----- [4] Start Local Server --------------------------------------------

    if (config.entry) {
      const absEntry = path.resolve(process.cwd(), config.entry);
      const entryDir = path.parse(absEntry).dir;
      const pkgRoot = await pkgDir();

      if (typeof pkgRoot !== 'string') {
        throw new Error('Unable to determine your package\'s root directory. Ensure a "package.json" file is present and try again.');
      }

      if (await fs.pathExists(absEntry)) {
        const relativeEntry = path.relative(pkgRoot, config.entry);
        log.info('nodemon', `Starting server at ${chalk.green(relativeEntry)}.`);
      } else {
        throw new Error(`Entry is not readable: ${absEntry}`);
      }

      nodemon(`${config.inspect ? '--inspect' : ''} --exec "babel-node --extensions=.js,.ts" --watch ${entryDir} ${absEntry}`)
      .on('restart', (changedFiles: Array<string>) => {
        changedFiles.forEach(fullPath => {
          const relativePath = path.relative(pkgRoot, fullPath);
          log.info('nodemon', `${chalk.green(relativePath)} changed; restarting.`);
        });
      })
      .on('quit', () => {
        log.silly('nodemon', 'Stopped.');
      })
      .on('error', (err: Error) => {
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

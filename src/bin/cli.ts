#!/usr/bin/env node

import yargs from 'yargs';

import log from 'lib/log';
import {loadConfig} from 'lib/utils';
import TwilioLocal from 'twilio-local';


const argv = yargs
  .example('$0 --voice-url=/voice --entry=src/index.js', 'Route voice calls to the "/voice" route and set up file watching using "src/index.js" as the entrypoint.')
  .group(['account-sid', 'auth-token', 'friendly-name'], 'Twilio Configuration')
  .option('account-sid', {
    describe: 'Twilio account SID.',
    type: 'string'
  })
  .option('auth-token', {
    description: 'Twilio auth token.',
    type: 'string'
  })
  .option('friendly-name', {
    description: 'Name for ephemeral Twilio applications.',
    type: 'string'
  })
  .group(['voice-method', 'voice-url'], 'Voice Routing')
  .option('voice-method', {
    description: 'HTTP method that Twilio will use for voice webhooks.',
    type: 'string'
  })
  .option('voice-url', {
    description: 'Route for voice webhooks.',
    type: 'string'
  })
  .group(['sms-method', 'sms-url'], 'SMS Routing')
  .option('sms-method', {
    description: 'HTTP method that Twilio will use for SMS webhooks.',
    type: 'string'
  })
  .option('sms-url', {
    description: 'Route for SMS webhooks.',
    type: 'string'
  })
  .group(['status-method', 'status-url'], 'Status Callback Routing')
  .option('status-method', {
    description: 'HTTP method for status webhooks.',
    type: 'string'
  })
  .option('status-url', {
    description: 'Route for status webhooks.',
    type: 'string'
  })
  .group(['protocol', 'port'], 'Tunneling Settings')
  .option('tunnel', {
    description: 'Enable tunneling with ngrok.',
    type: 'boolean',
    default: true
  })
  .option('protocol', {
    description: 'Tunnel protocol to use for ngrok.',
    type: 'string'
  })
  .option('port', {
    description: 'Local port to point the ngrok tunnel to.',
    type: 'number'
  })
  .option('open-console', {
    description: 'Open the Twilio console for the application.',
    type: 'boolean'
  })
  .option('entry', {
    description: 'Local application entrypoint. (Enables file watching.)',
    type: 'string'
  })
  .option('inspect', {
    description: 'Enable the Node inspector.',
    type: 'boolean'
  })
  .wrap(yargs.terminalWidth())
  .help()
  .argv;


async function TwilioLocalCLI() {
  try {
    await TwilioLocal(await loadConfig(argv));
  } catch (err) {
    log.error('', err);
    process.exit(1);
  }
}

TwilioLocalCLI(); // tslint:disable-line no-floating-promises

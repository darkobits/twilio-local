import yargs from 'yargs';
import {DEFAULT_METHOD, DEFAULT_PROTO, DEFAULT_PORT} from 'etc/constants';

export default yargs
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
    default: DEFAULT_METHOD
  })
  .option('voice-url', {
    description: 'Route for voice webhooks.',
    type: 'string'
  })
  .group(['sms-method', 'sms-url'], 'SMS Routing')
  .option('sms-method', {
    description: 'HTTP method that Twilio will use for SMS webhooks.',
    default: DEFAULT_METHOD
  })
  .option('sms-url', {
    description: 'Route for SMS webhooks.',
    type: 'string'
  })
  .group(['status-method', 'status-url'], 'Status Callback Routing')
  .option('status-method', {
    description: 'HTTP method for status webhooks.',
    default: DEFAULT_METHOD
  })
  .option('status-url', {
    description: 'Route for status webhooks.',
    type: 'string'
  })
  .group(['protocol', 'port'], 'Tunneling Settings')
  .option('protocol', {
    description: 'Tunnel protocol to use for ngrok.',
    default: DEFAULT_PROTO
  })
  .option('port', {
    description: 'Local port to point the ngrok tunnel to.',
    default: DEFAULT_PORT
  })
  .option('open', {
    description: 'Open a Twilio console for the application.'
  })
  .option('entry', {
    description: 'Local application entrypoint. (Enables file watching.)',
    type: 'string'
  })
  .option('inspect', {
    description: 'Enable the Node inspector.',
    type: 'boolean'
  })
  .wrap(90)
  .help()
  .argv;

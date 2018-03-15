#!/usr/bin/env node

import commandLineArguments from 'etc/args';
import log from 'lib/log';
import {loadConfig} from 'lib/utils';
import TwilioLocal from 'twilio-local';


(async function () {
  try {
    await TwilioLocal(await loadConfig(commandLineArguments));
  } catch (err) {
    log.error('cli', err);
    process.exit(1);
  }
})();

#!/usr/bin/env node

import path from 'path';

import camelCase from 'camelcase';
import chalk from 'chalk';
import cosmiconfig from 'cosmiconfig';
import dotenv from 'dotenv';

import TwilioLocal from 'twilio-local';
import log from 'lib/log';


/**
 * Capture any environment variables starting with TWILIO_.
 *
 * @type {regex}
 */
const twilioKeyPattern = /^TWILIO_/;


/**
 * Additionally, capture these environment variables.
 *
 * @type {array}
 */
const envKeys = ['PORT'];


/**
 * Create an object representing configuration options extracted from the
 * environment.
 *
 * An environment variable like:
 *
 * TWILIO_ACCOUNT_SID
 *
 * Will be mapped to the configuration option:
 *
 * accountSid
 */
const envConfig = Object.entries(dotenv.config().parsed).reduce((obj, [key, value]) => {
  if (twilioKeyPattern.test(key)) {
    return {[camelCase(key.replace(twilioKeyPattern, ''))]: value, ...obj};
  } else if (envKeys.includes(key)) {
    return {[camelCase(key)]: value, ...obj};
  }

  return obj;
}, {});


/**
 * Functions which describe how to parse certain variables.
 *
 * @type {object}
 */
const transforms = {
  // Coerce port to a decimal integer. This is done because dotenv parses it as
  // as string.
  port: value => parseInt(value, 10),
  // Resolve relative paths to entry files to absolute paths.
  entry: value => path.resolve(process.cwd(), value)
};


(async function () {
  try {
    const result = await cosmiconfig('twilio-local').load();

    if (!result) {
      throw new Error('Unable to find a configuration file.');
    }

    const {config, filepath} = result;
    log.verbose('cli', `Loaded configuration from: "${chalk.green(filepath)}".`);

    // Merge file-based configuration and environment-based configuration.
    const mergedConfig = Object.assign(config, envConfig);

    // Apply transformations to configuration.
    const transformedConfig = Object.entries(mergedConfig).reduce((obj, [key, value]) => {
      return {[key]: transforms[key] ? transforms[key](value) : value, ...obj};
    }, {});

    // Start twilio-local.
    await TwilioLocal(transformedConfig);
  } catch (err) {
    log.error('cli', err);
    process.exit(1);
  }
})();

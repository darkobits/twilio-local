import fs from 'fs';
import path from 'path';
import {promisify} from 'util';

import camelCase from 'camelcase';
import chalk from 'chalk';
import cosmiconfig from 'cosmiconfig';
import dotenv from 'dotenv';

import {THIS_APP_NAME, TWILIO_KEY_PATTERN, ENV_KEYS} from 'etc/constants';
import {LooseObject, ITwilioLocalConfig} from 'etc/types';
import log from 'lib/log';


/**
 * Returns a formatted string representation of an object's keys / values.
 */
export function toFormattedStr(obj: object): string {
  return Object.entries(obj).map(([key, value]) => {
    let parsedValue;

    switch (typeof value) {
      case 'string':
        parsedValue = chalk.green(`"${value}"`);
        break;
      case 'boolean':
      case 'number':
        parsedValue = chalk.dim.yellow(value);
        break;
      default:
        parsedValue = value;
    }

    return `${chalk.bold(key)}${chalk.dim(' => ')}${parsedValue}`;
  }).join('\n');
}


/**
 * Resolves with true if the file at the provided path exists and is readable.
 */
export async function canReadFile(filePath: string): Promise<boolean> {
  try {
    await promisify(fs.access)(filePath, fs.constants.R_OK);
    return true;
  } catch (err) {
    log.verbose('canReadFile', err.message);
    return false;
  }
}


/**
 * Provided an array of schema validation errors from AJV, returns a multiline
 * string describing each.
 */
export function parseAjvErrors(errors: Array<LooseObject>): string {
  return errors.map((error, index) => {
    const errPath = error.dataPath ? error.dataPath.replace(/^\./, '') : 'root';
    return chalk.red(`${index + 1}. Value at "${errPath}" ${error.message}.`);
  }).join('\n');
}


/**
 * Returns a copy of the provided object with any undefined keys removed.
 */
export function filterObj(obj: LooseObject): LooseObject {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {} as LooseObject);
}


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
export function loadEnv(): object {
  dotenv.load();

  return Object.entries(process.env).reduce((obj, [key, value]) => {
    if (TWILIO_KEY_PATTERN.test(key)) {
      // If an environment variable starts with TWILIO_, strip the leading
      // TWILIO_ and convert the variable name to camel-case.
      return {[camelCase(key.replace(TWILIO_KEY_PATTERN, ''))]: value, ...obj};
    }

    if (ENV_KEYS.includes(key)) {
      // If the variable is in the list of variables of interest, convert it to
      // camel-case.
      return {[camelCase(key)]: value, ...obj};
    }

    // Otherwise, just return the accumulator.
    return obj;
  }, {});
}


/**
 * Provided an object containing parsed command-line arguments (from Yargs),
 * returns an object combining file-based, environment-based, and CLI-based
 * configuration.
 */
export async function loadConfig(commandLineArgs: LooseObject): Promise<ITwilioLocalConfig> {
  // Load file-based configuration via cosmiconfig.
  const fileConfig = await cosmiconfig(THIS_APP_NAME).search();

  if (fileConfig && fileConfig.filePath) {
    log.verbose('loadConfig', `Loaded configuration from: "${chalk.green(fileConfig.filePath)}".`);
  }

  // Load environment-based configuration via dotenv.
  const envConfig = loadEnv();

  // Parse command-line config from yargs.
  const cliConfig = filterObj(commandLineArgs);

  // Merge file-based configuration, environment-based configuration, and
  // command-line arguments.
  const mergedConfig = {
    ...(fileConfig && fileConfig.config),
    ...envConfig,
    ...cliConfig
  };

  // Functions which describe how to parse certain command line arguments and
  // environment variables.
  const transforms: LooseObject = {
    // Coerce port to an integer. This is done because dotenv parses it as a
    // string.
    port: (value: any) => parseInt(value, 10),
    // Resolve relative paths to entry files to absolute paths.
    entry: (value: any) => path.resolve(process.cwd(), value),
    // If "--inspect" is present in arguments, enable it.
    inspect: (value: any) => value || commandLineArgs._.includes('--inspect')
  };

  const OMIT_KEYS = ['_', '$0', 'version', 'help'];

  // Apply transformations to configuration.
  const config = Object.entries(mergedConfig).reduce((obj, [key, value]) => {
    if (OMIT_KEYS.includes(key)) {
      return obj;
    }

    return {[camelCase(key)]: transforms[key] ? transforms[key](value) : value, ...obj};
  }, {});

  log.silly('config', config);

  return config as ITwilioLocalConfig;
}

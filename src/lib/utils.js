import fs from 'fs';
import {promisify} from 'util';
import chalk from 'chalk';
import log from 'lib/log';


/**
 * Logs an object's keys / values.
 *
 * @param {object} config
 */
export function toFormattedStr (config) {
  return Object.entries(config).map(([key, value]) => {
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

    return chalk.bold(key) + chalk.dim(' => ') + parsedValue;
  }).join('\n');
}


/**
 * Returns true if the file at the provided path exists and is readable.
 *
 * @param  {string} value - Path to check.
 * @return {Promise<boolean>}
 */
export async function canReadFile (filePath) {
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
 *
 * @param {array} errors - AJV errors array.
 */
export function parseAjvErrors (errors) {
  return errors.map((error, index) => {
    const path = error.dataPath ? error.dataPath.replace(/^\./, '') : 'root';

    return chalk.red(`${index + 1}. Value at "${path}" ${error.message}.`);
  }).join('\n');
}

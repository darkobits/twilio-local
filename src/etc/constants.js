/**
 * Used by the logger and rc.
 *
 * @type {string}
 */
export const THIS_APP_NAME = 'twilio-local';


/**
 * Default protocol to use if one was not specified.
 *
 * @type {http}
 */
export const DEFAULT_PROTO = 'http';


/**
 * Default HTTP method to use when setting up webhooks with Twilio.
 *
 * @type {string}
 */
export const DEFAULT_METHOD = 'GET';


/**
 * Default local port to use if one was not specified. Something over 9000
 * should do.
 *
 * @type {number}
 */
export const DEFAULT_PORT = 9001;


/**
 * Capture any environment variables starting with TWILIO_.
 *
 * @type {regex}
 */
export const TWILIO_KEY_PATTERN = /^TWILIO_/;


/**
 * Environment variables we want to capture in addition to ones starting with
 * TWILIO_.
 *
 * @type {array}
 */
export const ENV_KEYS = ['PORT'];

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

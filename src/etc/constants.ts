/**
 * Used by the logger and rc.
 */
export const THIS_APP_NAME = 'twilio-local';


/**
 * Default protocol to use if one was not specified.
 */
export const DEFAULT_PROTO = 'http';


/**
 * Default HTTP method to use when setting up webhooks with Twilio.
 */
export const DEFAULT_METHOD = 'GET';


/**
 * Default local port to use if one was not specified. Something over 9000
 * should do.
 */
export const DEFAULT_PORT = 9001;


/**
 * Capture any environment variables starting with TWILIO_.
 */
export const TWILIO_KEY_PATTERN = /^TWILIO_/;


/**
 * Environment variables we want to capture in addition to ones starting with
 * TWILIO_.
 */
export const ENV_KEYS = ['PORT'];

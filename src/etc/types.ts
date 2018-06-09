/**
 * Can be used in place of 'object' in cases where keys may be added dynamically
 * at runtime, or when the shape of an object is not known.
 */
export interface LooseObject {
  [key: string]: any;
}


export interface ITwilioLocalConfig {
  /**
   * Twilio Account SID.
   *
   * See: https://www.twilio.com/console
   */
  accountSid: string;

  /**
   * Twilio Auth token.
   *
   * See: https://www.twilio.com/console
   */
  authToken: string;

  /**
   * Friendly name, used to prefix the name generated for the Twilio
   * application.
   *
   * See: https://www.twilio.com/docs/api/rest/applications#instance
   */
  friendlyName: string;

  /**
   * HTTP method that Twilio will use for voice webhooks.
   *
   * See: https://www.twilio.com/docs/api/rest/applications#instance
   */
  voiceMethod?: string;

  /**
   * Route to append to the URL we get from ngrok to construct a complete URL
   * for voice webhooks.
   *
   * See: https://www.twilio.com/docs/api/rest/applications#instance
   */
  voiceUrl?: string;

  /**
   * HTTP method that Twilio will use for SMS webhooks.
   *
   * See: https://www.twilio.com/docs/api/rest/applications#instance
   */
  smsMethod?: string;

  /**
   * Route to append to the URL we get from ngrok to construct a complete URL
   * for SMS webhooks.
   *
   * See: https://www.twilio.com/docs/api/rest/applications#instance
   */
  smsUrl?: string;

  /**
   * HTTP method that Twilio will use for status webhooks.
   *
   * See: https://www.twilio.com/docs/api/rest/applications#instance
   */
  statusCallbackMethod?: string;

  /**
   * Route to append to the URL we get from ngrok to construct a complete URL
   * for status webhooks.
   *
   * See: https://www.twilio.com/docs/api/rest/applications#instance
   */
  statusCallback?: string;

  /**
   * Tunnel protocol to use for ngrok.
   *
   * See: https://github.com/bubenshchykov/ngrok#options
   */
  protocol?: string;

  /**
   * Local port to point the ngrok tunnel to.
   *
   * See: https://github.com/bubenshchykov/ngrok#options
   */
  port?: number;

  /**
   * Whether to open a Twilio console once the application has been created.
   */
  open?: boolean;

  /**
   * If provided, will use this file as an entry-point to a consumer's
   * application. Once an ngrok tunnel and ephemeral Twilio application have
   * been created, this file will be executed using nodemon.
   */
  entry?: string;

  /**
   * If true, Nodemon will be started with the --inspect flag.
   */
  inspect?: boolean;
}

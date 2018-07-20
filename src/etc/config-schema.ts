const $httpMethodSchema = {
  type: 'string',
  enum: ['GET', 'PUT', 'POST', 'DELETE']
};

const $urlSchema = {
  oneOf: [{
    type: 'string',
    pattern: '^(\\/[\\d\\w-]+)+\\/?$'
  }, {
    type: 'null'
  }]
};


export default {
  type: 'object',
  properties: {
    accountSid: {
      type: 'string',
      minLength: 34
    },
    authToken: {
      type: 'string',
      minLength: 32
    },
    friendlyName: {
      type: 'string'
    },
    voiceMethod: $httpMethodSchema,
    voiceUrl: $urlSchema,
    smsMethod: $httpMethodSchema,
    smsUrl: $urlSchema,
    statusCallbackMethod: $httpMethodSchema,
    statusCallback: $urlSchema,
    tunnel: {
      type: 'boolean'
    },
    protocol: {
      type: 'string',
      enum: ['http', 'tcp', 'tls']
    },
    port: {
      type: 'number',
      minimum: 0,
      maximum: 65535
    },
    openConsole: {
      type: 'boolean'
    },
    entry: {
      type: 'string'
    },
    inspect: {
      type: 'boolean'
    }
  },
  required: [
    'accountSid',
    'authToken',
    'protocol',
    'port'
  ]
};

import os from 'os';
import path from 'path';
import querystring from 'querystring';

import pEvent from 'p-event';
import uuid from 'uuid/v4';


function createMocks(mocksDescriptor: object): object {
  const m: any = {};

  // @ts-ignore
  Object.entries(mocksDescriptor).forEach(([moduleName, moduleImplementationFn]: [string, Function]) => {
    // console.warn(`[createMocks] Mocking module "${moduleName}".`);

    const moduleImplementation = moduleImplementationFn();

    jest.doMock(moduleName, () => {
      // Mock a module as a single function.
      if (typeof moduleImplementation === 'function') {
        // console.warn(`[createMocks] ${moduleName} will be mocked as a single function.`);
        return jest.fn(moduleImplementation);
      }

      // Mock a module with several methods.
      if (typeof moduleImplementation === 'object') {
        // console.warn(`[createMocks] ${moduleName} will be mocked as a module.`);

        const mockModule = {};

        // @ts-ignore
        Object.entries(moduleImplementation).forEach(([key, value]) => {
          if (typeof value === 'function') {
            if (value._isMockFunction === true) {
              // console.warn(`[createMocks] Skipping re-wrapping of existing mock method ${moduleName}#${key}.`);
              mockModule[key] = value;
            } else {
              // console.warn(`[createMocks] ${moduleName}#${key} will have a mock implementation.`);
              mockModule[key] = jest.fn(value);
            }
          } else {
            // console.warn(`[createMocks] Setting ${moduleName}.${key}.`);
            mockModule[key] = value;
          }
        });

        return mockModule;
      }

      throw new TypeError(`[createMocks] Unknown module implementation type: "${typeof moduleImplementation}"`);
    });

    // Finally, require the module, which will trigger the doMock() call above,
    // and attach it to the mocks object.
    m[moduleName] = require(moduleName);
  });

  return m;
}


const ACCOUNT_SID = uuid();
const AUTH_TOKEN = uuid();
const FRIENDLY_NAME = 'TwilioLocalTest';
const METHOD = 'GET';
const VOICE_URL = '/voice';
const SMS_URL = '/sms';
const STATUS_URL = '/status';
const PROTOCOL = 'tls';
const PORT = 8585;
const ENTRY = path.resolve(os.tmpdir(), 'index.js');


describe('TwilioLocal', () => {
  // Object that will hold our mock modules.
  let m: any = {};

  // Future reference to twilio-local.
  let TwilioLocal;

  // Configuration passed to twilio-local.
  const CONFIG = {
    accountSid: ACCOUNT_SID,
    authToken: AUTH_TOKEN,
    friendlyName: FRIENDLY_NAME,
    voiceMethod: METHOD,
    voiceUrl: VOICE_URL,
    smsMethod: METHOD,
    smsUrl: SMS_URL,
    statusCallbackMethod: METHOD,
    statusCallback: STATUS_URL,
    protocol: PROTOCOL,
    port: PORT,
    entry: ENTRY,
    openConsole: true
  };

  beforeEach(() => {
    jest.restoreAllMocks();

    m = createMocks({
      axios: () => {
        const _clientMock = jest.fn(() => {
          return Promise.resolve({
            data: {
              voice_method: METHOD,
              voice_url: VOICE_URL,
              sms_method: METHOD,
              sms_url: SMS_URL,
              status_callback_method: METHOD,
              status_callback: STATUS_URL
            }
          });
        });

        return {
          create: () => _clientMock,
          _clientMock
        };
      },
      'fs-extra': () => ({
        pathExists: () => Promise.resolve(true)
      }),
      ngrok: () => ({
        connect: () => {
          return 'NGROK_URL';
        },
        kill: () => {}
      }),
      nodemon: () => {
        const EventEmitter = require('events'); // tslint:disable-line no-require-imports
        const emitter = new EventEmitter();
        return () => emitter;
      },
      opn: () => () => {}, // tslint:disable-line no-empty
      'pkg-dir': () => () => Promise.resolve('/path/to/package')
    });

    TwilioLocal = require('./twilio-local').default; // tslint:disable-line no-require-imports
  });

  describe('validating configuration', () => {
    it('should throw an error when provided no configuration', async () => {
      expect.assertions(1);

      try {
        await TwilioLocal();
      } catch (err) {
        expect(err.message).toBeTruthy();
      }
    });

    it('should throw an error when provided an empty configuration', async () => {
      expect.assertions(1);

      try {
        await TwilioLocal({});
      } catch (err) {
        expect(err.message).toBeTruthy();
      }
    });

    it('should throw an error when provided an invalid accountSid', async () => {
      expect.assertions(2);

      try {
        await TwilioLocal({
          accountSid: 1234
        });
      } catch (err) {
        expect(err.message).toMatch(/accountSid.*should be string/ig);
      }

      try {
        await TwilioLocal({
          accountSid: '1234'
        });
      } catch (err) {
        expect(err.message).toMatch(/accountSid.*should not be shorter than/ig);
      }
    });

    it('should throw an error when provided an invalid authToken', async () => {
      expect.assertions(2);

      try {
        await TwilioLocal({
          accountSid: uuid(),
          authToken: 123
        });
      } catch (err) {
        expect(err.message).toMatch(/authToken.*should be string/ig);
      }

      try {
        await TwilioLocal({
          accountSid: uuid(),
          authToken: '123'
        });
      } catch (err) {
        expect(err.message).toMatch(/authToken.*should not be shorter than/ig);
      }
    });

    it('should throw an error when provided an invalid friendlyName', async () => {
      expect.assertions(1);

      try {
        await TwilioLocal({
          accountSid: uuid(),
          authToken: uuid(),
          friendlyName: null
        });
      } catch (err) {
        expect(err.message).toMatch(/friendlyName.*should be string/ig);
      }
    });

    [
      ['voiceMethod', 'voiceUrl'],
      ['smsMethod', 'smsUrl'],
      ['statusCallbackMethod', 'statusCallback']
    ].forEach(([method, url]) => {
      it(`should throw an error when provided an invalid ${method}`, async () => {
        expect.assertions(1);

        try {
          await TwilioLocal({
            [method]: 'foo'
          });
        } catch (err) {
          expect(err.message).toMatch(new RegExp(`${method}.*should be equal to one of the allowed values`, 'ig'));
        }
      });

      it(`should throw an error when provided an invalid ${url}`, async () => {
        expect.assertions(1);

        try {
          await TwilioLocal({
            [url]: 'foo'
          });
        } catch (err) {
          expect(err.message).toMatch(new RegExp(`${url}.*should match exactly one schema in oneOf`, 'ig'));
        }
      });
    });

    it('should throw an error when provided an invalid protocol', async () => {
      expect.assertions(1);

      try {
        await TwilioLocal({
          protocol: 'foo'
        });
      } catch (err) {
        expect(err.message).toMatch(/protocol.*should be equal to one of the allowed values/ig);
      }
    });

    it('should throw an error when provided an invalid port', async () => {
      expect.assertions(3);

      try {
        await TwilioLocal({
          port: 'foo'
        });
      } catch (err) {
        expect(err.message).toMatch(/port.*should be number/ig);
      }

      try {
        await TwilioLocal({
          port: -23
        });
      } catch (err) {
        expect(err.message).toMatch(/port.*should be >= 0/ig);
      }

      try {
        await TwilioLocal({
          port: 65536
        });
      } catch (err) {
        expect(err.message).toMatch(/port.*should be <= 65535/ig);
      }
    });

    it('should throw an error when provided an invalid "entry"', async () => {
      expect.assertions(1);

      try {
        await TwilioLocal({
          entry: false
        });
      } catch (err) {
        expect(err.message).toMatch(/entry.*should be string/ig);
      }
    });
  });

  describe('creating a Twilio application, ngrok tunnel, and file watchers', () => {
    beforeEach(async () => {
      await TwilioLocal(CONFIG);
    });

    it('should create an ngrok tunnel with the provided parameters', () => {
      expect(m.ngrok.connect.mock.calls[0][0]).toMatchObject({
        proto: PROTOCOL,
        addr: PORT
      });
    });

    it('should create a Twilio application with the provided parameters', () => {
      // Assert that an Axios client was created using our Twilio account SID
      // and auth token.
      expect(m.axios.create.mock.calls[0][0]).toMatchObject({
        auth: {
          username: ACCOUNT_SID,
          password: AUTH_TOKEN
        }
      });

      const parsedQueryString = {
        ...querystring.parse(m.axios._clientMock.mock.calls[0][0].data)
      };

      expect(parsedQueryString.FriendlyName).toMatch(new RegExp(FRIENDLY_NAME, 'ig'));
      expect(parsedQueryString.VoiceMethod).toBe(METHOD);
      expect(parsedQueryString.VoiceUrl).toMatch(new RegExp(`${VOICE_URL}$`, 'ig'));
      expect(parsedQueryString.SmsMethod).toBe(METHOD);
      expect(parsedQueryString.SmsUrl).toMatch(new RegExp(`${SMS_URL}$`, 'ig'));
      expect(parsedQueryString.StatusCallbackMethod).toBe(METHOD);
      expect(parsedQueryString.StatusCallback).toMatch(new RegExp(`${STATUS_URL}$`, 'ig'));
    });

    it('should open the Twilio console', () => {
      expect(m.opn).toHaveBeenCalled();
    });

    it('should start nodemon with the provided parameters', async () => {
      const nodemonArgs = m.nodemon.mock.calls[0][0];

      // Assert we are transpiling code.
      expect(nodemonArgs).toContain('--exec \"babel-node --extensions=.js,.ts\"');

      // Assert that we are watching the entry directory.
      expect(nodemonArgs).toContain(`--watch ${path.parse(ENTRY).dir}`);

      // Assert that the entry file was the last parameter.
      expect(nodemonArgs).toMatch(new RegExp(`${ENTRY}$`));

      // await pEvent(m.nodemon._emitter, 'quit');
      // console.warn('GOT QUIT');
    });
  });

  describe('when the specified entry file is not readable', () => {
    beforeEach(() => {
      m['fs-extra'].pathExists.mockImplementation(() => Promise.resolve(false));
    });

    it('should throw an error', async () => {
      expect.assertions(1);

      try {
        await TwilioLocal(CONFIG);
      } catch (err) {
        expect(err.message).toMatch('Entry is not readable:');
      }
    });
  });

  describe('when no package root can be found', () => {
    beforeEach(() => {
      m['pkg-dir'].mockImplementation(() => Promise.resolve(false));
    });

    it('should throw an error', async () => {
      expect.assertions(1);

      try {
        await TwilioLocal(CONFIG);
      } catch (err) {
        expect(err.message).toMatch('Unable to determine your package\'s root directory.');
      }
    });
  });
});

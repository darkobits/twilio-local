import fs from 'fs';
import os from 'os';
import path from 'path';
import querystring from 'querystring';
import {promisify} from 'util';

import axios from 'axios';
import ngrok from 'ngrok';
import nodemon from 'nodemon';
import uuid from 'uuid/v4';

import TwilioLocal from './twilio-local';


jest.mock('axios', () => {
  const axiosModule: any = jest.fn(() => {
    return {
      data: {
        voice_url: 'foo',
        voice_method: 'GET',
        sms_url: 'bar',
        sms_method: 'GET',
        status_callback: 'baz',
        status_callback_method: 'GET'
      }
    };
  });

  axiosModule.create = jest.fn(() => {
    // Mock axios client.
    return axiosModule;
  });

  return axiosModule;
});

jest.mock('ngrok', () => {
  return {
    connect: jest.fn(() => {
      return 'NGROK_URL';
    }),
    kill: jest.fn()
  };
});

jest.mock('nodemon', () => {
  const EventEmitter = require('events'); // tslint:disable-line no-require-imports

  const emitter = new EventEmitter();

  const nodemonModule: any = jest.fn(() => {
    setImmediate(() => {
      emitter.emit('start');
      emitter.emit('restart', []);
      emitter.emit('quit');
      emitter.emit('error', {message: 'foo'});
    });

    return emitter;
  });

  nodemonModule.emit = emitter.emit.bind(emitter);

  return nodemonModule;
});

jest.mock('fs-extra', () => {
  return {
    pathExists: jest.fn(() => Promise.resolve(true))
  };
});


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


jest.useFakeTimers();


describe('TwilioLocal', () => {
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
    beforeAll(async () => {
      // Write entry file to temporary folder.
      await promisify(fs.writeFile)(ENTRY, 'foo');

      await TwilioLocal({
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
        entry: ENTRY
      });
    });

    it('should create an ngrok tunnel with the provided parameters', () => {
      expect(ngrok.connect.mock.calls[0][0]).toMatchObject({
        proto: PROTOCOL,
        addr: PORT
      });
    });

    it('should create a Twilio application with the provided parameters', () => {
      // Assert that an Axios client was created using our Twilio account SID
      // and auth token.
      expect(axios.create.mock.calls[0][0]).toMatchObject({
        auth: {
          username: ACCOUNT_SID,
          password: AUTH_TOKEN
        }
      });

      const parsedQueryString = {
        ...querystring.parse(axios.mock.calls[0][0].data)
      };

      expect(parsedQueryString.FriendlyName).toMatch(new RegExp(FRIENDLY_NAME, 'ig'));
      expect(parsedQueryString.VoiceMethod).toBe(METHOD);
      expect(parsedQueryString.VoiceUrl).toMatch(new RegExp(`${VOICE_URL}$`, 'ig'));
      expect(parsedQueryString.SmsMethod).toBe(METHOD);
      expect(parsedQueryString.SmsUrl).toMatch(new RegExp(`${SMS_URL}$`, 'ig'));
      expect(parsedQueryString.StatusCallbackMethod).toBe(METHOD);
      expect(parsedQueryString.StatusCallback).toMatch(new RegExp(`${STATUS_URL}$`, 'ig'));
    });

    it('should start nodemon with the provided parameters', () => {
      const nodemonArgs = nodemon.mock.calls[0][0];

      // Assert we are transpiling code.
      expect(nodemonArgs).toContain('--exec babel-node');

      // Assert that we are watching the entry directory.
      expect(nodemonArgs).toContain(`--watch ${path.parse(ENTRY).dir}`);

      // Assert that the entry file was the last parameter.
      expect(nodemonArgs).toMatch(new RegExp(`${ENTRY}$`));

      jest.advanceTimersByTime(1000);
    });

    afterAll(async () => {
      // Remove temporary entry file.
      await promisify(fs.unlink)(ENTRY);
    });
  });
});

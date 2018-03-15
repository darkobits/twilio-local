import fs from 'fs';
import path from 'path';
import os from 'os';
import {promisify} from 'util';

import stripAnsi from 'strip-ansi';
import uuid from 'uuid/v4';

import {
  toFormattedStr,
  canReadFile,
  parseAjvErrors,
  filterObj,
  loadEnv,
  loadConfig
} from './utils';


describe('toFormattedStr', () => {
  it('should log the keys and values of the provided object based on type', () => {
    const obj = {
      foo: 1,
      bar: 'string',
      baz: true
    };

    const result = toFormattedStr(obj);

    expect(stripAnsi(result)).toMatch('foo => 1\nbar => "string"\nbaz => true');
  });
});


describe('canReadFile', () => {
  const READABLE_FILE_NAME = path.resolve(os.tmpdir(), 'readable-file.txt');
  const UNREADABLE_FILE_NAME = path.resolve(os.tmpdir(), 'unreadable-file.txt');
  const FILE_CONTENTS = uuid();

  beforeEach(async () => {
    const writeFile = promisify(fs.writeFile);

    await writeFile(READABLE_FILE_NAME, FILE_CONTENTS, {
      mode: 0o0666
    });

    await writeFile(UNREADABLE_FILE_NAME, FILE_CONTENTS, {
      mode: 0o0000
    });
  });

  it('should work', async () => {
    expect(await canReadFile(READABLE_FILE_NAME)).toBeTruthy();
    expect(await canReadFile(UNREADABLE_FILE_NAME)).toBeFalsy();
  });

  afterEach(async () => {
    const unlink = promisify(fs.unlink);
    await unlink(READABLE_FILE_NAME);
    await unlink(UNREADABLE_FILE_NAME);
  });
});


describe('parseAjvErrors', () => {
  it('should return a formatted error string', () => {
    const errors = [
      {
        dataPath: '.path',
        message: 'message'
      },
      {
        dataPath: null,
        message: 'message'
      }
    ];

    const expectations = [
      input => expect(input).toMatch(/"path" message/),
      input => expect(input).toMatch(/"root" message/)
    ];

    parseAjvErrors(errors).split('\n').forEach((err, index) => {
      expectations[index](err);
    });
  });
});


describe('filterObj', () => {
  it('should remove keys that are undefined', () => {
    const input = {
      foo: 1,
      bar: 2,
      baz: undefined
    };

    const expected = {
      foo: 1,
      bar: 2
    };

    expect(filterObj(input)).toMatchObject(expected);
  });
});


describe('loadEnv', () => {
  beforeEach(() => {
    Object.assign(process.env, {
      TWILIO_VAR_ONE: 'foo',
      TWILIO_VAR_TWO: 'bar',
      PORT: '1234'
    });
  });

  it('should parse environment variables', () => {
    const results = loadEnv();

    expect(results).toMatchObject({
      varOne: 'foo',
      varTwo: 'bar',
      port: '1234'
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(process.env, 'TWILIO_VAR_ONE');
    Reflect.deleteProperty(process.env, 'TWILIO_VAR_TWO');
    Reflect.deleteProperty(process.env, 'PORT');
  });
});


describe('loadConfig', () => {
  beforeEach(() => {
    Object.assign(process.env, {
      TWILIO_VAR_ONE: 'foo',
      TWILIO_VAR_TWO: 'bar',
      PORT: '1234'
    });
  });

  it('should return a configuration object', async () => {
    const commandLineArgs = {
      cliArgOne: 'foo',
      cliArgTwo: 'bar'
    };

    expect(await loadConfig(commandLineArgs)).toMatchObject({
      cliArgOne: 'foo',
      cliArgTwo: 'bar',
      port: 1234,
      varOne: 'foo',
      varTwo: 'bar'
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(process.env, 'TWILIO_VAR_ONE');
    Reflect.deleteProperty(process.env, 'TWILIO_VAR_TWO');
    Reflect.deleteProperty(process.env, 'PORT');
  });
});

import {
  parseAjvErrors,
  filterObj,
  loadEnv,
  loadConfig
} from './utils';

jest.mock('cosmiconfig', () => {
  return jest.fn((appName: string) => {
    return {
      search: jest.fn(() => {
        return Promise.resolve({
          filepath: '/path/to/config.js',
          config: {
            entry: '/path/to/entry.js'
          }
        })
      })
    };
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
      _: true,
      $0: true,
      cliArgOne: 'foo',
      cliArgTwo: 'bar',
      inspect: true
    };

    const result = await loadConfig(commandLineArgs);

    expect(result).toMatchObject({
      // Assert that command-line arguments were loaded.
      cliArgOne: 'foo',
      cliArgTwo: 'bar',
      inspect: true,

      // Assert that environment/.env file values were loaded.
      port: 1234,
      varOne: 'foo',
      varTwo: 'bar',

      // Assert that config file values were loaded.
      entry: '/path/to/entry.js'
    });

    // Assert that extraneous keys were removed.
    expect(result._).toBeUndefined();
    expect(result.$0).toBeUndefined();
  });

  afterEach(() => {
    Reflect.deleteProperty(process.env, 'TWILIO_VAR_ONE');
    Reflect.deleteProperty(process.env, 'TWILIO_VAR_TWO');
    Reflect.deleteProperty(process.env, 'PORT');
  });
});

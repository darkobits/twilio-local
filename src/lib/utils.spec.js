import fs from 'fs';
import path from 'path';
import os from 'os';
import {promisify} from 'util';

import stripAnsi from 'strip-ansi';
import uuid from 'uuid/v4';

import {
  toFormattedStr,
  canReadFile
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

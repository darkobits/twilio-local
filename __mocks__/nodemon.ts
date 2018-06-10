import EventEmitter from 'events';
import {LooseObject} from 'etc/types';

const emitter = new EventEmitter();

const nodemon: jest.Mock & LooseObject = jest.fn().mockImplementation(() => {
  setImmediate(() => {
    emitter.emit('start');
    emitter.emit('restart', []);
    emitter.emit('quit');
    emitter.emit('error', {message: 'foo'});
  });

  return emitter;
});


nodemon.emit = (event: string, ...args: Array<any>) => emitter.emit(event, ...args);


export default nodemon;

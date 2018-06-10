import EventEmitter from 'events';

const emitter = new EventEmitter();

const nodemon = jest.fn().mockImplementation(() => {
  setImmediate(() => {
    emitter.emit('start');
    emitter.emit('restart', []);
    emitter.emit('quit');
    emitter.emit('error', {message: 'foo'});
  });

  return emitter;
});


nodemon.emit = (event, ...args) => emitter.emit(event, ...args);


export default nodemon;

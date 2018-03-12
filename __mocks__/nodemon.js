import EventEmitter from 'events';

const emitter = new EventEmitter();

const nodemon = jest.fn().mockImplementation(() => {
  return emitter;
});


nodemon.emit = (event, ...args) => emitter.emit(event, ...args);


export default nodemon;

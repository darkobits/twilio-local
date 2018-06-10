const connect = jest.fn().mockImplementation(() => {
  return 'NGROK_URL';
});


const kill = jest.fn();

export default {
  connect,
  kill
};

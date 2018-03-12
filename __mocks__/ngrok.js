const connect = jest.fn().mockImplementation(() => {
  return `NGROK_URL`;
});


export default {
  connect
};

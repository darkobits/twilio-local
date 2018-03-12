const axios = jest.fn().mockImplementation(() => {
  return {
    data: 'foo'
  };
});

axios.create = jest.fn().mockImplementation(() => {
  // Mock axios client.
  return axios;
});

export default axios;

import {LooseObject} from 'etc/types';

const axios: jest.Mock & LooseObject = jest.fn().mockImplementation(() => {
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

axios.create = jest.fn().mockImplementation(() => {
  // Mock axios client.
  return axios;
});

export default axios;

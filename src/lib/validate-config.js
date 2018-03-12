import Ajv from 'ajv';
import configSchema from 'etc/config-schema';

// AJV instance.
const ajv = new Ajv({allErrors: true});


export default ajv.compile(configSchema);

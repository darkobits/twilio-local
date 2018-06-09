// @ts-ignore
import LogFactory from '@darkobits/log';
import {THIS_APP_NAME} from 'etc/constants';

export default LogFactory(THIS_APP_NAME, process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL);

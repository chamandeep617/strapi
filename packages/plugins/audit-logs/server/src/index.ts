import bootstrap from './bootstrap';
import register from './register';
import contentTypes from './content-types';
import services from './services';
import routes from './routes';
import controllers from './controllers';
import config from './config';

export default () => ({
  register,
  bootstrap,
  routes,
  controllers,
  contentTypes,
  services,
  config,
});
import server from './app';
import { env } from './config/env';
import logger from './utils/logger';

server.listen(env.PORT, () => {
  logger.info(`server running on port ${env.PORT}`);
});

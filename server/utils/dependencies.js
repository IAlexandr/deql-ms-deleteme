// import session from 'tools/express-session-sequelize';
import session from 'tools/redis/express-session';
import logger from 'tools/logger';
//Выбираем базу данных
import { init, exportDbModels } from 'tools/db/sequelize';
import options from 'tools/options';

const { debug, time } = logger('project.dependencies');

export const dependencies = async function({ app }) {
  const initialized = time('initializing');
  const dbConfig = options.config.sequelize;
  const db = await init({
    dbConfig,
    NODE_ENV: options.config.NODE_ENV,
    modules: options.modules,
  });

  const sessionMidleware = session(app, db);
  app.use(sessionMidleware);

  // выгрузка схем из postgis
  const exportedSchema = await exportDbModels({
    dbConnection: {
      host: dbConfig.options.host,
      port: dbConfig.options.port,
      dialect: dbConfig.options.dialect,
      username: dbConfig.username,
      password: dbConfig.password,
      schema: dbConfig.dbName,
    },
    exportTableNames: ['Layers', 'Features'],
  });

  initialized('done.');
  return { db, exportedSchema };
};

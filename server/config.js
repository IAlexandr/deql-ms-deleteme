export default {
  port: '8888',
  projectName: 'deql-ms',
  graphql: {
    engineApiKey: 'service:deql-ms-server:4bBKVv14mLq7dWyaQeqfjA',
    useEngine: false,
  },
  redis: {
    host: '10.10.10.20',
    port: 32768,
  },
  sequelize: {
    options: {
      dialect: 'postgres',
      host: '172.212',
      port: 5435,
      logging: false,
    },
    username: 'user',
    password: 'user21',
    dbName: 'deck',
    accessDbSeed: false,
    syncForce: false,
    accessSyncForce: false,
  },
  rabbitmq: {
    connection: {
      name: '',
      user: '',
      pass: '',
      host: '',
      port: '',
      vhost: '%2f',
    },
  },
  NODE_ENV: 'development',
};

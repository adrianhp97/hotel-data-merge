import {
  Options,
  PostgreSqlDriver,
  UnderscoreNamingStrategy,
} from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as dotenv from 'dotenv';
import snakeCase from 'lodash/snakeCase';

dotenv.configDotenv();

const DATABASE_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database_name: process.env.DB_NAME || 'hotel-management',
};

const config: Options = {
  // for simplicity, we use the SQLite database, as it's available pretty much everywhere
  driver: PostgreSqlDriver,
  dbName: DATABASE_CONFIG.database_name,
  host: DATABASE_CONFIG.host,
  port: DATABASE_CONFIG.port,
  user: DATABASE_CONFIG.username,
  password: DATABASE_CONFIG.password,
  namingStrategy: UnderscoreNamingStrategy,
  // folder-based discovery setup, using common filename suffix
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  // we will use the ts-morph reflection, an alternative to the default reflect-metadata provider
  // check the documentation for their differences: https://mikro-orm.io/docs/metadata-providers
  metadataProvider: TsMorphMetadataProvider,
  // enable debug mode to log SQL queries and discovery information
  debug: process.env.NODE_ENV !== 'production',
  pool: {
    max: parseInt(process.env.MAX_DB_POOL_SIZE || '50', 10) || 50,
  },

  migrations: {
    pathTs: 'src/db/migrations',
    fileName: (timestamp, name) =>
      `migration_${timestamp}${name ? '_' + name : ''}`,
  },

  seeder: {
    pathTs: 'src/db/seeders',
    fileName: (className: string) =>
      `${snakeCase(className.replaceAll('Seeder', '')).replaceAll('_', '-')}.seeder`, // seeder file naming convention
  },
};

export default config;

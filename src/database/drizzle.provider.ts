import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDB = PostgresJsDatabase<typeof schema>;

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const url = config.getOrThrow<string>('DATABASE_URL');
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    const client = postgres(url, { ssl: isLocal ? false : 'require' });
    return drizzle(client, { schema });
  },
};

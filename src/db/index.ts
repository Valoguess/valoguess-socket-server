import { drizzle } from 'drizzle-orm/node-postgres';

import ENV from '@/env.js';
import { relations } from './schema.js';

export const db = drizzle(ENV.DATABASE_URL, { relations });

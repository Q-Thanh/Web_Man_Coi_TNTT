import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:data/mancoi.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
});

export const db = {
  async all<T = any>(sql: string, ...args: any[]): Promise<T[]> {
    const res = await client.execute({ sql, args });
    return res.rows as unknown as T[];
  },
  async get<T = any>(sql: string, ...args: any[]): Promise<T | null> {
    const res = await client.execute({ sql, args });
    return (res.rows[0] as unknown as T) || null;
  },
  async run(sql: string, ...args: any[]): Promise<{ lastInsertRowid?: number | bigint; rowsAffected: number }> {
    const res = await client.execute({ sql, args });
    return { lastInsertRowid: res.lastInsertRowid, rowsAffected: res.rowsAffected };
  },
  async batch(statements: Array<{ sql: string; args?: any[] }>) {
    return await client.batch(statements, 'write');
  },
  execute: client.execute.bind(client),
};

export const getDb = () => db;
export default db;

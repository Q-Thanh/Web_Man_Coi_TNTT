import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'libsql://webmancoitntt-q-thanh.aws-ap-northeast-1.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAzODYzMTQsImlkIjoiMDFhMGRiNTUtYzMwMS03MTU1LWI1MjMtMWNhMDhjMWY0ZDZlIiwia2lkIjoiaFR6TldtendOakMwZDVQSzB4bmJLOV9wTF9EWnNwS1VaUUo0XzdMNjBYOCIsInJpZCI6ImUzZGZhNjU0LTc1MjYtNDI2ZC1iZWM3LTYzNDBjNTUxZWIwYSJ9.eP10Fa1hPDZmFjczVLoWEai88eu8S0c8QIuAYrNEGDNMsuGrhmwjC7D_dm-OnWdoX0ztx4Ewj97mxc6eCYNjCQ';

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

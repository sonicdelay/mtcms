import { Pool } from 'pg';
import { Node } from '../models/node.interface.ts';
import { CreateNodeInput } from '../models/create-node-input.type.ts';
import { UpdateNodeInput } from '../models/update-node-input.type.ts';

const postgresUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
const pool = postgresUrl ? new Pool({ connectionString: postgresUrl }) : new Pool();
let initPromise: Promise<void> | null = null;

const ensureTable = async (): Promise<void> => {
  if (!initPromise) {
    initPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nodes (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
          updated_at TIMESTAMPTZ NOT NULL,
          sync JSONB NOT NULL,
          data JSONB NULL
        );
      `);
    })();
  }

  await initPromise;
};

const mapRowToNode = (row: {
  id: string;
  type: 'file' | 'directory';
  update: Date;
  sync: unknown;
  data: unknown;
}): Node => {
  return {
    id: row.id,
    type: row.type,
    update: new Date(row.update),
    sync: row.sync as Node['sync'],
    data: row.data as Node['data']
  };
};

export const listNodes = async (): Promise<Node[]> => {
  await ensureTable();
  const result = await pool.query<{
    id: string;
    type: 'file' | 'directory';
    update: Date;
    sync: unknown;
    data: unknown;
  }>(`SELECT id, type, updated_at AS "update", sync, data FROM nodes ORDER BY updated_at DESC`);

  return result.rows.map(mapRowToNode);
};

export const getNodeById = async (id: string): Promise<Node | null> => {
  await ensureTable();
  const result = await pool.query<{
    id: string;
    type: 'file' | 'directory';
    update: Date;
    sync: unknown;
    data: unknown;
  }>(`SELECT id, type, updated_at AS "update", sync, data FROM nodes WHERE id = $1 LIMIT 1`, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToNode(result.rows[0]);
};

export const createNode = async (input: CreateNodeInput): Promise<Node> => {
  await ensureTable();
  const updateAt = input.update ?? new Date();

  const result = await pool.query<{
    id: string;
    type: 'file' | 'directory';
    update: Date;
    sync: unknown;
    data: unknown;
  }>(
    `INSERT INTO nodes (id, type, updated_at, sync, data)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
     RETURNING id, type, updated_at AS "update", sync, data`,
    [
      input.id,
      input.type,
      updateAt.toISOString(),
      JSON.stringify(input.sync ?? {}),
      JSON.stringify(input.data ?? null)
    ]
  );

  return mapRowToNode(result.rows[0]);
};

export const updateNode = async (id: string, input: UpdateNodeInput): Promise<Node | null> => {
  const current = await getNodeById(id);
  if (!current) {
    return null;
  }

  await ensureTable();
  const merged = {
    type: input.type ?? current.type,
    update: input.update ?? current.update,
    sync: input.sync ?? current.sync,
    data: input.data ?? current.data
  };

  const result = await pool.query<{
    id: string;
    type: 'file' | 'directory';
    update: Date;
    sync: unknown;
    data: unknown;
  }>(
    `UPDATE nodes
     SET type = $2, updated_at = $3, sync = $4::jsonb, data = $5::jsonb
     WHERE id = $1
     RETURNING id, type, updated_at AS "update", sync, data`,
    [
      id,
      merged.type,
      merged.update.toISOString(),
      JSON.stringify(merged.sync ?? {}),
      JSON.stringify(merged.data ?? null)
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToNode(result.rows[0]);
};

export const deleteNode = async (id: string): Promise<boolean> => {
  await ensureTable();
  const result = await pool.query('DELETE FROM nodes WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};
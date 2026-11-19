import { Request, Response } from 'express';
import {
  createNode,
  deleteNode,
  getNodeById,
  listNodes,
  updateNode
} from '../../repositories/node.repository.ts';

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const asNodeType = (value: unknown): 'file' | 'directory' | null => {
  if (value === 'file' || value === 'directory') {
    return value;
  }

  return null;
};

const asDateOrNull = (value: unknown): Date | null => {
  if (value === undefined) {
    return null;
  }

  const candidate = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
};

export const getNodesInfoController = (_req: Request, res: Response): void => {
  res.json({
    feature: 'nodes',
    storage: 'postgres',
    note: 'children and breadcrumb fields are not persisted in DB',
    endpoints: [
      'GET /api/nodes',
      'GET /api/nodes/:id',
      'POST /api/nodes',
      'PUT /api/nodes/:id',
      'DELETE /api/nodes/:id'
    ]
  });
};

export const listNodesController = async (_req: Request, res: Response): Promise<void> => {
  const items = await listNodes();
  res.json({ items });
};

export const getNodeByIdController = async (req: Request, res: Response): Promise<void> => {
  const id = asNonEmptyString(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const item = await getNodeById(id);
  if (!item) {
    res.status(404).json({ error: 'node not found' });
    return;
  }

  res.json({ item });
};

export const createNodeController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as {
    id?: unknown;
    type?: unknown;
    update?: unknown;
    sync?: unknown;
    data?: unknown;
    children?: unknown;
    breadcrumb?: unknown;
    breadcrumbs?: unknown;
  };

  const id = asNonEmptyString(body.id);
  const type = asNodeType(body.type);
  const update = asDateOrNull(body.update);

  if (!id || !type || body.sync === undefined) {
    res.status(400).json({ error: 'id, type and sync are required' });
    return;
  }

  if (body.update !== undefined && !update) {
    res.status(400).json({ error: 'update must be a valid date' });
    return;
  }

  const created = await createNode({
    id,
    type,
    update: update ?? undefined,
    sync: body.sync,
    data: body.data
  });

  res.status(201).json({ item: created });
};

export const updateNodeController = async (req: Request, res: Response): Promise<void> => {
  const id = asNonEmptyString(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const body = req.body as {
    type?: unknown;
    update?: unknown;
    sync?: unknown;
    data?: unknown;
    children?: unknown;
    breadcrumb?: unknown;
    breadcrumbs?: unknown;
  };

  const parsedType = body.type === undefined ? undefined : asNodeType(body.type);
  const parsedUpdate = body.update === undefined ? undefined : asDateOrNull(body.update);

  if (parsedType === null) {
    res.status(400).json({ error: 'type must be file or directory' });
    return;
  }

  if (parsedUpdate === null) {
    res.status(400).json({ error: 'update must be a valid date' });
    return;
  }

  if (parsedType === undefined && parsedUpdate === undefined && body.sync === undefined && body.data === undefined) {
    res.status(400).json({ error: 'at least one of type, update, sync or data must be provided' });
    return;
  }

  const updated = await updateNode(id, {
    type: parsedType,
    update: parsedUpdate,
    sync: body.sync,
    data: body.data
  });

  if (!updated) {
    res.status(404).json({ error: 'node not found' });
    return;
  }

  res.json({ item: updated });
};

export const deleteNodeController = async (req: Request, res: Response): Promise<void> => {
  const id = asNonEmptyString(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const deleted = await deleteNode(id);
  if (!deleted) {
    res.status(404).json({ error: 'node not found' });
    return;
  }

  res.status(204).send();
};

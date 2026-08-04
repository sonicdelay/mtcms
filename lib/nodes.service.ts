import "jsr:@std/dotenv/load";
import { MiniNode, Node } from "../../models/node.interface.ts";
import { neon } from "@neon/serverless";

const databaseUrl = Deno.env.get("DATABASE_URL")!;
const sql = neon(databaseUrl);

const rootId = "00000000-0000-4000-8000-000000000000";
const maxDepth = 20;
const defaultData = {
  "id": "0",
  "type": "undefiend",
  "update": new Date().toISOString().replace("T", " ").replace("Z", ""),
  "sync": {},
  "data": {
    "0": {
      "icon": "node",
      "meta": {},
      "title": "Node",
      "parent": rootId,
      "values": {
        "en": {},
      },
      "position": 10,
      "protected": true,
      "reviewGroup": "0",
    },
  },
};

export const getAllNodes = (type: string = "") => {
  return new Promise<Node[]>((resolve, reject) => {
    if (type != "") {
      sql.query("SELECT * FROM nodes WHERE type = LOWER($1)", [type])
        .then((result: unknown) => {
          resolve(result as Node[]);
        })
        .catch((err: any) => reject(err));
      return;
    } else {
      sql.query(`SELECT * FROM nodes`)
        .then((result: any) => {
          resolve(result as Node[]);
        })
        .catch((err: any) => reject(err));
    }
  });
};

export const getNodeById = (id: string) => {
  return new Promise<Node>((resolve, reject) => {
    sql.query("SELECT * FROM nodes WHERE id = $1 LIMIT 1", [id])
      .then((result: unknown[]) => {
        // deno-lint-ignore no-explicit-any
        if ((result as any[]).length == 0) {
          reject(new Error("404 Not Found"));
          return;
        }
        resolve(result[0] as Node);
      })
      .catch((err: Error) => reject(err));
  });
};

export const addNode = (node: Node) => {
  return new Promise<Node>((resolve, reject) => {
    const _node = {
      ...defaultData,
      ...node,
    };
    if (_node.id == "0" || !_node.id) {
      _node.id = crypto.randomUUID();
    }
    try {
      sql.query(
        `
        INSERT INTO nodes (id, type, update, sync, data)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
        `,
        [
          _node.id,
          _node.type,
          _node.update,
          _node.sync,
          _node.data,
        ],
      )
        .then((result: any) => resolve(result[0] as Node))
        .catch((err: Error) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

export const writeNode = (id: string, node: Node) => {
  return new Promise<Node>((resolve, reject) => {
    const _node = {
      ...defaultData,
      ...node,
    };
    if (_node.id == "0" || !_node.id) {
      _node.id = crypto.randomUUID();
    }
    _node.update = new Date().toISOString().replace("T", " ").replace("Z", "");

    try {
      sql.query(
        `
        UPDATE nodes SET id=$1, type=$2, update=$3, sync=$4, data=$5
        WHERE id = $6 RETURNING *
        `,
        [
          _node.id,
          _node.type,
          _node.update,
          _node.sync,
          _node.data,
          id,
        ],
      )
        .then((result: unknown) => {
          if ((result as unknown[]).length == 0) {
            reject(new Error("404 Not Found"));
            return;
          }
          resolve(result as Node);
        })
        .catch((err: Error) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

export const removeNode = (id: string) => {
  return new Promise<void>((resolve, reject) => {
    sql.query("DELETE FROM nodes WHERE id = $1 RETURNING id", [id])
      .then((result) => {
        if (result.length == 0) {
          reject(new Error("404 Not Found"));
        } else {
          resolve();
        }
      })
      .catch((err) => reject(err));
  });
};

export const getChildren = (id: string) => {
  return new Promise<MiniNode[]>((resolve, reject) => {
    sql.query(`
      SELECT id, data->'0'->>'title' AS title
      FROM nodes
      WHERE data @>'{"0":{"parent":"${id}"}}'
      ORDER BY data->'0'->>'position'
    `)
      .then((result) => {
        resolve(result as MiniNode[]);
      })
      .catch((err: Error) => {
        console.log(err);
        reject(err);
      });
  });
};

export const getParent = (id: string) => {
  return new Promise<Node>((resolve, reject) => {
    sql.query(
      `SELECT data->'0'->>'parent' AS parent
       FROM nodes WHERE id = $1 LIMIT 1`,
      [id],
    )
      .then((data: any) => {
        if (data[0] === undefined) reject(new Error("404 Not Found"));
        const pid = data[0].parent;
        sql.query("SELECT * FROM nodes WHERE id = $1 LIMIT 1", [pid])
          .then((result: any) => resolve(result[0] as Node))
          .catch((err: Error) => reject(err));
      })
      .catch((err: Error) => reject(err));
  });
};

export const getBreadcrumb = (id: string) => {
  return new Promise<MiniNode[]>((resolve, reject) => {
    sql.query(
      `WITH RECURSIVE breadcrumb AS (
       SELECT id, data->'0'->>'title' AS title, (data->'0'->>'parent')::UUID AS parent_id
         FROM nodes
         WHERE id = '${id}'
         UNION ALL
       SELECT nodes.id, nodes.data->'0'->>'title' AS title, (nodes.data->'0'->>'parent')::UUID AS parent_id
         FROM breadcrumb
         JOIN nodes ON breadcrumb.parent_id = nodes.id
      )
      SELECT id, title FROM breadcrumb LIMIT ${maxDepth};
    `,
    )
      .then((result) => {
        resolve(result as MiniNode[]);
      })
      .catch((err: Error) => {
        console.log(err);
        reject(err);
      });
  });
};

export const getByData = (searchString: string) => {
  return new Promise<Node[]>((resolve, reject) => {
    sql.query(`SELECT * FROM node WHERE data @> $1)`, [searchString])
      .then((result: any) => resolve(result.result))
      .catch((err: Error) => reject(err));
  });
};

export const getByEmail = (email: string) => {
  return new Promise<Node>((resolve, reject) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(email)) {
      reject(new Error("Invalid email"));
    }
    console.log(email);
    sql.query(
      `SELECT * FROM nodes WHERE type = 'user' AND data->'0'->'values'->'en'->>'email' = $1`,
      [email],
    )
      .then((result: any) => {
        console.log(result);
        resolve(result[0]);
      })
      .catch((err: Error) => reject(err));
  });
};

export const getByType = (type: string) => {
  return new Promise<Node[]>((resolve, reject) => {
    sql.query(
      `SELECT * FROM nodes WHERE type = LOWER($1)`,
      [type],
    )
      .then((result: any) => resolve(result as Node[]))
      .catch((err: Error) => reject(err));
  });
};

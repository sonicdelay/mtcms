import { NextResponse } from "next/server";
import pool from "@/lib/db";

type RouteParams = Promise<{ id: string }>;

export async function GET(
  _request: Request,
  { params }: { params: RouteParams },
) {
  const { id } = await params;
  const {
    rows: [row],
  } = await pool.query(
    `SELECT id, type, update, sync, data FROM nodes WHERE id = $1`,
    [id],
  );

  if (!row) {
    return NextResponse.json({ detail: "Node not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function PUT(
  request: Request,
  { params }: { params: RouteParams },
) {
  const { id } = await params;
  const body = await request.json();
  const { type, sync, data } = body;

  const {
    rows: [row],
  } = await pool.query(
    `UPDATE nodes SET type = COALESCE($1, type), sync = COALESCE($2, sync), data = COALESCE($3, data) WHERE id = $4 RETURNING id, type, update, sync, data`,
    [type, sync, data, id],
  );

  if (!row) {
    return NextResponse.json({ detail: "Node not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(
  _request: Request,
  { params }: { params: RouteParams },
) {
  const { id } = await params;
  const { rowCount } = await pool.query(`DELETE FROM nodes WHERE id = $1`, [
    id,
  ]);

  if (!rowCount) {
    return NextResponse.json({ detail: "Node not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

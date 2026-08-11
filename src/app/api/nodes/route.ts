import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 50);
  const offset = Math.min(Number(searchParams.get("offset") || 0), 1000);

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (type) {
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const q = `SELECT id, type, update, sync, data FROM nodes ${where} ORDER BY update DESC LIMIT $${idx++} OFFSET $${idx++}`;
  values.push(limit, offset);

  const { rows } = await pool.query(q, values);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, sync, data } = body;

console.log("POST /api/nodes", { type, sync, data });



  if (!type || !data) {
    return NextResponse.json(
      { detail: "type and data are required" },
      { status: 400 },
    );
  }

  const {
    rows: [row],
  } = await pool.query(
    `INSERT INTO nodes (type, sync, data) VALUES ($1, $2, $3) RETURNING id, type, update, sync, data`,
    [type, sync || {}, data],
  );

  return NextResponse.json(row, { status: 201 });
}

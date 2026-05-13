import initSqlJs from 'sql.js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let mode = 'sqlite';
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// ---- SQLite ----
async function initSqlite() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run(`CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '', stage INTEGER NOT NULL CHECK(stage BETWEEN 1 AND 4), created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, item_id TEXT NOT NULL, filename TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  saveSqlite();
}

function saveSqlite() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function runSqlite(sql, params = []) {
  db.run(sql, params);
  saveSqlite();
}

function getOneSqlite(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }
  stmt.free();
  return null;
}

function getAllSqlite(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

// ---- PostgreSQL ----
let pool;

async function initPostgres() {
  const { Pool } = pg;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT DEFAULT '', stage INTEGER NOT NULL CHECK(stage >= 1 AND stage <= 4), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE, filename TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`);
}

async function runPostgres(sql, params = []) {
  const client = await pool.connect();
  try { return await client.query(sql, params); }
  finally { client.release(); }
}

async function getOnePostgres(sql, params = []) {
  const client = await pool.connect();
  try { const r = await client.query(sql, params); return r.rows[0] || null; }
  finally { client.release(); }
}

async function getAllPostgres(sql, params = []) {
  const client = await pool.connect();
  try { const r = await client.query(sql, params); return r.rows; }
  finally { client.release(); }
}

// ---- Unified API ----
export async function initDatabase() {
  if (process.env.DATABASE_URL) {
    console.log('[DB] PostgreSQL');
    mode = 'postgres';
    await initPostgres();
  } else {
    console.log('[DB] SQLite');
    mode = 'sqlite';
    await initSqlite();
  }
}

export async function runQuery(sql, params = []) {
  if (mode === 'postgres') {
    // Convert ? to $1, $2, etc for PostgreSQL
    let idx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
    await runPostgres(pgSql, params);
  } else {
    runSqlite(sql, params);
  }
}

export async function getOne(sql, params = []) {
  if (mode === 'postgres') {
    let idx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
    return await getOnePostgres(pgSql, params);
  } else {
    return getOneSqlite(sql, params);
  }
}

export async function getAll(sql, params = []) {
  if (mode === 'postgres') {
    let idx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
    return await getAllPostgres(pgSql, params);
  } else {
    return getAllSqlite(sql, params);
  }
}

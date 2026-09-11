import initSqlJs from 'sql.js';
import pg from 'pg';
import fs from 'fs';
import { config } from '../config/index.js';

let db = null;
let mode = 'sqlite';
const dbPath = config.databasePath;

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
    const temp = `${dbPath}.tmp`;
    fs.writeFileSync(temp, Buffer.from(data), { mode: 0o600 });
    fs.renameSync(temp, dbPath);
  }
}

function runSqlite(sql, params = []) {
  db.run(sql, params);
  saveSqlite();
}

function getOneSqlite(sql, params = []) {
  const stmt = db.prepare(sql);
  try { stmt.bind(params); return stmt.step() ? stmt.getAsObject() : null; }
  finally { stmt.free(); }
}
function getAllSqlite(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    return results;
  } finally { stmt.free(); }
}

// ---- PostgreSQL ----
let pool;

async function initPostgres() {
  const { Pool } = pg;
  pool = new Pool({ connectionString: config.databaseUrl });
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
  if (config.databaseUrl) {
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

export async function closeDatabase() {
  if (pool) { await pool.end(); pool = undefined; }
  if (db) { db.close(); db = null; }
}

export async function runTransaction(statements) {
  if (mode === 'postgres') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [sql, values] of statements) {
        let index = 0;
        await client.query(sql.replace(/\?/g, () => `$${++index}`), values);
      }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  } else {
    db.run('BEGIN');
    try {
      for (const [sql, values] of statements) db.run(sql, values);
      db.run('COMMIT');
    } catch (error) { db.run('ROLLBACK'); throw error; }
    saveSqlite();
  }
}

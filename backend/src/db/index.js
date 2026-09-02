import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate credentials for local & container environments
const getCredentialCandidates = () => {
  const envUser = process.env.POSTGRES_USER;
  const envPass = process.env.POSTGRES_PASSWORD;
  const envHost = process.env.POSTGRES_HOST || 'localhost';
  const envPort = parseInt(process.env.POSTGRES_PORT || '5432');
  const envDb = process.env.POSTGRES_DB || 'notes_db';

  const candidates = [];

  if (envUser) {
    candidates.push({ host: envHost, port: envPort, user: envUser, password: envPass || '', database: envDb });
  }

  // Common defaults (including Docker container user and local postgres user)
  candidates.push({ host: envHost, port: envPort, user: 'notes_user', password: 'notes_password_sec_2026', database: envDb });
  candidates.push({ host: envHost, port: envPort, user: 'notes_user', password: 'notes_password', database: envDb });
  candidates.push({ host: envHost, port: envPort, user: 'postgres', password: 'postgres', database: envDb });
  candidates.push({ host: envHost, port: envPort, user: 'postgres', password: 'password', database: envDb });
  candidates.push({ host: envHost, port: envPort, user: 'postgres', password: '', database: envDb });

  // Remove duplicates based on user+password+database
  const seen = new Set();
  return candidates.filter((c) => {
    const key = `${c.host}:${c.port}:${c.user}:${c.password}:${c.database}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

let activePool = null;

const ensureDatabaseExists = async (creds) => {
  const targetDb = creds.database;
  const sysPool = new Pool({
    ...creds,
    database: 'postgres',
  });

  try {
    const sysClient = await sysPool.connect();
    const checkDbRes = await sysClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (checkDbRes.rows.length === 0) {
      console.log(`⚡ Database '${targetDb}' does not exist. Creating automatically...`);
      await sysClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✅ Database '${targetDb}' created successfully!`);
    }
    sysClient.release();
  } catch (err) {
    // Ignore error if sys database access restricted
  } finally {
    await sysPool.end().catch(() => {});
  }
};

export const initDb = async () => {
  const candidates = getCredentialCandidates();
  let connected = false;
  let lastError = null;

  for (const creds of candidates) {
    try {
      console.log(`Connecting to PostgreSQL database '${creds.database}' at ${creds.host}:${creds.port} as user '${creds.user}'...`);
      activePool = new Pool({
        ...creds,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      });

      const client = await activePool.connect();
      console.log(`✅ Connected to PostgreSQL successfully as user '${creds.user}'.`);

      const sqlPath = path.join(__dirname, 'init.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      await client.query(sql);
      console.log('✅ Database tables and triggers initialized successfully.');
      client.release();
      connected = true;
      break;
    } catch (err) {
      lastError = err;
      if (activePool) {
        await activePool.end().catch(() => {});
      }

      if (err.code === '3D000' || (err.message && err.message.includes('does not exist'))) {
        console.log(`Database '${creds.database}' missing. Attempting auto-creation...`);
        await ensureDatabaseExists(creds);
        try {
          activePool = new Pool(creds);
          const client = await activePool.connect();
          const sqlPath = path.join(__dirname, 'init.sql');
          const sql = fs.readFileSync(sqlPath, 'utf8');
          await client.query(sql);
          client.release();
          connected = true;
          console.log(`✅ Database auto-created & initialized successfully.`);
          break;
        } catch (e2) {
          lastError = e2;
        }
      }
    }
  }

  if (!connected) {
    throw new Error(
      `Could not connect to PostgreSQL database (${lastError ? lastError.message : 'Unknown error'}). Check backend/.env credentials.`
    );
  }
};

export const query = (text, params) => {
  if (!activePool) {
    throw new Error('Database pool not initialized.');
  }
  return activePool.query(text, params);
};

export default activePool;

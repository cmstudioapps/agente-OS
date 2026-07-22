import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'db.json');

let dbCache = null;

async function loadDb() {
  if (dbCache) return dbCache;
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    dbCache = JSON.parse(data);
  } catch (error) {
    dbCache = {};
    await saveDb();
  }
  return dbCache;
}

async function saveDb() {
  await fs.writeFile(dbPath, JSON.stringify(dbCache, null, 2), 'utf8');
}

export async function get(key) {
  const db = await loadDb();
  return db[key];
}

export async function set(key, value) {
  const db = await loadDb();
  db[key] = value;
  await saveDb();
}

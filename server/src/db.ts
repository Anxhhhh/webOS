import { Pool, Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/webos';
const defaultConnectionString = process.env.POSTGRES_DEFAULT_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

// Extract database name from connection string
const getDbName = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.pathname.substring(1) || 'webos';
  } catch (e) {
    // Fallback if URL parsing fails
    const match = url.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : 'webos';
  }
};

const dbName = getDbName(connectionString);

export let pool: Pool;

async function ensureDatabaseExists() {
  console.log(`Checking if database "${dbName}" exists...`);
  const client = new Client({ connectionString: defaultConnectionString });
  
  try {
    await client.connect();
    
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" not found. Creating it...`);
      // CREATE DATABASE cannot run in transaction block, so we just run it directly
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" successfully created.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error ensuring database exists:', err);
    console.log('Attempting to proceed assuming database exists or server permissions will allow direct connection.');
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function runMigrations() {
  console.log('Running database migrations...');
  
  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS filesystem_version (
      id INT PRIMARY KEY,
      version INT NOT NULL DEFAULT 1
    );
  `);

  await pool.query(`
    INSERT INTO filesystem_version (id, version)
    VALUES (1, 1)
    ON CONFLICT (id) DO NOTHING;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS filesystem_items (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      parentId VARCHAR(255),
      originalParentId VARCHAR(255),
      isSystem BOOLEAN DEFAULT false,
      content TEXT,
      createdAt BIGINT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS window_layout (
      id VARCHAR(255) PRIMARY KEY,
      appType VARCHAR(255),
      payload JSONB,
      position JSONB NOT NULL,
      size JSONB NOT NULL,
      maximized BOOLEAN NOT NULL DEFAULT false,
      minimized BOOLEAN NOT NULL DEFAULT false,
      zIndex INTEGER NOT NULL
    );
  `);

  // Check if filesystem_items is empty, if so, seed default items
  const itemsCheck = await pool.query('SELECT COUNT(*) FROM filesystem_items');
  const count = parseInt(itemsCheck.rows[0].count, 10);
  
  if (count === 0) {
    console.log('Seeding default filesystem items...');
    const now = Date.now();
    
    const defaultItems = [
      {
        id: 'docs-folder',
        name: 'Documents',
        type: 'folder',
        parentId: null,
        originalParentId: null,
        isSystem: false,
        content: null,
        createdAt: now
      },
      {
        id: 'nested-folder',
        name: 'Work Projects',
        type: 'folder',
        parentId: 'docs-folder',
        originalParentId: null,
        isSystem: false,
        content: null,
        createdAt: now
      },
      {
        id: 'test-file',
        name: 'README.md',
        type: 'file',
        parentId: 'docs-folder',
        originalParentId: null,
        isSystem: false,
        content: '# Welcome to WebOS\n\nThis is a file saved on the backend!',
        createdAt: now
      },
      {
        id: 'recycle-bin',
        name: 'Recycle Bin',
        type: 'folder',
        parentId: null,
        originalParentId: null,
        isSystem: true,
        content: null,
        createdAt: now
      }
    ];

    for (const item of defaultItems) {
      await pool.query(
        `INSERT INTO filesystem_items (id, name, type, parentId, originalParentId, isSystem, content, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, item.name, item.type, item.parentId, item.originalParentId, item.isSystem, item.content, item.createdAt]
      );
    }
    console.log('Seeding completed.');
  }
  
  console.log('Migrations finished successfully.');
}

export async function initDatabase() {
  await ensureDatabaseExists();
  
  pool = new Pool({ connectionString });
  
  // Test connection and run migrations
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the PostgreSQL database.');
    client.release();
    
    await runMigrations();
  } catch (err) {
    console.error('Failed to initialize database pool or run migrations:', err);
    throw err;
  }
}

// Helper to increment version and return it
export async function incrementVersion(): Promise<number> {
  const result = await pool.query(
    'UPDATE filesystem_version SET version = version + 1 WHERE id = 1 RETURNING version'
  );
  return result.rows[0].version;
}

// Helper to get current version
export async function getCurrentVersion(): Promise<number> {
  const result = await pool.query('SELECT version FROM filesystem_version WHERE id = 1');
  return result.rows[0].version;
}

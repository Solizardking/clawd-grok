import Database from "bun:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { runMigrations } from "./migrations";

let db: Database | null = null;

export function getDatabasePath(): string {
  const dir = path.join(os.homedir(), ".clawd");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return path.join(dir, "clawd.db");
}

export function getDatabase(): Database {
  if (!db) {
    const dbPath = getDatabasePath();
    const isNew = !fs.existsSync(dbPath);
    db = new Database(dbPath);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA busy_timeout = 5000");
    if (isNew || needsMigration(db)) {
      runMigrations(db);
    }
  }
  return db;
}

function needsMigration(database: Database): boolean {
  try {
    const row = database.query("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'").get() as { name: string } | undefined;
    return !row;
  } catch {
    return true;
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function withTransaction<T>(fn: (database: Database) => T): T {
  const database = getDatabase();
  return database.transaction(fn)(database) as T;
}

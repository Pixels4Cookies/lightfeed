import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATABASE_PATH = join(process.cwd(), "db", "lightfeed.sqlite");

let database;

export function getSqliteDatabase() {
  if (database) {
    return database;
  }

  mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  database = new DatabaseSync(DATABASE_PATH);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA busy_timeout = 5000;");
  database.exec("PRAGMA foreign_keys = ON;");

  return database;
}

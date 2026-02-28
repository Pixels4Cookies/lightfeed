import "server-only";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_DATABASE_FILENAME = "lightfeed.sqlite";
const LEGACY_DATABASE_PATH = join(process.cwd(), "db", "lightfeed.sqlite");

function resolveConfiguredPath(configuredValue) {
  const normalizedValue = String(configuredValue ?? "").trim();

  if (!normalizedValue) {
    return "";
  }

  if (isAbsolute(normalizedValue)) {
    return normalizedValue;
  }

  return resolve(process.cwd(), normalizedValue);
}

function resolveDatabasePath() {
  const configuredDatabasePathRaw = String(process.env.LIGHTFEED_DB_PATH ?? "").trim();
  const configuredDatabasePath = resolveConfiguredPath(configuredDatabasePathRaw);

  if (configuredDatabasePath) {
    if (configuredDatabasePathRaw.endsWith("/") || configuredDatabasePathRaw.endsWith("\\")) {
      return join(configuredDatabasePath, DEFAULT_DATABASE_FILENAME);
    }

    if (existsSync(configuredDatabasePath) && statSync(configuredDatabasePath).isDirectory()) {
      return join(configuredDatabasePath, DEFAULT_DATABASE_FILENAME);
    }

    return configuredDatabasePath;
  }

  const configuredDataDirectory = resolveConfiguredPath(process.env.LIGHTFEED_DATA_DIR);
  if (configuredDataDirectory) {
    return join(configuredDataDirectory, DEFAULT_DATABASE_FILENAME);
  }

  return join(homedir(), ".lightfeed", "data", DEFAULT_DATABASE_FILENAME);
}

function copySqliteArtifacts(sourcePath, targetPath) {
  copyFileSync(sourcePath, targetPath);

  for (const suffix of ["-wal", "-shm"]) {
    const sourceArtifactPath = `${sourcePath}${suffix}`;
    if (!existsSync(sourceArtifactPath)) {
      continue;
    }

    copyFileSync(sourceArtifactPath, `${targetPath}${suffix}`);
  }
}

function migrateLegacyDatabaseIfNeeded(databasePath) {
  if (databasePath === LEGACY_DATABASE_PATH) {
    return;
  }

  if (existsSync(databasePath) || !existsSync(LEGACY_DATABASE_PATH)) {
    return;
  }

  mkdirSync(dirname(databasePath), { recursive: true });
  copySqliteArtifacts(LEGACY_DATABASE_PATH, databasePath);
}

const DATABASE_PATH = resolveDatabasePath();

let database;

export function getSqliteDatabase() {
  if (database) {
    return database;
  }

  migrateLegacyDatabaseIfNeeded(DATABASE_PATH);
  mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  try {
    database = new DatabaseSync(DATABASE_PATH);
  } catch (error) {
    const originalMessage =
      error instanceof Error ? error.message : "Unknown database open error.";

    throw new Error(
      `Unable to open SQLite database at "${DATABASE_PATH}". ` +
        `If LIGHTFEED_DB_PATH points to a directory, use LIGHTFEED_DATA_DIR ` +
        `or keep LIGHTFEED_DB_PATH and add a filename (for example: /path/lightfeed.sqlite). ` +
        `Original error: ${originalMessage}`,
      { cause: error },
    );
  }

  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA busy_timeout = 5000;");
  database.exec("PRAGMA foreign_keys = ON;");

  return database;
}

export function getSqliteDatabasePath() {
  return DATABASE_PATH;
}

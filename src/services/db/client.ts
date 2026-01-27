import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

// --- Logic Database Connection ---

type AnyDb = any;

let dbPromise: Promise<AnyDb> | null = null;

async function openDb() {
  if (Platform.OS === "web") {
    throw new Error("SQLite not supported on web in this project.");
  }

  const SQLiteAny: any = SQLite as any;

  // SDK baru (Expo 50+)
  if (typeof SQLiteAny.openDatabaseAsync === "function") {
    return SQLiteAny.openDatabaseAsync("resepbunda.db");
  }

  // Fallback SDK lama
  if (typeof SQLiteAny.openDatabase === "function") {
    return SQLiteAny.openDatabase("resepbunda.db");
  }

  throw new Error("SQLite API not available.");
}

export async function getDb() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

// --- Helper Functions ---

export async function querySql<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  const db = await getDb();

  // Async API
  if (typeof db.getAllAsync === "function") {
    const rows = await db.getAllAsync(sql, params);
    return (rows ?? []) as T[];
  }

  // Legacy API
  return await new Promise<T[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, res: any) => resolve((res?.rows?._array ?? []) as T[]),
        (_: any, err: any) => {
          reject(err);
          return false;
        },
      );
    });
  });
}

export async function execSql(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();

  // Async API
  if (typeof db.runAsync === "function") {
    await db.runAsync(sql, params);
    return;
  }

  // Legacy API
  return await new Promise<void>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        () => resolve(),
        (_: any, err: any) => {
          reject(err);
          return false;
        },
      );
    });
  });
}

export async function execBatch(
  statements: { sql: string; params?: any[] }[],
): Promise<void> {
  const db = await getDb();

  // Async API
  if (
    typeof db.withTransactionAsync === "function" &&
    typeof db.runAsync === "function"
  ) {
    await db.withTransactionAsync(async () => {
      for (const s of statements) {
        await db.runAsync(s.sql, s.params ?? []);
      }
    });
    return;
  }

  // Legacy API
  return await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        for (const s of statements) {
          tx.executeSql(s.sql, s.params ?? []);
        }
      },
      (err: any) => reject(err),
      () => resolve(),
    );
  });
}

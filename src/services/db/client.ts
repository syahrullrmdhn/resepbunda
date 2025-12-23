import * as SQLite from "expo-sqlite";

let dbPromise: Promise<any> | null = null;

async function openDb() {
  if (typeof (SQLite as any).openDatabaseAsync === "function") {
    return (SQLite as any).openDatabaseAsync("resepbunda.db");
  }
  if (typeof (SQLite as any).openDatabase === "function") {
    return (SQLite as any).openDatabase("resepbunda.db");
  }
  throw new Error("SQLite API not available.");
}

export async function getDb() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

export async function querySql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDb();
  if (typeof database.getAllAsync === "function") {
    return (await database.getAllAsync(sql, params)) as T[];
  }
  return await new Promise<T[]>((resolve, reject) => {
    database.transaction((tx: any) => {
      tx.executeSql(sql, params, (_: any, res: any) => resolve(res.rows._array as T[]), (_: any, err: any) => { reject(err); return false; });
    });
  });
}

export async function execSql(sql: string, params: any[] = []): Promise<void> {
  const database = await getDb();
  if (typeof database.runAsync === "function") {
    await database.runAsync(sql, params);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    database.transaction((tx: any) => {
      tx.executeSql(sql, params, () => resolve(), (_: any, err: any) => { reject(err); return false; });
    });
  });
}

// --- BAGIAN INI YANG PENTING AGAR ERROR HILANG ---
export const db = {
  query: querySql,
  execute: execSql,
};

export default db;
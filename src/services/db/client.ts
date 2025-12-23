import * as SQLite from "expo-sqlite";

// Variabel untuk menyimpan koneksi database agar tidak terbuka berulang kali
let dbPromise: Promise<any> | null = null;

/**
 * Fungsi internal untuk membuka koneksi database resepbunda.db
 * Mendukung expo-sqlite versi baru maupun lama
 */
async function openDb() {
  // Cek jika menggunakan expo-sqlite versi baru (SDK 51+)
  if (typeof (SQLite as any).openDatabaseAsync === "function") {
    return (SQLite as any).openDatabaseAsync("resepbunda.db");
  }

  // Fallback untuk versi lama
  if (typeof (SQLite as any).openDatabase === "function") {
    return (SQLite as any).openDatabase("resepbunda.db");
  }

  throw new Error("SQLite API tidak ditemukan. Pastikan expo-sqlite terinstall dengan benar.");
}

/**
 * Mendapatkan instance database yang aktif
 */
export async function getDb() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

/**
 * querySql: Digunakan khusus untuk perintah SELECT (Mengambil Data)
 * Akan mengembalikan hasil dalam bentuk Array of Objects
 */
export async function querySql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDb();

  // API Baru (Async)
  if (typeof database.getAllAsync === "function") {
    return (await database.getAllAsync(sql, params)) as T[];
  }

  // API Lama (Transaction based)
  return await new Promise<T[]>((resolve, reject) => {
    database.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, res: any) => resolve(res.rows._array as T[]),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

/**
 * execSql: Digunakan untuk perintah INSERT, UPDATE, dan DELETE (Mengubah Data)
 */
export async function execSql(sql: string, params: any[] = []): Promise<void> {
  const database = await getDb();

  // API Baru (Async)
  if (typeof database.runAsync === "function") {
    await database.runAsync(sql, params);
    return;
  }

  // API Lama (Transaction based)
  await new Promise<void>((resolve, reject) => {
    database.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        () => resolve(),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

/**
 * --- OBJEK UTAMA DB ---
 * Ini adalah bagian paling penting agar kodingan Bunda Deni di [id].tsx
 * bisa memanggil db.query dan db.execute secara langsung.
 */
export const db = {
  query: querySql,
  execute: execSql,
};

// Ekspor default untuk kemudahan akses
export default db;
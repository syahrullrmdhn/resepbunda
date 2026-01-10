import { execSql, querySql } from "./client";
import { schema } from "./schema";
import { seedRecipes } from "./seeds/recipes";
import { seedUsers } from "./seeds/users";

// Re-export function dasar agar file lain cukup import dari 'services/db'
export { execBatch, execSql, getDb, querySql } from "./client";

// Helper internal
async function columnExists(table: string, column: string) {
  try {
    const cols = await querySql<{ name: string }>(`PRAGMA table_info(${table});`);
    return cols.some((c) => c.name === column);
  } catch (e) {
    return false;
  }
}

// Logic Migrasi User (Menambah kolom jika belum ada)
async function ensureUsersColumns() {
  await execSql(schema.users);
  
  const colsToAdd = [
    { name: "fullName", type: "TEXT" },
    { name: "bio", type: "TEXT" },
    { name: "avatarUrl", type: "TEXT" },
    { name: "badgePrimary", type: "TEXT" },
    { name: "badgeSecondary", type: "TEXT" }
  ];

  for (const col of colsToAdd) {
    if (!(await columnExists("users", col.name))) {
      console.log(`Migrating: Adding ${col.name} to users...`);
      await execSql(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
    }
  }
}

// Logic Migrasi Resep
async function ensureRecipesColumns() {
  await execSql(schema.recipes);
  
  if (!(await columnExists("recipes", "creator_email"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN creator_email TEXT;`);
  }
  if (!(await columnExists("recipes", "image"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN image TEXT;`);
  }
}

// FUNGSI UTAMA INIT
export async function initDb() {
  console.log("🚀 Starting DB Init...");
  
  // 1. Pastikan tabel dibuat
  await execSql(schema.users);
  await execSql(schema.session);
  await execSql(schema.saved_recipes);
  await execSql(schema.recipes);

  // 2. Jalankan Migrasi Kolom
  await ensureUsersColumns(); 
  await ensureRecipesColumns();

  // 3. Init Session Default (Kosong)
  const s = await querySql<{ cnt: number }>("SELECT COUNT(*) as cnt FROM session WHERE id = 1");
  // @ts-ignore
  if ((s[0]?.cnt ?? 0) === 0) {
    await execSql("INSERT INTO session (id, is_logged_in, email, logged_in_at) VALUES (1,0,'','')");
  }

  // 4. JALANKAN SEEDING (Urutan: User dulu -> Baru Resep)
  await seedUsers();
  await seedRecipes();
  
  console.log("✅ DB Init Done & Ready.");
}
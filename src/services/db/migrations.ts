import { execSql, querySql } from "./client"; // sesuaikan import client
import { schema } from "./schema"; // sesuaikan import schema

async function columnExists(table: string, column: string) {
  try {
    const cols = await querySql<{ name: string }>(`PRAGMA table_info(${table});`);
    return cols.some((c) => c.name === column);
  } catch (e) {
    return false;
  }
}

async function ensureUsersColumns() {
  // 1. Pastikan tabel ada dulu
  await execSql(schema.users);

  // 2. Cek apakah kolom fullName ada? Jika tidak, ALTER TABLE
  const hasFullName = await columnExists("users", "fullName");
  if (!hasFullName) {
    console.log("MIGRATION: Adding fullName to users...");
    await execSql(`ALTER TABLE users ADD COLUMN fullName TEXT;`);
  }

  // Cek kolom lainnya juga
  if (!(await columnExists("users", "bio"))) {
    await execSql(`ALTER TABLE users ADD COLUMN bio TEXT;`);
  }
  if (!(await columnExists("users", "avatarUrl"))) {
    await execSql(`ALTER TABLE users ADD COLUMN avatarUrl TEXT;`);
  }
  if (!(await columnExists("users", "badgePrimary"))) {
    await execSql(`ALTER TABLE users ADD COLUMN badgePrimary TEXT;`);
  }
  if (!(await columnExists("users", "badgeSecondary"))) {
    await execSql(`ALTER TABLE users ADD COLUMN badgeSecondary TEXT;`);
  }
}

async function ensureRecipesColumns() {
  await execSql(schema.recipes);
  if (!(await columnExists("recipes", "creator_email"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN creator_email TEXT;`);
  }
  if (!(await columnExists("recipes", "rating"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN rating REAL;`);
  }
  if (!(await columnExists("recipes", "calories"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN calories TEXT;`);
  }
  if (!(await columnExists("recipes", "ingredients"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN ingredients TEXT;`);
  }
  if (!(await columnExists("recipes", "steps"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN steps TEXT;`);
  }
  if (!(await columnExists("recipes", "image"))) {
    await execSql(`ALTER TABLE recipes ADD COLUMN image TEXT;`);
  }
}

async function seedRecipes() {
  await execSql(schema.recipes);
  const r = await querySql<{ cnt: number }>("SELECT COUNT(*) as cnt FROM recipes");
  if ((r[0]?.cnt ?? 0) > 0) return;

  // ... logika seeding Anda ...
  // Pastikan insert seeding juga sesuai kolom baru
}

export async function initDb() {
  console.log("Starting DB Init...");
  
  await execSql(schema.users);
  await execSql(schema.session);
  await execSql(schema.saved_recipes);

  // JALANKAN FUNGSI MIGRASI INI
  await ensureUsersColumns(); 
  await ensureRecipesColumns();

  const s = await querySql<{ cnt: number }>("SELECT COUNT(*) as cnt FROM session WHERE id = 1");
  if ((s[0]?.cnt ?? 0) === 0) {
    await execSql("INSERT INTO session (id, is_logged_in, email, logged_in_at) VALUES (1,0,'','')");
  }

  await seedRecipes();
  console.log("DB Init Done.");
}
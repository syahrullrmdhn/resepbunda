import { execSql, querySql } from "./client";
import { schema } from "./schema";
import { seedRecipes } from "./seeds/recipes";
import { seedUsers } from "./seeds/users";

export { execSql, querySql } from "./client";

// Guard variable
let isInitializing = false;

// --- Helper ---
async function columnExists(table: string, column: string) {
  try {
    const cols = await querySql<{ name: string }>(
      `PRAGMA table_info(${table});`,
    );
    return cols.some((c) => c.name === column);
  } catch (e) {
    return false;
  }
}

async function ensureUsersColumns() {
  await execSql(schema.users);
  const cols = [
    "fullName",
    "bio",
    "avatarUrl",
    "badgePrimary",
    "badgeSecondary",
  ];
  for (const col of cols) {
    if (!(await columnExists("users", col))) {
      await execSql(`ALTER TABLE users ADD COLUMN ${col} TEXT;`);
    }
  }
}

async function ensureRecipesColumns() {
  await execSql(schema.recipes);
  if (!(await columnExists("recipes", "creator_email")))
    await execSql(`ALTER TABLE recipes ADD COLUMN creator_email TEXT;`);
  if (!(await columnExists("recipes", "rating")))
    await execSql(`ALTER TABLE recipes ADD COLUMN rating REAL;`);
  if (!(await columnExists("recipes", "calories")))
    await execSql(`ALTER TABLE recipes ADD COLUMN calories TEXT;`);
  if (!(await columnExists("recipes", "ingredients")))
    await execSql(`ALTER TABLE recipes ADD COLUMN ingredients TEXT;`);
  if (!(await columnExists("recipes", "steps")))
    await execSql(`ALTER TABLE recipes ADD COLUMN steps TEXT;`);
  if (!(await columnExists("recipes", "image")))
    await execSql(`ALTER TABLE recipes ADD COLUMN image TEXT;`);
}

// --- FUNGSI INIT (DENGAN ERROR HANDLING) ---
export async function initDb() {
  if (isInitializing) {
    console.log("⚠️ DB Init skip (Sedang berjalan)");
    return;
  }

  isInitializing = true;
  console.log("🚀 Starting DB Init...");

  try {
    // 1. Setup Tabel (Gunakan try-catch per tabel agar jika satu gagal, yang lain tetap jalan)
    try {
      await execSql(schema.users);
    } catch (e) {
      console.log("Users table exists/busy");
    }
    try {
      await execSql(schema.session);
    } catch (e) {
      console.log("Session table exists/busy");
    }
    try {
      await execSql(schema.recipes);
    } catch (e) {
      console.log("Recipes table exists/busy");
    }

    // TABEL PENTING: Saved Recipes
    try {
      await execSql(schema.saved_recipes);
    } catch (e) {
      console.log("Saved Recipes table exists/busy");
    }

    // 2. Migrasi & Seeding
    await ensureUsersColumns();
    await ensureRecipesColumns();

    const s = await querySql<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM session WHERE id = 1",
    );
    // @ts-ignore
    if ((s[0]?.cnt ?? 0) === 0) {
      await execSql(
        "INSERT INTO session (id, is_logged_in, email, logged_in_at) VALUES (1,0,'','')",
      );
    }

    await seedUsers();
    await seedRecipes();

    console.log("✅ DB Init Selesai.");
  } catch (error) {
    // Kita log error tapi jangan throw, agar aplikasi tetap bisa jalan
    console.warn("⚠️ Warning DB Init (Lock/Busy):", error);
  } finally {
    isInitializing = false;
  }
}

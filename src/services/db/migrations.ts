import { execSql, querySql } from "./client";
import { schema } from "./schema";
import { recipes as recipeSeeds } from "./seeds/recipes";

const MOCK = {
  email: "bunda@example.com",
  password: "Bunda123!",
};

// Check if a column exists in a table
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const info = await querySql<{ name: string }>(`PRAGMA table_info(${tableName})`);
    return info.some((col) => col.name === columnName);
  } catch {
    return false;
  }
}

// Run schema migrations
async function runMigrations() {
  // Migration 1: Add creatorEmail column to recipes table if it doesn't exist
  const hasCreatorEmail = await columnExists("recipes", "creatorEmail");
  if (!hasCreatorEmail) {
    console.log("Running migration: Adding creatorEmail column to recipes...");
    try {
      await execSql("ALTER TABLE recipes ADD COLUMN creatorEmail TEXT");
      // Update existing recipes to set creatorEmail for "Bunda" creator
      await execSql(
        "UPDATE recipes SET creatorEmail = ? WHERE LOWER(creator) = 'bunda'",
        [MOCK.email]
      );
      console.log("Migration complete.");
    } catch (e) {
      console.log("Migration already applied or failed:", e);
    }
  }
}

async function seedRecipes() {
  await execSql(schema.recipes);

  const r = await querySql<{ cnt: number }>("SELECT COUNT(*) as cnt FROM recipes");
  if ((r[0]?.cnt ?? 0) === 0) {
    console.log("Seeding recipes...");
    const insertQuery = `
      INSERT INTO recipes (title, description, creator, creatorEmail, creatorType, cookingTime, category, isPrivate, rating, calories, ingredients, steps) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (const recipe of recipeSeeds) {
      await execSql(insertQuery, [
        recipe.title,
        recipe.description,
        recipe.creator,
        recipe.creatorEmail || null,
        recipe.creatorType,
        recipe.cookingTime,
        recipe.category,
        recipe.isPrivate ? 1 : 0,
        recipe.rating,
        recipe.calories,
        JSON.stringify(recipe.ingredients),
        JSON.stringify(recipe.steps),
      ]);
    }
    console.log("Seeding complete.");
  }
}

export async function initDb() {
  try {
    await execSql(schema.users);
  } catch (e) {
    // Ignore if table already exists
  }

  try {
    await execSql(schema.session);
  } catch (e) {
    // Ignore if table already exists
  }

  // Create recipes table
  try {
    await execSql(schema.recipes);
  } catch (e) {
    // Ignore if table already exists
  }

  // Run migrations for existing databases
  await runMigrations();

  // Seed mock user
  const u = await querySql<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM users WHERE email = ?",
    [MOCK.email]
  );
  if ((u[0]?.cnt ?? 0) === 0) {
    try {
      await execSql(
        "INSERT INTO users (email, password, created_at) VALUES (?,?,?)",
        [MOCK.email, MOCK.password, new Date().toISOString()]
      );
    } catch (e) {
      // User already exists
    }
  }

  // Seed session
  const s = await querySql<{ cnt: number }>("SELECT COUNT(*) as cnt FROM session WHERE id = 1");
  if ((s[0]?.cnt ?? 0) === 0) {
    try {
      await execSql("INSERT INTO session (id, is_logged_in, email, logged_in_at) VALUES (1,0,' ',' ')");
    } catch (e) {
      // Session already exists
    }
  }

  await seedRecipes();
}

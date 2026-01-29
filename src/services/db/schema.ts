export const schema = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      fullName TEXT,
      bio TEXT,
      avatarUrl TEXT,
      badgePrimary TEXT,
      badgeSecondary TEXT,
      created_at TEXT NOT NULL
    );
  `,
  session: `
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY NOT NULL,
      is_logged_in INTEGER NOT NULL,
      email TEXT NOT NULL,
      logged_in_at TEXT
    );
  `,
  recipes: `
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      creator TEXT,
      creatorType TEXT,
      creator_email TEXT,
      cookingTime TEXT,
      difficulty TEXT DEFAULT 'Medium', -- KOLOM BARU
      status TEXT DEFAULT 'Draft',      -- KOLOM BARU
      category TEXT,
      isPrivate INTEGER DEFAULT 0,
      rating REAL,
      calories TEXT,
      ingredients TEXT,
      steps TEXT,
      image TEXT
    );
  `,
  saved_recipes: `
    CREATE TABLE IF NOT EXISTS saved_recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_email, recipe_id)
    );
  `,
};

export const schema = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `,
  session: `
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_logged_in INTEGER NOT NULL,
      email TEXT NOT NULL,
      logged_in_at TEXT NOT NULL
    );
  `,
  recipes: `
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      creator TEXT NOT NULL,
      creatorEmail TEXT,
      creatorType TEXT NOT NULL,
      cookingTime TEXT NOT NULL,
      category TEXT NOT NULL,
      isPrivate INTEGER NOT NULL DEFAULT 0,
      rating REAL,
      calories TEXT,
      ingredients TEXT,
      steps TEXT
    );
  `,
};

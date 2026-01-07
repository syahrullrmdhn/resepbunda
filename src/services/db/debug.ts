import { querySql } from "./index";

/**
 * Fungsi ini cuma buat ngecek isi DB di console.
 * Panggil fungsi ini di _layout.tsx atau HomeScreen.
 */
export const debugDatabase = async () => {
  console.log("🔍 === DEBUGGING DATABASE START === 🔍");

  try {
    // 1. Cek User
    const users = await querySql("SELECT id, email, fullName, password FROM users");
    console.log(`👤 Users (${users.length}):`);
    if (users.length > 0) console.table(users);
    else console.log("   (Tabel Users Kosong)");

    // 2. Cek Session (Siapa yang login)
    const session = await querySql("SELECT * FROM session");
    console.log(`🔑 Session:`);
    if (session.length > 0) console.table(session);
    else console.log("   (Tidak ada session aktif)");

    // 3. Cek Recipes
    const recipes = await querySql("SELECT id, title, creator_email, isPrivate FROM recipes");
    console.log(`🍳 Recipes (${recipes.length}):`);
    if (recipes.length > 0) console.table(recipes);
    else console.log("   (Tabel Recipes Kosong)");

  } catch (e) {
    console.error("❌ Debug Error:", e);
  }

  console.log("🔍 === DEBUGGING DATABASE END === 🔍");
};
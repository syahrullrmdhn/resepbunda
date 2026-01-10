import { execSql, querySql } from "../client"; // Import dari client yg baru

export const seedRecipes = async () => {
  try {
    const check = await querySql("SELECT count(*) as count FROM recipes");
    // @ts-ignore
    if (check[0]?.count > 0) {
      console.log("✅ Recipes already seeded, skipping...");
      return;
    }

    console.log("🌱 Seeding Recipes...");
    
    // Kita pakai email Mas Lutfi (Ketua) sebagai pemilik resep
    const defaultCreatorEmail = "1001230027@student.com"; 
    const defaultCreatorName = "Lutfi Dwi Maftia Z.";

    const recipes = [
      {
        title: "Nasi Goreng Spesial",
        desc: "Nasi goreng kampung dengan bumbu rahasia keluarga, cocok untuk sarapan.",
        time: "15 mnt",
        cat: "breakfast",
        calories: "300 kkal",
      },
      {
        title: "Sop Iga Sapi",
        desc: "Sop iga dengan kuah bening yang segar dan daging empuk meresap.",
        time: "60 mnt",
        cat: "lunch",
        calories: "450 kkal",
      },
      {
        title: "Pancake Fluffy",
        desc: "Pancake super lembut ala cafe Jepang, manis dan lumer di mulut.",
        time: "20 mnt",
        cat: "dessert",
        calories: "250 kkal",
      }
    ];

    for (const r of recipes) {
      await execSql(
        `INSERT INTO recipes (
          title, description, creator, creatorType, creator_email, 
          cookingTime, category, isPrivate, rating, calories, 
          ingredients, steps, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.title,
          r.desc,
          defaultCreatorName,
          "Home Cook",
          defaultCreatorEmail,
          r.time,
          r.cat,
          0, // 0 = Public
          5.0,
          r.calories,
          JSON.stringify(["Bahan A", "Bahan B", "Bumbu Rahasia"]),
          JSON.stringify(["Siapkan bahan", "Masak hingga matang", "Sajikan hangat"]),
          null 
        ]
      );
    }
    console.log("✅ Recipes seeded successfully!");
  } catch (e) {
    console.error("❌ Seed Recipes Error:", e);
  }
};
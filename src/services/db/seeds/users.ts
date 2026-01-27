import { execBatch, querySql } from "../client"; // Import dari client yg baru

export const seedUsers = async () => {
  try {
    const check = await querySql("SELECT count(*) as cnt FROM users");
    // @ts-ignore
    if (check[0]?.cnt > 0) {
      console.log("✅ Users already seeded, skipping...");
      return;
    }

    console.log("🌱 Seeding Users from Team Data...");

    // Data sesuai gambar screenshot
    const users = [
      {
        nim: "1001230027",
        name: "Lutfi Dwi Maftia Z.",
        role: "Ketua",
        bio: "Ketua Tim - Coding is life 💻",
      },
      {
        nim: "1002230052",
        name: "Syahrul Ramadhan",
        role: "Anggota",
        bio: "Hobi makan, cita-cita kurus.",
      },
      {
        nim: "1002230062",
        name: "Vointra Namara Fidelito",
        role: "Anggota",
        bio: "Explorer kuliner nusantara 🌶️",
      },
      {
        nim: "1002230076",
        name: "R. Wahyu Purba Hanny Kusuma",
        role: "Anggota",
        bio: "Master Chef in the making 👨‍🍳",
      },
      {
        nim: "1003230019",
        name: "Muhammad Syahid Azhar Azizi",
        role: "Anggota",
        bio: "Suka masak yang simple-simple aja.",
      },
      {
        nim: "1003230028",
        name: "Dyo Aristo Fransiscus",
        role: "Anggota",
        bio: "Pecinta kopi dan senja ☕",
      },
      {
        nim: "1003230043",
        name: "Zikri Firmansyah",
        role: "Anggota",
        bio: "Food vlogger wannabe 📷",
      },
      {
        nim: "1003230027",
        name: "Deni Hermawan",
        role: "Anggota",
        bio: "Masakan ibu adalah yang terbaik.",
      },
      {
        nim: "1003240040",
        name: "Jumanta",
        role: "Anggota",
        bio: "Anak kosan survival guide creator.",
      },
    ];

    const statements = users.map((u) => {
      const email = `${u.nim}@student.com`;
      // Pakai UI Avatars biar ada inisial nama
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&size=128`;

      return {
        sql: `INSERT INTO users (email, password, fullName, bio, avatarUrl, badgePrimary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [
          email,
          "1234567", // Password default
          u.name,
          u.bio,
          avatarUrl,
          u.role === "Ketua" ? "Ketua Tim" : "Mahasiswa",
          new Date().toISOString(),
        ],
      };
    });

    await execBatch(statements);
    console.log(`✅ Successfully seeded ${users.length} users!`);
  } catch (e) {
    console.error("❌ Error seeding users:", e);
  }
};

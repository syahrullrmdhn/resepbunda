import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Flame,
  Heart,
  Play,
  Share2,
  Users,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/providers/AuthProvider"; // Import Auth
import { execSql, querySql } from "../../src/services/db"; // Pastikan import execSql ada
import { theme } from "../../src/theme";
import type { Recipe } from "../../src/types/recipe";

const COLORS = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSec: "#64748B",
  primary: theme.colors.primary.DEFAULT || "#4F46E5",
};

function toStrArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [String(v)];
  }
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth(); // Ambil Session

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  useEffect(() => {
    (async () => {
      try {
        const recipeId = Number(id);
        if (!Number.isFinite(recipeId)) return;
        const rows = await querySql<Recipe>(
          "SELECT * FROM recipes WHERE id = ? LIMIT 1",
          [recipeId],
        );
        setRecipe(rows[0] ?? null);
      } catch (e) {
        console.error("Failed to fetch recipe details", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // CEK BOOKMARK (Dengan Safety Check)
  useEffect(() => {
    if (recipe && session?.email) {
      checkIsBookmarked();
    }
  }, [recipe, session?.email]);

  const checkIsBookmarked = async () => {
    try {
      // Safety: Pastikan tabel ada sebelum select
      await execSql(
        `CREATE TABLE IF NOT EXISTS saved_recipes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_email TEXT NOT NULL, recipe_id INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(user_email, recipe_id));`,
      );

      const result = await querySql(
        "SELECT id FROM saved_recipes WHERE user_email = ? AND recipe_id = ?",
        [session?.email, recipe?.id],
      );
      setIsBookmarked(result.length > 0);
    } catch (e) {
      console.log("Check bookmark skipped:", e);
    }
  };

  // HANDLER TOMBOL LOVE
  const handleToggleBookmark = async () => {
    if (!session?.email) {
      Alert.alert("Login Diperlukan", "Silakan login dulu.");
      return;
    }
    if (!recipe) return;

    try {
      // 1. FORCE CREATE TABLE (Solusi Masalah Table Locked/Missing)
      await execSql(`
        CREATE TABLE IF NOT EXISTS saved_recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          recipe_id INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(user_email, recipe_id)
        );
      `);

      if (isBookmarked) {
        // DELETE
        await execSql(
          "DELETE FROM saved_recipes WHERE user_email = ? AND recipe_id = ?",
          [session.email, recipe.id],
        );
        setIsBookmarked(false);
      } else {
        // INSERT
        await execSql(
          "INSERT INTO saved_recipes (user_email, recipe_id, created_at) VALUES (?, ?, ?)",
          [session.email, recipe.id, new Date().toISOString()],
        );
        setIsBookmarked(true);
      }
    } catch (e) {
      console.error("Gagal save:", e);
      Alert.alert("Database Error", "Gagal menyimpan: " + String(e));
    }
  };

  const ingredients = useMemo(
    () => toStrArray((recipe as any)?.ingredients),
    [recipe],
  );
  const steps = useMemo(() => toStrArray((recipe as any)?.steps), [recipe]);

  if (loading || !recipe) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.navbar, { top: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.navActions}>
          <TouchableOpacity style={styles.navBtn}>
            <Share2 size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, isBookmarked && styles.navBtnActive]}
            onPress={handleToggleBookmark}
          >
            <Heart
              size={20}
              color="#FFF"
              fill={isBookmarked ? "#FFF" : "transparent"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.image || "https://via.placeholder.com/400" }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
            <Text style={styles.heroCreator}>Oleh {recipe.creator}</Text>
          </View>
        </View>

        <View style={styles.sheetContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Clock size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{recipe.cookingTime}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Flame size={16} color="#F59E0B" />
              <Text style={styles.statValue}>{recipe.calories || "-"}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Users size={16} color="#10B981" />
              <Text style={styles.statValue}>2 Porsi</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi</Text>
            <Text style={styles.descriptionText}>{recipe.description}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Bahan ({ingredients.length})
            </Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.bulletPoint} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Langkah ({steps.length})</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepItem}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.fabContainer, { paddingBottom: insets.bottom || 20 }]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push(`/cooking/${recipe.id}`)}
        >
          <Play size={20} color="#FFF" fill="#FFF" />
          <Text style={styles.fabText}>Mulai Masak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  navbar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  navActions: { flexDirection: "row", gap: 12 },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  navBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  heroContainer: { height: 420, width: "100%", position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  heroContent: { position: "absolute", bottom: 60, left: 20, right: 20 },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  heroCreator: { fontSize: 14, color: "#E2E8F0" },
  sheetContainer: {
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingTop: 32,
    minHeight: 500,
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textMain,
    marginTop: 4,
  },
  verticalDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: 12,
  },
  descriptionText: { fontSize: 15, lineHeight: 24, color: COLORS.textSec },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 24 },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  ingredientText: { flex: 1, fontSize: 15, color: COLORS.textMain },
  stepItem: { flexDirection: "row", marginBottom: 20 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.textMain,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumber: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 24, color: COLORS.textMain },
  fabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    width: "100%",
    height: 56,
    borderRadius: 16,
    gap: 10,
  },
  fabText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- IMPORTS ---
import { querySql } from "../../src/services/db";
import { theme } from "../../src/theme"; // Menggunakan theme yang Anda berikan
import { Recipe } from "../../src/types/recipe";

// --- CATEGORIES CONFIG ---
const CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "breakfast", label: "Sarapan" },
  { id: "lunch", label: "Makan Siang" },
  { id: "dinner", label: "Makan Malam" },
  { id: "dessert", label: "Dessert" },
  { id: "snack", label: "Cemilan" },
];

// --- COMPONENT: RECIPE CARD ---
const RecipeCard = ({ item }: { item: Recipe }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.9}
    onPress={() => router.push(`/recipe/${item.id}`)}
  >
    <Image
      source={{
        uri:
          item.image ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
      }}
      style={styles.cardImage}
      resizeMode="cover"
    />

    <View style={styles.cardContent}>
      <View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description || "Tidak ada deskripsi singkat."}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.creatorContainer}>
          <Text style={styles.byText}>Oleh</Text>
          <Text style={styles.creatorText}>{item.creator || "Chef"}</Text>
        </View>

        {/* Meta Info */}
        <View style={styles.metaBadge}>
          <Ionicons
            name="time-outline"
            size={14}
            color={theme.colors.neutral.medium}
            style={styles.metaIcon}
          />
          <Text style={styles.metaText}>{item.cookingTime || "15m"}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={[styles.metaText, { textTransform: "capitalize" }]}>
            {item.category || "Umum"}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// --- MAIN SCREEN ---
export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);

  // 1. Fetch Data Real
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const result = await querySql<Recipe>(
        "SELECT * FROM recipes WHERE isPrivate = 0 ORDER BY id DESC",
      );
      setRecipes(result);
      // Terapkan filter saat ini (karena fetch mereset data)
      applyFilters(result, selectedCategory, searchQuery);
    } catch (e) {
      console.error("Gagal ambil data home:", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Logic Filter Gabungan (Search + Category)
  const applyFilters = (data: Recipe[], categoryId: string, query: string) => {
    let result = data;

    // Filter Kategori
    if (categoryId !== "all") {
      result = result.filter(
        (r) => r.category?.toLowerCase() === categoryId.toLowerCase(),
      );
    }

    // Filter Search Text
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(lowerQuery));
    }

    setFilteredRecipes(result);
  };

  // Handler Ganti Kategori
  const handleCategoryPress = (catId: string) => {
    setSelectedCategory(catId);
    applyFilters(recipes, catId, searchQuery);
  };

  // Handler Ketik Search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(recipes, selectedCategory, text);
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.neutral.bg}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, Chef!</Text>
          <Text style={styles.subGreeting}>Mau masak apa hari ini?</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
            }}
            style={styles.avatarImg}
          />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR (BARU) */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.neutral.medium}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari resep spesial..."
            placeholderTextColor={theme.colors.neutral.medium}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.colors.neutral.medium}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER KATEGORI */}
      <View style={{ height: 50 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <Text
                  style={[styles.catText, isActive && styles.catTextActive]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* LIST RESEP */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary.DEFAULT}
          />
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RecipeCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={theme.colors.neutral.light}
              />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `Tidak ada hasil untuk "${searchQuery}"`
                  : "Belum ada resep di kategori ini."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// --- STYLES (Menggunakan Theme) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // HEADER
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontFamily: theme.font.bold,
    fontSize: 22,
    color: theme.colors.neutral.dark,
  },
  subGreeting: {
    fontFamily: theme.font.regular,
    fontSize: 14,
    color: theme.colors.neutral.medium,
    marginTop: 2,
  },
  avatarBtn: {
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
    borderRadius: 25,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // SEARCH BAR
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // Putih agar kontras dengan bg abu
    borderRadius: theme.radius.md, // Radius 16
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
    // Optional shadow
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontFamily: theme.font.medium,
    fontSize: 14,
    color: theme.colors.neutral.dark,
    height: "100%",
  },

  // CATEGORIES
  categoriesContainer: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.lg, // Radius 22
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.DEFAULT,
  },
  catText: {
    fontFamily: theme.font.medium,
    fontSize: 13,
    color: theme.colors.neutral.medium,
  },
  catTextActive: {
    color: "#FFFFFF",
    fontFamily: theme.font.bold,
  },

  // LIST
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 120, // UX Fix agar tidak mentok bawah
  },
  emptyState: {
    paddingTop: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.medium,
    textAlign: "center",
  },

  // CARD
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm, // 12
    marginBottom: theme.spacing.md, // 16
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.neutral.light,
  },
  cardContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  cardTitle: {
    fontFamily: theme.font.bold,
    fontSize: 16,
    color: theme.colors.neutral.dark,
    marginBottom: 4,
    lineHeight: 22,
  },
  cardDesc: {
    fontFamily: theme.font.regular,
    fontSize: 12,
    color: theme.colors.neutral.medium,
    lineHeight: 18,
    marginBottom: 8,
  },

  // Footer Card
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  creatorContainer: {},
  byText: {
    fontFamily: theme.font.regular,
    fontSize: 10,
    color: theme.colors.neutral.medium,
  },
  creatorText: {
    fontFamily: theme.font.semibold,
    fontSize: 12,
    color: theme.colors.neutral.dark,
  },

  // Meta Badge (Time & Category)
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.neutral.bg, // f8fafc
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontFamily: theme.font.medium,
    fontSize: 11,
    color: theme.colors.neutral.medium,
  },
  metaSeparator: {
    fontFamily: theme.font.medium,
    fontSize: 11,
    color: theme.colors.neutral.light, // Divider color
    marginHorizontal: 6,
  },
});

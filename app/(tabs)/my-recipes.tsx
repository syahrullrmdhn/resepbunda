import { router, useFocusEffect } from "expo-router";

import {
  ChefHat,
  Clock,
  Edit3,
  Filter,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- DEPENDENCIES ---
import { CATEGORIES, getCategoryLabel } from "../../src/constants/categories";
import { execSql, querySql } from "../../src/services/db";
import { theme } from "../../src/theme"; // Mengambil font Mulish dari sini
import type { Recipe } from "../../src/types/recipe";

// --- COLORS PALETTE ---
const COLORS = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSec: "#64748B",
  primary: theme.colors.primary.DEFAULT || "#059669",
  danger: "#EF4444",
  inputBg: "#F1F5F9",
};

// --- COMPONENT: RECIPE CARD ---
interface MyRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MyRecipeCard: React.FC<MyRecipeCardProps> = ({
  recipe,
  onPress,
  onEdit,
  onDelete,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{
          uri:
            recipe.image ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      <View style={styles.cardContent}>
        {/* Header: Badge & Status */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.badgeContainer}>
            <Text style={styles.categoryBadge}>
              {getCategoryLabel
                ? getCategoryLabel(recipe.category)
                : recipe.category}
            </Text>
          </View>
          {recipe.isPrivate === 1 && (
            <View style={styles.draftBadge}>
              <Text style={styles.draftText}>DRAFT</Text>
            </View>
          )}
        </View>

        {/* Title & Desc */}
        <Text style={styles.cardTitle} numberOfLines={1}>
          {recipe.title || "Tanpa Judul"}
        </Text>

        <Text style={styles.cardDesc} numberOfLines={2}>
          {recipe.description || "Tidak ada deskripsi singkat."}
        </Text>

        {/* Footer: Meta & Actions */}
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Clock size={14} color={COLORS.textSec} />
            <Text style={styles.metaText}>
              {recipe.cookingTime || "15 mnt"}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
              <Edit3 size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, styles.iconBtnDanger]}
              onPress={onDelete}
            >
              <Trash2 size={16} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- MAIN SCREEN ---
export default function MyRecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States Filter & Tab
  const [activeTab, setActiveTab] = useState<"published" | "draft">(
    "published",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 1. Fetch Data
  const fetchMyRecipes = async () => {
    try {
      setIsLoading(true);
      const session = await querySql<{ email: string }>(
        "SELECT email FROM session WHERE id = 1",
      );

      if (session.length > 0 && session[0].email) {
        const userEmail = session[0].email;
        const result = await querySql<Recipe>(
          "SELECT * FROM recipes WHERE creator_email = ? ORDER BY id DESC",
          [userEmail],
        );
        setRecipes(result);
      } else {
        setRecipes([]);
      }
    } catch (e) {
      console.error("Error fetching recipes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Logic Filter
  const applyFilters = useCallback(() => {
    let result = recipes;

    // Filter Tab
    if (activeTab === "published") {
      result = result.filter((r) => r.isPrivate === 0);
    } else {
      result = result.filter((r) => r.isPrivate === 1);
    }

    // Filter Kategori
    if (selectedCategory !== "all") {
      result = result.filter((r) => r.category === selectedCategory);
    }

    // Filter Search
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(lowerQ));
    }

    setFilteredRecipes(result);
  }, [recipes, activeTab, selectedCategory, searchQuery]);

  // --- ACTIONS ---

  // [FIX NAVIGATION] Edit: Ke edit-recipe page
  const handleEdit = (recipe: Recipe) => {
    router.push(`/edit-recipe?id=${recipe.id}`);
  };

  // Handle Delete
  const handleDelete = (recipe: Recipe) => {
    Alert.alert(
      "Hapus Resep",
      `Yakin ingin menghapus resep "${recipe.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await execSql("DELETE FROM recipes WHERE id = ?", [recipe.id]);
              fetchMyRecipes();
            } catch (e) {
              Alert.alert("Error", "Gagal menghapus data.");
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyRecipes();
    }, []),
  );

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Koleksi Saya</Text>
          <Text style={styles.headerSubtitle}>Kelola resep buatanmu</Text>
        </View>

        {/* [FIX NAVIGATION] Tombol Buat Baru: Ke create-form (tanpa ID) */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/create-form")}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFF" />
          <Text style={styles.createButtonText}>Buat Baru</Text>
        </TouchableOpacity>
      </View>

      {/* TOOLBAR */}
      <View style={styles.toolbar}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textSec} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari resep saya..."
            placeholderTextColor={COLORS.textSec}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={COLORS.textSec} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            selectedCategory !== "all" && styles.filterBtnActive,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter
            size={20}
            color={selectedCategory !== "all" ? COLORS.primary : COLORS.textSec}
          />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <Pressable
            style={[
              styles.tabItem,
              activeTab === "published" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("published")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "published" && styles.tabTextActive,
              ]}
            >
              Terbit ({recipes.filter((r) => r.isPrivate === 0).length})
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabItem,
              activeTab === "draft" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("draft")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "draft" && styles.tabTextActive,
              ]}
            >
              Draf ({recipes.filter((r) => r.isPrivate === 1).length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* LIST */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MyRecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <ChefHat size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === "published" ? "Belum Ada Resep" : "Draf Kosong"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "published"
                  ? "Kamu belum menerbitkan resep apapun. Yuk, bagikan masakan andalanmu!"
                  : "Tidak ada resep yang disimpan di draf saat ini."}
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL FILTER */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Kategori</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={20} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.modalOption,
                    selectedCategory === cat.id && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedCategory === cat.id &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {selectedCategory === cat.id && (
                    <Utensils size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedCategory !== "all" && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSelectedCategory("all");
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.resetFilterText}>Reset Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center" },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.font.bold, // Mulish Bold
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSec,
    marginTop: 2,
    fontFamily: theme.font.regular, // Mulish Regular
  },
  createButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "#FFF",
    fontFamily: theme.font.bold, // Mulish Bold
    fontSize: 14,
  },

  // TOOLBAR
  toolbar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textMain,
    fontFamily: theme.font.medium, // Mulish Medium
    height: "100%",
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterBtnActive: { backgroundColor: "#ECFDF5", borderColor: COLORS.primary },

  // TABS
  tabContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontFamily: theme.font.medium, // Mulish Medium
    color: COLORS.textSec,
  },
  tabTextActive: {
    color: COLORS.textMain,
    fontFamily: theme.font.bold, // Mulish Bold
  },

  // LIST & CARD
  listContent: { padding: 20, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badgeContainer: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadge: {
    fontSize: 10,
    fontFamily: theme.font.bold, // Mulish Bold
    color: COLORS.textSec,
    textTransform: "uppercase",
  },
  draftBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  draftText: {
    fontSize: 10,
    fontFamily: theme.font.bold, // Mulish Bold
    color: "#D97706",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: theme.font.bold, // Mulish Bold
    color: COLORS.textMain,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textSec,
    fontFamily: theme.font.regular, // Mulish Regular
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: theme.font.medium, // Mulish Medium
    color: COLORS.textSec,
  },
  actionRow: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDanger: { backgroundColor: "#FEF2F2" },

  // EMPTY STATE
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold, // Mulish Bold
    color: COLORS.textMain,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSec,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: theme.font.medium, // Mulish Medium
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold, // Mulish Bold
    color: COLORS.textMain,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBg,
  },
  modalOptionActive: { backgroundColor: "#F8FAFC" },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.textMain,
    fontFamily: theme.font.medium, // Mulish Medium
  },
  modalOptionTextActive: {
    color: COLORS.primary,
    fontFamily: theme.font.bold, // Mulish Bold
  },
  resetFilterBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
  },
  resetFilterText: {
    color: COLORS.textSec,
    fontFamily: theme.font.semibold, // Mulish SemiBold
    fontSize: 14,
  },
});

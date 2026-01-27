import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// --- DEPENDENCIES ---
import { useAuth } from "../providers/AuthProvider";
import { execSql, querySql } from "../services/db";
import { theme } from "../theme";
import { Recipe } from "../types/recipe";

const STATUSBAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

// --- COLORS (Slate Palette - Consistent with other screens) ---
const COLORS = {
  bg: "#F8FAFC", // Slate-50
  surface: "#FFFFFF",
  border: "#E2E8F0", // Slate-200
  textMain: "#0F172A", // Slate-900
  textSec: "#64748B", // Slate-500
  primary: theme.colors.primary.DEFAULT || "#4F46E5",
  danger: "#EF4444", // Red-500
  inputBg: "#F1F5F9", // Slate-100
};

// --- SUB-COMPONENT: RECIPE CARD ---
const SavedRecipeCard = ({
  item,
  onPress,
  onDelete,
}: {
  item: Recipe;
  onPress: () => void;
  onDelete: () => void;
}) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
    <Image
      source={{
        uri:
          item.image ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      }}
      style={styles.cardImage}
      resizeMode="cover"
    />

    <View style={styles.cardContent}>
      <View>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.categoryBadge}>{item.category || "Umum"}</Text>
          <View style={styles.savedBadge}>
            <Ionicons name="heart" size={10} color="#FFF" />
            <Text style={styles.savedText}>Disimpan</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.cardCreator}>Oleh {item.creator || "Chef"}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaBadge}>
          <Ionicons name="time-outline" size={12} color={COLORS.textSec} />
          <Text style={styles.metaText}>{item.cookingTime || "20m"}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const SavedRecipesScreen = () => {
  const { session } = useAuth();

  // STATE
  const [allData, setAllData] = useState<Recipe[]>([]);
  const [displayedData, setDisplayedData] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState("");

  // --- DATABASE LOGIC ---
  const fetchSavedData = async () => {
    if (!session?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Ensure Table Exists (Safety)
      await execSql(`
        CREATE TABLE IF NOT EXISTS saved_recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          recipe_id INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(user_email, recipe_id)
        );
      `);

      // Query JOIN: Mengambil resep yang ada di tabel recipes TAPI hanya yang ID-nya ada di saved_recipes milik user ini
      const result = await querySql<Recipe>(
        `SELECT r.* FROM recipes r 
         JOIN saved_recipes s ON r.id = s.recipe_id 
         WHERE s.user_email = ? 
         ORDER BY s.created_at DESC`,
        [session.email],
      );

      setAllData(result);

      // Handle Filter Search jika sedang aktif
      if (searchText) {
        setDisplayedData(
          result.filter((i) =>
            i.title.toLowerCase().includes(searchText.toLowerCase()),
          ),
        );
      } else {
        setDisplayedData(result);
      }
    } catch (error) {
      console.error("Error fetching saved data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data setiap kali layar ini fokus (agar sinkron dengan Detail Screen)
  useFocusEffect(
    useCallback(() => {
      fetchSavedData();
    }, [session?.email]),
  );

  // --- HANDLERS ---

  const handleRemove = (id: number) => {
    Alert.alert(
      "Hapus dari Favorit?",
      "Resep ini akan dihapus dari koleksi Anda.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            // 1. Optimistic Update (Hapus dari UI dulu biar cepat)
            const prevAll = [...allData];
            const prevDisp = [...displayedData];

            const newAll = allData.filter((item) => item.id !== id);
            const newDisp = displayedData.filter((item) => item.id !== id);

            setAllData(newAll);
            setDisplayedData(newDisp);

            try {
              // 2. Hapus dari Database
              if (session?.email) {
                await execSql(
                  "DELETE FROM saved_recipes WHERE recipe_id = ? AND user_email = ?",
                  [id, session.email],
                );
              }
            } catch (e) {
              // 3. Rollback jika error
              console.error("Gagal hapus:", e);
              Alert.alert("Error", "Gagal menghapus, data dikembalikan.");
              setAllData(prevAll);
              setDisplayedData(prevDisp);
            }
          },
        },
      ],
    );
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
      const filtered = allData.filter((item) =>
        item.title.toLowerCase().includes(text.toLowerCase()),
      );
      setDisplayedData(filtered);
    } else {
      setDisplayedData(allData);
    }
  };

  const toggleSearch = () => {
    if (isSearching) {
      Keyboard.dismiss();
      setIsSearching(false);
      setSearchText("");
      setDisplayedData(allData);
    } else {
      setIsSearching(true);
    }
  };

  // --- RENDERERS ---

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="heart-outline" size={48} color={COLORS.textSec} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchText ? "Tidak Ditemukan" : "Belum Ada Favorit"}
      </Text>
      <Text style={styles.emptySub}>
        {searchText
          ? `Tidak ada hasil untuk "${searchText}"`
          : "Tekan tombol Love pada resep untuk menyimpannya di sini."}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        {isSearching ? (
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.textSec} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari koleksi..."
                value={searchText}
                onChangeText={handleSearch}
                autoFocus
                placeholderTextColor={COLORS.textSec}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={COLORS.textSec}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={toggleSearch} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Resep Favorit</Text>
              <Text style={styles.headerSub}>
                {allData.length} item tersimpan
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={toggleSearch}
              disabled={allData.length === 0}
            >
              <Ionicons name="search" size={22} color={COLORS.textMain} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* LIST CONTENT */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={displayedData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            displayedData.length === 0 && styles.flexGrow,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SavedRecipeCard
              item={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
              onDelete={() => handleRemove(item.id)}
            />
          )}
        />
      )}
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flexGrow: { flexGrow: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // HEADER
  header: {
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: "center",
    minHeight: 100,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.font.bold,
    fontWeight: "700",
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.textSec,
    marginTop: 2,
    fontFamily: theme.font.medium,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // SEARCH BAR
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textMain,
    fontFamily: theme.font.medium,
    height: "100%",
  },
  cancelBtn: {
    padding: 4,
  },
  cancelText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
    fontFamily: theme.font.semibold,
  },

  // LIST & CARD
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    // Modern Shadow
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImage: {
    width: 90,
    height: 90,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryBadge: {
    fontSize: 10,
    fontFamily: theme.font.bold,
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  savedText: {
    fontSize: 9,
    color: "#FFF",
    fontFamily: theme.font.bold,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textMain,
    lineHeight: 20,
    marginBottom: 2,
    fontFamily: theme.font.bold,
  },
  cardCreator: {
    fontSize: 12,
    color: COLORS.textSec,
    fontFamily: theme.font.medium,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSec,
    marginLeft: 4,
    fontFamily: theme.font.medium,
  },
  deleteButton: {
    width: 32,
    height: 32,
    backgroundColor: "#FEF2F2", // Merah muda
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textMain,
    fontFamily: theme.font.bold,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSec,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: theme.font.medium,
  },
});

export default SavedRecipesScreen;

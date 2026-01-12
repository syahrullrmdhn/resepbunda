import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { ChefHat, Clock, Edit, Filter, Plus, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CATEGORIES, getCategoryLabel } from "../../src/constants/categories";
import { querySql } from "../../src/services/db";
import { theme } from "../../src/theme";
import type { Recipe } from "../../src/types/recipe";

interface MyRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MyRecipeCard: React.FC<MyRecipeCardProps> = ({ recipe, onPress, onEdit, onDelete }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.98}
    >
      {/* Image Thumbnail */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title || 'Untitled'}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description || 'Tidak ada deskripsi'}
        </Text>

        {/* Author */}
        <Text style={styles.author}>
          Oleh {recipe.creator || 'Anonymous'}
        </Text>

        {/* Footer: Time & Category */}
        <View style={styles.footer}>
          <View style={styles.timeContainer}>
            <Clock size={14} color={theme.colors.neutral.medium} />
            <Text style={styles.timeText}>{recipe.cookingTime || '- mnt'}</Text>
          </View>

          <View style={styles.dot} />

          <Text style={styles.category}>{getCategoryLabel(recipe.category)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onEdit}
          activeOpacity={0.7}
        >
          <Edit size={16} color={theme.colors.primary.DEFAULT} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={theme.colors.danger.DEFAULT} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function MyRecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const fetchMyRecipes = async () => {
    try {
      setIsLoading(true);
      const session = await querySql<{ email: string }>(
        "SELECT email FROM session WHERE id = 1"
      );

      if (session.length > 0 && session[0].email) {
        const userEmail = session[0].email;
        const result = await querySql<Recipe>(
          "SELECT * FROM recipes WHERE creator_email = ? ORDER BY id DESC",
          [userEmail]
        );
        setRecipes(result);
      } else {
        setRecipes([]);
      }
    } catch (e) {
      console.error("Error fetching my recipes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecipes = useCallback(() => {
    let filtered = recipes;

    // Filter by tab (published/draft)
    if (activeTab === 'published') {
      filtered = filtered.filter(recipe => recipe.isPrivate === 0);
    } else {
      filtered = filtered.filter(recipe => recipe.isPrivate === 1);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    setFilteredRecipes(filtered);
  }, [recipes, activeTab, selectedCategory]);

  const handleEditRecipe = (recipe: Recipe) => {
    router.push(`/create-form?id=${recipe.id}`);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert(
      "Hapus Resep",
      `Apakah Anda yakin ingin menghapus "${recipe.title}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await querySql("DELETE FROM recipes WHERE id = ?", [recipe.id]);
              await fetchMyRecipes();
            } catch (e) {
              console.error("Error deleting recipe:", e);
              Alert.alert("Error", "Gagal menghapus resep");
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyRecipes();
    }, [])
  );

  useEffect(() => {
    filterRecipes();
  }, [recipes, activeTab, selectedCategory, filterRecipes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Recipes</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <Filter size={20} color={theme.colors.primary.DEFAULT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/create")}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'published' && styles.activeTab]}
          onPress={() => setActiveTab('published')}
        >
          <Text style={[styles.tabText, activeTab === 'published' && styles.activeTabText]}>
            Published ({recipes.filter(r => r.isPrivate === 0).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'draft' && styles.activeTab]}
          onPress={() => setActiveTab('draft')}
        >
          <Text style={[styles.tabText, activeTab === 'draft' && styles.activeTabText]}>
            Draft ({recipes.filter(r => r.isPrivate === 1).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <MyRecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
              onEdit={() => handleEditRecipe(item)}
              onDelete={() => handleDeleteRecipe(item)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <ChefHat size={40} color={theme.colors.primary.DEFAULT} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'published' ? 'No Published Recipes' : 'No Draft Recipes'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'published'
                  ? 'You haven\'t published any recipes yet. Create and publish your first recipe!'
                  : 'You don\'t have any draft recipes. Start creating!'
                }
              </Text>
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category.id && styles.selectedCategoryOption
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    selectedCategory === category.id && styles.selectedCategoryOptionText
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.light,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral.light,
  },
  createButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontFamily: theme.font.medium,
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.light,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: theme.colors.primary.bg,
  },
  tabText: {
    fontSize: 14,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.medium,
  },
  activeTabText: {
    color: theme.colors.primary.DEFAULT,
    fontFamily: theme.font.semibold,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: theme.spacing.md,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    minHeight: 96,
    paddingVertical: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
    lineHeight: 22,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: theme.colors.neutral.medium,
    lineHeight: 18,
    fontFamily: theme.font.regular,
    marginBottom: 4,
  },
  author: {
    fontSize: 11,
    fontFamily: theme.font.semibold,
    color: theme.colors.neutral.dark,
    marginBottom: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.medium,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.neutral.light,
    marginHorizontal: 10,
  },
  category: {
    fontSize: 12,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.medium,
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: theme.colors.neutral.light,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: theme.font.regular,
    color: theme.colors.neutral.medium,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.lg,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.neutral.light,
  },
  selectedCategoryOption: {
    backgroundColor: theme.colors.primary.bg,
  },
  categoryOptionText: {
    fontSize: 16,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.dark,
  },
  selectedCategoryOptionText: {
    color: theme.colors.primary.DEFAULT,
    fontFamily: theme.font.semibold,
  },
  closeModalButton: {
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: theme.font.medium,
  },
});
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { ChefHat, Plus } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RecipeCard from "../../src/components/RecipeCard";
import { querySql } from "../../src/services/db";
import { theme } from "../../src/theme";
import type { Recipe } from "../../src/types/recipe";

export default function MyRecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useFocusEffect(
    useCallback(() => {
      fetchMyRecipes();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Kitchen</Text>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => router.push("/create")}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RecipeCard recipe={item} onPress={() => router.push(`/recipe/${item.id}`)} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <ChefHat size={40} color={theme.colors.primary.DEFAULT} />
              </View>
              <Text style={styles.emptyTitle}>No Recipes Yet</Text>
              <Text style={styles.emptySubtitle}>
                You haven't cooked anything up yet. Start creating!
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg, // Menggunakan theme
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.light, // Menggunakan theme
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.font.bold, // Menggunakan theme
    color: theme.colors.neutral.dark, // Menggunakan theme
  },
  createButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary.DEFAULT, // Menggunakan theme
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    gap: 4,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontFamily: theme.font.medium, // Menggunakan theme
    fontSize: 14,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: theme.spacing.md,
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
    backgroundColor: theme.colors.primary.bg, // Menggunakan theme (Hijau muda)
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
});
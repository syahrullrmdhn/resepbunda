import { useRouter } from "expo-router";
import { BookOpen, ChevronDown, ChevronUp, Lock, User } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import RecipeCard from "../../src/components/RecipeCard";
import { useAuth } from "../../src/providers/AuthProvider";
import { AuthError, changePassword } from "../../src/services/auth";
import { getRecipesByCreator } from "../../src/services/recipe";
import { theme } from "../../src/theme";
import { Recipe } from "../../src/types/recipe";

export default function Profile() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  // Change Password State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // My Recipes State
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyRecipes = useCallback(async () => {
    if (!session?.email) return;
    try {
      const recipes = await getRecipesByCreator(session.email);
      setMyRecipes(recipes);
    } catch (error) {
      console.log("Error loading recipes:", error);
    } finally {
      setRecipesLoading(false);
      setRefreshing(false);
    }
  }, [session?.email]);

  useEffect(() => {
    loadMyRecipes();
  }, [loadMyRecipes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMyRecipes();
  }, [loadMyRecipes]);

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Semua field harus diisi");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru tidak cocok");
      return;
    }

    if (!session?.email) {
      setPasswordError("Session tidak ditemukan");
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(session.email, currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Sukses", "Password berhasil diubah!");
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.code === "INVALID_PASSWORD") {
          setPasswordError("Password saat ini salah");
        } else {
          setPasswordError("Terjadi kesalahan");
        }
      } else {
        setPasswordError("Terjadi kesalahan");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleLogout = () => {
    Alert.alert("Keluar", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: signOut },
    ]);
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <RecipeCard recipe={item} onPress={() => handleRecipePress(item)} />
  );

  const renderEmptyRecipes = () => (
    <View style={styles.emptyState}>
      <BookOpen size={48} color={theme.colors.neutral.medium} />
      <Text style={styles.emptyText}>Belum ada resep yang dibuat</Text>
      <Text style={styles.emptySubtext}>
        Resep yang Anda buat akan muncul di sini
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary.DEFAULT]}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={40} color={theme.colors.primary.DEFAULT} />
        </View>
        <Text style={styles.email}>{session?.email}</Text>
      </View>

      {/* Change Password Section */}
      <View style={styles.section}>
        <Pressable
          style={styles.sectionHeader}
          onPress={() => setShowPasswordForm(!showPasswordForm)}
        >
          <View style={styles.sectionTitleRow}>
            <Lock size={20} color={theme.colors.neutral.dark} />
            <Text style={styles.sectionTitle}>Ganti Password</Text>
          </View>
          {showPasswordForm ? (
            <ChevronUp size={20} color={theme.colors.neutral.medium} />
          ) : (
            <ChevronDown size={20} color={theme.colors.neutral.medium} />
          )}
        </Pressable>

        {showPasswordForm && (
          <View style={styles.passwordForm}>
            <TextInput
              style={styles.input}
              placeholder="Password Saat Ini"
              placeholderTextColor={theme.colors.neutral.medium}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Password Baru"
              placeholderTextColor={theme.colors.neutral.medium}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Konfirmasi Password Baru"
              placeholderTextColor={theme.colors.neutral.medium}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {passwordSuccess ? (
              <Text style={styles.successText}>Password berhasil diubah!</Text>
            ) : null}

            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={handleChangePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Simpan Password</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* My Recipes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <BookOpen size={20} color={theme.colors.neutral.dark} />
            <Text style={styles.sectionTitle}>Resep Saya</Text>
          </View>
          <Text style={styles.recipeCount}>{myRecipes.length} resep</Text>
        </View>

        {recipesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
          </View>
        ) : myRecipes.length === 0 ? (
          renderEmptyRecipes()
        ) : (
          <FlatList
            data={myRecipes}
            renderItem={renderRecipe}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* Logout Button */}
      <Pressable
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Keluar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.bg,
    borderWidth: 2,
    borderColor: theme.colors.primary.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  email: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.colors.neutral.dark,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
  },
  recipeCount: {
    fontSize: 14,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.medium,
  },
  passwordForm: {
    padding: theme.spacing.md,
    paddingTop: 0,
    gap: 12,
  },
  input: {
    backgroundColor: theme.colors.neutral.bg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: theme.font.regular,
    color: theme.colors.neutral.dark,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontFamily: theme.font.medium,
  },
  successText: {
    color: theme.colors.primary.DEFAULT,
    fontSize: 13,
    fontFamily: theme.font.medium,
  },
  button: {
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: theme.font.bold,
  },
  logoutButton: {
    backgroundColor: theme.colors.neutral.light,
    marginTop: theme.spacing.md,
  },
  logoutButtonText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontFamily: theme.font.bold,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.colors.neutral.dark,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: theme.font.regular,
    color: theme.colors.neutral.medium,
    marginTop: 4,
    textAlign: "center",
  },
});

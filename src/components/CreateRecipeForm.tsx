import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  AlignLeft,
  BarChart3,
  Check,
  ChevronLeft,
  Clock, // Ikon untuk Privacy
  Globe,
  Image as ImageIcon, // Ikon untuk Difficulty
  Lock,
  Plus,
  Trash2,
  Utensils,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SELECTABLE_CATEGORIES } from "../constants/categories";
import { execSql, querySql } from "../services/db";
import { theme } from "../theme";

// --- COLORS PALETTE ---
const COLORS = {
  surface: "#FFFFFF",
  background: "#F8FAFC",
  border: "#E2E8F0",
  inputBg: "#F1F5F9",
  textMain: "#0F172A",
  textSec: "#64748B",
  primary: theme.colors.primary.DEFAULT || "#4F46E5",
  danger: "#EF4444",
  success: "#10B981", // Warna untuk Published
  warning: "#F59E0B", // Warna untuk Draft
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function CreateRecipeForm() {
  // State Utama
  const [title, setTitle] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [category, setCategory] = useState("breakfast");
  const [difficulty, setDifficulty] = useState("Medium"); // Task 6.2
  const [isPrivate, setIsPrivate] = useState(false); // Task 6.6
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HANDLERS ---

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin Diperlukan", "Mohon izinkan akses galeri.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const handleAddIngredient = () => setIngredients([...ingredients, ""]);
  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = [...ingredients];
      newIngredients.splice(index, 1);
      setIngredients(newIngredients);
    }
  };
  const handleChangeIngredient = (text: string, index: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = text;
    setIngredients(newIngredients);
  };

  const handleAddStep = () => setSteps([...steps, ""]);
  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = [...steps];
      newSteps.splice(index, 1);
      setSteps(newSteps);
    }
  };
  const handleChangeStep = (text: string, index: number) => {
    const newSteps = [...steps];
    newSteps[index] = text;
    setSteps(newSteps);
  };

  // Task 6.7: Save Logic (Draft vs Published)
  const handleSave = async (status: "Draft" | "Published") => {
    if (!title.trim()) return Alert.alert("Ops", "Judul resep wajib diisi.");

    // Validasi lebih ketat jika Published
    if (status === "Published") {
      if (!ingredients.some((i) => i.trim()))
        return Alert.alert("Ops", "Isi minimal satu bahan untuk menerbitkan.");
      if (!steps.some((s) => s.trim()))
        return Alert.alert(
          "Ops",
          "Isi minimal satu langkah untuk menerbitkan.",
        );
    }

    setIsSubmitting(true);
    try {
      // 1. Migrasi kolom baru on-the-fly (jika belum ada, jaga-jaga)
      try {
        await execSql(
          `ALTER TABLE recipes ADD COLUMN difficulty TEXT DEFAULT 'Medium'`,
        );
        await execSql(
          `ALTER TABLE recipes ADD COLUMN status TEXT DEFAULT 'Draft'`,
        );
      } catch (e) {
        /* Column likely exists */
      }

      // 2. Fetch User
      const session = await querySql<{ email: string }>(
        "SELECT email FROM session WHERE id = 1",
      );
      const userEmail = session[0]?.email;
      let creatorName = "Anonymous Chef";
      let creatorEmail = "guest@example.com";

      if (userEmail) {
        creatorEmail = userEmail;
        const user = await querySql<{ fullName: string }>(
          "SELECT fullName FROM users WHERE email = ?",
          [userEmail],
        );
        if (user.length > 0) creatorName = user[0].fullName;
      }

      // 3. Format Data
      const formattedTime = cookingTime.trim()
        ? cookingTime.toLowerCase().includes("mnt")
          ? cookingTime
          : `${cookingTime} mnt`
        : "15 mnt";

      // 4. Insert Query (Updated with difficulty, status, isPrivate)
      await execSql(
        `INSERT INTO recipes (
          title, description, creator, creatorType, creator_email, 
          cookingTime, category, difficulty, status, isPrivate, 
          rating, calories, ingredients, steps, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          description.trim(),
          creatorName,
          "Home Cook",
          creatorEmail,
          formattedTime,
          category,
          difficulty, // NEW
          status, // NEW
          isPrivate ? 1 : 0, // NEW (Logic Fix)
          0,
          "0 kkal",
          JSON.stringify(ingredients.filter((i) => i.trim())),
          JSON.stringify(steps.filter((s) => s.trim())),
          imageUri || null,
        ],
      );

      const successMsg =
        status === "Published"
          ? "Resep berhasil diterbitkan!"
          : "Draft berhasil disimpan!";
      Alert.alert("Sukses", successMsg, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal menyimpan resep.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI COMPONENTS ---

  const SectionLabel = ({ title, icon: Icon }: any) => (
    <View style={styles.sectionLabelContainer}>
      {Icon && (
        <Icon size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
      )}
      <Text style={styles.sectionLabel}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tulis Resep Baru</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* IMAGE UPLOAD HERO */}
          <TouchableOpacity
            style={styles.imageUploader}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.uploadedImage}
                />
                <View style={styles.editImageBadge}>
                  <ImageIcon size={14} color="#FFF" />
                  <Text style={styles.editImageText}>Ubah</Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.iconCircle}>
                  <ImageIcon size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadTitle}>Foto Masakan</Text>
                <Text style={styles.uploadSubtitle}>
                  Ketuk untuk upload (Maks 5MB)
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formCard}>
            {/* JUDUL */}
            <View style={styles.inputGroup}>
              <SectionLabel title="Judul Resep" />
              <TextInput
                style={styles.inputLg}
                placeholder="Contoh: Nasi Goreng Kampung"
                placeholderTextColor={COLORS.textSec}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* DURASI & KATEGORI */}
            <View style={styles.rowGroup}>
              <View style={{ flex: 1 }}>
                <SectionLabel title="Durasi" icon={Clock} />
                <View style={styles.inputIconWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.textSec}
                    value={cookingTime}
                    onChangeText={setCookingTime}
                  />
                  <Text style={styles.suffix}>Menit</Text>
                </View>
              </View>
            </View>

            {/* DIFFICULTY (Task 6.2) */}
            <View style={styles.inputGroup}>
              <SectionLabel title="Tingkat Kesulitan" icon={BarChart3} />
              <View style={styles.difficultyContainer}>
                {DIFFICULTIES.map((level) => {
                  const isActive = difficulty === level;
                  return (
                    <Pressable
                      key={level}
                      onPress={() => setDifficulty(level)}
                      style={[
                        styles.diffChip,
                        isActive && styles.diffChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.diffText,
                          isActive && styles.diffTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* KATEGORI SCROLL */}
            <View style={styles.inputGroup}>
              <SectionLabel title="Kategori" icon={AlignLeft} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {SELECTABLE_CATEGORIES.map((cat) => {
                  const isActive = category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={[styles.chip, isActive && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.chipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* PRIVACY TOGGLE (Task 6.6) */}
            <View style={styles.privacyRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {isPrivate ? (
                  <Lock size={20} color={COLORS.textMain} />
                ) : (
                  <Globe size={20} color={COLORS.success} />
                )}
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.privacyTitle}>
                    {isPrivate ? "Privat (Hanya Saya)" : "Publik (Semua Orang)"}
                  </Text>
                  <Text style={styles.privacySubtitle}>
                    {isPrivate
                      ? "Tidak muncul di feed umum"
                      : "Dapat dilihat oleh pengguna lain"}
                  </Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={"#FFF"}
                onValueChange={setIsPrivate}
                value={isPrivate}
              />
            </View>

            {/* DESKRIPSI */}
            <View style={styles.inputGroup}>
              <SectionLabel title="Deskripsi Singkat" />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ceritakan keunikan resep ini atau tips rahasia..."
                placeholderTextColor={COLORS.textSec}
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* BAHAN-BAHAN */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Utensils
                  size={18}
                  color={COLORS.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>Bahan-bahan</Text>
              </View>
              <Text style={styles.countBadge}>{ingredients.length} Item</Text>
            </View>
            <View style={styles.listContainer}>
              {ingredients.map((ing, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <TextInput
                    style={styles.listInput}
                    placeholder={`Bahan ke-${idx + 1}`}
                    placeholderTextColor={COLORS.textSec}
                    value={ing}
                    onChangeText={(text) => handleChangeIngredient(text, idx)}
                  />
                  {ingredients.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(idx)}
                      style={styles.iconBtn}
                    >
                      <Trash2 size={18} color={COLORS.textSec} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddIngredient}
              >
                <Plus size={18} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Tambah Bahan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LANGKAH PEMBUATAN */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AlignLeft
                  size={18}
                  color={COLORS.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.cardTitle}>Langkah Pembuatan</Text>
              </View>
            </View>
            <View style={styles.listContainer}>
              {steps.map((step, idx) => (
                <View key={idx} style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.stepInput}
                      placeholder={`Jelaskan langkah ${idx + 1}...`}
                      placeholderTextColor={COLORS.textSec}
                      multiline
                      value={step}
                      onChangeText={(text) => handleChangeStep(text, idx)}
                    />
                  </View>
                  {steps.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveStep(idx)}
                      style={styles.iconBtn}
                    >
                      <Trash2 size={18} color={COLORS.textSec} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddStep}
              >
                <Plus size={18} color={COLORS.primary} />
                <Text style={styles.addButtonText}>Tambah Langkah</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ACTION BUTTONS (Task 6.7) */}
          <View style={styles.footer}>
            {/* Simpan Draft */}
            <TouchableOpacity
              style={[styles.actionButton, styles.draftButton]}
              onPress={() => handleSave("Draft")}
              disabled={isSubmitting}
            >
              <Text style={styles.draftText}>Simpan Draft</Text>
            </TouchableOpacity>

            {/* Terbitkan */}
            <TouchableOpacity
              style={[styles.actionButton, styles.publishButton]}
              onPress={() => handleSave("Published")}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.publishText}>Terbitkan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: theme.font.bold,
    color: COLORS.textMain,
  },
  scrollContent: { padding: 20, paddingBottom: 100 },

  imageUploader: {
    height: 220,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  imagePlaceholder: { alignItems: "center" },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontFamily: theme.font.bold,
    color: COLORS.textMain,
    marginBottom: 4,
  },
  uploadSubtitle: { fontSize: 13, color: COLORS.textSec },
  uploadedImage: { width: "100%", height: "100%", resizeMode: "cover" },
  editImageBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editImageText: { color: "#FFF", fontSize: 12, fontFamily: theme.font.medium },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: theme.font.semibold,
    color: COLORS.textMain,
  },
  inputGroup: { marginBottom: 20 },
  rowGroup: { flexDirection: "row", marginBottom: 20 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: theme.font.medium,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputLg: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: theme.font.bold,
    color: COLORS.textMain,
  },
  inputIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  suffix: {
    fontSize: 13,
    color: COLORS.textSec,
    fontFamily: theme.font.medium,
    marginLeft: 8,
  },
  textArea: { minHeight: 100, paddingTop: 12, lineHeight: 22 },

  // Difficulty Chips
  difficultyContainer: { flexDirection: "row", gap: 8 },
  diffChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  diffChipActive: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.primary,
  },
  diffText: {
    fontSize: 13,
    fontFamily: theme.font.medium,
    color: COLORS.textSec,
  },
  diffTextActive: { color: COLORS.primary, fontFamily: theme.font.bold },

  // Privacy
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 14,
    fontFamily: theme.font.bold,
    color: COLORS.textMain,
  },
  privacySubtitle: { fontSize: 12, color: COLORS.textSec, marginTop: 2 },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.textMain,
    borderColor: COLORS.textMain,
  },
  chipText: {
    fontSize: 13,
    fontFamily: theme.font.medium,
    color: COLORS.textSec,
  },
  chipTextActive: { color: "#FFF", fontFamily: theme.font.bold },

  sectionCard: {
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: theme.font.bold,
    color: COLORS.textMain,
  },
  countBadge: {
    fontSize: 12,
    color: COLORS.textSec,
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listContainer: { padding: 16 },
  listItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  listInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.font.medium,
    color: COLORS.textMain,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textMain,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 4,
  },
  stepNumberText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  stepInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: theme.font.regular,
    color: COLORS.textMain,
    lineHeight: 20,
  },
  iconBtn: { padding: 8, marginLeft: 4 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: theme.font.medium,
    color: COLORS.primary,
  },

  // Footer Buttons
  footer: { flexDirection: "row", gap: 12, marginBottom: 20, paddingTop: 10 },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  draftButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  draftText: {
    color: COLORS.textSec,
    fontFamily: theme.font.bold,
    fontSize: 16,
  },
  publishButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  publishText: { color: "#FFF", fontSize: 16, fontFamily: theme.font.bold },
});

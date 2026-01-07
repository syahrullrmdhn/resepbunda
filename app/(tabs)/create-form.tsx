import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Check,
  ChevronLeft,
  Clock,
  Image as ImageIcon,
  Trash2
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SELECTABLE_CATEGORIES } from "../../src/constants/categories";
import { execSql, querySql } from "../../src/services/db";
import { theme } from "../../src/theme";

export default function CreateRecipeForm() {
  const [title, setTitle] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [category, setCategory] = useState("breakfast");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HANDLERS ---

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin Diperlukan", "Mohon izinkan akses galeri untuk mengupload foto resep.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddIngredient = () => setIngredients([...ingredients, ""]);
  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };
  const handleChangeIngredient = (text: string, index: number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = text;
    setIngredients(newIngredients);
  };

  const handleAddStep = () => setSteps([...steps, ""]);
  const handleRemoveStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };
  const handleChangeStep = (text: string, index: number) => {
    const newSteps = [...steps];
    newSteps[index] = text;
    setSteps(newSteps);
  };

  const handleSave = async () => {
    // 1. Validasi Dasar
    if (!title.trim()) {
      Alert.alert("Data Kurang", "Mohon isi judul resep.");
      return;
    }
    if (ingredients.filter((i) => i.trim()).length === 0) {
      Alert.alert("Data Kurang", "Mohon isi minimal satu bahan.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Ambil User Session (Creator)
      const session = await querySql<{ email: string }>(
        "SELECT email FROM session WHERE id = 1"
      );
      const userEmail = session[0]?.email;

      // Default fallback jika session kosong (misal belum login)
      let creatorName = "Anonymous Chef";
      let creatorEmail = "guest@example.com";

      if (userEmail) {
        creatorEmail = userEmail;
        const user = await querySql<{ fullName: string }>(
          "SELECT fullName FROM users WHERE email = ?",
          [userEmail]
        );
        if (user.length > 0 && user[0].fullName) {
          creatorName = user[0].fullName;
        }
      }

      // 3. Bersihkan Data Array
      const validIngredients = ingredients.filter((i) => i.trim());
      const validSteps = steps.filter((s) => s.trim());
      
      // Format Waktu (Pastikan string "XX mnt")
      const formattedTime = cookingTime.trim() 
        ? (cookingTime.toLowerCase().includes("mnt") ? cookingTime : `${cookingTime} mnt`)
        : "15 mnt";

      // 4. Query Insert
      await execSql(
        `INSERT INTO recipes (
          title, description, creator, creatorType, creator_email,
          cookingTime, category, isPrivate, rating, calories,
          ingredients, steps, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title.trim(),
          description.trim(),
          creatorName,
          "Home Cook",
          creatorEmail,
          formattedTime,
          category,
          0, // 0 = Public, 1 = Private
          0, // Rating awal 0
          "0 kkal", // Default calories
          JSON.stringify(validIngredients),
          JSON.stringify(validSteps),
          imageUri || null,
        ]
      );

      Alert.alert("Berhasil!", "Resep Anda telah diterbitkan.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", "Gagal menyimpan resep. Coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER UI ---

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ChevronLeft size={24} color={theme.colors.neutral.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tulis Resep</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSubmitting}
          style={[styles.iconButton, { backgroundColor: theme.colors.primary.bg }]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
          ) : (
            <Check size={20} color={theme.colors.primary.DEFAULT} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* IMAGE PICKER */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <View style={styles.imageOverlay}>
                <ImageIcon size={20} color="#FFF" />
                <Text style={styles.imageOverlayText}>Ganti Foto</Text>
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.imageIconCircle}>
                <ImageIcon size={32} color={theme.colors.neutral.medium} />
              </View>
              <Text style={styles.imagePlaceholderText}>Tambah Foto Masakan</Text>
              <Text style={styles.imageHint}>Maksimal 5MB (JPG/PNG)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* BASIC INFO */}
        <View style={styles.section}>
          <Text style={styles.label}>Judul Resep</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Nasi Goreng Spesial"
            placeholderTextColor={theme.colors.neutral.medium}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 12 }]}>
            <Text style={styles.label}>Durasi (Menit)</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={18} color={theme.colors.neutral.medium} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, color: theme.colors.neutral.dark, fontFamily: theme.font.medium }}
                placeholder="45"
                placeholderTextColor={theme.colors.neutral.medium}
                keyboardType="numeric"
                value={cookingTime}
                onChangeText={setCookingTime}
              />
            </View>
          </View>
        </View>

        {/* CATEGORY */}
        <View style={styles.section}>
          <Text style={styles.label}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {SELECTABLE_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.catChip,
                    isSelected ? styles.catChipActive : styles.catChipInactive,
                  ]}
                >
                  <Text style={[
                    styles.catText, 
                    isSelected ? styles.catTextActive : styles.catTextInactive
                  ]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.label}>Deskripsi</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ceritakan sedikit tentang resep ini..."
            placeholderTextColor={theme.colors.neutral.medium}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* INGREDIENTS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bahan-bahan</Text>
            <TouchableOpacity onPress={handleAddIngredient}>
              <Text style={styles.actionText}>+ Tambah</Text>
            </TouchableOpacity>
          </View>
          
          {ingredients.map((ing, idx) => (
            <View key={idx} style={styles.dynamicRow}>
              <TextInput
                style={styles.dynamicInput}
                placeholder={`Bahan ${idx + 1}`}
                placeholderTextColor={theme.colors.neutral.medium}
                value={ing}
                onChangeText={(text) => handleChangeIngredient(text, idx)}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveIngredient(idx)} style={styles.deleteBtn}>
                  <Trash2 size={18} color={theme.colors.danger.DEFAULT} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* STEPS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Langkah Pembuatan</Text>
            <TouchableOpacity onPress={handleAddStep}>
              <Text style={styles.actionText}>+ Tambah</Text>
            </TouchableOpacity>
          </View>
          
          {steps.map((step, idx) => (
            <View key={idx} style={styles.dynamicRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <TextInput
                style={[styles.dynamicInput, styles.textAreaSmall]}
                placeholder={`Langkah ${idx + 1}`}
                placeholderTextColor={theme.colors.neutral.medium}
                multiline
                value={step}
                onChangeText={(text) => handleChangeStep(text, idx)}
              />
              {steps.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveStep(idx)} style={styles.deleteBtn}>
                  <Trash2 size={18} color={theme.colors.danger.DEFAULT} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* SUBMIT BUTTON (BOTTOM) */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Terbitkan Resep</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.light,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.neutral.bg,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  
  // Image Picker
  imagePicker: {
    height: 200,
    backgroundColor: "#FFF",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  imageOverlayText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: theme.font.medium,
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imageIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.neutral.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.dark,
  },
  imageHint: {
    fontSize: 12,
    color: theme.colors.neutral.medium,
    marginTop: 4,
  },

  // Form Fields
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
  },
  label: {
    fontSize: 14,
    fontFamily: theme.font.semibold,
    color: theme.colors.neutral.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.dark,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 80,
  },
  textAreaSmall: {
    minHeight: 60,
    paddingTop: 12,
  },

  // Category Chips
  catScroll: {
    paddingRight: 20,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  catChipInactive: {
    backgroundColor: "#FFF",
    borderColor: theme.colors.neutral.light,
  },
  catChipActive: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.DEFAULT,
  },
  catText: {
    fontSize: 13,
    fontFamily: theme.font.medium,
  },
  catTextInactive: {
    color: theme.colors.neutral.medium,
  },
  catTextActive: {
    color: "#FFF",
    fontFamily: theme.font.bold,
  },

  // Dynamic Lists
  sectionContainer: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: "#FFF",
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
  },
  actionText: {
    fontSize: 14,
    fontFamily: theme.font.semibold,
    color: theme.colors.primary.DEFAULT,
  },
  dynamicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dynamicInput: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: theme.font.regular,
    color: theme.colors.neutral.dark,
    borderWidth: 1,
    borderColor: "transparent",
  },
  deleteBtn: {
    marginLeft: 8,
    padding: 10,
    justifyContent: "center",
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.bg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 10,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: theme.font.bold,
    color: theme.colors.primary.DEFAULT,
  },

  // Submit Button
  submitBtn: {
    backgroundColor: theme.colors.primary.DEFAULT,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    shadowColor: theme.colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  submitBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: theme.font.bold,
  },
});
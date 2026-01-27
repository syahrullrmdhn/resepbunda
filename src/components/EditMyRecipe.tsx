import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
    AlignLeft,
    ArrowLeft,
    Camera,
    Check,
    Clock,
    Plus,
    Trash2,
    Utensils,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- DEPENDENCIES ---
import { SELECTABLE_CATEGORIES } from "../constants/categories"; // Pastikan file ini ada
import { execSql, querySql } from "../services/db";
import { theme } from "../theme";
import { Recipe } from "../types/recipe";

// --- COLORS ---
const COLORS = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSec: "#64748B",
  primary: theme.colors.primary.DEFAULT || "#4F46E5",
  danger: "#EF4444",
  inputBg: "#F1F5F9",
};

export default function EditMyRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // STATE
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // FORM FIELDS
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("lunch");
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);

  // 1. FETCH DATA
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const rows = await querySql<Recipe>(
          "SELECT * FROM recipes WHERE id = ? LIMIT 1",
          [id],
        );
        const data = rows[0];
        if (data) {
          setTitle(data.title);
          setDesc(data.description || "");
          setTime(data.cookingTime?.replace(" mnt", "") || "15");
          setCategory(data.category || "lunch");
          setIsPrivate(data.isPrivate === 1);
          setImageUri(data.image || null);

          // Parse JSON Arrays
          try {
            const ing = JSON.parse(data.ingredients || "[]");
            setIngredients(ing.length ? ing : [""]);
          } catch {
            setIngredients([""]);
          }

          try {
            const stp = JSON.parse(data.steps || "[]");
            setSteps(stp.length ? stp : [""]);
          } catch {
            setSteps([""]);
          }
        }
      } catch (e) {
        console.error("Failed load recipe:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 2. HANDLERS
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Izin", "Butuh akses galeri.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleArrayChange = (
    text: string,
    index: number,
    type: "ing" | "step",
  ) => {
    const arr = type === "ing" ? [...ingredients] : [...steps];
    arr[index] = text;
    type === "ing" ? setIngredients(arr) : setSteps(arr);
  };

  const addItem = (type: "ing" | "step") => {
    type === "ing"
      ? setIngredients([...ingredients, ""])
      : setSteps([...steps, ""]);
  };

  const removeItem = (index: number, type: "ing" | "step") => {
    const arr = type === "ing" ? [...ingredients] : [...steps];
    if (arr.length > 1) {
      arr.splice(index, 1);
      type === "ing" ? setIngredients(arr) : setSteps(arr);
    }
  };

  const handleSave = async () => {
    if (!title.trim())
      return Alert.alert("Validasi", "Judul resep wajib diisi.");

    setSaving(true);
    try {
      const validIng = ingredients.filter((i) => i.trim());
      const validSteps = steps.filter((s) => s.trim());
      const finalTime = time.includes("mnt") ? time : `${time} mnt`;

      await execSql(
        `UPDATE recipes SET 
          title=?, description=?, cookingTime=?, category=?, 
          isPrivate=?, ingredients=?, steps=?, image=?
         WHERE id=?`,
        [
          title,
          desc,
          finalTime,
          category,
          isPrivate ? 1 : 0,
          JSON.stringify(validIng),
          JSON.stringify(validSteps),
          imageUri,
          id,
        ],
      );
      Alert.alert("Sukses", "Perubahan berhasil disimpan.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <ArrowLeft size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Resep</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtnHeader}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Check size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* IMAGE UPLOADER */}
          <TouchableOpacity style={styles.imageUploader} onPress={pickImage}>
            {imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.uploadedImage}
                />
                <View style={styles.editBadge}>
                  <Camera size={14} color="#FFF" />
                  <Text style={styles.editBadgeText}>Ubah</Text>
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <Camera size={32} color={COLORS.textSec} />
                <Text style={styles.placeholderText}>Upload Foto Masakan</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* BASIC INFO */}
          <View style={styles.section}>
            <Text style={styles.label}>Judul Resep</Text>
            <TextInput
              style={styles.inputLg}
              value={title}
              onChangeText={setTitle}
              placeholder="Contoh: Nasi Goreng Spesial"
              placeholderTextColor={COLORS.textSec}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>Waktu (Menit)</Text>
              <View style={styles.inputIconWrapper}>
                <Clock size={18} color={COLORS.textSec} />
                <TextInput
                  style={styles.inputFlex}
                  value={time}
                  onChangeText={setTime}
                  keyboardType="numeric"
                  placeholder="30"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Status Resep</Text>
              <View style={styles.switchWrapper}>
                <Text style={styles.switchText}>
                  {isPrivate ? "Draft (Privat)" : "Publik"}
                </Text>
                <Switch
                  value={!isPrivate}
                  onValueChange={(v) => setIsPrivate(!v)}
                  trackColor={{ false: "#CBD5E1", true: COLORS.primary }}
                />
              </View>
            </View>
          </View>

          {/* CATEGORY */}
          <View style={styles.section}>
            <Text style={styles.label}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SELECTABLE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    category === cat.id && styles.catChipActive,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.catText,
                      category === cat.id && styles.catTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.section}>
            <Text style={styles.label}>Deskripsi Singkat</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={desc}
              onChangeText={setDesc}
              multiline
              placeholder="Ceritakan tentang resep ini..."
              textAlignVertical="top"
            />
          </View>

          {/* INGREDIENTS */}
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Utensils size={18} color={COLORS.primary} />
                <Text style={styles.listTitle}>Bahan-bahan</Text>
              </View>
            </View>
            {ingredients.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.bullet} />
                <TextInput
                  style={styles.listInput}
                  value={item}
                  onChangeText={(t) => handleArrayChange(t, idx, "ing")}
                  placeholder={`Bahan ${idx + 1}`}
                />
                <TouchableOpacity onPress={() => removeItem(idx, "ing")}>
                  <Trash2 size={18} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addItem("ing")}
            >
              <Plus size={16} color={COLORS.primary} />
              <Text style={styles.addBtnText}>Tambah Bahan</Text>
            </TouchableOpacity>
          </View>

          {/* STEPS */}
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AlignLeft size={18} color={COLORS.primary} />
                <Text style={styles.listTitle}>Langkah Pembuatan</Text>
              </View>
            </View>
            {steps.map((item, idx) => (
              <View key={idx} style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{idx + 1}</Text>
                </View>
                <TextInput
                  style={styles.stepInput}
                  value={item}
                  onChangeText={(t) => handleArrayChange(t, idx, "step")}
                  placeholder={`Jelaskan langkah ${idx + 1}...`}
                  multiline
                />
                <TouchableOpacity
                  onPress={() => removeItem(idx, "step")}
                  style={{ marginTop: 4 }}
                >
                  <Trash2 size={18} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => addItem("step")}
            >
              <Plus size={16} color={COLORS.primary} />
              <Text style={styles.addBtnText}>Tambah Langkah</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER SAVE BUTTON */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <TouchableOpacity
          style={styles.fullSaveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.fullSaveText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.textMain },
  saveBtnHeader: { padding: 4 },

  scrollContent: { padding: 20, paddingBottom: 100 },

  // IMAGE
  imageUploader: {
    height: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  placeholder: { alignItems: "center", gap: 8 },
  placeholderText: { color: COLORS.textSec, fontSize: 14 },
  uploadedImage: { width: "100%", height: "100%", resizeMode: "cover" },
  editBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editBadgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },

  // FORM
  section: { marginBottom: 20 },
  row: { flexDirection: "row", marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMain,
    marginBottom: 8,
  },

  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputLg: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textMain,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputFlex: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.textMain },
  textArea: { minHeight: 100 },

  // SWITCH
  switchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 12,
    height: 48,
  },
  switchText: { fontSize: 13, color: COLORS.textSec, fontWeight: "500" },

  // CHIPS
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catText: { fontSize: 13, color: COLORS.textSec },
  catTextActive: { color: "#FFF", fontWeight: "bold" },

  // LISTS
  listSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textMain,
    marginLeft: 8,
  },

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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
    marginRight: 8,
    fontSize: 14,
    color: COLORS.textMain,
  },

  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textMain,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  stepNum: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  stepInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.textMain,
    marginRight: 8,
    lineHeight: 20,
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addBtnText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },

  // FOOTER
  footer: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  fullSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  fullSaveText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});

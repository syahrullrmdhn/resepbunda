import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SELECTABLE_CATEGORIES } from "../constants/categories";
import { execSql, querySql } from "../services/db";
import { theme } from "../theme";

export default function CreateRecipeForm() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("breakfast");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Izin akses galeri diperlukan untuk memilih foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addIngredient = () => setIngredients((prev) => [...prev, ""]);
  const addStep = () => setSteps((prev) => [...prev, ""]);

  const updateIngredient = (i: number, v: string) =>
    setIngredients((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  const updateStep = (i: number, v: string) =>
    setSteps((prev) => prev.map((x, idx) => (idx === i ? v : x)));

  async function onSave() {
    if (!title.trim()) {
      Alert.alert("Error", "Judul resep harus diisi");
      return;
    }

    try {
      // Ensure image column exists (migration fallback)
      try {
        await execSql(`ALTER TABLE recipes ADD COLUMN image TEXT`);
      } catch {
        // Column already exists, ignore
      }

      // Get current user email from session
      const session = await querySql<{ email: string }>(
        "SELECT email FROM session WHERE id = 1 AND is_logged_in = 1"
      );
      const userEmail = session[0]?.email || "";

      // Get user info for creator name
      const user = await querySql<{ fullName: string }>(
        "SELECT fullName FROM users WHERE email = ?",
        [userEmail]
      );
      const creatorName = user[0]?.fullName || "Anonymous";

      // Filter empty ingredients and steps
      const validIngredients = ingredients.filter((i) => i.trim());
      const validSteps = steps.filter((s) => s.trim());

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
          userEmail,
          duration ? `${duration} mnt` : "- mnt",
          category,
          0, // public
          0, // rating
          "", // calories
          JSON.stringify(validIngredients),
          JSON.stringify(validSteps),
          imageUri || null,
        ]
      );

      Alert.alert("Berhasil", "Resep berhasil disimpan!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Gagal menyimpan resep. Silakan coba lagi.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.neutral.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 16,
          paddingBottom: 14,
          paddingHorizontal: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.neutral.light,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.neutral.dark} />
        </Pressable>

        <Text style={{ fontFamily: theme.font.bold, fontSize: 16, color: theme.colors.neutral.dark }}>
          Tulis Resep
        </Text>

        <Pressable
          onPress={onSave}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="checkmark" size={22} color={theme.colors.primary.DEFAULT} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: 120,
          gap: 14,
        }}
      >
        {/* Foto */}
        <Pressable
          onPress={pickImage}
          style={{
            height: 160,
            borderRadius: theme.radius.lg,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: theme.colors.neutral.light,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            overflow: "hidden",
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%", resizeMode: "cover" }}
            />
          ) : (
            <>
              <Ionicons name="image-outline" size={28} color={theme.colors.neutral.medium} />
              <Text style={{ fontFamily: theme.font.medium, color: theme.colors.neutral.medium }}>
                Tambahkan Foto
              </Text>
              <Text style={{ fontFamily: theme.font.regular, fontSize: 12, color: theme.colors.neutral.medium }}>
                JPG, PNG maks. 5MB
              </Text>
            </>
          )}
        </Pressable>

        <Field label="Judul Resep">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Sop Ayam Jahe"
            placeholderTextColor={theme.colors.neutral.medium}
            style={inputStyle}
          />
        </Field>

        <Field label="Estimasi Durasi (menit)">
          <TextInput
            value={duration}
            onChangeText={setDuration}
            placeholder="Contoh: 45"
            keyboardType="number-pad"
            placeholderTextColor={theme.colors.neutral.medium}
            style={inputStyle}
          />
        </Field>

        {/* Category Selection */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: theme.font.medium, color: theme.colors.neutral.dark, fontSize: 13 }}>
            Kategori
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {SELECTABLE_CATEGORIES.map((cat) => {
              const isActive = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 100,
                    backgroundColor: isActive ? theme.colors.primary.DEFAULT : "#fff",
                    borderWidth: 1,
                    borderColor: isActive ? theme.colors.primary.DEFAULT : theme.colors.neutral.light,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: isActive ? theme.font.bold : theme.font.medium,
                      fontSize: 13,
                      color: isActive ? "#fff" : theme.colors.neutral.medium,
                    }}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Description */}
        <Field label="Deskripsi Singkat">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Jelaskan resep ini dalam 1-2 kalimat..."
            placeholderTextColor={theme.colors.neutral.medium}
            multiline
            numberOfLines={3}
            style={[inputStyle, { minHeight: 60, textAlignVertical: "top" as any }]}
          />
        </Field>

        <Section title="Bahan-bahan" actionText="+ Tambah Bahan" onAction={addIngredient}>
          {ingredients.map((val, idx) => (
            <TextInput
              key={idx}
              value={val}
              onChangeText={(v) => updateIngredient(idx, v)}
              placeholder={`Bahan ${idx + 1}`}
              placeholderTextColor={theme.colors.neutral.medium}
              style={[inputStyle, { marginTop: idx === 0 ? 0 : 10 }]}
            />
          ))}
        </Section>

        <Section title="Langkah Pembuatan" actionText="+ Tambah Langkah" onAction={addStep}>
          {steps.map((val, idx) => (
            <TextInput
              key={idx}
              value={val}
              onChangeText={(v) => updateStep(idx, v)}
              placeholder={`Langkah ${idx + 1}`}
              placeholderTextColor={theme.colors.neutral.medium}
              multiline
              style={[
                inputStyle,
                { marginTop: idx === 0 ? 0 : 10, minHeight: 54, textAlignVertical: "top" as any },
              ]}
            />
          ))}
        </Section>

        <Pressable
          onPress={onSave}
          style={{
            backgroundColor: theme.colors.primary.DEFAULT,
            paddingVertical: 14,
            borderRadius: theme.radius.pill,
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <Text style={{ color: "#fff", fontFamily: theme.font.semibold, fontSize: 14 }}>
            Simpan Resep
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontFamily: theme.font.medium, color: theme.colors.neutral.dark, fontSize: 13 }}>
        {label}
      </Text>
      <View
        style={{
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: theme.colors.neutral.light,
          borderRadius: theme.radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Section({
  title,
  actionText,
  onAction,
  children,
}: {
  title: string;
  actionText: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: theme.colors.neutral.light,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontFamily: theme.font.bold, color: theme.colors.neutral.dark, fontSize: 14 }}>
          {title}
        </Text>
        <Pressable onPress={onAction}>
          <Text style={{ fontFamily: theme.font.semibold, color: theme.colors.primary.DEFAULT, fontSize: 12 }}>
            {actionText}
          </Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const inputStyle = {
  fontFamily: theme.font.regular,
  fontSize: 14,
  color: theme.colors.neutral.dark,
};

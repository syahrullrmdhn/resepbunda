import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- IMPORT PUSAT ---
import { theme } from "../../src/theme";
import { useAuth } from "../providers/AuthProvider";
import { db } from "../services/db/client";

const { width } = Dimensions.get('window');

interface RecipeDetailProps {
  recipeId: string;
  onBack: () => void;
}

export default function RecipeDetailScreen({ recipeId, onBack }: RecipeDetailProps) {
  const auth = useAuth() as any; 
  const userEmail = auth.user?.email || auth.session?.user?.email;
  const [isSaved, setIsSaved] = useState(false);

  // Data Dummy untuk fallback UI
  const recipe = {
    title: "Salmon Panggang Lemon",
    category: "Dinner",
    time: 30,
    authorName: "Chef Amanda",
    description: "Menu sehat kaya omega-3 dengan rasa segar lemon yang menggugah selera keluarga. Cocok untuk hidangan premium Bunda.",
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=2670&auto=format&fit=crop',
    ingredients: [
      { item: 'Fillet Salmon', qty: '200 gram' },
      { item: 'Jeruk Lemon', qty: '1 buah' },
      { item: 'Bawang Putih', qty: '2 siung' },
    ],
    steps: [
      'Marinasi salmon dengan lemon dan lada.',
      'Panaskan wajan anti lengket dengan api sedang.',
      'Panggang salmon 5-7 menit hingga matang sempurna.',
    ],
  };

  // --- LOGIC TASK 3.4: CEK STATUS FAVORIT ---
  const checkIfSaved = async () => {
    if (!userEmail || !recipeId) return;
    try {
      const rows = await db.query(
        'SELECT id FROM saved_recipes WHERE recipe_id = ? AND user_email = ?',
        [recipeId, userEmail]
      );
      setIsSaved(rows.length > 0);
    } catch (error) {
      console.error("Gagal cek status favorit", error);
    }
  };

  useEffect(() => {
    checkIfSaved();
  }, [recipeId, userEmail]);

  // --- LOGIC TASK 3.4: SIMPAN/HAPUS ---
  const toggleSave = async () => {
    if (!userEmail) {
      Alert.alert("Perhatian", "Silakan login terlebih dahulu untuk menyimpan resep.");
      return;
    }

    try {
      if (isSaved) {
        await db.execute(
          'DELETE FROM saved_recipes WHERE recipe_id = ? AND user_email = ?',
          [recipeId, userEmail]
        );
        setIsSaved(false);
        Alert.alert("Dihapus", "Resep dihapus dari favorit Bunda.");
      } else {
        await db.execute(
          'INSERT INTO saved_recipes (recipe_id, user_email) VALUES (?, ?)',
          [recipeId, userEmail]
        );
        setIsSaved(true);
        Alert.alert("Berhasil", "Resep disimpan ke favorit!");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal memperbarui database.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TASK 3.1: HEADER */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.headerImage} />
          <View style={[styles.imageOverlay, { backgroundColor: theme.colors.overlay }]} />
          
          <SafeAreaView style={styles.headerNav}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.neutral.dark} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* CONTENT AREA */}
        <View style={styles.mainCard}>
          <View style={styles.titleWrapper}>
            <View style={styles.badgeRow}>
               <View style={styles.badge}>
                  <Text style={styles.badgeText}>{recipe.category}</Text>
               </View>
            </View>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.authorText}>Oleh {recipe.authorName}</Text>
          </View>

          <Text style={styles.descriptionText}>{recipe.description}</Text>

          {/* TASK 3.2: INGREDIENTS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bahan-bahan</Text>
            <View style={styles.ingredientsBox}>
              {recipe.ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingredientRow}>
                   <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary.DEFAULT} style={{marginRight: 10}} />
                   <Text style={styles.ingredientText}>
                      <Text style={{ fontFamily: theme.font.bold }}>{ing.qty}</Text> {ing.item}
                   </Text>
                </View>
              ))}
            </View>
          </View>

          {/* TASK 3.3: STEPS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cara Membuat</Text>
            {recipe.steps.map((step, idx) => (
              <View key={idx} style={styles.stepContainer}>
                <View style={[styles.stepNumberCircle, { backgroundColor: theme.colors.neutral.dark }]}>
                  <Text style={styles.stepNum}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepDescription}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startCookingBtn} onPress={() => Alert.alert("Coming Soon")}>
            <Text style={styles.startCookingText}>Mulai Memasak</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* TASK 3.4: SAVE BUTTON */}
      <TouchableOpacity style={styles.fab} onPress={toggleSave}>
        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={26} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.neutral.bg },
  scrollContent: { flexGrow: 1 },
  headerContainer: { height: 320, width: width },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  headerNav: { position: 'absolute', top: Platform.OS === 'ios' ? 0 : 30, left: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.7)', justifyContent: 'center', alignItems: 'center' },
  mainCard: { marginTop: -40, backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, flex: 1 },
  
  // PERBAIKAN: Menambahkan titleWrapper yang tadinya hilang di StyleSheet
  titleWrapper: {
    marginBottom: 20,
  },
  
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: { backgroundColor: theme.colors.primary.DEFAULT, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: 'white', fontSize: 12, fontFamily: theme.font.bold },
  recipeTitle: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.neutral.dark, lineHeight: 32 },
  authorText: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.neutral.medium, marginTop: 4 },
  descriptionText: { fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.neutral.medium, lineHeight: 24, marginBottom: 25 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.colors.neutral.dark, marginBottom: 15 },
  ingredientsBox: { backgroundColor: theme.colors.neutral.bg, borderRadius: 20, padding: 20 },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ingredientText: { fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.neutral.dark },
  stepContainer: { flexDirection: 'row', marginBottom: 20, gap: 15 },
  stepNumberCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stepNum: { color: 'white', fontWeight: '800' },
  stepDescription: { flex: 1, fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.neutral.dark, lineHeight: 24 },
  startCookingBtn: { backgroundColor: theme.colors.primary.DEFAULT, paddingVertical: 16, borderRadius: theme.radius.md, alignItems: 'center', marginTop: 10 },
  startCookingText: { color: 'white', fontFamily: theme.font.bold, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary.DEFAULT, justifyContent: 'center', alignItems: 'center', elevation: 6 }
});
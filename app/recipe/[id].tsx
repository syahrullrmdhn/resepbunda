import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar, 
  SafeAreaView, 
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- 1. IMPORT PUSAT (DATABASE, AUTH, & THEME) ---
import { db } from "../../src/services/db/client"; 
import { useAuth } from "../../src/providers/AuthProvider";
import { theme } from "../../src/theme";

const { width } = Dimensions.get('window');

export default function RecipeDetailRoute() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  
  // Ambil auth state dan casting ke 'any' agar tidak error Property 'user'
  const auth = useAuth() as any; 
  const userEmail = auth.user?.email || auth.session?.user?.email;

  const [isSaved, setIsSaved] = useState(false);

  // --- DATA RESEP (Nantinya diambil dari DB berdasarkan id) ---
  const recipe = {
    id: id,
    title: "Salmon Panggang Lemon",
    category: "Dinner",
    time: 30,
    difficulty: "Medium",
    author: "Chef Amanda",
    description: "Menu sehat kaya omega-3 dengan rasa segar lemon yang menggugah selera keluarga. Cocok untuk hidangan malam yang praktis.",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
    ingredients: [
      { qty: "200g", item: "Fillet Salmon" },
      { qty: "1 buah", item: "Jeruk Lemon" },
      { qty: "2 siung", item: "Bawang Putih" },
      { qty: "2 sdm", item: "Minyak Zaitun" }
    ],
    steps: [
      "Marinasi salmon dengan perasan lemon, bawang putih, dan sedikit garam.",
      "Panaskan wajan anti lengket dengan api sedang.",
      "Panggang salmon selama 5-7 menit tiap sisi hingga matang sempurna dan berwarna keemasan."
    ]
  };

  // --- 2. LOGIC: CEK STATUS FAVORIT (Initial State) ---
  const checkIfSaved = async () => {
    if (!userEmail || !id) return;
    try {
      // Menggunakan db.query dari client.ts Bunda
      const rows = await db.query(
        'SELECT id FROM saved_recipes WHERE recipe_id = ? AND user_email = ?',
        [id, userEmail]
      );
      setIsSaved(rows.length > 0);
    } catch (error) {
      console.error("Gagal mengecek status favorit:", error);
    }
  };

  useEffect(() => {
    checkIfSaved();
  }, [id, userEmail]);

  // --- 3. LOGIC: SIMPAN/HAPUS (Task 3.4) ---
  const toggleSave = async () => {
    if (!userEmail) {
      Alert.alert("Perhatian", "Silakan masuk terlebih dahulu untuk menyimpan resep.");
      return;
    }

    try {
      if (isSaved) {
        // Gunakan db.execute dari client.ts Bunda
        await db.execute(
          'DELETE FROM saved_recipes WHERE recipe_id = ? AND user_email = ?',
          [id, userEmail]
        );
        setIsSaved(false);
        Alert.alert("Dihapus", "Resep dihapus dari daftar favorit Bunda.");
      } else {
        await db.execute(
          'INSERT INTO saved_recipes (recipe_id, user_email) VALUES (?, ?)',
          [id, userEmail]
        );
        setIsSaved(true);
        Alert.alert("Berhasil", "Resep disimpan ke favorit!");
      }
    } catch (error) {
      console.error("Gagal update database:", error);
      Alert.alert("Error", "Gagal memperbarui status simpanan.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Task 3.1: StatusBar Translucent */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TASK 3.1: HEADER LAYOUT */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
          <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]} />
          
          <SafeAreaView style={styles.navBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.contentCard}>
          {/* Judul & Meta */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{recipe.category}</Text>
          </View>
          
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.author}>Oleh {recipe.author}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color={theme.colors.primary.DEFAULT} />
              <Text style={styles.metaText}>{recipe.time} Menit</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bar-chart-outline" size={18} color={theme.colors.primary.DEFAULT} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.description}>{recipe.description}</Text>

          {/* TASK 3.2: INGREDIENTS SECTION (Premium UI) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bahan-bahan</Text>
            <View style={styles.ingredientsBox}>
              {recipe.ingredients.map((ing, index) => (
                <View key={index} style={styles.ingRow}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary.DEFAULT} style={{marginRight: 10}} />
                  <Text style={styles.ingText}>
                    <Text style={{ fontFamily: theme.font.bold, color: theme.colors.neutral.dark }}>{ing.qty}</Text> {ing.item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* TASK 3.3: STEPS SECTION (Premium UI) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cara Membuat</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={[styles.stepCircle, { backgroundColor: theme.colors.neutral.dark }]}>
                  <Text style={styles.stepNum}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* FIX: TOMBOL START COOKING (Dinonaktifkan agar tidak crash) */}
          <TouchableOpacity 
            style={[styles.startCookingBtn, { backgroundColor: theme.colors.primary.DEFAULT }]}
            onPress={() => Alert.alert("Coming Soon", "Fitur memasak sedang dikembangkan.")}
          >
            <Text style={styles.startCookingText}>Mulai Memasak</Text>
          </TouchableOpacity>
          
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* TASK 3.4: SAVE BUTTON (FAB) */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary.DEFAULT }]} 
        onPress={toggleSave}
      >
        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={26} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1 },
  headerContainer: { height: 320, width: '100%' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject },
  navBar: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 10, left: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30, 41, 59, 0.4)', justifyContent: 'center', alignItems: 'center' },
  contentCard: { marginTop: -40, backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, flex: 1 },
  categoryBadge: { backgroundColor: theme.colors.primary.DEFAULT, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.radius.sm, alignSelf: 'flex-start', marginBottom: 12 },
  categoryText: { color: 'white', fontFamily: theme.font.bold, fontSize: 11, textTransform: 'uppercase' },
  title: { fontSize: 26, fontFamily: theme.font.bold, color: theme.colors.neutral.dark, lineHeight: 32 },
  author: { fontSize: 14, fontFamily: theme.font.medium, color: theme.colors.neutral.medium, marginTop: 4 },
  metaRow: { flexDirection: 'row', marginTop: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20, backgroundColor: theme.colors.neutral.bg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.radius.sm },
  metaText: { marginLeft: 8, fontFamily: theme.font.bold, color: theme.colors.neutral.dark },
  divider: { height: 1, backgroundColor: theme.colors.neutral.light, marginVertical: 20 },
  description: { fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.neutral.medium, lineHeight: 24, marginBottom: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.colors.neutral.dark, marginBottom: 15 },
  ingredientsBox: { backgroundColor: theme.colors.neutral.bg, borderRadius: theme.radius.md, padding: 20 },
  ingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ingText: { fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.neutral.dark, flex: 1 },
  stepRow: { flexDirection: 'row', marginBottom: 20, gap: 15 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stepNum: { color: 'white', fontFamily: theme.font.bold },
  stepText: { flex: 1, fontSize: 15, fontFamily: theme.font.regular, color: theme.colors.neutral.dark, lineHeight: 24 },
  startCookingBtn: { paddingVertical: 16, borderRadius: theme.radius.md, alignItems: 'center', marginTop: 10 },
  startCookingText: { color: 'white', fontFamily: theme.font.bold, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 }
});
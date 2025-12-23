import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- 1. THEME CONFIGURATION ---
export const theme = {
  colors: {
    primary: {
      DEFAULT: "#059669",
      light: "#10b981",
      dark: "#047857",
      bg: "#ecfdf5",
    },
    neutral: {
      dark: "#1e293b",
      medium: "#64748b",
      light: "#e2e8f0",
      bg: "#f8fafc",
    },
    overlay: "rgba(30, 41, 59, 0.4)", 
    danger: "#ef4444",
  },
  radius: { lg: 22, md: 16, sm: 12, pill: 999 },
  spacing: { xs: 8, sm: 12, md: 16, lg: 20, xl: 28 },
  font: {
    regular: "Mulish_400Regular",
    medium: "Mulish_500Medium",
    semibold: "Mulish_600SemiBold",
    bold: "Mulish_700Bold",
  },
};

const { width } = Dimensions.get('window');

// --- 2. TYPES & MOCK DATA ---
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Ingredient {
  item: string;
  qty: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  time: number;
  difficulty: Difficulty;
  imageUrl: string;
  ingredients: Ingredient[];
  steps: string[];
  authorName: string;
}

const DUMMY_RECIPE: Recipe = {
  id: '123',
  title: 'Salmon Panggang Lemon',
  description: 'Menu sehat kaya omega-3 dengan rasa segar lemon yang menggugah selera keluarga. Cocok untuk makan malam yang ringan namun bergizi.',
  category: 'Dinner',
  time: 30,
  difficulty: 'Medium',
  imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=2670&auto=format&fit=crop',
  authorName: 'Chef Amanda',
  ingredients: [
    { item: 'Fillet Salmon', qty: '200 gram' },
    { item: 'Jeruk Lemon', qty: '1 buah' },
    { item: 'Bawang Putih', qty: '2 siung' },
    { item: 'Minyak Zaitun', qty: '2 sdm' },
    { item: 'Garam & Lada', qty: 'Secukupnya' },
  ],
  steps: [
    'Marinasi Salmon: Lumuri salmon dengan perasan lemon, bawang putih cincang, garam, dan lada. Diamkan selama 10 menit agar bumbu meresap sempurna.',
    'Panaskan Wajan: Siapkan wajan anti lengket atau grill pan. Beri sedikit minyak zaitun dan panaskan dengan api sedang.',
    'Panggang Salmon: Letakkan salmon di wajan (bagian kulit di bawah terlebih dahulu). Panggang selama 4-5 menit di setiap sisi sampai matang dan berwarna kecokelatan.',
    'Penyajian: Angkat dan sajikan dengan irisan lemon segar dan sayuran pendamping sesuai selera.',
  ],
};

// --- 3. MAIN COMPONENT (Deni Hermawan Task 3.1 - 3.4) ---
export default function RecipeDetailScreen() {
  const [isSaved, setIsSaved] = useState(false);

  const toggleSave = () => {
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? "Dihapus" : "Berhasil Disimpan",
      isSaved ? "Resep telah dihapus dari koleksi Anda." : "Resep telah ditambahkan ke daftar Simpanan."
    );
  };

  return (
    <View style={styles.container}>
      {/* PERBAIKAN DI SINI: properti 'transparent' diganti menjadi 'translucent' */}
      <StatusBar 
        barStyle="light-content" 
        translucent={true} 
        backgroundColor="transparent" 
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* TASK 3.1: HEADER LAYOUT (Image & Title) */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: DUMMY_RECIPE.imageUrl }} style={styles.headerImage} />
          <View style={styles.imageOverlay} />
          
          <SafeAreaView style={styles.headerNav}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* CONTENT AREA */}
        <View style={styles.mainCard}>
          <View style={styles.titleWrapper}>
            <View style={styles.categoryRow}>
               <View style={styles.badge}>
                  <Text style={styles.badgeText}>{DUMMY_RECIPE.category}</Text>
               </View>
               <View style={[styles.badge, { backgroundColor: theme.colors.primary.bg }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.primary.dark }]}>{DUMMY_RECIPE.time} Menit</Text>
               </View>
            </View>
            
            <Text style={styles.recipeTitle}>{DUMMY_RECIPE.title}</Text>
            <Text style={styles.authorText}>Oleh {DUMMY_RECIPE.authorName}</Text>
          </View>

          <Text style={styles.descriptionText}>{DUMMY_RECIPE.description}</Text>

          {/* TASK 3.2: INGREDIENTS SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bahan-bahan</Text>
            {DUMMY_RECIPE.ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientCard}>
                <View style={styles.ingredientInfo}>
                   <View style={styles.bullet} />
                   <Text style={styles.ingredientName}>{ing.item}</Text>
                </View>
                <Text style={styles.ingredientQty}>{ing.qty}</Text>
              </View>
            ))}
          </View>

          {/* TASK 3.3: STEPS SECTION (Numbered) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cara Membuat</Text>
            {DUMMY_RECIPE.steps.map((step, idx) => (
              <View key={idx} style={styles.stepContainer}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepDescription}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* TASK 3.4: SAVE/UNSAVE BUTTON (Floating Action Button) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={toggleSave}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={26} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
}

// --- 4. STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    height: 320,
    width: width,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay,
  },
  headerNav: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 30, // Penyesuaian jarak atas untuk Android/iOS
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    marginTop: -40,
    backgroundColor: 'white',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    flex: 1,
  },
  titleWrapper: {
    marginBottom: theme.spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: theme.colors.primary.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700', // Font bold manual jika asset belum terload
  },
  recipeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.neutral.dark,
    lineHeight: 32,
  },
  authorText: {
    fontSize: 14,
    color: theme.colors.neutral.medium,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: theme.colors.neutral.medium,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.neutral.dark,
    marginBottom: theme.spacing.md,
  },
  ingredientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.light,
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary.light,
    marginRight: 10,
  },
  ingredientName: {
    fontSize: 15,
    color: theme.colors.neutral.dark,
  },
  ingredientQty: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  stepNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.neutral.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  stepDescription: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.neutral.dark,
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
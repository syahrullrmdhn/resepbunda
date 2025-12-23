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
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Pastikan library ini terinstall

// --- 1. DEFINISI TIPE DATA (Sesuai IA Document Data Models) ---
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
  time: number; // Dalam menit
  difficulty: Difficulty;
  imageUrl: string;
  ingredients: Ingredient[];
  steps: string[];
  authorName: string; // Tambahan untuk UI
}

// --- 2. MOCK DATA (Data Contoh untuk Test Tampilan Deni) ---
const DUMMY_RECIPE: Recipe = {
  id: '123',
  title: 'Salmon Panggang Lemon',
  description: 'Menu sehat kaya omega-3 dengan rasa segar lemon yang menggugah selera keluarga.',
  category: 'Dinner',
  time: 30,
  difficulty: 'Medium',
  imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=2670&auto=format&fit=crop', // Gambar Placeholder
  authorName: 'Bunda Lesti',
  ingredients: [
    { item: 'Fillet Salmon', qty: '200 gram' },
    { item: 'Jeruk Lemon', qty: '1 buah' },
    { item: 'Bawang Putih', qty: '2 siung' },
    { item: 'Minyak Zaitun', qty: '2 sdm' },
    { item: 'Garam & Lada', qty: 'Secukupnya' },
  ],
  steps: [
    'Cuci bersih salmon dan keringkan dengan tisu dapur.',
    'Peras jeruk lemon di atas salmon, taburi garam dan lada.',
    'Cincang bawang putih, campurkan dengan minyak zaitun.',
    'Olesi salmon dengan campuran minyak bawang.',
    'Panggang di teflon atau oven selama 15-20 menit hingga matang.',
  ],
};

// --- 3. KOMPONEN UTAMA (Task Deni Hermawan) ---
export default function RecipeDetailScreen() {
  // Logic Task 3.4: Save/Unsave Button
  const [isSaved, setIsSaved] = useState(false);

  const toggleSave = () => {
    setIsSaved(!isSaved);
    // Feedback visual sederhana
    Alert.alert(
      isSaved ? "Dihapus" : "Disimpan", 
      isSaved ? "Resep dihapus dari koleksi." : "Resep berhasil disimpan ke Favorit!"
    );
  };

  // Handler Tombol Kembali (Bisa dihubungkan dengan navigation.goBack() nanti)
  const handleBackPress = () => {
    console.log('Back pressed');
    // Jika menggunakan React Navigation, ganti baris ini dengan: navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TASK 3.1: HEADER LAYOUT (Image & Title) */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: DUMMY_RECIPE.imageUrl }} style={styles.headerImage} />
          
          {/* Overlay agar tombol back terlihat jelas */}
          <View style={styles.overlay} />

          {/* Tombol Back & Title Overlay */}
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.topBar}>
              <TouchableOpacity 
                style={styles.circleButton} 
                onPress={handleBackPress}
                activeOpacity={0.7} // Tambahan: Efek tekan lebih smooth
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* CONTENT CONTAINER */}
        <View style={styles.contentContainer}>
          {/* Judul & Meta Data */}
          <View style={styles.titleSection}>
            <Text style={styles.categoryBadge}>{DUMMY_RECIPE.category}</Text>
            <Text style={styles.title}>{DUMMY_RECIPE.title}</Text>
            <Text style={styles.author}>Oleh: {DUMMY_RECIPE.authorName}</Text>

            {/* Info Waktu & Kesulitan */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.metaText}>{DUMMY_RECIPE.time} Menit</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="bar-chart-outline" size={18} color="#666" />
                <Text style={styles.metaText}>{DUMMY_RECIPE.difficulty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Deskripsi */}
          <Text style={styles.description}>{DUMMY_RECIPE.description}</Text>

          {/* TASK 3.2: INGREDIENTS SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bahan-bahan</Text>
            <View style={styles.ingredientsBox}>
              {DUMMY_RECIPE.ingredients.map((ing, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>
                    <Text style={{fontWeight: 'bold'}}>{ing.qty}</Text> {ing.item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* TASK 3.3: STEPS SECTION (Numbered) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cara Membuat</Text>
            {DUMMY_RECIPE.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
          
          {/* Space kosong di bawah agar tidak tertutup tombol FAB */}
          <View style={{height: 100}} />
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
          size={28} 
          color="white" 
        />
      </TouchableOpacity>
    </View>
  );
}

// --- STYLING (Menggunakan StyleSheet API)  ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Header
  headerContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Gelap sedikit agar teks terbaca
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10, // Disesuaikan jika perlu
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', // Background tombol sedikit lebih gelap agar kontras
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Content
  contentContainer: {
    marginTop: -30, // Efek menumpuk (Card style)
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 500,
  },
  categoryBadge: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: '#F7F9FC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 16,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  // Ingredients
  ingredientsBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginRight: 10,
  },
  ingredientText: {
    fontSize: 15,
    color: '#444',
  },
  // Steps
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  // FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B', // Warna Primary
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow properties
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
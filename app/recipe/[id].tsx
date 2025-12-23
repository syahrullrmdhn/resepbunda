import React, { useState } from 'react';
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
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- THEME v2.0 ---
const theme = {
  primary: "#059669",
  neutral: {
    dark: "#1e293b",
    medium: "#64748b",
    bg: "#f8fafc",
    light: "#e2e8f0"
  }
};

export default function RecipeDetailRoute() {
  const { id } = useLocalSearchParams(); // Menangkap ID Resep
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);

  // Data Dummy (Nantinya data ini diambil berdasarkan 'id' di atas)
  const recipe = {
    title: "Salmon Panggang Lemon",
    category: "Dinner",
    time: 30,
    difficulty: "Medium",
    author: "Chef Amanda",
    description: "Menu sehat kaya omega-3 dengan rasa segar lemon yang menggugah selera keluarga.",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
    ingredients: [
      { qty: "200g", item: "Fillet Salmon" },
      { qty: "1 buah", item: "Jeruk Lemon" },
      { qty: "2 siung", item: "Bawang Putih" }
    ],
    steps: [
      "Marinasi salmon dengan perasan lemon dan bawang putih.",
      "Panaskan wajan anti lengket dengan sedikit minyak zaitun.",
      "Panggang salmon selama 5-7 menit hingga matang sempurna."
    ]
  };

  return (
    <View style={styles.container}>
      {/* Task 3.1: StatusBar Translucent */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Task 3.1: Header Layout */}
        <View style={styles.headerContainer}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
          <View style={styles.overlay} />
          <SafeAreaView style={styles.navBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.categoryBadge}><Text style={styles.categoryText}>{recipe.category}</Text></View>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.author}>Oleh {recipe.author}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color={theme.primary} />
              <Text style={styles.metaText}>{recipe.time} Menit</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bar-chart-outline" size={18} color={theme.primary} />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.description}>{recipe.description}</Text>

          {/* Task 3.2: Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bahan-bahan</Text>
            <View style={styles.ingredientsBox}>
              {recipe.ingredients.map((ing, index) => (
                <View key={index} style={styles.ingRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingText}><Text style={{fontWeight: '700'}}>{ing.qty}</Text> {ing.item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Task 3.3: Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cara Membuat</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepCircle}><Text style={styles.stepNum}>{index + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
          <View style={{height: 100}} />
        </View>
      </ScrollView>

      {/* Task 3.4: Save/Unsave Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          setIsSaved(!isSaved);
          Alert.alert(isSaved ? "Dihapus" : "Disimpan", "Resep berhasil diperbarui!");
        }}
      >
        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={26} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  headerContainer: { height: 320, width: '100%' },
  image: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  navBar: { position: 'absolute', top: Platform.OS === 'android' ? 40 : 0, left: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  contentCard: { marginTop: -35, backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25 },
  categoryBadge: { backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  categoryText: { color: 'white', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: theme.neutral.dark, lineHeight: 32 },
  author: { fontSize: 14, color: theme.neutral.medium, marginTop: 4 },
  metaRow: { flexDirection: 'row', marginTop: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20, backgroundColor: theme.neutral.bg, padding: 10, borderRadius: 12 },
  metaText: { marginLeft: 8, fontWeight: '700', color: theme.neutral.dark },
  divider: { height: 1, backgroundColor: theme.neutral.light, marginVertical: 20 },
  description: { fontSize: 15, color: theme.neutral.medium, lineHeight: 24, marginBottom: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.neutral.dark, marginBottom: 15 },
  ingredientsBox: { backgroundColor: theme.neutral.bg, borderRadius: 15, padding: 15 },
  ingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary, marginRight: 12 },
  ingText: { fontSize: 15, color: theme.neutral.dark },
  stepRow: { flexDirection: 'row', marginBottom: 20, gap: 15 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.neutral.dark, justifyContent: 'center', alignItems: 'center' },
  stepNum: { color: 'white', fontWeight: '800' },
  stepText: { flex: 1, fontSize: 15, color: theme.neutral.dark, lineHeight: 24 },
  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 }
});
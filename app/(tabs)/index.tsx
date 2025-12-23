import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- 1. THEME CONFIGURATION (Resep Bunda v2.0) ---
const theme = {
  colors: {
    primary: {
      DEFAULT: "#059669", // Emerald Green
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
    bold: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-condensed',
    medium: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  }
};

const { width } = Dimensions.get('window');

// --- 2. TYPES & DATA ---
interface Ingredient {
  item: string;
  qty: string;
}

interface Recipe {
  id: string;
  title: string;
  category: string;
  time: number;
  difficulty: string;
  authorName: string;
  imageUrl: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
}

const ALL_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Salmon Panggang Lemon',
    category: 'Dinner',
    time: 30,
    difficulty: 'Medium',
    authorName: 'Chef Amanda',
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
    description: 'Menu sehat kaya omega-3 dengan rasa segar lemon yang menggugah selera keluarga.',
    ingredients: [
      { item: 'Fillet Salmon', qty: '200 gram' },
      { item: 'Jeruk Lemon', qty: '1 buah' },
      { item: 'Minyak Zaitun', qty: '2 sdm' },
    ],
    steps: ['Marinasi salmon dengan lemon & lada.', 'Panaskan wajan anti lengket.', 'Panggang 5 menit tiap sisi hingga cokelat.']
  },
  {
    id: '2',
    title: 'Bubur Manado MPASI',
    category: 'MPASI',
    time: 40,
    difficulty: 'Easy',
    authorName: 'Bunda Siti',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    description: 'Bubur bernutrisi tinggi dengan campuran labu kuning dan bayam segar untuk si kecil.',
    ingredients: [
      { item: 'Beras Putih', qty: '50 gram' },
      { item: 'Labu Kuning', qty: '100 gram' },
      { item: 'Bayam', qty: '1 ikat kecil' },
    ],
    steps: ['Rebus beras hingga menjadi bubur.', 'Masukkan potongan labu kuning.', 'Tambahkan bayam di akhir proses masak.']
  },
  {
    id: '3',
    title: 'Puding Mangga Susu',
    category: 'Snack',
    time: 60,
    difficulty: 'Easy',
    authorName: 'Bunda Lesti',
    imageUrl: 'https://images.unsplash.com/photo-1590080873958-b6bc8765f33e?w=800',
    description: 'Camilan manis dan dingin yang sangat disukai anak-anak saat sore hari.',
    ingredients: [
      { item: 'Mangga Harum Manis', qty: '2 buah' },
      { item: 'Agar-agar Plain', qty: '1 bungkus' },
      { item: 'Susu Cair', qty: '500 ml' },
    ],
    steps: ['Blender mangga hingga halus.', 'Masak agar-agar dengan susu.', 'Campur mangga, aduk rata, lalu cetak.']
  },
];

// --- 3. KOMPONEN CARD (Task 2.1 - Zikri) ---
const RecipeCard = ({ item, onPress }: { item: Recipe, onPress: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadgeCard}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={14} color={theme.colors.neutral.medium} />
          <Text style={styles.cardTimeText}>{item.time} m</Text>
        </View>
      </View>
      <Text style={styles.cardTitleText}>{item.title}</Text>
      <Text style={styles.cardAuthorText}>Oleh {item.authorName}</Text>
    </View>
  </TouchableOpacity>
);

// --- 4. KOMPONEN DETAIL (Task 3.1 - 3.4 - Deni) ---
const RecipeDetail = ({ recipe, onBack }: { recipe: Recipe, onBack: () => void }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  return (
    <View style={styles.container}>
       <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerImageContainer}>
          <Image source={{ uri: recipe.imageUrl }} style={styles.fullImage} />
          <View style={styles.imageOverlay} />
          <SafeAreaView style={styles.absoluteHeader}>
            <View style={styles.topBarNav}>
              <TouchableOpacity style={styles.backCircle} onPress={onBack}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.detailContentCard}>
          <View style={styles.titleWrapper}>
            <View style={styles.badgeRow}>
               <View style={styles.categoryLabel}>
                  <Text style={styles.categoryLabelText}>{recipe.category}</Text>
               </View>
            </View>
            <Text style={styles.mainTitle}>{recipe.title}</Text>
            <Text style={styles.authorDetail}>Oleh {recipe.authorName}</Text>
            
            <View style={styles.infoMetaRow}>
              <View style={styles.infoMetaItem}>
                <Ionicons name="time-outline" size={18} color={theme.colors.primary.DEFAULT} />
                <Text style={styles.infoMetaText}>{recipe.time} Menit</Text>
              </View>
              <View style={styles.infoMetaItem}>
                <Ionicons name="bar-chart-outline" size={18} color={theme.colors.primary.DEFAULT} />
                <Text style={styles.infoMetaText}>{recipe.difficulty}</Text>
              </View>
            </View>
          </View>

          <View style={styles.lineDivider} />
          <Text style={styles.recipeDesc}>{recipe.description}</Text>

          {/* Task 3.2: Bahan-bahan */}
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionHeading}>Bahan-bahan</Text>
            <View style={styles.ingredientsContainer}>
              {recipe.ingredients.map((ing, index) => (
                <View key={index} style={styles.ingRow}>
                  <View style={styles.ingBullet} />
                  <Text style={styles.ingText}>
                    <Text style={{fontWeight: '700', color: theme.colors.neutral.dark}}>{ing.qty}</Text> {ing.item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Task 3.3: Cara Membuat */}
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionHeading}>Cara Membuat</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNum}>{index + 1}</Text>
                </View>
                <Text style={styles.stepDescText}>{step}</Text>
              </View>
            ))}
          </View>
          <View style={{height: 120}} />
        </View>
      </ScrollView>

      {/* Task 3.4: FAB Save */}
      <TouchableOpacity 
        style={styles.floatingSaveBtn} 
        onPress={() => {
          setIsSaved(!isSaved);
          Alert.alert(isSaved ? "Dihapus" : "Disimpan", `Resep ${recipe.title} ${isSaved ? "dihapus" : "disimpan"}!`);
        }}
      >
        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={26} color="white" />
      </TouchableOpacity>
    </View>
  );
};

// --- 5. KOMPONEN UTAMA ---
export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }

  return (
    <View style={styles.homeBg}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="white" />
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.homeHeaderArea}>
          <Text style={styles.greetingText}>Halo, Bunda Siti! 👋</Text>
          <Text style={styles.homeHeadline}>Mau masak apa hari ini?</Text>
        </View>

        <FlatList
          data={ALL_RECIPES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.homeListPadding}
          renderItem={({ item }) => (
            <RecipeCard item={item} onPress={() => setSelectedRecipe(item)} />
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

// --- 6. STYLES (Emerald Theme v2.0) ---
const styles = StyleSheet.create({
  // Home Styles
  homeBg: { flex: 1, backgroundColor: theme.colors.neutral.bg },
  homeHeaderArea: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, backgroundColor: 'white' },
  greetingText: { fontSize: 16, color: theme.colors.neutral.medium, marginBottom: 4 },
  homeHeadline: { fontSize: 26, fontWeight: '800', color: theme.colors.neutral.dark },
  homeListPadding: { padding: 20, paddingBottom: 100 },
  
  // Card Styles
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.06, shadowRadius:12 },
  cardImage: { width: '100%', height: 190 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  categoryBadgeCard: { backgroundColor: theme.colors.primary.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { color: theme.colors.primary.DEFAULT, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  cardTimeText: { fontSize: 12, color: theme.colors.neutral.medium, marginLeft: 4, fontWeight: '600' },
  cardTitleText: { fontSize: 18, fontWeight: '700', color: theme.colors.neutral.dark, marginBottom: 4 },
  cardAuthorText: { fontSize: 13, color: theme.colors.neutral.medium },

  // Detail Styles
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1 },
  headerImageContainer: { height: 340, width: '100%' },
  fullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  absoluteHeader: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBarNav: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30, 41, 59, 0.5)', justifyContent: 'center', alignItems: 'center' },
  detailContentCard: { marginTop: -40, backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 24, flex: 1 },
  badgeRow: { flexDirection: 'row', marginBottom: 12 },
  categoryLabel: { backgroundColor: theme.colors.primary.DEFAULT, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  categoryLabelText: { color: 'white', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  titleWrapper: { marginBottom: 20 },
  mainTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.neutral.dark, lineHeight: 32 },
  authorDetail: { fontSize: 14, color: theme.colors.neutral.medium, marginTop: 4 },
  infoMetaRow: { flexDirection: 'row', marginTop: 16 },
  infoMetaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 24, backgroundColor: theme.colors.neutral.bg, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  infoMetaText: { marginLeft: 8, fontSize: 13, color: theme.colors.neutral.dark, fontWeight: '700' },
  lineDivider: { height: 1, backgroundColor: theme.colors.neutral.light, marginVertical: 20 },
  recipeDesc: { fontSize: 15, color: theme.colors.neutral.medium, lineHeight: 24, marginBottom: 24 },
  sectionMargin: { marginTop: 10 },
  sectionHeading: { fontSize: 19, fontWeight: '800', color: theme.colors.neutral.dark, marginBottom: 16 },
  ingredientsContainer: { backgroundColor: theme.colors.neutral.bg, borderRadius: 20, padding: 20 },
  ingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ingBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary.DEFAULT, marginRight: 12 },
  ingText: { fontSize: 15, color: theme.colors.neutral.medium },
  stepItem: { flexDirection: 'row', marginBottom: 20, gap: 16 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.neutral.dark, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  stepNum: { color: 'white', fontWeight: '800', fontSize: 14 },
  stepDescText: { flex: 1, fontSize: 15, color: theme.colors.neutral.dark, lineHeight: 24 },
  floatingSaveBtn: { position: 'absolute', bottom: 30, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary.DEFAULT, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: theme.colors.primary.dark, shadowOffset: {width:0, height:6}, shadowOpacity:0.3, shadowRadius:8 },
});
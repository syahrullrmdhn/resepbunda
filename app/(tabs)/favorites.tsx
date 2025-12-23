import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORT THEME PUSAT (Sesuai Proyek v2.0) ---
import { theme } from "../../src/theme";

const { width } = Dimensions.get('window');

// --- 2. TYPES & DUMMY DATA ---
interface Recipe {
  id: string;
  title: string;
  category: string;
  time: string;
  difficulty: string;
  image: string;
}

const SavedRecipesScreen = ({ navigation }: any) => {
  // Dummy Data (Menggunakan kategori standar v2.0: MPASI, Dinner, dll)
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([
    {
      id: '1',
      title: 'Bubur Manado MPASI',
      category: 'MPASI',
      time: '40 mnt',
      difficulty: 'Easy',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500', 
    },
    {
      id: '2',
      title: 'Salmon Teriyaki Sehat',
      category: 'Dinner',
      time: '20 mnt',
      difficulty: 'Medium',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500', 
    },
    {
      id: '3',
      title: 'Puding Mangga Susu',
      category: 'Snack',
      time: '60 mnt',
      difficulty: 'Easy',
      image: 'https://images.unsplash.com/photo-1590080873958-b6bc8765f33e?w=500', 
    },
  ]);

  // Fungsi Unsave (Logic Task 3.4 & 4.3)
  const handleUnsave = (id: string) => {
    Alert.alert(
      "Hapus Simpanan",
      "Hapus resep ini dari daftar simpanan Bunda?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: () => setSavedRecipes(prev => prev.filter(item => item.id !== id)) 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => console.log('Navigasi ke detail:', item.title)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      
      <View style={styles.cardContent}>
        <View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.neutral.medium} />
            <Text style={styles.metaText}>{item.time}</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{item.difficulty}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleUnsave(item.id)}
            style={styles.bookmarkActive}
          >
            <Ionicons name="bookmark" size={20} color={theme.colors.primary.DEFAULT} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resep Tersimpan</Text>
        <Text style={styles.headerSub}>Koleksi resep favorit Bunda di satu tempat</Text>
      </View>

      {savedRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bookmark-outline" size={50} color={theme.colors.neutral.light} />
          </View>
          <Text style={styles.emptyText}>Bunda belum menyimpan resep</Text>
          <Text style={styles.emptySubText}>
            Klik ikon simpan pada resep yang Bunda sukai untuk menambahkannya di sini.
          </Text>
          <TouchableOpacity style={styles.exploreBtn}>
            <Text style={styles.exploreBtnText}>Cari Inspirasi Masakan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedRecipes}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.neutral.dark,
  },
  headerSub: {
    fontSize: 14,
    color: theme.colors.neutral.medium,
    marginTop: 2,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // Space untuk Tab Bar
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    height: 120,
  },
  cardImage: {
    width: 110,
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: theme.colors.primary.bg,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.primary.DEFAULT,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.neutral.dark,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.neutral.medium,
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.neutral.light,
    marginHorizontal: 8,
  },
  bookmarkActive: {
    padding: 4,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.neutral.light,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.neutral.dark,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.neutral.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 25,
    backgroundColor: theme.colors.primary.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.radius.pill,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  }
});

export default SavedRecipesScreen;
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, StatusBar, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

// --- DEPENDENCIES ---
import { theme } from '../theme';
import RecipeCard from '../components/RecipeCard';
import { useAuth } from '../providers/AuthProvider';
import { Recipe } from '../types/recipe';
import { querySql } from '../services/db'; 

// --- IMPORT BIBIT DATA ---
import { recipes as SEED_DATA } from '../services/db/seeds/recipes'; 

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const SavedRecipesScreen = () => {
  const { session } = useAuth();
  
  // STATE
  const [allData, setAllData] = useState<Recipe[]>([]);
  const [displayedData, setDisplayedData] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');

  // --- LOGIC PINTAR: CEK & ISI OTOMATIS ---
  const fetchAndEnsureData = async () => {
    try {
      setLoading(true);
      
      // 1. Cek isi database sekarang
      let result = await querySql<Recipe>('SELECT * FROM recipes ORDER BY id DESC');
      
      // 2. LOGIC IF KOSONG -> ISI OTOMATIS (SEEDING)
      if (result.length === 0) {
        console.log('Database kosong. Melakukan Auto-Seeding...');
        
        for (const r of SEED_DATA) {
          await querySql(
            `INSERT INTO recipes (title, description, creator, creatorType, cookingTime, category, isPrivate, rating, calories, ingredients, steps) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              r.title, r.description, r.creator, r.creatorType, r.cookingTime, r.category,
              r.isPrivate ? 1 : 0, r.rating, r.calories,
              JSON.stringify(r.ingredients), JSON.stringify(r.steps)
            ]
          );
        }
        
        // 3. Ambil ulang data setelah diisi
        result = await querySql<Recipe>('SELECT * FROM recipes ORDER BY id DESC');
      }

      setAllData(result);
      setDisplayedData(result);
      
    } catch (error) {
      console.error("Error database:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAndEnsureData();
    }, [])
  );

  // SEARCH LOGIC
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text) {
      const filtered = allData.filter(item => 
        item.title.toLowerCase().includes(text.toLowerCase())
      );
      setDisplayedData(filtered);
    } else {
      setDisplayedData(allData);
    }
  };

  const toggleSearch = () => {
    if (isSearching) {
      setIsSearching(false);
      setSearchText('');
      setDisplayedData(allData);
    } else {
      setIsSearching(true);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>
        {searchText ? '🔍' : '🍳'}
      </Text>
      <Text style={styles.emptyTitle}>
        {searchText ? 'Tidak Ditemukan' : 'Belum Ada Data'}
      </Text>
      <Text style={styles.emptySub}>
        {searchText 
          ? `Tidak ada resep dengan kata kunci "${searchText}"`
          : 'Data resep belum tersedia.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {isSearching ? (
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color={theme.colors.neutral.medium} style={{marginRight: 8}} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Cari resep..."
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
            />
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons name="close-circle" size={24} color={theme.colors.neutral.medium} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Saved Recipes</Text>
              <Text style={styles.headerSub}>Koleksi resep favoritmu</Text>
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
              <Ionicons name="search" size={28} color={theme.colors.neutral.dark} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={displayedData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            displayedData.length === 0 && { flex: 1 } 
          ]}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <RecipeCard 
                recipe={item} 
                onPress={() => router.push(`/recipe/${item.id}`)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

// --- STYLING (ANY MODE: ON) ---
const styles: any = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: STATUSBAR_HEIGHT + 10, 
    paddingBottom: 24,
    paddingHorizontal: 20,
    height: 110, 
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: theme.font.bold,
    fontWeight: 'bold',
    color: theme.colors.neutral.dark,
    marginBottom: 0, 
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: theme.font.medium,
    fontWeight: '500',
    color: theme.colors.neutral.medium,
    marginTop: 2, 
  },
  searchButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: 14,
    color: theme.colors.neutral.dark,
    height: '100%',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingBottom: 50, 
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    fontWeight: 'bold',
    color: theme.colors.neutral.dark,
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.neutral.medium,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default SavedRecipesScreen;
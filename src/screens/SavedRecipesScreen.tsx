import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, StatusBar, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

// --- DEPENDENCIES ---
import { theme } from '../theme';
import { useAuth } from '../providers/AuthProvider';
import { Recipe } from '../types/recipe';
import { querySql, execSql } from '../services/db'; 

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const SavedRecipesScreen = () => {
  const { session } = useAuth(); // Kita butuh session.email di sini
  
  // STATE
  const [allData, setAllData] = useState<Recipe[]>([]);
  const [displayedData, setDisplayedData] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');

  // --- LOGIC DATABASE DENGAN FILTER USER ---
  const fetchSavedData = async () => {
    // Safety Check: Kalau gak login, jangan fetch apa-apa
    if (!session?.email) {
      setLoading(false);
      setAllData([]);
      setDisplayedData([]);
      return;
    }

    try {
      setLoading(true);

      // 1. Pastikan TABELNYA ada (Schema Only)
      await execSql(`
        CREATE TABLE IF NOT EXISTS saved_recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          recipe_id INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(user_email, recipe_id)
        );
      `);

      // 2. Query Real (JOIN + FILTER USER)
      // Perhatikan tambahan: WHERE s.user_email = ?
      const result = await querySql<Recipe>(
        `SELECT r.* 
         FROM recipes r 
         JOIN saved_recipes s ON r.id = s.recipe_id 
         WHERE s.user_email = ? 
         ORDER BY s.created_at DESC`,
        [session.email] // Parameter email dinamis
      );
      
      console.log(`Saved data for ${session.email}:`, result.length);
      setAllData(result);
      setDisplayedData(result);
      
    } catch (error) {
      console.error("Error fetching saved data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSavedData();
    }, [session?.email]) // Re-fetch kalau ganti akun
  );

  // LOGIC HAPUS (AKTIFKAN SQL DELETE DENGAN FILTER USER)
  const handleRemove = async (id: number) => {
    if (!session?.email) return;

    Alert.alert("Hapus", "Yakin hapus dari koleksi?", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Hapus", 
        style: "destructive", 
        onPress: async () => {
          try {
            // Hapus spesifik punya user ini saja
            await execSql(
              'DELETE FROM saved_recipes WHERE recipe_id = ? AND user_email = ?', 
              [id, session.email]
            );
            
            // Update UI
            const newData = allData.filter(item => item.id !== id);
            setAllData(newData);
            setDisplayedData(newData);
          } catch (e) {
            console.error("Gagal hapus:", e);
            Alert.alert("Error", "Gagal menghapus data dari database.");
          }
        }
      }
    ]);
  };

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
      <Text style={styles.emptyEmoji}>🍳</Text>
      <Text style={styles.emptyTitle}>{searchText ? 'Tidak Ditemukan' : 'Belum Ada Simpanan'}</Text>
      <Text style={styles.emptySub}>
        {searchText 
          ? `Tidak ada hasil untuk "${searchText}"` 
          : 'Simpan resep dulu dari halaman Beranda.'}
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
          contentContainerStyle={[styles.listContent, displayedData.length === 0 && { flex: 1 }]}
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            // CUSTOM CARD
            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.9}
              onPress={() => router.push(`/recipe/${item.id}`)}
            >
              {/* GAMBAR */}
              <Image 
                source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' }} 
                style={styles.cardImage} 
              />

              {/* KONTEN */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                
                <View style={styles.metaRow}>
                  <Ionicons name="person-outline" size={12} color="#64748b" />
                  <Text style={styles.metaText}>
                    Oleh <Text style={{fontFamily: theme.font.medium, color: '#334155'}}>{item.creator}</Text>
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.savedAtText}>Tersimpan</Text>
                  <View style={styles.dot} />
                  <View style={styles.badgeYellow}>
                    <Text style={styles.badgeText}>Favorit</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                    <Ionicons name="time-outline" size={14} color="#64748b" />
                    <Text style={styles.metaText}>{item.cookingTime}</Text>
                  </View>

                  <View style={{flexDirection:'row', gap:8}}>
                    <TouchableOpacity 
                      style={styles.circleBtn} 
                      onPress={() => router.push(`/recipe/${item.id}`)}
                    >
                       <Ionicons name="eye-outline" size={16} color="#64748b" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.circleBtn, { backgroundColor: '#fee2e2' }]} 
                      onPress={() => handleRemove(item.id)}
                    >
                       <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

// --- STYLE ---
const styles: any = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    paddingTop: STATUSBAR_HEIGHT + 10, paddingBottom: 24, paddingHorizontal: 20, height: 110,
  },
  headerLeft: { flex: 1, paddingRight: 10, justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontFamily: theme.font.bold, fontWeight: 'bold', color: theme.colors.neutral.dark, marginBottom: 0, letterSpacing: -0.5, lineHeight: 34 },
  headerSub: { fontSize: 13, fontFamily: theme.font.medium, fontWeight: '500', color: theme.colors.neutral.medium, marginTop: 2 },
  searchButton: { padding: 5, justifyContent: 'center', alignItems: 'center' },
  searchBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontFamily: theme.font.medium, fontSize: 14, color: theme.colors.neutral.dark, height: '100%' },
  listContent: { padding: 20, paddingBottom: 100 },
  
  // Custom Card
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16, gap: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.05, shadowRadius:4, elevation:2
  },
  cardImage: { width: 85, height: 85, borderRadius: 10, backgroundColor: '#eee' },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontFamily: theme.font.bold, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  metaText: { fontSize: 12, color: '#64748b', fontFamily: theme.font.medium },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  savedAtText: { fontSize: 11, color: '#64748b' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#cbd5e1' },
  badgeYellow: { backgroundColor: '#fefce8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontFamily: theme.font.bold, fontWeight: 'bold', color: '#ca8a04' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  circleBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: theme.font.bold, fontWeight: 'bold', color: theme.colors.neutral.dark },
  emptySub: { fontSize: 14, color: theme.colors.neutral.medium, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
});

export default SavedRecipesScreen;
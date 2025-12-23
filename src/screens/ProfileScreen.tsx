import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORT THEME PUSAT (Sesuai Struktur Proyek v2.0) ---
import { theme } from "../../src/theme";

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }: any) => {

  // Logic Logout sesuai Task 7.3
  const handleLogout = () => {
    Alert.alert(
      "Keluar",
      "Apakah Bunda yakin ingin keluar dari aplikasi?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          style: "destructive", 
          onPress: () => console.log("User Logged Out") 
          // Di sini nanti tempat navigasi kembali ke layar Login
        }
      ]
    );
  };

  // Komponen Menu Item v2.0
  const MenuItem = ({ icon, label, onPress, isDanger = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isDanger ? "#fee2e2" : theme.colors.primary.bg }
        ]}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={isDanger ? theme.colors.danger : theme.colors.primary.DEFAULT} 
          />
        </View>
        <Text style={[styles.menuLabel, isDanger && { color: theme.colors.danger }]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.neutral.light} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* HEADER SECTION (Sesuai Desain PDF v2.0) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profil & Akun</Text>
          
          <View style={styles.profileInfo}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500' }} 
                style={styles.avatar} 
              />
              <TouchableOpacity style={styles.cameraBtn}>
                <Ionicons name="camera" size={14} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userMeta}>
              <Text style={styles.userName}>Siti Aminah</Text>
              <Text style={styles.userBio}>
                Ibu dari 2 anak. Suka masak MPASI & bekal suami 🍱
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color="white" />
            <Text style={styles.editBtnText}>Edit Profil</Text>
          </TouchableOpacity>
        </View>

        {/* STATS SHORTCUT (PRD 4.4) */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Resep Saya</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statNumber}>48</Text>
            <Text style={styles.statLabel}>Disimpan</Text>
          </TouchableOpacity>
        </View>

        {/* MENU SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pengaturan Akun</Text>
          <MenuItem icon="person-outline" label="Detail Personal" onPress={() => {}} />
          <MenuItem icon="notifications-outline" label="Notifikasi" onPress={() => {}} />
          <MenuItem icon="shield-checkmark-outline" label="Privasi & Keamanan" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dukungan</Text>
          <MenuItem icon="help-circle-outline" label="Pusat Bantuan" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Syarat & Ketentuan" onPress={() => {}} />
          <MenuItem 
            icon="log-out-outline" 
            label="Keluar dari Akun" 
            isDanger={true} 
            onPress={handleLogout} 
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Resep Bunda v2.0.0</Text>
          <Text style={styles.footerSub}>Dibuat dengan ❤️ oleh Kelompok 6</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.neutral.dark,
    textAlign: 'center',
    marginBottom: 25,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: theme.colors.neutral.light,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary.DEFAULT,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userMeta: {
    marginLeft: 18,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.neutral.dark,
  },
  userBio: {
    fontSize: 14,
    color: theme.colors.neutral.medium,
    marginTop: 4,
    lineHeight: 20,
  },
  editBtn: {
    backgroundColor: theme.colors.primary.DEFAULT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    gap: 8,
  },
  editBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.lg,
    marginTop: -20,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
  },
  // --- INI PERBAIKANNYA: Nama diganti dari statNumberLabel menjadi statLabel ---
  statLabel: {
    fontSize: 12,
    color: theme.colors.neutral.medium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.neutral.light,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.neutral.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: theme.radius.sm,
    marginBottom: 8,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.neutral.dark,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral.medium,
  },
  footerSub: {
    fontSize: 12,
    color: theme.colors.neutral.light,
    marginTop: 4,
  },
});

export default ProfileScreen;
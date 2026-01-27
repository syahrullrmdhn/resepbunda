import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Camera,
  ChefHat,
  ChevronRight,
  Grid3X3,
  Info,
  LogOut,
  Save,
  Settings,
  ShieldAlert,
  Trash2
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLogoutConfirmation } from "../../src/hooks/useLogoutConfirmation";
import { useAuth } from "../../src/providers/AuthProvider";
import { querySql } from "../../src/services/db";
import { theme } from "../../src/theme";
import { Recipe } from "../../src/types/recipe";

// --- TYPES ---
type UserProfileRow = {
  id: number;
  email: string;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

// --- CONSTANTS ---
const MAX_BIO_LENGTH = 150;
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const COLORS = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textMain: "#0F172A",
  textSec: "#64748B",
  primary: theme.colors.primary.DEFAULT,
  danger: "#EF4444",
};

export default function Profile() {
  const { session } = useAuth();
  const { confirmLogout } = useLogoutConfirmation();
  const insets = useSafeAreaInsets();
  const email = session?.email ?? "";

  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"feed" | "settings">("feed");
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // --- LOAD DATA ---
  const loadProfileAndRecipes = useCallback(async () => {
    if (!email) return;
    try {
      // Load Profile
      const rows = await querySql<UserProfileRow>(
        `SELECT id, email, fullName, bio, avatarUrl FROM users WHERE email = ? LIMIT 1`,
        [email],
      );

      let userData: UserProfileRow;
      if (rows.length === 0) {
        await querySql(
          `INSERT INTO users (email, fullName, bio, avatarUrl) VALUES (?, ?, ?, ?)`,
          [email, "", "", ""],
        );
        const again = await querySql<UserProfileRow>(
          `SELECT * FROM users WHERE email = ? LIMIT 1`,
          [email],
        );
        userData = again[0];
      } else {
        userData = rows[0];
      }

      setProfile(userData);
      setFullName(userData.fullName ?? "");
      setBio(userData.bio ?? "");
      setAvatarUrl(userData.avatarUrl ?? "");

      // Load Recipes
      const recipes = await querySql<Recipe>(
        `SELECT * FROM recipes WHERE creator_email = ? ORDER BY id DESC`,
        [email],
      );
      setMyRecipes(recipes);
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      loadProfileAndRecipes();
    }, [loadProfileAndRecipes]),
  );

  // --- ACTIONS ---
  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Izin", "Akses galeri diperlukan.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setAvatarUrl(result.assets[0].uri);
      setActiveTab("settings"); // Arahkan ke settings untuk save
    }
  };

  const saveProfile = useCallback(async () => {
    if (!profile) return;
    if (!fullName.trim()) return Alert.alert("Validasi", "Nama wajib diisi.");

    setSaving(true);
    try {
      await querySql(
        `UPDATE users SET fullName = ?, bio = ?, avatarUrl = ? WHERE id = ?`,
        [fullName.trim(), bio.trim(), avatarUrl.trim(), profile.id],
      );
      Alert.alert("Sukses", "Profil berhasil disimpan.");
      await loadProfileAndRecipes();
    } catch {
      Alert.alert("Error", "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }, [profile, fullName, bio, avatarUrl, loadProfileAndRecipes]);

  const handleDeleteAccount = () =>
    Alert.alert("Info", "Fitur hapus akun segera hadir.");

  // --- COMPONENTS ---

  const SettingsSection = ({ title, children }: any) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const SettingRow = ({
    icon: Icon,
    label,
    onPress,
    isDestructive,
    value,
  }: any) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View
          style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}
        >
          <Icon
            size={18}
            color={isDestructive ? COLORS.danger : COLORS.textMain}
          />
        </View>
        <Text
          style={[
            styles.settingLabel,
            isDestructive && { color: COLORS.danger },
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <ChevronRight size={18} color={COLORS.textSec} />
      </View>
    </TouchableOpacity>
  );

  // --- RENDER TABS ---

  const renderFeed = () => (
    <View style={styles.feedContainer}>
      {myRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <ChefHat size={32} color={COLORS.textSec} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Resep</Text>
          <Text style={styles.emptySub}>Bagikan resep pertamamu sekarang!</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/create")}
          >
            <Text style={styles.createBtnText}>Buat Resep</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {myRecipes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => router.push(`/recipe/${item.id}`)}
            >
              <Image
                source={{
                  uri:
                    item.image ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                }}
                style={styles.gridImage}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsWrapper}>
      {/* SECTION 1: EDIT PROFILE */}
      <SettingsSection title="Informasi Profil">
        <View style={styles.formRow}>
          <Text style={styles.inputLabel}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Contoh: Chef Juna"
            placeholderTextColor={COLORS.textSec}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.formRow}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Ceritakan tentang dirimu..."
            placeholderTextColor={COLORS.textSec}
            multiline
            maxLength={MAX_BIO_LENGTH}
          />
          <Text style={styles.charCount}>
            {bio.length}/{MAX_BIO_LENGTH}
          </Text>
        </View>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Save size={18} color="#FFF" />
            )}
            <Text style={styles.saveBtnText}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Text>
          </TouchableOpacity>
        </View>
      </SettingsSection>

      {/* SECTION 2: ACCOUNT */}
      <SettingsSection title="Akun & Keamanan">
        <SettingRow
          icon={LogOut}
          label="Keluar"
          onPress={confirmLogout}
          isDestructive
        />
        <View style={styles.divider} />
        <SettingRow
          icon={Trash2}
          label="Hapus Akun"
          onPress={handleDeleteAccount}
          isDestructive
        />
      </SettingsSection>

      {/* SECTION 3: INFO */}
      <SettingsSection title="Tentang">
        <SettingRow
          icon={Info}
          label="Versi Aplikasi"
          value={APP_VERSION}
          onPress={() => {}}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={ShieldAlert}
          label="Kebijakan Privasi"
          onPress={() => Alert.alert("Info", "Buka browser...")}
        />
      </SettingsSection>

      <View style={{ height: 40 }} />
    </View>
  );

  // --- MAIN RENDER ---
  return (
    <View style={styles.container}>
      <View style={[styles.navbar, { paddingTop: insets.top }]}>
        <Text style={styles.navbarTitle}>
          {activeTab === "feed" ? email : "Pengaturan"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE HEADER (Always Visible) */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(fullName || "U").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Camera size={12} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{myRecipes.length}</Text>
                <Text style={styles.statLabel}>Resep</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>0</Text>
                <Text style={styles.statLabel}>Pengikut</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNum}>0</Text>
                <Text style={styles.statLabel}>Mengikuti</Text>
              </View>
            </View>
          </View>

          <View style={styles.bioBlock}>
            <Text style={styles.fullName}>{fullName || "Tanpa Nama"}</Text>
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          </View>

          {/* TABS BUTTONS */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "feed" && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab("feed")}
            >
              <Grid3X3
                size={20}
                color={activeTab === "feed" ? COLORS.textMain : COLORS.textSec}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "settings" && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab("settings")}
            >
              <Settings
                size={20}
                color={
                  activeTab === "settings" ? COLORS.textMain : COLORS.textSec
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT SWITCHER */}
        <View style={styles.contentArea}>
          {activeTab === "feed" ? renderFeed() : renderSettings()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // NAVBAR
  navbar: {
    backgroundColor: COLORS.surface,
    paddingBottom: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  navbarTitle: {
    fontSize: 16,
    fontFamily: theme.font.bold,
    color: COLORS.textMain,
    marginTop: 10,
  },

  scrollContent: { paddingBottom: 50 },

  // HEADER PROFILE
  header: { backgroundColor: COLORS.surface, paddingBottom: 0 },
  headerTop: { flexDirection: "row", alignItems: "center", padding: 20 },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: { fontSize: 24, fontWeight: "bold", color: COLORS.textSec },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },

  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 20,
  },
  stat: { alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "bold", color: COLORS.textMain },
  statLabel: { fontSize: 12, color: COLORS.textSec },

  bioBlock: { paddingHorizontal: 20, marginBottom: 16 },
  fullName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: 4,
  },
  bio: { fontSize: 14, color: COLORS.textMain, lineHeight: 20 },

  // TAB BAR
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.textMain },

  // FEED STYLES
  feedContainer: { minHeight: 300, backgroundColor: COLORS.bg },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  gridItem: {
    width: (Dimensions.get("window").width - 4) / 3,
    height: (Dimensions.get("window").width - 4) / 3,
    backgroundColor: "#E2E8F0",
  },
  gridImage: { width: "100%", height: "100%" },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.textMain },
  emptySub: { fontSize: 14, color: COLORS.textSec, marginBottom: 16 },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createBtnText: { color: "#FFF", fontWeight: "bold" },

  // SETTINGS STYLES (NEW)
  settingsWrapper: { padding: 20 },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textSec,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  // FORM ROWS
  formRow: { padding: 16 },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSec,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: { fontSize: 14, color: COLORS.textMain, padding: 0, height: 24 }, // height fixed to prevent jump
  textArea: { height: "auto", minHeight: 24, textAlignVertical: "top" },
  charCount: {
    textAlign: "right",
    fontSize: 10,
    color: COLORS.textSec,
    marginTop: 4,
  },

  saveBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },

  // SETTING ROW (MENU)
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxDestructive: { backgroundColor: "#FEF2F2" },
  settingLabel: { fontSize: 14, fontWeight: "500", color: COLORS.textMain },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingValue: { fontSize: 13, color: COLORS.textSec },

  divider: { height: 1, backgroundColor: COLORS.border },
  contentArea: { flex: 1 },
});

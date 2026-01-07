import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { Camera, ChevronRight, LogOut, Save, Trash2 } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLogoutConfirmation } from "../../src/hooks/useLogoutConfirmation";
import { useAuth } from "../../src/providers/AuthProvider";
import { querySql } from "../../src/services/db";
import { theme } from "../../src/theme";

type UserProfileRow = {
  id: number;
  email: string;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

const MAX_BIO_LENGTH = 100;
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function Profile() {
  const { session } = useAuth();
  const { confirmLogout } = useLogoutConfirmation();
  const insets = useSafeAreaInsets();
  const email = session?.email ?? "";

  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!email) return;
    try {
      const rows = await querySql<UserProfileRow>(
        `SELECT id, email, fullName, bio, avatarUrl FROM users WHERE email = ? LIMIT 1`,
        [email]
      );

      if (rows.length === 0) {
        await querySql(
          `INSERT INTO users (email, fullName, bio, avatarUrl) VALUES (?, ?, ?, ?)`,
          [email, "", "", ""]
        );
        const again = await querySql<UserProfileRow>(
          `SELECT * FROM users WHERE email = ? LIMIT 1`,
          [email]
        );
        if (again[0]) {
          setProfile(again[0]);
          setFullName(again[0].fullName ?? "");
          setBio(again[0].bio ?? "");
          setAvatarUrl(again[0].avatarUrl ?? "");
        }
      } else {
        setProfile(rows[0]);
        setFullName(rows[0].fullName ?? "");
        setBio(rows[0].bio ?? "");
        setAvatarUrl(rows[0].avatarUrl ?? "");
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const saveProfile = useCallback(async () => {
    if (!profile) return;
    const name = fullName.trim();

    if (!name) {
      Alert.alert("Diperlukan", "Nama lengkap wajib diisi.");
      return;
    }

    setSaving(true);
    try {
      await querySql(
        `UPDATE users SET fullName = ?, bio = ?, avatarUrl = ? WHERE id = ?`,
        [name, bio.trim(), avatarUrl.trim(), profile.id]
      );
      Alert.alert("Berhasil", "Profil berhasil disimpan.");
      await loadProfile();
    } catch {
      Alert.alert("Error", "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }, [profile, fullName, bio, avatarUrl, loadProfile]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Hapus Akun",
      "Apakah Anda yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => Alert.alert("Info", "Fitur hapus akun akan segera hadir."),
        },
      ]
    );
  }, []);

  const handleChangePhoto = useCallback(() => {
    Alert.alert("Info", "Fitur ubah foto akan segera hadir.");
  }, []);

  const handleBioChange = useCallback((text: string) => {
    if (text.length <= MAX_BIO_LENGTH) {
      setBio(text);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Text style={styles.headerTitle}>Edit Profil & Akun</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {(fullName || "RB").slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraBtn} onPress={handleChangePhoto}>
              <Camera size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.photoHint}>Ketuk untuk ubah foto</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={theme.colors.neutral.medium}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio Singkat</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={handleBioChange}
              placeholder="Ceritakan sedikit tentang anda..."
              placeholderTextColor={theme.colors.neutral.medium}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>Maksimal {MAX_BIO_LENGTH} karakter</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={saveProfile}
            disabled={saving}
          >
            <Save size={20} color={theme.colors.neutral.dark} />
            <Text style={styles.saveBtnText}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.logoutCard} onPress={confirmLogout}>
            <View style={styles.logoutLeft}>
              <View style={styles.logoutIconWrapper}>
                <LogOut size={20} color={theme.colors.danger.DEFAULT} />
              </View>
              <View>
                <Text style={styles.logoutTitle}>Keluar</Text>
                <Text style={styles.logoutDesc}>Keluar dari akun Anda saat ini</Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.neutral.light} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Trash2 size={16} color={theme.colors.danger.DEFAULT} />
            <Text style={styles.deleteBtnText}>Hapus Akun Saya</Text>
          </TouchableOpacity>
        </View>

        {/* Version Footer */}
        <Text style={styles.versionText}>Versi Aplikasi {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.bg, // Theme
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.light, // Theme
    backgroundColor: theme.colors.neutral.bg, // Theme
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: "#FFFFFF", // Tetap putih agar kontras dengan foto
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: theme.colors.neutral.light, // Theme
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarInitials: {
    fontSize: 36,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.medium,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoHint: {
    fontSize: 12,
    fontFamily: theme.font.medium,
    color: theme.colors.neutral.medium,
  },
  formSection: {
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontFamily: theme.font.semibold,
    color: theme.colors.neutral.medium,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.neutral.light, // Theme
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: theme.font.regular,
    color: theme.colors.neutral.dark,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: theme.colors.neutral.medium,
    marginTop: 4,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary.DEFAULT,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    shadowColor: theme.colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: theme.font.bold,
    color: "#FFFFFF", // Text tombol primary biasanya putih
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral.light, // Theme
    marginVertical: theme.spacing.xl,
  },
  actionsSection: {
    gap: theme.spacing.sm,
  },
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  logoutIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.danger.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutTitle: {
    fontSize: 14,
    fontFamily: theme.font.bold,
    color: theme.colors.neutral.dark,
  },
  logoutDesc: {
    fontSize: 12,
    fontFamily: theme.font.regular,
    color: theme.colors.neutral.medium,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: theme.font.semibold,
    color: theme.colors.danger.DEFAULT,
  },
  versionText: {
    textAlign: "center",
    fontSize: 10,
    fontFamily: theme.font.regular,
    color: theme.colors.neutral.light,
    marginTop: 32,
  },
});
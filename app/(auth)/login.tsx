import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import AppModal from "../../src/components/ui/AppModal";
import { useAuth } from "../../src/providers/AuthProvider";
import { AuthError } from "../../src/services/auth";
import { theme } from "../../src/theme";

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Ups!");
  const [modalMessage, setModalMessage] = useState("");

  const heroUri = useMemo(
    () =>
      "https://images.unsplash.com/photo-1540914124281-342587941389?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    []
  );

  function openModal(title: string, message: string) {
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  }

  async function onLogin() {
    const e = email.trim().toLowerCase();
    const p = password;

    if (!e || !p) {
      openModal("Ups!", "Email dan kata sandi wajib diisi.");
      return;
    }
    if (!isEmailValid(e)) {
      openModal("Ups!", "Format emailnya belum tepat. Coba periksa lagi ya.");
      return;
    }
    if (p.length < 6) {
      openModal("Ups!", "Kata sandi minimal 6 karakter.");
      return;
    }

    try {
      await signIn(e, p);
    } catch (err: any) {
      if (err instanceof AuthError) {
        if (err.code === "INVALID_PASSWORD") {
          openModal("Ups!", "Kata sandinya salah. Coba lagi pelan-pelan ya.");
          return;
        }
        if (err.code === "EMAIL_NOT_FOUND") {
          openModal(
            "Ups!",
            "Kamu belum daftar nih. Daftar dulu yuk, biar bisa simpan resep favorit."
          );
          return;
        }
      }
      openModal("Ups!", "Terjadi kendala saat masuk. Coba ulangi sebentar lagi.");
    }
  }

  function onForgot() {
    const subject = encodeURIComponent("Lupa Kata Sandi - Resep Bunda");
    const body = encodeURIComponent(
      `Halo Admin,\n\nSaya lupa kata sandi.\nEmail: ${email.trim() || "(isi email)"}\n\nTerima kasih.`
    );
    Linking.openURL(`mailto:support@resepbunda.app?subject=${subject}&body=${body}`);
  }

  return (
    <ImageBackground source={{ uri: heroUri }} style={{ flex: 1 }} resizeMode="cover">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: 48,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(248,250,252,0.92)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.neutral.dark} />
        </Pressable>

        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.xl,
              paddingBottom: 18,
              borderTopWidth: 1,
              borderColor: theme.colors.neutral.light,

              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: -10 },
              elevation: 14,
            }}
          >
            <Text
              style={{
                fontSize: 26,
                color: theme.colors.neutral.dark,
                fontFamily: theme.font.bold,
                textAlign: "center",
              }}
            >
              Mulai Masak Enak!
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: theme.colors.neutral.medium,
                textAlign: "center",
                fontFamily: theme.font.regular,
              }}
            >
              Temukan inspirasi masakan harian dan simpan resep favoritmu.
            </Text>

            <View style={{ marginTop: 18, gap: 14 }}>
              {/* Email */}
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.neutral.dark,
                    marginBottom: 8,
                    fontFamily: theme.font.medium,
                  }}
                >
                  Alamat Email
                </Text>

                <View
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.neutral.light,
                    borderRadius: theme.radius.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Ionicons name="mail-outline" size={18} color={theme.colors.neutral.medium} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nama@email.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: theme.font.regular,
                      color: theme.colors.neutral.dark,
                    }}
                    placeholderTextColor={theme.colors.neutral.medium}
                  />
                </View>
              </View>

              {/* Password */}
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.neutral.dark,
                    marginBottom: 8,
                    fontFamily: theme.font.medium,
                  }}
                >
                  Kata Sandi
                </Text>

                <View
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.neutral.light,
                    borderRadius: theme.radius.lg,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={theme.colors.neutral.medium}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Masukkan kata sandi"
                    secureTextEntry={!showPass}
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontFamily: theme.font.regular,
                      color: theme.colors.neutral.dark,
                    }}
                    placeholderTextColor={theme.colors.neutral.medium}
                  />
                  <Pressable onPress={() => setShowPass((v) => !v)} style={{ padding: 2 }}>
                    <Ionicons
                      name={showPass ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={theme.colors.neutral.medium}
                    />
                  </Pressable>
                </View>

                <Pressable onPress={onForgot} style={{ alignSelf: "flex-end", marginTop: 10 }}>
                  <Text
                    style={{
                      color: theme.colors.primary.DEFAULT,
                      fontSize: 12,
                      fontFamily: theme.font.medium,
                    }}
                  >
                    Lupa Kata Sandi?
                  </Text>
                </Pressable>
              </View>

              {/* Button Login */}
              <Pressable
                onPress={onLogin}
                style={{
                  marginTop: 6,
                  backgroundColor: theme.colors.primary.DEFAULT,
                  paddingVertical: 14,
                  borderRadius: theme.radius.pill,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 15, fontFamily: theme.font.semibold }}>
                  Masuk →
                </Text>
              </Pressable>

              {/* Button Register */}
              <Pressable
                onPress={() => router.push("/(auth)/register")}
                style={{
                  backgroundColor: theme.colors.primary.bg,
                  paddingVertical: 14,
                  borderRadius: theme.radius.pill,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: theme.colors.primary.light,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.primary.dark,
                    fontSize: 15,
                    fontFamily: theme.font.semibold,
                  }}
                >
                  Daftar Akun Baru
                </Text>
              </Pressable>

              {/* Branding ITTS (paling bawah) */}
              <View
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.neutral.light,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.neutral.medium,
                    fontFamily: theme.font.regular,
                    marginBottom: 8,
                  }}
                >
                  In association with ITTS
                </Text>

                <Image
                  source={require("../../assets/Logo_ITTS/logo-itts-biru.png")}
                  style={{ width: 96, height: 38 }}
                  resizeMode="contain"
                  accessibilityLabel="Logo ITTS"
                />
              </View>
            </View>
          </View>
        </View>

        <AppModal
          visible={modalOpen}
          title={modalTitle}
          message={modalMessage}
          onClose={() => setModalOpen(false)}
        />
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

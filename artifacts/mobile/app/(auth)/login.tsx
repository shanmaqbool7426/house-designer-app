import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, Animated,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";

const BG = "#F8F6F2";
const CARD = "#FFFFFF";
const BORDER = "#EDEAE4";
const TEXT = "#1A1A18";
const MUTED = "#6E6B67";
const PLACEHOLDER = "#BBBAB6";
const ACCENT = "#FF4C1E";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScale]);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in your email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Login Failed", e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <LinearGradient colors={["#FF4C1E", "#FF7A45"]} style={styles.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Feather name="home" size={30} color="#fff" />
            </LinearGradient>
            <Text style={styles.brand}>DesignAI</Text>
            <Text style={styles.tagline}>Transform your space with AI</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.card}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue designing</Text>

              <View style={styles.inputGroup}>
                <View style={[styles.inputWrap, focused === "email" && styles.inputWrapFocused]}>
                  <Feather name="mail" size={16} color={focused === "email" ? ACCENT : PLACEHOLDER} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor={PLACEHOLDER}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                  />
                </View>
                <View style={[styles.inputWrap, focused === "pw" && styles.inputWrapFocused]}>
                  <Feather name="lock" size={16} color={focused === "pw" ? ACCENT : PLACEHOLDER} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    placeholder="Password"
                    placeholderTextColor={PLACEHOLDER}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocused("pw")}
                    onBlur={() => setFocused(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={PLACEHOLDER} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.btnWrap} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={loading ? ["#CCC", "#CCC"] : ["#FF4C1E", "#FF6B35"]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.btnText}>Sign In</Text>
                      <Feather name="arrow-right" size={17} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to DesignAI?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.secondaryBtn} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Create Free Account</Text>
            </TouchableOpacity>

            <View style={styles.pillsRow}>
              {[
                { icon: "zap" as const, text: "10 free credits" },
                { icon: "heart" as const, text: "Save designs" },
                { icon: "cpu" as const, text: "Claude AI" },
              ].map(({ icon, text }) => (
                <View key={text} style={styles.pill}>
                  <Feather name={icon} size={11} color={ACCENT} />
                  <Text style={styles.pillText}>{text}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  logoSection: { alignItems: "center", marginBottom: 40 },
  logoGradient: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#FF4C1E", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  brand: { fontSize: 28, fontWeight: "700", color: TEXT, letterSpacing: -0.5, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tagline: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular" },
  card: {
    backgroundColor: CARD, borderRadius: 20, padding: 24, marginBottom: 20,
    shadowColor: "#00000018", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  title: { fontSize: 22, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular", marginBottom: 24 },
  inputGroup: { gap: 12, marginBottom: 20 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8F6F2", borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 14, height: 52,
  },
  inputWrapFocused: { borderColor: ACCENT, backgroundColor: "#FFF5F2" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: TEXT, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { position: "absolute", right: 14 },
  btnWrap: { borderRadius: 14, overflow: "hidden" },
  btn: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { color: MUTED, fontSize: 13, fontFamily: "Inter_400Regular" },
  secondaryBtn: {
    height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
    backgroundColor: CARD, marginBottom: 28,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  secondaryBtnText: { color: TEXT, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  pillsRow: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: CARD, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: BORDER,
  },
  pillText: { color: MUTED, fontSize: 11, fontFamily: "Inter_400Regular" },
});

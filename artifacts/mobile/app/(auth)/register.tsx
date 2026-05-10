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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Registration Failed", e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <View style={styles.backCircle}>
              <Feather name="arrow-left" size={18} color={TEXT} />
            </View>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start designing your dream space today</Text>

            <View style={styles.perksRow}>
              {[
                { icon: "zap" as const, label: "10 free\ncredits", color: "#FF8C00" },
                { icon: "layers" as const, label: "8 AI\ndesign tools", color: "#2980B9" },
                { icon: "heart" as const, label: "Save &\norganize", color: "#C0392B" },
              ].map(({ icon, label, color }) => (
                <View key={label} style={styles.perkCard}>
                  <View style={[styles.perkIcon, { backgroundColor: color + "18" }]}>
                    <Feather name={icon} size={16} color={color} />
                  </View>
                  <Text style={styles.perkLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                {[
                  { key: "name", icon: "user" as const, placeholder: "Full name", value: name, setter: setName, caps: "words" as const },
                  { key: "email", icon: "mail" as const, placeholder: "Email address", value: email, setter: setEmail, caps: "none" as const },
                ].map(({ key, icon, placeholder, value, setter, caps }) => (
                  <View key={key} style={[styles.inputWrap, focused === key && styles.inputWrapFocused]}>
                    <Feather name={icon} size={16} color={focused === key ? ACCENT : PLACEHOLDER} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={placeholder}
                      placeholderTextColor={PLACEHOLDER}
                      value={value}
                      onChangeText={setter}
                      autoCapitalize={caps}
                      autoCorrect={false}
                      keyboardType={key === "email" ? "email-address" : "default"}
                      onFocus={() => setFocused(key)}
                      onBlur={() => setFocused(null)}
                    />
                  </View>
                ))}
                <View style={[styles.inputWrap, focused === "pw" && styles.inputWrapFocused]}>
                  <Feather name="lock" size={16} color={focused === "pw" ? ACCENT : PLACEHOLDER} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    placeholder="Password (min 8 chars)"
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

              <TouchableOpacity style={styles.btnWrap} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={loading ? ["#CCC", "#CCC"] : ["#FF4C1E", "#FF6B35"]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.btnText}>Get Started Free</Text>
                      <Feather name="arrow-right" size={17} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>By continuing you agree to our Terms of Service</Text>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkBtn}>
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkAccent}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 24 },
  backCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  title: { fontSize: 28, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular", marginBottom: 24 },
  perksRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  perkCard: {
    flex: 1, backgroundColor: CARD, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  perkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  perkLabel: { color: MUTED, fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 16 },
  card: {
    backgroundColor: CARD, borderRadius: 20, padding: 20, marginBottom: 20,
    shadowColor: "#00000015", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: BORDER,
  },
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
  terms: { color: PLACEHOLDER, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 16 },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular" },
  linkAccent: { color: ACCENT, fontFamily: "Inter_600SemiBold" },
});

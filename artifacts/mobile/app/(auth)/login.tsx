import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
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
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <LinearGradient
              colors={["#FF4C1E", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Feather name="home" size={34} color="#fff" />
            </LinearGradient>
            <Text style={styles.brand}>DesignAI</Text>
            <Text style={styles.tagline}>Transform your space with AI</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue designing</Text>

            <View style={styles.inputGroup}>
              <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                <Feather name="mail" size={18} color={emailFocused ? "#FF4C1E" : "#888884"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#555552"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
                <Feather name="lock" size={18} color={passwordFocused ? "#FF4C1E" : "#888884"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  placeholder="Password"
                  placeholderTextColor="#555552"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#555552" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.buttonWrap}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading ? ["#666", "#666"] : ["#FF4C1E", "#FF6B35"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New here?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <View style={styles.featureRow}>
              {[
                { icon: "zap" as const, text: "10 free credits" },
                { icon: "heart" as const, text: "Save designs" },
                { icon: "cpu" as const, text: "AI-powered" },
              ].map(({ icon, text }) => (
                <View key={text} style={styles.featurePill}>
                  <Feather name={icon} size={11} color="#FF8C00" />
                  <Text style={styles.featurePillText}>{text}</Text>
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
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  bgDecor1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#FF4C1E",
    opacity: 0.06,
    top: -80,
    right: -80,
  },
  bgDecor2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FF8C00",
    opacity: 0.05,
    bottom: 120,
    left: -60,
  },
  container: { flexGrow: 1, paddingHorizontal: 28 },
  logoSection: { alignItems: "center", marginBottom: 52 },
  logoGradient: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#FF4C1E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  brand: {
    fontSize: 30,
    fontWeight: "700",
    color: "#F5F5F0",
    letterSpacing: -1,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  tagline: { fontSize: 14, color: "#555552", fontFamily: "Inter_400Regular" },
  title: { fontSize: 26, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#888884", fontFamily: "Inter_400Regular", marginBottom: 32 },
  inputGroup: { gap: 14, marginBottom: 24 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#242424",
    paddingHorizontal: 16,
    height: 56,
  },
  inputFocused: { borderColor: "#FF4C1E", backgroundColor: "#1A1A1A" },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: "#F5F5F0", fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeButton: { position: "absolute", right: 16 },
  buttonWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  button: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#242424" },
  dividerText: { color: "#555552", fontSize: 13, fontFamily: "Inter_400Regular" },
  secondaryButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    backgroundColor: "#161616",
  },
  secondaryButtonText: { color: "#F5F5F0", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  featureRow: { flexDirection: "row", justifyContent: "center", gap: 10, flexWrap: "wrap" },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  featurePillText: { color: "#888884", fontSize: 11, fontFamily: "Inter_400Regular" },
});

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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";

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
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
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

  function inputStyle(field: string) {
    return [styles.inputContainer, focused === field && styles.inputFocused];
  }

  return (
    <View style={styles.root}>
      <View style={styles.bgDecor} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <View style={styles.backCircle}>
              <Feather name="arrow-left" size={20} color="#F5F5F0" />
            </View>
          </TouchableOpacity>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start designing your dream space today</Text>

            <View style={styles.perksStrip}>
              {[
                { icon: "zap" as const, label: "10 AI credits" },
                { icon: "layers" as const, label: "8 tools" },
                { icon: "heart" as const, label: "Save & organize" },
              ].map(({ icon, label }) => (
                <View key={label} style={styles.perkItem}>
                  <LinearGradient colors={["#FF4C1E22", "#FF8C0022"]} style={styles.perkIconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Feather name={icon} size={14} color="#FF8C00" />
                  </LinearGradient>
                  <Text style={styles.perkLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <View style={inputStyle("name")}>
                <Feather name="user" size={18} color={focused === "name" ? "#FF4C1E" : "#888884"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#555552"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <View style={inputStyle("email")}>
                <Feather name="mail" size={18} color={focused === "email" ? "#FF4C1E" : "#888884"} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#555552"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <View style={inputStyle("password")}>
                <Feather name="lock" size={18} color={focused === "password" ? "#FF4C1E" : "#888884"} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  placeholder="Password (min 8 chars)"
                  placeholderTextColor="#555552"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#555552" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.buttonWrap} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
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
                    <Text style={styles.buttonText}>Get Started Free</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text>
            </Text>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  bgDecor: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FF4C1E",
    opacity: 0.05,
    top: -60,
    left: -80,
  },
  container: { flexGrow: 1, paddingHorizontal: 28 },
  backButton: { marginBottom: 28 },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#888884", fontFamily: "Inter_400Regular", marginBottom: 28 },
  perksStrip: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  perkItem: { flex: 1, alignItems: "center", gap: 8 },
  perkIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  perkLabel: { color: "#888884", fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center" },
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
  buttonWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  button: { height: 56, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  terms: { color: "#555552", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  termsLink: { color: "#888884", textDecorationLine: "underline" },
  linkButton: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#888884", fontSize: 14, fontFamily: "Inter_400Regular" },
  linkHighlight: { color: "#FF4C1E", fontFamily: "Inter_600SemiBold" },
});

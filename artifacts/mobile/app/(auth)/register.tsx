import React, { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
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
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#F5F5F0" />
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start designing your dream space</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Feather name="user" size={18} color="#888884" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#888884"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="mail" size={18} color="#888884" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#888884"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Feather name="lock" size={18} color="#888884" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithButton]}
                placeholder="Password (min 8 chars)"
                placeholderTextColor="#888884"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#888884" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.perksCard}>
            <Text style={styles.perksTitle}>Free plan includes:</Text>
            {["10 AI credits to get started", "Save unlimited designs", "Create projects", "Access all 8 design tools"].map((p) => (
              <View key={p} style={styles.perkRow}>
                <Feather name="check" size={14} color="#27AE60" />
                <Text style={styles.perkText}>{p}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}>
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={styles.linkHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backButton: { marginBottom: 24, width: 40, height: 40, justifyContent: "center" },
  form: { flex: 1 },
  title: { fontSize: 28, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#888884", fontFamily: "Inter_400Regular", marginBottom: 32 },
  inputGroup: { gap: 12, marginBottom: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: "#F5F5F0", fontSize: 15, fontFamily: "Inter_400Regular" },
  inputWithButton: { paddingRight: 40 },
  eyeButton: { position: "absolute", right: 16 },
  perksCard: {
    backgroundColor: "#161616",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  perksTitle: { color: "#F5F5F0", fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  perkText: { color: "#888884", fontSize: 13, fontFamily: "Inter_400Regular" },
  button: {
    backgroundColor: "#FF4C1E",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  linkButton: { alignItems: "center", paddingVertical: 8 },
  linkText: { color: "#888884", fontSize: 14, fontFamily: "Inter_400Regular" },
  linkHighlight: { color: "#FF4C1E", fontFamily: "Inter_600SemiBold" },
});

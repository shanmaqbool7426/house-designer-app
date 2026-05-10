import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useGenerateDesign, useCreateDesign } from "@workspace/api-client-react";
import { FEATURES } from "@/constants/features";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";

export default function FeatureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, updateCredits } = useAuth();

  const feature = FEATURES.find((f) => f.id === id);

  const [selectedStyle, setSelectedStyle] = useState(feature?.styles[0] ?? "");
  const [selectedRoom, setSelectedRoom] = useState(feature?.rooms?.[0] ?? "");
  const [aiResponse, setAiResponse] = useState("");
  const [saved, setSaved] = useState(false);

  const generateMutation = useGenerateDesign();
  const createDesignMutation = useCreateDesign();

  useEffect(() => {
    if (feature) {
      navigation.setOptions({ title: feature.title });
    }
  }, [feature, navigation]);

  const handleGenerate = useCallback(async () => {
    if (!feature) return;
    if ((user?.aiCredits ?? 0) <= 0 && user?.plan !== "pro") {
      Alert.alert("No Credits", "You've used all your AI credits for today. They reset at midnight.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await generateMutation.mutateAsync({
        data: { featureType: feature.id, selectedStyle, selectedRoom, prompt: "" },
      });
      setAiResponse(result.response);
      setSaved(false);
      updateCredits(result.creditsRemaining);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to generate design advice");
    }
  }, [feature, user, selectedStyle, selectedRoom, generateMutation, updateCredits]);

  const handleSave = useCallback(async () => {
    if (!feature || !aiResponse) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await createDesignMutation.mutateAsync({
        data: {
          title: `${feature.title} — ${selectedStyle}`,
          featureType: feature.id as "home" | "floor" | "furniture" | "cleanup" | "garden" | "roomdesign" | "objects" | "exterior",
          selectedStyle,
          selectedRoom: selectedRoom || undefined,
          aiResponse,
          tags: [feature.id, selectedStyle.toLowerCase()],
        },
      });
      setSaved(true);
      Alert.alert("Saved!", "Design saved to your collection", [{ text: "View Saved", onPress: () => router.push("/(tabs)/saved") }, { text: "OK" }]);
    } catch {
      Alert.alert("Error", "Failed to save design");
    }
  }, [feature, aiResponse, selectedStyle, selectedRoom, createDesignMutation]);

  if (!feature) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Feature not found</Text>
      </View>
    );
  }

  const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
    home: "home", grid: "grid", package: "package", wind: "wind",
    feather: "feather", layers: "layers", "refresh-cw": "refresh-cw", sun: "sun",
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroCard, { backgroundColor: feature.color + "22" }]}>
        <View style={[styles.heroIcon, { backgroundColor: feature.color + "33" }]}>
          <Feather name={ICON_MAP[feature.icon] ?? "star"} size={28} color={feature.color} />
        </View>
        <Text style={styles.heroTitle}>{feature.title}</Text>
        <Text style={styles.heroDesc}>{feature.description}</Text>
      </View>

      <Text style={styles.sectionLabel}>
        {feature.id === "floor" ? "Floor Material" : feature.id === "objects" ? "Item to Replace" : "Style"}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesRow}>
        {(feature.floors ?? feature.styles).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.styleChip, selectedStyle === s && { backgroundColor: feature.color, borderColor: feature.color }]}
            onPress={() => setSelectedStyle(s)}
          >
            <Text style={[styles.styleChipText, selectedStyle === s && styles.styleChipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {feature.rooms && feature.rooms.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Room Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesRow}>
            {feature.rooms.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.styleChip, selectedRoom === r && { backgroundColor: feature.color, borderColor: feature.color }]}
                onPress={() => setSelectedRoom(r)}
              >
                <Text style={[styles.styleChipText, selectedRoom === r && styles.styleChipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.creditsBar}>
        <Feather name="zap" size={13} color="#FF8C00" />
        <Text style={styles.creditsText}>
          {user?.plan === "pro" ? "Unlimited credits (Pro)" : `${user?.aiCredits ?? 0} credits remaining`}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.generateButton, { backgroundColor: feature.color }, generateMutation.isPending && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={generateMutation.isPending}
        activeOpacity={0.85}
      >
        {generateMutation.isPending ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.generateButtonText}>Generating...</Text>
          </View>
        ) : (
          <View style={styles.loadingRow}>
            <Feather name="cpu" size={18} color="#fff" />
            <Text style={styles.generateButtonText}>Generate with AI</Text>
          </View>
        )}
      </TouchableOpacity>

      {aiResponse ? (
        <View style={styles.responseCard}>
          <View style={styles.responseHeader}>
            <View style={styles.responseLabel}>
              <Feather name="cpu" size={12} color="#FF8C00" />
              <Text style={styles.responseLabelText}>AI DESIGN ADVISOR</Text>
            </View>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saved || createDesignMutation.isPending}
              style={[styles.saveButton, saved && styles.saveButtonDone]}
            >
              {createDesignMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name={saved ? "check" : "bookmark"} size={14} color="#fff" />
                  <Text style={styles.saveButtonText}>{saved ? "Saved" : "Save"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.responseText}>{aiResponse}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  container: { padding: 16 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0D" },
  notFoundText: { color: "#888884", fontFamily: "Inter_400Regular" },
  heroCard: { borderRadius: 16, padding: 20, marginBottom: 24, alignItems: "center", gap: 8 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontSize: 20, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", textAlign: "center" },
  heroDesc: { fontSize: 13, color: "#888884", fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  stylesRow: { gap: 8, paddingRight: 16, marginBottom: 20 },
  styleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  styleChipText: { color: "#888884", fontSize: 13, fontFamily: "Inter_500Medium" },
  styleChipTextActive: { color: "#fff" },
  creditsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  creditsText: { color: "#888884", fontSize: 12, fontFamily: "Inter_400Regular" },
  generateButton: {
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.7 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  generateButtonText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  responseCard: {
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  responseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  responseLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  responseLabelText: { color: "#FF8C00", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FF4C1E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonDone: { backgroundColor: "#27AE60" },
  saveButtonText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  responseText: { color: "#F5F5F0", fontSize: 14, lineHeight: 24, fontFamily: "Inter_400Regular" },
  customPromptContainer: { marginTop: 20 },
  customPromptLabel: { fontSize: 14, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  customPromptInput: {
    backgroundColor: "#161616",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 14,
    color: "#F5F5F0",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: 100,
    textAlignVertical: "top",
  },
});

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useGenerateDesign, useCreateDesign } from "@workspace/api-client-react";
import { FEATURES } from "@/constants/features";
import * as Haptics from "expo-haptics";

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  home: "home", grid: "grid", package: "package", wind: "wind",
  feather: "feather", layers: "layers", "refresh-cw": "refresh-cw", sun: "sun",
};

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

  const responseAnim = useRef(new Animated.Value(0)).current;
  const responseSlide = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (feature) navigation.setOptions({ title: feature.title });
  }, [feature, navigation]);

  useEffect(() => {
    if (aiResponse) {
      Animated.parallel([
        Animated.timing(responseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(responseSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    } else {
      responseAnim.setValue(0);
      responseSlide.setValue(20);
    }
  }, [aiResponse, responseAnim, responseSlide]);

  useEffect(() => {
    if (generateMutation.isPending) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.85, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [generateMutation.isPending, pulseAnim]);

  const handleGenerate = useCallback(async () => {
    if (!feature) return;
    if ((user?.aiCredits ?? 0) <= 0 && user?.plan !== "pro") {
      Alert.alert("No Credits", "You've used all your AI credits for today. They reset at midnight.", [
        { text: "Got it", style: "cancel" },
      ]);
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
      Alert.alert("Generation Failed", e instanceof Error ? e.message : "Failed to generate design advice");
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
      Alert.alert("Saved!", "Your design has been saved to your collection.", [
        { text: "View Saved", onPress: () => router.push("/(tabs)/saved") },
        { text: "OK" },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save design");
    }
  }, [feature, aiResponse, selectedStyle, selectedRoom, createDesignMutation]);

  if (!feature) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={40} color="#2A2A2A" />
        <Text style={styles.notFoundText}>Feature not found</Text>
      </View>
    );
  }

  const iconName = (ICON_MAP[feature.icon] ?? "star") as keyof typeof Feather.glyphMap;
  const creditsLeft = user?.aiCredits ?? 0;
  const isPro = user?.plan === "pro";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[feature.color + "20", "#0D0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={[styles.heroIcon, { backgroundColor: feature.color + "30" }]}>
          <Feather name={iconName} size={32} color={feature.color} />
        </View>
        <Text style={styles.heroTitle}>{feature.title}</Text>
        <Text style={styles.heroDesc}>{feature.description}</Text>
        <View style={styles.heroBadges}>
          <View style={[styles.heroBadge, { backgroundColor: feature.color + "25" }]}>
            <Text style={[styles.heroBadgeText, { color: feature.color }]}>
              {feature.styles.length} styles
            </Text>
          </View>
          {feature.rooms && (
            <View style={[styles.heroBadge, { backgroundColor: feature.color + "25" }]}>
              <Text style={[styles.heroBadgeText, { color: feature.color }]}>
                {feature.rooms.length} room types
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <Text style={styles.sectionLabel}>
        {feature.id === "floor" ? "Floor Material" : feature.id === "objects" ? "Item to Replace" : "Design Style"}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {(feature.floors ?? feature.styles).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, selectedStyle === s && { backgroundColor: feature.color, borderColor: feature.color }]}
            onPress={() => setSelectedStyle(s)}
            activeOpacity={0.8}
          >
            {selectedStyle === s && <Feather name="check" size={11} color="#fff" />}
            <Text style={[styles.chipText, selectedStyle === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {feature.rooms && feature.rooms.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Room Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {feature.rooms.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, selectedRoom === r && { backgroundColor: feature.color, borderColor: feature.color }]}
                onPress={() => setSelectedRoom(r)}
                activeOpacity={0.8}
              >
                {selectedRoom === r && <Feather name="check" size={11} color="#fff" />}
                <Text style={[styles.chipText, selectedRoom === r && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <View style={styles.creditsBar}>
        <LinearGradient
          colors={isPro ? ["#FF8C0022", "#FF4C1E22"] : creditsLeft <= 2 ? ["#C0392B22", "#0D0D0D"] : ["#1A1A1A", "#1A1A1A"]}
          style={styles.creditsInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Feather name="zap" size={14} color={isPro ? "#FF8C00" : creditsLeft <= 2 ? "#C0392B" : "#888884"} />
          <Text style={[styles.creditsText, creditsLeft <= 2 && !isPro && { color: "#C0392B" }]}>
            {isPro ? "Unlimited credits (Pro)" : `${creditsLeft} AI credits remaining`}
          </Text>
          {isPro && <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>}
        </LinearGradient>
      </View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={styles.generateButtonWrap}
          onPress={handleGenerate}
          disabled={generateMutation.isPending}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={generateMutation.isPending ? ["#333", "#333"] : [feature.color, feature.color + "CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateButton}
          >
            {generateMutation.isPending ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.generateButtonText}>Generating with AI...</Text>
              </>
            ) : (
              <>
                <Feather name="cpu" size={18} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Design Advice</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {aiResponse ? (
        <Animated.View style={{ opacity: responseAnim, transform: [{ translateY: responseSlide }] }}>
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <LinearGradient colors={["#FF4C1E22", "#FF8C0022"]} style={styles.responseAiBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Feather name="cpu" size={11} color="#FF8C00" />
                <Text style={styles.responseAiBadgeText}>CLAUDE AI</Text>
              </LinearGradient>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saved || createDesignMutation.isPending}
                style={[styles.saveButton, saved && styles.saveButtonSaved]}
                activeOpacity={0.8}
              >
                {createDesignMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name={saved ? "check" : "bookmark"} size={13} color="#fff" />
                    <Text style={styles.saveButtonText}>{saved ? "Saved!" : "Save"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.responseDivider} />
            <Text style={styles.responseText}>{aiResponse}</Text>

            {!saved && (
              <TouchableOpacity
                onPress={handleGenerate}
                style={styles.regenerateButton}
                disabled={generateMutation.isPending}
                activeOpacity={0.7}
              >
                <Feather name="refresh-cw" size={13} color="#888884" />
                <Text style={styles.regenerateText}>Regenerate</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      ) : !generateMutation.isPending ? (
        <View style={styles.emptyPrompt}>
          <View style={[styles.emptyIcon, { backgroundColor: feature.color + "15" }]}>
            <Feather name={iconName} size={28} color={feature.color + "80"} />
          </View>
          <Text style={styles.emptyPromptTitle}>Ready to design?</Text>
          <Text style={styles.emptyPromptText}>
            Select your preferred style{feature.rooms ? " and room type" : ""}, then hit generate to get personalized AI advice.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  container: { paddingHorizontal: 20 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0D", gap: 12 },
  notFoundText: { color: "#888884", fontFamily: "Inter_400Regular", fontSize: 15 },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    marginTop: 8,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#242424",
  },
  heroIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", textAlign: "center" },
  heroDesc: { fontSize: 13, color: "#888884", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  heroBadges: { flexDirection: "row", gap: 8, marginTop: 4 },
  heroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#888884", fontFamily: "Inter_600SemiBold", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  chipsRow: { gap: 8, paddingRight: 20, marginBottom: 24 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: "#161616",
    borderWidth: 1.5,
    borderColor: "#2A2A2A",
  },
  chipText: { color: "#888884", fontSize: 13, fontFamily: "Inter_500Medium" },
  chipTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  creditsBar: { borderRadius: 12, overflow: "hidden", marginBottom: 16 },
  creditsInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  creditsText: { color: "#888884", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  proBadge: { backgroundColor: "#FF8C0033", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  proBadgeText: { color: "#FF8C00", fontSize: 10, fontFamily: "Inter_700Bold" },
  generateButtonWrap: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  generateButton: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  generateButtonText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  responseCard: {
    backgroundColor: "#111111",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#242424",
    marginBottom: 16,
  },
  responseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  responseAiBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  responseAiBadgeText: { color: "#FF8C00", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  responseDivider: { height: 1, backgroundColor: "#1E1E1E", marginBottom: 16 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FF4C1E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveButtonSaved: { backgroundColor: "#27AE60" },
  saveButtonText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  responseText: { color: "#D0CFC8", fontSize: 14, lineHeight: 26, fontFamily: "Inter_400Regular" },
  regenerateButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#1E1E1E" },
  regenerateText: { color: "#888884", fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyPrompt: { alignItems: "center", paddingVertical: 32, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyPromptTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  emptyPromptText: { fontSize: 13, color: "#888884", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 16 },
});

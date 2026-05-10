import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated, Image, Platform,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useGenerateDesign, useCreateDesign } from "@workspace/api-client-react";
import { FEATURES } from "@/constants/features";
import * as Haptics from "expo-haptics";

const BG = "#F8F6F2";
const CARD = "#FFFFFF";
const BORDER = "#EDEAE4";
const TEXT = "#1A1A18";
const MUTED = "#6E6B67";
const DIM = "#BBBAB6";
const ACCENT = "#FF4C1E";

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
  const responseSlide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (feature) navigation.setOptions({ title: feature.title });
  }, [feature, navigation]);

  useEffect(() => {
    if (aiResponse) {
      Animated.parallel([
        Animated.timing(responseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(responseSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();
    } else {
      responseAnim.setValue(0);
      responseSlide.setValue(16);
    }
  }, [aiResponse, responseAnim, responseSlide]);

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
      Alert.alert("Saved!", "Design saved to your collection.", [
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
        <Feather name="alert-circle" size={36} color={DIM} />
        <Text style={styles.notFoundText}>Feature not found</Text>
      </View>
    );
  }

  const iconName = (ICON_MAP[feature.icon] ?? "star") as keyof typeof Feather.glyphMap;
  const isPro = user?.plan === "pro";
  const creditsLeft = user?.aiCredits ?? 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <Image source={{ uri: feature.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          start={{ x: 0, y: 0.3 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroOverlay}>
          <View style={[styles.heroIconBg, { backgroundColor: feature.color }]}>
            <Feather name={iconName} size={18} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{feature.title}</Text>
          <Text style={styles.heroDesc}>{feature.description}</Text>
        </View>
        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>{feature.styles.length} styles</Text></View>
          {feature.rooms && <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>{feature.rooms.length} rooms</Text></View>}
        </View>
      </View>

      <View style={styles.section}>
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
      </View>

      {feature.rooms && feature.rooms.length > 0 && (
        <View style={styles.section}>
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
        </View>
      )}

      <View style={styles.creditsBar}>
        <Feather name="zap" size={13} color={isPro ? "#FF8C00" : creditsLeft <= 2 ? "#C0392B" : "#FF8C00"} />
        <Text style={[styles.creditsText, !isPro && creditsLeft <= 2 && { color: "#C0392B" }]}>
          {isPro ? "Unlimited credits (Pro)" : `${creditsLeft} AI credits remaining today`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.generateBtnWrap}
        onPress={handleGenerate}
        disabled={generateMutation.isPending}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={generateMutation.isPending ? ["#CCC", "#CCC"] : [feature.color, feature.color + "CC"]}
          style={styles.generateBtn}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          {generateMutation.isPending ? (
            <><ActivityIndicator color="#fff" /><Text style={styles.generateBtnText}>Generating...</Text></>
          ) : (
            <><Feather name="cpu" size={17} color="#fff" /><Text style={styles.generateBtnText}>Generate Design Advice</Text></>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {aiResponse ? (
        <Animated.View style={{ opacity: responseAnim, transform: [{ translateY: responseSlide }] }}>
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <View style={styles.responseLabel}>
                <Feather name="cpu" size={11} color="#FF8C00" />
                <Text style={styles.responseLabelText}>CLAUDE AI ADVISOR</Text>
              </View>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saved || createDesignMutation.isPending}
                style={[styles.saveBtn, saved && styles.saveBtnDone]}
              >
                {createDesignMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Feather name={saved ? "check" : "bookmark"} size={12} color="#fff" /><Text style={styles.saveBtnText}>{saved ? "Saved" : "Save"}</Text></>}
              </TouchableOpacity>
            </View>
            <View style={styles.responseDivider} />
            <Text style={styles.responseText}>{aiResponse}</Text>
            {!saved && (
              <TouchableOpacity onPress={handleGenerate} disabled={generateMutation.isPending} style={styles.regenRow}>
                <Feather name="refresh-cw" size={12} color={DIM} />
                <Text style={styles.regenText}>Regenerate</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      ) : !generateMutation.isPending ? (
        <View style={styles.emptyPrompt}>
          <View style={[styles.emptyIcon, { backgroundColor: feature.color + "12" }]}>
            <Feather name={iconName} size={26} color={feature.color + "80"} />
          </View>
          <Text style={styles.emptyTitle}>Ready to design?</Text>
          <Text style={styles.emptyDesc}>
            Select your preferred style{feature.rooms ? " and room" : ""}, then tap generate.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 20 },
  notFound: { flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { color: MUTED, fontFamily: "Inter_400Regular", fontSize: 15 },
  heroCard: {
    height: 200, borderRadius: 20, overflow: "hidden",
    marginTop: 8, marginBottom: 24,
    shadowColor: "#00000020", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 6,
  },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { position: "absolute", bottom: 40, left: 16, right: 16 },
  heroIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  heroDesc: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  heroBadges: { position: "absolute", top: 12, right: 12, flexDirection: "row", gap: 6 },
  heroBadge: { backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_500Medium" },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: MUTED, fontFamily: "Inter_600SemiBold", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  chipsRow: { gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22,
    backgroundColor: CARD, borderWidth: 1.5, borderColor: BORDER,
    shadowColor: "#00000008", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  chipText: { color: MUTED, fontSize: 13, fontFamily: "Inter_500Medium" },
  chipTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  creditsBar: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#FFF5EA", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "#FFE0B0", marginBottom: 14,
  },
  creditsText: { color: "#FF8C00", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  generateBtnWrap: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  generateBtn: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  generateBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  responseCard: {
    backgroundColor: CARD, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: BORDER, marginBottom: 16,
    shadowColor: "#00000012", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  responseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  responseLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  responseLabelText: { color: "#FF8C00", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  responseDivider: { height: 1, backgroundColor: "#F3F1ED", marginBottom: 14 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  saveBtnDone: { backgroundColor: "#27AE60" },
  saveBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  responseText: { color: TEXT, fontSize: 14, lineHeight: 26, fontFamily: "Inter_400Regular" },
  regenRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F1ED" },
  regenText: { color: DIM, fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyPrompt: { alignItems: "center", paddingVertical: 28, gap: 10 },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 16 },
});

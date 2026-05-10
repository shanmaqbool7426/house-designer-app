import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetDesign, useToggleFavorite } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";

const BG = "#F8F6F2";
const CARD = "#FFFFFF";
const BORDER = "#EDEAE4";
const TEXT = "#1A1A18";
const MUTED = "#6E6B67";
const DIM = "#BBBAB6";
const ACCENT = "#FF4C1E";

const FEATURE_META: Record<string, { color: string; icon: keyof typeof Feather.glyphMap; label: string }> = {
  home: { color: "#FF4C1E", icon: "home", label: "Home Design" },
  floor: { color: "#E67E22", icon: "grid", label: "Floor Decor" },
  furniture: { color: "#8E44AD", icon: "package", label: "Furniture" },
  cleanup: { color: "#27AE60", icon: "wind", label: "Cleanup" },
  garden: { color: "#16A085", icon: "feather", label: "Garden" },
  roomdesign: { color: "#2980B9", icon: "layers", label: "Room Design" },
  objects: { color: "#C0392B", icon: "refresh-cw", label: "Objects" },
  exterior: { color: "#D35400", icon: "sun", label: "Exterior" },
};

export default function DesignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: design, isLoading, refetch } = useGetDesign(id ?? "", { query: { enabled: !!id } });
  const toggleMutation = useToggleFavorite();

  useEffect(() => {
    if (design) navigation.setOptions({ title: design.title });
  }, [design, navigation]);

  async function handleToggleFavorite() {
    if (!design) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await toggleMutation.mutateAsync({ id: String(design.id) });
      void refetch();
    } catch { Alert.alert("Error", "Failed to update favorite"); }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={ACCENT} size="large" />
        <Text style={styles.loadingText}>Loading design...</Text>
      </View>
    );
  }

  if (!design) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={36} color={DIM} />
        <Text style={styles.loadingText}>Design not found</Text>
      </View>
    );
  }

  const meta = FEATURE_META[design.featureType] ?? { color: ACCENT, icon: "layers" as const, label: design.featureType };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: meta.color + "18" }]}>
            <Feather name={meta.icon} size={22} color={meta.color} />
          </View>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={[styles.favBtn, design.isFavorite && styles.favBtnActive]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="heart" size={17} color={design.isFavorite ? ACCENT : DIM} />
          </TouchableOpacity>
        </View>
        <Text style={styles.designTitle}>{design.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.featureChip, { backgroundColor: meta.color + "15" }]}>
            <Text style={[styles.featureChipText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {design.selectedStyle ? (
            <View style={styles.pill}><Text style={styles.pillText}>{design.selectedStyle}</Text></View>
          ) : null}
          {design.selectedRoom ? (
            <View style={styles.pill}><Text style={styles.pillText}>{design.selectedRoom}</Text></View>
          ) : null}
        </View>
        <View style={styles.dateLine}>
          <Feather name="calendar" size={11} color={DIM} />
          <Text style={styles.dateText}>
            {new Date(design.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </View>
      </View>

      {design.aiResponse ? (
        <View style={styles.responseCard}>
          <View style={styles.responseTop}>
            <View style={[styles.aiIcon, { backgroundColor: "#FFF5EA" }]}>
              <Feather name="cpu" size={13} color="#FF8C00" />
            </View>
            <Text style={styles.aiLabel}>CLAUDE AI · DESIGN ADVICE</Text>
          </View>
          <View style={styles.responseDivider} />
          <Text style={styles.responseText}>{design.aiResponse}</Text>
        </View>
      ) : (
        <View style={styles.emptyResponse}>
          <Feather name="file-text" size={22} color={DIM} />
          <Text style={styles.emptyText}>No AI response for this design</Text>
        </View>
      )}

      {design.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Tags</Text>
          <View style={styles.tagsRow}>
            {design.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: MUTED, fontFamily: "Inter_400Regular" },
  heroCard: {
    backgroundColor: CARD, borderRadius: 20, padding: 20,
    marginTop: 8, marginBottom: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#00000012", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  heroIcon: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  favBtn: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: "#F3F1ED",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: BORDER,
  },
  favBtnActive: { backgroundColor: "#FFF0ED", borderColor: "#FFCCBA" },
  designTitle: { fontSize: 20, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", marginBottom: 12, lineHeight: 26 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  featureChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featureChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "#F3F1ED", borderWidth: 1, borderColor: BORDER },
  pillText: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular" },
  dateLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  dateText: { fontSize: 12, color: DIM, fontFamily: "Inter_400Regular" },
  responseCard: {
    backgroundColor: CARD, borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: BORDER, marginBottom: 16,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  },
  responseTop: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#FFF9F5" },
  aiIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  aiLabel: { color: "#FF8C00", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  responseDivider: { height: 1, backgroundColor: BORDER },
  responseText: { color: TEXT, fontSize: 14, lineHeight: 26, fontFamily: "Inter_400Regular", padding: 18 },
  emptyResponse: { alignItems: "center", padding: 32, gap: 10 },
  emptyText: { color: MUTED, fontFamily: "Inter_400Regular" },
  tagsSection: { marginTop: 4 },
  tagsLabel: { fontSize: 11, color: DIM, fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    backgroundColor: CARD, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: BORDER,
  },
  tagText: { color: MUTED, fontSize: 12, fontFamily: "Inter_400Regular" },
});

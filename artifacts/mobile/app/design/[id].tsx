import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetDesign, useToggleFavorite } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";

const FEATURE_META: Record<string, { color: string; icon: keyof typeof Feather.glyphMap; label: string }> = {
  home: { color: "#FF4C1E", icon: "home", label: "Home Design" },
  floor: { color: "#E67E22", icon: "grid", label: "Floor Decoration" },
  furniture: { color: "#8E44AD", icon: "package", label: "Furniture" },
  cleanup: { color: "#27AE60", icon: "wind", label: "Room Cleanup" },
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
    } catch {
      Alert.alert("Error", "Failed to update favorite");
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF4C1E" size="large" />
        <Text style={styles.loadingText}>Loading design...</Text>
      </View>
    );
  }

  if (!design) {
    return (
      <View style={styles.loading}>
        <Feather name="alert-circle" size={40} color="#2A2A2A" />
        <Text style={styles.errorText}>Design not found</Text>
      </View>
    );
  }

  const meta = FEATURE_META[design.featureType] ?? { color: "#FF4C1E", icon: "layers" as const, label: design.featureType };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[meta.color + "22", "#0D0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroTop}>
          <LinearGradient
            colors={[meta.color + "40", meta.color + "20"]}
            style={styles.heroIcon}
          >
            <Feather name={meta.icon} size={26} color={meta.color} />
          </LinearGradient>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={[styles.favoriteBtn, design.isFavorite && styles.favoriteBtnActive]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="heart" size={18} color={design.isFavorite ? "#FF4C1E" : "#888884"} />
          </TouchableOpacity>
        </View>
        <Text style={styles.designTitle}>{design.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.featureChip, { backgroundColor: meta.color + "30" }]}>
            <Text style={[styles.featureChipText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {design.selectedStyle ? (
            <View style={styles.stylePill}>
              <Text style={styles.stylePillText}>{design.selectedStyle}</Text>
            </View>
          ) : null}
          {design.selectedRoom ? (
            <View style={styles.stylePill}>
              <Text style={styles.stylePillText}>{design.selectedRoom}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.dateLine}>
          <Feather name="calendar" size={11} color="#555552" />
          <Text style={styles.dateText}>
            {new Date(design.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </View>
      </LinearGradient>

      {design.aiResponse ? (
        <View style={styles.responseCard}>
          <LinearGradient colors={["#FF4C1E18", "#FF8C0012"]} style={styles.responseTopBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Feather name="cpu" size={12} color="#FF8C00" />
            <Text style={styles.responseLabelText}>CLAUDE AI · DESIGN ADVICE</Text>
          </LinearGradient>
          <View style={styles.responseBody}>
            <Text style={styles.responseText}>{design.aiResponse}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyResponse}>
          <Feather name="file-text" size={24} color="#2A2A2A" />
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
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  container: { paddingHorizontal: 20 },
  loading: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#888884", fontFamily: "Inter_400Regular" },
  errorText: { color: "#888884", fontFamily: "Inter_400Regular", fontSize: 15 },
  heroGradient: { borderRadius: 20, padding: 20, marginTop: 8, marginBottom: 20, borderWidth: 1, borderColor: "#242424" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  favoriteBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#242424" },
  favoriteBtnActive: { backgroundColor: "#FF4C1E20", borderColor: "#FF4C1E44" },
  designTitle: { fontSize: 22, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 12, lineHeight: 28 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 },
  featureChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  featureChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  stylePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: "#2A2A2A" },
  stylePillText: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular" },
  dateLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  dateText: { fontSize: 12, color: "#555552", fontFamily: "Inter_400Regular" },
  responseCard: { borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#242424", marginBottom: 16, backgroundColor: "#111111" },
  responseTopBar: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 10 },
  responseLabelText: { color: "#FF8C00", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  responseBody: { padding: 20 },
  responseText: { color: "#D0CFC8", fontSize: 14, lineHeight: 26, fontFamily: "Inter_400Regular" },
  emptyResponse: { alignItems: "center", padding: 32, gap: 10 },
  emptyText: { color: "#888884", fontFamily: "Inter_400Regular" },
  tagsSection: { marginTop: 4 },
  tagsLabel: { fontSize: 12, color: "#555552", fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { backgroundColor: "#161616", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#242424" },
  tagText: { color: "#888884", fontSize: 12, fontFamily: "Inter_400Regular" },
});

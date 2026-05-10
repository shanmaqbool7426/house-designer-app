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
import { useGetDesign, useToggleFavorite } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";

const FEATURE_COLORS: Record<string, string> = {
  home: "#FF4C1E", floor: "#E67E22", furniture: "#8E44AD",
  cleanup: "#27AE60", garden: "#16A085", roomdesign: "#2980B9",
  objects: "#C0392B", exterior: "#D35400",
};

export default function DesignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: design, isLoading, refetch } = useGetDesign(id ?? "", { query: { enabled: !!id } });
  const toggleMutation = useToggleFavorite();

  useEffect(() => {
    if (design) {
      navigation.setOptions({ title: design.title });
    }
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
        <ActivityIndicator color="#FF4C1E" />
      </View>
    );
  }

  if (!design) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Design not found</Text>
      </View>
    );
  }

  const color = FEATURE_COLORS[design.featureType] ?? "#FF4C1E";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroCard, { backgroundColor: color + "22" }]}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: color + "33" }]}>
            <Feather name="layers" size={24} color={color} />
          </View>
          <TouchableOpacity onPress={handleToggleFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="heart" size={22} color={design.isFavorite ? "#FF4C1E" : "#888884"} />
          </TouchableOpacity>
        </View>
        <Text style={styles.designTitle}>{design.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.featureChip, { backgroundColor: color + "33" }]}>
            <Text style={[styles.featureChipText, { color }]}>{design.featureType}</Text>
          </View>
          {design.selectedStyle ? (
            <Text style={styles.metaText}>{design.selectedStyle}</Text>
          ) : null}
          {design.selectedRoom ? (
            <Text style={styles.metaText}>{design.selectedRoom}</Text>
          ) : null}
        </View>
        <Text style={styles.dateText}>{new Date(design.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
      </View>

      {design.aiResponse ? (
        <View style={styles.responseCard}>
          <View style={styles.responseHeader}>
            <Feather name="cpu" size={12} color="#FF8C00" />
            <Text style={styles.responseLabelText}>AI DESIGN ADVISOR</Text>
          </View>
          <Text style={styles.responseText}>{design.aiResponse}</Text>
        </View>
      ) : (
        <View style={styles.emptyResponse}>
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
  container: { padding: 16 },
  loading: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" },
  errorText: { color: "#888884", fontFamily: "Inter_400Regular" },
  heroCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heroIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  designTitle: { fontSize: 20, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  featureChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  featureChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  metaText: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular" },
  dateText: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular" },
  responseCard: { backgroundColor: "#161616", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 16 },
  responseHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  responseLabelText: { color: "#FF8C00", fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  responseText: { color: "#F5F5F0", fontSize: 14, lineHeight: 24, fontFamily: "Inter_400Regular" },
  emptyResponse: { alignItems: "center", padding: 20 },
  emptyText: { color: "#888884", fontFamily: "Inter_400Regular" },
  tagsSection: { marginTop: 4 },
  tagsLabel: { fontSize: 13, color: "#888884", fontFamily: "Inter_500Medium", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { backgroundColor: "#1E1E1E", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "#2A2A2A" },
  tagText: { color: "#888884", fontSize: 12, fontFamily: "Inter_400Regular" },
});

import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetDesigns, useGetFavoriteDesigns, useDeleteDesign, useToggleFavorite } from "@workspace/api-client-react";
import type { Design } from "@workspace/api-client-react";

const BG = "#F8F6F2";
const CARD = "#FFFFFF";
const BORDER = "#EDEAE4";
const TEXT = "#1A1A18";
const MUTED = "#6E6B67";
const DIM = "#BBBAB6";
const ACCENT = "#FF4C1E";

const FILTER_TABS = ["All", "Favorites"] as const;
type FilterTab = typeof FILTER_TABS[number];

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

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterTab>("All");

  const { data: allDesigns, isLoading: allLoading, refetch: refetchAll } = useGetDesigns();
  const { data: favDesigns, isLoading: favLoading, refetch: refetchFav } = useGetFavoriteDesigns();
  const deleteMutation = useDeleteDesign();
  const toggleMutation = useToggleFavorite();

  const isLoading = filter === "All" ? allLoading : favLoading;
  const designs = (filter === "All" ? allDesigns?.designs : favDesigns) ?? [];
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleDelete(item: Design) {
    Alert.alert("Delete Design", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id: String(item.id) });
          void refetchAll(); void refetchFav();
        },
      },
    ]);
  }

  async function handleToggle(id: number) {
    await toggleMutation.mutateAsync({ id: String(id) });
    void refetchAll(); void refetchFav();
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Saved Designs</Text>
          <Text style={styles.subtitle}>{allDesigns?.total ?? 0} saved</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
            activeOpacity={0.8}
          >
            {filter === tab ? (
              <LinearGradient colors={["#FF4C1E", "#FF6B35"]} style={styles.filterGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.filterTextActive}>{tab}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.filterText}>{tab}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={designs as Design[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="heart" size={28} color={DIM} />
              </View>
              <Text style={styles.emptyTitle}>{filter === "Favorites" ? "No favorites yet" : "No designs yet"}</Text>
              <Text style={styles.emptyText}>
                {filter === "Favorites" ? "Heart designs to add them here" : "Use a design tool to create your first AI design"}
              </Text>
              {filter === "All" && (
                <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.emptyBtn}>
                  <LinearGradient colors={["#FF4C1E", "#FF6B35"]} style={styles.emptyBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.emptyBtnText}>Start Designing</Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const meta = FEATURE_META[item.featureType] ?? { color: ACCENT, icon: "layers" as const, label: item.featureType };
            return (
              <TouchableOpacity
                style={styles.designCard}
                onPress={() => router.push({ pathname: "/design/[id]", params: { id: String(item.id) } })}
                activeOpacity={0.8}
              >
                <View style={[styles.designIcon, { backgroundColor: meta.color + "18" }]}>
                  <Feather name={meta.icon} size={18} color={meta.color} />
                </View>
                <View style={styles.designInfo}>
                  <Text style={styles.designTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.designMeta}>
                    <View style={[styles.featureTag, { backgroundColor: meta.color + "15" }]}>
                      <Text style={[styles.featureTagText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                    {item.selectedStyle ? <Text style={styles.designStyle}>{item.selectedStyle}</Text> : null}
                  </View>
                  <Text style={styles.designDate}>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
                </View>
                <View style={styles.designActions}>
                  <TouchableOpacity onPress={() => void handleToggle(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Feather name="heart" size={17} color={item.isFavorite ? ACCENT : DIM} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => void handleDelete(item as Design)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Feather name="trash-2" size={15} color={DIM} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, color: DIM, fontFamily: "Inter_400Regular", marginTop: 2 },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterTab: {
    borderRadius: 22, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, overflow: "hidden",
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  filterTabActive: { borderColor: ACCENT },
  filterGradient: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  filterText: { color: MUTED, fontSize: 13, fontFamily: "Inter_500Medium", paddingHorizontal: 16, paddingVertical: 8 },
  filterTextActive: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 64, gap: 10 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },
  emptyBtn: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  emptyBtnInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  designCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD,
    borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  designIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  designInfo: { flex: 1, gap: 4 },
  designTitle: { fontSize: 14, fontWeight: "600", color: TEXT, fontFamily: "Inter_600SemiBold" },
  designMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  featureTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  featureTagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  designStyle: { fontSize: 11, color: MUTED, fontFamily: "Inter_400Regular" },
  designDate: { fontSize: 11, color: DIM, fontFamily: "Inter_400Regular" },
  designActions: { gap: 14, alignItems: "center" },
});

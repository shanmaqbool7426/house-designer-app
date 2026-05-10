import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetDesigns, useGetFavoriteDesigns, useDeleteDesign, useToggleFavorite } from "@workspace/api-client-react";
import type { Design } from "@workspace/api-client-react";

const FILTER_TABS = ["All", "Favorites"] as const;
type FilterTab = typeof FILTER_TABS[number];

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

function DesignCard({ item, onPress, onFavorite, onDelete }: {
  item: Design;
  onPress: () => void;
  onFavorite: () => Promise<void>;
  onDelete: () => void;
}) {
  const meta = FEATURE_META[item.featureType] ?? { color: "#FF4C1E", icon: "layers" as const, label: item.featureType };
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 10 }).start();
  }
  function onPressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.designCard}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[meta.color + "18", "#111111"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.designCardGradient}
        >
          <View style={[styles.designIcon, { backgroundColor: meta.color + "30" }]}>
            <Feather name={meta.icon} size={18} color={meta.color} />
          </View>
          <View style={styles.designInfo}>
            <Text style={styles.designTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.designMeta}>
              <View style={[styles.featureTag, { backgroundColor: meta.color + "22" }]}>
                <Text style={[styles.featureTagText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              {item.selectedStyle ? (
                <Text style={styles.designStyle}>{item.selectedStyle}</Text>
              ) : null}
            </View>
            <Text style={styles.designDate}>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
          </View>
          <View style={styles.designActions}>
            <TouchableOpacity onPress={() => void onFavorite()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
              <Feather name={item.isFavorite ? "heart" : "heart"} size={17} color={item.isFavorite ? "#FF4C1E" : "#555552"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
              <Feather name="trash-2" size={15} color="#555552" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterTab>("All");

  const { data: allDesigns, isLoading: allLoading, refetch: refetchAll } = useGetDesigns();
  const { data: favDesigns, isLoading: favLoading, refetch: refetchFav } = useGetFavoriteDesigns();
  const deleteMutation = useDeleteDesign();
  const toggleMutation = useToggleFavorite();

  const isLoading = filter === "All" ? allLoading : favLoading;
  const rawDesigns = filter === "All" ? (allDesigns?.designs ?? []) : (favDesigns ?? []);

  async function handleDelete(item: Design) {
    Alert.alert("Delete Design", `Delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id: String(item.id) });
          void refetchAll();
          void refetchFav();
        },
      },
    ]);
  }

  async function handleToggle(id: number) {
    await toggleMutation.mutateAsync({ id: String(id) });
    void refetchAll();
    void refetchFav();
  }

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Saved Designs</Text>
          <Text style={styles.subtitle}>{allDesigns?.total ?? 0} designs saved</Text>
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
              <LinearGradient colors={["#FF4C1E", "#FF6B35"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterTabGradient}>
                <Text style={styles.filterTextActive}>{tab}</Text>
                {tab === "Favorites" && <Feather name="heart" size={12} color="#fff" />}
              </LinearGradient>
            ) : (
              <Text style={styles.filterText}>{tab}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#FF4C1E" />
          <Text style={styles.loadingText}>Loading designs...</Text>
        </View>
      ) : (
        <FlatList
          data={rawDesigns as Design[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={["#FF4C1E11", "#0D0D0D"]} style={styles.emptyIconBg}>
                <Feather name="heart" size={32} color="#FF4C1E44" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>{filter === "Favorites" ? "No favorites yet" : "No designs yet"}</Text>
              <Text style={styles.emptyText}>
                {filter === "Favorites"
                  ? "Heart designs to save them as favorites"
                  : "Use any design tool to create and save designs"}
              </Text>
              {filter === "All" && (
                <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/(tabs)")} activeOpacity={0.8}>
                  <LinearGradient colors={["#FF4C1E", "#FF6B35"]} style={styles.emptyButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.emptyButtonText}>Start Designing</Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <DesignCard
              item={item as Design}
              onPress={() => router.push({ pathname: "/design/[id]", params: { id: String(item.id) } })}
              onFavorite={() => handleToggle(item.id)}
              onDelete={() => void handleDelete(item as Design)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: { fontSize: 26, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, color: "#555552", fontFamily: "Inter_400Regular", marginTop: 2 },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterTab: {
    borderRadius: 22,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#242424",
    overflow: "hidden",
  },
  filterTabActive: { borderColor: "#FF4C1E" },
  filterTabGradient: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  filterText: { color: "#888884", fontSize: 13, fontFamily: "Inter_500Medium", paddingHorizontal: 16, paddingVertical: 8 },
  filterTextActive: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#555552", fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: "#888884", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 24 },
  emptyButton: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  emptyButtonGradient: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  designCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#242424" },
  designCardGradient: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  designIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  designInfo: { flex: 1, gap: 4 },
  designTitle: { fontSize: 14, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold" },
  designMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  featureTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  featureTagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  designStyle: { fontSize: 11, color: "#888884", fontFamily: "Inter_400Regular" },
  designDate: { fontSize: 11, color: "#555552", fontFamily: "Inter_400Regular" },
  designActions: { gap: 14, alignItems: "center", flexShrink: 0 },
  actionBtn: { padding: 2 },
});

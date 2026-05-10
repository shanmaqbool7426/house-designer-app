import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetDesigns, useGetFavoriteDesigns, useDeleteDesign, useToggleFavorite } from "@workspace/api-client-react";
import type { Design } from "@workspace/api-client-react";

const FILTER_TABS = ["All", "Favorites"] as const;
type FilterTab = typeof FILTER_TABS[number];

const FEATURE_COLORS: Record<string, string> = {
  home: "#FF4C1E", floor: "#E67E22", furniture: "#8E44AD",
  cleanup: "#27AE60", garden: "#16A085", roomdesign: "#2980B9",
  objects: "#C0392B", exterior: "#D35400",
};

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterTab>("All");

  const { data: allDesigns, isLoading: allLoading, refetch: refetchAll } = useGetDesigns();
  const { data: favDesigns, isLoading: favLoading, refetch: refetchFav } = useGetFavoriteDesigns();
  const deleteMutation = useDeleteDesign();
  const toggleMutation = useToggleFavorite();

  const isLoading = filter === "All" ? allLoading : favLoading;
  const designs = filter === "All" ? (allDesigns?.designs ?? []) : (favDesigns ?? []);

  async function handleDelete(id: number) {
    Alert.alert("Delete", "Delete this design?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id: String(id) });
          void refetchAll();
          void refetchFav();
        },
      },
    ]);
  }

  async function handleToggleFavorite(id: number) {
    await toggleMutation.mutateAsync({ id: String(id) });
    void refetchAll();
    void refetchFav();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Designs</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#FF4C1E" />
      ) : (
        <FlatList
          data={designs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="heart" size={40} color="#2A2A2A" />
              <Text style={styles.emptyTitle}>No designs yet</Text>
              <Text style={styles.emptyText}>Your saved designs will appear here</Text>
            </View>
          }
          renderItem={({ item }: { item: Design }) => (
            <TouchableOpacity
              style={styles.designCard}
              onPress={() => router.push({ pathname: "/design/[id]", params: { id: String(item.id) } })}
              activeOpacity={0.8}
            >
              <View style={[styles.designIcon, { backgroundColor: (FEATURE_COLORS[item.featureType] ?? "#FF4C1E") + "22" }]}>
                <Feather name="layers" size={18} color={FEATURE_COLORS[item.featureType] ?? "#FF4C1E"} />
              </View>
              <View style={styles.designInfo}>
                <Text style={styles.designTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.designType}>{item.featureType}</Text>
                <Text style={styles.designDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.designActions}>
                <TouchableOpacity onPress={() => void handleToggleFavorite(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="heart" size={18} color={item.isFavorite ? "#FF4C1E" : "#888884"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => void handleDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="trash-2" size={16} color="#888884" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  filterTabActive: { backgroundColor: "#FF4C1E", borderColor: "#FF4C1E" },
  filterText: { color: "#888884", fontSize: 13, fontFamily: "Inter_500Medium" },
  filterTextActive: { color: "#fff" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, color: "#888884", fontFamily: "Inter_400Regular" },
  designCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  designIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  designInfo: { flex: 1 },
  designTitle: { fontSize: 15, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold" },
  designType: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
  designDate: { fontSize: 11, color: "#2A2A2A", fontFamily: "Inter_400Regular", marginTop: 4 },
  designActions: { gap: 12, alignItems: "center" },
});

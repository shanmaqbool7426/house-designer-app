import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useGetDailyTip } from "@workspace/api-client-react";
import { FEATURES, type Feature } from "@/constants/features";

function FeatureCard({ item, onPress }: { item: Feature; onPress: () => void }) {
  const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
    home: "home",
    grid: "grid",
    package: "package",
    wind: "wind",
    feather: "feather",
    layers: "layers",
    "refresh-cw": "refresh-cw",
    sun: "sun",
  };
  const iconName = (ICON_MAP[item.icon] ?? "star") as keyof typeof Feather.glyphMap;

  return (
    <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.featureIconBg, { backgroundColor: item.color + "22" }]}>
        <Feather name={iconName} size={22} color={item.color} />
      </View>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureDesc} numberOfLines={2}>{item.description}</Text>
      <View style={[styles.featureColorDot, { backgroundColor: item.color }]} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [tip, setTip] = useState<string>("");
  const [tipLoading, setTipLoading] = useState(false);

  const tipMutation = useGetDailyTip();

  const fetchTip = useCallback(async () => {
    setTipLoading(true);
    try {
      const result = await tipMutation.mutateAsync({});
      setTip(result.tip);
    } catch {
      setTip("Great design starts with function — identify one thing that's been bothering you and fix it today.");
    } finally {
      setTipLoading(false);
    }
  }, [tipMutation]);

  useEffect(() => {
    void fetchTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTip();
    setRefreshing(false);
  }, [fetchTip]);

  const ListHeader = (
    <View>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(" ")[0] ?? "Designer"}</Text>
        </View>
        <View style={styles.creditsChip}>
          <Feather name="zap" size={14} color="#FF8C00" />
          <Text style={styles.creditsText}>{user?.aiCredits ?? 0}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.tipCard} onPress={() => void fetchTip()} activeOpacity={0.85}>
        <View style={styles.tipHeader}>
          <View style={styles.tipBadge}>
            <Feather name="sun" size={12} color="#FF8C00" />
            <Text style={styles.tipBadgeText}>Daily Design Tip</Text>
          </View>
          {tipLoading ? (
            <ActivityIndicator size="small" color="#FF8C00" />
          ) : (
            <Feather name="refresh-cw" size={14} color="#888884" />
          )}
        </View>
        <Text style={styles.tipText}>
          {tip || "Tap to get your daily AI design inspiration..."}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Design Tools</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: "#0D0D0D" }]}>
      <FlatList
        data={FEATURES}
        numColumns={2}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <FeatureCard
            item={item}
            onPress={() => router.push({ pathname: "/feature/[id]", params: { id: item.id } })}
          />
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF4C1E" />
        }
      />
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, color: "#888884", fontFamily: "Inter_400Regular" },
  userName: { fontSize: 24, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  creditsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  creditsText: { color: "#FF8C00", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  tipCard: {
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  tipHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  tipBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipBadgeText: { color: "#FF8C00", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tipText: { color: "#F5F5F0", fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 16 },
  row: { gap: 12, marginBottom: 12 },
  featureCard: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    position: "relative",
    overflow: "hidden",
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: { fontSize: 13, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 4 },
  featureDesc: { fontSize: 11, color: "#888884", fontFamily: "Inter_400Regular", lineHeight: 16 },
  featureColorDot: { width: 6, height: 6, borderRadius: 3, position: "absolute", top: 16, right: 16 },
});

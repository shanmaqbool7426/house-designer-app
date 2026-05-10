import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useGetDailyTip } from "@workspace/api-client-react";
import { FEATURES, type Feature } from "@/constants/features";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 28 * 2 - 12) / 2;

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  home: "home", grid: "grid", package: "package", wind: "wind",
  feather: "feather", layers: "layers", "refresh-cw": "refresh-cw", sun: "sun",
};

function FeatureCard({ item, onPress, index }: { item: Feature; onPress: () => void; index: number }) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 40, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, [index, opacityAnim, scaleAnim]);

  function handlePressIn() {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 10 }).start();
  }
  function handlePressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  }

  const iconName = (ICON_MAP[item.icon] ?? "star") as keyof typeof Feather.glyphMap;

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        style={styles.featureCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[item.color + "18", item.color + "08"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[item.color + "55", item.color + "22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureIconBg}
        >
          <Feather name={iconName} size={20} color={item.color} />
        </LinearGradient>
        <Text style={styles.featureTitle}>{item.title}</Text>
        <Text style={styles.featureDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.featureArrow}>
          <Feather name="arrow-right" size={12} color={item.color} />
        </View>
        <View style={[styles.featureAccentDot, { backgroundColor: item.color }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [tip, setTip] = useState<string>("");
  const [tipLoading, setTipLoading] = useState(false);
  const tipMutation = useGetDailyTip();

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
    void fetchTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTip = useCallback(async () => {
    setTipLoading(true);
    try {
      const result = await tipMutation.mutateAsync({});
      setTip(result.tip);
    } catch {
      setTip("Great design starts with function — identify one thing that's been bothering you about your space and fix it today.");
    } finally {
      setTipLoading(false);
    }
  }, [tipMutation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTip();
    setRefreshing(false);
  }, [fetchTip]);

  const initials = (user?.name ?? "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const ListHeader = (
    <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good {getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name?.split(" ")[0] ?? "Designer"} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.creditsChip}>
            <Feather name="zap" size={12} color="#FF8C00" />
            <Text style={styles.creditsText}>{user?.aiCredits ?? 0} credits</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => void fetchTip()} activeOpacity={0.9} style={styles.tipCardWrap}>
        <LinearGradient
          colors={["#1A1208", "#0D0D0D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tipCard}
        >
          <View style={styles.tipTopRow}>
            <LinearGradient colors={["#FF8C00", "#FF4C1E"]} style={styles.tipBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Feather name="sun" size={10} color="#fff" />
              <Text style={styles.tipBadgeText}>Daily Tip</Text>
            </LinearGradient>
            {tipLoading ? (
              <ActivityIndicator size="small" color="#FF8C00" />
            ) : (
              <Feather name="refresh-cw" size={13} color="#555552" />
            )}
          </View>
          <Text style={styles.tipText} numberOfLines={4}>
            {tip || "Tap to load your personalized AI design tip..."}
          </Text>
          <View style={styles.tipFooter}>
            <Feather name="cpu" size={11} color="#FF4C1E" />
            <Text style={styles.tipFooterText}>Powered by Claude AI</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Design Tools</Text>
        <View style={styles.toolsCount}>
          <Text style={styles.toolsCountText}>{FEATURES.length} tools</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={FEATURES}
        numColumns={2}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item, index }) => (
          <FeatureCard
            item={item}
            index={index}
            onPress={() => router.push({ pathname: "/feature/[id]", params: { id: item.id } })}
          />
        )}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF4C1E" />}
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
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 24,
  },
  headerLeft: {},
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  greeting: { fontSize: 13, color: "#555552", fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginTop: 2 },
  creditsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FF8C0033",
  },
  creditsText: { color: "#FF8C00", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF4C1E22",
    borderWidth: 1.5,
    borderColor: "#FF4C1E55",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FF4C1E", fontSize: 13, fontFamily: "Inter_700Bold" },
  tipCardWrap: { marginBottom: 28, borderRadius: 18, overflow: "hidden" },
  tipCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FF8C0022",
  },
  tipTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  tipBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tipBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tipText: { color: "#D0CFC8", fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginBottom: 12 },
  tipFooter: { flexDirection: "row", alignItems: "center", gap: 5 },
  tipFooterText: { color: "#555552", fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  toolsCount: { backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#242424" },
  toolsCountText: { color: "#555552", fontSize: 12, fontFamily: "Inter_400Regular" },
  row: { gap: 12, marginBottom: 12 },
  featureCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#242424",
    minHeight: 140,
    overflow: "hidden",
    backgroundColor: "#111111",
  },
  featureIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: { fontSize: 13, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 4 },
  featureDesc: { fontSize: 11, color: "#888884", fontFamily: "Inter_400Regular", lineHeight: 16 },
  featureArrow: { marginTop: 10 },
  featureAccentDot: { width: 5, height: 5, borderRadius: 3, position: "absolute", top: 14, right: 14 },
});

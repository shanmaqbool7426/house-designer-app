import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated,
  Image, Dimensions, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useGetDailyTip } from "@workspace/api-client-react";
import { FEATURES, type Feature } from "@/constants/features";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48 - 12) / 2;
const CARD_H = 210;

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  home: "home", grid: "grid", package: "package", wind: "wind",
  feather: "feather", layers: "layers", "refresh-cw": "refresh-cw", sun: "sun",
};

function FeatureCard({ item, onPress, index }: { item: Feature; onPress: () => void; index: number }) {
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, delay: index * 55, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 40, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, [index, opacityAnim, scaleAnim]);

  const iconName = (ICON_MAP[item.icon] ?? "star") as keyof typeof Feather.glyphMap;

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageWrap}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.cardIconBadge, { backgroundColor: item.color }]}>
            <Feather name={iconName} size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <View style={[styles.cardDot, { backgroundColor: item.color }]} />
            <Text style={[styles.cardArrow, { color: item.color }]}>Explore →</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [tip, setTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const tipMutation = useGetDailyTip();

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    void fetchTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTip = useCallback(async () => {
    setTipLoading(true);
    try {
      const r = await tipMutation.mutateAsync({});
      setTip(r.tip);
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
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 16);

  const ListHeader = (
    <Animated.View style={{ opacity: headerFade }}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View>
          <Text style={styles.greeting}>Good {greeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(" ")[0] ?? "Designer"} 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.creditsChip}>
            <Feather name="zap" size={12} color="#FF8C00" />
            <Text style={styles.creditsText}>{user?.aiCredits ?? 0}</Text>
          </View>
          <LinearGradient colors={["#FF4C1E", "#FF7A45"]} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
        </View>
      </View>

      <TouchableOpacity onPress={() => void fetchTip()} activeOpacity={0.9} style={styles.tipCard}>
        <View style={styles.tipTop}>
          <LinearGradient colors={["#FF8C00", "#FF4C1E"]} style={styles.tipBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Feather name="sun" size={10} color="#fff" />
            <Text style={styles.tipBadgeText}>Daily Tip</Text>
          </LinearGradient>
          {tipLoading
            ? <ActivityIndicator size="small" color="#FF8C00" />
            : <Feather name="refresh-cw" size={13} color="#BBBAB6" />}
        </View>
        <Text style={styles.tipText} numberOfLines={4}>
          {tip || "Tap to load your personalized AI design tip..."}
        </Text>
        <View style={styles.tipFooter}>
          <Feather name="cpu" size={11} color="#FF4C1E" />
          <Text style={styles.tipFooterText}>Powered by Claude AI</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Design Tools</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{FEATURES.length} tools</Text>
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
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF4C1E" />}
      />
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F6F2" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 20 },
  greeting: { fontSize: 13, color: "#6E6B67", fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontWeight: "700", color: "#1A1A18", fontFamily: "Inter_700Bold", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  creditsChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#FFF5EA", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: "#FFE0B0",
  },
  creditsText: { color: "#FF8C00", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18, padding: 18, marginBottom: 28,
    borderWidth: 1, borderColor: "#EDEAE4",
    shadowColor: "#00000012", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 3,
  },
  tipTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  tipBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tipBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tipText: { color: "#3A3936", fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginBottom: 12 },
  tipFooter: { flexDirection: "row", alignItems: "center", gap: 5 },
  tipFooterText: { color: "#BBBAB6", fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A18", fontFamily: "Inter_700Bold" },
  countBadge: { backgroundColor: "#EDEAE4", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { color: "#6E6B67", fontSize: 12, fontFamily: "Inter_400Regular" },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EDEAE4",
    shadowColor: "#00000012",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageWrap: { width: "100%", height: CARD_H * 0.54, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  cardIconBadge: {
    position: "absolute", top: 10, right: 10,
    width: 26, height: 26, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#1A1A18", fontFamily: "Inter_700Bold", marginBottom: 3 },
  cardDesc: { fontSize: 11, color: "#6E6B67", fontFamily: "Inter_400Regular", lineHeight: 16, marginBottom: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardDot: { width: 6, height: 6, borderRadius: 3 },
  cardArrow: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

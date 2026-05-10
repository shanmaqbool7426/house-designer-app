import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useGetDesigns, useGetFavoriteDesigns, useGetCredits } from "@workspace/api-client-react";

const BG = "#F8F6F2";
const CARD = "#FFFFFF";
const BORDER = "#EDEAE4";
const TEXT = "#1A1A18";
const MUTED = "#6E6B67";
const DIM = "#BBBAB6";
const ACCENT = "#FF4C1E";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: designs } = useGetDesigns();
  const { data: favorites } = useGetFavoriteDesigns();
  const { data: credits } = useGetCredits();

  const totalDesigns = designs?.total ?? 0;
  const totalFavorites = (favorites as unknown[])?.length ?? 0;
  const remainingCredits = credits?.credits ?? user?.aiCredits ?? 0;
  const maxCredits = 10;
  const creditPct = Math.min(remainingCredits / maxCredits, 1);
  const isPro = user?.plan === "pro";
  const initials = (user?.name ?? "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void logout() },
    ]);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.avatarSection}>
        <LinearGradient colors={["#FF4C1E", "#FF7A45"]} style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        {isPro && (
          <LinearGradient colors={["#FF8C00", "#FF4C1E"]} style={styles.proRing}>
            <Feather name="star" size={9} color="#fff" />
          </LinearGradient>
        )}
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.planBadge, isPro ? styles.planPro : styles.planFree]}>
          <Feather name={isPro ? "star" : "zap"} size={11} color={isPro ? "#FF8C00" : MUTED} />
          <Text style={[styles.planText, { color: isPro ? "#FF8C00" : MUTED }]}>{isPro ? "Pro Plan" : "Free Plan"}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { value: totalDesigns, label: "Designs", icon: "layers" as const },
          { value: totalFavorites, label: "Favorites", icon: "heart" as const },
          { value: remainingCredits, label: "Credits", icon: "zap" as const },
        ].map(({ value, label, icon }, i) => (
          <View key={label} style={[styles.statCard, i === 1 && styles.statMiddle]}>
            <Feather name={icon} size={14} color={ACCENT} style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {!isPro && (
        <View style={styles.creditsCard}>
          <View style={styles.creditsTop}>
            <View style={styles.creditsLeft}>
              <Feather name="zap" size={14} color="#FF8C00" />
              <Text style={styles.creditsLabel}>Daily AI Credits</Text>
            </View>
            <Text style={styles.creditsCount}>
              <Text style={{ color: remainingCredits <= 2 ? "#C0392B" : "#FF8C00" }}>{remainingCredits}</Text>
              <Text style={{ color: DIM }}>/{maxCredits}</Text>
            </Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={remainingCredits <= 2 ? ["#C0392B", "#E74C3C"] : ["#FF8C00", "#FF4C1E"]}
              style={[styles.progressFill, { width: `${creditPct * 100}%` }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.creditsHint}>Resets daily at midnight</Text>
        </View>
      )}

      {!isPro && (
        <TouchableOpacity style={styles.upgradeCard} activeOpacity={0.88}>
          <LinearGradient colors={["#FF4C1E", "#FF7A45"]} style={styles.upgradeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.upgradeLeft}>
              <View style={styles.upgradeIconBg}>
                <Feather name="star" size={18} color="#FF8C00" />
              </View>
              <View>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDesc}>Unlimited AI credits · Priority access</Text>
              </View>
            </View>
            <View style={styles.upgradeArrow}>
              <Feather name="arrow-right" size={16} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {[
          { icon: "user" as const, label: "Edit Profile", sub: "Update your name and info" },
          { icon: "bell" as const, label: "Notifications", sub: "Manage alerts" },
          { icon: "shield" as const, label: "Privacy", sub: "Control your data" },
          { icon: "help-circle" as const, label: "Help & Support", sub: "Get assistance" },
        ].map(({ icon, label, sub }) => (
          <TouchableOpacity key={label} style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconBg}>
              <Feather name={icon} size={15} color={MUTED} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{label}</Text>
              <Text style={styles.menuSub}>{sub}</Text>
            </View>
            <Feather name="chevron-right" size={15} color={BORDER} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>DesignAI · Powered by Claude AI</Text>
        <Text style={styles.appVersion}>v1.0.0</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color="#C0392B" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  container: { paddingHorizontal: 20 },
  avatarSection: { alignItems: "center", marginBottom: 24, position: "relative" },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
    shadowColor: "#FF4C1E50", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8,
  },
  avatarText: { fontSize: 30, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  proRing: {
    position: "absolute", top: 60, left: "50%", marginLeft: 20,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: BG,
  },
  userName: { fontSize: 22, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold", marginBottom: 4 },
  userEmail: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", marginBottom: 12 },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  planFree: { backgroundColor: "#F3F1ED", borderWidth: 1, borderColor: BORDER },
  planPro: { backgroundColor: "#FFF5EA", borderWidth: 1, borderColor: "#FFE0B0" },
  planText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: {
    flexDirection: "row", backgroundColor: CARD, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER, marginBottom: 16,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2, overflow: "hidden",
  },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 18 },
  statMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER },
  statValue: { fontSize: 24, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: DIM, fontFamily: "Inter_400Regular", marginTop: 2 },
  creditsCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  creditsTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  creditsLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  creditsLabel: { color: TEXT, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  creditsCount: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  progressBg: { height: 6, backgroundColor: "#F3F1ED", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  creditsHint: { color: DIM, fontSize: 11, fontFamily: "Inter_400Regular" },
  upgradeCard: { borderRadius: 18, overflow: "hidden", marginBottom: 24 },
  upgradeGradient: { padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upgradeLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  upgradeIconBg: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center",
  },
  upgradeTitle: { fontSize: 16, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  upgradeDesc: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", marginTop: 2 },
  upgradeArrow: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, color: DIM, fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  menuItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD,
    borderRadius: 14, padding: 14, marginBottom: 6,
    borderWidth: 1, borderColor: BORDER, gap: 12,
    shadowColor: "#00000008", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  menuIconBg: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#F3F1ED", alignItems: "center", justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, color: TEXT, fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 11, color: DIM, fontFamily: "Inter_400Regular", marginTop: 1 },
  appInfo: { alignItems: "center", gap: 2, marginBottom: 16 },
  appInfoText: { color: DIM, fontSize: 12, fontFamily: "Inter_400Regular" },
  appVersion: { color: BORDER, fontSize: 11, fontFamily: "Inter_400Regular" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FDF0F0", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#F5C6C6",
  },
  logoutText: { color: "#C0392B", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useGetDesigns, useGetFavoriteDesigns, useGetCredits } from "@workspace/api-client-react";

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

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void logout() },
    ]);
  }

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 110 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={isPro ? ["#FF8C0015", "#FF4C1E10", "#0D0D0D"] : ["#FF4C1E10", "#0D0D0D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.avatarSection}
      >
        <View style={styles.avatarOuter}>
          <LinearGradient colors={["#FF4C1E", "#FF8C00"]} style={styles.avatarCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          {isPro && (
            <View style={styles.proRing}>
              <LinearGradient colors={["#FF8C00", "#FF4C1E"]} style={styles.proRingInner}>
                <Feather name="star" size={9} color="#fff" />
              </LinearGradient>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.planBadge, isPro ? styles.planProBadge : styles.planFreeBadge]}>
          <Feather name={isPro ? "star" : "zap"} size={11} color={isPro ? "#FF8C00" : "#888884"} />
          <Text style={[styles.planText, { color: isPro ? "#FF8C00" : "#888884" }]}>
            {isPro ? "Pro Plan" : "Free Plan"}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        {[
          { value: totalDesigns, label: "Designs", icon: "layers" as const },
          { value: totalFavorites, label: "Favorites", icon: "heart" as const },
          { value: remainingCredits, label: "Credits", icon: "zap" as const },
        ].map(({ value, label, icon }, i) => (
          <View key={label} style={[styles.statCard, i === 1 && styles.statCardMiddle]}>
            <Feather name={icon} size={14} color="#FF4C1E" style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {!isPro && (
        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <View style={styles.creditsLeft}>
              <Feather name="zap" size={15} color="#FF8C00" />
              <Text style={styles.creditsLabel}>Daily AI Credits</Text>
            </View>
            <Text style={styles.creditsCount}>
              <Text style={{ color: remainingCredits <= 2 ? "#C0392B" : "#FF8C00" }}>{remainingCredits}</Text>
              <Text style={{ color: "#555552" }}>/{maxCredits}</Text>
            </Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={remainingCredits <= 2 ? ["#C0392B", "#FF4C1E"] : ["#FF8C00", "#FF4C1E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${creditPct * 100}%` }]}
            />
          </View>
          <Text style={styles.creditsHint}>Resets daily at midnight · {remainingCredits} remaining today</Text>
        </View>
      )}

      {!isPro && (
        <TouchableOpacity style={styles.upgradeCard} activeOpacity={0.9}>
          <LinearGradient
            colors={["#FF8C0015", "#FF4C1E15"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeGradient}
          >
            <View style={styles.upgradeLeft}>
              <LinearGradient colors={["#FF8C00", "#FF4C1E"]} style={styles.upgradeIconBg}>
                <Feather name="star" size={18} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeDesc}>Unlimited credits · Priority AI access</Text>
              </View>
            </View>
            <View style={styles.upgradeButtonWrap}>
              <LinearGradient colors={["#FF8C00", "#FF4C1E"]} style={styles.upgradeButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.upgradeButtonText}>Go Pro</Text>
              </LinearGradient>
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
              <Feather name={icon} size={15} color="#888884" />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuLabel}>{label}</Text>
              <Text style={styles.menuSub}>{sub}</Text>
            </View>
            <Feather name="chevron-right" size={15} color="#2A2A2A" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>DesignAI · Powered by Claude AI</Text>
        <Text style={styles.appVersion}>v1.0.0</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color="#C0392B" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  container: { paddingHorizontal: 20 },
  avatarSection: { alignItems: "center", marginBottom: 24, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#242424" },
  avatarOuter: { position: "relative", marginBottom: 14 },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 30, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  proRing: { position: "absolute", bottom: 0, right: 0, borderRadius: 12, overflow: "hidden" },
  proRingInner: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 2, borderColor: "#0D0D0D" },
  userName: { fontSize: 22, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 4 },
  userEmail: { fontSize: 13, color: "#888884", fontFamily: "Inter_400Regular", marginBottom: 12 },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  planFreeBadge: { backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#242424" },
  planProBadge: { backgroundColor: "#FF8C0020", borderWidth: 1, borderColor: "#FF8C0050" },
  planText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", backgroundColor: "#111111", borderRadius: 18, borderWidth: 1, borderColor: "#242424", marginBottom: 16, overflow: "hidden" },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 18 },
  statCardMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#242424" },
  statValue: { fontSize: 24, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: "#555552", fontFamily: "Inter_400Regular", marginTop: 2 },
  creditsCard: { backgroundColor: "#111111", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#242424" },
  creditsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  creditsLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  creditsLabel: { color: "#F5F5F0", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  creditsCount: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  progressBg: { height: 6, backgroundColor: "#1E1E1E", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 3 },
  creditsHint: { color: "#555552", fontSize: 11, fontFamily: "Inter_400Regular" },
  upgradeCard: { borderRadius: 16, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "#FF8C0030" },
  upgradeGradient: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upgradeLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  upgradeIconBg: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  upgradeTitle: { fontSize: 15, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold" },
  upgradeDesc: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular", marginTop: 2 },
  upgradeButtonWrap: { borderRadius: 10, overflow: "hidden" },
  upgradeButton: { paddingHorizontal: 16, paddingVertical: 8 },
  upgradeButtonText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, color: "#555552", fontFamily: "Inter_500Medium", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#242424",
    gap: 12,
  },
  menuIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2A2A2A" },
  menuTextGroup: { flex: 1 },
  menuLabel: { fontSize: 14, color: "#F5F5F0", fontFamily: "Inter_500Medium" },
  menuSub: { fontSize: 11, color: "#555552", fontFamily: "Inter_400Regular", marginTop: 1 },
  appInfo: { alignItems: "center", gap: 2, marginBottom: 16 },
  appInfoText: { color: "#555552", fontSize: 12, fontFamily: "Inter_400Regular" },
  appVersion: { color: "#2A2A2A", fontSize: 11, fontFamily: "Inter_400Regular" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C0392B15",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C0392B25",
  },
  logoutText: { color: "#C0392B", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

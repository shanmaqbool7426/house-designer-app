import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useGetDesigns, useGetFavoriteDesigns, useGetCredits } from "@workspace/api-client-react";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: designs } = useGetDesigns();
  const { data: favorites } = useGetFavoriteDesigns();
  const { data: credits } = useGetCredits();

  const totalDesigns = designs?.total ?? 0;
  const totalFavorites = favorites?.length ?? 0;
  const remainingCredits = credits?.credits ?? user?.aiCredits ?? 0;
  const maxCredits = 10;
  const creditPercent = Math.min(remainingCredits / maxCredits, 1);

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => void logout() },
    ]);
  }

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.planBadge, user?.plan === "pro" ? styles.planPro : styles.planFree]}>
          <Feather name={user?.plan === "pro" ? "star" : "zap"} size={12} color={user?.plan === "pro" ? "#FF8C00" : "#888884"} />
          <Text style={[styles.planText, user?.plan === "pro" ? styles.planProText : styles.planFreeText]}>
            {user?.plan === "pro" ? "Pro Plan" : "Free Plan"}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalDesigns}</Text>
          <Text style={styles.statLabel}>Designs</Text>
        </View>
        <View style={[styles.statCard, styles.statDivider]}>
          <Text style={styles.statValue}>{totalFavorites}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{remainingCredits}</Text>
          <Text style={styles.statLabel}>Credits</Text>
        </View>
      </View>

      {user?.plan === "free" && (
        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <View style={styles.creditsLeft}>
              <Feather name="zap" size={16} color="#FF8C00" />
              <Text style={styles.creditsLabel}>AI Credits</Text>
            </View>
            <Text style={styles.creditsCount}>{remainingCredits}/{maxCredits}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${creditPercent * 100}%` }]} />
          </View>
          <Text style={styles.creditsHint}>Credits reset daily at midnight</Text>
        </View>
      )}

      {user?.plan === "free" && (
        <View style={styles.upgradeCard}>
          <View style={styles.upgradeContent}>
            <Feather name="star" size={20} color="#FF8C00" />
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeDesc}>Unlimited AI credits, priority access</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.8}>
            <Text style={styles.upgradeButtonText}>Go Pro</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {[
          { icon: "user" as const, label: "Edit Profile" },
          { icon: "bell" as const, label: "Notifications" },
          { icon: "shield" as const, label: "Privacy" },
          { icon: "help-circle" as const, label: "Help & Support" },
        ].map(({ icon, label }) => (
          <TouchableOpacity key={label} style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconBg}>
              <Feather name={icon} size={16} color="#888884" />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Feather name="chevron-right" size={16} color="#2A2A2A" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={18} color="#C0392B" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  container: { paddingHorizontal: 20 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF4C1E22",
    borderWidth: 2,
    borderColor: "#FF4C1E44",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#FF4C1E", fontFamily: "Inter_700Bold" },
  userName: { fontSize: 20, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#888884", fontFamily: "Inter_400Regular", marginBottom: 10 },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  planFree: { backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: "#2A2A2A" },
  planPro: { backgroundColor: "#FF8C0022", borderWidth: 1, borderColor: "#FF8C0044" },
  planText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  planFreeText: { color: "#888884" },
  planProText: { color: "#FF8C00" },
  statsRow: { flexDirection: "row", backgroundColor: "#161616", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A2A", marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: "#2A2A2A" },
  statValue: { fontSize: 22, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular", marginTop: 2 },
  creditsCard: { backgroundColor: "#161616", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  creditsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  creditsLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  creditsLabel: { color: "#F5F5F0", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  creditsCount: { color: "#FF8C00", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  progressBg: { height: 6, backgroundColor: "#2A2A2A", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#FF8C00", borderRadius: 3 },
  creditsHint: { color: "#888884", fontSize: 11, fontFamily: "Inter_400Regular" },
  upgradeCard: {
    backgroundColor: "#161616",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FF8C0033",
    gap: 12,
  },
  upgradeContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  upgradeTitle: { fontSize: 15, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold" },
  upgradeDesc: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular", marginTop: 2 },
  upgradeButton: { backgroundColor: "#FF8C00", borderRadius: 10, height: 42, alignItems: "center", justifyContent: "center" },
  upgradeButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, color: "#888884", fontFamily: "Inter_500Medium", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 12,
  },
  menuIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#1E1E1E", alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, color: "#F5F5F0", fontFamily: "Inter_400Regular" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C0392B22",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C0392B33",
  },
  logoutText: { color: "#C0392B", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

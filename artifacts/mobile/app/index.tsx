import { Redirect } from "expo-router";
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function RootIndex() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF4C1E" />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F6F2",
    alignItems: "center",
    justifyContent: "center",
  },
});

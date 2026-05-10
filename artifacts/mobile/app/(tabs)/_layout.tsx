import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";

const ACCENT = "#FF4C1E";
const INACTIVE = "#BBBAB6";
const TAB_BG = "#FFFFFF";
const BORDER = "#EDEAE4";

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: INACTIVE,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : TAB_BG,
          borderTopWidth: 1,
          borderTopColor: BORDER,
          elevation: 0,
          shadowColor: "#00000015",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: "Inter_500Medium" },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: TAB_BG }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: "Projects",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="folder" tintColor={color} size={22} />
            ) : (
              <Feather name="folder" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="heart" tintColor={color} size={22} />
            ) : (
              <Feather name="heart" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

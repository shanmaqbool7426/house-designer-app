import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetProjects, useCreateProject, useDeleteProject } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";

function ProjectCard({ item, onDelete }: { item: Project; onDelete: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  function onPressIn() { Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 10 }).start(); }
  function onPressOut() { Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 6 }).start(); }

  const isActive = item.status === "active";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={styles.projectCard} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
        <LinearGradient
          colors={isActive ? ["#FF4C1E14", "#111111"] : ["#1A1A1A", "#111111"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.projectCardInner}
        >
          <LinearGradient
            colors={isActive ? ["#FF4C1E", "#FF8C00"] : ["#2A2A2A", "#1E1E1E"]}
            style={styles.projectIconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="folder" size={18} color={isActive ? "#fff" : "#888884"} />
          </LinearGradient>

          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.projectDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
            <View style={styles.projectMeta}>
              <View style={[styles.statusChip, isActive ? styles.statusActive : styles.statusDone]}>
                <View style={[styles.statusDot, { backgroundColor: isActive ? "#27AE60" : "#555552" }]} />
                <Text style={[styles.statusText, isActive ? styles.statusActiveText : styles.statusDoneText]}>
                  {isActive ? "Active" : "Completed"}
                </Text>
              </View>
              <Text style={styles.designCount}>{item.designCount} design{item.designCount !== 1 ? "s" : ""}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.deleteBtn}>
            <Feather name="trash-2" size={15} color="#555552" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const { data: projects, isLoading, refetch } = useGetProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  function closeModal() {
    setShowCreate(false);
    setProjectName("");
    setProjectDesc("");
  }

  async function handleCreate() {
    if (!projectName.trim()) {
      Alert.alert("Name required", "Please enter a project name");
      return;
    }
    try {
      await createMutation.mutateAsync({ data: { name: projectName.trim(), description: projectDesc.trim() } });
      closeModal();
      void refetch();
    } catch {
      Alert.alert("Error", "Failed to create project");
    }
  }

  function handleDelete(id: number, name: string) {
    Alert.alert("Delete Project", `Delete "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteMutation.mutateAsync({ id: String(id) }); void refetch(); } },
    ]);
  }

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>{projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.85}>
          <LinearGradient colors={["#FF4C1E", "#FF6B35"]} style={styles.addButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Feather name="plus" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#FF4C1E" />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : (
        <FlatList
          data={projects ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={["#FF4C1E11", "#0D0D0D"]} style={styles.emptyIconBg}>
                <Feather name="folder" size={32} color="#FF4C1E44" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyText}>Create a project to organize your AI designs by room or goal</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.emptyButton} activeOpacity={0.85}>
                <LinearGradient colors={["#FF4C1E", "#FF6B35"]} style={styles.emptyButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Feather name="plus" size={14} color="#fff" />
                  <Text style={styles.emptyButtonText}>New Project</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: { item: Project }) => (
            <ProjectCard
              item={item}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
        />
      )}

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={[styles.modal, { paddingTop: 24, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
              <Feather name="x" size={20} color="#888884" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Organize your AI designs by space or goal</Text>

          <View style={styles.modalInputs}>
            <View style={[styles.inputContainer, nameFocused && styles.inputFocused]}>
              <Feather name="folder" size={16} color={nameFocused ? "#FF4C1E" : "#888884"} />
              <TextInput
                style={styles.input}
                placeholder="Project name"
                placeholderTextColor="#555552"
                value={projectName}
                onChangeText={setProjectName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
            <View style={[styles.inputContainer, styles.textareaContainer, descFocused && styles.inputFocused]}>
              <Feather name="align-left" size={16} color={descFocused ? "#FF4C1E" : "#888884"} style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Description (optional)"
                placeholderTextColor="#555552"
                value={projectDesc}
                onChangeText={setProjectDesc}
                multiline
                numberOfLines={3}
                onFocus={() => setDescFocused(true)}
                onBlur={() => setDescFocused(false)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.createButtonWrap}
            onPress={handleCreate}
            disabled={createMutation.isPending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={createMutation.isPending ? ["#333", "#333"] : ["#FF4C1E", "#FF6B35"]}
              style={styles.createButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="folder-plus" size={16} color="#fff" />
                  <Text style={styles.createButtonText}>Create Project</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, color: "#555552", fontFamily: "Inter_400Regular", marginTop: 2 },
  addButton: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#555552", fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: "#888884", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, paddingHorizontal: 24 },
  emptyButton: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  emptyButtonGradient: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  projectCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#242424" },
  projectCardInner: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  projectIconBg: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 15, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  projectDesc: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular", marginBottom: 6 },
  projectMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusActive: { backgroundColor: "#27AE6020" },
  statusDone: { backgroundColor: "#1E1E1E" },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statusActiveText: { color: "#27AE60" },
  statusDoneText: { color: "#555552" },
  designCount: { fontSize: 11, color: "#555552", fontFamily: "Inter_400Regular" },
  deleteBtn: { padding: 4 },
  modal: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: 24 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#242424", alignSelf: "center", marginBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#161616", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#242424" },
  modalSubtitle: { fontSize: 14, color: "#888884", fontFamily: "Inter_400Regular", marginBottom: 28 },
  modalInputs: { gap: 12, marginBottom: 24 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#161616",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#242424",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputFocused: { borderColor: "#FF4C1E" },
  textareaContainer: { alignItems: "flex-start", minHeight: 90 },
  input: { flex: 1, color: "#F5F5F0", fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { height: 70, textAlignVertical: "top" },
  createButtonWrap: { borderRadius: 14, overflow: "hidden" },
  createButton: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  createButtonText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetProjects, useCreateProject, useDeleteProject } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");

  const { data: projects, isLoading, refetch } = useGetProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  async function handleCreate() {
    if (!projectName.trim()) {
      Alert.alert("Error", "Project name is required");
      return;
    }
    try {
      await createMutation.mutateAsync({ data: { name: projectName.trim(), description: projectDesc.trim() } });
      setProjectName("");
      setProjectDesc("");
      setShowCreate(false);
      void refetch();
    } catch {
      Alert.alert("Error", "Failed to create project");
    }
  }

  function handleDelete(id: number, name: string) {
    Alert.alert("Delete Project", `Delete "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMutation.mutateAsync({ id: String(id) });
          void refetch();
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#FF4C1E" />
      ) : (
        <FlatList
          data={projects ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="folder" size={40} color="#2A2A2A" />
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyText}>Create a project to organize your designs</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreate(true)}>
                <Text style={styles.emptyButtonText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: { item: Project }) => (
            <View style={styles.projectCard}>
              <View style={styles.projectIconBg}>
                <Feather name="folder" size={20} color="#FF4C1E" />
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.projectDesc} numberOfLines={1}>{item.description}</Text>
                ) : null}
                <View style={styles.projectMeta}>
                  <View style={[styles.statusChip, item.status === "active" ? styles.statusActive : styles.statusDone]}>
                    <Text style={[styles.statusText, item.status === "active" ? styles.statusActiveText : styles.statusDoneText]}>
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.designCount}>{item.designCount} designs</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="trash-2" size={16} color="#888884" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: 24, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TouchableOpacity onPress={() => { setShowCreate(false); setProjectName(""); setProjectDesc(""); }}>
              <Feather name="x" size={22} color="#888884" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalInputGroup}>
            <TextInput
              style={styles.modalInput}
              placeholder="Project name"
              placeholderTextColor="#888884"
              value={projectName}
              onChangeText={setProjectName}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Description (optional)"
              placeholderTextColor="#888884"
              value={projectDesc}
              onChangeText={setProjectDesc}
              multiline
              numberOfLines={3}
            />
          </View>
          <TouchableOpacity
            style={[styles.createButton, createMutation.isPending && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Project</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  addButton: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FF4C1E", alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, color: "#888884", fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyButton: { marginTop: 16, backgroundColor: "#FF4C1E", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  projectCard: {
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
  projectIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FF4C1E22", alignItems: "center", justifyContent: "center" },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 15, fontWeight: "600", color: "#F5F5F0", fontFamily: "Inter_600SemiBold" },
  projectDesc: { fontSize: 12, color: "#888884", fontFamily: "Inter_400Regular", marginTop: 2 },
  projectMeta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusActive: { backgroundColor: "#27AE6022" },
  statusDone: { backgroundColor: "#2A2A2A" },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statusActiveText: { color: "#27AE60" },
  statusDoneText: { color: "#888884" },
  designCount: { fontSize: 11, color: "#888884", fontFamily: "Inter_400Regular" },
  modalContainer: { flex: 1, backgroundColor: "#0D0D0D", paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#F5F5F0", fontFamily: "Inter_700Bold" },
  modalInputGroup: { gap: 12, marginBottom: 20 },
  modalInput: {
    backgroundColor: "#161616",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#F5F5F0",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  modalTextarea: { height: 100, textAlignVertical: "top" },
  createButton: { backgroundColor: "#FF4C1E", borderRadius: 12, height: 52, alignItems: "center", justifyContent: "center" },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});

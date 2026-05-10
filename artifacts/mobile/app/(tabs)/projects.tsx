import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetProjects, useCreateProject, useDeleteProject } from "@workspace/api-client-react";
import type { Project } from "@workspace/api-client-react";

const BG = "#F8F6F2";
const CARD = "#FFFFFF";
const BORDER = "#EDEAE4";
const TEXT = "#1A1A18";
const MUTED = "#6E6B67";
const DIM = "#BBBAB6";
const ACCENT = "#FF4C1E";

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const { data: projects, isLoading, refetch } = useGetProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  function closeModal() { setShowCreate(false); setProjectName(""); setProjectDesc(""); }

  async function handleCreate() {
    if (!projectName.trim()) { Alert.alert("Name required", "Please enter a project name"); return; }
    try {
      await createMutation.mutateAsync({ data: { name: projectName.trim(), description: projectDesc.trim() } });
      closeModal(); void refetch();
    } catch { Alert.alert("Error", "Failed to create project"); }
  }

  function handleDelete(id: number, name: string) {
    Alert.alert("Delete Project", `Delete "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteMutation.mutateAsync({ id: String(id) }); void refetch(); } },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>{projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} activeOpacity={0.85}>
          <LinearGradient colors={["#FF4C1E", "#FF6B35"]} style={styles.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Feather name="plus" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}><ActivityIndicator color={ACCENT} /></View>
      ) : (
        <FlatList
          data={projects ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="folder" size={28} color={DIM} />
              </View>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptyText}>Create a project to organize your AI designs by room or goal</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.emptyBtn}>
                <LinearGradient colors={["#FF4C1E", "#FF6B35"]} style={styles.emptyBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Feather name="plus" size={14} color="#fff" />
                  <Text style={styles.emptyBtnText}>New Project</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: { item: Project }) => {
            const isActive = item.status === "active";
            return (
              <TouchableOpacity style={styles.projectCard} activeOpacity={0.85}>
                <View style={[styles.projectIcon, isActive && styles.projectIconActive]}>
                  <Feather name="folder" size={18} color={isActive ? "#fff" : DIM} />
                </View>
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{item.name}</Text>
                  {item.description ? <Text style={styles.projectDesc} numberOfLines={1}>{item.description}</Text> : null}
                  <View style={styles.projectMeta}>
                    <View style={[styles.statusPill, { backgroundColor: isActive ? "#E8F8EE" : "#F3F1ED" }]}>
                      <View style={[styles.statusDot, { backgroundColor: isActive ? "#27AE60" : DIM }]} />
                      <Text style={[styles.statusText, { color: isActive ? "#27AE60" : MUTED }]}>{isActive ? "Active" : "Done"}</Text>
                    </View>
                    <Text style={styles.countText}>{item.designCount} design{item.designCount !== 1 ? "s" : ""}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Feather name="trash-2" size={15} color={DIM} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={[styles.modal, { paddingTop: 20, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Project</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Feather name="x" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Organize your designs by room or goal</Text>
          <View style={styles.modalInputs}>
            <View style={[styles.inputWrap, focused === "name" && styles.inputWrapFocused]}>
              <Feather name="folder" size={16} color={focused === "name" ? ACCENT : DIM} />
              <TextInput
                style={styles.input} placeholder="Project name" placeholderTextColor={DIM}
                value={projectName} onChangeText={setProjectName}
                onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
              />
            </View>
            <View style={[styles.inputWrap, styles.textareaWrap, focused === "desc" && styles.inputWrapFocused]}>
              <Feather name="align-left" size={16} color={focused === "desc" ? ACCENT : DIM} style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.input, styles.textarea]} placeholder="Description (optional)" placeholderTextColor={DIM}
                value={projectDesc} onChangeText={setProjectDesc}
                multiline numberOfLines={3}
                onFocus={() => setFocused("desc")} onBlur={() => setFocused(null)}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.createBtnWrap} onPress={handleCreate} disabled={createMutation.isPending} activeOpacity={0.85}>
            <LinearGradient colors={createMutation.isPending ? ["#CCC", "#CCC"] : ["#FF4C1E", "#FF6B35"]} style={styles.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {createMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Feather name="folder-plus" size={16} color="#fff" />
                  <Text style={styles.createBtnText}>Create Project</Text>
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
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, color: DIM, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 64, gap: 10 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2, marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, color: MUTED, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32, lineHeight: 20 },
  emptyBtn: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  emptyBtnInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  projectCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD,
    borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  projectIcon: {
    width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "#F3F1ED", flexShrink: 0,
  },
  projectIconActive: { backgroundColor: ACCENT },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 15, fontWeight: "600", color: TEXT, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  projectDesc: { fontSize: 12, color: MUTED, fontFamily: "Inter_400Regular", marginBottom: 6 },
  projectMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  countText: { fontSize: 11, color: DIM, fontFamily: "Inter_400Regular" },
  modal: { flex: 1, backgroundColor: BG, paddingHorizontal: 24 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: "center", marginBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: TEXT, fontFamily: "Inter_700Bold" },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: BORDER,
  },
  modalSubtitle: { fontSize: 14, color: MUTED, fontFamily: "Inter_400Regular", marginBottom: 24 },
  modalInputs: { gap: 12, marginBottom: 24 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 16, height: 52,
  },
  inputWrapFocused: { borderColor: ACCENT },
  textareaWrap: { height: "auto" as unknown as number, alignItems: "flex-start", paddingVertical: 14 },
  input: { flex: 1, color: TEXT, fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { height: 72, textAlignVertical: "top" },
  createBtnWrap: { borderRadius: 14, overflow: "hidden" },
  createBtn: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  createBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});

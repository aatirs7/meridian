import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../lib/auth/AuthContext";
import type { NonNegotiable, NonNegotiableType } from "@meridian/shared";
import { Screen, Txt, Loading, Notice } from "../../../components/primitives";
import { Card, Button, TextField, SegmentedToggle, TapText } from "../../../components/ui";
import { useTheme } from "../../../lib/context/ThemeContext";
import { useAppUser } from "../../../lib/context/UserContext";
import { SPACING, TYPE } from "../../../constants/theme";
import {
  useMyNonNegotiables,
  useCreateNonNegotiable,
  useUpdateNonNegotiable,
  useArchiveNonNegotiable,
  useReorderNonNegotiables,
} from "../../../lib/hooks/nonNegotiables";

type Draft = {
  id: string | null; // null = creating
  title: string;
  type: NonNegotiableType;
  targetValue: string;
  unit: string;
};

const EMPTY: Draft = { id: null, title: "", type: "binary", targetValue: "", unit: "" };

export default function ManageNonNegotiables() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { signOut } = useAuth();
  const { reset } = useAppUser();
  const { data, isLoading, isError } = useMyNonNegotiables();
  const create = useCreateNonNegotiable();
  const update = useUpdateNonNegotiable();
  const archive = useArchiveNonNegotiable();
  const reorder = useReorderNonNegotiables();

  const [draft, setDraft] = useState<Draft | null>(null);

  const active = (data ?? []).filter((n) => n.active && !n.archivedAt);
  const busy = create.isPending || update.isPending;

  function startCreate() {
    setDraft({ ...EMPTY });
  }
  function startEdit(n: NonNegotiable) {
    setDraft({
      id: n.id,
      title: n.title,
      type: n.type,
      targetValue: n.targetValue != null ? String(n.targetValue) : "",
      unit: n.unit ?? "",
    });
  }

  async function save() {
    if (!draft) return;
    const title = draft.title.trim();
    if (!title) {
      Alert.alert("Add a title");
      return;
    }
    const isTarget = draft.type === "target";
    const tv = isTarget ? parseInt(draft.targetValue, 10) : null;
    if (isTarget && (!tv || tv <= 0)) {
      Alert.alert("Set a target", "Target items need a positive number.");
      return;
    }
    try {
      if (draft.id) {
        await update.mutateAsync({
          id: draft.id,
          body: { title, targetValue: tv, unit: draft.unit.trim() || null },
        });
      } else {
        await create.mutateAsync({
          title,
          type: draft.type,
          targetValue: tv,
          unit: draft.unit.trim() || null,
        });
      }
      setDraft(null);
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    }
  }

  function confirmArchive(n: NonNegotiable) {
    Alert.alert("Archive this?", `"${n.title}" will stop counting from today. History is kept.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive", onPress: () => archive.mutate(n.id) },
    ]);
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= active.length) return;
    const reordered = [...active];
    const [item] = reordered.splice(index, 1);
    reordered.splice(next, 0, item);
    reorder.mutate({ order: reordered.map((n, i) => ({ id: n.id, sortOrder: i })) });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Txt variant="title" weight="semibold">
          Your list
        </Txt>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Txt tone="accent" weight="semibold">
            Done
          </Txt>
        </Pressable>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <Notice>Couldn&apos;t load your list. Pull back and try again.</Notice>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xxl, gap: SPACING.sm }}>
          {active.length === 0 && !draft ? (
            <Txt tone="faint" style={{ marginVertical: SPACING.lg }}>
              No non-negotiables yet. Add the things you hold yourself to every day.
            </Txt>
          ) : null}

          {active.map((n, i) => (
            <Card key={n.id}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Txt weight="medium" variant="body">
                    {n.title}
                  </Txt>
                  <Txt tone="faint" variant="caption" style={{ marginTop: 2 }}>
                    {n.type === "binary"
                      ? "Checkbox"
                      : `Target ${n.targetValue}${n.unit ? ` ${n.unit}` : ""}`}
                  </Txt>
                </View>
                <View style={styles.reorder}>
                  <Pressable onPress={() => move(i, -1)} hitSlop={6} disabled={i === 0}>
                    <Ionicons
                      name="chevron-up"
                      size={20}
                      color={i === 0 ? colors.textFaint : colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => move(i, 1)}
                    hitSlop={6}
                    disabled={i === active.length - 1}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={i === active.length - 1 ? colors.textFaint : colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>
              <View style={styles.actions}>
                <TapText label="Edit" onPress={() => startEdit(n)} tone="accent" />
                <TapText label="Archive" onPress={() => confirmArchive(n)} tone="danger" />
              </View>
            </Card>
          ))}

          {draft ? (
            <Card style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
              <Txt weight="semibold">{draft.id ? "Edit item" : "New item"}</Txt>
              <TextField
                placeholder="Title (e.g. Read, Train, Pray)"
                value={draft.title}
                onChangeText={(t) => setDraft({ ...draft, title: t })}
                autoFocus
              />
              {!draft.id ? (
                <SegmentedToggle<NonNegotiableType>
                  options={[
                    { value: "binary", label: "Checkbox" },
                    { value: "target", label: "Target" },
                  ]}
                  value={draft.type}
                  onChange={(type) => setDraft({ ...draft, type })}
                />
              ) : null}
              {draft.type === "target" ? (
                <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                  <TextField
                    placeholder="Target"
                    keyboardType="number-pad"
                    value={draft.targetValue}
                    onChangeText={(t) =>
                      setDraft({ ...draft, targetValue: t.replace(/[^0-9]/g, "") })
                    }
                    style={{ flex: 1 }}
                  />
                  <TextField
                    placeholder="Unit (pages, min)"
                    value={draft.unit}
                    onChangeText={(t) => setDraft({ ...draft, unit: t })}
                    style={{ flex: 2 }}
                  />
                </View>
              ) : null}
              <View style={{ flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setDraft(null)}
                  style={{ flex: 1 }}
                />
                <Button label="Save" onPress={save} loading={busy} style={{ flex: 1 }} />
              </View>
            </Card>
          ) : (
            <Button
              label="Add non-negotiable"
              variant="secondary"
              onPress={startCreate}
              style={{ marginTop: SPACING.md }}
            />
          )}

          <View style={{ height: SPACING.xxl }} />
          <Txt
            tone="faint"
            variant="caption"
            weight="semibold"
            style={{ textTransform: "uppercase", letterSpacing: 1.2, marginBottom: SPACING.sm }}
          >
            Appearance
          </Txt>
          <SegmentedToggle<"system" | "dark" | "light">
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
              { value: "system", label: "System" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Button
            label="Sign out"
            variant="secondary"
            onPress={async () => {
              await signOut();
              reset();
            }}
            style={{ marginTop: SPACING.lg }}
          />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  reorder: { alignItems: "center" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
});

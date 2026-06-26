import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import type { BucketStatus } from "@meridian/shared";
import { Screen, Txt, Loading, Notice } from "../../../components/primitives";
import { Card, Button, TextField, SegmentedToggle, TapText, Pill } from "../../../components/ui";
import { STATUS_LABEL, statusFor } from "../../../components/bucket";
import { useTheme } from "../../../lib/context/ThemeContext";
import { useAppUser } from "../../../lib/context/UserContext";
import { SPACING } from "../../../constants/theme";
import {
  useBucket,
  useUpdateProgress,
  useUpdateBucketItem,
  useDeleteBucketItem,
} from "../../../lib/hooks/bucket";

export default function BucketDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me, other } = useAppUser();
  const { data, isLoading } = useBucket();
  const updateProgress = useUpdateProgress();
  const updateItem = useUpdateBucketItem();
  const del = useDeleteBucketItem();

  const item = (data ?? []).find((it) => it.id === id);

  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  if (isLoading || !me || !other) return <Screen><Loading /></Screen>;
  if (!item) {
    return (
      <Screen>
        <Notice>This item is gone.</Notice>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const myStatus = statusFor(item, me.userId);
  const hisStatus = statusFor(item, other.userId);
  const myProgress = item.progress.find((p) => p.userId === me.userId);
  const hisProgress = item.progress.find((p) => p.userId === other.userId);
  // Local note state falls back to the server value until the user types.
  const noteValue = note ?? myProgress?.note ?? "";

  const outcome =
    item.mode === "challenge" && item.winnerUserId
      ? item.winnerUserId === me.userId
        ? `${me.name} won this race`
        : `${other.name} won this race`
      : item.completedAt
        ? "Both of you completed this"
        : null;

  function setStatus(status: BucketStatus) {
    updateProgress.mutate({ id: item!.id, body: { status } });
  }
  function saveNote() {
    updateProgress.mutate({ id: item!.id, body: { note: noteValue.trim() || null } });
    setNote(null);
  }
  function startEdit() {
    setEditTitle(item!.title);
    setEditDesc(item!.description ?? "");
    setEditing(true);
  }
  async function saveEdit() {
    const t = editTitle.trim();
    if (!t) {
      Alert.alert("Add a title");
      return;
    }
    await updateItem.mutateAsync({
      id: item!.id,
      body: { title: t, description: editDesc.trim() || null },
    });
    setEditing(false);
  }
  function confirmDelete() {
    Alert.alert("Delete this item?", "It will be removed for both of you.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await del.mutateAsync(item!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Txt tone="accent" weight="semibold">
            Back
          </Txt>
        </Pressable>
        {!editing ? <TapText label="Edit" onPress={startEdit} tone="secondary" /> : null}
      </View>

      <ScrollView contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.xxl }}>
        {editing ? (
          <Card style={{ gap: SPACING.sm }}>
            <TextField value={editTitle} onChangeText={setEditTitle} placeholder="Title" />
            <TextField
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Notes (optional)"
              multiline
              style={{ minHeight: 70, textAlignVertical: "top" }}
            />
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setEditing(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Save"
                onPress={saveEdit}
                loading={updateItem.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : (
          <View>
            <Txt variant="title" weight="medium">
              {item.title}
            </Txt>
            <View style={{ flexDirection: "row", gap: SPACING.xs, marginTop: SPACING.sm }}>
              <Pill label={item.kind} color={colors.textSecondary} soft={colors.surfaceHigh} />
              <Pill label={item.mode} color={colors.textSecondary} soft={colors.surfaceHigh} />
            </View>
            {item.description ? (
              <Txt tone="secondary" style={{ marginTop: SPACING.sm }}>
                {item.description}
              </Txt>
            ) : null}
            {outcome ? (
              <Txt tone="accent" weight="semibold" style={{ marginTop: SPACING.sm }}>
                {outcome}
              </Txt>
            ) : null}
          </View>
        )}

        {/* My progress */}
        <Card style={{ gap: SPACING.sm }}>
          <Txt tone="you" variant="label" weight="semibold">
            Your progress
          </Txt>
          <SegmentedToggle<BucketStatus>
            options={[
              { value: "todo", label: "Not started" },
              { value: "in_progress", label: "In progress" },
              { value: "done", label: "Done" },
            ]}
            value={myStatus}
            onChange={setStatus}
          />
          <TextField
            placeholder="A note (e.g. did this in Istanbul, 2026)"
            value={noteValue}
            onChangeText={setNote}
          />
          {note !== null && note !== (myProgress?.note ?? "") ? (
            <Button label="Save note" variant="secondary" onPress={saveNote} />
          ) : null}
        </Card>

        {/* His progress (read-only) */}
        <Card style={{ gap: SPACING.xs }}>
          <Txt tone="him" variant="label" weight="semibold">
            {other.name}
          </Txt>
          <Txt tone="secondary">{STATUS_LABEL[hisStatus]}</Txt>
          {hisProgress?.note ? (
            <Txt tone="faint" variant="caption" style={{ marginTop: 2 }}>
              “{hisProgress.note}”
            </Txt>
          ) : null}
        </Card>

        <Pressable onPress={confirmDelete} style={{ alignItems: "center", paddingVertical: SPACING.md }}>
          <Txt tone="danger" variant="label" weight="medium">
            Delete item
          </Txt>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
});

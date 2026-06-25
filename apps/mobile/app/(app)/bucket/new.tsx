import { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import type { BucketKind, BucketMode } from "@meridian/shared";
import { Screen, Txt } from "../../../components/primitives";
import { Button, TextField, SegmentedToggle } from "../../../components/ui";
import { SPACING } from "../../../constants/theme";
import { useCreateBucketItem } from "../../../lib/hooks/bucket";

export default function NewBucketItem() {
  const router = useRouter();
  const create = useCreateBucketItem();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<BucketKind>("experience");
  const [mode, setMode] = useState<BucketMode>("shared");

  async function save() {
    const t = title.trim();
    if (!t) {
      Alert.alert("Add a title");
      return;
    }
    try {
      await create.mutateAsync({
        title: t,
        description: description.trim() || null,
        kind,
        mode,
      });
      router.back();
    } catch {
      Alert.alert("Couldn't add", "Please try again.");
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Txt variant="title" weight="semibold">
          New item
        </Txt>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Txt tone="secondary" weight="medium">
            Cancel
          </Txt>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ gap: SPACING.md, paddingBottom: SPACING.xxl }}>
        <TextField
          placeholder="Title (e.g. See the northern lights)"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
        <TextField
          placeholder="Notes (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <View style={{ gap: SPACING.xs }}>
          <Label>Kind</Label>
          <SegmentedToggle<BucketKind>
            options={[
              { value: "experience", label: "Experience" },
              { value: "skill", label: "Skill" },
            ]}
            value={kind}
            onChange={setKind}
          />
        </View>

        <View style={{ gap: SPACING.xs }}>
          <Label>Mode</Label>
          <SegmentedToggle<BucketMode>
            options={[
              { value: "shared", label: "Shared" },
              { value: "challenge", label: "Challenge" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Txt tone="faint" variant="caption" style={{ marginTop: 2 }}>
            {mode === "shared"
              ? "Both work it independently. Done when you both finish."
              : "A race. First to finish takes it."}
          </Txt>
        </View>

        <Button label="Add to bucket" onPress={save} loading={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Txt tone="faint" variant="caption" weight="semibold" style={{ letterSpacing: 1 }}>
      {String(children).toUpperCase()}
    </Txt>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
});

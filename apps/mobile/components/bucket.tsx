import { View, Pressable, StyleSheet } from "react-native";
import type { BucketItem, BucketStatus, Identity } from "@meridian/shared";
import { useTheme } from "../lib/context/ThemeContext";
import { SPACING, RADIUS } from "../constants/theme";
import { Txt } from "./primitives";

export const STATUS_LABEL: Record<BucketStatus, string> = {
  todo: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export function statusFor(item: BucketItem, userId: string): BucketStatus {
  return item.progress.find((p) => p.userId === userId)?.status ?? "todo";
}

function Tag({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tag, { borderColor: colors.border }]}>
      <Txt tone="faint" variant="caption" weight="medium" style={{ letterSpacing: 0.6 }}>
        {text.toUpperCase()}
      </Txt>
    </View>
  );
}

function StatusDot({ status, color }: { status: BucketStatus; color: string }) {
  const { colors } = useTheme();
  const fill =
    status === "done" ? color : status === "in_progress" ? colors.surfaceRaised : "transparent";
  return (
    <View
      style={[
        styles.dot,
        {
          borderColor: status === "todo" ? colors.border : color,
          backgroundColor: fill,
        },
      ]}
    />
  );
}

/** One row in the shared bucket list. Shows both users' progress as dots, plus
 * a quiet winner/done label. No trophies — just words. */
export function BucketCard({
  item,
  me,
  other,
  onPress,
}: {
  item: BucketItem;
  me: Identity;
  other: Identity;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const myStatus = statusFor(item, me.userId);
  const hisStatus = statusFor(item, other.userId);

  const outcome =
    item.mode === "challenge" && item.winnerUserId
      ? item.winnerUserId === me.userId
        ? `${me.name} won`
        : `${other.name} won`
      : item.completedAt
        ? "Completed"
        : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.cardHead}>
        <Txt variant="body" weight="medium" style={{ flex: 1 }}>
          {item.title}
        </Txt>
        {outcome ? (
          <Txt tone="accent" variant="caption" weight="semibold">
            {outcome}
          </Txt>
        ) : null}
      </View>

      <View style={styles.tags}>
        <Tag text={item.kind} />
        <Tag text={item.mode} />
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressItem}>
          <StatusDot status={myStatus} color={colors.you} />
          <Txt tone="faint" variant="caption">
            {me.name} · {STATUS_LABEL[myStatus]}
          </Txt>
        </View>
        <View style={styles.progressItem}>
          <StatusDot status={hisStatus} color={colors.him} />
          <Txt tone="faint" variant="caption">
            {other.name} · {STATUS_LABEL[hisStatus]}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  tags: { flexDirection: "row", gap: SPACING.xs },
  tag: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  progressRow: { gap: SPACING.xs, marginTop: SPACING.xs },
  progressItem: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  dot: { width: 12, height: 12, borderRadius: RADIUS.full, borderWidth: 1.5 },
});

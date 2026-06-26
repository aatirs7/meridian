import { View, Pressable, StyleSheet } from "react-native";
import type { BucketItem, BucketStatus, Identity } from "@meridian/shared";
import { useTheme } from "../lib/context/ThemeContext";
import { SPACING, RADIUS } from "../constants/theme";
import { Txt } from "./primitives";
import { Pill } from "./ui";

export const STATUS_LABEL: Record<BucketStatus, string> = {
  todo: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_FILL: Record<BucketStatus, number> = {
  todo: 0,
  in_progress: 0.5,
  done: 1,
};

export function statusFor(item: BucketItem, userId: string): BucketStatus {
  return item.progress.find((p) => p.userId === userId)?.status ?? "todo";
}

/** One person's progress line: name, status word, and a short fill bar. */
function ProgressLine({
  name,
  status,
  color,
  track,
}: {
  name: string;
  status: BucketStatus;
  color: string;
  track: string;
}) {
  const fill = STATUS_FILL[status];
  return (
    <View style={styles.progressItem}>
      <View style={styles.progressMeta}>
        <View style={[styles.dot, { borderColor: status === "todo" ? track : color, backgroundColor: status === "done" ? color : "transparent" }]} />
        <Txt variant="caption" style={{ color }}>
          {name}
        </Txt>
        <Txt tone="faint" variant="caption">
          · {STATUS_LABEL[status]}
        </Txt>
      </View>
      <View style={[styles.miniTrack, { backgroundColor: track }]}>
        {fill > 0 ? <View style={{ flex: fill, backgroundColor: color }} /> : null}
        {fill < 1 ? <View style={{ flex: 1 - fill }} /> : null}
      </View>
    </View>
  );
}

/** One card in the shared bucket list. Both users' progress, plus a quiet
 * winner/done label. No trophies — just words. */
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
        ? { label: `${me.name} won`, color: colors.you, soft: colors.youSoft }
        : { label: `${other.name} won`, color: colors.him, soft: colors.himSoft }
      : item.completedAt
        ? { label: "Completed", color: colors.accent, soft: colors.himSofter }
        : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHead}>
        <Txt variant="heading" weight="medium" style={{ flex: 1 }}>
          {item.title}
        </Txt>
        {outcome ? <Pill label={outcome.label} color={outcome.color} soft={outcome.soft} /> : null}
      </View>

      <View style={styles.tags}>
        <Pill
          label={item.kind}
          color={colors.textSecondary}
          soft={colors.surfaceHigh}
        />
        <Pill
          label={item.mode}
          color={colors.textSecondary}
          soft={colors.surfaceHigh}
        />
      </View>

      <View style={styles.progressRow}>
        <ProgressLine name={me.name} status={myStatus} color={colors.you} track={colors.youSofter} />
        <ProgressLine
          name={other.name}
          status={hisStatus}
          color={colors.him}
          track={colors.himSofter}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: SPACING.sm },
  tags: { flexDirection: "row", gap: SPACING.xs },
  progressRow: { flexDirection: "row", gap: SPACING.lg },
  progressItem: { flex: 1, gap: 6 },
  progressMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 9, height: 9, borderRadius: RADIUS.full, borderWidth: 1.5 },
  miniTrack: {
    flexDirection: "row",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
});

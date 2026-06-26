import { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import {
  pctToDisplay,
  type NonNegotiable,
  type Checkin,
  type TodaySide,
  type TodayStanding,
} from "@meridian/shared";
import { useTheme } from "../lib/context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/theme";
import { Txt } from "./primitives";
import { Panel, ProgressBar } from "./ui";

/** The filled/empty completion mark. A quiet spring on toggle — the only motion. */
function CheckMark({ done, color }: { done: boolean; color: string }) {
  const { colors } = useTheme();
  const scale = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    scale.value = done
      ? withSpring(1, { damping: 12, stiffness: 220, mass: 0.6 })
      : withTiming(0, { duration: 140 });
  }, [done, scale]);

  const tickStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={[
        styles.check,
        {
          borderColor: done ? color : colors.border,
          backgroundColor: done ? color : "transparent",
        },
      ]}
    >
      <Animated.View style={tickStyle}>
        <Ionicons name="checkmark-sharp" size={16} color={colors.background} />
      </Animated.View>
    </View>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(0, value - 1))}
        hitSlop={6}
        style={({ pressed }) => [
          styles.stepBtn,
          { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={() => onChange(value + 1)}
        hitSlop={6}
        style={({ pressed }) => [
          styles.stepBtn,
          { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

/**
 * One non-negotiable as a row inside a list panel. `editable` rows (yours) react
 * to taps; the other person's render the same shape, read-only. Done rows get a
 * faint identity-tinted wash and a left accent rail.
 */
export function ItemRow({
  item,
  checkin,
  editable,
  accent,
  accentSoft,
  first,
  onSet,
}: {
  item: NonNegotiable;
  checkin: Checkin | undefined;
  editable: boolean;
  accent: string;
  accentSoft: string;
  first?: boolean;
  onSet: (value: number) => void;
}) {
  const { colors } = useTheme();
  const done = checkin?.completed ?? false;
  const value = checkin?.value ?? 0;
  const target = item.targetValue ?? 0;

  const rowBg = done ? accentSoft : "transparent";
  const railColor = done ? accent : "transparent";

  const content =
    item.type === "binary" ? (
      <>
        <Txt
          variant="body"
          style={{ flex: 1, color: done ? colors.text : colors.textSecondary }}
        >
          {item.title}
        </Txt>
        <CheckMark done={done} color={accent} />
      </>
    ) : (
      <>
        <View style={{ flex: 1 }}>
          <Txt variant="body" style={{ color: done ? colors.text : colors.textSecondary }}>
            {item.title}
          </Txt>
          <Txt tone="faint" variant="caption" style={{ marginTop: 3 }}>
            {value} / {target}
            {item.unit ? ` ${item.unit}` : ""}
          </Txt>
        </View>
        {editable ? (
          <Stepper value={value} onChange={onSet} />
        ) : (
          <Txt tone="secondary" variant="label" style={{ marginRight: SPACING.sm }}>
            {value}/{target}
          </Txt>
        )}
        <CheckMark done={done} color={accent} />
      </>
    );

  return (
    <Pressable
      disabled={!editable || item.type !== "binary"}
      onPress={() => onSet(done ? 0 : 1)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed && editable ? colors.surfaceHigh : rowBg,
          borderTopColor: colors.hairline,
          borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.rail, { backgroundColor: railColor }]} />
      {content}
    </Pressable>
  );
}

/** One big percentage with a small, tight % glyph. Shrinks to fit at 100%. */
function BigPct({ pct, color }: { pct: number | null; color: string }) {
  const display = pctToDisplay(pct);
  if (display === null) {
    return (
      <Txt weight="light" style={{ fontSize: 56, color, lineHeight: 62 }}>
        —
      </Txt>
    );
  }
  return (
    <View style={styles.pctWrap}>
      <Txt
        weight="medium"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontSize: 58, color, lineHeight: 62, letterSpacing: -1 }}
      >
        {display}
      </Txt>
      <Txt weight="regular" style={{ fontSize: 20, color, marginBottom: 8, marginLeft: 1 }}>
        %
      </Txt>
    </View>
  );
}

const STANDING: Record<TodayStanding, { label: string; tone: "you" | "him" | "secondary" | "faint" }> = {
  you_ahead: { label: "You're ahead", tone: "you" },
  him_ahead: { label: "Behind", tone: "him" },
  tied: { label: "Dead even", tone: "secondary" },
  no_contest: { label: "No contest", tone: "faint" },
};

/**
 * The hero of Today: both percentages, side by side in the two identity colors,
 * split by the meridian — a vertical hairline with a node at its center. A quiet
 * verdict sits above; twin progress bars below reinforce the gap.
 */
export function MeridianGauge({
  me,
  other,
  standing,
}: {
  me: TodaySide;
  other: TodaySide;
  standing: TodayStanding;
}) {
  const { colors } = useTheme();
  const verdict = STANDING[standing];

  return (
    <Panel style={{ paddingVertical: SPACING.lg }}>
      <View style={styles.verdictRow}>
        <View style={[styles.verdictDot, { backgroundColor: tintFor(verdict.tone, colors) }]} />
        <Txt
          variant="micro"
          weight="medium"
          tone={verdict.tone}
          style={{ textTransform: "uppercase", letterSpacing: 1.6 }}
        >
          {verdict.label}
        </Txt>
      </View>

      <View style={styles.gaugeRow}>
        <View style={styles.gaugeCol}>
          <BigPct pct={me.pct} color={colors.you} />
          <Txt tone="you" variant="label" weight="medium" style={{ marginTop: 2 }}>
            You
          </Txt>
          <Txt tone="faint" variant="caption" style={{ marginTop: 1 }}>
            {me.done}/{me.total} done
          </Txt>
        </View>

        <View style={styles.meridian}>
          <View style={[styles.meridianLine, { backgroundColor: colors.border }]} />
          <View style={[styles.node, { backgroundColor: colors.text }]} />
        </View>

        <View style={styles.gaugeCol}>
          <BigPct pct={other.pct} color={colors.him} />
          <Txt tone="him" variant="label" weight="medium" style={{ marginTop: 2 }}>
            {other.name}
          </Txt>
          <Txt tone="faint" variant="caption" style={{ marginTop: 1 }}>
            {other.done}/{other.total} done
          </Txt>
        </View>
      </View>

      <View style={styles.bars}>
        <ProgressBar pct={me.pct} color={colors.you} trackColor={colors.youSofter} />
        <ProgressBar pct={other.pct} color={colors.him} trackColor={colors.himSofter} />
      </View>
    </Panel>
  );
}

function tintFor(
  tone: "you" | "him" | "secondary" | "faint",
  colors: ReturnType<typeof useTheme>["colors"]
): string {
  if (tone === "you") return colors.you;
  if (tone === "him") return colors.him;
  if (tone === "secondary") return colors.textSecondary;
  return colors.textFaint;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    overflow: "hidden",
  },
  rail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: { flexDirection: "row", gap: SPACING.sm, marginRight: SPACING.sm },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: SPACING.md,
  },
  verdictDot: { width: 5, height: 5, borderRadius: 2.5 },
  gaugeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gaugeCol: { alignItems: "center", flex: 1 },
  pctWrap: { flexDirection: "row", alignItems: "flex-end" },
  meridian: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  meridianLine: { position: "absolute", width: 1, top: 8, bottom: 8 },
  node: {
    width: 5,
    height: 5,
    transform: [{ rotate: "45deg" }],
  },
  bars: { gap: SPACING.sm, marginTop: SPACING.lg },
});

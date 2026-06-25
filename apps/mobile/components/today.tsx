import { View, Pressable, StyleSheet } from "react-native";
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

/** The filled/empty completion mark. Quiet — no animation, just a state change. */
function CheckMark({ done, color }: { done: boolean; color: string }) {
  const { colors } = useTheme();
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
      {done ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
    </View>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(0, value - 1))}
        hitSlop={8}
        style={[styles.stepBtn, { borderColor: colors.border }]}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={() => onChange(value + 1)}
        hitSlop={8}
        style={[styles.stepBtn, { borderColor: colors.border }]}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </Pressable>
    </View>
  );
}

/**
 * One non-negotiable as a row. `editable` rows (yours) respond to taps; the
 * other person's rows render the same shape, read-only.
 */
export function ItemRow({
  item,
  checkin,
  editable,
  accent,
  onSet,
}: {
  item: NonNegotiable;
  checkin: Checkin | undefined;
  editable: boolean;
  accent: string;
  onSet: (value: number) => void;
}) {
  const { colors } = useTheme();
  const done = checkin?.completed ?? false;
  const value = checkin?.value ?? 0;

  if (item.type === "binary") {
    return (
      <Pressable
        disabled={!editable}
        onPress={() => onSet(done ? 0 : 1)}
        style={[styles.row, { borderBottomColor: colors.border }]}
      >
        <Txt variant="body" style={{ flex: 1, color: done ? colors.text : colors.textSecondary }}>
          {item.title}
        </Txt>
        <CheckMark done={done} color={accent} />
      </Pressable>
    );
  }

  // target
  const target = item.targetValue ?? 0;
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Txt variant="body" style={{ color: done ? colors.text : colors.textSecondary }}>
          {item.title}
        </Txt>
        <Txt tone="faint" variant="caption" style={{ marginTop: 2 }}>
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
    </View>
  );
}

function PctNumber({ pct, color }: { pct: number | null; color: string }) {
  const display = pctToDisplay(pct);
  return (
    <Txt variant="hero" weight="semibold" style={{ color }}>
      {display === null ? "—" : `${display}`}
      {display !== null ? <Txt variant="title" style={{ color }}>%</Txt> : null}
    </Txt>
  );
}

const STANDING_LABEL: Record<TodayStanding, string> = {
  you_ahead: "You're ahead",
  him_ahead: "He's ahead",
  tied: "Tied",
  no_contest: "No contest",
};

/** The hero of the Today screen: both percentages side by side, in the two
 * muted identity colors, with a quiet standing label between them. */
export function SideBySideStanding({
  me,
  other,
  standing,
}: {
  me: TodaySide;
  other: TodaySide;
  standing: TodayStanding;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.standing}>
      <View style={styles.standingCol}>
        <PctNumber pct={me.pct} color={colors.you} />
        <Txt tone="you" variant="label" weight="medium">
          You
        </Txt>
        <Txt tone="faint" variant="caption">
          {me.done}/{me.total}
        </Txt>
      </View>

      <View style={styles.standingMid}>
        <Txt tone="secondary" variant="caption" weight="medium" style={{ textAlign: "center" }}>
          {STANDING_LABEL[standing]}
        </Txt>
      </View>

      <View style={styles.standingCol}>
        <PctNumber pct={other.pct} color={colors.him} />
        <Txt tone="him" variant="label" weight="medium">
          {other.name}
        </Txt>
        <Txt tone="faint" variant="caption">
          {other.done}/{other.total}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepper: { flexDirection: "row", gap: SPACING.sm, marginRight: SPACING.sm },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  standing: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.lg,
  },
  standingCol: { alignItems: "center", gap: 2, flex: 1 },
  standingMid: { flex: 1, alignItems: "center" },
});

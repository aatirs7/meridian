import { useEffect, useState, type ReactNode } from "react";
import {
  View,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  type ViewProps,
  type TextInputProps,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/context/ThemeContext";
import { SPACING, RADIUS, TYPE, SHADOW } from "../constants/theme";
import { Txt } from "./primitives";

/** A flat card on the base surface — the default container for list items. */
export function Card({ children, style }: { children: ReactNode; style?: ViewProps["style"] }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * An elevated panel — the hero container. Lifted surface, larger radius, and a
 * soft shadow so the most important content (the standing, the scoreboard) reads
 * as floating just above the field.
 */
export function Panel({
  children,
  style,
  raised = true,
}: {
  children: ReactNode;
  style?: ViewProps["style"];
  raised?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
        },
        raised && SHADOW,
        style,
      ]}
    >
      {children}
    </View>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  style?: ViewProps["style"];
}) {
  const { colors } = useTheme();
  const isFilled = variant === "primary";
  const bg = isFilled ? colors.text : "transparent";
  const fg =
    variant === "primary"
      ? colors.background
      : variant === "danger"
        ? colors.danger
        : colors.text;
  const border =
    variant === "secondary" || variant === "danger" ? colors.border : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border === "transparent" ? 0 : 1,
          opacity: disabled ? 0.4 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Txt weight="semibold" style={{ color: fg, fontSize: TYPE.body, letterSpacing: 0.2 }}>
            {label}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

export function TextField({
  style,
  ...props
}: TextInputProps & { style?: TextInputProps["style"] }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: focused ? colors.accent : colors.border,
          borderWidth: 1,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.md - 2,
          color: colors.text,
          fontSize: TYPE.body,
        },
        style,
      ]}
      {...props}
    />
  );
}

/** A small pill-shaped control for picking one of N options. The active segment
 * lifts to the high surface with a hairline border; inactive options stay quiet. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.segment,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segmentItem,
              active && {
                backgroundColor: colors.surfaceHigh,
                borderColor: colors.border,
              },
            ]}
          >
            <Txt
              weight={active ? "semibold" : "regular"}
              style={{
                color: active ? colors.text : colors.textSecondary,
                fontSize: TYPE.label,
              }}
            >
              {opt.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A bare text pressable for compact row actions (Edit / Archive / Delete). */
export function TapText({
  label,
  onPress,
  tone = "secondary",
}: {
  label: string;
  onPress: () => void;
  tone?: "secondary" | "danger" | "accent";
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ paddingVertical: 4, paddingHorizontal: 6 }}>
      <Txt tone={tone} variant="label" weight="medium">
        {label}
      </Txt>
    </Pressable>
  );
}

/** A small rounded label. `color` tints both the text and a soft translucent bg. */
export function Pill({
  label,
  color,
  soft,
}: {
  label: string;
  color: string;
  soft: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: soft }]}>
      <Txt
        variant="micro"
        weight="medium"
        style={{ color, letterSpacing: 0.8, textTransform: "uppercase" }}
      >
        {label}
      </Txt>
    </View>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
    />
  );
}

/** A thin track that animates a fill to `pct` (0..1). Pixel-width based so the
 * fill animates smoothly via reanimated rather than snapping. */
export function ProgressBar({
  pct,
  color,
  trackColor,
  height = 6,
}: {
  pct: number | null;
  color: string;
  trackColor?: string;
  height?: number;
}) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const fill = useSharedValue(0);
  const target = Math.max(0, Math.min(1, pct ?? 0));

  useEffect(() => {
    fill.value = withTiming(target * w, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, w, fill]);

  const animatedStyle = useAnimatedStyle(() => ({ width: fill.value }));

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor ?? colors.surfaceHigh,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[{ height, borderRadius: height / 2, backgroundColor: color }, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  buttonInner: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm + 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
});

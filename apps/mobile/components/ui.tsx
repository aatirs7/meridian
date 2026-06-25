import type { ReactNode } from "react";
import {
  View,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  type ViewProps,
  type TextInputProps,
} from "react-native";
import { useTheme } from "../lib/context/ThemeContext";
import { SPACING, RADIUS, TYPE } from "../constants/theme";
import { Txt } from "./primitives";

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

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
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
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Txt weight="semibold" style={{ color: fg, fontSize: TYPE.body }}>
          {label}
        </Txt>
      )}
    </Pressable>
  );
}

export function TextField({
  style,
  ...props
}: TextInputProps & { style?: TextInputProps["style"] }) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      style={[
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: RADIUS.sm,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm + 2,
          color: colors.text,
          fontSize: TYPE.body,
        },
        style,
      ]}
      {...props}
    />
  );
}

/** A small segmented control for picking one of N options. */
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
              active && { backgroundColor: colors.surface, borderColor: colors.border },
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

/** A bare icon-ish pressable for compact row actions. */
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

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm - 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
});

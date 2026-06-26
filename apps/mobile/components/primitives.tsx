import type { ReactNode } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type TextProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../lib/context/ThemeContext";
import { SPACING, TYPE, fontFamilyFor } from "../constants/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** Full-screen container with safe-area padding and the theme background. */
export function Screen({
  children,
  edges = ["top", "bottom"],
  padded = true,
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  padded?: boolean;
  style?: ViewProps["style"];
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
    >
      <View style={[{ flex: 1 }, padded && { paddingHorizontal: SPACING.lg }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

type TxtVariant = keyof typeof TYPE;
type TxtTone = "default" | "secondary" | "faint" | "accent" | "you" | "him" | "danger";
type TxtWeight = "light" | "regular" | "medium" | "semibold" | "bold";

/** Themed text. Centralizes color + size so screens never hardcode hex. */
export function Txt({
  children,
  variant = "body",
  tone = "default",
  weight = "regular",
  style,
  ...rest
}: {
  children: ReactNode;
  variant?: TxtVariant;
  tone?: TxtTone;
  weight?: TxtWeight;
} & TextProps) {
  const { colors } = useTheme();
  const color =
    tone === "secondary"
      ? colors.textSecondary
      : tone === "faint"
        ? colors.textFaint
        : tone === "accent"
          ? colors.accent
          : tone === "you"
            ? colors.you
            : tone === "him"
              ? colors.him
              : tone === "danger"
                ? colors.danger
                : colors.text;
  return (
    <Text
      style={[{ color, fontSize: TYPE[variant], fontFamily: fontFamilyFor(weight) }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

/** A small uppercase section label with wide tracking — the brand's quiet eyebrow. */
export function Eyebrow({
  children,
  tone = "faint",
  style,
}: {
  children: ReactNode;
  tone?: TxtTone;
  style?: TextProps["style"];
}) {
  return (
    <Txt
      tone={tone}
      variant="micro"
      weight="medium"
      style={[{ textTransform: "uppercase", letterSpacing: 1.6 }, style]}
    >
      {children}
    </Txt>
  );
}

/**
 * The standard screen header: a large quiet title with an optional eyebrow above
 * and an optional action on the right (gear, add, Done). Generous top breathing
 * room so titles never feel jammed under the notch.
 */
export function ScreenHeader({
  title,
  eyebrow,
  right,
}: {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Eyebrow style={{ marginBottom: 4 }}>{eyebrow}</Eyebrow> : null}
        <Txt variant="title" weight="medium" style={{ letterSpacing: 0.2 }}>
          {title}
        </Txt>
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

/** A circular, bordered icon button used in headers (gear, add, back). */
export function IconButton({
  name,
  onPress,
  tone = "secondary",
}: {
  name: IoniconName;
  onPress: () => void;
  tone?: "secondary" | "default" | "accent";
}) {
  const { colors } = useTheme();
  const color =
    tone === "default" ? colors.text : tone === "accent" ? colors.accent : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Ionicons name={name} size={20} color={color} />
    </Pressable>
  );
}

/** Centered loading state. */
export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.textSecondary} />
    </View>
  );
}

/** Quiet empty/error message, centered. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.center}>
      <Txt tone="faint" variant="body" style={{ textAlign: "center", lineHeight: 22 }}>
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerRight: { marginLeft: SPACING.md },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
});

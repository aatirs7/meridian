import type { ReactNode } from "react";
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  type TextProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useTheme } from "../lib/context/ThemeContext";
import { SPACING, TYPE, fontFamilyFor } from "../constants/theme";

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
      <Txt tone="faint" variant="body" style={{ textAlign: "center" }}>
        {children}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
});

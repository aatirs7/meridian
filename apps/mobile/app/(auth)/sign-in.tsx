import { useCallback, useState } from "react";
import { View, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Txt } from "../../components/primitives";
import { useTheme } from "../../lib/context/ThemeContext";
import { useAuth, SignInError } from "../../lib/auth/AuthContext";
import { SPACING, RADIUS } from "../../constants/theme";

export default function SignIn() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signInWithApple } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onApple = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithApple();
      router.replace("/(app)/(tabs)");
    } catch (err) {
      // A user-cancelled Apple sheet throws ERR_REQUEST_CANCELED — stay quiet.
      const code = (err as { code?: string })?.code;
      if (code === "ERR_REQUEST_CANCELED") {
        // no-op
      } else if (err instanceof SignInError) {
        setError(err.message);
      } else {
        setError("Couldn't sign in with Apple. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }, [busy, signInWithApple, router]);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/mark-two-tone.png")}
            style={styles.mark}
            resizeMode="contain"
          />
          <Txt weight="light" style={[styles.wordmark, { color: colors.text }]}>
            MERIDIAN
          </Txt>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <Txt tone="secondary" variant="body" style={styles.tagline}>
            A daily high line{"\n"}we each reach for.
          </Txt>
        </View>

        <View style={styles.footer}>
          {error ? (
            <Txt tone="danger" variant="label" style={styles.error}>
              {error}
            </Txt>
          ) : null}
          <Pressable
            onPress={onApple}
            disabled={busy}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.text, opacity: pressed || busy ? 0.82 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="logo-apple" size={19} color={colors.background} style={{ marginTop: -2 }} />
                <Txt variant="body" weight="semibold" style={{ color: colors.background }}>
                  Continue with Apple
                </Txt>
              </View>
            )}
          </Pressable>
          <Txt tone="faint" variant="caption" style={styles.note}>
            Access is limited to two accounts.
          </Txt>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingVertical: SPACING.xxl },
  header: { flex: 1, justifyContent: "center", alignItems: "center" },
  mark: { width: 84, height: 94, marginBottom: SPACING.xl },
  wordmark: { fontSize: 26, letterSpacing: 8 },
  rule: { width: 28, height: 1, marginVertical: SPACING.lg },
  tagline: { textAlign: "center", lineHeight: 24 },
  footer: { gap: SPACING.md },
  button: {
    height: 54,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonInner: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  error: { textAlign: "center" },
  note: { textAlign: "center" },
});

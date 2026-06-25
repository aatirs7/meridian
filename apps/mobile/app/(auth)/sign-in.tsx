import { useCallback, useState } from "react";
import { View, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
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
          <Txt weight="light" style={styles.wordmark}>
            MERIDIAN
          </Txt>
          <Image
            source={require("../../assets/mark-two-tone.png")}
            style={styles.mark}
            resizeMode="contain"
          />
          <Txt tone="secondary" variant="body" style={styles.tagline}>
            A daily high line we each reach for.
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
              { backgroundColor: colors.text, opacity: pressed || busy ? 0.7 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Txt variant="body" weight="semibold" style={{ color: colors.background }}>
                 Continue with Apple
              </Txt>
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
  header: { marginTop: SPACING.xxl, alignItems: "center" },
  wordmark: { fontSize: 22, letterSpacing: 6.6 },
  mark: { width: 96, height: 107, marginTop: SPACING.xl },
  tagline: { marginTop: SPACING.xl, textAlign: "center" },
  footer: { gap: SPACING.md },
  button: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  error: { textAlign: "center" },
  note: { textAlign: "center" },
});

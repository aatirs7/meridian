import { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../lib/auth/AuthContext";
import { Screen, Txt, Loading } from "../../components/primitives";
import { useAppUser } from "../../lib/context/UserContext";
import { useTheme } from "../../lib/context/ThemeContext";
import { SPACING, RADIUS } from "../../constants/theme";

/** Shown when a signed-in Apple account is not one of the two allowed users. */
function Rejected() {
  const { signOut } = useAuth();
  const { reset } = useAppUser();
  const { colors } = useTheme();
  return (
    <Screen>
      <View style={styles.center}>
        <Txt variant="title" weight="medium">
          Not on the list
        </Txt>
        <Txt tone="secondary" style={styles.body}>
          Meridian is limited to two accounts. This one isn&apos;t one of them.
        </Txt>
        <Pressable
          onPress={async () => {
            await signOut();
            reset();
          }}
          style={({ pressed }) => [
            styles.button,
            { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Txt weight="medium">Sign out</Txt>
        </Pressable>
      </View>
    </Screen>
  );
}

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { ready, rejected, isLoading, refresh } = useAppUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && !ready && !rejected) {
      void refresh();
    }
  }, [isLoaded, isSignedIn, ready, rejected, refresh]);

  if (!isLoaded)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (rejected) return <Rejected />;
  if (!ready && isLoading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACING.md },
  body: { textAlign: "center", maxWidth: 280, lineHeight: 22 },
  button: {
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
});

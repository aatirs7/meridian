import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
} from "@expo-google-fonts/space-grotesk";
import { queryClient } from "../lib/queryClient";
import { ThemeProvider, useTheme } from "../lib/context/ThemeContext";
import { AuthProvider } from "../lib/auth/AuthContext";
import { UserProvider } from "../lib/context/UserContext";

SplashScreen.preventAutoHideAsync();

function Shell() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    // Nothing to load before first paint (system font), so reveal immediately.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
  });

  // Hold the native splash until the type is ready so there's no flash of the
  // system font on first paint.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <UserProvider>
                <BottomSheetModalProvider>
                  <Shell />
                </BottomSheetModalProvider>
              </UserProvider>
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0E12" },
});

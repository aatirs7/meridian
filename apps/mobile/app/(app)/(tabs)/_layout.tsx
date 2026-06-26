import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../lib/context/ThemeContext";
import { FONTS } from "../../../constants/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/** Outline when inactive, filled when active — a quiet, legible state change. */
function tabIcon(base: string) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons
      name={(focused ? base : `${base}-outline`) as IoniconName}
      size={size - 1}
      color={color}
    />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          fontFamily: FONTS.medium,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 10,
          height: 60 + insets.bottom,
        },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: tabIcon("today") }}
      />
      <Tabs.Screen
        name="tally"
        options={{ title: "Tally", tabBarIcon: tabIcon("stats-chart") }}
      />
      <Tabs.Screen
        name="bucket"
        options={{ title: "Bucket", tabBarIcon: tabIcon("planet") }}
      />
    </Tabs>
  );
}

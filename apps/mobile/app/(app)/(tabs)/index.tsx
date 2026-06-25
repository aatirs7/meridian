import { useEffect } from "react";
import { View, ScrollView, Pressable, AppState, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDisplay, type Checkin } from "@meridian/shared";
import { Screen, Txt, Loading, Notice } from "../../../components/primitives";
import { ItemRow, SideBySideStanding } from "../../../components/today";
import { useTheme } from "../../../lib/context/ThemeContext";
import { SPACING } from "../../../constants/theme";
import { useToday, useUpsertCheckin } from "../../../lib/hooks/today";
import { useNeutralDays, useToggleNeutralToday } from "../../../lib/hooks/neutralDays";

function checkinFor(checkins: Checkin[], itemId: string): Checkin | undefined {
  return checkins.find((c) => c.nonNegotiableId === itemId);
}

export default function Today() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useToday();
  const upsert = useUpsertCheckin();
  const neutralEnabled = data?.neutralDaysEnabled ?? false;
  const neutral = useNeutralDays(neutralEnabled);
  const toggleNeutral = useToggleNeutralToday();

  // Refetch when the app returns to the foreground (the poll only runs while open).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  if (isLoading) return <Screen><Loading /></Screen>;
  if (isError || !data) {
    return (
      <Screen>
        <Header onGear={() => router.push("/non-negotiables/manage")} subtitle="" />
        <Notice>Couldn&apos;t load today. Pull to refresh.</Notice>
      </Screen>
    );
  }

  const { me, other, standing } = data;

  return (
    <Screen>
      <Header
        onGear={() => router.push("/non-negotiables/manage")}
        subtitle={formatDisplay(data.date)}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textSecondary}
          />
        }
      >
        <SideBySideStanding me={me} other={other} standing={standing} />

        {neutralEnabled ? (
          <NeutralRow
            neutral={me.neutral}
            remaining={neutral.data?.remainingThisMonth ?? 0}
            busy={toggleNeutral.isPending}
            onToggle={() => toggleNeutral.mutate(!me.neutral)}
          />
        ) : null}

        <SectionLabel>Your list</SectionLabel>
        {me.items.length === 0 ? (
          <Pressable onPress={() => router.push("/non-negotiables/manage")}>
            <Txt tone="faint" style={{ paddingVertical: SPACING.md }}>
              No non-negotiables yet. Tap the gear to add the things you hold yourself to.
            </Txt>
          </Pressable>
        ) : (
          me.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              checkin={checkinFor(me.checkins, item.id)}
              editable
              accent={colors.you}
              onSet={(value) => upsert.mutate({ nonNegotiableId: item.id, value })}
            />
          ))
        )}

        <View style={{ height: SPACING.xl }} />

        <SectionLabel>{other.name}&apos;s list</SectionLabel>
        {other.items.length === 0 ? (
          <Txt tone="faint" style={{ paddingVertical: SPACING.md }}>
            Nothing here yet.
          </Txt>
        ) : (
          other.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              checkin={checkinFor(other.checkins, item.id)}
              editable={false}
              accent={colors.him}
              onSet={() => {}}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Header({ onGear, subtitle }: { onGear: () => void; subtitle: string }) {
  return (
    <View style={styles.header}>
      <View>
        <Txt variant="title" weight="semibold">
          Today
        </Txt>
        {subtitle ? (
          <Txt tone="faint" variant="caption" style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      <Pressable onPress={onGear} hitSlop={10}>
        <GearIcon />
      </Pressable>
    </View>
  );
}

function GearIcon() {
  const { colors } = useTheme();
  return <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />;
}

function NeutralRow({
  neutral,
  remaining,
  busy,
  onToggle,
}: {
  neutral: boolean;
  remaining: number;
  busy: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const canMark = neutral || remaining > 0;
  return (
    <Pressable
      onPress={canMark && !busy ? onToggle : undefined}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.lg,
        opacity: canMark ? 1 : 0.5,
      }}
    >
      <Txt tone={neutral ? "accent" : "secondary"} variant="label" weight="medium">
        {neutral ? "Today is neutral — no contest" : "Mark today neutral"}
      </Txt>
      <Txt tone="faint" variant="caption">
        {neutral ? "Undo" : `${remaining} left this month`}
      </Txt>
    </Pressable>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Txt
      tone="faint"
      variant="caption"
      weight="semibold"
      style={{ textTransform: "uppercase", letterSpacing: 1.2, marginBottom: SPACING.xs }}
    >
      {children}
    </Txt>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
});

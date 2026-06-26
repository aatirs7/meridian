import { useEffect, type ReactNode } from "react";
import { View, ScrollView, Pressable, AppState, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { formatDisplay, type Checkin } from "@meridian/shared";
import {
  Screen,
  Txt,
  Loading,
  Notice,
  ScreenHeader,
  IconButton,
} from "../../../components/primitives";
import { Card, Dot } from "../../../components/ui";
import { ItemRow, MeridianGauge } from "../../../components/today";
import { useTheme } from "../../../lib/context/ThemeContext";
import { SPACING, RADIUS } from "../../../constants/theme";
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

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen>
        <ScreenHeader
          title="Today"
          right={<IconButton name="settings-outline" onPress={() => router.push("/non-negotiables/manage")} />}
        />
        <Notice>Couldn&apos;t load today. Pull to refresh.</Notice>
      </Screen>
    );
  }

  const { me, other, standing } = data;

  return (
    <Screen>
      <ScreenHeader
        title="Today"
        eyebrow={formatDisplay(data.date)}
        right={
          <IconButton
            name="settings-outline"
            onPress={() => router.push("/non-negotiables/manage")}
          />
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxl, gap: SPACING.lg }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textSecondary}
          />
        }
      >
        <MeridianGauge me={me} other={other} standing={standing} />

        {neutralEnabled ? (
          <NeutralRow
            neutral={me.neutral}
            remaining={neutral.data?.remainingThisMonth ?? 0}
            busy={toggleNeutral.isPending}
            onToggle={() => toggleNeutral.mutate(!me.neutral)}
          />
        ) : null}

        <ListGroup
          dotColor={colors.you}
          title="Your non-negotiables"
          count={me.items.length}
        >
          {me.items.length === 0 ? (
            <EmptyRow onPress={() => router.push("/non-negotiables/manage")}>
              No non-negotiables yet. Tap to add the things you hold yourself to.
            </EmptyRow>
          ) : (
            me.items.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                checkin={checkinFor(me.checkins, item.id)}
                editable
                first={i === 0}
                accent={colors.you}
                accentSoft={colors.youSofter}
                onSet={(value) => upsert.mutate({ nonNegotiableId: item.id, value })}
              />
            ))
          )}
        </ListGroup>

        <ListGroup
          dotColor={colors.him}
          title={`${other.name}'s non-negotiables`}
          count={other.items.length}
        >
          {other.items.length === 0 ? (
            <EmptyRow>Nothing here yet.</EmptyRow>
          ) : (
            other.items.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                checkin={checkinFor(other.checkins, item.id)}
                editable={false}
                first={i === 0}
                accent={colors.him}
                accentSoft={colors.himSofter}
                onSet={() => {}}
              />
            ))
          )}
        </ListGroup>
      </ScrollView>
    </Screen>
  );
}

/** A titled, bordered group: a colored dot + label + count header over a list of
 * rows. Rows manage their own padding, so the body has none. */
function ListGroup({
  dotColor,
  title,
  count,
  children,
}: {
  dotColor: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: RADIUS.md,
        backgroundColor: colors.surface,
        overflow: "hidden",
      }}
    >
      <View style={[styles.groupHead, { borderBottomColor: colors.hairline }]}>
        <Dot color={dotColor} size={7} />
        <Txt variant="label" weight="medium" style={{ flex: 1 }}>
          {title}
        </Txt>
        {count > 0 ? (
          <Txt tone="faint" variant="caption">
            {count}
          </Txt>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function EmptyRow({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Txt tone="faint" variant="label" style={{ padding: SPACING.md, lineHeight: 20 }}>
        {children}
      </Txt>
    </Pressable>
  );
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
        borderRadius: RADIUS.md,
        backgroundColor: colors.surface,
        paddingVertical: SPACING.md - 2,
        paddingHorizontal: SPACING.md,
        opacity: canMark ? 1 : 0.5,
      }}
    >
      <Txt tone={neutral ? "accent" : "secondary"} variant="label" weight="medium">
        {neutral ? "Today is neutral — no contest" : "Mark today neutral"}
      </Txt>
      <Txt tone="faint" variant="caption">
        {neutral ? "Undo" : `${remaining} left`}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

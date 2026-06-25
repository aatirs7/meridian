import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import {
  formatDisplay,
  pctToDisplay,
  type DailyResult,
  type Identity,
} from "@meridian/shared";
import { Screen, Txt, Loading, Notice } from "../../../components/primitives";
import { useTheme } from "../../../lib/context/ThemeContext";
import { SPACING } from "../../../constants/theme";
import { useTally } from "../../../lib/hooks/tally";

export default function Tally() {
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useTally();

  if (isLoading) return <Screen><Loading /></Screen>;
  if (isError || !data) {
    return (
      <Screen>
        <Txt variant="title" weight="semibold" style={{ marginTop: SPACING.md }}>
          Tally
        </Txt>
        <Notice>Couldn&apos;t load the tally. Pull to refresh.</Notice>
      </Screen>
    );
  }

  const { me, other, wins, ties } = data;
  const myWins = wins[me.userId] ?? 0;
  const hisWins = wins[other.userId] ?? 0;

  return (
    <Screen>
      <Txt variant="title" weight="semibold" style={{ marginTop: SPACING.md }}>
        Tally
      </Txt>

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
        {/* Running record — the quiet hero numbers. */}
        <View style={styles.record}>
          <View style={styles.recordCol}>
            <Txt variant="display" weight="semibold" tone="you">
              {myWins}
            </Txt>
            <Txt tone="you" variant="label" weight="medium">
              {me.name}
            </Txt>
          </View>
          <View style={styles.recordCol}>
            <Txt variant="display" weight="semibold" tone="faint">
              {ties}
            </Txt>
            <Txt tone="faint" variant="label">
              {ties === 1 ? "tie" : "ties"}
            </Txt>
          </View>
          <View style={styles.recordCol}>
            <Txt variant="display" weight="semibold" tone="him">
              {hisWins}
            </Txt>
            <Txt tone="him" variant="label" weight="medium">
              {other.name}
            </Txt>
          </View>
        </View>

        <Txt
          tone="faint"
          variant="caption"
          weight="semibold"
          style={styles.sectionLabel}
        >
          HISTORY
        </Txt>

        {data.history.length === 0 ? (
          <Txt tone="faint" style={{ paddingVertical: SPACING.md }}>
            No finalized days yet. The first one lands after midnight ET.
          </Txt>
        ) : (
          data.history.map((r) => <Row key={r.date} result={r} me={me} other={other} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ result, me, other }: { result: DailyResult; me: Identity; other: Identity }) {
  const { colors } = useTheme();
  const mine = result.aUserId === me.userId ? result.aPct : result.bPct;
  const his = result.aUserId === other.userId ? result.aPct : result.bPct;

  const outcome =
    result.status === "no_contest"
      ? { label: "No contest", color: colors.textFaint }
      : result.winnerUserId === null
        ? { label: "Tie", color: colors.textSecondary }
        : result.winnerUserId === me.userId
          ? { label: me.name, color: colors.you }
          : { label: other.name, color: colors.him };

  const fmt = (p: number | null) => {
    const d = pctToDisplay(p);
    return d === null ? "—" : `${d}%`;
  };

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Txt variant="body">{formatDisplay(result.date)}</Txt>
        <Txt tone="faint" variant="caption" style={{ marginTop: 2 }}>
          {me.name} {fmt(mine)} · {other.name} {fmt(his)}
        </Txt>
      </View>
      <Txt variant="label" weight="semibold" style={{ color: outcome.color }}>
        {outcome.label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  record: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: SPACING.xl,
  },
  recordCol: { alignItems: "center", flex: 1, gap: 2 },
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
});

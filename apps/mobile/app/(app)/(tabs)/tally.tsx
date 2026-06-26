import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import {
  formatDisplay,
  pctToDisplay,
  type DailyResult,
  type Identity,
} from "@meridian/shared";
import { Screen, Txt, Loading, Notice, ScreenHeader, Eyebrow } from "../../../components/primitives";
import { Panel, Pill } from "../../../components/ui";
import { useTheme } from "../../../lib/context/ThemeContext";
import { SPACING, RADIUS } from "../../../constants/theme";
import { useTally } from "../../../lib/hooks/tally";

export default function Tally() {
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useTally();

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
        <ScreenHeader title="Tally" />
        <Notice>Couldn&apos;t load the tally. Pull to refresh.</Notice>
      </Screen>
    );
  }

  const { me, other, wins, ties } = data;
  const myWins = wins[me.userId] ?? 0;
  const hisWins = wins[other.userId] ?? 0;
  const total = myWins + hisWins + ties;

  return (
    <Screen>
      <ScreenHeader title="Tally" eyebrow="Lifetime record" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.textSecondary}
          />
        }
      >
        <Panel style={{ paddingVertical: SPACING.lg }}>
          <View style={styles.score}>
            <View style={styles.scoreCol}>
              <Txt weight="medium" style={{ fontSize: 56, color: colors.you, lineHeight: 60 }}>
                {myWins}
              </Txt>
              <Txt tone="you" variant="label" weight="medium">
                {me.name}
              </Txt>
            </View>

            <View style={styles.scoreMid}>
              <Txt tone="faint" weight="light" style={{ fontSize: 28 }}>
                –
              </Txt>
              {ties > 0 ? (
                <Txt tone="faint" variant="caption" style={{ marginTop: 2 }}>
                  {ties} {ties === 1 ? "tie" : "ties"}
                </Txt>
              ) : null}
            </View>

            <View style={styles.scoreCol}>
              <Txt weight="medium" style={{ fontSize: 56, color: colors.him, lineHeight: 60 }}>
                {hisWins}
              </Txt>
              <Txt tone="him" variant="label" weight="medium">
                {other.name}
              </Txt>
            </View>
          </View>

          <ShareBar
            mine={myWins}
            ties={ties}
            his={hisWins}
            you={colors.you}
            him={colors.him}
            tie={colors.textFaint}
            track={colors.surfaceHigh}
          />
          <Txt tone="faint" variant="caption" style={{ textAlign: "center", marginTop: SPACING.sm }}>
            {total === 0
              ? "No finalized days yet"
              : `${total} ${total === 1 ? "day" : "days"} settled`}
          </Txt>
        </Panel>

        <Eyebrow style={{ marginTop: SPACING.xl, marginBottom: SPACING.sm }}>History</Eyebrow>

        {data.history.length === 0 ? (
          <Txt tone="faint" variant="label" style={{ paddingVertical: SPACING.md, lineHeight: 20 }}>
            No finalized days yet. The first one lands after midnight ET.
          </Txt>
        ) : (
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: RADIUS.md,
              backgroundColor: colors.surface,
              overflow: "hidden",
            }}
          >
            {data.history.map((r, i) => (
              <Row key={r.date} result={r} me={me} other={other} first={i === 0} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

/** A proportional three-part bar: your wins, ties, his wins. */
function ShareBar({
  mine,
  ties,
  his,
  you,
  him,
  tie,
  track,
}: {
  mine: number;
  ties: number;
  his: number;
  you: string;
  him: string;
  tie: string;
  track: string;
}) {
  const total = mine + ties + his;
  if (total === 0) {
    return <View style={[styles.shareBar, { backgroundColor: track }]} />;
  }
  return (
    <View style={[styles.shareBar, { backgroundColor: track }]}>
      {mine > 0 ? <View style={{ flex: mine, backgroundColor: you }} /> : null}
      {ties > 0 ? <View style={{ flex: ties, backgroundColor: tie }} /> : null}
      {his > 0 ? <View style={{ flex: his, backgroundColor: him }} /> : null}
    </View>
  );
}

function Row({
  result,
  me,
  other,
  first,
}: {
  result: DailyResult;
  me: Identity;
  other: Identity;
  first: boolean;
}) {
  const { colors } = useTheme();
  const mine = result.aUserId === me.userId ? result.aPct : result.bPct;
  const his = result.aUserId === other.userId ? result.aPct : result.bPct;

  const outcome =
    result.status === "no_contest"
      ? { label: "No contest", color: colors.textFaint, soft: "transparent", rail: "transparent" }
      : result.winnerUserId === null
        ? { label: "Tie", color: colors.textSecondary, soft: colors.surfaceHigh, rail: colors.textFaint }
        : result.winnerUserId === me.userId
          ? { label: me.name, color: colors.you, soft: colors.youSoft, rail: colors.you }
          : { label: other.name, color: colors.him, soft: colors.himSoft, rail: colors.him };

  const fmt = (p: number | null) => {
    const d = pctToDisplay(p);
    return d === null ? "—" : `${d}%`;
  };

  return (
    <View
      style={[
        styles.row,
        { borderTopColor: colors.hairline, borderTopWidth: first ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      <View style={[styles.rowRail, { backgroundColor: outcome.rail }]} />
      <View style={{ flex: 1 }}>
        <Txt variant="body">{formatDisplay(result.date)}</Txt>
        <Txt tone="faint" variant="caption" style={{ marginTop: 3 }}>
          <Txt tone="you" variant="caption">
            {me.name} {fmt(mine)}
          </Txt>
          {"   ·   "}
          <Txt tone="him" variant="caption">
            {other.name} {fmt(his)}
          </Txt>
        </Txt>
      </View>
      <Pill label={outcome.label} color={outcome.color} soft={outcome.soft} />
    </View>
  );
}

const styles = StyleSheet.create({
  score: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  scoreCol: { alignItems: "center", flex: 1, gap: 2 },
  scoreMid: { alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.sm },
  shareBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    overflow: "hidden",
  },
  rowRail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
});

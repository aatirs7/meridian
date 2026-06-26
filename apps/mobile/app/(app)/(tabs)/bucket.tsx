import { useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { BucketKind } from "@meridian/shared";
import {
  Screen,
  Txt,
  Loading,
  Notice,
  ScreenHeader,
  IconButton,
} from "../../../components/primitives";
import { SegmentedToggle } from "../../../components/ui";
import { BucketCard } from "../../../components/bucket";
import { useTheme } from "../../../lib/context/ThemeContext";
import { useAppUser } from "../../../lib/context/UserContext";
import { SPACING } from "../../../constants/theme";
import { useBucket } from "../../../lib/hooks/bucket";

type Filter = "all" | BucketKind;

export default function Bucket() {
  const router = useRouter();
  const { colors } = useTheme();
  const { me, other } = useAppUser();
  const { data, isLoading, isError, refetch, isRefetching } = useBucket();
  const [filter, setFilter] = useState<Filter>("all");

  const items = (data ?? []).filter((it) => filter === "all" || it.kind === filter);

  return (
    <Screen>
      <ScreenHeader
        title="Bucket"
        eyebrow="Shared list"
        right={<IconButton name="add" tone="default" onPress={() => router.push("/bucket/new")} />}
      />

      <View style={{ marginBottom: SPACING.lg }}>
        <SegmentedToggle<Filter>
          options={[
            { value: "all", label: "All" },
            { value: "experience", label: "Experiences" },
            { value: "skill", label: "Skills" },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {isLoading || !me || !other ? (
        <Loading />
      ) : isError ? (
        <Notice>Couldn&apos;t load the bucket. Pull to refresh.</Notice>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xxl, gap: SPACING.sm }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.textSecondary}
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Txt tone="faint" variant="body" style={{ textAlign: "center", lineHeight: 22 }}>
                Nothing here yet.{"\n"}Add an experience to chase or a skill to master.
              </Txt>
            </View>
          ) : (
            items.map((item) => (
              <BucketCard
                key={item.id}
                item={item}
                me={me}
                other={other}
                onPress={() => router.push(`/bucket/${item.id}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: SPACING.xxl, alignItems: "center" },
});

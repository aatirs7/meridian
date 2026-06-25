import { useState } from "react";
import { View, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BucketKind } from "@meridian/shared";
import { Screen, Txt, Loading, Notice } from "../../../components/primitives";
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
      <View style={styles.header}>
        <Txt variant="title" weight="semibold">
          Bucket
        </Txt>
        <Pressable onPress={() => router.push("/bucket/new")} hitSlop={10}>
          <Ionicons name="add" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={{ marginBottom: SPACING.md }}>
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
            <Txt tone="faint" style={{ marginVertical: SPACING.lg }}>
              Nothing here yet. Add an experience to chase or a skill to master.
            </Txt>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
});

import { desc } from "drizzle-orm";
import type { TallyResponse } from "@meridian/shared";
import { withAuth, json } from "../../../lib/http";
import { db } from "../../../lib/db/client";
import { dailyResults } from "../../../lib/db/schema";
import { toDailyResult } from "../../../lib/serialize";
import { getOtherIdentity } from "../../../lib/auth/user";
import { finalizePastDays } from "../../../lib/finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 120;

/** GET — the running record (wins per user + ties) and a reverse-chronological
 * list of finalized days. `no_contest` days count toward neither tally. */
export const GET = withAuth(async (_req, me) => {
  await finalizePastDays().catch(() => {});

  const other = await getOtherIdentity(me);

  const rows = await db
    .select()
    .from(dailyResults)
    .orderBy(desc(dailyResults.date))
    .limit(HISTORY_LIMIT);

  const wins: Record<string, number> = { [me.userId]: 0, [other.userId]: 0 };
  let ties = 0;
  for (const r of rows) {
    if (r.status === "no_contest") continue;
    if (r.winnerUserId === null) {
      ties += 1;
    } else if (r.winnerUserId in wins) {
      wins[r.winnerUserId] += 1;
    } else {
      // Defensive: a winner id we don't recognize still shouldn't crash.
      wins[r.winnerUserId] = 1;
    }
  }

  const body: TallyResponse = {
    wins,
    ties,
    me: { userId: me.userId, name: me.name, slot: me.slot },
    other,
    history: rows.map(toDailyResult),
  };
  return json(body);
});

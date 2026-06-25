import { todayET, APP_TIMEZONE, type SyncResponse } from "@meridian/shared";
import { withAuth, json } from "../../../../lib/http";
import { getOtherIdentity } from "../../../../lib/auth/user";
import { neutralDaysEnabled } from "../../../../lib/config";
import { finalizePastDays } from "../../../../lib/finalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called on every app open. Ensures the user row exists (done in requireUser),
 * runs lazy day-finalization as a side effect, and returns both identities plus
 * the canonical "today" so the client renders against the same ET day the
 * server scores against.
 */
export const POST = withAuth(async (_req, me) => {
  // Lazy finalization: settle any past days that have check-ins but no result
  // row yet. Idempotent, so running it on every open is harmless.
  await finalizePastDays().catch((err) => {
    // Never let a finalization hiccup block sign-in.
    console.error("finalizePastDays failed during sync:", err);
  });

  const other = await getOtherIdentity(me);

  const body: SyncResponse = {
    me: { userId: me.userId, name: me.name, slot: me.slot },
    other: other ?? { userId: "pending", name: "—", slot: me.slot === "a" ? "b" : "a" },
    appTimezone: APP_TIMEZONE,
    today: todayET(),
    neutralDaysEnabled,
  };
  return json(body);
});

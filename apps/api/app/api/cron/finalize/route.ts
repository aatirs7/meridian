import { NextResponse } from "next/server";
import { finalizePastDays } from "../../../../lib/finalize";
import { cronSecret } from "../../../../lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily backstop for day-finalization. Lazy finalization on app open is the
 * real source of truth; this just covers a stretch where neither of us opens
 * the app. Vercel attaches `Authorization: Bearer $CRON_SECRET` to scheduled
 * requests — reject anything else so the endpoint isn't publicly triggerable.
 *
 * ET midnight drifts under DST and Vercel cron is UTC, so vercel.json schedules
 * a couple of early-ET-morning runs; idempotency makes the redundancy free.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const written = await finalizePastDays();
  return NextResponse.json({ ok: true, written });
}

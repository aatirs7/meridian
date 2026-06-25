import { NextResponse } from "next/server";
import { todayET, APP_TIMEZONE } from "@meridian/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness check. Confirms the function runs and shared code resolves. */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "meridian-api",
    timezone: APP_TIMEZONE,
    today: todayET(),
  });
}

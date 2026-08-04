import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "AETIMM-SLATRA",
    buildSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    canonSha: process.env.NEXT_PUBLIC_CANON_VERSION ?? "seed-prototype",
    timestamp: new Date().toISOString()
  });
}

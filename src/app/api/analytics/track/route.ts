import { NextResponse } from "next/server";
import crypto from "crypto";
import { analyticsSchema } from "@/lib/validation";
import { saveEvent, type AnalyticsEvent } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = analyticsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      type: parsed.data.type,
      page: parsed.data.page,
      label: parsed.data.label,
      referrer: parsed.data.referrer,
      ua: req.headers.get("user-agent") || undefined,
    };

    await saveEvent(event);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

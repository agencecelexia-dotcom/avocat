import { NextResponse } from "next/server";
import { readAnalytics } from "@/lib/storage";

export async function GET() {
  const events = await readAnalytics();
  return NextResponse.json(events);
}

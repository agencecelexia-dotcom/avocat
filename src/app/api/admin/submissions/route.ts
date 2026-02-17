import { NextResponse } from "next/server";
import {
  readSubmissions,
  updateSubmission,
  deleteSubmission,
} from "@/lib/storage";

export async function GET() {
  const subs = await readSubmissions();
  return NextResponse.json(subs);
}

export async function PATCH(req: Request) {
  try {
    const { id, ...patch } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const updated = await updateSubmission(id, patch);
    if (!updated) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const ok = await deleteSubmission(id);
    if (!ok) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

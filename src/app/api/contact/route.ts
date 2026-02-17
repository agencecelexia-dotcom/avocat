import { NextResponse } from "next/server";
import crypto from "crypto";
import { contactSchema } from "@/lib/validation";
import { saveSubmission, type Submission } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const submission: Submission = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone || "",
      domaine: parsed.data.domaine,
      urgence: parsed.data.urgence,
      situationDescription: parsed.data.situationDescription,
      read: false,
    };

    await saveSubmission(submission);

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

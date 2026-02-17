import { z } from "zod";

export const contactSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().optional().default(""),
  domaine: z.enum([
    "sejour",
    "asile",
    "oqtf",
    "famille",
    "nationalite",
    "retention",
    "visa",
    "contentieux",
    "fonction",
    "responsabilite",
    "urbanisme",
    "marches",
    "refere",
    "autre",
  ]),
  urgence: z.enum(["normal", "urgent", "extreme"]),
  situationDescription: z.string().min(10, "Décrivez votre situation (10 caractères min.)").max(5000),
});

export const analyticsSchema = z.object({
  type: z.enum(["page_view", "cta_click", "form_start", "form_submit"]),
  page: z.string().min(1),
  label: z.string().optional(),
  referrer: z.string().optional(),
});

export const DOMAINE_LABELS: Record<string, string> = {
  sejour: "Titre de séjour",
  asile: "Droit d'asile (OFPRA / CNDA)",
  oqtf: "OQTF / Éloignement",
  famille: "Regroupement familial",
  nationalite: "Nationalité française",
  retention: "Rétention administrative",
  visa: "Refus de visa",
  contentieux: "Contentieux administratif",
  fonction: "Fonction publique",
  responsabilite: "Responsabilité de l'État",
  urbanisme: "Urbanisme",
  marches: "Marchés publics",
  refere: "Référé d'urgence",
  autre: "Autre",
};

export const URGENCE_LABELS: Record<string, string> = {
  normal: "Normal",
  urgent: "Urgent (48h)",
  extreme: "Extrême urgence",
};

export const DOMAINE_ETRANGERS = ["sejour", "asile", "oqtf", "famille", "nationalite", "retention", "visa"];
export const DOMAINE_PUBLIC = ["contentieux", "fonction", "responsabilite", "urbanisme", "marches", "refere"];

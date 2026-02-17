import { promises as fs } from "fs";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const SUBMISSIONS_FILE = path.join(STORAGE_DIR, "submissions.json");
const ANALYTICS_FILE = path.join(STORAGE_DIR, "analytics.json");
const MAX_ANALYTICS = 10000;

export interface Submission {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  domaine: string;
  urgence: string;
  situationDescription: string;
  read: boolean;
}

export interface AnalyticsEvent {
  id: string;
  createdAt: string;
  type: "page_view" | "cta_click" | "form_start" | "form_submit";
  page: string;
  label?: string;
  referrer?: string;
  ua?: string;
}

async function ensureFile(filePath: string, defaultContent: string) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, defaultContent, "utf-8");
  }
}

export async function readSubmissions(): Promise<Submission[]> {
  await ensureFile(SUBMISSIONS_FILE, "[]");
  const raw = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function saveSubmission(sub: Submission): Promise<void> {
  const subs = await readSubmissions();
  subs.unshift(sub);
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(subs, null, 2), "utf-8");
}

export async function updateSubmission(
  id: string,
  patch: Partial<Submission>
): Promise<Submission | null> {
  const subs = await readSubmissions();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  subs[idx] = { ...subs[idx], ...patch };
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(subs, null, 2), "utf-8");
  return subs[idx];
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const subs = await readSubmissions();
  const filtered = subs.filter((s) => s.id !== id);
  if (filtered.length === subs.length) return false;
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}

export async function readAnalytics(): Promise<AnalyticsEvent[]> {
  await ensureFile(ANALYTICS_FILE, "[]");
  const raw = await fs.readFile(ANALYTICS_FILE, "utf-8");
  return JSON.parse(raw);
}

export async function saveEvent(event: AnalyticsEvent): Promise<void> {
  const events = await readAnalytics();
  events.unshift(event);
  const trimmed = events.slice(0, MAX_ANALYTICS);
  await fs.writeFile(ANALYTICS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

import { readSubmissions, readAnalytics } from "@/lib/storage";
import { DOMAINE_LABELS, URGENCE_LABELS, DOMAINE_ETRANGERS, DOMAINE_PUBLIC } from "@/lib/validation";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

function getDayKey(iso: string) {
  return iso.slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const [submissions, analytics] = await Promise.all([readSubmissions(), readAnalytics()]);

  const now = new Date();
  const today = getDayKey(now.toISOString());

  // --- Daily views (14 days) ---
  const dailyData: { date: string; views: number; clicks: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i);
    const key = getDayKey(d.toISOString());
    dailyData.push({ date: key, views: 0, clicks: 0 });
  }
  for (const ev of analytics) {
    const key = getDayKey(ev.createdAt);
    const entry = dailyData.find((d) => d.date === key);
    if (!entry) continue;
    if (ev.type === "page_view") entry.views++;
    if (ev.type === "cta_click") entry.clicks++;
  }

  // --- Week comparison ---
  const startThisWeek = daysAgo(6);
  const startLastWeek = daysAgo(13);
  let thisWeekViews = 0, lastWeekViews = 0;
  let thisWeekClicks = 0, lastWeekClicks = 0;
  let thisWeekSubs = 0, lastWeekSubs = 0;
  for (const ev of analytics) {
    const d = new Date(ev.createdAt);
    if (d >= startThisWeek) {
      if (ev.type === "page_view") thisWeekViews++;
      if (ev.type === "cta_click") thisWeekClicks++;
    } else if (d >= startLastWeek) {
      if (ev.type === "page_view") lastWeekViews++;
      if (ev.type === "cta_click") lastWeekClicks++;
    }
  }
  for (const s of submissions) {
    const d = new Date(s.createdAt);
    if (d >= startThisWeek) thisWeekSubs++;
    else if (d >= startLastWeek) lastWeekSubs++;
  }

  function trend(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  // --- Top pages ---
  const pageCounts: Record<string, number> = {};
  const ctaCounts: Record<string, number> = {};
  let totalViews = 0, totalClicks = 0, totalFormStart = 0, totalFormSubmit = 0;
  for (const ev of analytics) {
    if (ev.type === "page_view") {
      totalViews++;
      pageCounts[ev.page] = (pageCounts[ev.page] || 0) + 1;
    }
    if (ev.type === "cta_click") {
      totalClicks++;
      const lbl = ev.label || ev.page;
      ctaCounts[lbl] = (ctaCounts[lbl] || 0) + 1;
    }
    if (ev.type === "form_start") totalFormStart++;
    if (ev.type === "form_submit") totalFormSubmit++;
  }

  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([page, count]) => ({ page, count }));

  const topCta = Object.entries(ctaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  // --- Domaine distribution ---
  const domaineCountsMap: Record<string, number> = {};
  for (const s of submissions) {
    domaineCountsMap[s.domaine] = (domaineCountsMap[s.domaine] || 0) + 1;
  }
  const domaineDist = Object.entries(domaineCountsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      label: DOMAINE_LABELS[key] || key,
      count,
      category: DOMAINE_ETRANGERS.includes(key) ? "etrangers" : DOMAINE_PUBLIC.includes(key) ? "public" : "autre",
    }));

  // --- Urgence distribution ---
  const urgenceCounts: Record<string, number> = { normal: 0, urgent: 0, extreme: 0 };
  for (const s of submissions) {
    urgenceCounts[s.urgence] = (urgenceCounts[s.urgence] || 0) + 1;
  }

  const conversionRate = totalViews > 0 ? ((totalFormSubmit / totalViews) * 100).toFixed(1) : "0";
  const completionRate = totalFormStart > 0 ? ((totalFormSubmit / totalFormStart) * 100).toFixed(1) : "0";

  const unreadCount = submissions.filter((s) => !s.read).length;
  const urgentCount = submissions.filter((s) => s.urgence === "urgent" || s.urgence === "extreme").length;
  const thisWeekSubmissions = submissions.filter((s) => new Date(s.createdAt) >= startThisWeek).length;

  const recentEvents = analytics.slice(0, 20).map((ev) => ({
    id: ev.id,
    type: ev.type,
    page: ev.page,
    label: ev.label,
    createdAt: ev.createdAt,
  }));

  const aggregated = {
    totalSubmissions: submissions.length,
    unreadCount,
    urgentCount,
    thisWeekSubmissions,
    totalViews,
    totalClicks,
    totalFormStart,
    totalFormSubmit,
    conversionRate,
    completionRate,
    trendSubs: trend(thisWeekSubs, lastWeekSubs),
    trendViews: trend(thisWeekViews, lastWeekViews),
    trendClicks: trend(thisWeekClicks, lastWeekClicks),
    dailyData,
    topPages,
    topCta,
    domaineDist,
    urgenceCounts,
    recentEvents,
    today,
    submissions: submissions.map((s) => ({
      ...s,
      domaineLabel: DOMAINE_LABELS[s.domaine] || s.domaine,
      urgenceLabel: URGENCE_LABELS[s.urgence] || s.urgence,
    })),
  };

  return <DashboardClient data={aggregated} />;
}

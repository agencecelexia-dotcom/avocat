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

/* ================================================================
   DEMO DATA — shown when no real data exists
   ================================================================ */
function generateDemoSubmissions() {
  const now = new Date();
  const demos = [
    { firstName: "Amara", lastName: "Diallo", email: "amara.diallo@email.com", phone: "06 12 34 56 78", domaine: "sejour", urgence: "urgent", situationDescription: "Demande de renouvellement de titre de séjour en cours, convocation préfecture dans 10 jours.", daysAgo: 1, read: false },
    { firstName: "Sophie", lastName: "Martin", email: "sophie.martin@email.com", phone: "06 98 76 54 32", domaine: "oqtf", urgence: "extreme", situationDescription: "OQTF reçue il y a 5 jours, besoin d'un recours en urgence devant le tribunal administratif.", daysAgo: 2, read: false },
    { firstName: "Mohamed", lastName: "Benali", email: "m.benali@email.com", phone: "07 11 22 33 44", domaine: "asile", urgence: "normal", situationDescription: "Préparation du recours CNDA suite au rejet OFPRA. Audience prévue dans 2 mois.", daysAgo: 3, read: true },
    { firstName: "Claire", lastName: "Dupont", email: "c.dupont@email.com", phone: "06 55 44 33 22", domaine: "contentieux", urgence: "normal", situationDescription: "Contestation d'une décision administrative de refus de permis de construire.", daysAgo: 4, read: true },
    { firstName: "Youssef", lastName: "El Amrani", email: "y.elamrani@email.com", phone: "07 66 77 88 99", domaine: "famille", urgence: "urgent", situationDescription: "Regroupement familial refusé, souhait de contester la décision du consulat.", daysAgo: 5, read: true },
    { firstName: "Fatou", lastName: "Camara", email: "f.camara@email.com", phone: "06 22 33 44 55", domaine: "nationalite", urgence: "normal", situationDescription: "Demande de naturalisation par décret, dossier en cours depuis 18 mois sans réponse.", daysAgo: 7, read: true },
    { firstName: "Pierre", lastName: "Lefèvre", email: "p.lefevre@email.com", phone: "06 11 00 99 88", domaine: "fonction", urgence: "normal", situationDescription: "Litige avec l'administration concernant un refus d'avancement de grade.", daysAgo: 8, read: true },
    { firstName: "Aïcha", lastName: "Traoré", email: "a.traore@email.com", phone: "07 44 55 66 77", domaine: "visa", urgence: "urgent", situationDescription: "Refus de visa long séjour conjoint de français, besoin de recours NANTES.", daysAgo: 10, read: true },
    { firstName: "Jean-Marc", lastName: "Bernard", email: "jm.bernard@email.com", phone: "06 88 77 66 55", domaine: "urbanisme", urgence: "normal", situationDescription: "Recours contre un arrêté de péril concernant un immeuble dont je suis propriétaire.", daysAgo: 12, read: true },
    { firstName: "Mariama", lastName: "Sylla", email: "m.sylla@email.com", phone: "07 33 22 11 00", domaine: "retention", urgence: "extreme", situationDescription: "Placement en rétention administrative au CRA, audience JLD demain.", daysAgo: 0, read: false },
  ];

  return demos.map((d, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d.daysAgo);
    return {
      id: `demo-${i}`,
      createdAt: date.toISOString(),
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      domaine: d.domaine,
      urgence: d.urgence,
      situationDescription: d.situationDescription,
      read: d.read,
    };
  });
}

function generateDemoAnalytics() {
  const events: { id: string; createdAt: string; type: "page_view" | "cta_click" | "form_start" | "form_submit"; page: string; label?: string }[] = [];
  const now = new Date();
  const pages = ["/", "/expertises", "/contact", "/expertises/droit-des-etrangers", "/expertises/droit-public", "/le-cabinet"];
  const ctas = ["hero-consultation", "contact-header", "expertise-cta", "footer-contact", "urgence-banner"];

  // Generate 14 days of traffic data with round numbers
  const dailyViews = [30, 45, 50, 40, 60, 70, 80, 55, 65, 75, 90, 100, 85, 120];
  const dailyClicks = [5, 8, 10, 7, 12, 15, 18, 10, 14, 16, 20, 25, 18, 30];

  let eventId = 0;
  for (let day = 13; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Page views
    const viewCount = dailyViews[13 - day];
    for (let v = 0; v < viewCount; v++) {
      const d = new Date(date);
      d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      events.push({
        id: `demo-ev-${eventId++}`,
        createdAt: d.toISOString(),
        type: "page_view",
        page: pages[Math.floor(Math.random() * pages.length)],
      });
    }

    // CTA clicks
    const clickCount = dailyClicks[13 - day];
    for (let c = 0; c < clickCount; c++) {
      const d = new Date(date);
      d.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      events.push({
        id: `demo-ev-${eventId++}`,
        createdAt: d.toISOString(),
        type: "cta_click",
        page: "/",
        label: ctas[Math.floor(Math.random() * ctas.length)],
      });
    }

    // Form starts & submits (some days)
    if (day < 10) {
      const starts = Math.floor(clickCount * 0.4);
      const submits = Math.floor(starts * 0.6);
      for (let f = 0; f < starts; f++) {
        const d = new Date(date);
        d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
        events.push({
          id: `demo-ev-${eventId++}`,
          createdAt: d.toISOString(),
          type: "form_start",
          page: "/contact",
        });
      }
      for (let f = 0; f < submits; f++) {
        const d = new Date(date);
        d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
        events.push({
          id: `demo-ev-${eventId++}`,
          createdAt: d.toISOString(),
          type: "form_submit",
          page: "/contact",
        });
      }
    }
  }

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default async function DashboardPage() {
  const [realSubmissions, realAnalytics] = await Promise.all([readSubmissions(), readAnalytics()]);

  // Use demo data when no real data exists
  const isDemo = realSubmissions.length === 0 && realAnalytics.length === 0;
  const submissions = isDemo ? generateDemoSubmissions() : realSubmissions;
  const analytics = isDemo ? generateDemoAnalytics() : realAnalytics;

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
    isDemo,
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

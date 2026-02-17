"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ================================================================
   TYPES
   ================================================================ */
interface DailyData {
  date: string;
  views: number;
  clicks: number;
}
interface TopItem {
  page?: string;
  label?: string;
  count: number;
}
interface DomaineDist {
  key: string;
  label: string;
  count: number;
  category: string;
}
interface RecentEvent {
  id: string;
  type: string;
  page: string;
  label?: string;
  createdAt: string;
}
interface Sub {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  domaine: string;
  domaineLabel: string;
  urgence: string;
  urgenceLabel: string;
  situationDescription: string;
  read: boolean;
}
interface AggData {
  totalSubmissions: number;
  unreadCount: number;
  urgentCount: number;
  thisWeekSubmissions: number;
  totalViews: number;
  totalClicks: number;
  totalFormStart: number;
  totalFormSubmit: number;
  conversionRate: string;
  completionRate: string;
  trendSubs: number;
  trendViews: number;
  trendClicks: number;
  dailyData: DailyData[];
  topPages: TopItem[];
  topCta: TopItem[];
  domaineDist: DomaineDist[];
  urgenceCounts: Record<string, number>;
  recentEvents: RecentEvent[];
  today: string;
  submissions: Sub[];
}

/* ================================================================
   HELPERS
   ================================================================ */
const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: "grid" },
  { id: "submissions", label: "Demandes", icon: "inbox" },
  { id: "analytics", label: "Analytique", icon: "chart" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const URGENCE_COLORS: Record<string, string> = {
  normal: "bg-emerald-100 text-emerald-700",
  urgent: "bg-orange-100 text-orange-700",
  extreme: "bg-red-100 text-red-700",
};
const CATEGORY_COLORS: Record<string, string> = {
  etrangers: "#c8a96e",
  public: "#1b2d45",
  autre: "#6c7a89",
};
const DONUT_COLORS = [
  "#c8a96e",
  "#1b2d45",
  "#3a7bd5",
  "#e8a838",
  "#2c3e50",
  "#6c7a89",
  "#d4a03c",
  "#243b55",
  "#b08d4f",
  "#8b6914",
  "#4a6fa5",
  "#7c6c4f",
  "#556b2f",
  "#a0522d",
];

/* ================================================================
   SVG CHARTS
   ================================================================ */
function AreaChart({
  data,
  width = 700,
  height = 220,
  color = "#c8a96e",
  secondColor,
  secondData,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  secondColor?: string;
  secondData?: number[];
}) {
  const pad = { t: 20, r: 10, b: 30, l: 40 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const allVals = [...data, ...(secondData || [])];
  const max = Math.max(...allVals, 1);

  function pts(vals: number[]) {
    return vals.map((v, i) => ({
      x: pad.l + (i / Math.max(vals.length - 1, 1)) * w,
      y: pad.t + h - (v / max) * h,
    }));
  }

  function bezierPath(points: { x: number; y: number }[]) {
    if (points.length < 2) return "";
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  }

  function areaPath(points: { x: number; y: number }[]) {
    const line = bezierPath(points);
    return `${line} L${points[points.length - 1].x},${pad.t + h} L${points[0].x},${pad.t + h} Z`;
  }

  const p1 = pts(data);
  const p2 = secondData ? pts(secondData) : null;

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = Math.round((max / yTicks) * i);
    const y = pad.t + h - (val / max) * h;
    return { val, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        {secondColor && (
          <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={secondColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={secondColor} stopOpacity="0.02" />
          </linearGradient>
        )}
      </defs>
      {gridLines.map((g) => (
        <g key={g.val}>
          <line x1={pad.l} y1={g.y} x2={width - pad.r} y2={g.y} stroke="#e2e8f0" strokeWidth="1" />
          <text x={pad.l - 6} y={g.y + 4} textAnchor="end" fontSize="10" fill="#6c7a89">
            {g.val}
          </text>
        </g>
      ))}
      {data.map((_, i) => {
        const x = pad.l + (i / Math.max(data.length - 1, 1)) * w;
        return i % 2 === 0 ? (
          <text key={i} x={x} y={height - 6} textAnchor="middle" fontSize="9" fill="#6c7a89">
            {fmtShortDate(new Date(Date.now() - (data.length - 1 - i) * 86400000).toISOString())}
          </text>
        ) : null;
      })}
      <path d={areaPath(p1)} fill="url(#areaGrad1)" />
      <path d={bezierPath(p1)} fill="none" stroke={color} strokeWidth="2.5" />
      {p1.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2" />
      ))}
      {p2 && (
        <>
          <path d={areaPath(p2)} fill="url(#areaGrad2)" />
          <path d={bezierPath(p2)} fill="none" stroke={secondColor} strokeWidth="2" strokeDasharray="4 3" />
        </>
      )}
    </svg>
  );
}

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (total === 0)
    return <p className="text-sm text-[#6c7a89] text-center py-8">Aucune donnée</p>;
  const r = 80, cx = 100, cy = 100, sw = 28;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {slices.map((s, i) => {
          const pct = s.value / total;
          const dash = circ * pct;
          const gap = circ - dash;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={sw}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-500"
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="#2c3e50">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#6c7a89">
          demandes
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-[#6c7a89]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            {s.label} ({s.value})
          </div>
        ))}
      </div>
    </div>
  );
}

function BarRows({ items, max }: { items: { label: string; count: number }[]; max: number }) {
  if (items.length === 0) return <p className="text-sm text-[#6c7a89]">Aucune donnée</p>;
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#2c3e50] truncate mr-2">{item.label}</span>
            <span className="text-[#6c7a89] shrink-0">{item.count}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${max > 0 ? (item.count / max) * 100 : 0}%`,
                background: i === 0 ? "#c8a96e" : "#1b2d45",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   STAT CARD
   ================================================================ */
function StatCard({
  label,
  value,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  trend?: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border transition-shadow hover:shadow-md ${
        accent
          ? "bg-gradient-to-br from-[#0d1b2a] to-[#1b2d45] text-white border-[#c8a96e]/20"
          : "bg-white border-slate-200/60"
      }`}
    >
      <p className={`text-xs font-medium mb-1 ${accent ? "text-[#c8a96e]" : "text-[#6c7a89]"}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold font-[Playfair_Display,serif] ${accent ? "text-white" : "text-[#2c3e50]"}`}>
        {value}
      </p>
      {trend !== undefined && (
        <p className={`text-xs mt-1 ${trend >= 0 ? "text-emerald-500" : "text-red-400"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs sem. préc.
        </p>
      )}
    </div>
  );
}

/* ================================================================
   SIDEBAR ICONS
   ================================================================ */
function Icon({ name }: { name: string }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "w-5 h-5" };
  switch (name) {
    case "grid":
      return <svg {...props}><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case "inbox":
      return <svg {...props}><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
    case "chart":
      return <svg {...props}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case "external":
      return <svg {...props}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
    case "logout":
      return <svg {...props}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
    case "menu":
      return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case "close":
      return <svg {...props}><path d="M6 18L18 6M6 6l12 12" /></svg>;
    default:
      return null;
  }
}

/* ================================================================
   MAIN CLIENT COMPONENT
   ================================================================ */
export default function DashboardClient({ data }: { data: AggData }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [subs, setSubs] = useState(data.submissions);
  const [filterDomaine, setFilterDomaine] = useState("all");
  const [filterUrgence, setFilterUrgence] = useState("all");
  const router = useRouter();

  const unread = subs.filter((s) => !s.read).length;

  const markRead = useCallback(async (id: string) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, read: true } : s)));
    await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
  }, []);

  const deleteSub = useCallback(async (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    await fetch("/api/admin/submissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function toggleRow(id: string) {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
      const sub = subs.find((s) => s.id === id);
      if (sub && !sub.read) markRead(id);
    }
  }

  const filteredSubs = subs.filter((s) => {
    if (filterDomaine !== "all" && s.domaine !== filterDomaine) return false;
    if (filterUrgence !== "all" && s.urgence !== filterUrgence) return false;
    return true;
  });

  /* ── SIDEBAR ── */
  const sidebar = (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-[#0d1b2a] flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1b2d45] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#c8a96e]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <p className="font-[Playfair_Display,serif] text-white font-semibold text-sm leading-tight">
              Cabinet MINKO<br />MI NZE
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              tab === t.id
                ? "bg-[#c8a96e]/15 text-[#c8a96e]"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name={t.icon} />
            {t.label}
            {t.id === "submissions" && unread > 0 && (
              <span className="ml-auto bg-[#c8a96e] text-[#0d1b2a] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer links */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Icon name="external" />
          Voir le site
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/5 hover:text-red-400 transition-colors cursor-pointer"
        >
          <Icon name="logout" />
          Déconnexion
        </button>
      </div>

      {/* Secret professionnel */}
      <div className="px-4 pb-4">
        <p className="text-[9px] text-white/20 leading-tight">
          Données couvertes par le secret professionnel — Art. 66-5 loi du 31/12/1971
        </p>
      </div>
    </aside>
  );

  /* ── OVERLAY ── */
  const overlay = sidebarOpen && (
    <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
  );

  /* ── HEADER BAR ── */
  const header = (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 sm:px-6 py-3 flex items-center gap-4">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <Icon name="menu" />
      </button>
      <h1 className="font-[Playfair_Display,serif] text-lg font-bold text-[#2c3e50]">
        {TABS.find((t) => t.id === tab)?.label}
      </h1>
      <span className="ml-auto text-xs text-[#6c7a89]">{fmtDate(new Date().toISOString())}</span>
    </div>
  );

  /* ================================================================
     TAB: OVERVIEW
     ================================================================ */
  function renderOverview() {
    const donutSlices = data.domaineDist.map((d, i) => ({
      label: d.label,
      value: d.count,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));
    const maxPage = data.topPages[0]?.count || 1;
    const maxCta = data.topCta[0]?.count || 1;
    const last5 = subs.slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total demandes" value={data.totalSubmissions} trend={data.trendSubs} />
          <StatCard label="Pages vues" value={data.totalViews} trend={data.trendViews} />
          <StatCard label="Clics CTA" value={data.totalClicks} trend={data.trendClicks} />
          <StatCard label="Taux de conversion" value={`${data.conversionRate}%`} accent />
        </div>

        {data.urgentCount > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200/60 p-4 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {data.urgentCount} demande{data.urgentCount > 1 ? "s" : ""} urgente{data.urgentCount > 1 ? "s" : ""} en attente
            </p>
          </div>
        )}

        {/* Area chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Trafic — 14 derniers jours</h3>
          <div className="flex items-center gap-4 mb-3 text-xs text-[#6c7a89]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-[#c8a96e]" /> Pages vues
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-[#1b2d45] opacity-60" style={{ borderTop: "2px dashed #1b2d45" }} /> Clics CTA
            </span>
          </div>
          <AreaChart
            data={data.dailyData.map((d) => d.views)}
            secondData={data.dailyData.map((d) => d.clicks)}
            secondColor="#1b2d45"
          />
        </div>

        {/* Donut + bars side by side */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Répartition par domaine</h3>
            <DonutChart slices={donutSlices} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Top pages visitées</h3>
            <BarRows items={data.topPages.map((p) => ({ label: p.page || "", count: p.count }))} max={maxPage} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Top CTA cliqués</h3>
            <BarRows items={data.topCta.map((c) => ({ label: c.label || "", count: c.count }))} max={maxCta} />
          </div>
        </div>

        {/* Last 5 submissions */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Dernières demandes</h3>
          {last5.length === 0 ? (
            <p className="text-sm text-[#6c7a89]">Aucune demande reçue</p>
          ) : (
            <div className="space-y-2">
              {last5.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    !s.read ? "bg-[#c8a96e]/5 border border-[#c8a96e]/20" : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setTab("submissions");
                    setExpandedRow(s.id);
                    if (!s.read) markRead(s.id);
                  }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${!s.read ? "bg-[#c8a96e]" : "bg-slate-200"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2c3e50] truncate">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-[#6c7a89] truncate">{s.domaineLabel}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${URGENCE_COLORS[s.urgence]}`}>
                    {s.urgenceLabel}
                  </span>
                  <span className="text-xs text-[#6c7a89] shrink-0">{fmtDate(s.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================
     TAB: SUBMISSIONS
     ================================================================ */
  function renderSubmissions() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total demandes" value={data.totalSubmissions} />
          <StatCard label="Non lues" value={unread} accent={unread > 0} />
          <StatCard label="Urgentes" value={data.urgentCount} accent={data.urgentCount > 0} />
          <StatCard label="Cette semaine" value={data.thisWeekSubmissions} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterDomaine}
            onChange={(e) => setFilterDomaine(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-[#2c3e50] focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e] outline-none"
          >
            <option value="all">Tous les domaines</option>
            <optgroup label="Droit des Étrangers">
              <option value="sejour">Titre de séjour</option>
              <option value="asile">Droit d&apos;asile</option>
              <option value="oqtf">OQTF</option>
              <option value="famille">Regroupement familial</option>
              <option value="nationalite">Nationalité</option>
              <option value="retention">Rétention</option>
              <option value="visa">Refus de visa</option>
            </optgroup>
            <optgroup label="Droit Public">
              <option value="contentieux">Contentieux administratif</option>
              <option value="fonction">Fonction publique</option>
              <option value="responsabilite">Responsabilité de l&apos;État</option>
              <option value="urbanisme">Urbanisme</option>
              <option value="marches">Marchés publics</option>
              <option value="refere">Référé d&apos;urgence</option>
            </optgroup>
            <option value="autre">Autre</option>
          </select>
          <select
            value={filterUrgence}
            onChange={(e) => setFilterUrgence(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-[#2c3e50] focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e] outline-none"
          >
            <option value="all">Toutes urgences</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="extreme">Extrême urgence</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          {filteredSubs.length === 0 ? (
            <p className="text-sm text-[#6c7a89] p-6 text-center">Aucune demande</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSubs.map((s) => {
                const expanded = expandedRow === s.id;
                return (
                  <div key={s.id}>
                    <div
                      className={`flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                        !s.read ? "bg-[#c8a96e]/5" : ""
                      }`}
                      onClick={() => toggleRow(s.id)}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${!s.read ? "bg-[#c8a96e]" : "bg-slate-200"}`} />
                      <span className="text-xs text-[#6c7a89] shrink-0 w-20">{fmtDate(s.createdAt)}</span>
                      <span className="text-sm font-medium text-[#2c3e50] truncate flex-1">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="text-xs bg-slate-100 text-[#2c3e50] px-2 py-0.5 rounded-full hidden sm:inline">
                        {s.domaineLabel}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${URGENCE_COLORS[s.urgence]}`}>
                        {s.urgenceLabel}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`w-4 h-4 text-[#6c7a89] shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {expanded && (
                      <div className="px-5 pb-5 pt-2 bg-slate-50/50 border-t border-slate-100">
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-[10px] font-semibold text-[#6c7a89] uppercase tracking-wider mb-1">
                              Contact
                            </p>
                            <p className="text-sm text-[#2c3e50]">{s.email}</p>
                            {s.phone && <p className="text-sm text-[#2c3e50]">{s.phone}</p>}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[#6c7a89] uppercase tracking-wider mb-1">
                              Domaine / Urgence
                            </p>
                            <p className="text-sm text-[#2c3e50]">{s.domaineLabel}</p>
                            <p className="text-sm text-[#2c3e50]">{s.urgenceLabel}</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-[10px] font-semibold text-[#6c7a89] uppercase tracking-wider mb-1">
                            Description de la situation
                          </p>
                          <p className="text-sm text-[#2c3e50] whitespace-pre-wrap leading-relaxed bg-white rounded-xl p-3 border border-slate-200/60">
                            {s.situationDescription}
                          </p>
                        </div>
                        <div className="text-[10px] text-[#6c7a89] mb-3">
                          Reçu le {fmtDateTime(s.createdAt)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`mailto:${s.email}?subject=Cabinet MINKO MI NZE — Suite à votre demande`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8a96e] text-[#0d1b2a] text-xs font-semibold hover:bg-[#b08d4f] transition-colors"
                          >
                            Répondre par email
                          </a>
                          {s.phone && (
                            <a
                              href={`tel:${s.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b2d45] text-white text-xs font-semibold hover:bg-[#0d1b2a] transition-colors"
                            >
                              Appeler
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Supprimer cette demande ?")) deleteSub(s.id);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================
     TAB: ANALYTICS
     ================================================================ */
  function renderAnalytics() {
    const maxPage = data.topPages[0]?.count || 1;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Vues totales" value={data.totalViews} trend={data.trendViews} />
          <StatCard label="Clics CTA" value={data.totalClicks} trend={data.trendClicks} />
          <StatCard label="Conversion" value={`${data.conversionRate}%`} accent />
          <StatCard label="Complétion formulaire" value={`${data.completionRate}%`} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
          <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Trafic — 14 derniers jours</h3>
          <AreaChart data={data.dailyData.map((d) => d.views)} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Top pages</h3>
            <BarRows items={data.topPages.map((p) => ({ label: p.page || "", count: p.count }))} max={maxPage} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
            <h3 className="font-semibold text-sm text-[#2c3e50] mb-4">Événements récents</h3>
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-[#6c7a89]">Aucun événement</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.recentEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-slate-50">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono ${
                        ev.type === "page_view"
                          ? "bg-blue-50 text-blue-600"
                          : ev.type === "cta_click"
                            ? "bg-amber-50 text-amber-600"
                            : ev.type === "form_submit"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ev.type}
                    </span>
                    <span className="text-[#2c3e50] truncate flex-1">{ev.page}</span>
                    {ev.label && <span className="text-[#6c7a89] truncate">{ev.label}</span>}
                    <span className="text-[#6c7a89] shrink-0">{fmtDateTime(ev.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f5f0e8]/30 to-slate-50">
      {overlay}
      {sidebar}

      {/* Main area */}
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        {header}
        <div className="flex-1 p-4 sm:p-6">
          {tab === "overview" && renderOverview()}
          {tab === "submissions" && renderSubmissions()}
          {tab === "analytics" && renderAnalytics()}
        </div>
      </div>
    </div>
  );
}

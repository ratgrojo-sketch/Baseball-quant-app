// ── Design tokens ──────────────────────────────────────
export const T = {
  bg:       "#0A0F1E",
  surface:  "#111827",
  raised:   "#1D2D44",
  green:    "#16A34A",
  red:      "#EF4444",
  amber:    "#F59E0B",
  amberDim: "#78350F",
  blue:     "#3B82F6",
  orange:   "#F97316",
  muted:    "#94A3B8",
  text:     "#F1F5F9",
  textDim:  "#64748B",
  border:   "#1E293B",
};

// ── Shared style helpers ────────────────────────────────
export const S = {
  app: {
    background: T.bg,
    minHeight: "100vh",
    fontFamily: "'JetBrains Mono','Courier New',monospace",
    color: T.text,
    maxWidth: 430,
    margin: "0 auto",
    position: "relative",
    paddingBottom: 72,
  },
  topBar: {
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
    padding: "12px 16px 10px",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  topBarTitle: {
    fontFamily: "'Barlow Condensed',Impact,sans-serif",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 1,
    color: T.amber,
    margin: 0,
  },
  topBarSub: { fontSize: 11, color: T.muted, margin: 0, letterSpacing: 0.5 },
  nav: {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    background: T.raised,
    borderTop: `1px solid ${T.border}`,
    display: "flex",
    zIndex: 100,
    height: 64,
  },
  navBtn: (active) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "6px 0 8px",
    borderTop: active ? `2px solid ${T.amber}` : "2px solid transparent",
  }),
  navLabel: (active) => ({
    fontSize: 9,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 600,
    letterSpacing: 0.8,
    color: active ? T.amber : T.textDim,
    textTransform: "uppercase",
  }),
  card: {
    background: T.surface,
    borderRadius: 12,
    margin: "8px 12px",
    padding: "14px 16px",
    borderLeft: `3px solid ${T.amber}`,
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  cardN: {
    background: T.surface,
    borderRadius: 12,
    margin: "8px 12px",
    padding: "14px 16px",
    border: `1px solid ${T.border}`,
  },
  sh: {
    fontSize: 10,
    fontFamily: "'Barlow Condensed',sans-serif",
    fontWeight: 700,
    letterSpacing: 2,
    color: T.muted,
    textTransform: "uppercase",
    padding: "16px 16px 6px",
    borderBottom: `1px solid ${T.border}`,
    marginBottom: 4,
  },
  lbl: { fontSize: 10, color: T.muted, letterSpacing: 0.5, marginBottom: 2 },
  input: {
    background: T.raised,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.text,
    fontSize: 14,
    padding: "9px 12px",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "'JetBrains Mono',monospace",
  },
  select: {
    background: T.raised,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.text,
    fontSize: 13,
    padding: "9px 12px",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "'JetBrains Mono',monospace",
    appearance: "none",
  },
  btn: (c = T.amber) => ({
    background: c,
    color: c === T.amber ? "#000" : "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "'Barlow Condensed',sans-serif",
    letterSpacing: 1,
    cursor: "pointer",
    width: "100%",
    textTransform: "uppercase",
  }),
  pill: (c) => ({
    display: "inline-block",
    background: c + "22",
    color: c,
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
  }),
  edgePill: (p) => ({
    display: "inline-flex",
    alignItems: "center",
    background: p >= 5 ? T.amber : p >= 2 ? T.amberDim : T.raised,
    color: p >= 5 ? "#000" : p >= 2 ? T.amber : T.muted,
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  }),
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "56px repeat(9,1fr) 40px",
    gap: 1,
    fontSize: 11,
  },
  scoreCell: (h) => ({
    background: h ? T.raised : T.surface,
    padding: "6px 2px",
    textAlign: "center",
    color: h ? T.muted : T.text,
    fontWeight: h ? 600 : 400,
    borderRadius: 2,
  }),
};

// ── SVG Icons ───────────────────────────────────────────
export const Ico = {
  cal: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  cpu: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  bar: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  dol: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  usr: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  chev: (c, d = "down") => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"
      style={{ transform: d === "up" ? "rotate(180deg)" : "none" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  bug: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M9 9V5a3 3 0 0 1 6 0v4"/>
      <path d="M12 21a7 7 0 0 1-7-7v-2h14v2a7 7 0 0 1-7 7z"/>
      <line x1="12" y1="14" x2="12" y2="18"/>
    </svg>
  ),
  search: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  x: (c) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  check: (c) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  refresh: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  warn: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  cloud: (c) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
};

// ── Shared utils ────────────────────────────────────────
export function todayStr() {
  return new Date().toISOString().split("T")[0];
}
export function fmtDate(s) {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
export function clamp(v, mn, mx) {
  return Math.max(mn, Math.min(mx, v));
}
export function fmtAgo(isoStr) {
  if (!isoStr) return "desconocido";
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60)    return "hace unos segundos";
  if (diff < 3600)  return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}
export function isStale(isoStr, hoursThreshold = 4) {
  if (!isoStr) return true;
  return (Date.now() - new Date(isoStr).getTime()) > hoursThreshold * 3600 * 1000;
}

// ── Poisson Monte Carlo ─────────────────────────────────
export function samplePoisson(lam) {
  const L = Math.exp(-lam);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}
export function runSim(hL, aL, N = 6000) {
  let hw = 0, ti = 0;
  for (let i = 0; i < N; i++) {
    const h = samplePoisson(hL), a = samplePoisson(aL);
    if (h > a) hw++; else if (h === a) ti++;
  }
  return {
    homeWinPct: ((hw + ti * 0.5) / N * 100).toFixed(1),
    awayWinPct: (((N - hw - ti * 0.5)) / N * 100).toFixed(1),
  };
}

// ── Empty state factories ───────────────────────────────
export const POSITIONS = ["C","1B","2B","3B","SS","LF","CF","RF","DH"];
export const HANDS     = ["R","L","S"];
export const emptyLU   = () => Array.from({ length: 9 }, (_, i) => ({ name: "", pos: POSITIONS[i] || "DH", hand: "R" }));
export const emptyP    = () => ({ playerId: null, name: "", hand: "R", era: "", fip: "", xfip: "", siera: "", kpct: "", bbpct: "", whip: "", war: "" });
export const emptyBP   = () => ({ era: "", whip: "", k9: "", lob: "", fatigue: 0 });

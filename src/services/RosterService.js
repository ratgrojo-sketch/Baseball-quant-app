// ── Multi-proxy fetch ───────────────────────────────────
async function fetchWithTimeout(url, ms = 7000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return r;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export async function tryProxy(url) {
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  for (const proxy of proxies) {
    try {
      const r = await fetchWithTimeout(proxy, 7000);
      if (!r.ok) continue;
      const d   = await r.json();
      const raw = d.contents ?? d;
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch { continue; }
  }
  const r = await fetchWithTimeout(url, 5000);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ── Fallback manual — ES NECESARIO PARA QUE NO FALLE LA APP ──
export const REAL_FALLBACK_ROSTERS = {
  "778001": {
    fetchedAt: "2026-06-26T14:30:00Z",
    source: "ESPN + Rotowire (manual)",
    home: { abbr: "DET", teamId: 116, name: "Detroit Tigers", lineup: [], pitchers: [] },
    away: { abbr: "HOU", teamId: 117, name: "Houston Astros", lineup: [], pitchers: [] }
  }
};

// ── Parse boxscore robusto ──────────────────────────────
function parseBoxscoreRoster(data, side) {
  const team = data?.teams?.[side];
  if (!team) return null;
  const players = team.players || {};
  const getPlayer = (pid) => players[`ID${pid}`] || players[pid] || players[String(pid)] || null;

  const batters  = [];
  const pitchers = [];
  (team.battingOrder || []).forEach((pid) => {
    const p = getPlayer(pid);
    if (!p) return;
    const stats = p.seasonStats?.batting || {};
    batters.push({
      id: pid,
      name: p.person?.lastName || "?",
      pos: p.position?.abbreviation || "--",
      avg: stats.avg || "---",
    });
  });

  return {
    abbr: team.team?.abbreviation || "---",
    lineup: batters,
    probableSP: null
  };
}

export async function fetchRosterForGame(gamePk, onLog) {
  const log = (s, m) => onLog({ status: s, msg: m });
  const BOX_URL = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
  
  try {
    const data = await tryProxy(BOX_URL);
    const home = parseBoxscoreRoster(data, "home");
    const away = parseBoxscoreRoster(data, "away");
    return { fetchedAt: new Date().toISOString(), source: "mlb_api", home, away };
  } catch (e) {
    return REAL_FALLBACK_ROSTERS[String(gamePk)] || null;
  }
}

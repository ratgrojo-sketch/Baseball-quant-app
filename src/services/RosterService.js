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

// ── Parse boxscore robusto ──────────────────────────────
function parseBoxscoreRoster(data, side) {
  const team = data?.teams?.[side];
  if (!team) return null;
  
  const players = team.players || {};
  const getPlayer = (pid) => players[`ID${pid}`] || players[pid] || players[String(pid)] || null;

  const batters  = [];
  const pitchers = [];
  const pitcherIds = new Set((team.pitchers || []).map(String));

  (team.battingOrder || []).forEach((pid) => {
    const p = getPlayer(pid);
    if (!p) return;
    const stats = p.seasonStats?.batting || {};
    batters.push({
      id: pid,
      name: p.person?.lastName || p.person?.fullName?.split(" ").slice(-1)[0] || "?",
      fullName: p.person?.fullName || "",
      pos: p.position?.abbreviation || "--",
      hand: p.batSide?.code || "R",
      avg: stats.avg || "---",
      obp: stats.obp || "---",
      slg: stats.slg || "---",
      hr: stats.homeRuns || 0,
      rbi: stats.rbi || 0,
      ab: stats.atBats || 0,
    });
  });

  [...pitcherIds].forEach((pid) => {
    const p = getPlayer(pid);
    if (!p) return;
    const stats = p.seasonStats?.pitching || {};
    const gs = stats.gamesStarted || 0;
    pitchers.push({
      id: parseInt(pid),
      name: p.person?.fullName || "?",
      hand: p.pitchHand?.code || "R",
      era: stats.era || "--",
      whip: stats.whip || "--",
      role: gs > 0 ? "SP" : "RP",
    });
  });

  return {
    abbr: team.team?.abbreviation || "---",
    teamId: team.team?.id,
    name: team.team?.name || "",
    pitchers: pitchers.filter(p => p.role === "SP"),
    bullpen: pitchers.filter(p => p.role === "RP"),
    lineup: batters,
    probableSP: pitchers.find(p => p.role === "SP") || null,
  };
}

// ── Main entry point ────────────────────────────────────
export async function fetchRosterForGame(gamePk, onLog) {
  const log = (s, m, d = "") => onLog({ ts: new Date().toLocaleTimeString("es-MX"), status: s, msg: m, detail: d });
  const BOX_URL = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
  
  try {
    log("loading", "Intentando boxscore API...");
    const data = await tryProxy(BOX_URL);
    const home = parseBoxscoreRoster(data, "home");
    const away = parseBoxscoreRoster(data, "away");
    if (home && away && (home.lineup.length > 0 || away.lineup.length > 0)) {
      log("ok", "Roster cargado exitosamente");
      return { fetchedAt: new Date().toISOString(), source: "mlb_boxscore_api", home, away };
    }
  } catch (e) {
    log("warn", "Fallo en API: " + e.message);
  }
  return null;
}

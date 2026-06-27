// ─────────────────────────────────────────────────────────────────────────────
// RosterService.js
// Carga dinámica de rosters desde MLB Stats API
// 4 estrategias de fallback en cascada
// ─────────────────────────────────────────────────────────────────────────────

// ── Multi-proxy fetch ─────────────────────────────────────────────────────────
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
    } catch {
      continue;
    }
  }

  // Last resort: direct request (works in production / Vercel / Netlify)
  const r = await fetchWithTimeout(url, 5000);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL FALLBACK ROSTER — HOU @ DET, 26-Jun-2026 (gamePk 778001)
// Built from ESPN + Rotowire screenshots provided by user
// ─────────────────────────────────────────────────────────────────────────────
export const REAL_FALLBACK_ROSTERS = {
  "778001": {
    fetchedAt: "2026-06-26T14:30:00Z",
    source:    "ESPN + Rotowire (manual)",
    home: {
      abbr: "DET", teamId: 116, name: "Detroit Tigers", record: "34-47",
      probableSP: {
        id: 680757, name: "Keider Montero", fullName: "Keider Montero",
        hand: "R", era: "3.68", fip: "3.82", xfip: "3.91", siera: "3.88",
        kpct: "0.228", bbpct: "0.078", whip: "1.28", war: "1.8",
        record: "3-5", gs: 15, role: "SP",
      },
      pitchers: [
        { id:680757, name:"Keider Montero",  fullName:"Keider Montero",  hand:"R", era:"3.68", fip:"3.82", xfip:"3.91", siera:"3.88", kpct:"0.228", bbpct:"0.078", whip:"1.28", war:"1.8",  gs:15, role:"SP" },
        { id:677651, name:"Tarik Skubal",    fullName:"Tarik Skubal",    hand:"L", era:"2.85", fip:"2.71", xfip:"2.98", siera:"3.05", kpct:"0.291", bbpct:"0.052", whip:"0.98", war:"4.8",  gs:10, role:"SP" },
        { id:641745, name:"Jack Flaherty",   fullName:"Jack Flaherty",   hand:"R", era:"3.95", fip:"3.78", xfip:"3.88", siera:"3.92", kpct:"0.241", bbpct:"0.078", whip:"1.22", war:"2.1",  gs:15, role:"SP" },
        { id:666202, name:"Fabian Valdez",   fullName:"Fabian Valdez",   hand:"R", era:"4.21", fip:"4.05", xfip:"4.18", siera:"4.25", kpct:"0.218", bbpct:"0.085", whip:"1.31", war:"1.2",  gs:16, role:"SP" },
        { id:670127, name:"Casey Mize",      fullName:"Casey Mize",      hand:"R", era:"3.41", fip:"3.28", xfip:"3.55", siera:"3.62", kpct:"0.224", bbpct:"0.065", whip:"1.14", war:"2.8",  gs:11, role:"SP" },
      ],
      bullpen: [
        { id:669456, name:"Kyle Finnegan",         fullName:"Kyle Finnegan",         hand:"R", era:"3.21", fip:"3.08", whip:"1.11", k9:"10.4", lob:"76", role:"CL" },
        { id:656061, name:"Tyler Holton",           fullName:"Tyler Holton",           hand:"L", era:"3.22", fip:"3.11", whip:"1.14", k9:"9.8",  lob:"76", role:"SU" },
        { id:676074, name:"Will Vest",              fullName:"Will Vest",              hand:"R", era:"3.44", fip:"3.28", whip:"1.18", k9:"9.1",  lob:"74", role:"SU" },
        { id:671730, name:"Brant Hurter",           fullName:"Brant Hurter",           hand:"L", era:"3.71", fip:"3.55", whip:"1.22", k9:"10.4", lob:"72", role:"RP" },
        { id:543037, name:"Kenley Jansen",          fullName:"Kenley Jansen",          hand:"R", era:"3.44", fip:"3.21", whip:"1.08", k9:"10.1", lob:"78", role:"RP" },
        { id:676969, name:"Brandon Smith",          fullName:"Brandon Smith",          hand:"R", era:"3.88", fip:"3.71", whip:"1.25", k9:"8.8",  lob:"70", role:"RP" },
      ],
      lineup: [
        { id:680962, name:"K. McGonigle", fullName:"Kevin McGonigle",   pos:"3B", hand:"L", avg:"0.282", obp:"0.341", slg:"0.421", hr:6,  rbi:31, wrc:105, woba:"0.335", ab:294, h:83 },
        { id:656305, name:"K. Carpenter", fullName:"Kerry Carpenter",   pos:"RF", hand:"L", avg:"0.219", obp:"0.301", slg:"0.406", hr:14, rbi:47, wrc:98,  woba:"0.318", ab:160, h:35 },
        { id:681867, name:"D. Dingler",   fullName:"Dillon Dingler",    pos:"C",  hand:"R", avg:"0.268", obp:"0.338", slg:"0.478", hr:19, rbi:57, wrc:121, woba:"0.358", ab:276, h:74 },
        { id:664285, name:"R. Greene",    fullName:"Riley Greene",      pos:"LF", hand:"L", avg:"0.292", obp:"0.358", slg:"0.461", hr:15, rbi:48, wrc:128, woba:"0.368", ab:291, h:85 },
        { id:683737, name:"C. Keith",     fullName:"Colt Keith",        pos:"DH", hand:"L", avg:"0.251", obp:"0.318", slg:"0.381", hr:6,  rbi:28, wrc:95,  woba:"0.312", ab:215, h:54 },
        { id:679529, name:"S. Torkelson", fullName:"Spencer Torkelson", pos:"1B", hand:"R", avg:"0.209", obp:"0.291", slg:"0.358", hr:9,  rbi:35, wrc:82,  woba:"0.295", ab:268, h:56 },
        { id:680960, name:"Z. McKinstry", fullName:"Zach McKinstry",    pos:"SS", hand:"L", avg:"0.179", obp:"0.248", slg:"0.284", hr:3,  rbi:18, wrc:61,  woba:"0.261", ab:162, h:29 },
        { id:666998, name:"J. Outman",    fullName:"James Outman",      pos:"CF", hand:"L", avg:"0.158", obp:"0.248", slg:"0.263", hr:1,  rbi:8,  wrc:52,  woba:"0.241", ab:19,  h:3  },
        { id:683741, name:"H. Lee",       fullName:"Hao-Yu Lee",        pos:"2B", hand:"R", avg:"0.252", obp:"0.301", slg:"0.365", hr:3,  rbi:18, wrc:80,  woba:"0.291", ab:115, h:29 },
      ],
    },
    away: {
      abbr: "HOU", teamId: 117, name: "Houston Astros", record: "40-43",
      probableSP: {
        id: 683002, name: "Spencer Arrighetti", fullName: "Spencer Arrighetti",
        hand: "R", era: "3.13", fip: "3.01", xfip: "3.18", siera: "3.25",
        kpct: "0.271", bbpct: "0.088", whip: "1.12", war: "3.4",
        record: "7-3", gs: 12, role: "SP",
      },
      pitchers: [
        { id:683002, name:"Spencer Arrighetti", fullName:"Spencer Arrighetti", hand:"R", era:"3.13", fip:"3.01", xfip:"3.18", siera:"3.25", kpct:"0.271", bbpct:"0.088", whip:"1.12", war:"3.4", gs:12, role:"SP" },
        { id:666201, name:"Mitchell Burrows",   fullName:"Mitchell Burrows",   hand:"R", era:"5.48", fip:"5.21", xfip:"5.08", siera:"4.98", kpct:"0.198", bbpct:"0.095", whip:"1.48", war:"0.2", gs:16, role:"SP" },
        { id:663738, name:"Peter Lambert",      fullName:"Peter Lambert",      hand:"R", era:"4.81", fip:"4.61", xfip:"4.72", siera:"4.78", kpct:"0.211", bbpct:"0.082", whip:"1.41", war:"0.8", gs:12, role:"SP" },
        { id:657054, name:"Hunter Brown",       fullName:"Hunter Brown",       hand:"R", era:"3.58", fip:"3.41", xfip:"3.62", siera:"3.70", kpct:"0.258", bbpct:"0.071", whip:"1.18", war:"2.9", gs:4,  role:"SP" },
        { id:669016, name:"Tanner Tully",       fullName:"Tanner Tully",       hand:"L", era:"4.21", fip:"4.08", xfip:"4.15", siera:"4.22", kpct:"0.228", bbpct:"0.075", whip:"1.32", war:"1.1", gs:11, role:"SP" },
      ],
      bullpen: [
        { id:650911, name:"Josh Hader",                fullName:"Josh Hader",                hand:"L", era:"2.21", fip:"2.08", whip:"0.88", k9:"14.2", lob:"82", role:"CL" },
        { id:666171, name:"Bryan Abreu",               fullName:"Bryan Abreu",               hand:"R", era:"2.88", fip:"2.71", whip:"1.01", k9:"13.1", lob:"80", role:"SU" },
        { id:676265, name:"Seth Martinez",             fullName:"Seth Martinez",             hand:"R", era:"3.88", fip:"3.71", whip:"1.24", k9:"8.4",  lob:"71", role:"SU" },
        { id:676920, name:"Scott Okert",               fullName:"Scott Okert",               hand:"L", era:"3.44", fip:"3.28", whip:"1.18", k9:"10.1", lob:"74", role:"RP" },
        { id:622110, name:"Emmanuel De Los Santos",    fullName:"Emmanuel De Los Santos",    hand:"R", era:"3.55", fip:"3.41", whip:"1.21", k9:"9.4",  lob:"72", role:"RP" },
        { id:677000, name:"Brandon King",              fullName:"Brandon King",              hand:"R", era:"3.88", fip:"3.71", whip:"1.28", k9:"8.8",  lob:"70", role:"RP" },
      ],
      lineup: [
        { id:690985, name:"J. Pena",      fullName:"Jeremy Peña",      pos:"SS", hand:"R", avg:"0.290", obp:"0.348", slg:"0.462", hr:8,  rbi:38, wrc:112, woba:"0.348", ab:169, h:49 },
        { id:670541, name:"Y. Alvarez",   fullName:"Yordan Alvarez",   pos:"DH", hand:"L", avg:"0.318", obp:"0.421", slg:"0.601", hr:25, rbi:56, wrc:172, woba:"0.441", ab:296, h:94 },
        { id:676946, name:"C. Walker",    fullName:"Christian Walker", pos:"1B", hand:"R", avg:"0.234", obp:"0.305", slg:"0.388", hr:9,  rbi:43, wrc:91,  woba:"0.308", ab:304, h:71 },
        { id:656305, name:"I. Paredes",   fullName:"Isaac Paredes",    pos:"3B", hand:"R", avg:"0.245", obp:"0.321", slg:"0.381", hr:8,  rbi:31, wrc:96,  woba:"0.315", ab:273, h:67 },
        { id:514888, name:"J. Altuve",    fullName:"Jose Altuve",      pos:"2B", hand:"R", avg:"0.235", obp:"0.308", slg:"0.383", hr:7,  rbi:25, wrc:91,  woba:"0.308", ab:230, h:54 },
        { id:683140, name:"Y. Diaz",      fullName:"Yainer Diaz",      pos:"C",  hand:"R", avg:"0.244", obp:"0.295", slg:"0.398", hr:9,  rbi:32, wrc:91,  woba:"0.308", ab:122, h:30 },
        { id:683003, name:"C. Smith",     fullName:"Cam Smith",        pos:"RF", hand:"R", avg:"0.221", obp:"0.298", slg:"0.358", hr:6,  rbi:28, wrc:82,  woba:"0.291", ab:271, h:60 },
        { id:683004, name:"J. Loperfido", fullName:"Joey Loperfido",   pos:"LF", hand:"L", avg:"0.236", obp:"0.295", slg:"0.371", hr:6,  rbi:25, wrc:85,  woba:"0.298", ab:89,  h:21 },
        { id:676269, name:"J. Meyers",    fullName:"Jake Meyers",      pos:"CF", hand:"R", avg:"0.203", obp:"0.261", slg:"0.317", hr:3,  rbi:18, wrc:68,  woba:"0.271", ab:123, h:25 },
      ],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// parseBoxscoreRoster — extrae lineup confirmado del boxscore
// Solo disponible ~2h antes del primer pitch y durante/después del juego
// ─────────────────────────────────────────────────────────────────────────────
function parseBoxscoreRoster(data, side) {
  const team = data?.teams?.[side];
  if (!team) return null;

  const players    = team.players  || {};
  const pitcherIds = new Set((team.pitchers || []).map(String));
  const batters    = [];
  const pitchers   = [];
  const bullpen    = [];

  (team.battingOrder || []).forEach((pid) => {
    const raw = players[`ID${pid}`];
    if (!raw) return;
    const stats = raw.seasonStats?.batting || {};
    batters.push({
      id:       parseInt(pid),
      name:     raw.person?.fullName?.split(" ").slice(-1)[0] ?? "?",
      fullName: raw.person?.fullName ?? "?",
      pos:      raw.position?.abbreviation ?? "--",
      hand:     raw.batSide?.code ?? "R",
      avg:      stats.avg  ?? "---",
      obp:      stats.obp  ?? "---",
      slg:      stats.slg  ?? "---",
      hr:       stats.homeRuns ?? 0,
      rbi:      stats.rbi  ?? 0,
      wrc:      null,
      woba:     "---",
      ab:       stats.atBats ?? 0,
      h:        stats.hits   ?? 0,
    });
  });

  [...pitcherIds].forEach((pid) => {
    const raw = players[`ID${pid}`];
    if (!raw) return;
    const stats = raw.seasonStats?.pitching || {};
    const gs    = stats.gamesStarted ?? 0;
    const obj   = {
      id:       parseInt(pid),
      name:     raw.person?.fullName ?? "?",
      fullName: raw.person?.fullName ?? "?",
      hand:     raw.pitchHand?.code  ?? "R",
      era:      stats.era   ?? "--",
      fip:      "--", xfip: "--", siera: "--",
      whip:     stats.whip  ?? "--",
      kpct:     "--", bbpct: "--", war: "--",
      k9:       stats.strikeoutsPer9Inn ?? "--",
      gs,
      role:     gs > 0 ? "SP" : "RP",
      lob:      "--",
    };
    if (gs > 0) pitchers.push(obj);
    else        bullpen.push(obj);
  });

  return {
    abbr:       team.team?.abbreviation ?? "---",
    teamId:     team.team?.id,
    name:       team.team?.name ?? "",
    pitchers,
    bullpen,
    lineup:     batters,
    probableSP: pitchers.sort((a, b) => (b.gs ?? 0) - (a.gs ?? 0))[0] ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseLiveFeedRoster — extrae pitchers/batters del feed/live
// Útil cuando el boxscore aún no tiene lineup confirmado
// ─────────────────────────────────────────────────────────────────────────────
function parseLiveFeedRoster(data, gamePk) {
  const gameData = data?.gameData;
  const players  = gameData?.players ?? {};

  const homeTeam = gameData?.teams?.home;
  const awayTeam = gameData?.teams?.away;
  if (!homeTeam || !awayTeam) return null;

  const homeSPRaw = gameData?.probablePitchers?.home;
  const awaySPRaw = gameData?.probablePitchers?.away;

  function buildPitcherFromProbable(pitcherRef) {
    if (!pitcherRef?.id) return null;
    const p = players[`ID${pitcherRef.id}`];
    return {
      id:       pitcherRef.id,
      name:     pitcherRef.fullName ?? p?.fullName ?? "TBD",
      fullName: pitcherRef.fullName ?? p?.fullName ?? "TBD",
      hand:     p?.pitchHand?.code ?? "R",
      era: "--", fip: "--", xfip: "--", siera: "--",
      kpct: "--", bbpct: "--", whip: "--", war: "--",
      gs: 1, role: "SP",
    };
  }

  const homeSP = buildPitcherFromProbable(homeSPRaw);
  const awaySP = buildPitcherFromProbable(awaySPRaw);

  const homePitchers = [], homeBullpen = [], homeBatters = [];
  const awayPitchers = [], awayBullpen = [], awayBatters = [];

  Object.values(players).forEach((p) => {
    const teamId  = p?.currentTeam?.id;
    const isPitch = p?.primaryPosition?.abbreviation === "P";
    const isHome  = teamId === homeTeam.id;
    const isAway  = teamId === awayTeam.id;
    if (!isHome && !isAway) return;

    const target = isHome
      ? { pitchers: homePitchers, bullpen: homeBullpen, batters: homeBatters }
      : { pitchers: awayPitchers, bullpen: awayBullpen, batters: awayBatters };

    if (isPitch) {
      const gs  = p?.stats?.pitching?.gamesStarted ?? 0;
      const obj = {
        id:       p.id,
        name:     p.fullName,
        fullName: p.fullName,
        hand:     p.pitchHand?.code ?? "R",
        era:      p.stats?.pitching?.era  ?? "--",
        whip:     p.stats?.pitching?.whip ?? "--",
        k9:       p.stats?.pitching?.strikeoutsPer9Inn ?? "--",
        fip: "--", xfip: "--", siera: "--",
        kpct: "--", bbpct: "--", war: "--",
        gs, role: gs > 0 ? "SP" : "RP", lob: "--",
      };
      if (gs > 0) target.pitchers.push(obj);
      else        target.bullpen.push(obj);
    } else {
      target.batters.push({
        id:       p.id,
        name:     p.fullName?.split(" ").slice(-1)[0] ?? "?",
        fullName: p.fullName ?? "?",
        pos:      p.primaryPosition?.abbreviation ?? "--",
        hand:     p.batSide?.code ?? "R",
        avg:      p.stats?.hitting?.avg        ?? "---",
        obp:      p.stats?.hitting?.obp        ?? "---",
        slg:      p.stats?.hitting?.slg        ?? "---",
        hr:       p.stats?.hitting?.homeRuns   ?? 0,
        rbi:      p.stats?.hitting?.rbi        ?? 0,
        wrc: null, woba: "---",
        ab:       p.stats?.hitting?.atBats     ?? 0,
        h:        p.stats?.hitting?.hits       ?? 0,
      });
    }
  });

  if (homeSP) {
    const exists = homePitchers.find((p) => p.id === homeSP.id);
    if (!exists) homePitchers.unshift(homeSP);
    else homePitchers.splice(homePitchers.indexOf(exists), 1, homeSP);
  }
  if (awaySP) {
    const exists = awayPitchers.find((p) => p.id === awaySP.id);
    if (!exists) awayPitchers.unshift(awaySP);
    else awayPitchers.splice(awayPitchers.indexOf(exists), 1, awaySP);
  }

  return {
    home: {
      abbr:       homeTeam.abbreviation ?? "---",
      teamId:     homeTeam.id,
      name:       homeTeam.name ?? "",
      pitchers:   homePitchers,
      bullpen:    homeBullpen,
      lineup:     homeBatters,
      probableSP: homeSP ?? homePitchers[0] ?? null,
    },
    away: {
      abbr:       awayTeam.abbreviation ?? "---",
      teamId:     awayTeam.id,
      name:       awayTeam.name ?? "",
      pitchers:   awayPitchers,
      bullpen:    awayBullpen,
      lineup:     awayBatters,
      probableSP: awaySP ?? awayPitchers[0] ?? null,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseTeamRoster — extrae el roster 25-man de un equipo
// Siempre disponible, no depende del estado del juego
// ─────────────────────────────────────────────────────────────────────────────
function parseTeamRoster(data, teamId, abbr, teamName, probableSPId = null) {
  const roster   = data?.roster ?? [];
  const pitchers = [];
  const bullpen  = [];
  const lineup   = [];

  roster.forEach((entry) => {
    const p          = entry.person;
    const pos        = entry.position?.abbreviation ?? "--";
    const isPitcher  = ["P", "SP", "RP"].includes(pos) ||
                       entry.position?.type === "Pitcher";
    const pitchStats = p?.stats?.find(
      (s) => s.group?.displayName === "pitching"
    )?.splits?.[0]?.stat ?? {};
    const hitStats   = p?.stats?.find(
      (s) => s.group?.displayName === "hitting"
    )?.splits?.[0]?.stat ?? {};

    if (isPitcher) {
      const gs  = pitchStats.gamesStarted ?? 0;
      const obj = {
        id:       p.id,
        name:     p.fullName ?? "?",
        fullName: p.fullName ?? "?",
        hand:     p.pitchHand?.code ?? "R",
        era:      pitchStats.era  ?? "--",
        fip:      "--", xfip: "--", siera: "--",
        whip:     pitchStats.whip ?? "--",
        kpct:     "--", bbpct: "--", war: "--",
        k9:       pitchStats.strikeoutsPer9Inn ?? "--",
        gs, role: gs > 0 ? "SP" : "RP", lob: "--",
      };
      if (gs > 0) pitchers.push(obj);
      else        bullpen.push(obj);
    } else {
      lineup.push({
        id:       p.id,
        name:     p.fullName?.split(" ").slice(-1)[0] ?? "?",
        fullName: p.fullName ?? "?",
        pos,
        hand:     p.batSide?.code ?? "R",
        avg:      hitStats.avg       ?? "---",
        obp:      hitStats.obp       ?? "---",
        slg:      hitStats.slg       ?? "---",
        hr:       hitStats.homeRuns  ?? 0,
        rbi:      hitStats.rbi       ?? 0,
        wrc:      null,
        woba:     "---",
        ab:       hitStats.atBats    ?? 0,
        h:        hitStats.hits      ?? 0,
      });
    }
  });

  pitchers.sort((a, b) => {
    if (probableSPId) {
      if (a.id === probableSPId) return -1;
      if (b.id === probableSPId) return 1;
    }
    return (b.gs ?? 0) - (a.gs ?? 0);
  });

  return {
    abbr,
    teamId,
    name:       teamName,
    pitchers,
    bullpen,
    lineup,
    probableSP: pitchers[0] ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchRosterForGame — función principal con 4 estrategias en cascada
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchRosterForGame(gamePk, onLog) {
  const log = (s, m, d = "") =>
    onLog({
      ts: new Date().toLocaleTimeString("es-MX", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }),
      status: s, msg: m, detail: d,
    });

  const pkStr = String(gamePk);
  log("loading", `Iniciando carga de roster — gamePk ${gamePk}`, "");

  // ── Estrategia 1: Boxscore (lineup confirmado ~2h antes del juego) ────────
  try {
    log("loading", "Estrategia 1: boxscore API...", "");
    const BOX_URL = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
    const data    = await tryProxy(BOX_URL);
    const home    = parseBoxscoreRoster(data, "home");
    const away    = parseBoxscoreRoster(data, "away");

    if (home && away && home.lineup.length > 0 && away.lineup.length > 0) {
      log("ok",
        `Boxscore ✓ — ${home.abbr}: ${home.lineup.length} bat / ${away.abbr}: ${away.lineup.length} bat`,
        ""
      );
      return {
        fetchedAt: new Date().toISOString(),
        source:    "mlb_boxscore_api",
        home,
        away,
      };
    }
    log("warn", "Boxscore vacío — lineup aún no confirmado", `home: ${home?.lineup?.length ?? 0} bat`);
  } catch (e) {
    log("warn", `Boxscore falló: ${e.message}`, "");
  }

  // ── Estrategia 2: feed/live (probable pitchers + jugadores registrados) ───
  try {
    log("loading", "Estrategia 2: feed/live API...", "");
    const LIVE_URL = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live` +
                     `?fields=gameData,teams,players,probablePitchers`;
    const data     = await tryProxy(LIVE_URL);
    const result   = parseLiveFeedRoster(data, gamePk);

    if (result && (result.home.pitchers.length > 0 || result.away.pitchers.length > 0)) {
      log("ok",
        `feed/live ✓ — ${result.home.abbr}: ${result.home.pitchers.length} SP / ${result.away.abbr}: ${result.away.pitchers.length} SP`,
        "Lineup puede no estar confirmado todavía"
      );
      return {
        fetchedAt: new Date().toISOString(),
        source:    "mlb_live_feed",
        home:      result.home,
        away:      result.away,
      };
    }
    log("warn", "feed/live sin pitchers reconocibles", "");
  } catch (e) {
    log("warn", `feed/live falló: ${e.message}`, "");
  }

  // ── Estrategia 3: roster 25-man (siempre disponible) ─────────────────────
  try {
    log("loading", "Estrategia 3: roster 25-man del equipo...", "");
    const SCHED_URL = `https://statsapi.mlb.com/api/v1/schedule` +
                      `?sportId=1&gamePk=${gamePk}&hydrate=team,probablePitcher`;
    const schedData = await tryProxy(SCHED_URL);
    const gameInfo  = schedData?.dates?.[0]?.games?.[0];

    if (gameInfo) {
      const homeTeamId = gameInfo.teams?.home?.team?.id;
      const awayTeamId = gameInfo.teams?.away?.team?.id;
      const homeAbbr   = gameInfo.teams?.home?.team?.abbreviation ?? "HOME";
      const awayAbbr   = gameInfo.teams?.away?.team?.abbreviation ?? "AWAY";
      const homeName   = gameInfo.teams?.home?.team?.name ?? "";
      const awayName   = gameInfo.teams?.away?.team?.name ?? "";
      const homeSPName = gameInfo.teams?.home?.probablePitcher?.fullName ?? null;
      const awaySPName = gameInfo.teams?.away?.probablePitcher?.fullName ?? null;
      const homeSPId   = gameInfo.teams?.home?.probablePitcher?.id ?? null;
      const awaySPId   = gameInfo.teams?.away?.probablePitcher?.id ?? null;

      const ROSTER_HYDRATE =
        `rosterType=active&season=2026` +
        `&hydrate=person(stats(type=season,group=pitching,group=hitting))`;

      const [homeRes, awayRes] = await Promise.allSettled([
        tryProxy(`https://statsapi.mlb.com/api/v1/teams/${homeTeamId}/roster?${ROSTER_HYDRATE}`),
        tryProxy(`https://statsapi.mlb.com/api/v1/teams/${awayTeamId}/roster?${ROSTER_HYDRATE}`),
      ]);

      const homeData = homeRes.status === "fulfilled" ? homeRes.value : null;
      const awayData = awayRes.status === "fulfilled" ? awayRes.value : null;

      if (homeData || awayData) {
        const home = parseTeamRoster(homeData, homeTeamId, homeAbbr, homeName, homeSPId);
        const away = parseTeamRoster(awayData, awayTeamId, awayAbbr, awayName, awaySPId);
        log("ok",
          `Roster 25-man ✓ — ${homeAbbr}: ${home.pitchers.length} SP, ${home.bullpen.length} BP, ${home.lineup.length} bat`,
          `SP probable: ${homeSPName ?? "TBD"} vs ${awaySPName ?? "TBD"}`
        );
        return {
          fetchedAt: new Date().toISOString(),
          source:    "mlb_team_roster_25man",
          home,
          away,
        };
      }
    }
    log("warn", "Roster 25-man sin datos", "");
  } catch (e) {
    log("warn", `Roster 25-man falló: ${e.message}`, "");
  }

  // ── Estrategia 4: fallback manual de screenshots ──────────────────────────
  const FB = REAL_FALLBACK_ROSTERS[pkStr];
  if (FB) {
    log("fallback",
      `Roster manual — ${FB.home.abbr} vs ${FB.away.abbr}`,
      `Fuente: ${FB.source}`
    );
    return {
      ...FB,
      fetchedAt: FB.fetchedAt ?? new Date().toISOString(),
    };
  }

  log("error",
    `Sin datos para gamePk ${pkStr}`,
    "Ingresa ERA y stats manualmente en los campos"
  );
  return null;
}

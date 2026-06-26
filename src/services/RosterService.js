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
      const raw = d.contents ?? d;           // allorigins wraps in .contents
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch { continue; }
  }
  // Last resort: direct (works in production / Vercel)
  const r = await fetchWithTimeout(url, 5000);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ── Real fallback roster — HOU @ DET, 26-Jun-2026 ──────
// Built from ESPN + Rotowire screenshots provided by user
export const REAL_FALLBACK_ROSTERS = {
  "778001": {
    fetchedAt: "2026-06-26T14:30:00Z",
    source:    "ESPN + Rotowire (manual)",
    home: {
      abbr: "DET", teamId: 116, name: "Detroit Tigers", record: "34-47",
      probableSP: {
        id: 680757, name: "Keider Montero", hand: "R",
        era: "3.68", fip: "3.82", xfip: "3.91", siera: "3.88",
        kpct: "0.228", bbpct: "0.078", whip: "1.28", war: "1.8",
        record: "3-5", gs: 15,
      },
      pitchers: [
        { id:680757, name:"Keider Montero",  hand:"R", era:"3.68", fip:"3.82", xfip:"3.91", siera:"3.88", kpct:"0.228", bbpct:"0.078", whip:"1.28", war:"1.8",  gs:15, role:"SP" },
        { id:677651, name:"Tarik Skubal",    hand:"L", era:"2.85", fip:"2.71", xfip:"2.98", siera:"3.05", kpct:"0.291", bbpct:"0.052", whip:"0.98", war:"4.8",  gs:10, role:"SP" },
        { id:641745, name:"Jack Flaherty",   hand:"R", era:"3.95", fip:"3.78", xfip:"3.88", siera:"3.92", kpct:"0.241", bbpct:"0.078", whip:"1.22", war:"2.1",  gs:15, role:"SP" },
        { id:666202, name:"Fabian Valdez",   hand:"R", era:"4.21", fip:"4.05", xfip:"4.18", siera:"4.25", kpct:"0.218", bbpct:"0.085", whip:"1.31", war:"1.2",  gs:16, role:"SP" },
        { id:670127, name:"Casey Mize",      hand:"R", era:"3.41", fip:"3.28", xfip:"3.55", siera:"3.62", kpct:"0.224", bbpct:"0.065", whip:"1.14", war:"2.8",  gs:11, role:"SP" },
      ],
      bullpen: [
        { id:669456, name:"Kyle Finnegan",          hand:"R", era:"3.21", fip:"3.08", whip:"1.11", k9:"10.4", lob:"76", role:"CL" },
        { id:656061, name:"Tyler Holton",           hand:"L", era:"3.22", fip:"3.11", whip:"1.14", k9:"9.8",  lob:"76", role:"SU" },
        { id:676074, name:"Will Vest",              hand:"R", era:"3.44", fip:"3.28", whip:"1.18", k9:"9.1",  lob:"74", role:"SU" },
        { id:671730, name:"Brant Hurter",           hand:"L", era:"3.71", fip:"3.55", whip:"1.22", k9:"10.4", lob:"72", role:"RP" },
        { id:543037, name:"Kenley Jansen",          hand:"R", era:"3.44", fip:"3.21", whip:"1.08", k9:"10.1", lob:"78", role:"RP" },
        { id:676969, name:"Brandon Smith",          hand:"R", era:"3.88", fip:"3.71", whip:"1.25", k9:"8.8",  lob:"70", role:"RP" },
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
        id: 683002, name: "Spencer Arrighetti", hand: "R",
        era: "3.13", fip: "3.01", xfip: "3.18", siera: "3.25",
        kpct: "0.271", bbpct: "0.088", whip: "1.12", war: "3.4",
        record: "7-3", gs: 12,
      },
      pitchers: [
        { id:683002, name:"Spencer Arrighetti", hand:"R", era:"3.13", fip:"3.01", xfip:"3.18", siera:"3.25", kpct:"0.271", bbpct:"0.088", whip:"1.12", war:"3.4", gs:12, role:"SP" },
        { id:666201, name:"Mitchell Burrows",   hand:"R", era:"5.48", fip:"5.21", xfip:"5.08", siera:"4.98", kpct:"0.198", bbpct:"0.095", whip:"1.48", war:"0.2", gs:16, role:"SP" },
        { id:663738, name:"Peter Lambert",      hand:"R", era:"4.81", fip:"4.61", xfip:"4.72", siera:"4.78", kpct:"0.211", bbpct:"0.082", whip:"1.41", war:"0.8", gs:12, role:"SP" },
        { id:657054, name:"Hunter Brown",       hand:"R", era:"3.58", fip:"3.41", xfip:"3.62", siera:"3.70", kpct:"0.258", bbpct:"0.071", whip:"1.18", war:"2.9", gs:4,  role:"SP" },
        { id:669016, name:"Tanner Tully",       hand:"L", era:"4.21", fip:"4.08", xfip:"4.15", siera:"4.22", kpct:"0.228", bbpct:"0.075", whip:"1.32", war:"1.1", gs:11, role:"SP" },
      ],
      bullpen: [
        { id:650911, name:"Josh Hader",                 hand:"L", era:"2.21", fip:"2.08", whip:"0.88", k9:"14.2", lob:"82", role:"CL" },
        { id:666171, name:"Bryan Abreu",                hand:"R", era:"2.88", fip:"2.71", whip:"1.01", k9:"13.1", lob:"80", role:"SU" },
        { id:676265, name:"Seth Martinez",              hand:"R", era:"3.88", fip:"3.71", whip:"1.24", k9:"8.4",  lob:"71", role:"SU" },
        { id:676920, name:"Scott Okert",                hand:"L", era:"3.44", fip:"3.28", whip:"1.18", k9:"10.1", lob:"74", role:"RP" },
        { id:622110, name:"Emmanuel De Los Santos",     hand:"R", era:"3.55", fip:"3.41", whip:"1.21", k9:"9.4",  lob:"72", role:"RP" },
        { id:677000, name:"Brandon King",               hand:"R", era:"3.88", fip:"3.71", whip:"1.28", k9:"8.8",  lob:"70", role:"RP" },
      ],
      lineup: [
        { id:690985, name:"J. Pena",       fullName:"Jeremy Peña",      pos:"SS", hand:"R", avg:"0.290", obp:"0.348", slg:"0.462", hr:8,  rbi:38, wrc:112, woba:"0.348", ab:169, h:49 },
        { id:670541, name:"Y. Alvarez",    fullName:"Yordan Alvarez",    pos:"DH", hand:"L", avg:"0.318", obp:"0.421", slg:"0.601", hr:25, rbi:56, wrc:172, woba:"0.441", ab:296, h:94 },
        { id:676946, name:"C. Walker",     fullName:"Christian Walker",  pos:"1B", hand:"R", avg:"0.234", obp:"0.305", slg:"0.388", hr:9,  rbi:43, wrc:91,  woba:"0.308", ab:304, h:71 },
        { id:656305, name:"I. Paredes",    fullName:"Isaac Paredes",     pos:"3B", hand:"R", avg:"0.245", obp:"0.321", slg:"0.381", hr:8,  rbi:31, wrc:96,  woba:"0.315", ab:273, h:67 },
        { id:514888, name:"J. Altuve",     fullName:"Jose Altuve",       pos:"2B", hand:"R", avg:"0.235", obp:"0.308", slg:"0.383", hr:7,  rbi:25, wrc:91,  woba:"0.308", ab:230, h:54 },
        { id:683140, name:"Y. Diaz",       fullName:"Yainer Diaz",       pos:"C",  hand:"R", avg:"0.244", obp:"0.295", slg:"0.398", hr:9,  rbi:32, wrc:91,  woba:"0.308", ab:122, h:30 },
        { id:683003, name:"C. Smith",      fullName:"Cam Smith",         pos:"RF", hand:"R", avg:"0.221", obp:"0.298", slg:"0.358", hr:6,  rbi:28, wrc:82,  woba:"0.291", ab:271, h:60 },
        { id:683004, name:"J. Loperfido",  fullName:"Joey Loperfido",    pos:"LF", hand:"L", avg:"0.236", obp:"0.295", slg:"0.371", hr:6,  rbi:25, wrc:85,  woba:"0.298", ab:89,  h:21 },
        { id:676269, name:"J. Meyers",     fullName:"Jake Meyers",       pos:"CF", hand:"R", avg:"0.203", obp:"0.261", slg:"0.317", hr:3,  rbi:18, wrc:68,  woba:"0.271", ab:123, h:25 },
      ],
    },
  },
};

// ── Parse boxscore response from MLB API ────────────────
function parseBoxscoreRoster(data, side) {
  const team = data?.teams?.[side];
  if (!team) return null;
  const batters  = [];
  const pitchers = [];
  const bullpen  = [];
  const players  = team.players || {};
  const pitcherIds = new Set((team.pitchers || []).map(String));

  (team.battingOrder || []).forEach((pid) => {
    const p = players[`ID${pid}`];
    if (!p) return;
    const stats = p.seasonStats?.batting || {};
    batters.push({
      id: pid,
      name:     p.person?.fullName?.split(" ").slice(-1)[0] || "?",
      fullName: p.person?.fullName || "",
      pos:      p.position?.abbreviation || "--",
      hand:     p.batSide?.code || "R",
      avg:      stats.avg  || "---",
      obp:      stats.obp  || "---",
      slg:      stats.slg  || "---",
      hr:       stats.homeRuns || 0,
      rbi:      stats.rbi  || 0,
      wrc:      null,
      woba:     null,
      ab:       stats.atBats || 0,
      h:        stats.hits   || 0,
    });
  });

  [...pitcherIds].forEach((pid) => {
    const p = players[`ID${pid}`];
    if (!p) return;
    const stats = p.seasonStats?.pitching || {};
    const gs    = stats.gamesStarted || 0;
    const obj   = {
      id:    parseInt(pid),
      name:  p.person?.fullName || "?",
      hand:  p.pitchHand?.code  || "R",
      era:   stats.era   || "--",
      fip:   "--", xfip: "--", siera: "--",
      kpct:  "--", bbpct: "--",
      whip:  stats.whip  || "--",
      war:   "--",
      k9:    stats.strikeoutsPer9Inn || "--",
      gs,
      role:  gs > 0 ? "SP" : "RP",
      lob:   "--",
    };
    if (gs > 0) pitchers.push(obj);
    else        bullpen.push(obj);
  });

  return {
    abbr:       team.team?.abbreviation || "---",
    teamId:     team.team?.id,
    name:       team.team?.name || "",
    pitchers,
    bullpen,
    lineup:     batters,
    probableSP: pitchers[0] || null,
  };
}

// ── Main entry point ────────────────────────────────────
export async function fetchRosterForGame(gamePk, onLog) {
  const log = (s, m, d = "") =>
    onLog({ ts: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), status: s, msg: m, detail: d });

  const pkStr = String(gamePk);
  log("loading", `Cargando roster — gamePk ${gamePk}`, "");

  // Step 1: Live boxscore
  const BOX_URL = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
  try {
    log("loading", "Intentando boxscore API...", BOX_URL);
    const data = await tryProxy(BOX_URL);
    const home = parseBoxscoreRoster(data, "home");
    const away = parseBoxscoreRoster(data, "away");
    if (home && away && (home.lineup.length > 0 || home.pitchers.length > 0)) {
      log("ok", `Roster API ✓ — ${home.abbr}: ${home.lineup.length} bat / ${away.abbr}: ${away.lineup.length} bat`, "");
      return { fetchedAt: new Date().toISOString(), source: "mlb_boxscore_api", home, away };
    }
    throw new Error("Boxscore vacío — lineup aún no confirmado");
  } catch (e) {
    log("warn", `Boxscore falló: ${e.message}`, "Buscando fallback manual...");
  }

  // Step 2: Manual fallback from screenshots
  const FB = REAL_FALLBACK_ROSTERS[pkStr];
  if (FB) {
    log("fallback", `Roster manual (ESPN/Rotowire) — ${FB.home.abbr} vs ${FB.away.abbr}`,
      `Fecha: ${new Date(FB.fetchedAt).toLocaleDateString("es-MX")}`);
    return FB;
  }

  log("error", `Sin datos para gamePk ${pkStr}`, "Ingresa stats manualmente o espera a que MLB publique el lineup.");
  return null;
      }

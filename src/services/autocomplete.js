import { getPlayerById, getBattingStats, getPitchingStats } from "../data/PlayerDatabase";

// ─────────────────────────────────────────────────────────
// DEFAULTS — valores seguros cuando un campo no existe
// ─────────────────────────────────────────────────────────
const BATTING_DEFAULTS = {
  avg: "---", obp: "---", slg: "---", ops: "---",
  hr: 0, rbi: 0, r: 0, h: 0, ab: 0, bb: 0, so: 0,
  wrc: null, woba: "---", babip: "---",
};

const PITCHING_DEFAULTS = {
  era: "--", fip: "--", xfip: "--", siera: "--",
  whip: "--", kpct: "--", bbpct: "--",
  k9: "--", bb9: "--", hr9: "--",
  ip: "--", gs: 0, wins: 0, losses: 0, saves: 0,
  war: "--", babip: "--", lob_pct: "--",
  gb_pct: "--", fb_pct: "--",
};

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/** Safe string: returns the value if truthy and not "---"/"--", else null */
function present(v) {
  return v && v !== "---" && v !== "--" && v !== ".000" ? v : null;
}

/** Merge: right wins over left only where right has a real value */
function mergeStats(base, override) {
  if (!override) return base;
  const result = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v !== null && v !== undefined && v !== "---" && v !== "--" && v !== 0) {
      result[k] = v;
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────
// CORE FUNCTION
// ─────────────────────────────────────────────────────────

/**
 * autocompletePlayerData
 *
 * Normalizes a raw MLB API player object into a clean, app-ready shape.
 * Fill order (highest priority wins):
 *   1. API live data (season stats from boxscore/roster endpoint)
 *   2. PLAYER_DATABASE local fallback (keyed by MLBAM ID)
 *   3. Safe defaults (never crashes the app)
 *
 * @param {object} apiPlayer  — raw player object from MLB Stats API
 * @param {"batter"|"pitcher"|"bullpen"} role — how to treat this player
 * @returns {object} normalized player ready for combobox / simulation
 */
export function autocompletePlayerData(apiPlayer, role = "batter") {
  if (!apiPlayer) return null;

  // ── Step 1: Extract identity fields from API ─────────────
  const id       = apiPlayer.id ?? apiPlayer.person?.id ?? null;
  const fullName = apiPlayer.person?.fullName
                ?? apiPlayer.fullName
                ?? apiPlayer.name
                ?? "Desconocido";
  const lastName = fullName.split(" ").slice(-1)[0];  // Short display name
  const hand     = role === "batter"
                 ? (apiPlayer.batSide?.code ?? apiPlayer.hand ?? "R")
                 : (apiPlayer.pitchHand?.code ?? apiPlayer.hand ?? "R");
  const pos      = apiPlayer.position?.abbreviation
                ?? apiPlayer.pos
                ?? (role === "pitcher" ? "SP" : role === "bullpen" ? "RP" : "--");

  // ── Step 2: Pull API stats (may be empty/zero) ───────────
  const apiSeason = role === "batter"
    ? (apiPlayer.seasonStats?.batting ?? apiPlayer.stats?.batting ?? {})
    : (apiPlayer.seasonStats?.pitching ?? apiPlayer.stats?.pitching ?? {});

  // ── Step 3: Pull local DB record ─────────────────────────
  const dbRecord  = id ? getPlayerById(id) : null;
  const dbStats   = role === "batter"
    ? (dbRecord?.batting ?? null)
    : (dbRecord?.pitching ?? null);

  // ── Step 4: Build normalized stats ───────────────────────
  let stats;

  if (role === "batter") {
    const fromApi = {
      avg:   present(apiSeason.avg)         ?? null,
      obp:   present(apiSeason.obp)         ?? null,
      slg:   present(apiSeason.slg)         ?? null,
      ops:   present(apiSeason.ops)         ?? null,
      hr:    apiSeason.homeRuns             ?? null,
      rbi:   apiSeason.rbi                  ?? null,
      r:     apiSeason.runs                 ?? null,
      h:     apiSeason.hits                 ?? null,
      ab:    apiSeason.atBats               ?? null,
      bb:    apiSeason.baseOnBalls          ?? null,
      so:    apiSeason.strikeOuts           ?? null,
      wrc:   null,   // Not in MLB API — only from local DB
      woba:  null,   // Not in MLB API — only from local DB
      babip: present(apiSeason.babip)       ?? null,
    };

    // Merge: defaults → DB → API (API wins over DB for live accuracy)
    stats = mergeStats(
      mergeStats({ ...BATTING_DEFAULTS }, dbStats),
      fromApi
    );
  } else {
    // Pitcher or bullpen
    const gs = apiSeason.gamesStarted ?? dbStats?.gs ?? 0;
    const fromApi = {
      era:    present(apiSeason.era)              ?? null,
      whip:   present(apiSeason.whip)             ?? null,
      kpct:   null,   // Derived from K/9 — not directly in API
      bbpct:  null,
      k9:     present(apiSeason.strikeoutsPer9Inn)  ?? null,
      bb9:    present(apiSeason.walksPer9Inn)        ?? null,
      hr9:    present(apiSeason.homeRunsPer9)        ?? null,
      ip:     present(apiSeason.inningsPitched)      ?? null,
      gs,
      wins:   apiSeason.wins    ?? null,
      losses: apiSeason.losses  ?? null,
      saves:  apiSeason.saves   ?? null,
      babip:  present(apiSeason.battersFaced > 0
                ? apiSeason.babip : null)            ?? null,
    };

    stats = mergeStats(
      mergeStats({ ...PITCHING_DEFAULTS }, dbStats),
      fromApi
    );
  }

  // ── Step 5: Completeness score (0–100) ───────────────────
  // Used by RosterService to decide whether to log a warning
  const keyFields = role === "batter"
    ? ["avg","obp","slg","hr","rbi"]
    : ["era","whip","k9"];
  const filled    = keyFields.filter((f) => stats[f] && stats[f] !== "---" && stats[f] !== "--" && stats[f] !== 0).length;
  const completeness = Math.round((filled / keyFields.length) * 100);

  // ── Step 6: Determine data source ────────────────────────
  const source = (() => {
    const hasApiStats = Object.values(apiSeason).some(
      (v) => v !== null && v !== undefined && v !== 0 && v !== "---"
    );
    if (hasApiStats && dbRecord) return "api+db";
    if (hasApiStats)             return "api";
    if (dbRecord)                return "db_fallback";
    return "defaults_only";
  })();

  // ── Step 7: Assemble final normalized object ──────────────
  const base = {
    id,
    fullName,
    name:        lastName,
    pos,
    hand,
    role:        role === "pitcher" ? (stats.gs > 0 ? "SP" : "RP") : role === "bullpen" ? "RP" : undefined,
    _source:     source,       // internal — helps you debug
    _complete:   completeness, // 0–100
    _dbFound:    !!dbRecord,
  };

  if (role === "batter") {
    return {
      ...base,
      // Flat fields that your combobox and lineup components expect
      avg:   stats.avg,
      obp:   stats.obp,
      slg:   stats.slg,
      ops:   stats.ops,
      hr:    stats.hr,
      rbi:   stats.rbi,
      wrc:   stats.wrc,
      woba:  stats.woba,
      ab:    stats.ab,
      h:     stats.h,
      // Full stats object for potential future use
      _stats: stats,
    };
  } else {
    return {
      ...base,
      // Flat fields that your pitcher combobox expects
      era:    stats.era,
      fip:    stats.fip,
      xfip:   stats.xfip,
      siera:  stats.siera,
      whip:   stats.whip,
      kpct:   stats.kpct,
      bbpct:  stats.bbpct,
      k9:     stats.k9,
      war:    stats.war,
      gs:     stats.gs,
      lob:    stats.lob_pct,
      _stats: stats,
    };
  }
}

// ─────────────────────────────────────────────────────────
// BATCH VARIANTS
// ─────────────────────────────────────────────────────────

/**
 * Autocomplete an array of batters (batting order from boxscore)
 */
export function autocompleteBatters(apiPlayers) {
  return (apiPlayers ?? []).map((p) => autocompletePlayerData(p, "batter")).filter(Boolean);
}

/**
 * Autocomplete an array of pitchers, splitting SP vs RP by gamesStarted
 */
export function autocompletePitchers(apiPlayers) {
  const starters = [];
  const bullpen  = [];
  (apiPlayers ?? []).forEach((p) => {
    const gs   = p.seasonStats?.pitching?.gamesStarted ?? p.gs ?? 0;
    const role = gs > 0 ? "pitcher" : "bullpen";
    const norm = autocompletePlayerData(p, role);
    if (!norm) return;
    if (role === "pitcher") starters.push(norm);
    else                    bullpen.push(norm);
  });
  return { starters, bullpen };
}

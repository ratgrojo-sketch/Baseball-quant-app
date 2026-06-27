// ─────────────────────────────────────────────────────────────────────────────
// syncGameData.js
// Smart fetch with localStorage cache.
// Reads from cache first, fetches from MLB API if stale or missing.
// ─────────────────────────────────────────────────────────────────────────────

import { tryProxy } from "./RosterService";

// Cache TTL in milliseconds
const TTL = {
  ROSTER:    4  * 60 * 60 * 1000,   // 4 hours  — lineup confirmed ~2h before game
  SCHEDULE:  30 * 60 * 1000,         // 30 min   — schedule changes rarely
  BOXSCORE:  5  * 60 * 1000,         // 5 min    — live game scores
  STANDINGS: 60 * 60 * 1000,         // 1 hour
};

const CACHE_PREFIX = "bq_cache_";

// ── Internal cache helpers ────────────────────────────────

function cacheKey(type, id) {
  return `${CACHE_PREFIX}${type}_${id}`;
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, fetchedAt, ttl } = JSON.parse(raw);
    const age = Date.now() - new Date(fetchedAt).getTime();
    if (age > ttl) {
      localStorage.removeItem(key);   // expired — remove proactively
      return null;
    }
    return { data, fetchedAt, age, fresh: true };
  } catch {
    return null;
  }
}

function writeCache(key, data, ttl) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      fetchedAt: new Date().toISOString(),
      ttl,
    }));
    return true;
  } catch (e) {
    console.warn("[syncGameData] Cache write failed:", e.message);
    return false;
  }
}

// ── Generic cached fetch ──────────────────────────────────

async function cachedFetch(cacheType, cacheId, url, ttl, transform = (d) => d) {
  const key    = cacheKey(cacheType, cacheId);
  const cached = readCache(key);

  if (cached) {
    const ageMin = Math.round(cached.age / 60000);
    console.info(`[syncGameData] Cache HIT — ${cacheType}:${cacheId} (${ageMin}m old)`);
    return {
      data:      cached.data,
      fromCache: true,
      fetchedAt: cached.fetchedAt,
      error:     null,
    };
  }

  console.info(`[syncGameData] Cache MISS — fetching ${cacheType}:${cacheId}`);
  try {
    const raw       = await tryProxy(url);
    const data      = transform(raw);
    writeCache(key, data, ttl);
    return {
      data,
      fromCache: false,
      fetchedAt: new Date().toISOString(),
      error:     null,
    };
  } catch (e) {
    return {
      data:      null,
      fromCache: false,
      fetchedAt: null,
      error:     e.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * syncGameData — main entry point
 * Checks cache, fetches MLB boxscore if stale, writes result with timestamp.
 *
 * @param {number|string} gamePk    MLB official game primary key
 * @param {{ forceFresh?: boolean }} options
 * @returns {Promise<{ data, fromCache, fetchedAt, error }>}
 */
export async function syncGameData(gamePk, options = {}) {
  if (options.forceFresh) {
    localStorage.removeItem(cacheKey("roster", gamePk));
    console.info(`[syncGameData] Force refresh for gamePk ${gamePk}`);
  }

  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
  return cachedFetch("roster", gamePk, url, TTL.ROSTER, (raw) => ({
    gamePk,
    teams:     raw?.teams,
    officials: raw?.officials,
    info:      raw?.info,
  }));
}

/**
 * syncSchedule — fetch and cache the day's schedule
 * @param {string} dateStr   "YYYY-MM-DD"
 * @param {{ forceFresh? }} options
 */
export async function syncSchedule(dateStr, options = {}) {
  if (options.forceFresh) {
    localStorage.removeItem(cacheKey("schedule", dateStr));
  }

  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=team,linescore,probablePitcher`;
  return cachedFetch("schedule", dateStr, url, TTL.SCHEDULE, (raw) => {
    const games = [];
    (raw.dates ?? []).forEach((d) =>
      (d.games ?? []).forEach((g) =>
        games.push({
          id:         g.gamePk,
          status:     g.status?.detailedState ?? "Scheduled",
          home:       g.teams?.home?.team?.abbreviation ?? "---",
          homeName:   g.teams?.home?.team?.name ?? "",
          homeTeamId: g.teams?.home?.team?.id,
          away:       g.teams?.away?.team?.abbreviation ?? "---",
          awayName:   g.teams?.away?.team?.name ?? "",
          awayTeamId: g.teams?.away?.team?.id,
          homeScore:  g.teams?.home?.score ?? null,
          awayScore:  g.teams?.away?.score ?? null,
          gameTime:   g.gameDate
            ? new Date(g.gameDate).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" })
            : "--:--",
          venue:      g.venue?.name ?? "",
          homeSP:     g.teams?.home?.probablePitcher?.fullName ?? "TBD",
          awaySP:     g.teams?.away?.probablePitcher?.fullName ?? "TBD",
          linescore:  g.linescore ?? null,
        })
      )
    );
    return games;
  });
}

/**
 * syncLiveScore — fetch live score (short TTL = 5 min)
 * @param {number|string} gamePk
 */
export async function syncLiveScore(gamePk) {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/linescore`;
  return cachedFetch("linescore", gamePk, url, TTL.BOXSCORE, (raw) => ({
    gamePk,
    currentInning:    raw?.currentInning,
    currentInningOrdinal: raw?.currentInningOrdinal,
    inningState:      raw?.inningState,
    runs:             { home: raw?.teams?.home?.runs, away: raw?.teams?.away?.runs },
    hits:             { home: raw?.teams?.home?.hits, away: raw?.teams?.away?.hits },
    errors:           { home: raw?.teams?.home?.errors, away: raw?.teams?.away?.errors },
    innings:          raw?.innings ?? [],
  }));
}

/**
 * getCacheStatus — inspect what's in cache (for debug panel)
 * @returns {Array<{ key, type, id, fetchedAt, ageMin, sizeKB }>}
 */
export function getCacheStatus() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    try {
      const raw        = localStorage.getItem(key);
      const parsed     = JSON.parse(raw);
      const ageMs      = Date.now() - new Date(parsed.fetchedAt).getTime();
      const [, type, id] = key.replace(CACHE_PREFIX, "").split("_");
      entries.push({
        key,
        type:      key.replace(CACHE_PREFIX, "").split("_")[0],
        id:        key.replace(CACHE_PREFIX, "").split("_").slice(1).join("_"),
        fetchedAt: parsed.fetchedAt,
        ageMin:    Math.round(ageMs / 60000),
        expired:   ageMs > parsed.ttl,
        sizeKB:    Math.round(raw.length * 2 / 1024),
      });
    } catch { continue; }
  }
  return entries;
}

/**
 * clearCache — remove all cached API responses (keeps bets/projections intact)
 */
export function clearCache() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  console.info(`[syncGameData] Cleared ${keys.length} cache entries`);
  return keys.length;
}

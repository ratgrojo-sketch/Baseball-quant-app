// ─────────────────────────────────────────────────────────
// NUEVO: fetchRosterForGame con 4 estrategias de fallback
// Estrategia 1: /game/{pk}/boxscore   → lineup confirmado (post 2h pre-game)
// Estrategia 2: /game/{pk}/feed/live  → datos en vivo o pre-game
// Estrategia 3: /teams/{id}/roster    → roster del equipo (25-man)
// Estrategia 4: REAL_FALLBACK_ROSTERS → datos manuales de screenshots
// ─────────────────────────────────────────────────────────

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

  // ── Estrategia 1: Boxscore (tiene batting order confirmado) ──
  try {
    log("loading", "Estrategia 1: boxscore API...", "");
    const BOX_URL = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
    const data    = await tryProxy(BOX_URL);
    const home    = parseBoxscoreRoster(data, "home");
    const away    = parseBoxscoreRoster(data, "away");

    if (home && away && home.lineup.length > 0 && away.lineup.length > 0) {
      log("ok", `Boxscore ✓ — ${home.abbr}: ${home.lineup.length} bateadores / ${away.abbr}: ${away.lineup.length}`, "");
      return {
        fetchedAt: new Date().toISOString(),   // ← FIX Bug 2
        source:    "mlb_boxscore_api",
        home, away,
      };
    }
    log("warn", "Boxscore vacío — lineup no confirmado aún", `home.lineup: ${home?.lineup?.length ?? 0}`);
  } catch (e) {
    log("warn", `Boxscore falló: ${e.message}`, "");
  }

  // ── Estrategia 2: feed/live (tiene probablePitchers y estado del juego) ──
  try {
    log("loading", "Estrategia 2: feed/live API...", "");
    const LIVE_URL = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?fields=gameData,liveData,teams,players,pitchers,batters,probablePitchers`;
    const data     = await tryProxy(LIVE_URL);
    const result   = parseLiveFeedRoster(data, gamePk);

    if (result && (result.home.pitchers.length > 0 || result.away.pitchers.length > 0)) {
      log("ok",
        `feed/live ✓ — ${result.home.abbr}: ${result.home.pitchers.length} SP / ${result.away.abbr}: ${result.away.pitchers.length} SP`,
        "Lineup puede no estar confirmado todavía"
      );
      return {
        fetchedAt: new Date().toISOString(),   // ← FIX Bug 2
        source:    "mlb_live_feed",
        home:      result.home,
        away:      result.away,
      };
    }
    log("warn", "feed/live sin pitchers", "");
  } catch (e) {
    log("warn", `feed/live falló: ${e.message}`, "");
  }

  // ── Estrategia 3: roster del equipo (25-man, siempre disponible) ──
  // Primero obtenemos los teamIds desde el schedule
  try {
    log("loading", "Estrategia 3: roster de equipo (25-man)...", "");
    const SCHED_URL = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk=${gamePk}&hydrate=team,probablePitcher`;
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

      // Fetch both rosters in parallel
      const [homeRoster, awayRoster] = await Promise.allSettled([
        tryProxy(`https://statsapi.mlb.com/api/v1/teams/${homeTeamId}/roster?rosterType=active&season=2026&hydrate=person(stats(type=season,group=pitching,group=hitting))`),
        tryProxy(`https://statsapi.mlb.com/api/v1/teams/${awayTeamId}/roster?rosterType=active&season=2026&hydrate=person(stats(type=season,group=pitching,group=hitting))`),
      ]);

      const homeData = homeRoster.status === "fulfilled" ? homeRoster.value : null;
      const awayData = awayRoster.status === "fulfilled" ? awayRoster.value : null;

      if (homeData || awayData) {
        const home = parseTeamRoster(homeData, homeTeamId, homeAbbr, homeName, homeSPId);
        const away = parseTeamRoster(awayData, awayTeamId, awayAbbr, awayName, awaySPId);
        log("ok",
          `Roster 25-man ✓ — ${homeAbbr}: ${home.pitchers.length} SP, ${home.bullpen.length} BP, ${home.lineup.length} bat`,
          `SP probable: ${homeSPName ?? "TBD"} vs ${awaySPName ?? "TBD"}`
        );
        return {
          fetchedAt: new Date().toISOString(),   // ← FIX Bug 2
          source:    "mlb_team_roster_25man",
          home, away,
        };
      }
    }
    log("warn", "Roster 25-man: sin datos", "");
  } catch (e) {
    log("warn", `Roster 25-man falló: ${e.message}`, "");
  }

  // ── Estrategia 4: fallback manual de screenshots ──────
  const FB = REAL_FALLBACK_ROSTERS[pkStr];
  if (FB) {
    log("fallback",
      `Roster manual — ${FB.home.abbr} vs ${FB.away.abbr}`,
      `Fuente: ${FB.source}`
    );
    // Ensure fetchedAt is always present even in manual fallback
    return {
      ...FB,
      fetchedAt: FB.fetchedAt ?? new Date().toISOString(),
    };
  }

  log("error",
    `Sin datos para gamePk ${pkStr}`,
    "Ingresa ERA y stats manualmente en los campos de abajo"
  );
  return null;
}

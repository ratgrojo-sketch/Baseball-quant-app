// ─────────────────────────────────────────────────────────
// parseLiveFeedRoster — extrae pitchers/batters del feed/live
// Útil cuando el boxscore aún no tiene lineup confirmado
// ─────────────────────────────────────────────────────────
function parseLiveFeedRoster(data, gamePk) {
  const gameData = data?.gameData;
  const players  = gameData?.players ?? {};   // keyed as "ID{playerId}"

  const homeTeam = gameData?.teams?.home;
  const awayTeam = gameData?.teams?.away;
  if (!homeTeam || !awayTeam) return null;

  // Probable pitchers from game data
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
      // Stats will come from PLAYER_DATABASE autocomplete
      era: "--", fip: "--", xfip: "--", siera: "--",
      kpct: "--", bbpct: "--", whip: "--", war: "--",
      gs: 1, role: "SP",
    };
  }

  const homeSP = buildPitcherFromProbable(homeSPRaw);
  const awaySP = buildPitcherFromProbable(awaySPRaw);

  // Build roster lists from players object
  const homePitchers = [], homeBullpen = [], homeBatters = [];
  const awayPitchers = [], awayBullpen = [], awayBatters = [];

  Object.values(players).forEach((p) => {
    const teamId  = p?.currentTeam?.id;
    const isPitch = ["P"].includes(p?.primaryPosition?.abbreviation);
    const isHome  = teamId === homeTeam.id;
    const isAway  = teamId === awayTeam.id;
    if (!isHome && !isAway) return;

    const target = isHome
      ? { pitchers: homePitchers, bullpen: homeBullpen, batters: homeBatters }
      : { pitchers: awayPitchers, bullpen: awayBullpen, batters: awayBatters };

    if (isPitch) {
      const gs  = p?.stats?.pitching?.gamesStarted ?? 0;
      const obj = {
        id:    p.id, name: p.fullName, fullName: p.fullName,
        hand:  p.pitchHand?.code ?? "R",
        era:   p.stats?.pitching?.era   ?? "--",
        whip:  p.stats?.pitching?.whip  ?? "--",
        k9:    p.stats?.pitching?.strikeoutsPer9Inn ?? "--",
        fip: "--", xfip: "--", siera: "--",
        kpct: "--", bbpct: "--", war: "--",
        gs, role: gs > 0 ? "SP" : "RP",
        lob: "--",
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
        avg:      p.stats?.hitting?.avg  ?? "---",
        obp:      p.stats?.hitting?.obp  ?? "---",
        slg:      p.stats?.hitting?.slg  ?? "---",
        hr:       p.stats?.hitting?.homeRuns ?? 0,
        rbi:      p.stats?.hitting?.rbi  ?? 0,
        wrc: null, woba: "---",
        ab:       p.stats?.hitting?.atBats ?? 0,
        h:        p.stats?.hitting?.hits   ?? 0,
      });
    }
  });

  // Put probable SP first in the pitchers list
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

// ─────────────────────────────────────────────────────────
// parseTeamRoster — extrae el roster 25-man de un equipo
// Siempre disponible, no depende del juego
// ─────────────────────────────────────────────────────────
function parseTeamRoster(data, teamId, abbr, teamName, probableSPId = null) {
  const roster    = data?.roster ?? [];
  const pitchers  = [];
  const bullpen   = [];
  const lineup    = [];

  roster.forEach((entry) => {
    const p   = entry.person;
    const pos = entry.position?.abbreviation ?? "--";
    const isPitcher = ["P", "SP", "RP"].includes(pos) ||
                      entry.position?.type === "Pitcher";

    // Pull season stats if hydrated
    const pitchStats  = p?.stats?.find(s => s.group?.displayName === "pitching")?.splits?.[0]?.stat ?? {};
    const hitStats    = p?.stats?.find(s => s.group?.displayName === "hitting")?.splits?.[0]?.stat  ?? {};

    if (isPitcher) {
      const gs  = pitchStats.gamesStarted ?? 0;
      const obj = {
        id:       p.id,
        name:     p.fullName ?? "?",
        fullName: p.fullName ?? "?",
        hand:     p.pitchHand?.code ?? "R",
        era:      pitchStats.era   ?? "--",
        fip:      "--", xfip: "--", siera: "--",
        whip:     pitchStats.whip  ?? "--",
        kpct:     "--", bbpct: "--", war: "--",
        k9:       pitchStats.strikeoutsPer9Inn ?? "--",
        gs, role: gs > 0 ? "SP" : "RP",
        lob: "--",
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
        avg:      hitStats.avg ?? "---",
        obp:      hitStats.obp ?? "---",
        slg:      hitStats.slg ?? "---",
        hr:       hitStats.homeRuns ?? 0,
        rbi:      hitStats.rbi      ?? 0,
        wrc:      null,
        woba:     "---",
        ab:       hitStats.atBats ?? 0,
        h:        hitStats.hits   ?? 0,
      });
    }
  });

  // Sort pitchers: probable SP first
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

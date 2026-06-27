// autocomplete.js — versión simplificada sin dependencias externas
// Normaliza jugadores de la API de MLB con valores seguros por defecto

const BATTING_DEFAULTS = {
  avg: "---", obp: "---", slg: "---", ops: "---",
  hr: 0, rbi: 0, r: 0, h: 0, ab: 0, bb: 0, so: 0,
  wrc: null, woba: "---",
};

const PITCHING_DEFAULTS = {
  era: "--", fip: "--", xfip: "--", siera: "--",
  whip: "--", kpct: "--", bbpct: "--",
  k9: "--", bb9: "--", hr9: "--",
  ip: "--", gs: 0, wins: 0, losses: 0, saves: 0,
  war: "--", lob: "--",
};

function present(v) {
  return v && v !== "---" && v !== "--" && v !== ".000" ? v : null;
}

export function autocompletePlayerData(apiPlayer, role = "batter") {
  if (!apiPlayer) return null;

  const id       = apiPlayer.id ?? apiPlayer.person?.id ?? null;
  const fullName = apiPlayer.person?.fullName ?? apiPlayer.fullName ?? apiPlayer.name ?? "Desconocido";
  const lastName = fullName.split(" ").slice(-1)[0];
  const hand     = role === "batter"
    ? (apiPlayer.batSide?.code ?? apiPlayer.hand ?? "R")
    : (apiPlayer.pitchHand?.code ?? apiPlayer.hand ?? "R");
  const pos = apiPlayer.position?.abbreviation
    ?? apiPlayer.pos
    ?? (role === "pitcher" ? "SP" : role === "bullpen" ? "RP" : "--");

  const apiSeason = role === "batter"
    ? (apiPlayer.seasonStats?.batting ?? {})
    : (apiPlayer.seasonStats?.pitching ?? {});

  if (role === "batter") {
    return {
      id, fullName, name: lastName, pos, hand,
      avg:  present(apiSeason.avg)      ?? BATTING_DEFAULTS.avg,
      obp:  present(apiSeason.obp)      ?? BATTING_DEFAULTS.obp,
      slg:  present(apiSeason.slg)      ?? BATTING_DEFAULTS.slg,
      ops:  present(apiSeason.ops)      ?? BATTING_DEFAULTS.ops,
      hr:   apiSeason.homeRuns          ?? BATTING_DEFAULTS.hr,
      rbi:  apiSeason.rbi               ?? BATTING_DEFAULTS.rbi,
      wrc:  null,
      woba: "---",
      ab:   apiSeason.atBats            ?? BATTING_DEFAULTS.ab,
      h:    apiSeason.hits              ?? BATTING_DEFAULTS.h,
    };
  } else {
    const gs = apiSeason.gamesStarted ?? 0;
    return {
      id, fullName, name: fullName, pos, hand,
      role: gs > 0 ? "SP" : "RP",
      era:  present(apiSeason.era)               ?? PITCHING_DEFAULTS.era,
      fip:  "--", xfip: "--", siera: "--",
      whip: present(apiSeason.whip)              ?? PITCHING_DEFAULTS.whip,
      kpct: "--", bbpct: "--",
      k9:   present(apiSeason.strikeoutsPer9Inn) ?? PITCHING_DEFAULTS.k9,
      war:  "--", gs, lob: "--",
    };
  }
}

export function autocompleteBatters(apiPlayers) {
  return (apiPlayers ?? []).map((p) => autocompletePlayerData(p, "batter")).filter(Boolean);
}

export function autocompletePitchers(apiPlayers) {
  const starters = [], bullpen = [];
  (apiPlayers ?? []).forEach((p) => {
    const gs   = p.seasonStats?.pitching?.gamesStarted ?? p.gs ?? 0;
    const role = gs > 0 ? "pitcher" : "bullpen";
    const norm = autocompletePlayerData(p, role);
    if (!norm) return;
    if (gs > 0) starters.push(norm);
    else        bullpen.push(norm);
  });
  return { starters, bullpen };
}

import { autocompletePlayerData, autocompleteBatters, autocompletePitchers } from "./autocomplete";
import { getPlayerById } from "../data/PlayerDatabase";

// ─────────────────────────────────────────────────────────
// Función tryProxy (necesaria para el resto de la app)
// ─────────────────────────────────────────────────────────
export async function tryProxy(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Error en tryProxy:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────
// Lógica de Parseo y Autocompletado
// ─────────────────────────────────────────────────────────
function parseBoxscoreRoster(data, side) {
  const team = data?.teams?.[side];
  if (!team) return null;

  const players    = team.players  || {};
  const pitcherIds = new Set((team.pitchers || []).map(String));
  const warnings   = [];

  const lineup = (team.battingOrder || []).map((pid) => {
    const raw = players[`ID${pid}`];
    const apiShape = {
      id:           parseInt(pid),
      person:       raw?.person,
      position:     raw?.position,
      batSide:      raw?.batSide,
      seasonStats:  raw?.seasonStats,
    };
    const player = autocompletePlayerData(apiShape, "batter");
    if (!player) return null;
    if (player._complete < 60) {
      warnings.push(`⚠ ${player.fullName} (ID ${pid}): ${player._complete}% stats [${player._source}]`);
    }
    return player;
  }).filter(Boolean);

  const rawPitcherObjects = [...pitcherIds].map((pid) => {
    const raw = players[`ID${pid}`];
    return {
      id:           parseInt(pid),
      person:       raw?.person,
      position:     raw?.position,
      pitchHand:    raw?.pitchHand,
      seasonStats:  raw?.seasonStats,
      gs:           raw?.seasonStats?.pitching?.gamesStarted ?? 0,
    };
  });

  const { starters, bullpen } = autocompletePitchers(rawPitcherObjects);
  const probableSP = starters.sort((a, b) => (b.gs ?? 0) - (a.gs ?? 0))[0] ?? null;

  return {
    abbr:       team.team?.abbreviation || "---",
    teamId:     team.team?.id,
    name:       team.team?.name || "",
    pitchers:   starters,
    bullpen,
    lineup,
    probableSP,
    _warnings:  warnings,
    _lineupComplete: lineup.length > 0
      ? Math.round(lineup.reduce((s, p) => s + (p._complete ?? 0), 0) / lineup.length)
      : 0,
  };
}

export async function fetchRosterForGame(gamePk, onLog) {
  const log = (s, m) => onLog({ status: s, msg: m });
  const BOX_URL = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
  
  try {
    log("loading", "Cargando desde MLB...");
    const data = await tryProxy(BOX_URL);
    if (data?.teams) {
      return {
        home: parseBoxscoreRoster(data, "home"),
        away: parseBoxscoreRoster(data, "away")
      };
    }
  } catch (e) {
    log("error", "Error cargando API");
  }
  return null;
}
// Agrega esto al final de RosterService.js
export const REAL_FALLBACK_ROSTERS = {}; 

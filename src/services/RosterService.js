// At the top of RosterService.js, add these imports:
import { autocompletePlayerData, autocompleteBatters, autocompletePitchers } from "./autocomplete";
import { getPlayerById } from "../data/PlayerDatabase";

// ─────────────────────────────────────────────────────────
// Replace parseBoxscoreRoster with this new version
// ─────────────────────────────────────────────────────────
function parseBoxscoreRoster(data, side) {
  const team = data?.teams?.[side];
  if (!team) return null;

  const players    = team.players  || {};
  const pitcherIds = new Set((team.pitchers || []).map(String));
  const warnings   = [];   // collect completeness warnings

  // ── Batting order ─────────────────────────────────────
  const lineup = (team.battingOrder || []).map((pid) => {
    const raw = players[`ID${pid}`];

    // Build a shape autocompletePlayerData can consume
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
      warnings.push(`⚠ ${player.fullName} (ID ${pid}): solo ${player._complete}% de stats disponibles [${player._source}]`);
    }
    return player;
  }).filter(Boolean);

  // ── Pitchers ─────────────────────────────────────────
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

  starters.forEach((p) => {
    if (p._complete < 60) warnings.push(`⚠ SP ${p.fullName}: ${p._complete}% completo [${p._source}]`);
  });
  bullpen.forEach((p) => {
    if (p._complete < 60) warnings.push(`⚠ RP ${p.fullName}: ${p._complete}% completo [${p._source}]`);
  });

  // Determine probable SP (highest GS among starters)
  const probableSP = starters.sort((a, b) => (b.gs ?? 0) - (a.gs ?? 0))[0] ?? null;

  if (warnings.length > 0) {
    console.warn(`[RosterService] ${side.toUpperCase()} autocomplete warnings:\n` + warnings.join("\n"));
  }

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

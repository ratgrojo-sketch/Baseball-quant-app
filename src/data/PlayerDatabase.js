// PlayerDatabase.js — versión mínima segura
// El archivo existe para que autocomplete.js no crashee si alguien lo importa

export const PLAYER_DATABASE = {};

export function getPlayerById(id) {
  return PLAYER_DATABASE[Number(id)] ?? null;
}

export function getBattingStats(id) {
  return PLAYER_DATABASE[Number(id)]?.batting ?? null;
}

export function getPitchingStats(id) {
  return PLAYER_DATABASE[Number(id)]?.pitching ?? null;
}

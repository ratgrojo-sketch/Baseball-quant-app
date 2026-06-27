// StorageService.js — versión mínima segura
// Implementación completa comentada, solo exports básicos para no crashear

const KEYS = {
  BETS:             "bq_bets",
  PROJECTIONS:      "bq_projections",
  BAYESIAN_WEIGHTS: "bq_bayesian_weights",
  FEEDBACK:         "bq_feedback",
  BANKROLL:         "bq_bankroll",
};

const DEFAULT_WEIGHTS = {
  sp_weight: 0.35, bp_weight: 0.25,
  env_weight: 0.15, offense_weight: 0.25,
  updatedAt: null, gamesProcessed: 0,
};

function readKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeKey(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

function generateId(prefix = "bq") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO() { return new Date().toISOString(); }
const ok  = (data, id)  => ({ ok: true,  data, id,   error: null });
const err = (msg)       => ({ ok: false, data: null, id: null, error: { message: msg } });

export async function saveBet(bet) {
  if (!bet?.gameId) return err("gameId requerido");
  const bets   = readKey(KEYS.BETS) ?? [];
  const newBet = { ...bet, betId: generateId("bet"), betStatus: "pending", createdAt: nowISO() };
  writeKey(KEYS.BETS, [newBet, ...bets].slice(0, 200));
  return ok(newBet, newBet.betId);
}

export async function getBets(filters = {}) {
  let bets = readKey(KEYS.BETS) ?? [];
  if (filters.gameId)    bets = bets.filter((b) => String(b.gameId) === String(filters.gameId));
  if (filters.betStatus) bets = bets.filter((b) => b.betStatus === filters.betStatus);
  if (filters.limit)     bets = bets.slice(0, filters.limit);
  return ok(bets);
}

export async function updateBetResult(betId, update) {
  const bets = readKey(KEYS.BETS) ?? [];
  const idx  = bets.findIndex((b) => b.betId === betId);
  if (idx === -1) return err("betId no encontrado");
  bets[idx] = { ...bets[idx], ...update, settledAt: nowISO() };
  writeKey(KEYS.BETS, bets);
  return ok(bets[idx]);
}

export async function saveProjection(projection) {
  if (!projection?.gameId) return err("gameId requerido");
  const list = readKey(KEYS.PROJECTIONS) ?? [];
  const item = { ...projection, projectionId: generateId("proj"), projectionDate: nowISO() };
  writeKey(KEYS.PROJECTIONS, [item, ...list].slice(0, 100));
  return ok(item, item.projectionId);
}

export async function getLastProjections(n = 20, gameId = null) {
  let list = readKey(KEYS.PROJECTIONS) ?? [];
  if (gameId) list = list.filter((p) => String(p.gameId) === String(gameId));
  return ok(list.slice(0, n));
}

export async function getBayesianWeights() {
  return ok(readKey(KEYS.BAYESIAN_WEIGHTS) ?? { ...DEFAULT_WEIGHTS });
}

export async function updateBayesianWeights(weights, context = {}) {
  const current = readKey(KEYS.BAYESIAN_WEIGHTS) ?? { ...DEFAULT_WEIGHTS };
  const updated = {
    ...current, ...weights,
    gamesProcessed: (current.gamesProcessed ?? 0) + 1,
    updatedAt: nowISO(),
  };
  writeKey(KEYS.BAYESIAN_WEIGHTS, updated);
  return ok(updated);
}

export async function saveFeedback(feedback) {
  if (!feedback?.gameId) return err("gameId requerido");
  const list = readKey(KEYS.FEEDBACK) ?? [];
  const item = { ...feedback, feedbackId: generateId("fb"), feedbackDate: nowISO() };
  writeKey(KEYS.FEEDBACK, [item, ...list].slice(0, 200));
  return ok(item, item.feedbackId);
}

export async function getFeedbackHistory(n = 50) {
  return ok((readKey(KEYS.FEEDBACK) ?? []).slice(0, n));
}

export async function getBankroll() {
  return ok(readKey(KEYS.BANKROLL) ?? { amount: 1000, updatedAt: null });
}

export async function updateBankroll(amount) {
  const updated = { amount, updatedAt: nowISO() };
  writeKey(KEYS.BANKROLL, updated);
  return ok(updated);
}

export async function getStorageStats() {
  const bets   = readKey(KEYS.BETS)        ?? [];
  const projs  = readKey(KEYS.PROJECTIONS) ?? [];
  const fbs    = readKey(KEYS.FEEDBACK)    ?? [];
  return ok({
    bets: bets.length, projections: projs.length,
    feedbackRecords: fbs.length,
    pendingBets: bets.filter((b) => b.betStatus === "pending").length,
    wonBets:     bets.filter((b) => b.betStatus === "won").length,
    lostBets:    bets.filter((b) => b.betStatus === "lost").length,
  });
}

export async function clearAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  return ok(null);
}

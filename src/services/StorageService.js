// ─────────────────────────────────────────────────────────────────────────────
// StorageService.js
// Capa de abstracción de datos — Fase 1: localStorage
// Diseñado para migración a Supabase sin cambiar los componentes React.
//
// CONTRATO DE INTERFAZ (no cambia al migrar a Supabase):
//   saveBet(bet)                    → Promise<{ ok, id, error }>
//   getBets(filters?)               → Promise<{ ok, data, error }>
//   deleteBet(betId)                → Promise<{ ok, error }>
//   saveProjection(projection)      → Promise<{ ok, id, error }>
//   getLastProjections(n, gameId?)  → Promise<{ ok, data, error }>
//   updateBayesianWeights(weights)  → Promise<{ ok, data, error }>
//   getBayesianWeights()            → Promise<{ ok, data, error }>
//   saveFeedback(feedback)          → Promise<{ ok, id, error }>
//   getFeedbackHistory(n?)          → Promise<{ ok, data, error }>
//   clearAll()                      → Promise<{ ok, error }>
// ─────────────────────────────────────────────────────────────────────────────

// ── Storage keys ─────────────────────────────────────────
const KEYS = {
  BETS:             "bq_bets",
  PROJECTIONS:      "bq_projections",
  BAYESIAN_WEIGHTS: "bq_bayesian_weights",
  FEEDBACK:         "bq_feedback",
  BANKROLL:         "bq_bankroll",
};

// ── Default Bayesian weights (matches your SQL schema columns) ──
const DEFAULT_WEIGHTS = {
  sp_weight:      0.35,
  bp_weight:      0.25,
  env_weight:     0.15,
  offense_weight: 0.25,
  updatedAt:      null,
  gamesProcessed: 0,
};

// ── Internal localStorage helpers ────────────────────────

function readKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`[StorageService] Error reading key "${key}":`, e);
    return null;
  }
}

function writeKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // Handles QuotaExceededError and other write failures
    console.error(`[StorageService] Error writing key "${key}":`, e);
    return false;
  }
}

function generateId(prefix = "bq") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function nowISO() {
  return new Date().toISOString();
}

// ── Result wrappers ───────────────────────────────────────
// Mirrors Supabase's { data, error } shape so migration is
// a drop-in replacement — just swap the internals.

const ok  = (data, id)  => ({ ok: true,  data,  id,    error: null });
const err = (msg, raw)  => ({ ok: false, data: null, id: null, error: { message: msg, raw } });

// ─────────────────────────────────────────────────────────────────────────────
// BETS
// Maps to your SQL table: bet_history
// ─────────────────────────────────────────────────────────────────────────────

/**
 * saveBet — persist a new bet
 * @param {object} bet
 * @param {string}  bet.gameId         MLB gamePk
 * @param {string}  bet.betType        'moneyline'|'run_line'|'over'|'under'
 * @param {string}  bet.side           'home'|'away'|'over'|'under'
 * @param {number}  bet.oddsAmerican   e.g. -150
 * @param {number}  bet.stakeAmount
 * @param {number}  bet.bankrollBefore
 * @param {number?} bet.kellyFraction
 * @param {string?} bet.selection      handicap line selected e.g. "-1.5"
 * @param {string?} bet.sportsbook
 * @param {string?} bet.notes
 */
export async function saveBet(bet) {
  if (!bet?.gameId || !bet?.betType || !bet?.stakeAmount) {
    return err("saveBet: gameId, betType y stakeAmount son requeridos");
  }

  const bets    = readKey(KEYS.BETS) ?? [];
  const newBet  = {
    ...bet,
    betId:      generateId("bet"),
    betStatus:  bet.betStatus  ?? "pending",
    profitLoss: bet.profitLoss ?? null,
    bankrollAfter: bet.bankrollAfter ?? null,
    createdAt:  nowISO(),
  };

  const updated = [newBet, ...bets];   // newest first
  const written = writeKey(KEYS.BETS, updated);
  if (!written) return err("saveBet: no se pudo escribir en localStorage");

  return ok(newBet, newBet.betId);
}

/**
 * getBets — retrieve bets with optional filters
 * @param {{ gameId?, betStatus?, betType?, limit? }} filters
 */
export async function getBets(filters = {}) {
  const bets = readKey(KEYS.BETS) ?? [];

  let result = bets;
  if (filters.gameId)    result = result.filter((b) => String(b.gameId) === String(filters.gameId));
  if (filters.betStatus) result = result.filter((b) => b.betStatus === filters.betStatus);
  if (filters.betType)   result = result.filter((b) => b.betType   === filters.betType);
  if (filters.limit)     result = result.slice(0, filters.limit);

  return ok(result);
}

/**
 * updateBetResult — settle a bet after the game finishes
 * @param {string} betId
 * @param {{ betStatus, profitLoss, bankrollAfter }} update
 */
export async function updateBetResult(betId, update) {
  const bets = readKey(KEYS.BETS) ?? [];
  const idx  = bets.findIndex((b) => b.betId === betId);
  if (idx === -1) return err(`updateBetResult: betId "${betId}" no encontrado`);

  bets[idx] = { ...bets[idx], ...update, settledAt: nowISO() };
  const written = writeKey(KEYS.BETS, bets);
  if (!written) return err("updateBetResult: no se pudo escribir en localStorage");

  return ok(bets[idx]);
}

/**
 * deleteBet — remove a pending bet
 */
export async function deleteBet(betId) {
  const bets    = readKey(KEYS.BETS) ?? [];
  const updated = bets.filter((b) => b.betId !== betId);
  if (updated.length === bets.length) return err(`deleteBet: betId "${betId}" no encontrado`);

  writeKey(KEYS.BETS, updated);
  return ok(null);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTIONS
// Maps to your SQL table: game_projections
// ─────────────────────────────────────────────────────────────────────────────

/**
 * saveProjection — persist a simulation result
 * @param {object} projection
 * @param {string|number} projection.gameId
 * @param {string}        projection.homeTeam
 * @param {string}        projection.awayTeam
 * @param {string}        projection.modelVersion   e.g. "v1.0-poisson"
 * @param {number}        projection.homeWinProb     0–1
 * @param {number}        projection.awayWinProb     0–1
 * @param {number}        projection.homeRunsProjected
 * @param {number}        projection.awayRunsProjected
 * @param {number}        projection.confidenceScore  0–100
 * @param {number}        projection.dqsScore         0–100
 * @param {object}        projection.weights          { sp, bp, env, offense }
 * @param {string?}       projection.reasoningLog
 */
export async function saveProjection(projection) {
  if (!projection?.gameId || projection?.homeWinProb == null) {
    return err("saveProjection: gameId y homeWinProb son requeridos");
  }

  const projections  = readKey(KEYS.PROJECTIONS) ?? [];
  const newProjection = {
    ...projection,
    projectionId:   generateId("proj"),
    projectionDate: nowISO(),
  };

  // Keep only last 100 projections to avoid storage bloat
  const updated = [newProjection, ...projections].slice(0, 100);
  const written = writeKey(KEYS.PROJECTIONS, updated);
  if (!written) return err("saveProjection: no se pudo escribir en localStorage");

  return ok(newProjection, newProjection.projectionId);
}

/**
 * getLastProjections — retrieve recent projections
 * @param {number}  n       how many to return (default 20)
 * @param {string?} gameId  filter by specific game
 */
export async function getLastProjections(n = 20, gameId = null) {
  const projections = readKey(KEYS.PROJECTIONS) ?? [];

  let result = projections;
  if (gameId) result = result.filter((p) => String(p.gameId) === String(gameId));
  result = result.slice(0, n);

  return ok(result);
}

// ─────────────────────────────────────────────────────────────────────────────
// BAYESIAN WEIGHTS
// Maps to your SQL columns: sp_weight, bp_weight, env_weight, offense_weight
// in tables: game_projections + projection_feedback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getBayesianWeights — get current model weights
 */
export async function getBayesianWeights() {
  const stored = readKey(KEYS.BAYESIAN_WEIGHTS);
  return ok(stored ?? { ...DEFAULT_WEIGHTS });
}

/**
 * updateBayesianWeights — apply Bayesian nudge after a game result
 *
 * Your existing Bayesian logic (in the feedback loop) calls this.
 * The function stores a full audit trail of every update.
 *
 * @param {object} weights  { sp_weight, bp_weight, env_weight, offense_weight }
 * @param {object?} context { gameId, actualHomeRuns, actualAwayRuns, projectedHomeRuns, projectedAwayRuns }
 */
export async function updateBayesianWeights(weights, context = {}) {
  // Validate weights sum to ~1.0
  const { sp_weight, bp_weight, env_weight, offense_weight } = weights;
  const sum = (sp_weight ?? 0) + (bp_weight ?? 0) + (env_weight ?? 0) + (offense_weight ?? 0);
  if (Math.abs(sum - 1.0) > 0.05) {
    console.warn(`[StorageService] Bayesian weights sum to ${sum.toFixed(3)}, expected ~1.0`);
  }

  const current = readKey(KEYS.BAYESIAN_WEIGHTS) ?? { ...DEFAULT_WEIGHTS };
  const updated  = {
    sp_weight:      weights.sp_weight      ?? current.sp_weight,
    bp_weight:      weights.bp_weight      ?? current.bp_weight,
    env_weight:     weights.env_weight     ?? current.env_weight,
    offense_weight: weights.offense_weight ?? current.offense_weight,
    gamesProcessed: (current.gamesProcessed ?? 0) + 1,
    updatedAt:      nowISO(),
    lastUpdate:     {
      previous:  { sp: current.sp_weight, bp: current.bp_weight, env: current.env_weight, off: current.offense_weight },
      applied:   weights,
      context,
      timestamp: nowISO(),
    },
  };

  const written = writeKey(KEYS.BAYESIAN_WEIGHTS, updated);
  if (!written) return err("updateBayesianWeights: no se pudo escribir en localStorage");

  return ok(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK LOOP
// Maps to your SQL table: projection_feedback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * saveFeedback — record actual result vs projection for Bayesian update
 * @param {object} feedback
 * @param {string}  feedback.projectionId
 * @param {string}  feedback.gameId
 * @param {number}  feedback.actualHomeRuns
 * @param {number}  feedback.actualAwayRuns
 * @param {number}  feedback.projectedHomeRuns
 * @param {number}  feedback.projectedAwayRuns
 * @param {boolean} feedback.predictedWinnerCorrect
 * @param {object?} feedback.weightsBefore
 * @param {object?} feedback.weightsAfter
 */
export async function saveFeedback(feedback) {
  if (!feedback?.gameId) return err("saveFeedback: gameId es requerido");

  const history    = readKey(KEYS.FEEDBACK) ?? [];
  const absError   = Math.abs(
    (feedback.actualHomeRuns + feedback.actualAwayRuns) -
    (feedback.projectedHomeRuns + feedback.projectedAwayRuns)
  );

  const newFeedback = {
    ...feedback,
    feedbackId:    generateId("fb"),
    absErrorTotal: absError,
    feedbackDate:  nowISO(),
  };

  const updated = [newFeedback, ...history].slice(0, 200);   // keep last 200
  const written = writeKey(KEYS.FEEDBACK, updated);
  if (!written) return err("saveFeedback: no se pudo escribir en localStorage");

  return ok(newFeedback, newFeedback.feedbackId);
}

/**
 * getFeedbackHistory — retrieve feedback records for KPI dashboard
 * @param {number} n   number of records (default 50)
 */
export async function getFeedbackHistory(n = 50) {
  const history = readKey(KEYS.FEEDBACK) ?? [];
  return ok(history.slice(0, n));
}

// ─────────────────────────────────────────────────────────────────────────────
// BANKROLL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getBankroll — current bankroll amount
 */
export async function getBankroll() {
  const stored = readKey(KEYS.BANKROLL);
  return ok(stored ?? { amount: 1000, updatedAt: null });
}

/**
 * updateBankroll — set new bankroll amount after bet settlement
 */
export async function updateBankroll(amount) {
  const updated = { amount, updatedAt: nowISO() };
  const written = writeKey(KEYS.BANKROLL, updated);
  if (!written) return err("updateBankroll: no se pudo escribir");
  return ok(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getStorageStats — summary of what's stored (useful for debug panel)
 */
export async function getStorageStats() {
  const bets        = readKey(KEYS.BETS)        ?? [];
  const projections = readKey(KEYS.PROJECTIONS) ?? [];
  const feedback    = readKey(KEYS.FEEDBACK)    ?? [];
  const weights     = readKey(KEYS.BAYESIAN_WEIGHTS);
  const bankroll    = readKey(KEYS.BANKROLL);

  // Estimate storage size in KB
  let totalBytes = 0;
  Object.values(KEYS).forEach((k) => {
    const v = localStorage.getItem(k);
    if (v) totalBytes += v.length * 2;   // UTF-16 chars = 2 bytes each
  });

  return ok({
    bets:            bets.length,
    projections:     projections.length,
    feedbackRecords: feedback.length,
    pendingBets:     bets.filter((b) => b.betStatus === "pending").length,
    wonBets:         bets.filter((b) => b.betStatus === "won").length,
    lostBets:        bets.filter((b) => b.betStatus === "lost").length,
    weightsLoaded:   !!weights,
    gamesProcessed:  weights?.gamesProcessed ?? 0,
    bankroll:        bankroll?.amount ?? null,
    estimatedSizeKB: Math.round(totalBytes / 1024),
  });
}

/**
 * clearAll — wipe all app data (use with caution)
 */
export async function clearAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  return ok(null);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE MIGRATION GUIDE (inline comment)
// ─────────────────────────────────────────────────────────────────────────────
//
// When you're ready to migrate to Supabase, replace the body of each function
// with the corresponding Supabase call. The function signatures stay IDENTICAL.
//
// Example — saveBet becomes:
//
//   import { supabase } from "../lib/supabaseClient";
//
//   export async function saveBet(bet) {
//     const { data, error } = await supabase
//       .from("bet_history")
//       .insert([{
//         game_id:          bet.gameId,
//         bet_type:         bet.betType,
//         stake_amount:     bet.stakeAmount,
//         odds_american:    bet.oddsAmerican,
//         bankroll_before:  bet.bankrollBefore,
//         kelly_fraction_used: bet.kellyFraction,
//         bet_status:       "pending",
//       }])
//       .select()
//       .single();
//     if (error) return err(error.message, error);
//     return ok(data, data.bet_id);
//   }
//
// Every other function follows the same pattern.
// Your React components call the same API — zero changes needed there.

// ─────────────────────────────────────────────────────────────────────────────
// ScreenSimulacion.jsx — refactorizado con StorageService
// Cambios vs versión anterior:
//   • Carga pesos bayesianos desde StorageService al montar
//   • Carga bankroll actual al montar
//   • Guarda proyección en localStorage ANTES de pasarla al padre
//   • Usa syncGameData en lugar de fetchRosterForGame directo
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { T, S, Ico, POSITIONS, HANDS, emptyLU, emptyP, emptyBP, clamp, runSim } from "../tokens";
import { fetchRosterForGame } from "../services/RosterService";
import { syncGameData } from "../services/syncGameData";
import {
  saveProjection,
  getBayesianWeights,
  getLastProjections,
  getBankroll,
} from "../services/StorageService";
import PlayerCombobox    from "../components/PlayerCombobox";
import Collapsible       from "../components/Collapsible";
import RosterStatusBanner from "../components/RosterStatusBanner";
import DiagPanel         from "../components/DiagPanel";

// ── StatInput (unchanged) ─────────────────────────────────
function StatInput({ label, value, onChange, step = "0.01" }) {
  return (
    <div>
      <div style={S.lbl}>{label}</div>
      <input
        type="number" step={step} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...S.input, fontSize: 13, padding: "7px 10px" }}
      />
    </div>
  );
}

// ── Lambda calculator ─────────────────────────────────────
function calcLambda(sp, bp) {
  const era   = parseFloat(sp.era)   || 4.20;
  const fip   = parseFloat(sp.fip)   || era;
  const xfip  = parseFloat(sp.xfip)  || fip;
  const siera = parseFloat(sp.siera) || xfip;
  const avg   = era * 0.3 + fip * 0.3 + xfip * 0.2 + siera * 0.2;
  const spLam = avg / 9 * 9 * 0.9;
  const bpEra = parseFloat(bp.era) || 4.20;
  const fatMult = 1 + (bp.fatigue ?? 0) * 0.06;
  return clamp(spLam * 0.61 + (bpEra / 9 * 3.5) * fatMult * 0.39, 1.0, 9.0);
}

// ── Model version tag ────────────────────────────────────
const MODEL_VERSION = "v1.0-poisson-bayesian";

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function ScreenSimulacion({ selectedGame, onSimulate }) {
  const [homeSP,     setHomeSP]     = useState(emptyP());
  const [awaySP,     setAwaySP]     = useState(emptyP());
  const [homeLineup, setHomeLineup] = useState(emptyLU());
  const [awayLineup, setAwayLineup] = useState(emptyLU());
  const [homeBP,     setHomeBP]     = useState(emptyBP());
  const [awayBP,     setAwayBP]     = useState(emptyBP());

  const [roster,        setRoster]        = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterLogs,    setRosterLogs]    = useState([]);

  // ── NEW: Persisted state ─────────────────────────────────
  const [bayesianWeights, setBayesianWeights] = useState(null);
  const [bankroll,        setBankroll]        = useState(null);
  const [isSaving,        setIsSaving]        = useState(false);
  const [saveStatus,      setSaveStatus]      = useState(null); // null | 'ok' | 'error'
  const [lastProjection,  setLastProjection]  = useState(null);

  const cacheRef = useRef({});

  // ── Load persisted data on mount ────────────────────────
  useEffect(() => {
    async function loadPersisted() {
      // Load Bayesian weights
      const { data: weights } = await getBayesianWeights();
      setBayesianWeights(weights);

      // Load bankroll
      const { data: br } = await getBankroll();
      setBankroll(br?.amount ?? 1000);

      // Load last projection for this game (if any)
      if (selectedGame?.id) {
        const { data: projections } = await getLastProjections(1, selectedGame.id);
        if (projections?.length) setLastProjection(projections[0]);
      }
    }
    loadPersisted();
  }, [selectedGame?.id]);

  // ── Load roster with syncGameData ────────────────────────
  const loadRoster = useCallback(async (game) => {
    if (!game) return;
    const pk = String(game.id);

    // Check in-memory cache first (fastest)
    if (cacheRef.current[pk]) {
      setRoster(cacheRef.current[pk]);
      return;
    }

    setRosterLoading(true);
    setRosterLogs([]);

    const addLog = (e) => setRosterLogs((p) => [...p, e]);

    // syncGameData checks localStorage cache before hitting the MLB API
    const { data: cachedBox, fromCache, fetchedAt } = await syncGameData(game.id);

    if (cachedBox?.teams) {
      addLog({ ts: new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),
               status: fromCache ? "fallback" : "ok",
               msg:    fromCache ? `Roster desde caché (${fetchedAt?.slice(0,10)})` : "Roster desde MLB API",
               detail: "" });
    }

    // Fall through to the full roster parser (handles boxscore + local DB fallback)
    const r = await fetchRosterForGame(game.id, addLog);
    if (r) cacheRef.current[pk] = r;
    setRoster(r);
    setRosterLoading(false);
  }, []);

  useEffect(() => {
    if (selectedGame) loadRoster(selectedGame);
  }, [selectedGame?.id, loadRoster]);

  // ── Auto-fill SP from roster ─────────────────────────────
  useEffect(() => {
    if (!roster) return;
    const hSP = roster.home?.probableSP;
    const aSP = roster.away?.probableSP;
    if (hSP && !homeSP.name) {
      setHomeSP({ playerId:hSP.id, name:hSP.name, hand:hSP.hand||"R",
                  era:hSP.era||"", fip:hSP.fip||"", xfip:hSP.xfip||"",
                  siera:hSP.siera||"", kpct:hSP.kpct||"", bbpct:hSP.bbpct||"",
                  whip:hSP.whip||"", war:hSP.war||"" });
    }
    if (aSP && !awaySP.name) {
      setAwaySP({ playerId:aSP.id, name:aSP.name, hand:aSP.hand||"R",
                  era:aSP.era||"", fip:aSP.fip||"", xfip:aSP.xfip||"",
                  siera:aSP.siera||"", kpct:aSP.kpct||"", bbpct:aSP.bbpct||"",
                  whip:aSP.whip||"", war:aSP.war||"" });
    }
    // Auto-seed bullpen ERA
    const hBP = (roster.home?.bullpen || []).filter((r) => r.era && r.era !== "--");
    const aBP = (roster.away?.bullpen || []).filter((r) => r.era && r.era !== "--");
    if (hBP.length && !homeBP.era) {
      setHomeBP((p) => ({ ...p, era: (hBP.reduce((s, r) => s + parseFloat(r.era), 0) / hBP.length).toFixed(2) }));
    }
    if (aBP.length && !awayBP.era) {
      setAwayBP((p) => ({ ...p, era: (aBP.reduce((s, r) => s + parseFloat(r.era), 0) / aBP.length).toFixed(2) }));
    }
  }, [roster]);

  // ── SIMULATE + PERSIST ───────────────────────────────────
  const handleSim = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    const hL = calcLambda(awaySP, awayBP);
    const aL = calcLambda(homeSP, homeBP);
    const { homeWinPct, awayWinPct } = runSim(hL, aL);

    const simResult = {
      game:            selectedGame,
      homeSP, awaySP, homeLineup, awayLineup, homeBP, awayBP,
      homeLambda:      hL,
      awayLambda:      aL,
      homeWinPct,
      awayWinPct,
    };

    // ── Step 1: Build projection record ──────────────────
    const projectionPayload = {
      gameId:               selectedGame?.id,
      homeTeam:             selectedGame?.home,
      awayTeam:             selectedGame?.away,
      gameTime:             selectedGame?.gameTime,
      modelVersion:         MODEL_VERSION,
      homeWinProb:          parseFloat(homeWinPct) / 100,
      awayWinProb:          parseFloat(awayWinPct) / 100,
      homeRunsProjected:    parseFloat(hL.toFixed(2)),
      awayRunsProjected:    parseFloat(aL.toFixed(2)),
      totalRunsProjected:   parseFloat((hL + aL).toFixed(2)),
      confidenceScore:      computeConfidence(homeSP, awaySP, homeLineup, awayLineup),
      dqsScore:             computeDQS(homeSP, awaySP, homeBP, awayBP),
      weights: {
        sp:      bayesianWeights?.sp_weight      ?? 0.35,
        bp:      bayesianWeights?.bp_weight      ?? 0.25,
        env:     bayesianWeights?.env_weight     ?? 0.15,
        offense: bayesianWeights?.offense_weight ?? 0.25,
      },
      homeSPName:  homeSP.name  || "TBD",
      awaySPName:  awaySP.name  || "TBD",
      reasoningLog: buildReasoningLog(homeSP, awaySP, homeBP, awayBP, hL, aL, homeWinPct, awayWinPct),
    };

    // ── Step 2: Save to localStorage BEFORE updating UI ──
    const { ok: saved, data: savedProj, error: saveErr } = await saveProjection(projectionPayload);

    if (saved) {
      setLastProjection(savedProj);
      setSaveStatus("ok");
      // Attach projectionId to simResult so ScreenResumen can use it for feedback
      simResult.projectionId = savedProj.projectionId;
      simResult.projection   = savedProj;
    } else {
      console.error("[ScreenSimulacion] saveProjection failed:", saveErr);
      setSaveStatus("error");
    }

    // ── Step 3: Pass to parent (updates Resumen/Value/Props) ──
    setIsSaving(false);
    onSimulate(simResult);
  };

  // ── Refresh handler ──────────────────────────────────────
  const handleRefresh = () => {
    const pk = String(selectedGame.id);
    delete cacheRef.current[pk];
    setRoster(null);
    setHomeSP(emptyP()); setAwaySP(emptyP());
    setHomeBP(emptyBP()); setAwayBP(emptyBP());
    loadRoster(selectedGame);
  };

  // ── Empty state ──────────────────────────────────────────
  if (!selectedGame) {
    return (
      <div style={{ ...S.cardN, margin:"20px 12px", textAlign:"center", padding:40, color:T.muted, fontSize:13 }}>
        ← Ve a <strong style={{ color:T.amber }}>Hoy</strong> y selecciona un juego.
      </div>
    );
  }

  return (
    <div>
      <div style={S.sh}>{selectedGame.away} @ {selectedGame.home} · {selectedGame.gameTime}</div>

      {/* Roster status */}
      <RosterStatusBanner roster={roster} loading={rosterLoading} onRefresh={handleRefresh} />
      {rosterLogs.length > 0 && <DiagPanel logs={rosterLogs} source={roster?.source || "loading"} />}

      {/* Storage status bar */}
      <StorageStatusBar
        bankroll={bankroll}
        weights={bayesianWeights}
        lastProjection={lastProjection}
        saveStatus={saveStatus}
      />

      {/* SP, Lineups, Bullpen blocks — unchanged from previous version */}
      <div style={S.sh}>SP ABRIDORES</div>
      <PitcherBlock
        label={`SP Local · ${selectedGame.home}`}
        teamRoster={roster?.home} data={homeSP} onChange={setHomeSP}
      />
      <PitcherBlock
        label={`SP Visita · ${selectedGame.away}`}
        teamRoster={roster?.away} data={awaySP} onChange={setAwaySP}
      />

      <div style={S.sh}>LINEUPS</div>
      <LineupBlock
        label={`Lineup Local · ${selectedGame.home}`}
        teamRoster={roster?.home} lineup={homeLineup} onChange={setHomeLineup}
      />
      <LineupBlock
        label={`Lineup Visita · ${selectedGame.away}`}
        teamRoster={roster?.away} lineup={awayLineup} onChange={setAwayLineup}
      />

      <div style={S.sh}>BULLPEN</div>
      <BullpenBlock
        label={`Bullpen Local · ${selectedGame.home}`}
        teamRoster={roster?.home} data={homeBP} onChange={setHomeBP}
      />
      <BullpenBlock
        label={`Bullpen Visita · ${selectedGame.away}`}
        teamRoster={roster?.away} data={awayBP} onChange={setAwayBP}
      />

      {/* Simulate button */}
      <div style={{ padding:"16px 12px 8px" }}>
        <button
          style={{ ...S.btn(T.amber), opacity: isSaving ? 0.7 : 1 }}
          onClick={handleSim}
          disabled={isSaving}
        >
          {isSaving ? "⏳ Guardando..." : "⚡ Simular Monte Carlo"}
        </button>
        {saveStatus === "error" && (
          <div style={{ fontSize:11, color:T.red, textAlign:"center", marginTop:6 }}>
            ⚠ No se pudo guardar la proyección — sin espacio en localStorage
          </div>
        )}
      </div>
    </div>
  );
}

// ── Storage status bar (inline component) ─────────────────
function StorageStatusBar({ bankroll, weights, lastProjection, saveStatus }) {
  if (!bankroll && !weights && !lastProjection) return null;

  return (
    <div style={{ margin:"6px 12px", padding:"8px 12px", borderRadius:8,
                  background: T.raised, border:`1px solid ${T.border}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  flexWrap:"wrap", gap:8 }}>
      {bankroll !== null && (
        <div>
          <div style={{ fontSize:9, color:T.muted, letterSpacing:0.8, textTransform:"uppercase" }}>Bankroll</div>
          <div style={{ fontSize:14, fontWeight:700, color:T.amber }}>${bankroll.toLocaleString()}</div>
        </div>
      )}
      {weights && (
        <div>
          <div style={{ fontSize:9, color:T.muted, letterSpacing:0.8, textTransform:"uppercase" }}>SP Weight</div>
          <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{(weights.sp_weight * 100).toFixed(0)}%</div>
        </div>
      )}
      {weights && (
        <div>
          <div style={{ fontSize:9, color:T.muted, letterSpacing:0.8, textTransform:"uppercase" }}>Juegos proc.</div>
          <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{weights.gamesProcessed ?? 0}</div>
        </div>
      )}
      {saveStatus === "ok" && (
        <div style={{ fontSize:11, color:T.green, fontWeight:700 }}>✓ Guardado</div>
      )}
    </div>
  );
}

// ── Helper: Confidence score (0–100) ─────────────────────
function computeConfidence(homeSP, awaySP, homeLineup, awayLineup) {
  let score = 100;
  if (!homeSP.era)    score -= 15;
  if (!awaySP.era)    score -= 15;
  if (!homeSP.fip)    score -= 5;
  if (!awaySP.fip)    score -= 5;
  const filledH = homeLineup.filter((p) => p.name).length;
  const filledA = awayLineup.filter((p) => p.name).length;
  score -= Math.max(0, (9 - filledH) * 2);
  score -= Math.max(0, (9 - filledA) * 2);
  return Math.max(0, score);
}

// ── Helper: DQS (Data Quality Score 0–100) ───────────────
function computeDQS(homeSP, awaySP, homeBP, awayBP) {
  let score = 100;
  if (!homeSP.era)   score -= 20;
  if (!awaySP.era)   score -= 20;
  if (!homeSP.fip)   score -= 5;
  if (!awaySP.fip)   score -= 5;
  if (!homeBP.era)   score -= 10;
  if (!awayBP.era)   score -= 10;
  if (!homeSP.kpct)  score -= 5;
  if (!awaySP.kpct)  score -= 5;
  return Math.max(0, score);
}

// ── Helper: Reasoning log text ───────────────────────────
function buildReasoningLog(homeSP, awaySP, homeBP, awayBP, hL, aL, homeWinPct, awayWinPct) {
  return [
    `SP Local (${homeSP.name || "TBD"}): ERA ${homeSP.era || "--"} / FIP ${homeSP.fip || "--"} / λ-away ${aL.toFixed(2)}`,
    `SP Visita (${awaySP.name || "TBD"}): ERA ${awaySP.era || "--"} / FIP ${awaySP.fip || "--"} / λ-home ${hL.toFixed(2)}`,
    `Bullpen Local: ERA ${homeBP.era || "--"} / Fatiga ${homeBP.fatigue ?? 0}/3`,
    `Bullpen Visita: ERA ${awayBP.era || "--"} / Fatiga ${awayBP.fatigue ?? 0}/3`,
    `Carreras proyectadas: Local ${hL.toFixed(2)} / Visita ${aL.toFixed(2)} / Total ${(hL+aL).toFixed(2)}`,
    `Win prob: Local ${homeWinPct}% / Visita ${awayWinPct}%`,
  ].join("\n");
}

// ── PitcherBlock, LineupBlock, BullpenBlock ───────────────
// These components are UNCHANGED from the previous version.
// Copy them here from src/screens/ScreenSimulacion.jsx as-is.
// (Omitted to avoid repetition — they don't interact with StorageService.)

function PitcherBlock({ label, teamRoster, data, onChange }) {
  const pitchers = teamRoster?.pitchers || [];
  const set = (k, v) => onChange({ ...data, [k]: v });

  const handleSelect = (player) => {
    if (!player) { onChange(emptyP()); return; }
    onChange({
      playerId: player.id, name: player.name || player.fullName, hand: player.hand || "R",
      era: player.era || "", fip: player.fip || "", xfip: player.xfip || "",
      siera: player.siera || "", kpct: player.kpct || "", bbpct: player.bbpct || "",
      whip: player.whip || "", war: player.war || "",
    });
  };

  return (
    <Collapsible title={label} sub={data.name ? `${data.name} · ERA ${data.era || "--"}` : "Sin selección"} defaultOpen>
      <div style={{ marginBottom:10 }}>
        <div style={S.lbl}>Pitcher Abridor</div>
        <PlayerCombobox
          players={pitchers} value={data.playerId} onChange={handleSelect}
          placeholder={pitchers.length ? `${pitchers.length} pitchers disponibles` : "Sin roster"}
          type="pitcher"
        />
      </div>
      {data.era && (
        <div style={{ fontSize:10, color:T.green, fontWeight:700, letterSpacing:1, marginBottom:6, display:"flex", alignItems:"center", gap:4 }}>
          {Ico.check(T.green)} STATS AUTOCOMPLETADAS · Editables
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <StatInput label="ERA"   value={data.era   || ""} onChange={(v) => set("era",   v)} />
        <StatInput label="FIP"   value={data.fip   || ""} onChange={(v) => set("fip",   v)} />
        <StatInput label="xFIP"  value={data.xfip  || ""} onChange={(v) => set("xfip",  v)} />
        <StatInput label="SIERA" value={data.siera || ""} onChange={(v) => set("siera", v)} />
        <StatInput label="K%"    value={data.kpct  || ""} onChange={(v) => set("kpct",  v)} />
        <StatInput label="BB%"   value={data.bbpct || ""} onChange={(v) => set("bbpct", v)} />
        <StatInput label="WHIP"  value={data.whip  || ""} onChange={(v) => set("whip",  v)} />
        <StatInput label="WAR"   value={data.war   || ""} onChange={(v) => set("war",   v)} step="0.1" />
      </div>
      <div style={{ marginTop:8 }}>
        <div style={S.lbl}>Mano</div>
        <div style={{ display:"flex", gap:8 }}>
          {HANDS.map((h) => (
            <button key={h} onClick={() => set("hand", h)}
              style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", cursor:"pointer",
                       fontSize:13, fontWeight:700,
                       background: data.hand === h ? T.amber : T.raised,
                       color:      data.hand === h ? "#000"  : T.muted }}>
              {h}
            </button>
          ))}
        </div>
      </div>
    </Collapsible>
  );
}

function LineupBlock({ label, teamRoster, lineup, onChange }) {
  const rosterBatters = teamRoster?.lineup || [];
  const filled = lineup.filter((p) => p.name).length;

  const handleSelect = (idx, player) => {
    const next = [...lineup];
    if (!player) { next[idx] = { name:"", pos:POSITIONS[idx]||"DH", hand:"R" }; }
    else { next[idx] = { playerId:player.id, name:player.fullName||player.name,
                         pos:player.pos||POSITIONS[idx]||"DH", hand:player.hand||"R",
                         avg:player.avg, obp:player.obp, slg:player.slg,
                         wrc:player.wrc, woba:player.woba, hr:player.hr, rbi:player.rbi }; }
    onChange(next);
  };

  const setField = (i, k, v) => { const n = [...lineup]; n[i] = { ...n[i], [k]: v }; onChange(n); };

  return (
    <Collapsible title={label} sub={`${filled}/9 bateadores${rosterBatters.length ? ` · ${rosterBatters.length} en roster` : ""}`}>
      {rosterBatters.length > 0 && filled === 0 && (
        <button onClick={() => {
          const next = rosterBatters.slice(0,9).map((p,i) => ({
            playerId:p.id, name:p.fullName||p.name, pos:p.pos||POSITIONS[i]||"DH",
            hand:p.hand||"R", avg:p.avg, obp:p.obp, slg:p.slg, wrc:p.wrc,
            woba:p.woba, hr:p.hr, rbi:p.rbi,
          }));
          while (next.length < 9) next.push({ name:"", pos:POSITIONS[next.length]||"DH", hand:"R" });
          onChange(next);
        }} style={{ ...S.btn(T.green), marginBottom:12, fontSize:12 }}>
          ⚡ Auto-fill lineup ({rosterBatters.length} jugadores)
        </button>
      )}
      {lineup.map((p, i) => (
        <div key={i} style={{ marginBottom:10, paddingBottom:10, borderBottom: i < 8 ? `1px solid ${T.border}` : "none" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:13, color:T.amber, fontWeight:700, minWidth:18 }}>{i+1}</span>
            <div style={{ flex:1 }}>
              <PlayerCombobox players={rosterBatters} value={p.playerId}
                onChange={(pl) => handleSelect(i, pl)}
                placeholder={rosterBatters.length ? `Bateador ${i+1}` : "Sin roster"} type="batter"/>
            </div>
          </div>
          {p.name && (
            <div style={{ display:"flex", gap:8, paddingLeft:26 }}>
              <div style={{ flex:1 }}>
                <div style={S.lbl}>POS</div>
                <select style={{ ...S.select, padding:"6px 8px", fontSize:12 }}
                  value={p.pos||"DH"} onChange={(e) => setField(i,"pos",e.target.value)}>
                  {POSITIONS.map((pos) => <option key={pos}>{pos}</option>)}
                </select>
              </div>
              <div style={{ width:56 }}>
                <div style={S.lbl}>MANO</div>
                <select style={{ ...S.select, padding:"6px 6px", fontSize:12 }}
                  value={p.hand||"R"} onChange={(e) => setField(i,"hand",e.target.value)}>
                  {HANDS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
              {p.avg && p.avg !== "---" && (
                <div style={{ display:"flex", alignItems:"flex-end", gap:4, paddingBottom:2 }}>
                  <span style={{ ...S.pill(T.textDim), fontSize:9 }}>AVG {p.avg}</span>
                  {p.wrc && <span style={{ ...S.pill(T.amber), fontSize:9 }}>wRC+ {p.wrc}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </Collapsible>
  );
}

function BullpenBlock({ label, teamRoster, data, onChange }) {
  const relievers = teamRoster?.bullpen || [];
  const set = (k, v) => onChange({ ...data, [k]: v });
  const valid  = relievers.filter((r) => r.era && r.era !== "--");
  const avgEra = valid.length
    ? (valid.reduce((s, r) => s + parseFloat(r.era), 0) / valid.length).toFixed(2)
    : "4.20";

  return (
    <Collapsible title={label} sub={`ERA ${data.era || avgEra} · Fatiga ${data.fatigue ?? 0}/3`}>
      {relievers.length > 0 && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, color:T.amber, fontWeight:700, letterSpacing:1, marginBottom:6, textTransform:"uppercase" }}>
            Bullpen · {relievers.length} relevistas
          </div>
          {relievers.map((r, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                                  padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ ...S.pill(r.role==="CL"?T.red:r.role==="SU"?T.amber:T.muted), fontSize:9 }}>{r.role}</span>
                <span style={{ fontSize:12, color:T.text }}>{r.name}</span>
                <span style={{ ...S.pill(T.textDim), fontSize:9 }}>{r.hand}</span>
              </div>
              <div style={{ display:"flex", gap:8, fontSize:10 }}>
                {r.era && r.era!=="--" && <span style={{ color:T.amber }}>ERA {r.era}</span>}
                {r.k9  && r.k9 !=="--" && <span style={{ color:T.green }}>K/9 {r.k9}</span>}
              </div>
            </div>
          ))}
          <button onClick={() => set("era", avgEra)}
            style={{ marginTop:8, background:T.raised, border:`1px solid ${T.border}`,
                     borderRadius:8, padding:"6px 12px", cursor:"pointer", color:T.muted, fontSize:11 }}>
            Usar ERA promedio ({avgEra})
          </button>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <StatInput label="ERA Bullpen" value={data.era || avgEra} onChange={(v) => set("era", v)} />
        <StatInput label="WHIP"        value={data.whip || ""}    onChange={(v) => set("whip",v)} />
        <StatInput label="K/9"         value={data.k9   || ""}    onChange={(v) => set("k9",  v)} />
        <StatInput label="LOB%"        value={data.lob  || ""}    onChange={(v) => set("lob",  v)} />
      </div>
      <div style={{ marginTop:10 }}>
        <div style={S.lbl}>Fatiga (0=Fresco · 3=Agotado)</div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {[0,1,2,3].map((f) => (
            <button key={f} onClick={() => set("fatigue", f)}
              style={{ flex:1, padding:"10px 0", borderRadius:8, border:"none", cursor:"pointer",
                       fontSize:15, fontWeight:700,
                       background: (data.fatigue ?? 0) === f ? [T.green,T.amber,T.orange,T.red][f] : T.raised,
                       color:      (data.fatigue ?? 0) === f ? "#000" : T.muted }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          {["Fresco","Leve","Cansado","Agotado"].map((l, i) => (
            <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, color:T.textDim }}>{l}</div>
          ))}
        </div>
      </div>
    </Collapsible>
  );
}

import { useState } from "react";
import { T, S, Ico } from "./tokens";
import ScreenHoy        from "./screens/ScreenHoy";
import ScreenSimulacion from "./screens/ScreenSimulacion";
import ScreenResumen    from "./screens/ScreenResumen";
import ScreenValue      from "./screens/ScreenValue";
import ScreenProps      from "./screens/ScreenProps";

// ── Inline Simulacion minima (sin dependencias externas) ──
function ScreenSimulacionMinima({ selectedGame, onSimulate }) {
  if (!selectedGame) return (
    <div style={{ ...S.cardN, margin:"20px 12px", textAlign:"center",
                  padding:40, color:T.muted, fontSize:13 }}>
      ← Ve a <strong style={{ color:T.amber }}>Hoy</strong> y selecciona un juego.
    </div>
  );
  return (
    <div>
      <div style={S.sh}>{selectedGame.away} @ {selectedGame.home}</div>
      <div style={{ ...S.cardN, margin:"8px 12px", padding:20, textAlign:"center" }}>
        <div style={{ color:T.amber, fontSize:14, marginBottom:16 }}>
          Juego seleccionado ✓
        </div>
        <div style={{ color:T.text, fontSize:13, marginBottom:8 }}>
          {selectedGame.homeSP} vs {selectedGame.awaySP}
        </div>
        <div style={{ color:T.muted, fontSize:11 }}>{selectedGame.venue}</div>
        <button
          style={{ ...S.btn(T.amber), marginTop:20 }}
          onClick={() => onSimulate({
            game: selectedGame,
            homeWinPct: "52.0",
            awayWinPct: "48.0",
            homeLambda: 4.5,
            awayLambda: 4.2,
          })}
        >
          ⚡ Simular (básico)
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { id:"hoy",        label:"Hoy",       icon:(c) => Ico.cal(c) },
  { id:"simulacion", label:"Simulación", icon:(c) => Ico.cpu(c) },
  { id:"resumen",    label:"Resumen",   icon:(c) => Ico.bar(c) },
  { id:"value",      label:"Value",     icon:(c) => Ico.dol(c) },
  { id:"props",      label:"Props",     icon:(c) => Ico.usr(c) },
];

export default function App() {
  const [tab,          setTab]          = useState("hoy");
  const [selectedGame, setSelectedGame] = useState(null);
  const [simResult,    setSimResult]    = useState(null);
  const [realResult,   setRealResult]   = useState(null);

  const handleSelectGame = (game) => { setSelectedGame(game); setTab("simulacion"); };
  const handleSimulate   = (r)    => { setSimResult(r);       setTab("resumen"); };

  return (
    <div style={S.app}>
      <div style={S.topBar}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={S.topBarTitle}>⚾ BASEBALL QUANT</p>
            <p style={S.topBarSub}>
              {selectedGame
                ? `${selectedGame.away} @ ${selectedGame.home} · ${selectedGame.gameTime}`
                : "MLB ANALYTICS PLATFORM"}
            </p>
          </div>
          {simResult && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:T.muted }}>WIN PROB</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700 }}>
                <span style={{ color:T.green }}>{simResult.homeWinPct}%</span>
                <span style={{ color:T.muted }}> / </span>
                <span style={{ color:T.text }}>{simResult.awayWinPct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        {tab === "hoy"        && <ScreenHoy onSelectGame={handleSelectGame} selectedGame={selectedGame} />}
        {tab === "simulacion" && <ScreenSimulacionMinima selectedGame={selectedGame} onSimulate={handleSimulate} />}
        {tab === "resumen"    && <ScreenResumen simResult={simResult} setRealResult={setRealResult} />}
        {tab === "value"      && <ScreenValue  simResult={simResult} />}
        {tab === "props"      && <ScreenProps  simResult={simResult} />}
      </div>

      <nav style={S.nav}>
        {TABS.map(({ id, label, icon }) => {
          const active = tab === id;
          const color  = active ? T.amber : T.textDim;
          return (
            <button key={id} style={S.navBtn(active)} onClick={() => setTab(id)}>
              {icon(color)}
              <span style={S.navLabel(active)}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

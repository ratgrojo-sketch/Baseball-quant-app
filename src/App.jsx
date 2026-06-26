import { useState } from "react";
import { T, S, Ico } from "./tokens";
import ScreenHoy        from "./screens/ScreenHoy";
import ScreenSimulacion from "./screens/ScreenSimulacion";
import ScreenResumen    from "./screens/ScreenResumen";
import ScreenValue      from "./screens/ScreenValue";
import ScreenProps      from "./screens/ScreenProps";

const TABS = [
  { id:"hoy",        label:"Hoy",        icon:(c) => Ico.cal(c) },
  { id:"simulacion", label:"Simulación",  icon:(c) => Ico.cpu(c) },
  { id:"resumen",    label:"Resumen",     icon:(c) => Ico.bar(c) },
  { id:"value",      label:"Value",       icon:(c) => Ico.dol(c) },
  { id:"props",      label:"Props",       icon:(c) => Ico.usr(c) },
];

export default function App() {
  const [tab,           setTab]           = useState("hoy");
  const [selectedGame,  setSelectedGame]  = useState(null);
  const [simResult,     setSimResult]     = useState(null);
  const [realResult,    setRealResult]    = useState(null);

  const handleSelectGame = (game) => { setSelectedGame(game); setTab("simulacion"); };
  const handleSimulate   = (r)    => { setSimResult(r);       setTab("resumen"); };

  return (
    <div style={S.app}>
      {/* Top bar */}
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
              <div style={{ fontSize:9, color:T.muted, letterSpacing:0.5 }}>WIN PROB</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700 }}>
                <span style={{ color:T.green }}>{simResult.homeWinPct}%</span>
                <span style={{ color:T.muted }}> / </span>
                <span style={{ color:T.text  }}>{simResult.awayWinPct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screens */}
      <div>
        {tab === "hoy"        && <ScreenHoy        onSelectGame={handleSelectGame} selectedGame={selectedGame} />}
        {tab === "simulacion" && <ScreenSimulacion  selectedGame={selectedGame}    onSimulate={handleSimulate} />}
        {tab === "resumen"    && <ScreenResumen     simResult={simResult}           setRealResult={setRealResult} />}
        {tab === "value"      && <ScreenValue       simResult={simResult} />}
        {tab === "props"      && <ScreenProps       simResult={simResult} />}
      </div>

      {/* Bottom nav */}
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

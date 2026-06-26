import { useState } from "react";
import { T, S, clamp } from "../tokens";

function EdgePill({ pct }) {
  return (
    <span style={{ ...S.edgePill(pct), animation: pct >= 5 ? "edgePulse 1.5s infinite" : "none" }}>
      {pct >= 0 ? "+" : ""}{pct.toFixed(1)}% EDGE
    </span>
  );
}

function BetRow({ type, side, options, simResult }) {
  const [amount, setAmount] = useState("");
  const [sel,    setSel]    = useState(options ? options[0] : "");
  const [odds,   setOdds]   = useState("");

  const iP = odds ? (parseFloat(odds) > 0
    ? 100 / (parseFloat(odds) + 100) * 100
    : Math.abs(parseFloat(odds)) / (Math.abs(parseFloat(odds)) + 100) * 100) : null;
  const mP   = simResult ? (side === "home" ? parseFloat(simResult.homeWinPct) : parseFloat(simResult.awayWinPct)) : null;
  const edge = mP && iP ? mP - iP : null;

  return (
    <div style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:0.8 }}>
          {type} · {side === "home" ? simResult?.game?.home || "LOCAL" : simResult?.game?.away || "VISITA"}
        </div>
        {edge !== null && <EdgePill pct={edge} />}
      </div>
      <div style={{ display:"grid", gridTemplateColumns: options ? "1fr 1fr 1fr" : "1fr 1fr", gap:8 }}>
        {options && (
          <div>
            <div style={S.lbl}>Selección</div>
            <select style={S.select} value={sel} onChange={(e) => setSel(e.target.value)}>
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        )}
        <div><div style={S.lbl}>Odds (USA)</div><input type="number" style={S.input} placeholder="-150" value={odds} onChange={(e) => setOdds(e.target.value)} /></div>
        <div><div style={S.lbl}>Monto $</div><input type="number" style={S.input} placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      </div>
      {iP && (
        <div style={{ marginTop:6, fontSize:11, color:T.muted }}>
          Implícita: <span style={{ color:T.text }}>{iP.toFixed(1)}%</span>
          {mP && <> · Modelo: <span style={{ color:T.amber }}>{mP.toFixed(1)}%</span></>}
        </div>
      )}
    </div>
  );
}

const HC_OPTS = ["-2.5","-1.5","-0.5","0","+1.5","+2.5"];

export default function ScreenValue({ simResult }) {
  const [ouLine, setOuLine] = useState("");
  const [ouOdds, setOuOdds] = useState("");
  const [ouAmt,  setOuAmt]  = useState("");

  if (!simResult) return <div style={{ padding:20, color:T.muted, fontSize:13, textAlign:"center" }}>Completa la simulación primero.</div>;

  return (
    <div>
      <div style={S.sh}>VALUE · {simResult.game?.away} @ {simResult.game?.home}</div>

      <div style={S.card}>
        <div style={{ fontSize:11, color:T.amber, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>LOCAL · {simResult.game?.home}</div>
        <BetRow type="ML"          side="home" simResult={simResult} />
        <BetRow type="Handicap"    side="home" options={HC_OPTS} simResult={simResult} />
        <BetRow type="First Set"   side="home" simResult={simResult} />
        <BetRow type="Handicap FS" side="home" options={["-0.5","-1.5","0","+1.5"]} simResult={simResult} />
      </div>

      <div style={S.card}>
        <div style={{ fontSize:11, color:T.muted, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>VISITA · {simResult.game?.away}</div>
        <BetRow type="ML"          side="away" simResult={simResult} />
        <BetRow type="Handicap"    side="away" options={HC_OPTS} simResult={simResult} />
        <BetRow type="First Set"   side="away" simResult={simResult} />
        <BetRow type="Handicap FS" side="away" options={["-0.5","-1.5","0","+1.5"]} simResult={simResult} />
      </div>

      <div style={S.cardN}>
        <div style={{ fontSize:11, color:T.amber, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>OVER / UNDER</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          <div><div style={S.lbl}>Línea O/U</div><input type="number" step="0.5" style={S.input} placeholder="9.0" value={ouLine} onChange={(e) => setOuLine(e.target.value)} /></div>
          <div><div style={S.lbl}>Odds</div><input type="number" style={S.input} placeholder="-110" value={ouOdds} onChange={(e) => setOuOdds(e.target.value)} /></div>
          <div><div style={S.lbl}>Monto $</div><input type="number" style={S.input} placeholder="100" value={ouAmt} onChange={(e) => setOuAmt(e.target.value)} /></div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          {["OVER","UNDER"].map((side) => {
            const proj  = parseFloat(simResult.homeLambda) + parseFloat(simResult.awayLambda);
            const line  = parseFloat(ouLine) || 9.0;
            const mPct  = clamp(50 + (side === "OVER" ? 1 : -1) * (proj - line) * 8, 5, 95);
            const impl  = ouOdds ? (parseFloat(ouOdds) > 0 ? 100/(parseFloat(ouOdds)+100)*100 : Math.abs(parseFloat(ouOdds))/(Math.abs(parseFloat(ouOdds))+100)*100) : null;
            const edgeV = impl ? mPct - impl : null;
            return (
              <div key={side} style={{ flex:1, background:T.raised, borderRadius:10, padding:10, textAlign:"center" }}>
                <div style={{ fontSize:12, fontWeight:700, color: side==="OVER" ? T.green : T.red, marginBottom:4 }}>{side}</div>
                <div style={{ fontSize:24, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>{mPct.toFixed(0)}%</div>
                {edgeV !== null && <EdgePill pct={edgeV} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

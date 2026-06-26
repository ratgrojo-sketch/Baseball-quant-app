import { useState, useEffect } from "react";
import { T, S, clamp } from "../tokens";

function ScoreInputRow({ label, values, onChange, total }) {
  return (
    <div style={{ ...S.scoreGrid, marginTop:1 }}>
      <div style={{ ...S.scoreCell(true), fontSize:10 }}>{label}</div>
      {values.map((v, i) => (
        <input key={i} type="number" min="0" max="20" value={v === null ? "" : v}
          onChange={(e) => { const n = [...values]; n[i] = e.target.value === "" ? null : parseInt(e.target.value); onChange(n); }}
          style={{ background:T.raised, border:`1px solid ${T.border}`, color:T.text, textAlign:"center", fontSize:12, padding:"4px 0", fontFamily:"'JetBrains Mono',monospace", borderRadius:2, width:"100%", boxSizing:"border-box" }} />
      ))}
      <div style={{ ...S.scoreCell(false), fontWeight:700, color:T.amber, fontSize:12 }}>{total}</div>
    </div>
  );
}

export default function ScreenResumen({ simResult, setRealResult }) {
  const [homeInn, setHomeInn] = useState(Array(9).fill(null));
  const [awayInn, setAwayInn] = useState(Array(9).fill(null));
  const hT = homeInn.reduce((s, v) => s + (v || 0), 0);
  const aT = awayInn.reduce((s, v) => s + (v || 0), 0);

  useEffect(() => { setRealResult({ homeScore:hT, awayScore:aT, homeInn, awayInn }); }, [hT, aT]);

  if (!simResult) return <div style={{ padding:20, color:T.muted, fontSize:13, textAlign:"center" }}>Completa la simulación primero.</div>;

  const { game, homeLambda, awayLambda, homeWinPct, awayWinPct } = simResult;
  const proj = (homeLambda + awayLambda).toFixed(1);
  const line = 9.0;
  const ov = clamp(50 + (homeLambda + awayLambda - line) * 8, 5, 95).toFixed(0);
  const ex = Math.max(5, 20 - Math.abs(homeLambda + awayLambda - line) * 4).toFixed(0);
  const un = (100 - parseFloat(ov) - parseFloat(ex)).toFixed(0);

  return (
    <div>
      <div style={S.sh}>{game?.away} @ {game?.home} · Resumen</div>

      <div style={S.card}>
        <div style={{ fontSize:10, color:T.amber, fontWeight:700, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>Probabilidad de Victoria</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[{ label:`LOCAL · ${game?.home}`, pct:homeWinPct, c:T.green }, { label:`VISITA · ${game?.away}`, pct:awayWinPct, c:T.text }].map(({ label, pct, c }) => (
            <div key={label} style={{ textAlign:"center" }}>
              <div style={S.lbl}>{label}</div>
              <div style={{ fontSize:36, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, color:c }}>{pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.cardN}>
        <div style={{ fontSize:10, color:T.amber, fontWeight:700, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" }}>Predicción de Carreras</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
          {[{ l:"OVER", pct:ov, c:T.green }, { l:"EXACTO", pct:ex, c:T.amber }, { l:"UNDER", pct:un, c:T.red }].map(({ l, pct, c }) => (
            <div key={l}>
              <div style={{ fontSize:10, color:c, fontWeight:700, marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:22, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>{pct}%</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center", marginTop:10, padding:"8px 0", borderTop:`1px solid ${T.border}` }}>
          <span style={S.lbl}>Total proyectado: </span>
          <span style={{ color:T.amber, fontWeight:700, fontSize:16 }}>{proj} carreras</span>
        </div>
      </div>

      <div style={S.cardN}>
        <div style={{ fontSize:10, color:T.amber, fontWeight:700, letterSpacing:1, marginBottom:8, textTransform:"uppercase" }}>Score Proyectado por Entrada</div>
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth:320 }}>
            <div style={S.scoreGrid}>
              <div style={S.scoreCell(true)}>EQUIPO</div>
              {[1,2,3,4,5,6,7,8,9].map((n) => <div key={n} style={S.scoreCell(true)}>{n}</div>)}
              <div style={S.scoreCell(true)}>T</div>
            </div>
            {[{ label:game?.home||"LOCAL", lam:homeLambda }, { label:game?.away||"VISITA", lam:awayLambda }].map(({ label, lam }) => {
              const wts  = [0.9,0.9,1.0,1.0,1.0,1.0,1.1,1.1,1.0];
              const cells = Array.from({ length:9 }, (_, i) => ((lam/9)*wts[i]).toFixed(1));
              const tot   = cells.reduce((s, v) => s + parseFloat(v), 0).toFixed(1);
              return (
                <div key={label} style={{ ...S.scoreGrid, marginTop:1 }}>
                  <div style={{ ...S.scoreCell(true), fontSize:10 }}>{label}</div>
                  {cells.map((v, i) => <div key={i} style={S.scoreCell(false)}>{v}</div>)}
                  <div style={{ ...S.scoreCell(false), color:T.amber, fontWeight:700 }}>{tot}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={S.sh}>Resultados Reales (Feedback Loop)</div>
      <div style={S.cardN}>
        <div style={{ fontSize:10, color:T.muted, marginBottom:8 }}>Ingresa el marcador real al terminar el juego</div>
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth:320 }}>
            <div style={S.scoreGrid}>
              <div style={S.scoreCell(true)}>EQUIPO</div>
              {[1,2,3,4,5,6,7,8,9].map((n) => <div key={n} style={S.scoreCell(true)}>{n}</div>)}
              <div style={S.scoreCell(true)}>T</div>
            </div>
            <ScoreInputRow label={game?.home||"LOCAL"} values={homeInn} onChange={setHomeInn} total={hT} />
            <ScoreInputRow label={game?.away||"VISITA"} values={awayInn} onChange={setAwayInn} total={aT} />
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
          {[
            ["PW","Ganador",      hT>aT ? game?.home : hT<aT ? game?.away : "Empate"],
            ["PS","Proj Total",   proj],
            ["PL","Score Real",   `${aT} – ${hT}`],
            ["MUB","Modelo",      hT>aT && homeLambda>awayLambda ? "✓ ACERTÓ" : "✗ FALLÓ"],
          ].map(([k, l, v]) => (
            <div key={k}>
              <div style={S.lbl}>{l}</div>
              <div style={{ fontSize:13, fontWeight:700, color: k==="MUB" && v.startsWith("✓") ? T.green : k==="MUB" ? T.red : T.text }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

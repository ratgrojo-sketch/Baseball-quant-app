import { T, S } from "../tokens";

export default function ScreenProps({ simResult }) {
  if (!simResult) return <div style={{ padding:20, color:T.muted, fontSize:13, textAlign:"center" }}>Completa la simulación primero.</div>;
  const { game, homeSP, awaySP, homeLineup, awayLineup } = simResult;

  function PropRow({ player, spHand }) {
    if (!player.name) return null;
    const same   = spHand === player.hand;
    const hit    = same ? 22 : 28;
    const obp    = hit + 8;
    const hr     = ["C","1B","RF","LF","DH"].includes(player.pos) ? 8 : 4;
    return (
      <div style={{ padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, fontWeight:700 }}>{player.name}</span>
              <span style={{ ...S.pill(T.blue),    fontSize:9 }}>{player.pos}</span>
              <span style={{ ...S.pill(T.muted),   fontSize:9 }}>{player.hand}</span>
              {same && <span style={{ ...S.pill(T.amber), fontSize:9 }}>SAME HAND</span>}
            </div>
            {player.avg && player.avg !== "---" && (
              <div style={{ fontSize:10, color:T.textDim, marginTop:2, display:"flex", gap:8 }}>
                <span>AVG <span style={{ color:T.text }}>{player.avg}</span></span>
                <span>OBP <span style={{ color:T.green }}>{player.obp}</span></span>
                {player.wrc && <span>wRC+ <span style={{ color:T.amber }}>{player.wrc}</span></span>}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:10, flexShrink:0 }}>
            {[["HIT",hit,hit>=27?T.green:T.text],["OBP",obp,T.amber],["HR",hr,hr>=8?T.amber:T.text]].map(([l,v,c]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:T.muted }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:700, color:c }}>{v}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function SPStat({ label, sp }) {
    return (
      <div style={S.cardN}>
        <div style={{ fontSize:11, color:T.amber, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
          {[["ERA",sp.era||"--",T.amber],["FIP",sp.fip||"--",T.text],
            ["K%",sp.kpct&&sp.kpct!=="--"?(parseFloat(sp.kpct)*100).toFixed(0)+"%":"--",T.green],
            ["WHIP",sp.whip||"--",T.red]].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:9, color:T.muted }}>{l}</div>
              <div style={{ fontSize:14, fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={S.sh}>Props · {game?.away} @ {game?.home}</div>
      <SPStat label={`SP Local · ${game?.home} · ${homeSP.name || "--"}`} sp={homeSP} />
      <SPStat label={`SP Visita · ${game?.away} · ${awaySP.name || "--"}`} sp={awaySP} />

      <div style={S.sh}>LINEUP LOCAL · {game?.home}</div>
      <div style={S.cardN}>
        {homeLineup.map((p, i) => <PropRow key={i} player={p} spHand={awaySP.hand} />)}
        {homeLineup.every((p) => !p.name) && <div style={{ color:T.muted, fontSize:12, padding:8 }}>Selecciona el lineup en Simulación.</div>}
      </div>

      <div style={S.sh}>LINEUP VISITA · {game?.away}</div>
      <div style={S.cardN}>
        {awayLineup.map((p, i) => <PropRow key={i} player={p} spHand={homeSP.hand} />)}
        {awayLineup.every((p) => !p.name) && <div style={{ color:T.muted, fontSize:12, padding:8 }}>Selecciona el lineup en Simulación.</div>}
      </div>
    </div>
  );
}

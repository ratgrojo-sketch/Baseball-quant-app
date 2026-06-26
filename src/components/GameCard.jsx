import { T, S, Ico } from "../tokens";
import { REAL_FALLBACK_ROSTERS } from "../services/RosterService";

export default function GameCard({ game, onSelect, selected }) {
  const isLive    = game.status === "In Progress" || game.status === "Live";
  const isFinal   = game.status === "Final";
  const hasFallback = !!REAL_FALLBACK_ROSTERS[String(game.id)];

  return (
    <div onClick={() => onSelect(game)}
      style={{ ...S.card, borderLeft:`3px solid ${selected ? T.amber : isLive ? T.green : T.border}`, cursor:"pointer" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:700, letterSpacing:0.5 }}>
            {game.away} <span style={{ color:T.muted, fontWeight:400 }}>vs</span> {game.home}
          </div>
          <div style={{ fontSize:10, color:T.muted, marginTop:1 }}>{game.venue}</div>
          {(game.homeSP || game.awaySP) && (
            <div style={{ fontSize:10, color:T.textDim, marginTop:3 }}>
              SP: <span style={{ color:T.text }}>{game.awaySP || "TBD"}</span>
              <span style={{ color:T.border }}> · </span>
              <span style={{ color:T.text }}>{game.homeSP || "TBD"}</span>
            </div>
          )}
          <div style={{ marginTop:4, display:"flex", gap:4, flexWrap:"wrap" }}>
            {isLive      && <span style={S.pill(T.green)}>● LIVE</span>}
            {isFinal     && <span style={S.pill(T.muted)}>FINAL</span>}
            {!isLive && !isFinal && <span style={S.pill(T.textDim)}>PROG</span>}
            {hasFallback && <span style={S.pill(T.amber)}>📋 ROSTER</span>}
          </div>
        </div>
        <div style={{ textAlign:"right", minWidth:64 }}>
          {isFinal && game.awayScore !== null ? (
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:700 }}>
              <span style={{ color: game.awayScore > game.homeScore ? T.green : T.text }}>{game.awayScore}</span>
              <span style={{ color:T.muted, fontSize:16 }}> – </span>
              <span style={{ color: game.homeScore > game.awayScore ? T.green : T.text }}>{game.homeScore}</span>
            </div>
          ) : (
            <div style={{ fontSize:13, color:T.amber, fontWeight:700 }}>{game.gameTime}</div>
          )}
        </div>
      </div>
    </div>
  );
}

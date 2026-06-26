import { T, S, Ico, fmtAgo, isStale } from "../tokens";

export default function RosterStatusBanner({ roster, loading, onRefresh }) {
  if (loading) return (
    <div style={{ margin:"6px 12px", padding:"10px 12px", borderRadius:8, background:T.raised, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:10, height:10, borderRadius:"50%", background:T.blue, animation:"pulse 1s infinite" }} />
      <span style={{ fontSize:11, color:T.muted }}>Cargando roster desde MLB API...</span>
    </div>
  );

  if (!roster) return (
    <div style={{ margin:"6px 12px", padding:"10px 12px", borderRadius:8, background:"#1a0a0a", border:`1px solid ${T.red}44`, display:"flex", alignItems:"center", gap:8 }}>
      {Ico.warn(T.red)}
      <div style={{ flex:1, fontSize:11, color:T.red }}>Sin roster — ingresa stats manualmente</div>
      <button onClick={onRefresh} style={{ background:"transparent", border:"none", cursor:"pointer", color:T.muted }}>
        {Ico.refresh(T.amber)}
      </button>
    </div>
  );

  const stale    = isStale(roster.fetchedAt);
  const isManual = roster.source?.includes("manual") || roster.source?.includes("fallback");
  const color    = stale ? T.orange : isManual ? T.amber : T.green;
  const icon     = stale || isManual ? Ico.warn(color) : Ico.cloud(color);
  const label    = isManual ? "Roster manual (screenshots)" : "Roster API oficial";
  const sub      = `Últ. actualización: ${fmtAgo(roster.fetchedAt)}${isManual ? " · Fuente: ESPN/Rotowire" : ""}`;

  return (
    <div style={{ margin:"6px 12px", padding:"10px 12px", borderRadius:8, background:color+"12", border:`1px solid ${color}33` }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {icon}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color }}>{label}</div>
          <div style={{ fontSize:10, color:T.textDim, marginTop:1 }}>{sub}</div>
          {stale && (
            <div style={{ fontSize:10, color:T.orange, marginTop:2, fontWeight:700 }}>
              ⚠ ADVERTENCIA: Roster desactualizado ({fmtAgo(roster.fetchedAt)}) — los datos podrían no ser precisos
            </div>
          )}
        </div>
        <button onClick={onRefresh}
          style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", cursor:"pointer", color:T.muted, display:"flex", alignItems:"center", gap:4, fontSize:10 }}>
          {Ico.refresh(T.muted)}<span>Sync</span>
        </button>
      </div>
    </div>
  );
}

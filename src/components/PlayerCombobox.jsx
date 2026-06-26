import { useState, useEffect, useRef } from "react";
import { T, S, Ico } from "../tokens";

export default function PlayerCombobox({ players, value, onChange, placeholder = "Seleccionar jugador", type = "batter" }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const selected = players.find((p) => p.id === value);

  const filtered = query.trim() === ""
    ? players
    : players.filter((p) => (p.fullName || p.name || "").toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const handleSelect = (p) => { onChange(p); setOpen(false); setQuery(""); };

  const badge = (p) => {
    if (type === "pitcher" || type === "bullpen")
      return p.era && p.era !== "--" ? <span style={{ ...S.pill(T.amber), fontSize:9, marginLeft:4 }}>ERA {p.era}</span> : null;
    return p.avg && p.avg !== "---" ? <span style={{ ...S.pill(T.blue+"99"), fontSize:9, marginLeft:4, color:T.text }}>{p.avg}</span> : null;
  };

  const roleTag = (p) => {
    if (p.role) return <span style={{ ...S.pill(p.role==="CL" ? T.red : p.role==="SU" ? T.amber : T.muted), fontSize:9 }}>{p.role}</span>;
    if (p.pos)  return <span style={{ ...S.pill(T.blue),    fontSize:9 }}>{p.pos}</span>;
    return null;
  };

  return (
    <div style={{ position:"relative" }}>
      {/* Trigger */}
      <div onClick={() => setOpen(true)}
        style={{ background:T.raised, border:`1px solid ${selected ? T.amber : T.border}`, borderRadius:8, padding:"9px 12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:42 }}>
        {selected ? (
          <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:0 }}>
            <span style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {selected.fullName || selected.name}
            </span>
            {badge(selected)}{roleTag(selected)}
          </div>
        ) : (
          <span style={{ fontSize:12, color:T.textDim }}>{placeholder}</span>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {selected && (
            <div onClick={(e) => { e.stopPropagation(); onChange(null); }} style={{ padding:"2px 4px", cursor:"pointer" }}>
              {Ico.x(T.muted)}
            </div>
          )}
          {Ico.chev(T.amber)}
        </div>
      </div>

      {/* Bottom sheet */}
      {open && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"flex-end" }}
          onClick={() => { setOpen(false); setQuery(""); }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width:"100%", maxWidth:430, margin:"0 auto", background:T.surface, borderRadius:"16px 16px 0 0", border:`1px solid ${T.border}`, borderBottom:"none", maxHeight:"72vh", display:"flex", flexDirection:"column", boxShadow:"0 -8px 32px rgba(0,0,0,0.6)", animation:"slideUp 0.18s ease-out" }}>

            <div style={{ display:"flex", justifyContent:"center", padding:"10px 0 0" }}>
              <div style={{ width:36, height:4, borderRadius:2, background:T.border }} />
            </div>

            <div style={{ padding:"10px 14px", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:T.raised, borderRadius:10, padding:"8px 12px", border:`1px solid ${T.border}` }}>
                {Ico.search(T.muted)}
                <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar jugador..." autoComplete="off"
                  style={{ background:"transparent", border:"none", color:T.text, fontSize:14, flex:1, outline:"none", fontFamily:"'JetBrains Mono',monospace" }} />
                {query && <div onClick={() => setQuery("")} style={{ cursor:"pointer" }}>{Ico.x(T.muted)}</div>}
              </div>
              <div style={{ fontSize:10, color:T.textDim, marginTop:6, paddingLeft:2 }}>
                {filtered.length} jugador{filtered.length !== 1 ? "es" : ""}
              </div>
            </div>

            <div style={{ overflowY:"auto", flex:1, WebkitOverflowScrolling:"touch" }}>
              {filtered.length === 0 ? (
                <div style={{ padding:20, textAlign:"center", color:T.muted, fontSize:13 }}>Sin resultados para "{query}"</div>
              ) : filtered.map((p) => {
                const isSel = p.id === value;
                return (
                  <div key={p.id} onClick={() => handleSelect(p)}
                    style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`, cursor:"pointer", background: isSel ? T.amber+"18" : T.surface, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:14, fontWeight: isSel ? 700 : 500, color: isSel ? T.amber : T.text }}>
                          {p.fullName || p.name}
                        </span>
                        {roleTag(p)}
                        <span style={{ ...S.pill(T.textDim), fontSize:9 }}>{p.hand}</span>
                      </div>

                      {type === "pitcher" && p.era && p.era !== "--" && (
                        <div style={{ fontSize:10, color:T.textDim, marginTop:2, display:"flex", gap:10, flexWrap:"wrap" }}>
                          <span>ERA <span style={{ color:T.amber }}>{p.era}</span></span>
                          {p.fip   && p.fip   !== "--" && <span>FIP  <span style={{ color:T.text }}>{p.fip}</span></span>}
                          {p.kpct  && p.kpct  !== "--" && <span>K%   <span style={{ color:T.green }}>{(parseFloat(p.kpct)*100).toFixed(0)}%</span></span>}
                          <span>WHIP <span style={{ color:T.text }}>{p.whip}</span></span>
                          {p.gs > 0 && <span>GS <span style={{ color:T.muted }}>{p.gs}</span></span>}
                        </div>
                      )}
                      {type === "bullpen" && p.era && p.era !== "--" && (
                        <div style={{ fontSize:10, color:T.textDim, marginTop:2, display:"flex", gap:10, flexWrap:"wrap" }}>
                          <span>ERA <span style={{ color:T.amber }}>{p.era}</span></span>
                          {p.k9  && p.k9  !== "--" && <span>K/9  <span style={{ color:T.green }}>{p.k9}</span></span>}
                          <span>WHIP <span style={{ color:T.text }}>{p.whip}</span></span>
                        </div>
                      )}
                      {type === "batter" && p.avg && p.avg !== "---" && (
                        <div style={{ fontSize:10, color:T.textDim, marginTop:2, display:"flex", gap:10, flexWrap:"wrap" }}>
                          <span>AVG <span style={{ color:T.text }}>{p.avg}</span></span>
                          <span>OBP <span style={{ color:T.green }}>{p.obp}</span></span>
                          <span>SLG <span style={{ color:T.amber }}>{p.slg}</span></span>
                          {p.wrc && <span>wRC+ <span style={{ color:T.amber }}>{p.wrc}</span></span>}
                          {p.hr > 0 && <span>HR <span style={{ color:T.red }}>{p.hr}</span></span>}
                        </div>
                      )}
                    </div>
                    {isSel && <div style={{ marginLeft:8 }}>{Ico.check(T.amber)}</div>}
                  </div>
                );
              })}
            </div>

            <div style={{ padding:"10px 14px", borderTop:`1px solid ${T.border}` }}>
              <button onClick={() => { setOpen(false); setQuery(""); }} style={S.btn(T.raised)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

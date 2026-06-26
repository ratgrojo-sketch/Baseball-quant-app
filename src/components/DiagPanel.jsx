import { useState } from "react";
import { T, Ico } from "../tokens";

export default function DiagPanel({ logs, source }) {
  const [open, setOpen] = useState(false);
  if (!logs.length) return null;

  const last = logs[logs.length - 1];
  const hc   = last.status === "ok" || last.status === "fallback" ? T.green
              : last.status === "warn" ? T.amber : T.red;

  const SI = { ok:"✓", warn:"⚠", error:"✗", loading:"◌", fallback:"⬡" };
  const SC = { ok:T.green, warn:T.amber, error:T.red, loading:T.blue, fallback:T.amber };

  return (
    <div style={{ margin:"6px 12px", borderRadius:10, overflow:"hidden", border:`1px solid ${hc}33` }}>
      <div onClick={() => setOpen(!open)}
        style={{ background:hc+"15", padding:"8px 12px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {Ico.bug(hc)}
          <span style={{ fontSize:11, fontWeight:700, color:hc }}>
            DIAGNÓSTICO — {source?.toUpperCase().replace(/_/g," ")}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, color:T.muted }}>{logs.length} eventos</span>
          {Ico.chev(T.muted, open ? "up" : "down")}
        </div>
      </div>

      {open && (
        <div style={{ background:T.bg, padding:10 }}>
          {logs.map((l, i) => (
            <div key={i} style={{ display:"flex", gap:8, padding:"4px 0", borderBottom: i < logs.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ fontSize:13, color:SC[l.status]||T.muted, minWidth:16 }}>{SI[l.status]||"·"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, color:T.text, fontWeight:600 }}>
                  <span style={{ color:T.textDim }}>{l.ts} </span>{l.msg}
                </div>
                {l.detail && (
                  <div style={{ fontFamily:"monospace", fontSize:10, color:T.textDim, marginTop:2, wordBreak:"break-all" }}>
                    {l.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

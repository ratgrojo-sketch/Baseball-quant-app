import { useState } from "react";
import { T, S, Ico } from "../tokens";

export default function Collapsible({ title, sub, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.cardN}>
      <div onClick={() => setOpen(!open)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <div>
          <div style={{ fontSize:11, color:T.amber, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{title}</div>
          {sub && <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{sub}</div>}
        </div>
        {Ico.chev(T.muted, open ? "up" : "down")}
      </div>
      {open && <div style={{ marginTop:12 }}>{children}</div>}
    </div>
  );
}

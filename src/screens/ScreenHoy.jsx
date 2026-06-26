import { useState, useEffect, useCallback } from "react";
import { T, S, todayStr, fmtDate } from "../tokens";
import { fetchMLBSchedule } from "../services/ScheduleService";
import GameCard from "../components/GameCard";
import DiagPanel from "../components/DiagPanel";

export default function ScreenHoy({ onSelectGame, selectedGame }) {
  const [date,    setDate]    = useState(todayStr());
  const [games,   setGames]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs,    setLogs]    = useState([]);
  const [source,  setSource]  = useState("");

  const addLog = useCallback((e) => setLogs((p) => [...p, e]), []);

  const load = useCallback(async (d) => {
    setLoading(true); setLogs([]); setGames([]);
    const { games: g, source: src } = await fetchMLBSchedule(d, addLog);
    setGames(g); setSource(src); setLoading(false);
  }, [addLog]);

  useEffect(() => { load(date); }, [date, load]);

  return (
    <div>
      <div style={S.sh}>Calendario MLB Oficial</div>
      <div style={{ padding:"10px 12px 4px" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={S.input} />
        <div style={{ fontSize:11, color:T.muted, marginTop:6, paddingLeft:2 }}>
          {fmtDate(date)} · {loading ? "Cargando..." : `${games.length} juego${games.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      <DiagPanel logs={logs} source={source} />

      {loading && (
        <div style={{ textAlign:"center", padding:30, color:T.muted, fontSize:13 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
          Consultando MLB Stats API...
        </div>
      )}

      {!loading && games.map((g) => (
        <GameCard key={g.id} game={g} onSelect={onSelectGame} selected={selectedGame?.id === g.id} />
      ))}

      {!loading && games.length === 0 && (
        <div style={{ ...S.cardN, margin:"8px 12px", textAlign:"center", padding:30, color:T.muted }}>
          Sin juegos para {fmtDate(date)}. Prueba 2026-06-26.
        </div>
      )}
    </div>
  );
}

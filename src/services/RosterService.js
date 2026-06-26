// ── Código optimizado para automatización total ──────

function parseBoxscoreRoster(data, side) {
  const team = data?.teams?.[side];
  if (!team) return null;
  
  const players = team.players || {};
  
  // Función para encontrar al jugador sin importar si la API lo manda como ID123 o 123
  const findPlayerData = (pid) => {
    return players[`ID${pid}`] || players[String(pid)] || null;
  };

  const lineup = (team.battingOrder || []).map(pid => {
    const p = findPlayerData(pid);
    if (!p) return { id: pid, name: "Cargando..." };
    const s = p.seasonStats?.batting || {};
    return {
      id: pid,
      name: p.person?.fullName || "?",
      pos: p.position?.abbreviation || "--",
      avg: s.avg || "---",
      hr: s.homeRuns || 0,
      rbi: s.rbi || 0
    };
  });

  return {
    abbr: team.team?.abbreviation || "---",
    lineup: lineup,
    probableSP: null // La API de boxscore a veces no trae al SP en el objeto principal
  };
}

export async function fetchRosterForGame(gamePk, onLog) {
  const log = (s, m) => onLog({ status: s, msg: m });
  const BOX_URL = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
  
  try {
    log("loading", "Conectando a MLB API...");
    const data = await tryProxy(BOX_URL);
    
    if (data && data.teams) {
      const home = parseBoxscoreRoster(data, "home");
      const away = parseBoxscoreRoster(data, "away");
      log("ok", "Roster cargado desde MLB API");
      return { fetchedAt: new Date().toISOString(), source: "mlb_api", home, away };
    }
  } catch (e) {
    log("warn", "API falló, usando respaldo");
  }
  
  return REAL_FALLBACK_ROSTERS[String(gamePk)] || null;
}

import { tryProxy } from "./RosterService.js";

export const FALLBACK_GAMES = [
  { id:778001, away:"HOU", home:"DET", awayName:"Houston Astros",       homeName:"Detroit Tigers",        gameTime:"18:40", venue:"Comerica Park",         status:"Scheduled", homeScore:null, awayScore:null, homeSP:"Keider Montero",    awaySP:"Spencer Arrighetti", homeSPEra:"3.68", awaySPEra:"3.13", homeTeamId:116, awayTeamId:117 },
  { id:778002, away:"CIN", home:"PIT", awayName:"Cincinnati Reds",       homeName:"Pittsburgh Pirates",   gameTime:"18:40", venue:"PNC Park",               status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:134, awayTeamId:113 },
  { id:778003, away:"WSH", home:"BAL", awayName:"Washington Nationals",  homeName:"Baltimore Orioles",    gameTime:"19:05", venue:"Camden Yards",           status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:110, awayTeamId:120 },
  { id:778004, away:"TEX", home:"TOR", awayName:"Texas Rangers",         homeName:"Toronto Blue Jays",    gameTime:"19:07", venue:"Rogers Centre",          status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:141, awayTeamId:140 },
  { id:778005, away:"SEA", home:"CLE", awayName:"Seattle Mariners",      homeName:"Cleveland Guardians",  gameTime:"19:10", venue:"Progressive Field",      status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:114, awayTeamId:136 },
  { id:778006, away:"AZ",  home:"TB",  awayName:"Arizona Diamondbacks",  homeName:"Tampa Bay Rays",       gameTime:"19:10", venue:"Tropicana Field",        status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:139, awayTeamId:109 },
  { id:778007, away:"PHI", home:"NYM", awayName:"Philadelphia Phillies", homeName:"New York Mets",        gameTime:"19:10", venue:"Citi Field",             status:"Scheduled", homeScore:null, awayScore:null, homeSP:"Zack Wheeler",      awaySP:"TBD",                homeSPEra:"2.50", awaySPEra:"--",   homeTeamId:121, awayTeamId:143 },
  { id:778008, away:"NYY", home:"BOS", awayName:"New York Yankees",      homeName:"Boston Red Sox",       gameTime:"19:10", venue:"Fenway Park",            status:"Scheduled", homeScore:null, awayScore:null, homeSP:"Chris Sale",        awaySP:"Gerrit Cole",        homeSPEra:"3.08", awaySPEra:"2.88", homeTeamId:111, awayTeamId:147 },
  { id:778009, away:"KC",  home:"CWS", awayName:"Kansas City Royals",    homeName:"Chicago White Sox",    gameTime:"19:40", venue:"Guaranteed Rate Field",  status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:145, awayTeamId:118 },
  { id:778010, away:"CHC", home:"MIL", awayName:"Chicago Cubs",          homeName:"Milwaukee Brewers",    gameTime:"19:45", venue:"American Family Field",  status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:158, awayTeamId:112 },
  { id:778011, away:"COL", home:"MIN", awayName:"Colorado Rockies",      homeName:"Minnesota Twins",      gameTime:"20:10", venue:"Target Field",           status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:142, awayTeamId:115 },
  { id:778012, away:"MIA", home:"STL", awayName:"Miami Marlins",         homeName:"St. Louis Cardinals",  gameTime:"20:15", venue:"Busch Stadium",          status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:138, awayTeamId:146 },
  { id:778013, away:"ATH", home:"LAA", awayName:"Athletics",             homeName:"Los Angeles Angels",   gameTime:"21:38", venue:"Angel Stadium",          status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:108, awayTeamId:133 },
  { id:778014, away:"LAD", home:"SD",  awayName:"Los Angeles Dodgers",   homeName:"San Diego Padres",     gameTime:"21:45", venue:"Petco Park",             status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:135, awayTeamId:119 },
  { id:778015, away:"ATL", home:"SF",  awayName:"Atlanta Braves",        homeName:"San Francisco Giants", gameTime:"22:15", venue:"Oracle Park",            status:"Scheduled", homeScore:null, awayScore:null, homeSP:"TBD",               awaySP:"TBD",                homeSPEra:"--",   awaySPEra:"--",   homeTeamId:137, awayTeamId:144 },
];

export async function fetchMLBSchedule(dateStr, onLog) {
  const log = (s, m, d = "") =>
    onLog({ ts: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), status: s, msg: m, detail: d });

  const URL = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=team,linescore,probablePitcher`;
  log("loading", "Cargando calendario MLB...", URL);

  try {
    const data  = await tryProxy(URL);
    const games = [];
    (data.dates || []).forEach((d) =>
      (d.games || []).forEach((g) =>
        games.push({
          id:          g.gamePk,
          status:      g.status?.detailedState || "Scheduled",
          home:        g.teams?.home?.team?.abbreviation || "---",
          homeName:    g.teams?.home?.team?.name || "",
          homeTeamId:  g.teams?.home?.team?.id,
          away:        g.teams?.away?.team?.abbreviation || "---",
          awayName:    g.teams?.away?.team?.name || "",
          awayTeamId:  g.teams?.away?.team?.id,
          homeScore:   g.teams?.home?.score ?? null,
          awayScore:   g.teams?.away?.score ?? null,
          gameTime:    g.gameDate ? new Date(g.gameDate).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "--:--",
          venue:       g.venue?.name || "",
          homeSP:      g.teams?.home?.probablePitcher?.fullName || "TBD",
          awaySP:      g.teams?.away?.probablePitcher?.fullName || "TBD",
          homeSPEra:   "--",
          awaySPEra:   "--",
          linescore:   g.linescore || null,
        })
      )
    );
    log("ok", `API ✓ — ${games.length} juegos`, "");
    return { games, source: "api" };
  } catch (e) {
    const t = e.name === "AbortError" ? "TIMEOUT" : e.message;
    log("warn", `API falló (${t}) → fallback 26-Jun-2026`, "");
  }

  if (dateStr === "2026-06-26") {
    log("fallback", "Fallback activado — 15 juegos (screenshots)", "");
    return { games: FALLBACK_GAMES, source: "fallback_2026-06-26" };
  }

  log("error", `Sin datos para ${dateStr}`, "Selecciona 2026-06-26 o verifica conexión.");
  return { games: [], source: "none" };
}

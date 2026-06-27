// ============================================================
// BASEBALL QUANT — App completa en un solo archivo JSX
// Sin dependencias externas. Pega esto en cualquier artifact
// de Claude o en un proyecto React/Vite como App.jsx
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";

// ── Tokens ───────────────────────────────────────────────────
const T = {
  bg:"#0A0F1E", surface:"#111827", raised:"#1D2D44",
  green:"#16A34A", red:"#EF4444", amber:"#F59E0B", amberDim:"#78350F",
  blue:"#3B82F6", orange:"#F97316", muted:"#94A3B8",
  text:"#F1F5F9", textDim:"#64748B", border:"#1E293B",
};

// ── Utilities ─────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }
function fmtDate(s) {
  return new Date(s+"T12:00:00").toLocaleDateString("es-MX",
    {weekday:"short",day:"numeric",month:"short",year:"numeric"});
}
function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v));}
function fmtAgo(iso){
  if(!iso) return "desconocido";
  const s=(Date.now()-new Date(iso).getTime())/1000;
  if(s<60) return "hace unos segundos";
  if(s<3600) return `hace ${Math.floor(s/60)} min`;
  if(s<86400) return `hace ${Math.floor(s/3600)}h`;
  return `hace ${Math.floor(s/86400)} días`;
}
function isStale(iso,h=4){
  if(!iso) return true;
  return (Date.now()-new Date(iso).getTime())>h*3600000;
}
function sampleP(lam){
  const L=Math.exp(-lam); let k=0,p=1;
  do{k++;p*=Math.random();}while(p>L);
  return k-1;
}
function runSim(hL,aL,N=6000){
  let hw=0,ti=0;
  for(let i=0;i<N;i++){
    const h=sampleP(hL),a=sampleP(aL);
    if(h>a)hw++;else if(h===a)ti++;
  }
  return{
    homeWinPct:((hw+ti*0.5)/N*100).toFixed(1),
    awayWinPct:(((N-hw-ti*0.5))/N*100).toFixed(1),
  };
}
function calcLambda(sp,bp){
  const era=parseFloat(sp.era)||4.20,fip=parseFloat(sp.fip)||era;
  const xfip=parseFloat(sp.xfip)||fip,siera=parseFloat(sp.siera)||xfip;
  const avg=era*0.3+fip*0.3+xfip*0.2+siera*0.2;
  const spLam=avg/9*9*0.9,bpEra=parseFloat(bp.era)||4.20;
  const fatMult=1+(bp.fatigue??0)*0.06;
  return clamp(spLam*0.61+(bpEra/9*3.5)*fatMult*0.39,1.0,9.0);
}
const POSITIONS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
const HANDS=["R","L","S"];
const emptyP=()=>({playerId:null,name:"",hand:"R",era:"",fip:"",xfip:"",siera:"",kpct:"",bbpct:"",whip:"",war:""});
const emptyBP=()=>({era:"",whip:"",k9:"",lob:"",fatigue:0});
const emptyLU=()=>Array.from({length:9},(_,i)=>({name:"",pos:POSITIONS[i]||"DH",hand:"R"}));

// ── Shared styles ─────────────────────────────────────────────
const card={background:T.surface,borderRadius:12,margin:"8px 12px",padding:"14px 16px",borderLeft:`3px solid ${T.amber}`,boxShadow:"0 2px 8px rgba(0,0,0,.4)"};
const cardN={background:T.surface,borderRadius:12,margin:"8px 12px",padding:"14px 16px",border:`1px solid ${T.border}`};
const sh={fontSize:10,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:2,color:T.muted,textTransform:"uppercase",padding:"16px 16px 6px",borderBottom:`1px solid ${T.border}`,marginBottom:4};
const lbl={fontSize:10,color:T.muted,letterSpacing:.5,marginBottom:2};
const inputSt={background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:14,padding:"9px 12px",width:"100%",boxSizing:"border-box",fontFamily:"'JetBrains Mono',monospace"};
const selectSt={background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:13,padding:"9px 12px",width:"100%",boxSizing:"border-box",fontFamily:"'JetBrains Mono',monospace",appearance:"none"};
const btn=(c=T.amber)=>({background:c,color:c===T.amber?"#000":"#fff",border:"none",borderRadius:10,padding:"12px 20px",fontSize:14,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,cursor:"pointer",width:"100%",textTransform:"uppercase"});
const pill=(c)=>({display:"inline-block",background:c+"22",color:c,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700});

// ── Icons ─────────────────────────────────────────────────────
const Ico={
  cal:(c)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  cpu:(c)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  bar:(c)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  dol:(c)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  usr:(c)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chev:(c,d="down")=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" style={{transform:d==="up"?"rotate(180deg)":"none"}}><polyline points="6 9 12 15 18 9"/></svg>,
  check:(c)=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x:(c)=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search:(c)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  warn:(c)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  refresh:(c)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  bug:(c)=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M9 9V5a3 3 0 0 1 6 0v4"/><path d="M12 21a7 7 0 0 1-7-7v-2h14v2a7 7 0 0 1-7 7z"/><line x1="12" y1="14" x2="12" y2="18"/></svg>,
};

// ── Fallback games Jun-27-2026 ────────────────────────────────
const FALLBACK=[
  {id:779001,away:"HOU",home:"DET",awayName:"Houston Astros",homeName:"Detroit Tigers",gameTime:"12:10",venue:"Comerica Park",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"Framber Valdez",awaySP:"Kai-Wei Teng",homeSPEra:"3.12",awaySPEra:"--"},
  {id:779002,away:"NYY",home:"BOS",awayName:"New York Yankees",homeName:"Boston Red Sox",gameTime:"12:10",venue:"Fenway Park",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"Jake Bennett",awaySP:"Gerrit Cole",homeSPEra:"--",awaySPEra:"2.88"},
  {id:779003,away:"TEX",home:"TOR",awayName:"Texas Rangers",homeName:"Toronto Blue Jays",gameTime:"14:07",venue:"Rogers Centre",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"Dylan Cease",awaySP:"Cal Quantrill",homeSPEra:"3.21",awaySPEra:"4.11"},
  {id:779004,away:"SEA",home:"CLE",awayName:"Seattle Mariners",homeName:"Cleveland Guardians",gameTime:"13:10",venue:"Progressive Field",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"TBD",awaySP:"TBD",homeSPEra:"--",awaySPEra:"--"},
  {id:779005,away:"PHI",home:"NYM",awayName:"Philadelphia Phillies",homeName:"New York Mets",gameTime:"13:10",venue:"Citi Field",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"TBD",awaySP:"TBD",homeSPEra:"--",awaySPEra:"--"},
  {id:779006,away:"CHC",home:"MIL",awayName:"Chicago Cubs",homeName:"Milwaukee Brewers",gameTime:"13:10",venue:"American Family Field",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"TBD",awaySP:"TBD",homeSPEra:"--",awaySPEra:"--"},
  {id:779007,away:"LAD",home:"SD",awayName:"Los Angeles Dodgers",homeName:"San Diego Padres",gameTime:"16:10",venue:"Petco Park",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"TBD",awaySP:"TBD",homeSPEra:"--",awaySPEra:"--"},
  {id:779008,away:"ATL",home:"SF",awayName:"Atlanta Braves",homeName:"San Francisco Giants",gameTime:"16:05",venue:"Oracle Park",status:"Scheduled",homeScore:null,awayScore:null,homeSP:"TBD",awaySP:"TBD",homeSPEra:"--",awaySPEra:"--"},
];

// ── MLB API fetch ─────────────────────────────────────────────
async function fetchWithTimeout(url,ms=7000){
  const ctrl=new AbortController();
  const t=setTimeout(()=>ctrl.abort(),ms);
  try{const r=await fetch(url,{signal:ctrl.signal});clearTimeout(t);return r;}
  catch(e){clearTimeout(t);throw e;}
}
async function tryProxy(url){
  const proxies=[
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  for(const p of proxies){
    try{
      const r=await fetchWithTimeout(p,7000);
      if(!r.ok) continue;
      const d=await r.json();
      const raw=d.contents??d;
      return typeof raw==="string"?JSON.parse(raw):raw;
    }catch{continue;}
  }
  const r=await fetchWithTimeout(url,5000);
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function fetchSchedule(dateStr,onLog){
  const log=(s,m)=>onLog({ts:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),status:s,msg:m});
  const URL=`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=team,linescore,probablePitcher`;
  log("loading","Consultando MLB API...");
  try{
    const data=await tryProxy(URL);
    const games=[];
    (data.dates||[]).forEach(d=>(d.games||[]).forEach(g=>{
      games.push({
        id:g.gamePk,
        status:g.status?.detailedState||"Scheduled",
        home:g.teams?.home?.team?.abbreviation||"---",
        homeName:g.teams?.home?.team?.name||"",
        homeTeamId:g.teams?.home?.team?.id,
        away:g.teams?.away?.team?.abbreviation||"---",
        awayName:g.teams?.away?.team?.name||"",
        awayTeamId:g.teams?.away?.team?.id,
        homeScore:g.teams?.home?.score??null,
        awayScore:g.teams?.away?.score??null,
        gameTime:g.gameDate?new Date(g.gameDate).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}):"--:--",
        venue:g.venue?.name||"",
        homeSP:g.teams?.home?.probablePitcher?.fullName||"TBD",
        awaySP:g.teams?.away?.probablePitcher?.fullName||"TBD",
        homeSPEra:"--",awaySPEra:"--",
      });
    }));
    log("ok",`API ✓ — ${games.length} juegos cargados`);
    return{games,source:"api"};
  }catch(e){
    log("warn",`API falló (${e.message?.slice(0,40)}) → usando fallback`);
  }
  log("fallback","Usando datos del 27-Jun-2026");
  return{games:FALLBACK,source:"fallback"};
}
async function fetchRoster(gamePk,onLog){
  const log=(s,m,d="")=>onLog({ts:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),status:s,msg:m,detail:d});
  log("loading",`Cargando roster gamePk ${gamePk}`);
  // Strategy 1: boxscore
  try{
    const data=await tryProxy(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`);
    const parse=(side)=>{
      const team=data?.teams?.[side];
      if(!team) return null;
      const players=team.players||{};
      const pitcherIds=new Set((team.pitchers||[]).map(String));
      const batters=[];const pitchers=[];const bullpen=[];
      (team.battingOrder||[]).forEach(pid=>{
        const raw=players[`ID${pid}`];if(!raw) return;
        const s=raw.seasonStats?.batting||{};
        batters.push({id:parseInt(pid),name:raw.person?.fullName?.split(" ").slice(-1)[0]??"?",fullName:raw.person?.fullName??"?",pos:raw.position?.abbreviation??"--",hand:raw.batSide?.code??"R",avg:s.avg??"---",obp:s.obp??"---",slg:s.slg??"---",hr:s.homeRuns??0,rbi:s.rbi??0,wrc:null,woba:"---",ab:s.atBats??0,h:s.hits??0});
      });
      [...pitcherIds].forEach(pid=>{
        const raw=players[`ID${pid}`];if(!raw) return;
        const s=raw.seasonStats?.pitching||{};
        const gs=s.gamesStarted??0;
        const obj={id:parseInt(pid),name:raw.person?.fullName??"?",fullName:raw.person?.fullName??"?",hand:raw.pitchHand?.code??"R",era:s.era??"--",fip:"--",xfip:"--",siera:"--",whip:s.whip??"--",kpct:"--",bbpct:"--",war:"--",k9:s.strikeoutsPer9Inn??"--",gs,role:gs>0?"SP":"RP",lob:"--"};
        if(gs>0) pitchers.push(obj); else bullpen.push(obj);
      });
      return{abbr:team.team?.abbreviation??"---",teamId:team.team?.id,name:team.team?.name??"",pitchers,bullpen,lineup:batters,probableSP:pitchers.sort((a,b)=>(b.gs??0)-(a.gs??0))[0]??null};
    };
    const home=parse("home"),away=parse("away");
    if(home&&away&&home.lineup.length>0&&away.lineup.length>0){
      log("ok",`Boxscore ✓ — ${home.abbr}: ${home.lineup.length} bat / ${away.abbr}: ${away.lineup.length} bat`);
      return{fetchedAt:new Date().toISOString(),source:"mlb_boxscore",home,away};
    }
    log("warn","Boxscore vacío — lineup no confirmado aún");
  }catch(e){log("warn",`Boxscore falló: ${e.message?.slice(0,60)}`);}
  // Strategy 2: schedule for team IDs + 25-man roster
  try{
    log("loading","Estrategia 2: roster 25-man...");
    const sched=await tryProxy(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&gamePk=${gamePk}&hydrate=team,probablePitcher`);
    const gi=sched?.dates?.[0]?.games?.[0];
    if(gi){
      const hId=gi.teams?.home?.team?.id,aId=gi.teams?.away?.team?.id;
      const hAbbr=gi.teams?.home?.team?.abbreviation??"HOME",aAbbr=gi.teams?.away?.team?.abbreviation??"AWAY";
      const hName=gi.teams?.home?.team?.name??"",aName=gi.teams?.away?.team?.name??"";
      const hSPId=gi.teams?.home?.probablePitcher?.id??null,aSPId=gi.teams?.away?.probablePitcher?.id??null;
      const hSPName=gi.teams?.home?.probablePitcher?.fullName??"TBD",aSPName=gi.teams?.away?.probablePitcher?.fullName??"TBD";
      const HYD=`rosterType=active&season=2026&hydrate=person(stats(type=season,group=pitching,group=hitting))`;
      const [hRes,aRes]=await Promise.allSettled([
        tryProxy(`https://statsapi.mlb.com/api/v1/teams/${hId}/roster?${HYD}`),
        tryProxy(`https://statsapi.mlb.com/api/v1/teams/${aId}/roster?${HYD}`),
      ]);
      const parseRoster=(data,abbr,teamName,spId)=>{
        const roster=data?.roster??[];
        const pitchers=[],bullpen=[],lineup=[];
        roster.forEach(entry=>{
          const p=entry.person,pos=entry.position?.abbreviation??"--";
          const isPit=["P","SP","RP"].includes(pos)||entry.position?.type==="Pitcher";
          const pSt=p?.stats?.find(s=>s.group?.displayName==="pitching")?.splits?.[0]?.stat??{};
          const hSt=p?.stats?.find(s=>s.group?.displayName==="hitting")?.splits?.[0]?.stat??{};
          if(isPit){
            const gs=pSt.gamesStarted??0;
            const obj={id:p.id,name:p.fullName??"?",fullName:p.fullName??"?",hand:p.pitchHand?.code??"R",era:pSt.era??"--",fip:"--",xfip:"--",siera:"--",whip:pSt.whip??"--",kpct:"--",bbpct:"--",war:"--",k9:pSt.strikeoutsPer9Inn??"--",gs,role:gs>0?"SP":"RP",lob:"--"};
            if(gs>0) pitchers.push(obj); else bullpen.push(obj);
          }else{
            lineup.push({id:p.id,name:p.fullName?.split(" ").slice(-1)[0]??"?",fullName:p.fullName??"?",pos,hand:p.batSide?.code??"R",avg:hSt.avg??"---",obp:hSt.obp??"---",slg:hSt.slg??"---",hr:hSt.homeRuns??0,rbi:hSt.rbi??0,wrc:null,woba:"---",ab:hSt.atBats??0,h:hSt.hits??0});
          }
        });
        pitchers.sort((a,b)=>{if(spId){if(a.id===spId)return -1;if(b.id===spId)return 1;}return(b.gs??0)-(a.gs??0);});
        return{abbr,teamId:null,name:teamName,pitchers,bullpen,lineup,probableSP:pitchers[0]??null};
      };
      const hD=hRes.status==="fulfilled"?hRes.value:null;
      const aD=aRes.status==="fulfilled"?aRes.value:null;
      if(hD||aD){
        const home=parseRoster(hD,hAbbr,hName,hSPId);
        const away=parseRoster(aD,aAbbr,aName,aSPId);
        log("ok",`25-man ✓ — ${hAbbr}: ${home.pitchers.length}SP ${home.bullpen.length}BP ${home.lineup.length}bat | SP: ${hSPName} vs ${aSPName}`);
        return{fetchedAt:new Date().toISOString(),source:"mlb_25man",home,away};
      }
    }
    log("warn","25-man sin datos");
  }catch(e){log("warn",`25-man falló: ${e.message?.slice(0,60)}`);}
  log("error","Sin datos de roster — ingresa stats manualmente");
  return null;
}

// ── Shared UI components ──────────────────────────────────────
function Collapsible({title,sub,defaultOpen=false,children}){
  const[open,setOpen]=useState(defaultOpen);
  return(
    <div style={cardN}>
      <div onClick={()=>setOpen(!open)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
        <div>
          <div style={{fontSize:11,color:T.amber,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{title}</div>
          {sub&&<div style={{fontSize:10,color:T.muted,marginTop:2}}>{sub}</div>}
        </div>
        {Ico.chev(T.muted,open?"up":"down")}
      </div>
      {open&&<div style={{marginTop:12}}>{children}</div>}
    </div>
  );
}

function StatInput({label,value,onChange,step="0.01"}){
  return(
    <div>
      <div style={lbl}>{label}</div>
      <input type="number" step={step} value={value} onChange={e=>onChange(e.target.value)}
        style={{...inputSt,fontSize:13,padding:"7px 10px"}}/>
    </div>
  );
}

function DiagPanel({logs,source}){
  const[open,setOpen]=useState(false);
  if(!logs.length) return null;
  const last=logs[logs.length-1];
  const hc=last.status==="ok"||last.status==="fallback"?T.green:last.status==="warn"?T.amber:T.red;
  const SI={ok:"✓",warn:"⚠",error:"✗",loading:"◌",fallback:"⬡"};
  const SC={ok:T.green,warn:T.amber,error:T.red,loading:T.blue,fallback:T.amber};
  return(
    <div style={{margin:"6px 12px",borderRadius:10,overflow:"hidden",border:`1px solid ${hc}33`}}>
      <div onClick={()=>setOpen(!open)} style={{background:hc+"15",padding:"8px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>{Ico.bug(hc)}<span style={{fontSize:11,fontWeight:700,color:hc}}>DIAGNÓSTICO — {(source||"").toUpperCase().replace(/_/g," ")}</span></div>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:T.muted}}>{logs.length} eventos</span>{Ico.chev(T.muted,open?"up":"down")}</div>
      </div>
      {open&&<div style={{background:T.bg,padding:10}}>{logs.map((l,i)=>(
        <div key={i} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none"}}>
          <span style={{fontSize:13,color:SC[l.status]||T.muted,minWidth:16}}>{SI[l.status]||"·"}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,color:T.text,fontWeight:600}}><span style={{color:T.textDim}}>{l.ts} </span>{l.msg}</div>
            {l.detail&&<div style={{fontFamily:"monospace",fontSize:10,color:T.textDim,marginTop:2,wordBreak:"break-all"}}>{l.detail}</div>}
          </div>
        </div>
      ))}</div>}
    </div>
  );
}

function RosterBanner({roster,loading,onRefresh}){
  if(loading) return(
    <div style={{margin:"6px 12px",padding:"10px 12px",borderRadius:8,background:T.raised,display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:T.blue,animation:"pulse 1s infinite"}}/>
      <span style={{fontSize:11,color:T.muted}}>Cargando roster desde MLB API...</span>
    </div>
  );
  if(!roster) return(
    <div style={{margin:"6px 12px",padding:"10px 12px",borderRadius:8,background:"#1a0a0a",border:`1px solid ${T.red}44`,display:"flex",alignItems:"center",gap:8}}>
      {Ico.warn(T.red)}
      <div style={{flex:1,fontSize:11,color:T.red}}>Sin roster — ingresa stats manualmente</div>
      <button onClick={onRefresh} style={{background:"transparent",border:"none",cursor:"pointer"}}>{Ico.refresh(T.amber)}</button>
    </div>
  );
  const stale=isStale(roster.fetchedAt);
  const isManual=roster.source?.includes("fallback")||roster.source?.includes("manual");
  const color=stale?T.orange:isManual?T.amber:T.green;
  return(
    <div style={{margin:"6px 12px",padding:"10px 12px",borderRadius:8,background:color+"12",border:`1px solid ${color}33`}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {Ico.warn(color)}
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color}}>{isManual?"Roster manual":"Roster API oficial"}</div>
          <div style={{fontSize:10,color:T.textDim,marginTop:1}}>Últ. actualización: {fmtAgo(roster.fetchedAt)}</div>
          {stale&&<div style={{fontSize:10,color:T.orange,marginTop:2,fontWeight:700}}>⚠ ADVERTENCIA: Roster desactualizado — los datos podrían no ser precisos</div>}
        </div>
        <button onClick={onRefresh} style={{background:T.raised,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",color:T.muted,display:"flex",alignItems:"center",gap:4,fontSize:10}}>
          {Ico.refresh(T.muted)}<span>Sync</span>
        </button>
      </div>
    </div>
  );
}

function PlayerCombobox({players,value,onChange,placeholder="Seleccionar",type="batter"}){
  const[open,setOpen]=useState(false);
  const[query,setQuery]=useState("");
  const inputRef=useRef(null);
  const selected=players.find(p=>p.id===value);
  const filtered=query.trim()===""?players:players.filter(p=>(p.fullName||p.name||"").toLowerCase().includes(query.toLowerCase()));
  useEffect(()=>{if(open&&inputRef.current) setTimeout(()=>inputRef.current?.focus(),80);},[open]);
  const handleSelect=(p)=>{onChange(p);setOpen(false);setQuery("");};
  const roleTag=(p)=>{
    if(p.role) return<span style={{...pill(p.role==="CL"?T.red:p.role==="SU"?T.amber:T.muted),fontSize:9}}>{p.role}</span>;
    if(p.pos)  return<span style={{...pill(T.blue),fontSize:9}}>{p.pos}</span>;
    return null;
  };
  return(
    <div style={{position:"relative"}}>
      <div onClick={()=>setOpen(true)} style={{background:T.raised,border:`1px solid ${selected?T.amber:T.border}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:42}}>
        {selected?(
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
            <span style={{fontSize:13,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected.fullName||selected.name}</span>
            {roleTag(selected)}
          </div>
        ):<span style={{fontSize:12,color:T.textDim}}>{placeholder}</span>}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {selected&&<div onClick={e=>{e.stopPropagation();onChange(null);}} style={{padding:"2px 4px",cursor:"pointer"}}>{Ico.x(T.muted)}</div>}
          {Ico.chev(T.amber)}
        </div>
      </div>
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end"}} onClick={()=>{setOpen(false);setQuery("");}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,margin:"0 auto",background:T.surface,borderRadius:"16px 16px 0 0",border:`1px solid ${T.border}`,borderBottom:"none",maxHeight:"72vh",display:"flex",flexDirection:"column",boxShadow:"0 -8px 32px rgba(0,0,0,.6)",animation:"slideUp .18s ease-out"}}>
            <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:36,height:4,borderRadius:2,background:T.border}}/></div>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,background:T.raised,borderRadius:10,padding:"8px 12px",border:`1px solid ${T.border}`}}>
                {Ico.search(T.muted)}
                <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar jugador..." autoComplete="off"
                  style={{background:"transparent",border:"none",color:T.text,fontSize:14,flex:1,outline:"none",fontFamily:"'JetBrains Mono',monospace"}}/>
                {query&&<div onClick={()=>setQuery("")} style={{cursor:"pointer"}}>{Ico.x(T.muted)}</div>}
              </div>
              <div style={{fontSize:10,color:T.textDim,marginTop:6,paddingLeft:2}}>{filtered.length} jugador{filtered.length!==1?"es":""}</div>
            </div>
            <div style={{overflowY:"auto",flex:1,WebkitOverflowScrolling:"touch"}}>
              {filtered.length===0
                ?<div style={{padding:20,textAlign:"center",color:T.muted,fontSize:13}}>Sin resultados para "{query}"</div>
                :filtered.map(p=>{
                  const isSel=p.id===value;
                  return(
                    <div key={p.id} onClick={()=>handleSelect(p)} style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,cursor:"pointer",background:isSel?T.amber+"18":T.surface,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:14,fontWeight:isSel?700:500,color:isSel?T.amber:T.text}}>{p.fullName||p.name}</span>
                          {roleTag(p)}<span style={{...pill(T.textDim),fontSize:9}}>{p.hand}</span>
                        </div>
                        {type==="pitcher"&&p.era&&p.era!=="--"&&(
                          <div style={{fontSize:10,color:T.textDim,marginTop:2,display:"flex",gap:10}}>
                            <span>ERA <span style={{color:T.amber}}>{p.era}</span></span>
                            {p.fip&&p.fip!=="--"&&<span>FIP <span style={{color:T.text}}>{p.fip}</span></span>}
                            <span>WHIP <span style={{color:T.text}}>{p.whip}</span></span>
                            {p.gs>0&&<span>GS <span style={{color:T.muted}}>{p.gs}</span></span>}
                          </div>
                        )}
                        {type==="bullpen"&&p.era&&p.era!=="--"&&(
                          <div style={{fontSize:10,color:T.textDim,marginTop:2,display:"flex",gap:10}}>
                            <span>ERA <span style={{color:T.amber}}>{p.era}</span></span>
                            {p.k9&&p.k9!=="--"&&<span>K/9 <span style={{color:T.green}}>{p.k9}</span></span>}
                            <span>WHIP <span style={{color:T.text}}>{p.whip}</span></span>
                          </div>
                        )}
                        {type==="batter"&&p.avg&&p.avg!=="---"&&(
                          <div style={{fontSize:10,color:T.textDim,marginTop:2,display:"flex",gap:10}}>
                            <span>AVG <span style={{color:T.text}}>{p.avg}</span></span>
                            <span>OBP <span style={{color:T.green}}>{p.obp}</span></span>
                            <span>SLG <span style={{color:T.amber}}>{p.slg}</span></span>
                            {p.hr>0&&<span>HR <span style={{color:T.red}}>{p.hr}</span></span>}
                          </div>
                        )}
                      </div>
                      {isSel&&<div style={{marginLeft:8}}>{Ico.check(T.amber)}</div>}
                    </div>
                  );
                })}
            </div>
            <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`}}>
              <button onClick={()=>{setOpen(false);setQuery("");}} style={btn(T.raised)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Screen: Hoy ───────────────────────────────────────────────
function ScreenHoy({onSelect,selected}){
  const[date,setDate]=useState(todayStr());
  const[games,setGames]=useState([]);
  const[loading,setLoading]=useState(false);
  const[logs,setLogs]=useState([]);
  const[source,setSource]=useState("");
  const addLog=useCallback(e=>setLogs(p=>[...p,e]),[]);
  const load=useCallback(async d=>{
    setLoading(true);setLogs([]);setGames([]);
    const{games:g,source:src}=await fetchSchedule(d,addLog);
    setGames(g);setSource(src);setLoading(false);
  },[addLog]);
  useEffect(()=>{load(date);},[date,load]);
  return(
    <div>
      <div style={sh}>Calendario MLB Oficial</div>
      <div style={{padding:"10px 12px 4px"}}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputSt}/>
        <div style={{fontSize:11,color:T.muted,marginTop:6,paddingLeft:2}}>{fmtDate(date)} · {loading?"Cargando...":`${games.length} juego${games.length!==1?"s":""}`}</div>
      </div>
      <DiagPanel logs={logs} source={source}/>
      {loading&&<div style={{textAlign:"center",padding:30,color:T.muted,fontSize:13}}><div style={{fontSize:24,marginBottom:8}}>⏳</div>Consultando MLB Stats API...</div>}
      {!loading&&games.map(g=>{
        const isLive=g.status==="In Progress"||g.status==="Live";
        const isFinal=g.status==="Final";
        return(
          <div key={g.id} onClick={()=>onSelect(g)} style={{...card,borderLeft:`3px solid ${selected?.id===g.id?T.amber:isLive?T.green:T.border}`,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700,letterSpacing:.5}}>{g.away} <span style={{color:T.muted,fontWeight:400}}>vs</span> {g.home}</div>
                <div style={{fontSize:10,color:T.muted,marginTop:1}}>{g.venue}</div>
                {(g.homeSP||g.awaySP)&&<div style={{fontSize:10,color:T.textDim,marginTop:3}}>SP: <span style={{color:T.text}}>{g.awaySP||"TBD"}</span><span style={{color:T.border}}> · </span><span style={{color:T.text}}>{g.homeSP||"TBD"}</span></div>}
                <div style={{marginTop:4,display:"flex",gap:4}}>
                  {isLive&&<span style={pill(T.green)}>● LIVE</span>}
                  {isFinal&&<span style={pill(T.muted)}>FINAL</span>}
                  {!isLive&&!isFinal&&<span style={pill(T.textDim)}>PROG</span>}
                </div>
              </div>
              <div style={{textAlign:"right",minWidth:64}}>
                {isFinal&&g.awayScore!==null
                  ?<div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:700}}>
                    <span style={{color:g.awayScore>g.homeScore?T.green:T.text}}>{g.awayScore}</span>
                    <span style={{color:T.muted,fontSize:16}}> – </span>
                    <span style={{color:g.homeScore>g.awayScore?T.green:T.text}}>{g.homeScore}</span>
                  </div>
                  :<div style={{fontSize:13,color:T.amber,fontWeight:700}}>{g.gameTime}</div>}
              </div>
            </div>
          </div>
        );
      })}
      {!loading&&games.length===0&&<div style={{...cardN,margin:"8px 12px",textAlign:"center",padding:30,color:T.muted}}>Sin juegos para {fmtDate(date)}.</div>}
    </div>
  );
}

// ── Screen: Simulacion ────────────────────────────────────────
function ScreenSimulacion({selectedGame,onSimulate}){
  const[homeSP,setHomeSP]=useState(emptyP());
  const[awaySP,setAwaySP]=useState(emptyP());
  const[homeLineup,setHomeLineup]=useState(emptyLU());
  const[awayLineup,setAwayLineup]=useState(emptyLU());
  const[homeBP,setHomeBP]=useState(emptyBP());
  const[awayBP,setAwayBP]=useState(emptyBP());
  const[roster,setRoster]=useState(null);
  const[rosterLoading,setRosterLoading]=useState(false);
  const[rosterLogs,setRosterLogs]=useState([]);
  const cacheRef=useRef({});

  const loadRoster=useCallback(async(game)=>{
    if(!game) return;
    const pk=String(game.id);
    if(cacheRef.current[pk]){setRoster(cacheRef.current[pk]);return;}
    setRosterLoading(true);setRosterLogs([]);
    const addLog=e=>setRosterLogs(p=>[...p,e]);
    const r=await fetchRoster(game.id,addLog);
    if(r) cacheRef.current[pk]=r;
    setRoster(r);setRosterLoading(false);
  },[]);

  useEffect(()=>{if(selectedGame) loadRoster(selectedGame);},[selectedGame?.id,loadRoster]);

  useEffect(()=>{
    if(!roster) return;
    const hSP=roster.home?.probableSP,aSP=roster.away?.probableSP;
    if(hSP&&!homeSP.name) setHomeSP({playerId:hSP.id,name:hSP.name||hSP.fullName||"",hand:hSP.hand||"R",era:hSP.era||"",fip:hSP.fip||"",xfip:hSP.xfip||"",siera:hSP.siera||"",kpct:hSP.kpct||"",bbpct:hSP.bbpct||"",whip:hSP.whip||"",war:hSP.war||""});
    if(aSP&&!awaySP.name) setAwaySP({playerId:aSP.id,name:aSP.name||aSP.fullName||"",hand:aSP.hand||"R",era:aSP.era||"",fip:aSP.fip||"",xfip:aSP.xfip||"",siera:aSP.siera||"",kpct:aSP.kpct||"",bbpct:aSP.bbpct||"",whip:aSP.whip||"",war:aSP.war||""});
    const hBP=(roster.home?.bullpen||[]).filter(r=>r.era&&r.era!=="--");
    const aBP=(roster.away?.bullpen||[]).filter(r=>r.era&&r.era!=="--");
    if(hBP.length&&!homeBP.era) setHomeBP(p=>({...p,era:(hBP.reduce((s,r)=>s+parseFloat(r.era),0)/hBP.length).toFixed(2)}));
    if(aBP.length&&!awayBP.era) setAwayBP(p=>({...p,era:(aBP.reduce((s,r)=>s+parseFloat(r.era),0)/aBP.length).toFixed(2)}));
  },[roster]);

  const handleRefresh=()=>{
    const pk=String(selectedGame.id);
    delete cacheRef.current[pk];
    setRoster(null);setHomeSP(emptyP());setAwaySP(emptyP());setHomeBP(emptyBP());setAwayBP(emptyBP());
    loadRoster(selectedGame);
  };

  const handleSim=()=>{
    const hL=calcLambda(awaySP,awayBP),aL=calcLambda(homeSP,homeBP);
    onSimulate({game:selectedGame,homeSP,awaySP,homeLineup,awayLineup,homeBP,awayBP,homeLambda:hL,awayLambda:aL,...runSim(hL,aL)});
  };

  if(!selectedGame) return<div style={{...cardN,margin:"20px 12px",textAlign:"center",padding:40,color:T.muted,fontSize:13}}>← Ve a <strong style={{color:T.amber}}>Hoy</strong> y selecciona un juego.</div>;

  const PitcherBlock=({label,teamRoster,data,onChange})=>{
    const pitchers=teamRoster?.pitchers||[];
    const set=(k,v)=>onChange({...data,[k]:v});
    const handleSelect=(player)=>{
      if(!player){onChange(emptyP());return;}
      onChange({playerId:player.id,name:player.fullName||player.name||"",hand:player.hand||"R",era:player.era||"",fip:player.fip||"",xfip:player.xfip||"",siera:player.siera||"",kpct:player.kpct||"",bbpct:player.bbpct||"",whip:player.whip||"",war:player.war||""});
    };
    return(
      <Collapsible title={label} sub={data.name?`${data.name} · ERA ${data.era||"--"}`:"Sin selección"} defaultOpen>
        <div style={{marginBottom:10}}><div style={lbl}>Pitcher Abridor</div>
          <PlayerCombobox players={pitchers} value={data.playerId} onChange={handleSelect} placeholder={pitchers.length?`${pitchers.length} pitchers`:"Sin roster — ingresa manualmente"} type="pitcher"/>
        </div>
        {data.era&&<div style={{fontSize:10,color:T.green,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:4}}>{Ico.check(T.green)} STATS CARGADAS · Editables</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <StatInput label="ERA" value={data.era||""} onChange={v=>set("era",v)}/>
          <StatInput label="FIP" value={data.fip||""} onChange={v=>set("fip",v)}/>
          <StatInput label="xFIP" value={data.xfip||""} onChange={v=>set("xfip",v)}/>
          <StatInput label="SIERA" value={data.siera||""} onChange={v=>set("siera",v)}/>
          <StatInput label="K%" value={data.kpct||""} onChange={v=>set("kpct",v)}/>
          <StatInput label="BB%" value={data.bbpct||""} onChange={v=>set("bbpct",v)}/>
          <StatInput label="WHIP" value={data.whip||""} onChange={v=>set("whip",v)}/>
          <StatInput label="WAR" value={data.war||""} onChange={v=>set("war",v)} step="0.1"/>
        </div>
        <div style={{marginTop:8}}><div style={lbl}>Mano</div>
          <div style={{display:"flex",gap:8}}>
            {HANDS.map(h=><button key={h} onClick={()=>set("hand",h)} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:data.hand===h?T.amber:T.raised,color:data.hand===h?"#000":T.muted}}>{h}</button>)}
          </div>
        </div>
      </Collapsible>
    );
  };

  const LineupBlock=({label,teamRoster,lineup,onChange})=>{
    const batters=teamRoster?.lineup||[];
    const filled=lineup.filter(p=>p.name).length;
    const handleSelect=(idx,player)=>{
      const next=[...lineup];
      if(!player){next[idx]={name:"",pos:POSITIONS[idx]||"DH",hand:"R"};}
      else{next[idx]={playerId:player.id,name:player.fullName||player.name,pos:player.pos||POSITIONS[idx]||"DH",hand:player.hand||"R",avg:player.avg,obp:player.obp,slg:player.slg,wrc:player.wrc,hr:player.hr,rbi:player.rbi};}
      onChange(next);
    };
    const setField=(i,k,v)=>{const n=[...lineup];n[i]={...n[i],[k]:v};onChange(n);};
    return(
      <Collapsible title={label} sub={`${filled}/9 bateadores${batters.length?` · ${batters.length} en roster`:""}`}>
        {batters.length>0&&filled===0&&(
          <button onClick={()=>{
            const next=batters.slice(0,9).map((p,i)=>({playerId:p.id,name:p.fullName||p.name,pos:p.pos||POSITIONS[i]||"DH",hand:p.hand||"R",avg:p.avg,obp:p.obp,slg:p.slg,wrc:p.wrc,hr:p.hr,rbi:p.rbi}));
            while(next.length<9) next.push({name:"",pos:POSITIONS[next.length]||"DH",hand:"R"});
            onChange(next);
          }} style={{...btn(T.green),marginBottom:12,fontSize:12}}>⚡ Auto-fill lineup ({batters.length} jugadores)</button>
        )}
        {lineup.map((p,i)=>(
          <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:i<8?`1px solid ${T.border}`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontSize:13,color:T.amber,fontWeight:700,minWidth:18}}>{i+1}</span>
              <div style={{flex:1}}><PlayerCombobox players={batters} value={p.playerId} onChange={pl=>handleSelect(i,pl)} placeholder={batters.length?`Bateador ${i+1}`:"Sin roster"} type="batter"/></div>
            </div>
            {p.name&&(
              <div style={{display:"flex",gap:8,paddingLeft:26}}>
                <div style={{flex:1}}><div style={lbl}>POS</div><select style={{...selectSt,padding:"6px 8px",fontSize:12}} value={p.pos||"DH"} onChange={e=>setField(i,"pos",e.target.value)}>{POSITIONS.map(pos=><option key={pos}>{pos}</option>)}</select></div>
                <div style={{width:56}}><div style={lbl}>MANO</div><select style={{...selectSt,padding:"6px 6px",fontSize:12}} value={p.hand||"R"} onChange={e=>setField(i,"hand",e.target.value)}>{HANDS.map(h=><option key={h}>{h}</option>)}</select></div>
                {p.avg&&p.avg!=="---"&&<div style={{display:"flex",alignItems:"flex-end",gap:4,paddingBottom:2}}><span style={{...pill(T.textDim),fontSize:9}}>AVG {p.avg}</span>{p.wrc&&<span style={{...pill(T.amber),fontSize:9}}>wRC+ {p.wrc}</span>}</div>}
              </div>
            )}
          </div>
        ))}
      </Collapsible>
    );
  };

  const BullpenBlock=({label,teamRoster,data,onChange})=>{
    const relievers=teamRoster?.bullpen||[];
    const set=(k,v)=>onChange({...data,[k]:v});
    const valid=relievers.filter(r=>r.era&&r.era!=="--");
    const avgEra=valid.length?(valid.reduce((s,r)=>s+parseFloat(r.era),0)/valid.length).toFixed(2):"4.20";
    return(
      <Collapsible title={label} sub={`ERA ${data.era||avgEra} · Fatiga ${data.fatigue??0}/3`}>
        {relievers.length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:T.amber,fontWeight:700,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Bullpen · {relievers.length} relevistas</div>
            {relievers.map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{...pill(r.role==="CL"?T.red:r.role==="SU"?T.amber:T.muted),fontSize:9}}>{r.role}</span>
                  <span style={{fontSize:12,color:T.text}}>{r.name}</span>
                  <span style={{...pill(T.textDim),fontSize:9}}>{r.hand}</span>
                </div>
                <div style={{display:"flex",gap:8,fontSize:10}}>
                  {r.era&&r.era!=="--"&&<span style={{color:T.amber}}>ERA {r.era}</span>}
                  {r.k9&&r.k9!=="--"&&<span style={{color:T.green}}>K/9 {r.k9}</span>}
                </div>
              </div>
            ))}
            <button onClick={()=>set("era",avgEra)} style={{marginTop:8,background:T.raised,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",cursor:"pointer",color:T.muted,fontSize:11}}>Usar ERA promedio ({avgEra})</button>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <StatInput label="ERA Bullpen" value={data.era||avgEra} onChange={v=>set("era",v)}/>
          <StatInput label="WHIP" value={data.whip||""} onChange={v=>set("whip",v)}/>
          <StatInput label="K/9" value={data.k9||""} onChange={v=>set("k9",v)}/>
          <StatInput label="LOB%" value={data.lob||""} onChange={v=>set("lob",v)}/>
        </div>
        <div style={{marginTop:10}}><div style={lbl}>Fatiga (0=Fresco · 3=Agotado)</div>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            {[0,1,2,3].map(f=><button key={f} onClick={()=>set("fatigue",f)} style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:15,fontWeight:700,background:(data.fatigue??0)===f?[T.green,T.amber,T.orange,T.red][f]:T.raised,color:(data.fatigue??0)===f?"#000":T.muted}}>{f}</button>)}
          </div>
          <div style={{display:"flex",gap:8,marginTop:4}}>{["Fresco","Leve","Cansado","Agotado"].map((l,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:9,color:T.textDim}}>{l}</div>)}</div>
        </div>
      </Collapsible>
    );
  };

  return(
    <div>
      <div style={sh}>{selectedGame.away} @ {selectedGame.home} · {selectedGame.gameTime}</div>
      <RosterBanner roster={roster} loading={rosterLoading} onRefresh={handleRefresh}/>
      {rosterLogs.length>0&&<DiagPanel logs={rosterLogs} source={roster?.source||"loading"}/>}
      <div style={sh}>SP ABRIDORES</div>
      <PitcherBlock label={`SP Local · ${selectedGame.home}`} teamRoster={roster?.home} data={homeSP} onChange={setHomeSP}/>
      <PitcherBlock label={`SP Visita · ${selectedGame.away}`} teamRoster={roster?.away} data={awaySP} onChange={setAwaySP}/>
      <div style={sh}>LINEUPS</div>
      <LineupBlock label={`Lineup Local · ${selectedGame.home}`} teamRoster={roster?.home} lineup={homeLineup} onChange={setHomeLineup}/>
      <LineupBlock label={`Lineup Visita · ${selectedGame.away}`} teamRoster={roster?.away} lineup={awayLineup} onChange={setAwayLineup}/>
      <div style={sh}>BULLPEN</div>
      <BullpenBlock label={`Bullpen Local · ${selectedGame.home}`} teamRoster={roster?.home} data={homeBP} onChange={setHomeBP}/>
      <BullpenBlock label={`Bullpen Visita · ${selectedGame.away}`} teamRoster={roster?.away} data={awayBP} onChange={setAwayBP}/>
      <div style={{padding:"16px 12px 8px"}}><button style={btn(T.amber)} onClick={handleSim}>⚡ Simular Monte Carlo</button></div>
    </div>
  );
}

// ── Screen: Resumen ───────────────────────────────────────────
function ScreenResumen({simResult,setRealResult}){
  const[homeInn,setHomeInn]=useState(Array(9).fill(null));
  const[awayInn,setAwayInn]=useState(Array(9).fill(null));
  const hT=homeInn.reduce((s,v)=>s+(v||0),0),aT=awayInn.reduce((s,v)=>s+(v||0),0);
  useEffect(()=>{setRealResult({homeScore:hT,awayScore:aT,homeInn,awayInn});},[hT,aT]);
  if(!simResult) return<div style={{padding:20,color:T.muted,fontSize:13,textAlign:"center"}}>Completa la simulación primero.</div>;
  const{game,homeLambda,awayLambda,homeWinPct,awayWinPct}=simResult;
  const proj=(homeLambda+awayLambda).toFixed(1);
  const ov=clamp(50+(homeLambda+awayLambda-9)*8,5,95).toFixed(0);
  const ex=Math.max(5,20-Math.abs(homeLambda+awayLambda-9)*4).toFixed(0);
  const un=(100-parseFloat(ov)-parseFloat(ex)).toFixed(0);
  const ScoreRow=({label,values,onChange,total})=>(
    <div style={{display:"grid",gridTemplateColumns:"56px repeat(9,1fr) 40px",gap:1,marginTop:1}}>
      <div style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:10}}>{label}</div>
      {values.map((v,i)=><input key={i} type="number" min="0" max="20" value={v===null?"":v} onChange={e=>{const n=[...values];n[i]=e.target.value===""?null:parseInt(e.target.value);onChange(n);}} style={{background:T.raised,border:`1px solid ${T.border}`,color:T.text,textAlign:"center",fontSize:12,padding:"4px 0",fontFamily:"'JetBrains Mono',monospace",borderRadius:2,width:"100%",boxSizing:"border-box"}}/>)}
      <div style={{background:T.surface,padding:"6px 2px",textAlign:"center",color:T.amber,fontWeight:700,borderRadius:2,fontSize:12}}>{total}</div>
    </div>
  );
  return(
    <div>
      <div style={sh}>{game?.away} @ {game?.home} · Resumen</div>
      <div style={card}>
        <div style={{fontSize:10,color:T.amber,fontWeight:700,letterSpacing:1.5,marginBottom:10,textTransform:"uppercase"}}>Probabilidad de Victoria</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{label:`LOCAL · ${game?.home}`,pct:homeWinPct,c:T.green},{label:`VISITA · ${game?.away}`,pct:awayWinPct,c:T.text}].map(({label,pct,c})=>(
            <div key={label} style={{textAlign:"center"}}><div style={lbl}>{label}</div><div style={{fontSize:36,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,color:c}}>{pct}%</div></div>
          ))}
        </div>
      </div>
      <div style={cardN}>
        <div style={{fontSize:10,color:T.amber,fontWeight:700,letterSpacing:1.5,marginBottom:10,textTransform:"uppercase"}}>Predicción de Carreras</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[{l:"OVER",pct:ov,c:T.green},{l:"EXACTO",pct:ex,c:T.amber},{l:"UNDER",pct:un,c:T.red}].map(({l,pct,c})=>(
            <div key={l}><div style={{fontSize:10,color:c,fontWeight:700,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{pct}%</div></div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:10,padding:"8px 0",borderTop:`1px solid ${T.border}`}}><span style={lbl}>Total proyectado: </span><span style={{color:T.amber,fontWeight:700,fontSize:16}}>{proj} carreras</span></div>
      </div>
      <div style={cardN}>
        <div style={{fontSize:10,color:T.amber,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>Score Proyectado por Entrada</div>
        <div style={{overflowX:"auto"}}><div style={{minWidth:320}}>
          <div style={{display:"grid",gridTemplateColumns:"56px repeat(9,1fr) 40px",gap:1}}>
            <div style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:10}}>EQUIPO</div>
            {[1,2,3,4,5,6,7,8,9].map(n=><div key={n} style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:11}}>{n}</div>)}
            <div style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:11}}>T</div>
          </div>
          {[{label:game?.home||"LOCAL",lam:homeLambda},{label:game?.away||"VISITA",lam:awayLambda}].map(({label,lam})=>{
            const wts=[0.9,0.9,1.0,1.0,1.0,1.0,1.1,1.1,1.0];
            const cells=Array.from({length:9},(_,i)=>((lam/9)*wts[i]).toFixed(1));
            const tot=cells.reduce((s,v)=>s+parseFloat(v),0).toFixed(1);
            return(<div key={label} style={{display:"grid",gridTemplateColumns:"56px repeat(9,1fr) 40px",gap:1,marginTop:1}}>
              <div style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:10}}>{label}</div>
              {cells.map((v,i)=><div key={i} style={{background:T.surface,padding:"6px 2px",textAlign:"center",color:T.text,borderRadius:2,fontSize:11}}>{v}</div>)}
              <div style={{background:T.surface,padding:"6px 2px",textAlign:"center",color:T.amber,fontWeight:700,borderRadius:2,fontSize:12}}>{tot}</div>
            </div>);
          })}
        </div></div>
      </div>
      <div style={sh}>Resultados Reales (Feedback Loop)</div>
      <div style={cardN}>
        <div style={{fontSize:10,color:T.muted,marginBottom:8}}>Ingresa el marcador real al terminar el juego</div>
        <div style={{overflowX:"auto"}}><div style={{minWidth:320}}>
          <div style={{display:"grid",gridTemplateColumns:"56px repeat(9,1fr) 40px",gap:1}}>
            <div style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:10}}>EQUIPO</div>
            {[1,2,3,4,5,6,7,8,9].map(n=><div key={n} style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:11}}>{n}</div>)}
            <div style={{background:T.raised,padding:"6px 2px",textAlign:"center",color:T.muted,fontWeight:600,borderRadius:2,fontSize:11}}>T</div>
          </div>
          <ScoreRow label={game?.home||"LOCAL"} values={homeInn} onChange={setHomeInn} total={hT}/>
          <ScoreRow label={game?.away||"VISITA"} values={awayInn} onChange={setAwayInn} total={aT}/>
        </div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
          {[["Ganador",hT>aT?game?.home:hT<aT?game?.away:"Empate"],["Proj Total",proj],["Score Real",`${aT} – ${hT}`],["Modelo",hT>aT&&homeLambda>awayLambda?"✓ ACERTÓ":"✗ FALLÓ"]].map(([l,v])=>(
            <div key={l}><div style={lbl}>{l}</div><div style={{fontSize:13,fontWeight:700,color:l==="Modelo"&&v.startsWith("✓")?T.green:l==="Modelo"?T.red:T.text}}>{v}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Value ─────────────────────────────────────────────
function ScreenValue({simResult}){
  const HC=["-2.5","-1.5","-0.5","0","+1.5","+2.5"];
  const EdgePill=({pct})=><span style={{display:"inline-flex",alignItems:"center",background:pct>=5?T.amber:pct>=2?T.amberDim:T.raised,color:pct>=5?"#000":pct>=2?T.amber:T.muted,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700}}>{pct>=0?"+":""}{pct.toFixed(1)}% EDGE</span>;
  const BetRow=({type,side,options})=>{
    const[amount,setAmount]=useState("");
    const[sel,setSel]=useState(options?options[0]:"");
    const[odds,setOdds]=useState("");
    const iP=odds?(parseFloat(odds)>0?100/(parseFloat(odds)+100)*100:Math.abs(parseFloat(odds))/(Math.abs(parseFloat(odds))+100)*100):null;
    const mP=simResult?(side==="home"?parseFloat(simResult.homeWinPct):parseFloat(simResult.awayWinPct)):null;
    const edge=mP&&iP?mP-iP:null;
    return(
      <div style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,color:T.amber,textTransform:"uppercase",letterSpacing:.8}}>{type} · {side==="home"?simResult?.game?.home||"LOCAL":simResult?.game?.away||"VISITA"}</div>
          {edge!==null&&<EdgePill pct={edge}/>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:options?"1fr 1fr 1fr":"1fr 1fr",gap:8}}>
          {options&&<div><div style={lbl}>Selección</div><select style={selectSt} value={sel} onChange={e=>setSel(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></div>}
          <div><div style={lbl}>Odds (USA)</div><input type="number" style={inputSt} placeholder="-150" value={odds} onChange={e=>setOdds(e.target.value)}/></div>
          <div><div style={lbl}>Monto $</div><input type="number" style={inputSt} placeholder="100" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        </div>
        {iP&&<div style={{marginTop:6,fontSize:11,color:T.muted}}>Implícita: <span style={{color:T.text}}>{iP.toFixed(1)}%</span>{mP&&<> · Modelo: <span style={{color:T.amber}}>{mP.toFixed(1)}%</span></>}</div>}
      </div>
    );
  };
  if(!simResult) return<div style={{padding:20,color:T.muted,fontSize:13,textAlign:"center"}}>Completa la simulación primero.</div>;
  return(
    <div>
      <div style={sh}>VALUE · {simResult.game?.away} @ {simResult.game?.home}</div>
      <div style={card}>
        <div style={{fontSize:11,color:T.amber,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>LOCAL · {simResult.game?.home}</div>
        <BetRow type="ML" side="home"/><BetRow type="Handicap" side="home" options={HC}/><BetRow type="First Set" side="home"/><BetRow type="Handicap FS" side="home" options={["-0.5","-1.5","0","+1.5"]}/>
      </div>
      <div style={card}>
        <div style={{fontSize:11,color:T.muted,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>VISITA · {simResult.game?.away}</div>
        <BetRow type="ML" side="away"/><BetRow type="Handicap" side="away" options={HC}/><BetRow type="First Set" side="away"/><BetRow type="Handicap FS" side="away" options={["-0.5","-1.5","0","+1.5"]}/>
      </div>
      <div style={cardN}>
        <div style={{fontSize:11,color:T.amber,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>OVER / UNDER</div>
        <div style={{display:"flex",gap:8}}>
          {["OVER","UNDER"].map(side=>{
            const proj=parseFloat(simResult.homeLambda)+parseFloat(simResult.awayLambda);
            const mPct=clamp(50+(side==="OVER"?1:-1)*(proj-9)*8,5,95);
            return(<div key={side} style={{flex:1,background:T.raised,borderRadius:10,padding:10,textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:700,color:side==="OVER"?T.green:T.red,marginBottom:4}}>{side}</div>
              <div style={{fontSize:24,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{mPct.toFixed(0)}%</div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}

// ── Screen: Props ─────────────────────────────────────────────
function ScreenProps({simResult}){
  if(!simResult) return<div style={{padding:20,color:T.muted,fontSize:13,textAlign:"center"}}>Completa la simulación primero.</div>;
  const{game,homeSP,awaySP,homeLineup,awayLineup}=simResult;
  const PropRow=({player,spHand})=>{
    if(!player.name) return null;
    const same=spHand===player.hand;
    const hit=same?22:28,obp=hit+8,hr=["C","1B","RF","LF","DH"].includes(player.pos)?8:4;
    return(
      <div style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:700}}>{player.name}</span>
              <span style={{...pill(T.blue),fontSize:9}}>{player.pos}</span>
              <span style={{...pill(T.muted),fontSize:9}}>{player.hand}</span>
              {same&&<span style={{...pill(T.amber),fontSize:9}}>SAME HAND</span>}
            </div>
            {player.avg&&player.avg!=="---"&&<div style={{fontSize:10,color:T.textDim,marginTop:2,display:"flex",gap:8}}><span>AVG <span style={{color:T.text}}>{player.avg}</span></span><span>OBP <span style={{color:T.green}}>{player.obp}</span></span>{player.wrc&&<span>wRC+ <span style={{color:T.amber}}>{player.wrc}</span></span>}</div>}
          </div>
          <div style={{display:"flex",gap:10,flexShrink:0}}>
            {[["HIT",hit,hit>=27?T.green:T.text],["OBP",obp,T.amber],["HR",hr,hr>=8?T.amber:T.text]].map(([l,v,c])=>(
              <div key={l} style={{textAlign:"center"}}><div style={{fontSize:9,color:T.muted}}>{l}</div><div style={{fontSize:13,fontWeight:700,color:c}}>{v}%</div></div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  const SPStat=({label,sp})=>(
    <div style={cardN}>
      <div style={{fontSize:11,color:T.amber,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
        {[["ERA",sp.era||"--",T.amber],["FIP",sp.fip||"--",T.text],["K%",sp.kpct&&sp.kpct!=="--"?(parseFloat(sp.kpct)*100).toFixed(0)+"%":"--",T.green],["WHIP",sp.whip||"--",T.red]].map(([l,v,c])=>(
          <div key={l} style={{textAlign:"center"}}><div style={{fontSize:9,color:T.muted}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div></div>
        ))}
      </div>
    </div>
  );
  return(
    <div>
      <div style={sh}>Props · {game?.away} @ {game?.home}</div>
      <SPStat label={`SP Local · ${game?.home} · ${homeSP.name||"--"}`} sp={homeSP}/>
      <SPStat label={`SP Visita · ${game?.away} · ${awaySP.name||"--"}`} sp={awaySP}/>
      <div style={sh}>LINEUP LOCAL · {game?.home}</div>
      <div style={cardN}>{homeLineup.map((p,i)=><PropRow key={i} player={p} spHand={awaySP.hand}/>)}{homeLineup.every(p=>!p.name)&&<div style={{color:T.muted,fontSize:12,padding:8}}>Selecciona el lineup en Simulación.</div>}</div>
      <div style={sh}>LINEUP VISITA · {game?.away}</div>
      <div style={cardN}>{awayLineup.map((p,i)=><PropRow key={i} player={p} spHand={homeSP.hand}/>)}{awayLineup.every(p=>!p.name)&&<div style={{color:T.muted,fontSize:12,padding:8}}>Selecciona el lineup en Simulación.</div>}</div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────
const TABS=[
  {id:"hoy",label:"Hoy",icon:c=>Ico.cal(c)},
  {id:"simulacion",label:"Simulación",icon:c=>Ico.cpu(c)},
  {id:"resumen",label:"Resumen",icon:c=>Ico.bar(c)},
  {id:"value",label:"Value",icon:c=>Ico.dol(c)},
  {id:"props",label:"Props",icon:c=>Ico.usr(c)},
];

export default function App(){
  const[tab,setTab]=useState("hoy");
  const[selectedGame,setSelectedGame]=useState(null);
  const[simResult,setSimResult]=useState(null);
  const[realResult,setRealResult]=useState(null);
  const handleSelect=g=>{setSelectedGame(g);setTab("simulacion");};
  const handleSim=r=>{setSimResult(r);setTab("resumen");};
  return(
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'JetBrains Mono','Courier New',monospace",color:T.text,maxWidth:430,margin:"0 auto",position:"relative",paddingBottom:72}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        *{box-sizing:border-box;}body{margin:0;background:#0A0F1E;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input[type=number]{-moz-appearance:textfield;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.5);}
        ::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:#0A0F1E;}::-webkit-scrollbar-thumb{background:#1D2D44;border-radius:2px;}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"12px 16px 10px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{fontFamily:"'Barlow Condensed',Impact,sans-serif",fontSize:22,fontWeight:700,letterSpacing:1,color:T.amber,margin:0}}>⚾ BASEBALL QUANT</p>
            <p style={{fontSize:11,color:T.muted,margin:0,letterSpacing:.5}}>{selectedGame?`${selectedGame.away} @ ${selectedGame.home} · ${selectedGame.gameTime}`:"MLB ANALYTICS PLATFORM"}</p>
          </div>
          {simResult&&<div style={{textAlign:"right"}}><div style={{fontSize:9,color:T.muted}}>WIN PROB</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700}}><span style={{color:T.green}}>{simResult.homeWinPct}%</span><span style={{color:T.muted}}> / </span><span style={{color:T.text}}>{simResult.awayWinPct}%</span></div></div>}
        </div>
      </div>
      <div>
        {tab==="hoy"&&<ScreenHoy onSelect={handleSelect} selected={selectedGame}/>}
        {tab==="simulacion"&&<ScreenSimulacion selectedGame={selectedGame} onSimulate={handleSim}/>}
        {tab==="resumen"&&<ScreenResumen simResult={simResult} setRealResult={setRealResult}/>}
        {tab==="value"&&<ScreenValue simResult={simResult}/>}
        {tab==="props"&&<ScreenProps simResult={simResult}/>}
      </div>
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.raised,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100,height:64}}>
        {TABS.map(({id,label,icon})=>{
          const a=tab===id,c=a?T.amber:T.textDim;
          return(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,border:"none",background:"transparent",cursor:"pointer",padding:"6px 0 8px",borderTop:a?`2px solid ${T.amber}`:"2px solid transparent"}}>
              {icon(c)}
              <span style={{fontSize:9,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,letterSpacing:.8,color:c,textTransform:"uppercase"}}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

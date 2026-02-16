import { useState, useMemo, useCallback, useEffect } from "react";
import * as Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nqkwurvdwfvzpueapagr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2c9zDnwfZZZlziDs_EAPyQ_zrJOWMB7";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DISTANCES = {
  "AZ - Manheim Phoenix":1750,"CA - BURLINGAME":2150,"CA - Manheim Oceanside":2050,
  "CA - Manheim Riverside":2000,"CO - Manheim Denver":1050,"FL - LAKE PARK":1450,
  "FL - Manheim Fort Lauderdale":1500,"FL - Manheim Orlando":1300,"FL - Manheim Tampa":1350,
  "GA - ROSWELL":800,"IL - PALOS HILLS":130,"MO - NIXA":580,"NC - RALEIGH":950,
  "NJ - Manheim NY Metro Skyline":850,"NJ - Manheim New Jersey":870,"NV - Manheim Nevada":1900,
  "OR - BEAVERTON":2100,"PA - Manheim Pennsylvania":830,"TN - Manheim Nashville":580,
  "TX - Manheim Dallas":1050,"TX - PLANO":1060,"WA - Manheim Seattle":2100,
};

const YEARS = ["2022","2023","2024","2025","2026"];
const MODELS = ["R1S","R1T"];
const MOTORS = ["Dual","Tri","Quad"];
const BATTERIES = ["Standard","Standard+","Large","Large+","Max"];
const WHEELS = ['20" Split Spoke','20" All-Terrain','20" All-Terrain Bright','20" All-Terrain Dark','20" All-Terrain Bronze','20" Dune','21" Road','22" Sport Dark','22" Sport Bright','22" Range'];
const COLORS_FULL = ["Borealis","California Dune","Compass Yellow","El Cap Granite","Forest Green","Glacier White","LA Silver","Launch Green","Limestone","Midnight","Red Canyon","Rivian Blue","Storm Blue"];
const INTERIORS = ["Black Mountain","Forest Edge","Ocean Coast","Slate Sky","Sandstone"];
const FEATURES = ["All-Terrain Package","Dynamic Glass Roof","STEALTH PPF","Front Paint Protection","Powered Tonneau","Powered Tonneau v2","Manual Tonneau","Underbody Shield","Tow Hooks","Stealth Package","Blackout"];

const ADMIN_PASSWORD = "bigwave2025";

// Approximate distance from 53089 (Menomonee Falls, WI) to zip prefixes
const ZIP_DISTANCES={"530":0,"531":20,"532":40,"535":80,"534":60,"537":100,"539":120,"540":150,"541":160,"543":180,"544":200,"545":190,"546":220,"547":250,"548":280,"549":300,"600":90,"601":95,"602":100,"604":110,"606":90,"609":130,"610":140,"612":200,"613":250,"614":280,"617":350,"618":350,"619":380,"480":350,"481":360,"482":370,"483":380,"484":400,"485":420,"486":450,"487":470,"489":500,"490":250,"491":280,"493":300,"494":340,"496":400,"497":450,"550":330,"551":340,"553":350,"554":340,"556":380,"557":410,"558":480,"559":500,"100":870,"101":870,"104":870,"070":850,"080":830,"190":810,"191":810,"200":820,"201":820,"206":840,"207":830,"210":780,"211":790,"220":800,"221":810,"230":850,"300":800,"301":790,"303":810,"305":820,"310":820,"330":1350,"331":1360,"334":1300,"336":1300,"337":1350,"339":1400,"400":470,"401":480,"410":500,"430":380,"432":400,"440":530,"441":530,"443":560,"450":430,"452":460,"453":470,"460":280,"461":300,"462":310,"463":330,"464":350,"466":380,"468":400,"500":320,"502":330,"503":340,"510":450,"520":250,"527":200,"550":350,"554":340,"570":520,"580":600,"590":700,"630":350,"631":360,"640":380,"641":400,"644":430,"650":310,"660":620,"662":640,"670":700,"680":500,"690":550,"700":1050,"701":1060,"703":1000,"710":1020,"730":1000,"731":1020,"733":1050,"740":1050,"750":1060,"751":1060,"752":1080,"760":1100,"770":1150,"773":1160,"780":1100,"790":1300,"800":1050,"801":1050,"802":1060,"803":1080,"810":1100,"820":1150,"831":1200,"840":1400,"841":1410,"850":1750,"852":1750,"853":1770,"860":1780,"900":2050,"902":2050,"906":2020,"910":2080,"920":2050,"921":2060,"930":2100,"940":2150,"941":2150,"943":2130,"945":2120,"950":2120,"970":2100,"971":2100,"980":2100,"981":2100,"982":2100,"983":2120,"984":2150};

const DEFAULT_SETTINGS = {
  transportPerMile: 1,
  detailing: 400,
  reconditioning: 500,
  markup: 3000,
  priceRange: 2500,
  costBasis: "MMR",
};

const CM={"El Cap Granite":"#717171","Forest Green":"#3a5a35","Glacier White":"#d8d8d8","LA Silver":"#a8a8a8","Launch Green":"#4a6a40","Midnight":"#1e1e30","Rivian Blue":"#3a5a8a","Compass Yellow":"#d4b030","Red Canyon":"#7a3020","Limestone":"#b8b0a0","California Dune":"#b8a078","Borealis":"#2a4a3a","Storm Blue":"#3a4a5a","Black Mountain":"#222","Ocean Coast":"#b0b0a8","Forest Edge":"#5a7a50","Slate Sky":"#6a7a8a","Sandstone":"#b8a888","Silver":"#a8a8a8","Green":"#3a5a35","Blue":"#3a5a8a","Gray":"#717171","Black":"#222","White":"#d8d8d8","Yellow":"#d4b030","Red":"#7a3020","Beige":"#b8b0a0"};


const adminCss = `
  input[type="range"]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;background:#2a2a2a;outline:none}
  input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#3a6a8a,#2a5a7a);border:2px solid #5a9cc0;cursor:pointer}
`;

const lb = {display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6a8a9e",marginBottom:5,fontFamily:"'DM Sans',sans-serif"};
const inp = {width:"100%",padding:"10px 12px",background:"#0f0f0f",border:"1.5px solid #2a2a2a",borderRadius:8,color:"#e0e0e0",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"};

function calcCosts(v,s){
  const mmr=parseFloat(v.MMR)||0, bn=parseFloat(v["Buy Now Price"])||0;
  const base=s.costBasis==="MMR"?mmr:(bn>0?bn:mmr);
  const dist=DISTANCES[v["Pickup Location"]]||0;
  const trans=dist*s.transportPerMile;
  const wholesale=base+trans+s.detailing+s.reconditioning;
  const retail=wholesale+s.markup;
  return{base,dist,trans,wholesale,retail,mmr,bn};
}

// Parse Motor and Battery from Trim if not already columns
const TRIM_MOTORS={"Quad":"Quad","Dual":"Dual","Tri":"Tri"};
const TRIM_BATTERIES={"Large":"Large","Standard":"Standard","Standard+":"Standard+","Max":"Max","Performance":"Performance"};
function enrichVehicle(v){
  if(!v._enriched){
    v._enriched=true;
    // Parse motor from trim (e.g. "Quad Large" -> Motor:"Quad", Battery:"Large")
    if(!v.Motor||!v.Battery){
      const parts=(v.Trim||"").split(/\s+/);
      parts.forEach(function(p){
        if(!v.Motor&&TRIM_MOTORS[p])v.Motor=p;
        if(!v.Battery&&TRIM_BATTERIES[p])v.Battery=p;
      });
    }
    // Derive clean trim name (strip motor+battery words)
    var trimWords=(v.Trim||"").split(/\s+/).filter(function(w){return!TRIM_MOTORS[w]&&!TRIM_BATTERIES[w]});
    v._cleanTrim=trimWords.length>0?trimWords.join(" "):v.Trim;
  }
  return v;
}

// ═══════════════════════════════════════════
// CUSTOMER COMPONENTS (Premium Design)
// ═══════════════════════════════════════════

function Dot(props){return <div style={{width:props.size||12,height:props.size||12,borderRadius:"50%",background:CM[props.c]||"#555",border:"1.5px solid rgba(255,255,255,0.15)",flexShrink:0}}/>;}

function FilterPills(props){
  return(
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <div style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",fontFamily:"Outfit,sans-serif",marginRight:2,whiteSpace:"nowrap"}}>{props.label}</div>
        {props.options.map(function(o){var a=props.sel.includes(o);var ct=props.counts?props.counts[o]||0:0;var dim=ct===0&&!a;return <button key={o} onClick={function(){props.onToggle(o)}} style={{padding:"3px 10px",borderRadius:4,fontSize:12,cursor:dim?"default":"pointer",transition:"all .2s",whiteSpace:"nowrap",fontFamily:"Outfit,sans-serif",fontWeight:a?500:400,border:a?"1.5px solid rgba(90,180,212,0.6)":"1.5px solid rgba(255,255,255,0.08)",background:a?"rgba(90,180,212,0.1)":"transparent",color:a?"#5ab5d4":"rgba(255,255,255,0.5)",opacity:dim?0.3:1,pointerEvents:dim?"none":"auto"}}>{o} <span style={{opacity:0.5,fontSize:10}}>({ct})</span></button>;})}
    </div>
  );
}

function MiniPills(props){
  return(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5,fontFamily:"Outfit,sans-serif"}}>{props.label}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        {props.options.map(function(o){var a=props.sel.includes(o);return <button key={o} onClick={function(){props.onToggle(o)}} style={{padding:"4px 10px",borderRadius:6,fontSize:11,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap",fontFamily:"Outfit,sans-serif",border:a?"1.5px solid rgba(90,180,212,0.6)":"1.5px solid rgba(255,255,255,0.08)",background:a?"rgba(90,180,212,0.1)":"transparent",color:a?"#5ab5d4":"rgba(255,255,255,0.45)",fontWeight:a?500:400}}>{o}</button>;})}
      </div>
    </div>
  );
}

function InquiryModal(props){
  var v=props.v,onClose=props.onClose,onSubmit=props.onSubmit,submitting=props.submitting;
  var _n=useState(""),_p=useState(""),_e=useState(""),_d=useState(false),_a=useState(false),_notes=useState(""),_tags=useState([]);
  var name=_n[0],setName=_n[1],phone=_p[0],setPhone=_p[1],email=_e[0],setEmail=_e[1],done=_d[0],setDone=_d[1],agreed=_a[0],setAgreed=_a[1],notes=_notes[0],setNotes=_notes[1],tags=_tags[0],setTags=_tags[1];
  var cinp={width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e0e0e0",fontSize:14,fontFamily:"Outfit,sans-serif",outline:"none",boxSizing:"border-box"};
  var ok=name.trim()&&phone.trim()&&agreed;
  var ov={position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20};
  var TAG_OPTIONS=["I have owned a Rivian before","This is my first Rivian","I have questions about Rivians","I want a Rivian NOW"];
  function togTag(t){setTags(tags.includes(t)?tags.filter(function(x){return x!==t}):[].concat(tags,[t]));}
  if(done)return(<div onClick={onClose} style={ov}><div onClick={function(x){x.stopPropagation()}} style={{background:"#161616",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"40px 36px",maxWidth:440,width:"100%",textAlign:"center"}}><div style={{width:56,height:56,borderRadius:"50%",background:"rgba(90,180,212,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24,color:"#5ab5d4"}}>{"\u2713"}</div><h3 style={{fontSize:22,fontWeight:600,color:"#fff",marginBottom:8}}>Thank You</h3><p style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:20}}>Thank you for your inquiry, we will follow up with you shortly.</p><button onClick={onClose} style={{padding:"12px 32px",background:"#5ab5d4",border:"none",borderRadius:6,color:"#0c0c0c",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Done</button></div></div>);
  return(<div onClick={onClose} style={ov}><div onClick={function(x){x.stopPropagation()}} style={{background:"#161616",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"32px 30px",maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}}><h3 style={{fontSize:20,fontWeight:600,color:"#fff",margin:"0 0 4px"}}>Get Details</h3><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}><span style={{fontSize:14,color:"rgba(255,255,255,0.5)"}}>{v.Year} {v.Model} {v._cleanTrim||v.Trim}</span><Dot c={v["Exterior Color"]}/></div><div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Name *</div><input value={name} onChange={function(x){setName(x.target.value)}} placeholder="Your name" style={cinp}/></div><div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Phone *</div><input value={phone} onChange={function(x){setPhone(x.target.value)}} placeholder="(555) 123-4567" style={cinp}/></div><div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Email</div><input value={email} onChange={function(x){setEmail(x.target.value)}} placeholder="you@email.com" style={cinp}/></div><div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:8}}>Select all that apply</div>{TAG_OPTIONS.map(function(t){var sel=tags.includes(t);return <div key={t} onClick={function(){togTag(t)}} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:6}}><div style={{width:16,height:16,borderRadius:3,border:sel?"1.5px solid #5ab5d4":"1.5px solid rgba(255,255,255,0.15)",background:sel?"rgba(90,180,212,0.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<span style={{color:"#5ab5d4",fontSize:11,fontWeight:700}}>{"\u2713"}</span>}</div><span style={{fontSize:13,color:sel?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.4)"}}>{t}</span></div>;})}</div><div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Notes</div><textarea value={notes} onChange={function(x){setNotes(x.target.value)}} placeholder="Anything else we should know..." rows={2} style={{width:"100%",padding:"10px 14px",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e0e0e0",fontSize:13,fontFamily:"Outfit,sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:44}}/></div><div style={{marginBottom:16,display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}} onClick={function(){setAgreed(!agreed)}}><div style={{width:18,height:18,borderRadius:4,border:agreed?"1.5px solid #5ab5d4":"1.5px solid rgba(255,255,255,0.15)",background:agreed?"rgba(90,180,212,0.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{agreed&&<span style={{color:"#5ab5d4",fontSize:12,fontWeight:700}}>{"\u2713"}</span>}</div><span style={{fontSize:11,color:"rgba(255,255,255,0.4)",lineHeight:"1.4"}}>I understand that all of the options listed in the Rivian Wave Report may have already been sold and that options or data may have errors and may change without notice.</span></div><div style={{display:"flex",gap:10}}><button disabled={!ok||submitting} onClick={async function(){await onSubmit({name:name,phone:phone,email:email,vehicle:v,retailPrice:props.retail,tags:tags,notes:notes});setDone(true)}} style={{flex:1,padding:"12px",background:ok?"#5ab5d4":"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:ok?"#0c0c0c":"rgba(255,255,255,0.3)",fontSize:14,fontWeight:600,cursor:ok?"pointer":"default",fontFamily:"Outfit,sans-serif",opacity:ok?1:0.4}}>{submitting?"Sending...":"Send Inquiry"}</button><button onClick={onClose} style={{padding:"12px 20px",background:"transparent",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:6,color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Cancel</button></div></div></div>);
}

function NotifyModal(props){
  var onClose=props.onClose,onSubmit=props.onSubmit,submitting=props.submitting;
  var _n=useState(""),_p=useState(""),_e=useState(""),_nt=useState(""),_d=useState(false);
  var name=_n[0],setName=_n[1],phone=_p[0],setPhone=_p[1],email=_e[0],setEmail=_e[1],notes=_nt[0],setNotes=_nt[1],done=_d[0],setDone=_d[1];
  var _fy=useState([]),_fm=useState([]),_fmo=useState([]),_fb=useState([]),_fc=useState([]),_fi=useState([]);
  var fy=_fy[0],sfy=_fy[1],fm=_fm[0],sfm=_fm[1],fmo=_fmo[0],sfmo=_fmo[1],fb=_fb[0],sfb=_fb[1],fc=_fc[0],sfc=_fc[1],fi=_fi[0],sfi=_fi[1];
  var _bud=useState(120000),_mil=useState(100000);var bud=_bud[0],sBud=_bud[1],mil=_mil[0],sMil=_mil[1];
  var cinp={width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e0e0e0",fontSize:14,fontFamily:"Outfit,sans-serif",outline:"none",boxSizing:"border-box"};
  var ok=name.trim()&&phone.trim();
  function tog(arr,setArr,v){setArr(arr.includes(v)?arr.filter(function(x){return x!==v}):[].concat(arr,[v]))}
  var ov={position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"};
  if(done)return(<div onClick={onClose} style={ov}><div onClick={function(x){x.stopPropagation()}} style={{background:"#161616",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"40px 36px",maxWidth:480,width:"100%",textAlign:"center"}}><div style={{width:56,height:56,borderRadius:"50%",background:"rgba(90,180,212,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24,color:"#5ab5d4"}}>{"\u2713"}</div><h3 style={{fontSize:22,fontWeight:600,color:"#fff",marginBottom:8}}>You are On the List</h3><p style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:20}}>We will reach out within <strong style={{color:"#5ab5d4"}}>48 hours</strong> if we find a match.</p><button onClick={onClose} style={{padding:"12px 32px",background:"#5ab5d4",border:"none",borderRadius:6,color:"#0c0c0c",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Done</button></div></div>);
  return(<div onClick={onClose} style={ov}><div onClick={function(x){x.stopPropagation()}} style={{background:"#161616",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"28px 26px",maxWidth:520,width:"100%",maxHeight:"90vh",overflowY:"auto",margin:"auto"}}><h3 style={{fontSize:20,fontWeight:600,color:"#fff",margin:"0 0 4px"}}>Get Notified</h3><p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:18}}>Tell us your ideal spec and we will notify you when it arrives.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Name *</div><input value={name} onChange={function(x){setName(x.target.value)}} placeholder="Your name" style={cinp}/></div><div><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Phone *</div><input value={phone} onChange={function(x){setPhone(x.target.value)}} placeholder="(555) 123-4567" style={cinp}/></div></div><div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Email</div><input value={email} onChange={function(x){setEmail(x.target.value)}} placeholder="you@email.com" style={cinp}/></div><MiniPills label="Year" options={YEARS} sel={fy} onToggle={function(v){tog(fy,sfy,v)}}/><MiniPills label="Model" options={MODELS} sel={fm} onToggle={function(v){tog(fm,sfm,v)}}/><MiniPills label="Motor" options={MOTORS} sel={fmo} onToggle={function(v){tog(fmo,sfmo,v)}}/><MiniPills label="Battery" options={BATTERIES} sel={fb} onToggle={function(v){tog(fb,sfb,v)}}/><MiniPills label="Color" options={COLORS_FULL} sel={fc} onToggle={function(v){tog(fc,sfc,v)}}/><MiniPills label="Interior" options={INTERIORS} sel={fi} onToggle={function(v){tog(fi,sfi,v)}}/><div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Max Budget</div><div style={{fontSize:13,fontWeight:500,color:"#5ab5d4",marginBottom:6}}>{bud>=120000?"No limit":"$"+bud.toLocaleString()}</div><input type="range" min={20000} max={120000} step={1000} value={bud} onChange={function(x){sBud(Number(x.target.value))}} style={{width:"100%"}}/></div><div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Max Mileage</div><div style={{fontSize:13,fontWeight:500,color:"#5ab5d4",marginBottom:6}}>{mil>=100000?"Any":mil.toLocaleString()+" mi"}</div><input type="range" min={0} max={100000} step={1000} value={mil} onChange={function(x){sMil(Number(x.target.value))}} style={{width:"100%"}}/></div><div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Notes</div><textarea value={notes} onChange={function(x){setNotes(x.target.value)}} placeholder="Timeline, trade-in info..." rows={2} style={{width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#e0e0e0",fontSize:14,fontFamily:"Outfit,sans-serif",outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:48}}/></div><div style={{display:"flex",gap:10}}><button disabled={!ok||submitting} onClick={async function(){await onSubmit({name:name,phone:phone,email:email,notes:notes,years:fy,models:fm,motors:fmo,batteries:fb,colors:fc,interiors:fi,maxBudget:bud<120000?bud:null,maxMileage:mil<100000?mil:null});setDone(true)}} style={{flex:1,padding:"12px",background:ok?"#5ab5d4":"rgba(255,255,255,0.1)",border:"none",borderRadius:6,color:ok?"#0c0c0c":"rgba(255,255,255,0.3)",fontSize:14,fontWeight:600,cursor:ok?"pointer":"default",fontFamily:"Outfit,sans-serif",opacity:ok?1:0.4}}>{submitting?"Sending...":"Notify Me"}</button><button onClick={onClose} style={{padding:"12px 20px",background:"transparent",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:6,color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Cancel</button></div></div></div>);
}

// ═══════════════════════════════════════════
// ADMIN COMPONENTS (preserved from production)
// ═══════════════════════════════════════════

function AdminLogin({onLogin}){
  const [pw,setPw]=useState("");const[err,setErr]=useState(false);
  return(
    <div style={{maxWidth:400,margin:"80px auto",background:"#161616",border:"1px solid #222",borderRadius:12,padding:32,textAlign:"center"}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",color:"#3a6a8a",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:8}}>Admin Portal</div>
      <h2 style={{fontSize:22,fontWeight:300,color:"#f0f0f0",marginBottom:24}}>Big Wave <span style={{fontWeight:700}}>Auto</span></h2>
      <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr(false)}} onKeyDown={e=>e.key==="Enter"&&(pw===ADMIN_PASSWORD?onLogin():setErr(true))}
        placeholder="Enter password" style={{...inp,textAlign:"center",marginBottom:12}}/>
      {err&&<div style={{color:"#b57a7a",fontSize:13,marginBottom:12}}>Incorrect password</div>}
      <button onClick={()=>pw===ADMIN_PASSWORD?onLogin():setErr(true)} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#3a6a8a,#2a5a7a)",border:"none",borderRadius:8,color:"#dce8f0",fontSize:14,fontWeight:600,cursor:"pointer"}}>Log In</button>
    </div>
  );
}

function AdminDashboard({inquiries,requests,settings,onSettingsChange,vehicles,vehicleColumns,onUpload,onDeleteInquiry,onDeleteRequest,onLogout}){
  const [tab,setTab]=useState("settings");
  return(
    <div>
      <div style={{padding:"20px 28px",borderBottom:"1px solid #1e1e1e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",color:"#3a6a8a",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:2}}>Admin</div>
          <h1 style={{fontSize:22,fontWeight:300,margin:0,color:"#f0f0f0"}}>Big Wave <span style={{fontWeight:700}}>Auto</span></h1>
        </div>
        <div style={{display:"flex",gap:6}}>
          <span style={{background:"#1a2230",color:"#5a9cc0",padding:"4px 10px",borderRadius:12,fontSize:12,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{inquiries.length} inquiries</span>
          <span style={{background:"#1a1e25",color:"#5a7c9c",padding:"4px 10px",borderRadius:12,fontSize:12,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{requests.length} notify</span>
          <span style={{background:"#1e1a25",color:"#9c5a9c",padding:"4px 10px",borderRadius:12,fontSize:12,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{vehicles.length} vehicles</span>
          <button onClick={onLogout} style={{padding:"4px 14px",background:"transparent",border:"1px solid #333",borderRadius:12,color:"#888",fontSize:11,fontWeight:600,cursor:"pointer",marginLeft:8}}>Log Out</button>
        </div>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #1e1e1e",background:"#111",overflowX:"auto"}}>
        {[{k:"settings",l:"Settings"},{k:"inventory",l:"Inventory"},{k:"inquiries",l:"Inquiries"},{k:"requests",l:"Notify Requests"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            flex:1,padding:"13px 10px",background:tab===t.k?"#0f0f0f":"transparent",border:"none",
            borderBottom:tab===t.k?"2px solid #3a6a8a":"2px solid transparent",
            color:tab===t.k?"#dce8f0":"#666",fontSize:12,fontWeight:tab===t.k?600:400,cursor:"pointer",whiteSpace:"nowrap",
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{padding:"20px 28px",maxWidth:900,margin:"0 auto"}}>

        {/* SETTINGS */}
        {tab==="settings"&&(
          <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:24}}>
            <div style={{fontSize:14,fontWeight:700,color:"#ccc",marginBottom:20}}>Pricing & Display Settings</div>

            {[
              {label:"Markup ($)",key:"markup",min:0,max:15000,step:250,fmt:v=>"$"+v.toLocaleString()},
              {label:"Price Range +/- (shown to customer)",key:"priceRange",min:500,max:10000,step:250,fmt:v=>"± $"+v.toLocaleString()},
              {label:"Transport Cost ($/mi)",key:"transportPerMile",min:0.5,max:3,step:0.1,fmt:v=>"$"+v.toFixed(2)+"/mi"},
              {label:"Detailing Cost ($)",key:"detailing",min:0,max:1000,step:50,fmt:v=>"$"+v.toLocaleString()},
              {label:"Reconditioning Cost ($)",key:"reconditioning",min:0,max:2000,step:50,fmt:v=>"$"+v.toLocaleString()},
            ].map(s=>(
              <div key={s.key} style={{marginBottom:20}}>
                <label style={lb}>{s.label}</label>
                <span style={{fontSize:16,fontWeight:700,color:"#5a9cc0",fontFamily:"'Space Mono',monospace",display:"block",marginBottom:6}}>
                  {s.fmt(settings[s.key])}
                </span>
                <input type="range" min={s.min} max={s.max} step={s.step} value={settings[s.key]}
                  onChange={e=>onSettingsChange({...settings,[s.key]:Number(e.target.value)})}/>
              </div>
            ))}

            <div style={{marginBottom:14}}>
              <label style={lb}>Base Cost Source</label>
              <div style={{display:"flex",gap:6}}>
                {["MMR","BuyNow"].map(o=>(
                  <button key={o} onClick={()=>onSettingsChange({...settings,costBasis:o})} style={{
                    flex:1,padding:"8px",borderRadius:6,border:settings.costBasis===o?"2px solid #3a6a8a":"1.5px solid #222",
                    background:settings.costBasis===o?"linear-gradient(135deg,#3a6a8a,#2a5a7a)":"transparent",
                    color:settings.costBasis===o?"#dce8f0":"#777",fontSize:12,fontWeight:600,cursor:"pointer",
                  }}>{o==="BuyNow"?"Buy Now":o}</button>
                ))}
              </div>
            </div>

            <div style={{background:"#111",borderRadius:8,padding:14,marginTop:20,fontSize:12,color:"#666",lineHeight:1.7}}>
              <strong style={{color:"#999"}}>How pricing works:</strong><br/>
              Retail = Base Cost ({settings.costBasis}) + Transport (distance × ${settings.transportPerMile}/mi) + Detailing (${settings.detailing}) + Recon (${settings.reconditioning}) + Markup (${settings.markup.toLocaleString()})<br/>
              Customer sees: Retail ± ${settings.priceRange.toLocaleString()} as a price range
            </div>
          </div>
        )}

        {/* INVENTORY */}
        {tab==="inventory"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#161616",border:"1px solid #222",borderRadius:12,padding:"16px 24px",marginBottom:12}}>
              <label style={{display:"inline-block",padding:"10px 24px",background:"linear-gradient(135deg,#1a2538,#162030)",border:"1.5px solid #2a3a4a",borderRadius:10,color:"#7a9cb5",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                {vehicles.length>0?`Re-upload CSV (${vehicles.length} loaded)`:"Upload CSV"}
                <input type="file" accept=".csv,.tsv,.txt" onChange={onUpload} style={{display:"none"}}/>
              </label>
              {vehicles.length>0&&<button onClick={async()=>{try{await supabase.from("inventory").delete().neq("id",0);await supabase.from("inventory").insert([{vehicles:vehicles,columns:vehicleColumns,uploaded_at:new Date().toISOString()}]);alert("Inventory saved!");}catch(err){alert("Save failed: "+err.message);}}} style={{padding:"10px 24px",background:"linear-gradient(135deg,#3a6a8a,#2a5a7a)",border:"none",borderRadius:10,color:"#dce8f0",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save Changes</button>}
            </div>
            {vehicles.length>0&&(
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #222",maxHeight:"70vh",overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead style={{position:"sticky",top:0,zIndex:10}}><tr>
                    <th style={{padding:"8px 6px",background:"#1a1a1a",borderBottom:"2px solid #333",textAlign:"center",color:"#666",fontWeight:600,fontSize:10,width:40}}>#</th>
                    {vehicleColumns.map(c=><th key={c} style={{padding:"8px 10px",background:"#1a1a1a",borderBottom:"2px solid #333",textAlign:"left",color:"#7a9ab0",fontWeight:700,fontSize:10,textTransform:"uppercase",whiteSpace:"nowrap",minWidth:80}}>{c}</th>)}
                    <th style={{padding:"8px 6px",background:"#1a1a1a",borderBottom:"2px solid #333",width:50}}></th>
                  </tr></thead>
                  <tbody>
                    {vehicles.map((r,i)=><tr key={i} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
                      <td style={{padding:"4px 6px",borderBottom:"1px solid #1a1a1a",color:"#555",textAlign:"center",fontSize:10}}>{i+1}</td>
                      {vehicleColumns.map(c=><td key={c} style={{padding:"2px 4px",borderBottom:"1px solid #1a1a1a"}}>
                        <input value={r[c]||""} onChange={e=>{const nv=[...vehicles];nv[i]={...nv[i],[c]:e.target.value};if(nv[i]._enriched){nv[i]._enriched=false;enrichVehicle(nv[i]);}setVehicles(nv);}} style={{width:"100%",padding:"4px 6px",background:"transparent",border:"1px solid transparent",borderRadius:3,color:"#ccc",fontSize:11,outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box",minWidth:60}} onFocus={e=>{e.target.style.border="1px solid #3a6a8a";e.target.style.background="rgba(255,255,255,0.04)";}} onBlur={e=>{e.target.style.border="1px solid transparent";e.target.style.background="transparent";}}/>
                      </td>)}
                      <td style={{padding:"2px 4px",borderBottom:"1px solid #1a1a1a",textAlign:"center"}}><button onClick={()=>{const nv=vehicles.filter((_,j)=>j!==i);setVehicles(nv);}} style={{padding:"3px 8px",background:"#251a1a",border:"none",borderRadius:4,color:"#b57a7a",fontSize:9,fontWeight:600,cursor:"pointer"}}>✕</button></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* INQUIRIES */}
        {tab==="inquiries"&&(inquiries.length===0?
          <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:40,textAlign:"center",color:"#666"}}>No inquiries yet.</div>
          :inquiries.map((r,i)=>(
            <div key={r.id||i} style={{background:"#161616",border:"1px solid #222",borderRadius:10,padding:"14px 18px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:"#e0e0e0"}}>{r.name} <span style={{fontSize:12,color:"#666",fontWeight:400}}>{r.phone} {r.email&&`· ${r.email}`}</span></div>
                  <div style={{fontSize:13,color:"#888",marginTop:4}}>Vehicle: {r.vehicle_desc||"—"}{r.vin&&<span style={{fontSize:11,color:"#666"}}> · VIN: <span style={{fontFamily:"'Space Mono',monospace",color:"#7a9cb5",userSelect:"all"}}>{r.vin}</span></span>}</div>
                  {r.tags&&r.tags.length>0&&<div style={{fontSize:11,color:"#5a9cc0",marginTop:3}}>{r.tags.join(" · ")}</div>}
                  {r.notes&&<div style={{fontSize:12,color:"#666",marginTop:3,fontStyle:"italic"}}>{r.notes}</div>}
                  <div style={{fontSize:11,color:"#555",marginTop:2}}>Retail: ${(r.retail_price||0).toLocaleString()} · Wholesale: ${(r.wholesale_cost||0).toLocaleString()} · {r.created_at?new Date(r.created_at).toLocaleString():"—"}</div>
                </div>
                <button onClick={()=>onDeleteInquiry(r.id,i)} style={{padding:"5px 12px",background:"#251a1a",border:"none",borderRadius:6,color:"#b57a7a",fontSize:11,fontWeight:600,cursor:"pointer"}}>Remove</button>
              </div>
            </div>
          ))
        )}

        {/* NOTIFY REQUESTS */}
        {tab==="requests"&&(requests.length===0?
          <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:40,textAlign:"center",color:"#666"}}>No notify requests yet.</div>
          :requests.map((r,i)=>(
            <div key={r.id||i} style={{background:"#161616",border:"1px solid #222",borderRadius:10,padding:"14px 18px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:"#e0e0e0"}}>{r.name} <span style={{fontSize:12,color:"#666",fontWeight:400}}>{r.phone} {r.email&&`· ${r.email}`}</span></div>
                  <div style={{fontSize:12,color:"#777",marginTop:4}}>{[...(r.years||[]),...(r.models||[]),...(r.motors||[]),...(r.colors||[])].join(", ")||"No specs"}</div>
                  <div style={{fontSize:11,color:"#555",marginTop:2}}>Budget: {(r.max_budget||120000)>=120000?"Any":"$"+(r.max_budget||0).toLocaleString()}</div>
                  {r.notes&&<div style={{fontSize:12,color:"#666",marginTop:3,fontStyle:"italic"}}>{r.notes}</div>}
                  <div style={{fontSize:10,color:"#444",marginTop:3}}>{r.created_at?new Date(r.created_at).toLocaleString():"—"}</div>
                </div>
                <button onClick={()=>onDeleteRequest(r.id,i)} style={{padding:"5px 12px",background:"#251a1a",border:"none",borderRadius:6,color:"#b57a7a",fontSize:11,fontWeight:600,cursor:"pointer"}}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════


// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════

export default function App(){
  const [mode,setMode]=useState("customer");
  const [adminLoggedIn,setAdminLoggedIn]=useState(false);
  const [vehicles,setVehicles]=useState([]);
  const [vehicleColumns,setVehicleColumns]=useState([]);
  const [settings,setSettings]=useState({...DEFAULT_SETTINGS});
  const [filters,setFilters]=useState({years:[],models:[],trims:[],batteries:[],motors:[],colors:[]});
  const [sortBy,setSortBy]=useState("retail_asc");
  const [maxPrice,setMaxPrice]=useState(120000);
  const [maxMileage,setMaxMileage]=useState(100000);
  const [showNotify,setShowNotify]=useState(false);
  const [inquiryTarget,setInquiryTarget]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [adminInquiries,setAdminInquiries]=useState([]);
  const [adminRequests,setAdminRequests]=useState([]);
  const [loadingInventory,setLoadingInventory]=useState(true);
  const [customerZip,setCustomerZip]=useState("");

  const deliveryMiles=customerZip.length>=3?ZIP_DISTANCES[customerZip.substring(0,3)]||null:null;
  const deliveryCost=deliveryMiles!==null?Math.round(deliveryMiles*0.9):null;

  useEffect(()=>{
    const check=()=>setMode(window.location.hash==="#admin"?"admin":"customer");
    check();window.addEventListener("hashchange",check);
    return()=>window.removeEventListener("hashchange",check);
  },[]);

  useEffect(()=>{
    const loadData=async()=>{
      setLoadingInventory(true);
      try{
        const{data:inv}=await supabase.from("inventory").select("*").order("id",{ascending:false}).limit(1);
        if(inv&&inv.length>0){
          const rows=(inv[0].vehicles||[]).filter(v=>{
            const mmr=parseFloat(v.MMR)||0;
            const bn=parseFloat(v["Buy Now Price"])||0;
            return mmr>0||bn>0;
          });
          setVehicles(rows.map(enrichVehicle));
          setVehicleColumns(inv[0].columns||[]);
        }
      }catch(e){console.error("Failed to load inventory:",e);}
      try{
        const{data:s}=await supabase.from("settings").select("*").limit(1);
        if(s&&s.length>0&&s[0].values){
          setSettings(prev=>({...prev,...s[0].values}));
        }
      }catch(e){console.error("Failed to load settings:",e);}
      setLoadingInventory(false);
    };
    loadData();
  },[]);

  useEffect(()=>{if(mode==="admin"&&adminLoggedIn)loadAdmin();},[mode,adminLoggedIn]);

  const loadAdmin=async()=>{
    const{data:inq}=await supabase.from("inquiries").select("*").order("created_at",{ascending:false});
    if(inq)setAdminInquiries(inq);
    const{data:req}=await supabase.from("requests").select("*").order("created_at",{ascending:false});
    if(req)setAdminRequests(req);
  };

  const handleUpload=useCallback(e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async evt=>{
      const result=Papa.parse(evt.target.result,{header:true,skipEmptyLines:true});
      const allData=result.data.filter(r=>r.Year&&r.Model);
      const filtered=allData.filter(v=>{
        const mmr=parseFloat(v.MMR)||0;
        const bn=parseFloat(v["Buy Now Price"])||0;
        return mmr>0||bn>0;
      });
      setVehicles(filtered.map(enrichVehicle));
      setVehicleColumns(result.meta.fields||[]);
      try{
        await supabase.from("inventory").delete().neq("id",0);
        await supabase.from("inventory").insert([{vehicles:allData,columns:result.meta.fields,uploaded_at:new Date().toISOString()}]);
      }catch(err){console.error("Failed to save inventory:",err);}
    };
    reader.readAsText(file);
  },[]);

  function toggle(key,val){
    setFilters(function(prev){var arr=prev[key];var next=arr.includes(val)?arr.filter(function(x){return x!==val}):[].concat(arr,[val]);var out=Object.assign({},prev);out[key]=next;return out});
  }

  const filterOptions=useMemo(()=>{
    const u=k=>[...new Set(vehicles.map(v=>v[k]).filter(Boolean))].sort();
    const cleanTrims=[...new Set(vehicles.map(v=>v._cleanTrim).filter(Boolean))].sort().filter(t=>t.includes("Launch")||t.includes("Adventure"));
    return{years:u("Year"),models:u("Model"),trims:cleanTrims,batteries:u("Battery"),motors:u("Motor"),colors:u("Exterior Color")};
  },[vehicles]);

  const processed=useMemo(()=>{
    // Deduplicate by VIN - merge auction + buy-now into one row
    const vinMap={};
    vehicles.forEach(v=>{
      const vin=v.Vin;
      if(!vin){return;}
      if(!vinMap[vin]){vinMap[vin]={...v};}
      else{
        const existing=vinMap[vin];
        const eMMR=parseFloat(existing.MMR)||0;
        const esBN=parseFloat(existing["Buy Now Price"])||0;
        const nMMR=parseFloat(v.MMR)||0;
        const nBN=parseFloat(v["Buy Now Price"])||0;
        if(nMMR>eMMR)existing.MMR=v.MMR;
        if(nBN>0&&(esBN===0||nBN<esBN))existing["Buy Now Price"]=v["Buy Now Price"];
        Object.keys(v).forEach(k=>{if(!existing[k]&&v[k])existing[k]=v[k];});
      }
    });
    const deduped=Object.values(vinMap);
    let f=deduped.filter(v=>{
      const _mmr=parseFloat(v.MMR)||0;
      const _bn=parseFloat(v["Buy Now Price"])||0;
      if(_mmr>0&&_bn>0&&_bn>_mmr+2000)return false;
      if(filters.years.length&&!filters.years.includes(v.Year))return false;
      if(filters.models.length&&!filters.models.includes(v.Model))return false;
      if(filters.trims.length&&!filters.trims.includes(v._cleanTrim))return false;
      if(filters.batteries.length&&!filters.batteries.includes(v.Battery))return false;
      if(filters.motors.length&&!filters.motors.includes(v.Motor))return false;
      if(filters.colors.length&&!filters.colors.includes(v["Exterior Color"]))return false;
      return true;
    });
    let wc=f.map(v=>{const c=calcCosts(v,settings);return{vehicle:v,costs:c};});
    if(maxPrice<120000)wc=wc.filter(i=>i.costs.retail<=maxPrice);
    if(maxMileage<100000)wc=wc.filter(i=>(parseInt(i.vehicle["Odometer Value"])||0)<=maxMileage);
    wc.sort((a,b)=>{
      switch(sortBy){
        case"retail_asc":return a.costs.retail-b.costs.retail;
        case"retail_desc":return b.costs.retail-a.costs.retail;
        case"miles_asc":return(parseInt(a.vehicle["Odometer Value"])||0)-(parseInt(b.vehicle["Odometer Value"])||0);
        default:return 0;
      }
    });
    return wc;
  },[vehicles,filters,settings,sortBy,maxPrice,maxMileage]);

  const filterCounts=useMemo(()=>{
    const c=(key,csvKey)=>{
      const of2={...filters,[key]:[]};
      const base=vehicles.filter(v=>{
        if(of2.years.length&&!of2.years.includes(v.Year))return false;
        if(of2.models.length&&!of2.models.includes(v.Model))return false;
        if(of2.trims.length&&!of2.trims.includes(v._cleanTrim))return false;
        if(of2.batteries.length&&!of2.batteries.includes(v.Battery))return false;
        if(of2.motors.length&&!of2.motors.includes(v.Motor))return false;
        if(of2.colors.length&&!of2.colors.includes(v["Exterior Color"]))return false;
        return true;
      });
      const counts={};base.forEach(v=>{const val=v[csvKey];if(val)counts[val]=(counts[val]||0)+1});
      return counts;
    };
    return{years:c("years","Year"),models:c("models","Model"),trims:c("trims","_cleanTrim"),batteries:c("batteries","Battery"),motors:c("motors","Motor"),colors:c("colors","Exterior Color")};
  },[vehicles,filters]);

  // Pipedrive integration
  const PD_TOKEN="0a1466434aed07cbb1de38b848a2b71866fe8849";
  const PD_URL="https://bigwaveauto.pipedrive.com/api/v1";
  const pdFetch=async(endpoint,body)=>{
    try{
      const r=await fetch(`${PD_URL}${endpoint}?api_token=${PD_TOKEN}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      return await r.json();
    }catch(e){console.error("Pipedrive error:",e);return null;}
  };
  const pushToPipedrive=async({name,phone,email,title,notes})=>{
    try{
      const person=await pdFetch("/persons",{name:name||"Unknown",phone:[{value:phone||"",primary:true}],email:[{value:email||"",primary:true}]});
      const personId=person&&person.data?person.data.id:null;
      await pdFetch("/deals",{title:title||"Rivian Inquiry",person_id:personId,status:"open",...(notes?{visible_to:3}:{})});
      if(notes&&personId){await pdFetch("/notes",{content:notes,person_id:personId});}
    }catch(e){console.error("Pipedrive push failed:",e);}
  };

  const submitInquiry=async({name,phone,email,vehicle:v,retailPrice,tags,notes})=>{
    setSubmitting(true);
    const c=calcCosts(v,settings);
    await supabase.from("inquiries").insert([{name,phone,email,vin:v.Vin,vehicle_desc:`${v.Year} ${v.Model} ${v.Trim} ${v["Exterior Color"]||""}`.trim(),retail_price:c.retail,wholesale_cost:c.wholesale,tags:tags||[],notes:notes||""}]);
    const tagStr=(tags&&tags.length>0)?tags.join(", "):"";
    const pdNotes=`Vehicle: ${v.Year} ${v.Model} ${v.Trim} ${v["Exterior Color"]||""}\nVIN: ${v.Vin||"N/A"}\nRetail: $${Math.round(c.retail).toLocaleString()}\nWholesale: $${Math.round(c.wholesale).toLocaleString()}${tagStr?"\nTags: "+tagStr:""}${notes?"\nNotes: "+notes:""}`;
    await pushToPipedrive({name,phone,email,title:`Rivian Inquiry - ${v.Year} ${v.Model} ${v._cleanTrim||v.Trim}`,notes:pdNotes});
    setSubmitting(false);
  };

  const submitNotify=async form=>{
    setSubmitting(true);
    try{
      const{error}=await supabase.from("requests").insert([{name:form.name,phone:form.phone,email:form.email,notes:form.notes,years:form.years,models:form.models,motors:form.motors,batteries:form.batteries,colors:form.colors,interiors:form.interiors,max_budget:form.maxBudget,max_mileage:form.maxMileage}]);
      if(error)console.error("Notify insert error:",error);
    }catch(err){console.error("Notify failed:",err);}
    const specs=[...(form.years||[]),...(form.models||[]),...(form.motors||[]),...(form.colors||[])].join(", ");
    const pdNotes=`Notify Request\nSpecs: ${specs||"Any"}\nBudget: ${form.maxBudget?"$"+form.maxBudget.toLocaleString():"Any"}\nMax Mileage: ${form.maxMileage?form.maxMileage.toLocaleString()+" mi":"Any"}${form.notes?"\nNotes: "+form.notes:""}`;
    await pushToPipedrive({name:form.name,phone:form.phone,email:form.email,title:"Rivian Notify Request",notes:pdNotes});
    setSubmitting(false);
  };

  const hasFilters=filters.years.length||filters.models.length||filters.trims.length||filters.batteries.length||filters.motors.length||filters.colors.length;

  return(
    <div style={{minHeight:"100vh",background:"#0c0c0c",color:"#fff",fontFamily:"Outfit,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <style dangerouslySetInnerHTML={{__html:adminCss}}/>

      {inquiryTarget&&<InquiryModal v={inquiryTarget.vehicle} retail={inquiryTarget.retail} onClose={()=>setInquiryTarget(null)} onSubmit={submitInquiry} submitting={submitting}/>}
      {showNotify&&<NotifyModal onClose={()=>setShowNotify(false)} onSubmit={submitNotify} submitting={submitting}/>}

      {/* ADMIN */}
      {mode==="admin"&&!adminLoggedIn&&<AdminLogin onLogin={()=>{setAdminLoggedIn(true);loadAdmin();}}/>}
      {mode==="admin"&&adminLoggedIn&&<AdminDashboard
        inquiries={adminInquiries} requests={adminRequests}
        settings={settings} onSettingsChange={async(ns)=>{setSettings(ns);try{await supabase.from("settings").delete().neq("id",0);await supabase.from("settings").insert([{values:ns}]);}catch(err){console.error(err);}}}
        vehicles={vehicles} vehicleColumns={vehicleColumns} onUpload={handleUpload}
        onDeleteInquiry={async(id,i)=>{if(id)await supabase.from("inquiries").delete().eq("id",id);setAdminInquiries(p=>p.filter((_,j)=>j!==i));}}
        onDeleteRequest={async(id,i)=>{if(id)await supabase.from("requests").delete().eq("id",id);setAdminRequests(p=>p.filter((_,j)=>j!==i));}}
        onLogout={()=>setAdminLoggedIn(false)}
      />}

      {/* CUSTOMER */}
      {mode==="customer"&&(
        <>
          <div style={{padding:"20px 28px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                <h1 style={{fontSize:26,fontWeight:300,letterSpacing:"-0.02em",margin:0}}><span style={{fontWeight:700}}>BIG WAVE</span> Rivian Report</h1>
                {vehicles.length>0&&<span style={{fontSize:12,fontWeight:500,color:"#5ab5d4",background:"rgba(90,180,212,0.1)",padding:"3px 10px",borderRadius:6}}>{processed.length} available</span>}
              </div>
            </div>
          </div>

          <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 28px 60px"}}>
            {loadingInventory?(
              <div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:14,color:"rgba(255,255,255,0.4)"}}>Loading inventory...</div></div>
            ):vehicles.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:48,marginBottom:16,opacity:0.4}}>{"\u26A1"}</div><div style={{fontSize:18,color:"rgba(255,255,255,0.5)",marginBottom:24}}>No vehicles available right now</div><button onClick={function(){setShowNotify(true)}} style={{padding:"12px 32px",background:"#5ab5d4",border:"none",borderRadius:6,color:"#0c0c0c",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Notify Me When Available</button></div>
            ):(
              <div>
                <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"12px 18px",marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
                    <FilterPills label="Model" options={filterOptions.models} sel={filters.models} onToggle={function(v){toggle("models",v)}} counts={filterCounts.models}/>
                    <FilterPills label="Year" options={filterOptions.years} sel={filters.years} onToggle={function(v){toggle("years",v)}} counts={filterCounts.years}/>
                    <FilterPills label="Trim" options={filterOptions.trims} sel={filters.trims} onToggle={function(v){toggle("trims",v)}} counts={filterCounts.trims}/>
                    <FilterPills label="Battery" options={filterOptions.batteries} sel={filters.batteries} onToggle={function(v){toggle("batteries",v)}} counts={filterCounts.batteries}/>
                    <FilterPills label="Motor" options={filterOptions.motors} sel={filters.motors} onToggle={function(v){toggle("motors",v)}} counts={filterCounts.motors}/>
                    <FilterPills label="Color" options={filterOptions.colors} sel={filters.colors} onToggle={function(v){toggle("colors",v)}} counts={filterCounts.colors}/>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Budget</span><span style={{fontSize:13,fontWeight:500,color:"#5ab5d4",minWidth:70}}>{maxPrice>=120000?"Any":"$"+maxPrice.toLocaleString()}</span><input type="range" min={30000} max={120000} step={1000} value={maxPrice} onChange={function(e){setMaxPrice(Number(e.target.value))}} style={{width:100}}/></div>

                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Mileage</span><span style={{fontSize:13,fontWeight:500,color:"#5ab5d4",minWidth:70}}>{maxMileage>=100000?"Any":maxMileage.toLocaleString()+" mi"}</span><input type="range" min={0} max={100000} step={5000} value={maxMileage} onChange={function(e){setMaxMileage(Number(e.target.value))}} style={{width:100}}/></div>
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(90,180,212,0.06)",padding:"4px 10px",borderRadius:4,border:"1px solid rgba(90,180,212,0.15)",alignSelf:"flex-start"}}><span style={{fontSize:11,fontWeight:600,color:"#5ab5d4",textTransform:"uppercase",letterSpacing:"0.06em"}}>Your Zip</span><input value={customerZip} onChange={function(e){setCustomerZip(e.target.value.replace(/\D/g,"").slice(0,5))}} placeholder="ZIP" maxLength={5} style={{width:56,padding:"3px 6px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:4,color:"#fff",fontSize:13,fontWeight:600,outline:"none",fontFamily:"DM Sans,sans-serif",textAlign:"center"}}/>{deliveryCost!==null?<span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>~{deliveryMiles.toLocaleString()} mi · ${deliveryCost.toLocaleString()}</span>:customerZip.length>=3?<span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>call for quote</span>:null}</div>
                      {hasFilters?<button onClick={function(){setFilters({years:[],models:[],trims:[],batteries:[],motors:[],colors:[]})}} style={{padding:"4px 12px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:4,color:"rgba(255,255,255,0.3)",fontSize:11,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Clear</button>:null}
                    </div>
                </div>

                <div>
                  {processed.length===0?(
                    <div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:48,marginBottom:16,opacity:0.4}}>{"\u26A1"}</div><div style={{fontSize:18,color:"rgba(255,255,255,0.5)",marginBottom:24}}>No vehicles match your filters</div><button onClick={function(){setShowNotify(true)}} style={{padding:"12px 32px",background:"#5ab5d4",border:"none",borderRadius:6,color:"#0c0c0c",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Notify Me When Available</button></div>
                  ):(
                    <div>
                      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Sort</span><select value={sortBy} onChange={function(e){setSortBy(e.target.value)}} style={{padding:"4px 8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:4,color:"rgba(255,255,255,0.6)",fontSize:12,outline:"none",fontFamily:"Outfit,sans-serif"}}><option value="retail_asc">Price ↑</option><option value="retail_desc">Price ↓</option><option value="miles_asc">Miles ↑</option></select></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:1}}>
                        {processed.map(function(item){
                          var v=item.vehicle,ret=item.costs.retail;
                          var mi=v["Odometer Value"]?parseInt(v["Odometer Value"]):null;
                          return(
                            <div key={v.Vin} onClick={function(){setInquiryTarget({vehicle:v,retail:ret})}} style={{display:"flex",alignItems:"center",height:40,padding:"0 16px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:4,cursor:"pointer",transition:"all .12s",gap:12}}>
                              <span style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"-0.02em",width:42,flexShrink:0}}>{v.Model}</span>
                              <span style={{fontSize:13,color:"rgba(255,255,255,0.35)",width:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{v._cleanTrim||v.Trim}</span>
                              <span style={{fontSize:12,color:"rgba(255,255,255,0.2)",width:36,flexShrink:0}}>{v.Year}</span>
                              <span style={{fontSize:12,color:"rgba(255,255,255,0.3)",width:70,flexShrink:0}}>{mi!==null?mi.toLocaleString()+" mi":""}</span>
                <span onClick={function(e){e.stopPropagation();if(v.Vin){navigator.clipboard.writeText(v.Vin);var el=e.target;el.style.color="#5ab5d4";el.textContent="copied!";setTimeout(function(){el.style.color="rgba(255,255,255,0.25)";el.textContent=v.Vin.slice(-6)},1200)}}} style={{fontSize:11,color:"rgba(255,255,255,0.25)",width:52,flexShrink:0,fontFamily:"'Space Mono',monospace",cursor:"pointer"}} title={v.Vin||""}>{v.Vin?v.Vin.slice(-6):""}</span>
                              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"rgba(255,255,255,0.3)",width:60,flexShrink:0}}>{v.Motor?v.Motor:""}</span>
                              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"rgba(255,255,255,0.3)",width:60,flexShrink:0}}>{v.Battery||""}</span>
                              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"rgba(255,255,255,0.3)",flex:1,minWidth:0}}><Dot c={v["Exterior Color"]} size={8}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v["Exterior Color"]}</span><span style={{color:"rgba(255,255,255,0.12)",margin:"0 2px"}}>/</span><Dot c={v["Interior Color"]} size={8}/><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v["Interior Color"]}</span></span>
                              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                                <span style={{fontSize:15,fontWeight:600,color:"#fff",fontFamily:"DM Sans,sans-serif"}}>{"$"+(Math.round(ret/50)*50).toLocaleString()}</span>
                                {deliveryCost!==null?<><span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>+</span><span style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.4)"}}>{"$"+deliveryCost.toLocaleString()}</span><span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}> = </span><span style={{fontSize:15,fontWeight:700,color:"#5ab5d4",fontFamily:"DM Sans,sans-serif"}}>{"$"+(Math.round((ret+deliveryCost)/50)*50).toLocaleString()}</span><span style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginLeft:3}}>+TTL</span></>:customerZip.length>=3&&deliveryMiles===null?<span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>+transport +TTL</span>:<span style={{fontSize:11,color:"rgba(255,255,255,0.15)",fontStyle:"italic"}}>zip above for delivery est.</span>}
                              </div>
                              <button onClick={function(e){e.stopPropagation();setInquiryTarget({vehicle:v,retail:ret})}} style={{padding:"4px 12px",background:"transparent",border:"1px solid rgba(90,180,212,0.3)",borderRadius:4,color:"#5ab5d4",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif",whiteSpace:"nowrap",flexShrink:0}}>Get Details</button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{textAlign:"center",padding:"36px 20px",marginTop:10}}>
                        <div style={{fontSize:14,color:"rgba(255,255,255,0.35)",marginBottom:14}}>Don't see your perfect spec?</div>
                        <button onClick={function(){setShowNotify(true)}} style={{padding:"12px 32px",background:"#5ab5d4",border:"none",borderRadius:6,color:"#0c0c0c",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"Outfit,sans-serif"}}>Notify Me When Available</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

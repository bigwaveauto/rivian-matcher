import { useState, useMemo, useCallback, useEffect } from "react";
import * as Papa from "papaparse";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════
// SUPABASE — Replace with your values
// ═══════════════════════════════════════════
const SUPABASE_URL = "https://nqkwurvdwfvzpueapagr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2c9zDnwfZZZlziDs_EAPyQ_zrJOWMB7";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══════════════════════════════════════════
// DISTANCE TABLE (miles from 53089)
// ═══════════════════════════════════════════
const DISTANCES = {
  "AZ - Manheim Phoenix":1750,"CA - BURLINGAME":2150,"CA - Manheim Oceanside":2050,
  "CA - Manheim Riverside":2000,"CO - Manheim Denver":1050,"FL - LAKE PARK":1450,
  "FL - Manheim Fort Lauderdale":1500,"FL - Manheim Orlando":1300,"FL - Manheim Tampa":1350,
  "GA - ROSWELL":800,"IL - PALOS HILLS":130,"MO - NIXA":580,"NC - RALEIGH":950,
  "NJ - Manheim NY Metro Skyline":850,"NJ - Manheim New Jersey":870,"NV - Manheim Nevada":1900,
  "OR - BEAVERTON":2100,"PA - Manheim Pennsylvania":830,"TN - Manheim Nashville":580,
  "TX - Manheim Dallas":1050,"TX - PLANO":1060,"WA - Manheim Seattle":2100,
};

// ═══════════════════════════════════════════
// RIVIAN OPTIONS (for notify-me form)
// ═══════════════════════════════════════════
const YEARS = ["2022","2023","2024","2025","2026"];
const MODELS = ["R1S","R1T"];
const MOTORS = ["Dual","Tri","Quad"];
const BATTERIES = ["Standard","Standard+","Large","Large+","Max"];
const WHEELS = ['20" Split Spoke','20" All-Terrain','20" All-Terrain Bright','20" All-Terrain Dark','20" All-Terrain Bronze','20" Dune','21" Road','22" Sport Dark','22" Sport Bright','22" Range'];
const COLORS_FULL = ["Borealis","California Dune","Compass Yellow","El Cap Granite","Forest Green","Glacier White","LA Silver","Launch Green","Limestone","Midnight","Red Canyon","Rivian Blue","Storm Blue"];
const INTERIORS = ["Black Mountain","Forest Edge","Ocean Coast","Slate Sky","Sandstone"];
const FEATURES = ["All-Terrain Package","Dynamic Glass Roof","STEALTH PPF","Front Paint Protection","Powered Tonneau","Powered Tonneau v2","Manual Tonneau","Underbody Shield","Tow Hooks","Stealth Package","Blackout"];

const ADMIN_PASSWORD = "bigwave2025";

const DEFAULT_SETTINGS = {
  transportPerMile: 1,
  detailing: 400,
  reconditioning: 500,
  markup: 3000,
  priceRange: 2500, // +/- shown to customer
  costBasis: "MMR",
};

const css = `
  input[type="range"]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;background:#2a2a2a;outline:none}
  input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4a6741,#3a5431);border:2px solid #6b9c5a;cursor:pointer}
  input[type="range"]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4a6741,#3a5431);border:2px solid #6b9c5a;cursor:pointer}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .v-card{animation:fadeIn .25s ease both}
`;

const lb = {display:"block",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#7a8a6e",marginBottom:5,fontFamily:"'DM Sans',sans-serif"};
const inp = {width:"100%",padding:"10px 12px",background:"#0f0f0f",border:"1.5px solid #2a2a2a",borderRadius:8,color:"#e0e0e0",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"};

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════
function FilterPills({label,options,selected,onChange,counts}){
  const toggle=o=>onChange(selected.includes(o)?selected.filter(s=>s!==o):[...selected,o]);
  return(
    <div style={{marginBottom:14}}>
      <label style={lb}>{label}</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {options.map(o=>{
          const a=selected.includes(o),c=counts?.[o]||0;
          return <button key={o} onClick={()=>toggle(o)} style={{
            padding:"4px 10px",borderRadius:6,border:a?"2px solid #4a6741":"1.5px solid #222",
            background:a?"linear-gradient(135deg,#4a6741,#3a5431)":"rgba(255,255,255,0.02)",
            color:a?"#e0eadc":c===0?"#444":"#999",fontSize:12,fontWeight:a?600:400,
            cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif",
            opacity:c===0&&!a?.5:1
          }}>{o} ({c})</button>;
        })}
      </div>
    </div>
  );
}

function MultiSelect({label,options,selected,onChange}){
  const toggle=o=>onChange(selected.includes(o)?selected.filter(s=>s!==o):[...selected,o]);
  return(
    <div style={{marginBottom:14}}>
      <label style={lb}>{label}</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {options.map(o=>{
          const a=selected.includes(o);
          return <button key={o} onClick={()=>toggle(o)} style={{
            padding:"4px 10px",borderRadius:6,border:a?"2px solid #4a6741":"1.5px solid #222",
            background:a?"linear-gradient(135deg,#4a6741,#3a5431)":"rgba(255,255,255,0.02)",
            color:a?"#e0eadc":"#999",fontSize:12,fontWeight:a?600:400,
            cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif",
          }}>{o}</button>;
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// COST CALCULATIONS (internal only)
// ═══════════════════════════════════════════
function calcCosts(v,s){
  const mmr=parseFloat(v.MMR)||0, bn=parseFloat(v["Buy Now Price"])||0;
  const base=s.costBasis==="MMR"?(mmr>0?mmr:(bn>0?bn:0)):(bn>0?bn:mmr);
  const dist=DISTANCES[v["Pickup Location"]]||0;
  const trans=dist*s.transportPerMile;
  const wholesale=base+trans+s.detailing+s.reconditioning;
  const retail=wholesale+s.markup;
  return{base,dist,trans,wholesale,retail,mmr,bn};
}

// ═══════════════════════════════════════════
// CUSTOMER VEHICLE CARD (clean — no cost data)
// ═══════════════════════════════════════════
function CustomerVehicleCard({vehicle:v,retail,priceRange,index,onInquire}){
  const low = retail - priceRange;
  const high = retail + priceRange;
  const miles = v["Odometer Value"] ? parseInt(v["Odometer Value"]) : null;

  return(
    <div className="v-card" style={{
      background:"#161616",border:"1px solid #222",borderRadius:10,marginBottom:8,
      overflow:"hidden",animationDelay:`${index*.04}s`,animationFillMode:"both",
      padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",
    }}>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:16,fontWeight:700,color:"#e0e0e0"}}>{v.Year} Rivian {v.Model}</span>
          <span style={{fontSize:13,color:"#888"}}>{v.Trim}</span>
        </div>
        <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
          {v["Exterior Color"]&&(
            <span style={{fontSize:11,padding:"3px 10px",borderRadius:5,background:"#1a1a1a",color:"#999",border:"1px solid #222"}}>
              {v["Exterior Color"]}
            </span>
          )}
          {v["Interior Color"]&&(
            <span style={{fontSize:11,padding:"3px 10px",borderRadius:5,background:"#1a1a1a",color:"#999",border:"1px solid #222"}}>
              Int: {v["Interior Color"]}
            </span>
          )}
          {miles!==null&&(
            <span style={{fontSize:11,padding:"3px 10px",borderRadius:5,background:"#1a1a1a",color:"#999",border:"1px solid #222"}}>
              {miles.toLocaleString()} mi
            </span>
          )}
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"#666",marginBottom:2}}>Estimated Price</div>
          <div style={{fontSize:18,fontWeight:700,color:"#6b9c5a",fontFamily:"'Space Mono',monospace"}}>
            ${low.toLocaleString()} – ${high.toLocaleString()}
          </div>
        </div>
        <button onClick={()=>onInquire(v,retail)} style={{
          padding:"10px 20px",background:"linear-gradient(135deg,#4a6741,#3a5431)",border:"none",
          borderRadius:8,color:"#e0eadc",fontSize:12,fontWeight:600,cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",
        }}>Inquire</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// INQUIRY MODAL
// ═══════════════════════════════════════════
function InquiryModal({vehicle:v,retailPrice,priceRange,onClose,onSubmit,submitting}){
  const [name,setName]=useState("");const[phone,setPhone]=useState("");const[email,setEmail]=useState("");
  const [done,setDone]=useState(false);
  const low=retailPrice-priceRange, high=retailPrice+priceRange;

  const submit=async()=>{
    if(!name.trim()||!phone.trim())return;
    await onSubmit({name,phone,email,vehicle:v,retailPrice});
    setDone(true);
  };

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#161616",border:"1px solid #222",borderRadius:14,padding:28,maxWidth:480,width:"100%"}}>
        {done?(
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>🌊</div>
            <h3 style={{fontSize:20,fontWeight:700,color:"#e0eadc",marginBottom:6}}>Inquiry Sent!</h3>
            <p style={{fontSize:14,color:"#999",marginBottom:16}}>
              <strong style={{color:"#e0eadc"}}>Big Wave Auto</strong> will reach out within <strong style={{color:"#6b9c5a"}}>48 hours</strong>.
            </p>
            <div style={{background:"#111",borderRadius:8,padding:14,fontSize:14,color:"#999"}}>
              {v.Year} Rivian {v.Model} {v.Trim}<br/>
              <span style={{color:"#6b9c5a",fontFamily:"'Space Mono',monospace"}}>${low.toLocaleString()} – ${high.toLocaleString()}</span>
            </div>
            <button onClick={onClose} style={{marginTop:16,padding:"10px 28px",background:"linear-gradient(135deg,#4a6741,#3a5431)",border:"none",borderRadius:8,color:"#e0eadc",fontSize:13,fontWeight:600,cursor:"pointer"}}>Done</button>
          </div>
        ):(
          <>
            <h3 style={{fontSize:18,fontWeight:700,color:"#e0eadc",margin:"0 0 4px"}}>Interested in this Rivian?</h3>
            <div style={{fontSize:14,color:"#999",marginBottom:4}}>{v.Year} {v.Model} {v.Trim}</div>
            <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
              {v["Exterior Color"]&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:4,background:"#111",color:"#888"}}>{v["Exterior Color"]}</span>}
              <span style={{fontSize:11,padding:"3px 8px",borderRadius:4,background:"#1a2518",color:"#6b9c5a",fontFamily:"'Space Mono',monospace"}}>${low.toLocaleString()} – ${high.toLocaleString()}</span>
            </div>
            <div style={{marginBottom:12}}><label style={lb}>Name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="John Smith" style={inp}/></div>
            <div style={{marginBottom:12}}><label style={lb}>Phone *</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="555-123-4567" style={inp}/></div>
            <div style={{marginBottom:16}}><label style={lb}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="john@email.com" style={inp}/></div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={submit} disabled={!name.trim()||!phone.trim()||submitting} style={{
                flex:1,padding:"12px",background:(name.trim()&&phone.trim())?"linear-gradient(135deg,#4a6741,#3a5431)":"#222",
                border:"none",borderRadius:8,color:(name.trim()&&phone.trim())?"#e0eadc":"#666",fontSize:14,fontWeight:700,cursor:"pointer",
              }}>{submitting?"Sending...":"Send Inquiry"}</button>
              <button onClick={onClose} style={{padding:"12px 20px",background:"transparent",border:"1px solid #333",borderRadius:8,color:"#777",fontSize:13,cursor:"pointer"}}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// NOTIFY ME FORM
// ═══════════════════════════════════════════
function NotifyForm({initialFilters,onSubmit,submitting}){
  const [form,setForm]=useState({
    name:"",phone:"",email:"",notes:"",
    years:initialFilters?.years||[],models:initialFilters?.models||[],
    motors:[],batteries:[],wheels:[],colors:[],interiors:[],upgrades:[],features:[],
    maxBudget:120000,maxMileage:100000,
  });
  const [done,setDone]=useState(false);

  const submit=async()=>{
    if(!form.name.trim()||!form.phone.trim())return;
    await onSubmit(form);
    setDone(true);
  };

  if(done) return(
    <div style={{background:"#161616",border:"1px solid #222",borderRadius:14,padding:"40px 28px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>🌊</div>
      <h3 style={{fontSize:22,fontWeight:700,color:"#e0eadc",marginBottom:8}}>You're On the List!</h3>
      <div style={{fontSize:14,color:"#999",marginBottom:20}}>We'll notify you as soon as a matching Rivian hits our inventory.</div>
      <div style={{background:"#1a2518",border:"1px solid #2a3a2a",borderRadius:10,padding:"16px 20px",fontSize:14,color:"#b0c8a8",lineHeight:1.6}}>
        <strong style={{color:"#e0eadc"}}>Big Wave Auto</strong> will reach out within <strong style={{color:"#6b9c5a"}}>48 hours</strong> if we find a match.
      </div>
      <button onClick={()=>setDone(false)} style={{marginTop:18,padding:"8px 20px",background:"transparent",border:"1px solid #333",borderRadius:6,color:"#777",fontSize:12,cursor:"pointer"}}>Submit Another</button>
    </div>
  );

  return(
    <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:22}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <h3 style={{fontSize:18,fontWeight:700,color:"#e0eadc",margin:"0 0 6px"}}>Don't See What You Want?</h3>
        <p style={{fontSize:13,color:"#666",margin:0}}>Tell us your ideal spec and we'll notify you when it comes in.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div><label style={lb}>Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="John Smith" style={inp}/></div>
        <div><label style={lb}>Phone *</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="555-123-4567" style={inp}/></div>
      </div>
      <div style={{marginBottom:14}}><label style={lb}>Email</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="john@email.com" style={inp}/></div>
      <MultiSelect label="Year" options={YEARS} selected={form.years} onChange={v=>setForm({...form,years:v})}/>
      <MultiSelect label="Model" options={MODELS} selected={form.models} onChange={v=>setForm({...form,models:v})}/>
      <MultiSelect label="Motor" options={MOTORS} selected={form.motors} onChange={v=>setForm({...form,motors:v})}/>
      <MultiSelect label="Battery" options={BATTERIES} selected={form.batteries} onChange={v=>setForm({...form,batteries:v})}/>
      <MultiSelect label="Wheels" options={WHEELS} selected={form.wheels} onChange={v=>setForm({...form,wheels:v})}/>
      <MultiSelect label="Color" options={COLORS_FULL} selected={form.colors} onChange={v=>setForm({...form,colors:v})}/>
      <MultiSelect label="Interior" options={INTERIORS} selected={form.interiors} onChange={v=>setForm({...form,interiors:v})}/>
      <MultiSelect label="Upgrades" options={["Performance Upgrade","ASCEND INTERIOR"]} selected={form.upgrades} onChange={v=>setForm({...form,upgrades:v})}/>
      <MultiSelect label="Features" options={FEATURES} selected={form.features} onChange={v=>setForm({...form,features:v})}/>
      <div style={{marginBottom:14}}>
        <label style={lb}>Max Budget</label>
        <span style={{fontSize:13,fontWeight:600,color:"#6b9c5a",fontFamily:"'Space Mono',monospace",display:"block",marginBottom:6}}>
          {form.maxBudget>=120000?"Any":"$"+form.maxBudget.toLocaleString()}
        </span>
        <input type="range" min={20000} max={120000} step={1000} value={form.maxBudget} onChange={e=>setForm({...form,maxBudget:Number(e.target.value)})}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={lb}>Max Mileage</label>
        <span style={{fontSize:13,fontWeight:600,color:"#6b9c5a",fontFamily:"'Space Mono',monospace",display:"block",marginBottom:6}}>
          {form.maxMileage>=100000?"Any":form.maxMileage.toLocaleString()+" mi"}
        </span>
        <input type="range" min={0} max={100000} step={1000} value={form.maxMileage} onChange={e=>setForm({...form,maxMileage:Number(e.target.value)})}/>
      </div>
      <div style={{marginBottom:14}}><label style={lb}>Notes</label>
        <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Timeline, trade-in info..." rows={2} style={{...inp,resize:"vertical"}}/>
      </div>
      <button onClick={submit} disabled={!form.name.trim()||!form.phone.trim()||submitting} style={{
        width:"100%",padding:"12px",background:(form.name.trim()&&form.phone.trim())?"linear-gradient(135deg,#4a6741,#3a5431)":"#222",
        border:"none",borderRadius:8,color:(form.name.trim()&&form.phone.trim())?"#e0eadc":"#666",fontSize:14,fontWeight:700,cursor:"pointer",
      }}>{submitting?"Submitting...":"Notify Me When Available"}</button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ADMIN DASHBOARD (full cost data + settings)
// ═══════════════════════════════════════════
function AdminLogin({onLogin}){
  const [pw,setPw]=useState("");const[err,setErr]=useState(false);
  return(
    <div style={{maxWidth:400,margin:"80px auto",background:"#161616",border:"1px solid #222",borderRadius:12,padding:32,textAlign:"center"}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",color:"#4a6741",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:8}}>Admin Portal</div>
      <h2 style={{fontSize:22,fontWeight:300,color:"#f0f0f0",marginBottom:24}}>Big Wave <span style={{fontWeight:700}}>Auto</span></h2>
      <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr(false)}} onKeyDown={e=>e.key==="Enter"&&(pw===ADMIN_PASSWORD?onLogin():setErr(true))}
        placeholder="Enter password" style={{...inp,textAlign:"center",marginBottom:12}}/>
      {err&&<div style={{color:"#b57a7a",fontSize:13,marginBottom:12}}>Incorrect password</div>}
      <button onClick={()=>pw===ADMIN_PASSWORD?onLogin():setErr(true)} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#4a6741,#3a5431)",border:"none",borderRadius:8,color:"#e0eadc",fontSize:14,fontWeight:600,cursor:"pointer"}}>Log In</button>
    </div>
  );
}

function AdminDashboard({inquiries,requests,settings,onSettingsChange,vehicles,vehicleColumns,onUpload,onDeleteInquiry,onDeleteRequest}){
  const [tab,setTab]=useState("settings");
  return(
    <div>
      <div style={{padding:"20px 28px",borderBottom:"1px solid #1e1e1e",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",color:"#4a6741",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:2}}>Admin</div>
          <h1 style={{fontSize:22,fontWeight:300,margin:0,color:"#f0f0f0"}}>Big Wave <span style={{fontWeight:700}}>Auto</span></h1>
        </div>
        <div style={{display:"flex",gap:6}}>
          <span style={{background:"#1a2518",color:"#6b9c5a",padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{inquiries.length} inquiries</span>
          <span style={{background:"#1a1e25",color:"#5a7c9c",padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{requests.length} notify</span>
          <span style={{background:"#1e1a25",color:"#9c5a9c",padding:"4px 10px",borderRadius:20,fontSize:12,fontWeight:600,fontFamily:"'Space Mono',monospace"}}>{vehicles.length} vehicles</span>
        </div>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #1e1e1e",background:"#111",overflowX:"auto"}}>
        {[{k:"settings",l:"Settings"},{k:"inventory",l:"Inventory"},{k:"inquiries",l:"Inquiries"},{k:"requests",l:"Notify Requests"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{
            flex:1,padding:"13px 10px",background:tab===t.k?"#0f0f0f":"transparent",border:"none",
            borderBottom:tab===t.k?"2px solid #4a6741":"2px solid transparent",
            color:tab===t.k?"#e0eadc":"#666",fontSize:12,fontWeight:tab===t.k?600:400,cursor:"pointer",whiteSpace:"nowrap",
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
                <span style={{fontSize:16,fontWeight:700,color:"#6b9c5a",fontFamily:"'Space Mono',monospace",display:"block",marginBottom:6}}>
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
                    flex:1,padding:"8px",borderRadius:6,border:settings.costBasis===o?"2px solid #4a6741":"1.5px solid #222",
                    background:settings.costBasis===o?"linear-gradient(135deg,#4a6741,#3a5431)":"transparent",
                    color:settings.costBasis===o?"#e0eadc":"#777",fontSize:12,fontWeight:600,cursor:"pointer",
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
            <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:24,marginBottom:20,textAlign:"center"}}>
              <label style={{display:"inline-block",padding:"12px 32px",background:"linear-gradient(135deg,#1a2538,#162030)",border:"1.5px solid #2a3a4a",borderRadius:10,color:"#7a9cb5",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                {vehicles.length>0?`✓ ${vehicles.length} vehicles loaded`:"Upload CSV"}
                <input type="file" accept=".csv,.tsv,.txt" onChange={onUpload} style={{display:"none"}}/>
              </label>
            </div>
            {vehicles.length>0&&(
              <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #222"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr>
                    {vehicleColumns.slice(0,8).map(c=><th key={c} style={{padding:"10px 12px",background:"#1a1a1a",borderBottom:"1px solid #2a2a2a",textAlign:"left",color:"#8a9a7e",fontWeight:700,fontSize:11,textTransform:"uppercase",whiteSpace:"nowrap"}}>{c}</th>)}
                  </tr></thead>
                  <tbody>
                    {vehicles.slice(0,30).map((r,i)=><tr key={i}>{vehicleColumns.slice(0,8).map(c=><td key={c} style={{padding:"8px 12px",borderBottom:"1px solid #1a1a1a",color:"#bbb",whiteSpace:"nowrap",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis"}}>{r[c]}</td>)}</tr>)}
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
                  <div style={{fontSize:13,color:"#888",marginTop:4}}>Vehicle: {r.vehicle_desc||"—"}</div>
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
export default function App(){
  const [mode,setMode]=useState("customer");
  const [adminLoggedIn,setAdminLoggedIn]=useState(false);
  const [vehicles,setVehicles]=useState([]);
  const [vehicleColumns,setVehicleColumns]=useState([]);
  const [settings,setSettings]=useState({...DEFAULT_SETTINGS});
  const [filters,setFilters]=useState({years:[],models:[],trims:[],colors:[]});
  const [sortBy,setSortBy]=useState("retail_asc");
  const [maxPrice,setMaxPrice]=useState(120000);
  const [showNotify,setShowNotify]=useState(false);
  const [inquiryTarget,setInquiryTarget]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [adminInquiries,setAdminInquiries]=useState([]);
  const [adminRequests,setAdminRequests]=useState([]);

  useEffect(()=>{
    const check=()=>setMode(window.location.hash==="#admin"?"admin":"customer");
    check();window.addEventListener("hashchange",check);
    return()=>window.removeEventListener("hashchange",check);
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
    reader.onload=evt=>{
      const result=Papa.parse(evt.target.result,{header:true,skipEmptyLines:true});
      const data=result.data.filter(r=>r.Year&&r.Model);
      setVehicles(data.filter(v => {
        const mmr = parseFloat(v.MMR) || 0;
        const bn = parseFloat(v["Buy Now Price"]) || 0;
        return mmr > 0 || bn > 0;
      }));
      setVehicleColumns(result.meta.fields||[]);
    };
    reader.readAsText(file);
  },[]);

  const filterOptions=useMemo(()=>{
    const u=k=>[...new Set(vehicles.map(v=>v[k]).filter(Boolean))].sort();
    return{years:u("Year"),models:u("Model"),trims:u("Trim"),colors:u("Exterior Color")};
  },[vehicles]);

  const processed=useMemo(()=>{
    let f=vehicles.filter(v=>{
      if(filters.years.length&&!filters.years.includes(v.Year))return false;
      if(filters.models.length&&!filters.models.includes(v.Model))return false;
      if(filters.trims.length&&!filters.trims.includes(v.Trim))return false;
      if(filters.colors.length&&!filters.colors.includes(v["Exterior Color"]))return false;
      return true;
    });
    let wc=f.map(v=>{const c=calcCosts(v,settings);return{vehicle:v,costs:c};});
    if(maxPrice<120000)wc=wc.filter(i=>i.costs.retail<=maxPrice);
    wc.sort((a,b)=>{
      switch(sortBy){
        case"retail_asc":return a.costs.retail-b.costs.retail;
        case"retail_desc":return b.costs.retail-a.costs.retail;
        case"miles_asc":return(parseInt(a.vehicle["Odometer Value"])||0)-(parseInt(b.vehicle["Odometer Value"])||0);
        case"grade_desc":return(parseFloat(b.vehicle["Condition Report Grade"])||0)-(parseFloat(a.vehicle["Condition Report Grade"])||0);
        default:return 0;
      }
    });
    return wc;
  },[vehicles,filters,settings,sortBy,maxPrice]);

  const filterCounts=useMemo(()=>{
    const c=(key,csvKey)=>{
      const of={...filters,[key]:[]};
      const base=vehicles.filter(v=>{
        if(of.years.length&&!of.years.includes(v.Year))return false;
        if(of.models.length&&!of.models.includes(v.Model))return false;
        if(of.trims.length&&!of.trims.includes(v.Trim))return false;
        if(of.colors.length&&!of.colors.includes(v["Exterior Color"]))return false;
        return true;
      });
      const counts={};base.forEach(v=>{const val=v[csvKey];if(val)counts[val]=(counts[val]||0)+1});
      return counts;
    };
    return{years:c("years","Year"),models:c("models","Model"),trims:c("trims","Trim"),colors:c("colors","Exterior Color")};
  },[vehicles,filters]);

  const submitInquiry=async({name,phone,email,vehicle:v,retailPrice})=>{
    setSubmitting(true);
    const c=calcCosts(v,settings);
    await supabase.from("inquiries").insert([{name,phone,email,vin:v.Vin,vehicle_desc:`${v.Year} ${v.Model} ${v.Trim} ${v["Exterior Color"]||""}`.trim(),retail_price:c.retail,wholesale_cost:c.wholesale}]);
    setSubmitting(false);
  };

  const submitNotify=async form=>{
    setSubmitting(true);
    await supabase.from("requests").insert([{name:form.name,phone:form.phone,email:form.email,notes:form.notes,years:form.years,models:form.models,motors:form.motors,batteries:form.batteries,wheels:form.wheels,colors:form.colors,interiors:form.interiors,upgrades:form.upgrades,features:form.features,max_budget:form.maxBudget,max_mileage:form.maxMileage}]);
    setSubmitting(false);
  };

  return(
    <div style={{minHeight:"100vh",background:"#0f0f0f",color:"#e0e0e0",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet"/>
      <style dangerouslySetInnerHTML={{__html:css}}/>

      {inquiryTarget&&<InquiryModal vehicle={inquiryTarget.vehicle} retailPrice={inquiryTarget.retail} priceRange={settings.priceRange}
        onClose={()=>setInquiryTarget(null)} onSubmit={submitInquiry} submitting={submitting}/>}

      {/* ADMIN */}
      {mode==="admin"&&!adminLoggedIn&&<AdminLogin onLogin={()=>{setAdminLoggedIn(true);loadAdmin();}}/>}
      {mode==="admin"&&adminLoggedIn&&<AdminDashboard
        inquiries={adminInquiries} requests={adminRequests}
        settings={settings} onSettingsChange={setSettings}
        vehicles={vehicles} vehicleColumns={vehicleColumns} onUpload={handleUpload}
        onDeleteInquiry={async(id,i)=>{if(id)await supabase.from("inquiries").delete().eq("id",id);setAdminInquiries(p=>p.filter((_,j)=>j!==i));}}
        onDeleteRequest={async(id,i)=>{if(id)await supabase.from("requests").delete().eq("id",id);setAdminRequests(p=>p.filter((_,j)=>j!==i));}}
      />}

      {/* CUSTOMER */}
      {mode==="customer"&&(
        <>
          <div style={{padding:"24px 28px 18px",borderBottom:"1px solid #1e1e1e",background:"linear-gradient(180deg,#141414,#0f0f0f)"}}>
            <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",color:"#4a6741",textTransform:"uppercase",fontFamily:"'Space Mono',monospace",marginBottom:3}}>Big Wave Auto</div>
                <h1 style={{fontSize:24,fontWeight:300,margin:0,color:"#f0f0f0"}}>Available <span style={{fontWeight:700}}>Rivians</span></h1>
              </div>
              {vehicles.length>0&&<span style={{background:"#1a2518",color:"#6b9c5a",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{processed.length} vehicle{processed.length!==1?"s":""}</span>}
            </div>
          </div>

          <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 28px"}}>
            {vehicles.length===0?(
              <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:40,textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:14,color:"#888",marginBottom:14}}>Upload inventory to browse available vehicles</div>
                <label style={{display:"inline-block",padding:"12px 32px",background:"linear-gradient(135deg,#1a2538,#162030)",border:"1.5px solid #2a3a4a",borderRadius:10,color:"#7a9cb5",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                  Upload CSV<input type="file" accept=".csv,.tsv,.txt" onChange={handleUpload} style={{display:"none"}}/>
                </label>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:24}}>
                {/* SIDEBAR — filters only, no pricing */}
                <div style={{background:"#161616",border:"1px solid #222",borderRadius:10,padding:18,position:"sticky",top:16,alignSelf:"start"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#aaa",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.08em"}}>Find Your Rivian</div>
                  <FilterPills label="Year" options={filterOptions.years} selected={filters.years} onChange={v=>setFilters({...filters,years:v})} counts={filterCounts.years}/>
                  <FilterPills label="Model" options={filterOptions.models} selected={filters.models} onChange={v=>setFilters({...filters,models:v})} counts={filterCounts.models}/>
                  <FilterPills label="Trim" options={filterOptions.trims} selected={filters.trims} onChange={v=>setFilters({...filters,trims:v})} counts={filterCounts.trims}/>
                  <FilterPills label="Color" options={filterOptions.colors} selected={filters.colors} onChange={v=>setFilters({...filters,colors:v})} counts={filterCounts.colors}/>

                  <div style={{marginBottom:14}}>
                    <label style={lb}>Max Budget</label>
                    <span style={{fontSize:13,fontWeight:600,color:"#6b9c5a",fontFamily:"'Space Mono',monospace",display:"block",marginBottom:6}}>
                      {maxPrice>=120000?"Any":"$"+maxPrice.toLocaleString()}
                    </span>
                    <input type="range" min={30000} max={120000} step={1000} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}/>
                  </div>

                  <div style={{marginBottom:14}}>
                    <label style={lb}>Sort By</label>
                    <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:"100%",padding:"8px 10px",background:"#0f0f0f",border:"1.5px solid #222",borderRadius:6,color:"#ccc",fontSize:12,outline:"none"}}>
                      <option value="retail_asc">Price: Low → High</option>
                      <option value="retail_desc">Price: High → Low</option>
                      <option value="miles_asc">Mileage: Low → High</option>
                    </select>
                  </div>

                  {(filters.years.length||filters.models.length||filters.trims.length||filters.colors.length)?
                    <button onClick={()=>setFilters({years:[],models:[],trims:[],colors:[]})} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid #333",borderRadius:6,color:"#777",fontSize:11,cursor:"pointer"}}>Clear All Filters</button>
                  :null}
                </div>

                {/* VEHICLE LIST — clean customer view */}
                <div>
                  {processed.length===0?(
                    <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:48,textAlign:"center"}}>
                      <div style={{fontSize:32,marginBottom:12}}>🔍</div>
                      <div style={{fontSize:15,color:"#888"}}>No vehicles match your filters</div>
                      <div style={{fontSize:13,color:"#666",marginTop:6}}>Try adjusting your filters, or:</div>
                      <button onClick={()=>setShowNotify(true)} style={{marginTop:16,padding:"12px 28px",background:"linear-gradient(135deg,#4a6741,#3a5431)",border:"none",borderRadius:10,color:"#e0eadc",fontSize:14,fontWeight:700,cursor:"pointer"}}>Notify Me When One Comes In</button>
                    </div>
                  ):(
                    <>
                      {processed.map((item,i)=>(
                        <CustomerVehicleCard key={item.vehicle.Vin||i} vehicle={item.vehicle}
                          retail={item.costs.retail} priceRange={settings.priceRange} index={i}
                          onInquire={(v,r)=>setInquiryTarget({vehicle:v,retail:r})}/>
                      ))}
                      <div style={{background:"#161616",border:"1px solid #222",borderRadius:12,padding:"28px 24px",textAlign:"center",marginTop:16}}>
                        <div style={{fontSize:15,color:"#999",marginBottom:12}}>Don't see exactly what you're looking for?</div>
                        <button onClick={()=>setShowNotify(true)} style={{padding:"12px 32px",background:"linear-gradient(135deg,#4a6741,#3a5431)",border:"none",borderRadius:10,color:"#e0eadc",fontSize:14,fontWeight:700,cursor:"pointer"}}>Notify Me When My Spec Comes In</button>
                      </div>
                    </>
                  )}
                  {showNotify&&(
                    <div style={{marginTop:20}}>
                      <NotifyForm initialFilters={filters} onSubmit={submitNotify} submitting={submitting}/>
                      <button onClick={()=>setShowNotify(false)} style={{display:"block",margin:"12px auto 0",padding:"8px 20px",background:"transparent",border:"1px solid #333",borderRadius:6,color:"#666",fontSize:11,cursor:"pointer"}}>Hide Form</button>
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

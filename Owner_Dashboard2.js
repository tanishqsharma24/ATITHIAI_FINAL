
const {useState, useEffect, useRef, useMemo} = React;

/* ---------------- icons (thin-line, currentColor) ---------------- */
const Icon = ({ path, size=17, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {path}
  </svg>
);
const I = {
  home: p => <Icon {...p} path={<path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>} />,
  bolt: p => <Icon {...p} path={<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>} />,
  calendar: p => <Icon {...p} path={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>} />,
  bed: p => <Icon {...p} path={<><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18M3 12V6M7 10h4a2 2 0 0 0 2-2 2 2 0 0 0-2-2H7v4Z"/></>} />,
  users: p => <Icon {...p} path={<><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15.5 13.2a5.4 5.4 0 0 1 6 5.6"/></>} />,
  brush: p => <Icon {...p} path={<><path d="M4 20c1-3 3-5 5-6l8-8 3 3-8 8c-1 2-3 4-6 5-1-1-2-1-2-2Z"/></>} />,
  wrench: p => <Icon {...p} path={<path d="M14.7 6.3a4 4 0 0 0-5.5 5.1L4 16.6V20h3.4l5.2-5.2a4 4 0 0 0 5.1-5.5l-3 3-2-2 3-3Z"/>} />,
  clipboard: p => <Icon {...p} path={<><rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/></>} />,
  folder: p => <Icon {...p} path={<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z"/>} />,
  card: p => <Icon {...p} path={<><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/></>} />,
  star: p => <Icon {...p} path={<path d="M12 3.5 14.7 9l6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9 2.7-5.5Z"/>} />,
  bar: p => <Icon {...p} path={<><path d="M5 20V10M12 20V4M19 20v-7"/></>} />,
  settings: p => <Icon {...p} path={<><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.4 8a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.6.7 1 1.4 1.1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"/></>} />,
  sparkles: p => <Icon {...p} path={<><path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.5 5.5l3 3M15.5 15.5l3 3M18.5 5.5l-3 3M8.5 15.5l-3 3"/></>} />,
  bell: p => <Icon {...p} path={<><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z"/><path d="M10 19a2 2 0 0 0 4 0"/></>} />,
  search: p => <Icon {...p} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>} />,
  mappin: p => <Icon {...p} path={<><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.2"/></>} />,
  alert: p => <Icon {...p} path={<><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></>} />,
  refresh: p => <Icon {...p} path={<><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></>} />,
  cloud: p => <Icon {...p} path={<path d="M7 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 9.5 4 4 0 0 1 17 18H7Z"/>} />,
  wifi: p => <Icon {...p} path={<><path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5.5 12.3a11 11 0 0 1 13 0"/><path d="M9 16.2a5.8 5.8 0 0 1 6 0"/><path d="M12 20h.01"/></>} />,
  x: p => <Icon {...p} path={<path d="M6 6l12 12M18 6 6 18"/>} />,
  chevronRight: p => <Icon {...p} path={<path d="m9 6 6 6-6 6"/>} />,
  menu: p => <Icon {...p} path={<path d="M4 7h16M4 12h16M4 17h16"/>} />,
  arrowUp: p => <Icon {...p} path={<path d="M12 19V5M5 12l7-7 7 7"/>} />,
  arrowDown: p => <Icon {...p} path={<path d="M12 5v14M19 12l-7 7-7-7"/>} />,
  sun: p => <Icon {...p} path={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></>} />,
  mic: p => <Icon {...p} path={<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></>} />,
  moon: p => <Icon {...p} path={<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>} />,
};

/* ---------------- mock data ---------------- */
const DATA = {
  property: { name: "Atithi Heritage Homestay", location: "Udaipur, Rajasthan" },
  kpis: [
    { id:"checkins", label:"Today's Check-ins", value:"4", sub:"+2 from yesterday", up:true, link:"View arrivals" },
    { id:"checkouts", label:"Today's Check-outs", value:"3", sub:"1 pending", up:false, link:"View departures" },
    { id:"occupancy", label:"Occupancy", value:"72%", sub:"18 / 25 rooms occupied", up:null, link:"View rooms" },
    { id:"payments", label:"Pending Payments", value:"₹18,500", sub:"3 transactions pending", up:null, link:"View payments" },
  ],
  briefing: {
    text: "You have 4 arrivals today. Room 204 requires maintenance before 2 PM. One compliance document is due for renewal in 21 days.",
    priorities: [
      { level:"high", text:"Room 204 maintenance before 2 PM" },
      { level:"mid", text:"Fire Safety Certificate renewal — 28 days" },
      { level:"low", text:"4 guest arrivals prepared and confirmed" },
    ],
  },
  operations: [
    { label:"Check-ins", value:4 }, { label:"Check-outs", value:3 },
    { label:"Housekeeping tasks", value:5 }, { label:"Maintenance tickets", value:2 },
    { label:"Compliance deadlines", value:1 },
  ],
  rooms: [
    { num:"101", status:"ready" }, { num:"102", status:"cleaning" },
    { num:"103", status:"maintenance", issue:"AC not working", ticket:"#M1023", assigned:"Raj", priority:"HIGH" },
    { num:"104", status:"occupied" }, { num:"105", status:"vacant" },
  ],
  compliance: { compliant:14, attention:3, overdue:1,
    deadlines:[ {name:"Tourism Registration", days:21}, {name:"Fire Safety Certificate", days:28}, {name:"Annual Inspection", days:45} ] },
  complianceAlert: { title:"Fire Safety Certificate", days:28, action:"Renew certificate and upload the updated document." },
  maintenance: { open:5, high:2, inProgress:3, resolved:18,
    tickets:[
      { id:1, room:"204", issue:"AC Problem", priority:"HIGH", time:"15 min ago", status:"Open" },
      { id:2, room:"102", issue:"Water Leakage", priority:"CRITICAL", time:"42 min ago", status:"Open" },
    ] },
  guestIssues: { open:4, high:2, resolvedToday:3,
    recent:[
      { room:"204", issue:"AC problem", priority:"High" },
      { room:"102", issue:"Delayed check-in", priority:"Medium" },
      { room:"105", issue:"Bathroom cleanliness", priority:"Low" },
    ] },
  housekeeping: { completion:68,
    rooms:[ {num:"101", status:"Ready", done:true}, {num:"102", status:"Cleaning", done:false},
      {num:"103", status:"Deep Cleaning", done:false}, {num:"104", status:"Ready", done:true}, {num:"105", status:"Cleaning", done:false} ] },
  arrivals: [
    { guest:"Guest Sharma", room:"204", time:"12:30 PM", status:"Confirmed" },
    { guest:"Guest Singh", room:"101", time:"1:00 PM", status:"Confirmed" },
    { guest:"Guest Patel", room:"105", time:"2:00 PM", status:"Pending" },
    { guest:"Guest Kumar", room:"102", time:"4:30 PM", status:"Confirmed" },
  ],
  departures: [
    { room:"101", guest:"Guest Sharma", time:"11:00 AM", paid:true },
    { room:"104", guest:"Guest Singh", time:"11:30 AM", paid:false },
    { room:"105", guest:"Guest Patel", time:"12:00 PM", paid:true },
  ],
  revenue: { today:24500, paid:17300, pending:7200,
    methods:[ {name:"UPI", value:10500}, {name:"Cash", value:4800}, {name:"Card", value:6200}, {name:"Online", value:3000} ] },
  serviceQuality: { rating:4.3, complaints:12, resolved:9, avgResponse:"18 min",
    insights:[ {text:"Bathroom cleanliness", trend:"up", pct:24}, {text:"Delayed check-in", trend:"up", pct:15}, {text:"Staff communication", trend:"down", pct:8} ] },
  reviewIntel: { positive:82, neutral:11, negative:7,
    categories:["Cleanliness","Check-in","Staff","Food","Room","Location","Maintenance","Value"],
    sources:["Google Reviews","OTA Reviews","In-app Feedback","Manual Complaints"] },
  performance: { occupancy:72, adr:3250, revenue:24500, cancellation:4.2, rating:4.3 },
  notifications: [
    { type:"warning", title:"Compliance deadline", sub:"Fire certificate expires in 28 days." },
    { type:"error", title:"Maintenance issue", sub:"Room 204 AC problem." },
    { type:"warning", title:"Guest complaint", sub:"Bathroom cleanliness complaint." },
    { type:"success", title:"New booking", sub:"New reservation for Room 105." },
    { type:"success", title:"Payment received", sub:"₹4,500 received from Guest Sharma." },
  ],
  sync: { local:4, uploaded:12, pending:2, conflicts:1, last:"2 minutes ago" },
};

const AI_ANSWERS = {
  "What needs my attention today?": "3 priorities need your attention:\n\n1. Room 204 AC maintenance before 2 PM.\n2. Fire Safety Certificate renewal.\n3. Guest arrival preparation for 4 bookings.",
  "Which documents expire this month?": "1 document expires this month:\n\nFire Safety Certificate — expires in 28 days. I'd recommend starting renewal this week to avoid a last-minute rush.",
  "Show tomorrow's check-ins": "Tomorrow you have 3 confirmed check-ins so far: Room 101 at 12:00 PM, Room 106 at 2:30 PM, and Room 110 at 5:00 PM. Housekeeping has been notified.",
  "Why is Room 103 blocked?": "Room 103 is blocked for maintenance. The AC unit isn't working — ticket #M1023, assigned to Raj, marked HIGH priority.",
  "Analyse last week's complaints": "Last week: 12 complaints, 9 resolved. Bathroom cleanliness rose 24% — worth a housekeeping review. Staff communication complaints fell 8%, which is a good trend.",
};

/* ---------------- small building blocks ---------------- */
const Card = ({ children, className="", style, onClick }) => (
  <div className={`card fade-up ${className}`} style={style} onClick={onClick}>{children}</div>
);

const KPICard = ({ k, onOpen, idx }) => (
  <Card className="kpi-card" style={{animationDelay:`${idx*60}ms`}} onClick={()=>onOpen(k.id)}>
    <div className="card-title">{k.label}</div>
    <div className="kpi-value">{k.value}</div>
    <div className={`kpi-sub ${k.up? 'up':''}`}>{k.sub}</div>
    <div className="kpi-foot">{k.link} <I.chevronRight size={13} /></div>
  </Card>
);

const roomDotClass = s => ({ready:"c-ready", cleaning:"c-cleaning", maintenance:"c-maintenance", occupied:"c-occupied", vacant:"c-vacant"}[s]);
const roomLabel = s => ({ready:"Ready", cleaning:"Cleaning", maintenance:"Maintenance", occupied:"Occupied", vacant:"Vacant"}[s]);

/* ---------------- Sidebar ---------------- */
const NAV = [
  { section:null, items:[ {icon:"home", label:"Dashboard", id:"dashboard"} ] },
  { section:"Operations", items:[ {icon:"bolt", label:"Today"}, {icon:"bolt", label:"Tasks"}, {icon:"bolt", label:"Activity"} ] },
  { section:"Bookings", items:[ {icon:"calendar", label:"Calendar"}, {icon:"calendar", label:"Reservations"}, {icon:"calendar", label:"Availability"}, {icon:"calendar", label:"Public Booking Portal", id:"booking_portal"} ] },
  { section:"Rooms", items:[ {icon:"bed", label:"Room Status"}, {icon:"bed", label:"Room Details"} ] },
  { section:"Guests", items:[ {icon:"users", label:"All Guests"}, {icon:"users", label:"Check-ins"}, {icon:"users", label:"Check-outs"}, {icon:"users", label:"Foreign Guests"} ] },
  { section:null, items:[ {icon:"brush", label:"Housekeeping"} ] },
  { section:null, items:[ {icon:"wrench", label:"Maintenance"} ] },
  { section:"Compliance", items:[ {icon:"clipboard", label:"Overview"}, {icon:"clipboard", label:"Requirements"}, {icon:"clipboard", label:"Calendar"}, {icon:"clipboard", label:"Inspections"} ] },
  { section:null, items:[ {icon:"folder", label:"Documents"}, {icon:"card", label:"Payments"} ] },
  { section:"Service Quality", items:[ {icon:"star", label:"Reviews"}, {icon:"star", label:"Complaints"}, {icon:"star", label:"AI Insights"} ] },
  { section:null, items:[ {icon:"bar", label:"Analytics"}, {icon:"users", label:"Staff"}, {icon:"bell", label:"Notifications"}, {icon:"sparkles", label:"ATITHIAI Agent", id:"ask"}, {icon:"settings", label:"Settings"} ] },
];

function Sidebar({ open, onClose, active, setActive, onAsk }) {
  return (
    <>
      <div className={`sidebar-scrim ${open?'open':''}`} onClick={onClose}></div>
      <aside className={`sidebar ${open?'open':''}`}>
        <div className="brand">
          <div className="brand-name">AtithiAI</div>
          <div className="brand-sub">AI-powered hospitality operations</div>
        </div>
        {NAV.map((group, gi) => (
          <div className="nav-group" key={gi}>
            {group.section && <div className="nav-group-label">{group.section}</div>}
            {group.items.map((it, ii) => {
              const Icon = I[it.icon];
              const isActive = it.id === active;
              return (
                <div key={ii}
                  className={`nav-item ${isActive ? 'active':''}`}
                  onClick={() => {
                    if (it.id === 'booking_portal') { window.location.href = 'booking.html'; return; }
                    if (it.id === 'ask') { onAsk(); }
                    else if (it.id) { setActive(it.id); onClose(); }
                  }}>
                  <Icon size={16} />
                  <span>{it.label}</span>
                </div>
              );
            })}
          </div>
        ))}
        <div className="sidebar-foot">
          <div className="status-chip"><span className="status-dot" style={{background:'#10B981'}}></span> All systems normal</div>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Header + Search ---------------- */
const SEARCH_INDEX = [
  { group:"Rooms", label:"Room 204", meta:"Maintenance required" },
  { group:"Rooms", label:"Room 103", meta:"AC issue — ticket #M1023" },
  { group:"Guests", label:"Raj Sharma", meta:"Booking #1021" },
  { group:"Guests", label:"Guest Singh", meta:"Room 101 · Confirmed" },
  { group:"Documents", label:"Fire Safety Certificate", meta:"Expires in 28 days" },
  { group:"Documents", label:"Tourism Registration", meta:"Due in 21 days" },
  { group:"Maintenance", label:"Ticket #M1023", meta:"Room 103 · High priority" },
  { group:"Bookings", label:"Booking #1021", meta:"Guest Sharma · Room 204" },
];

function CommandPalette({ onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(()=>{ inputRef.current && inputRef.current.focus(); }, []);
  useEffect(()=>{
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const results = SEARCH_INDEX.filter(r => (r.label+" "+r.meta).toLowerCase().includes(q.toLowerCase()));
  const grouped = results.reduce((acc,r)=>{ (acc[r.group]=acc[r.group]||[]).push(r); return acc; }, {});
  return (
    <div className="overlay-bg" onClick={onClose}>
      <div className="cmdk" onClick={e=>e.stopPropagation()}>
        <div className="cmdk-input-row">
          <I.search size={16} style={{color:'var(--text-40)'}} />
          <input ref={inputRef} placeholder="Search rooms, guests, bookings, documents..." value={q} onChange={e=>setQ(e.target.value)} />
          <span className="search-kbd">Esc</span>
        </div>
        <div className="cmdk-body">
          {Object.keys(grouped).length === 0 && <div style={{padding:'20px 14px', color:'var(--text-40)', fontSize:13}}>No results found.</div>}
          {Object.entries(grouped).map(([g, items]) => (
            <div key={g}>
              <div className="cmdk-group-label">{g}</div>
              {items.map((it,i)=>(
                <div className="cmdk-result" key={i}>
                  <span>{it.label}</span>
                  <span className="meta">{it.meta}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AskAtithiAI({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bodyRef = useRef(null);
  useEffect(()=>{ if(bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages]);
  const ask = (q) => {
    if(!q.trim()) return;
    let answer = "";
    let tools = [];
    if (window.AtithiAiAgent) {
      const res = window.AtithiAiAgent.process(q, 'owner');
      answer = res.responseText;
      tools = res.executedTools || [];
    } else {
      answer = AI_ANSWERS[q] || "Here's a quick take based on today's operations data — arrivals, compliance and maintenance all look on track, with the items already flagged in your Daily Briefing needing the closest attention.";
    }
    setMessages(m => [...m, {role:"user", text:q}, {role:"ai", text:answer, tools}]);
    setInput("");
  };
  const [listening, setListening] = useState(false);
  const handleVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setListening(true);
      setTimeout(() => {
        setInput("Check inventory stock and alert on low threshold items");
        setListening(false);
      }, 700);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-IN';
      rec.onstart = () => setListening(true);
      rec.onresult = e => {
        let text = '';
        for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
        if (text) setInput(text);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      rec.start();
    } catch(err) {
      setListening(false);
    }
  };

  return (
    <div className="overlay-bg" onClick={onClose}>
      <div className="ai-modal" onClick={e=>e.stopPropagation()} style={{maxWidth:660}}>
        <div className="ai-modal-head">
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:34, height:34, borderRadius:10, background:'linear-gradient(233deg, #00B1C5 1%, #EE6481 94%)', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <I.sparkles size={18} color="#fff"/>
            </div>
            <div>
              <div className="ai-modal-title">ATITHIAI Agent <span style={{fontSize:11, background:'rgba(0,177,197,0.15)', color:'#00e0fa', padding:'2px 7px', borderRadius:10, border:'1px solid rgba(0,177,197,0.3)', marginLeft:6}}>Claude Sonnet 5</span></div>
              <div className="ai-modal-sub">Operations & Travel Intelligence · 18 Data Table Tools & Slack Active</div>
            </div>
          </div>
          <button className="drawer-close" style={{position:'static'}} onClick={onClose}><I.x size={15}/></button>
        </div>
        <div className="ai-modal-body" ref={bodyRef}>
          {messages.length === 0 && (
            <div className="ai-suggest">
              {Object.keys(AI_ANSWERS).map((q,i)=>(
                <button key={i} onClick={()=>ask(q)}>→ {q}</button>
              ))}
              <button onClick={()=>ask("Check inventory status and threshold alerts")}>→ Check inventory status and threshold alerts</button>
              <button onClick={()=>ask("Show active tasks and overdue SLA matrix")}>→ Show active tasks and overdue SLA matrix</button>
            </div>
          )}
          {messages.map((m,i)=>(
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.tools && m.tools.length > 0 && (
                <div style={{marginBottom:6, padding:'4px 8px', background:'rgba(0,0,0,0.3)', borderRadius:6, fontSize:11, color:'#00e0fa'}}>
                  ⚡ <strong>Tools Executed:</strong> {m.tools.map(t=>t.name).join(', ')}
                </div>
              )}
              {m.text}
            </div>
          ))}
        </div>
        <div className="ai-modal-input">
          <input placeholder={listening ? "Listening... speak now" : "Ask operations query, inspect tasks, or check inventory..."} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') ask(input); }} />
          <button type="button" className={`icon-btn ${listening ? 'listening-mic' : ''}`} title="Tap to speak (Voice typing)" onClick={handleVoice} style={{background:'rgba(255,255,255,0.06)', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)'}}>
            <I.mic size={15} color={listening ? '#ef4444' : 'currentColor'} />
          </button>
          <button className="btn primary" onClick={()=>ask(input)}>Send</button>
        </div>
      </div>
    </div>
  );
}

function Header({ onMenu, onSearch, onAsk, onBell, isOnline }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const activeUser = (() => {
    try {
      const raw = localStorage.getItem('atithi_user');
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  })();
  const ownerName = activeUser ? activeUser.name : "Vikram Rathore";
  const initial = ownerName ? ownerName.charAt(0).toUpperCase() : "V";

  const handleLogout = () => {
    localStorage.removeItem('atithi_token');
    localStorage.removeItem('atithi_user');
    window.location.href = 'auth.html?role=owner';
  };

  return (
    <header className="header">
      <button className="icon-btn mobile-nav-btn" onClick={onMenu}><I.menu size={17}/></button>
      <div className="search-bar" onClick={onSearch}>
        <I.search size={15} />
        <span>Search rooms, guests, bookings, documents...</span>
        <span className="search-kbd">⌘K</span>
      </div>
      <div className="header-right">
        <a href="booking.html" style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.42rem 0.85rem',
          borderRadius: '999px',
          background: 'rgba(0, 177, 197, 0.15)',
          border: '1px solid rgba(0, 177, 197, 0.45)',
          color: '#00e5ff',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          <span>🏨</span>
          <span>Booking Portal</span>
        </a>
        <div className="status-chip">
          <span className="status-dot" style={{background: isOnline? '#10B981':'#F59E0B'}}></span>
          {isOnline ? 'Online' : 'Offline'}
        </div>
        <button className="ask-ai-btn" onClick={onAsk}><I.sparkles size={15}/> ATITHIAI Agent</button>
        <button className="icon-btn" onClick={onBell}><I.bell size={16}/><span className="dot-badge"></span></button>
        <div style={{position:'relative'}}>
          <button className="profile-btn" onClick={()=>setProfileOpen(o=>!o)} title="Account Details">
            <div className="avatar">{initial}</div>
            <div className="profile-meta">
              <div className="name">{ownerName}</div>
              <div className="role">Property Owner</div>
            </div>
          </button>
          {profileOpen && (
            <div className="card" style={{position:'absolute', right:0, top:'110%', width:200, padding:8, zIndex:30, boxShadow:'0 10px 30px rgba(0,0,0,0.5)'}}>
              <div style={{padding:'8px 12px', fontSize:12, color:'var(--text-40)', borderBottom:'1px solid var(--border)'}}>
                Signed in as <strong>{ownerName}</strong>
              </div>
              <div className="nav-item" style={{fontSize:13, marginTop:4}} onClick={()=>setProfileOpen(false)}>My Profile</div>
              <div className="nav-item" style={{fontSize:13}} onClick={()=>setProfileOpen(false)}>Property Settings</div>
              <div className="nav-item" style={{fontSize:13, color:'#EE6481', fontWeight:600}} onClick={handleLogout}>
                <I.x size={14} style={{marginRight:6}} /> Sign Out
              </div>
            </div>
          )}
        </div>
        <button
          className="logout-nav-btn"
          title="Sign Out"
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.85rem',
            background: 'rgba(238, 100, 129, 0.12)',
            border: '1px solid rgba(238, 100, 129, 0.3)',
            borderRadius: '999px',
            color: '#EE6481',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <I.x size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

/* ---------------- sections ---------------- */
function AIBriefing({ onAsk }) {
  return (
    <Card className="ai-card section-gap">
      <div className="ai-head"><I.sparkles size={16}/> AI DAILY BRIEFING</div>
      <div className="ai-sub">Good morning! Here's what needs your attention today.</div>
      <div className="ai-text">{DATA.briefing.text}</div>
      <div className="priority-list">
        {DATA.briefing.priorities.map((p,i)=>(
          <div className="priority-item" key={i}><span className={`priority-dot ${p.level}`}></span>{p.text}</div>
        ))}
      </div>
      <div className="ai-actions">
        <button className="btn primary">View All Priorities</button>
        <button className="btn" onClick={onAsk}>ATITHIAI Agent</button>
      </div>
    </Card>
  );
}

function OperationsCard() {
  return (
    <Card>
      <div className="card-head"><span className="card-title">Today's Operations</span></div>
      {DATA.operations.map((o,i)=>(
        <div className="row" key={i}><span className="label">{o.label}</span><span className="value">{o.value}</span></div>
      ))}
      <div className="ai-actions" style={{marginTop:14}}><button className="btn" style={{width:'100%', textAlign:'center'}}>View Operations</button></div>
    </Card>
  );
}

function RoomStatusCard({ onOpenRoom }) {
  return (
    <Card>
      <div className="card-head"><span className="card-title">Room Status</span></div>
      <div className="room-grid">
        {DATA.rooms.map((r,i)=>(
          <button className="room-tile" key={i} onClick={()=>onOpenRoom(r)}>
            <div className="room-num">{r.num}</div>
            <div className="room-status-label"><span className={`dot-sm ${roomDotClass(r.status)}`}></span>{roomLabel(r.status)}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ComplianceHealthCard() {
  const c = DATA.compliance;
  return (
    <Card>
      <div className="card-head"><span className="card-title">Compliance Health</span></div>
      <div className="stat-trio">
        <div className="stat-pill"><div className="num" style={{color:'#6ee7b7'}}>{c.compliant}</div><div className="lbl">Compliant</div></div>
        <div className="stat-pill"><div className="num" style={{color:'#ffd28a'}}>{c.attention}</div><div className="lbl">Attention Needed</div></div>
        <div className="stat-pill"><div className="num" style={{color:'#fca5a5'}}>{c.overdue}</div><div className="lbl">Overdue</div></div>
      </div>
      <div style={{marginTop:18}}>
        <div className="card-title" style={{marginBottom:8}}>Upcoming Deadlines</div>
        {c.deadlines.map((d,i)=>(
          <div className="row" key={i}><span className="label">{d.name}</span><span className="value">{d.days} days</span></div>
        ))}
      </div>
      <div className="ai-actions" style={{marginTop:14}}><button className="btn" style={{width:'100%', textAlign:'center'}}>Open Compliance Center</button></div>
    </Card>
  );
}

function ComplianceAlertCard({ onRenew }) {
  const a = DATA.complianceAlert;
  return (
    <Card className="alert-card">
      <div className="alert-head"><I.alert size={16}/> COMPLIANCE ATTENTION</div>
      <div style={{marginTop:12, fontSize:15, fontWeight:500}}>{a.title}</div>
      <div style={{color:'var(--text-60)', marginTop:4, fontSize:13}}>Expires in {a.days} days.</div>
      <div style={{color:'var(--text-40)', marginTop:10, fontSize:12.5}}>Recommended action: {a.action}</div>
      <button className="btn warn" style={{marginTop:16}} onClick={onRenew}>Renew / Update</button>
    </Card>
  );
}

function MaintenanceCard({ tickets, setTickets }) {
  const m = DATA.maintenance;
  const advance = (id) => {
    setTickets(ts => ts.map(t => t.id===id ? {...t, status: t.status==='Open' ? 'In Progress' : t.status==='In Progress' ? 'Resolved' : 'Verified'} : t));
  };
  return (
    <Card>
      <div className="card-head"><span className="card-title">Maintenance</span></div>
      <div className="stat-trio">
        <div className="stat-pill"><div className="num">{m.open}</div><div className="lbl">Open</div></div>
        <div className="stat-pill"><div className="num" style={{color:'#fca5a5'}}>{m.high}</div><div className="lbl">High Priority</div></div>
        <div className="stat-pill"><div className="num">{m.inProgress}</div><div className="lbl">In Progress</div></div>
      </div>
      <div style={{marginTop:18}}>
        {tickets.map(t=>(
          <div key={t.id} style={{padding:'12px 0', borderBottom:'1px solid var(--border-soft)'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:13.5}}>
              <span style={{fontWeight:500}}>Room {t.room} — {t.issue}</span>
              <span style={{color: t.priority==='CRITICAL' ? '#fca5a5':'#ffd28a', fontSize:11}}>{t.priority}</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:6, alignItems:'center'}}>
              <span style={{color:'var(--text-40)', fontSize:11.5}}>{t.time} · {t.status}</span>
              <button className="table-action" onClick={()=>advance(t.id)}>
                {t.status==='Open'?'Start': t.status==='In Progress'?'Resolve': t.status==='Resolved'?'Verify':'Done'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GuestIssuesCard() {
  const g = DATA.guestIssues;
  return (
    <Card>
      <div className="card-head"><span className="card-title">Guest Issues</span></div>
      <div className="stat-trio">
        <div className="stat-pill"><div className="num">{g.open}</div><div className="lbl">Open</div></div>
        <div className="stat-pill"><div className="num" style={{color:'#fca5a5'}}>{g.high}</div><div className="lbl">High Priority</div></div>
        <div className="stat-pill"><div className="num" style={{color:'#6ee7b7'}}>{g.resolvedToday}</div><div className="lbl">Resolved Today</div></div>
      </div>
      <div style={{marginTop:16}}>
        {g.recent.map((r,i)=>(
          <div className="row" key={i}><span className="label">Room {r.room} — {r.issue}</span><span className="value">{r.priority}</span></div>
        ))}
      </div>
      <div className="ai-actions" style={{marginTop:14}}><button className="btn" style={{width:'100%', textAlign:'center'}}>View All Issues</button></div>
    </Card>
  );
}

function HousekeepingCard() {
  const h = DATA.housekeeping;
  return (
    <Card>
      <div className="card-head"><span className="card-title">Housekeeping</span></div>
      <div style={{color:'var(--text-60)', fontSize:13}}>5 rooms require attention</div>
      <div style={{marginTop:14}}>
        {h.rooms.map((r,i)=>(
          <div className="row" key={i}><span className="label">{r.num} {r.done && '✓'}</span><span className="value">{r.status}</span></div>
        ))}
      </div>
      <div style={{marginTop:14}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-40)'}}><span>Completion</span><span>{h.completion}%</span></div>
        <div className="progress-track"><div className="progress-fill" style={{width:h.completion+'%'}}></div></div>
      </div>
      <div className="ai-actions" style={{marginTop:14}}><button className="btn" style={{width:'100%', textAlign:'center'}}>View Housekeeping</button></div>
    </Card>
  );
}

function ArrivalsTable({ arrivals, setArrivals }) {
  const checkin = (i) => setArrivals(a => a.map((row,idx)=> idx===i ? {...row, status:'Checked-in'} : row));
  return (
    <Card>
      <div className="card-head"><span className="card-title">Today's Arrivals</span></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Guest</th><th>Room</th><th>Arrival</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {arrivals.map((a,i)=>(
              <tr key={i}>
                <td>{a.guest}</td><td>{a.room}</td><td>{a.time}</td>
                <td><span className={`badge ${a.status==='Confirmed'?'confirmed': a.status==='Pending'?'pending':'confirmed'}`}>{a.status}</span></td>
                <td>
                  <button className="table-action">View</button>
                  {a.status !== 'Checked-in' && <button className="table-action" style={{background:'var(--accent)', color:'#fff', border:'none'}} onClick={()=>checkin(i)}>Check-in</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DeparturesCard() {
  return (
    <Card>
      <div className="card-head"><span className="card-title">Today's Check-outs</span></div>
      {DATA.departures.map((d,i)=>(
        <div key={i} style={{padding:'10px 0', borderBottom: i<DATA.departures.length-1 ? '1px solid var(--border-soft)':'none', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontWeight:500, fontSize:13.5}}>Room {d.room} — {d.guest}</div>
            <div style={{color:'var(--text-40)', fontSize:12}}>{d.time}</div>
          </div>
          <span className={`badge ${d.paid?'paid':'due'}`}>{d.paid ? '✓ Paid' : '⚠ Pending'}</span>
        </div>
      ))}
    </Card>
  );
}

function RevenueCard() {
  const r = DATA.revenue;
  const max = Math.max(...r.methods.map(m=>m.value));
  return (
    <Card>
      <div className="card-head"><span className="card-title">Revenue Today</span></div>
      <div className="kpi-value" style={{fontSize:30}}>₹{r.today.toLocaleString('en-IN')}</div>
      <div style={{display:'flex', gap:18, marginTop:10, fontSize:12.5}}>
        <span style={{color:'#6ee7b7'}}>Paid ₹{r.paid.toLocaleString('en-IN')}</span>
        <span style={{color:'#ffd28a'}}>Pending ₹{r.pending.toLocaleString('en-IN')}</span>
      </div>
      <div style={{marginTop:18}}>
        {r.methods.map((m,i)=>(
          <div className="method-row" key={i}>
            <span style={{width:56, color:'var(--text-60)'}}>{m.name}</span>
            <div className="method-bar"><div className="method-fill" style={{width:(m.value/max*100)+'%'}}></div></div>
            <span style={{width:70, textAlign:'right'}}>₹{m.value.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ServiceQualityCard() {
  const s = DATA.serviceQuality;
  return (
    <Card>
      <div className="card-head"><span className="card-title">Service Quality</span></div>
      <div style={{display:'flex', gap:26}}>
        <div><div className="kpi-value" style={{fontSize:26}}>⭐ {s.rating}</div><div className="kpi-sub">Guest Rating</div></div>
        <div><div className="kpi-value" style={{fontSize:26}}>{s.complaints}</div><div className="kpi-sub">Complaints</div></div>
        <div><div className="kpi-value" style={{fontSize:26}}>{s.avgResponse}</div><div className="kpi-sub">Avg Response</div></div>
      </div>
      <div style={{marginTop:16}}>
        <div className="card-title" style={{marginBottom:8}}>AI Insights</div>
        {s.insights.map((ins,i)=>(
          <div className="insight-row" key={i}>
            <span style={{color:'var(--text-60)'}}>{ins.text}</span>
            <span className={ins.trend==='up'?'trend-up':'trend-down'}>{ins.trend==='up'?'↑':'↓'} {ins.pct}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReviewIntelCard() {
  const r = DATA.reviewIntel;
  return (
    <Card>
      <div className="card-head"><span className="card-title">Review Intelligence</span></div>
      <div style={{display:'flex', gap:14}}>
        <div className="stat-pill" style={{flex:1}}><div className="num" style={{color:'#6ee7b7'}}>{r.positive}%</div><div className="lbl">Positive</div></div>
        <div className="stat-pill" style={{flex:1}}><div className="num">{r.neutral}%</div><div className="lbl">Neutral</div></div>
        <div className="stat-pill" style={{flex:1}}><div className="num" style={{color:'#fca5a5'}}>{r.negative}%</div><div className="lbl">Negative</div></div>
      </div>
      <div style={{marginTop:16, display:'flex', flexWrap:'wrap', gap:6}}>
        {r.categories.map((c,i)=>(<span key={i} style={{fontSize:11.5, padding:'5px 10px', borderRadius:20, background:'rgba(255,255,255,0.04)', color:'var(--text-60)'}}>{c}</span>))}
      </div>
    </Card>
  );
}

function PerformanceCard() {
  const p = DATA.performance;
  return (
    <Card>
      <div className="card-head"><span className="card-title">Property Performance</span></div>
      <div className="row"><span className="label">Occupancy</span><span className="value">{p.occupancy}%</span></div>
      <div className="row"><span className="label">ADR</span><span className="value">₹{p.adr.toLocaleString('en-IN')}</span></div>
      <div className="row"><span className="label">Revenue</span><span className="value">₹{p.revenue.toLocaleString('en-IN')}</span></div>
      <div className="row"><span className="label">Cancellation</span><span className="value">{p.cancellation}%</span></div>
      <div className="row"><span className="label">Guest Rating</span><span className="value">⭐ {p.rating}</span></div>
      <div className="ai-actions" style={{marginTop:14}}><button className="btn" style={{width:'100%', textAlign:'center'}}>View Full Analytics</button></div>
    </Card>
  );
}

function NotificationsCard() {
  const dotColor = t => ({warning:'#F59E0B', error:'#EF4444', success:'#10B981'}[t]);
  return (
    <Card>
      <div className="card-head"><span className="card-title">Notifications</span></div>
      {DATA.notifications.map((n,i)=>(
        <div className="notif-item" key={i}>
          <span className="notif-dot" style={{background:dotColor(n.type)}}></span>
          <div><div className="notif-title">{n.title}</div><div className="notif-sub">{n.sub}</div></div>
        </div>
      ))}
    </Card>
  );
}

function SyncStatusStrip({ mode, setMode, onOpenSync }) {
  const s = DATA.sync;
  const label = mode==='online' ? 'All changes synced' : mode==='offline' ? `Offline — changes saved locally` : `Syncing ${s.local} changes...`;
  const color = mode==='online' ? '#10B981' : mode==='offline' ? '#F59E0B' : '#0066FF';
  return (
    <div className="sync-strip section-gap">
      {mode==='syncing' ? <I.refresh size={14} style={{color}}/> : mode==='offline' ? <I.cloud size={14} style={{color}}/> : <I.wifi size={14} style={{color}}/>}
      <span style={{color:'#fff'}}>{label}</span>
      <span style={{cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3}} onClick={onOpenSync}>Sync Center</span>
      <div className="dev-toggle">
        <button className={mode==='online'?'active':''} onClick={()=>setMode('online')}>Online</button>
        <button className={mode==='offline'?'active':''} onClick={()=>setMode('offline')}>Offline</button>
        <button className={mode==='syncing'?'active':''} onClick={()=>setMode('syncing')}>Syncing</button>
      </div>
    </div>
  );
}

/* ---------------- drawers/modals ---------------- */
function RoomDrawer({ room, onClose }) {
  if (!room) return null;
  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="drawer">
        <button className="drawer-close" onClick={onClose}><I.x size={15}/></button>
        <div className="card-title">ROOM {room.num}</div>
        <div className="serif" style={{fontSize:26, marginTop:8}}>Room {room.num}</div>
        <div style={{marginTop:20}}>
          <div className="row"><span className="label">Status</span><span className="value" style={{textTransform:'capitalize'}}>{roomLabel(room.status)}</span></div>
          {room.issue && <div className="row"><span className="label">Issue</span><span className="value">{room.issue}</span></div>}
          {room.ticket && <div className="row"><span className="label">Ticket</span><span className="value">{room.ticket}</span></div>}
          {room.assigned && <div className="row"><span className="label">Assigned to</span><span className="value">{room.assigned}</span></div>}
          {room.priority && <div className="row"><span className="label">Priority</span><span className="value" style={{color:'#fca5a5'}}>{room.priority}</span></div>}
        </div>
        {room.ticket && <button className="btn primary" style={{marginTop:22, width:'100%'}}>View Ticket</button>}
      </div>
    </>
  );
}

function SyncCenterModal({ onClose }) {
  const s = DATA.sync;
  return (
    <div className="overlay-bg" onClick={onClose}>
      <div className="cmdk" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div className="cmdk-input-row" style={{justifyContent:'space-between'}}>
          <span style={{fontSize:15, fontWeight:500}}>Sync Status</span>
          <button className="icon-btn" onClick={onClose}><I.x size={14}/></button>
        </div>
        <div style={{padding:'18px 20px'}}>
          <div className="row"><span className="label">Local Changes</span><span className="value">{s.local}</span></div>
          <div className="row"><span className="label">Uploaded</span><span className="value">{s.uploaded}</span></div>
          <div className="row"><span className="label">Pending</span><span className="value">{s.pending}</span></div>
          <div className="row"><span className="label">Conflicts</span><span className="value" style={{color:'#fca5a5'}}>{s.conflicts}</span></div>
          <div className="row"><span className="label">Last successful sync</span><span className="value">{s.last}</span></div>
          <div style={{color:'var(--text-40)', fontSize:12, marginTop:14, lineHeight:1.6}}>
            AtithiAI works fully offline. Changes made without a connection are stored locally and synced automatically once you're back online — nothing is ever lost.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [openRoom, setOpenRoom] = useState(null);
  const [syncMode, setSyncMode] = useState("online");
  const [toast, setToast] = useState(null);
  const [tickets, setTickets] = useState(DATA.maintenance.tickets);
  const [arrivals, setArrivals] = useState(DATA.arrivals);

  useEffect(() => {
    // Lock to dark mode permanently
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handleKpiOpen = (id) => {
    const map = { checkins:'arrivals-section', checkouts:'departures-section', occupancy:'rooms-section', payments:'revenue-section' };
    scrollTo(map[id]);
  };

  const openAgent = () => {
    if (window.AtithiAiAgent) {
      window.AtithiAiAgent.open({ context: 'owner' });
    } else {
      setAskOpen(true);
    }
  };

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} active={active} setActive={setActive} onAsk={openAgent} />

      <div className="main">
        <Header onMenu={()=>setSidebarOpen(true)} onSearch={()=>setSearchOpen(true)} onAsk={openAgent}
          onBell={()=>scrollTo('notifications-section')} isOnline={syncMode!=='offline'} />

        <div className="content">
          <div className="welcome">
            <div>
              <h1 className="serif">Good Morning</h1>
              <p>Here's what's happening at your property today.</p>
            </div>
            <div className="welcome-meta">
              <span>Friday, September 4, 2026</span>
              <span className="loc"><I.mappin size={13}/> {DATA.property.name}, {DATA.property.location}</span>
            </div>
          </div>

          <SyncStatusStrip mode={syncMode} setMode={setSyncMode} onOpenSync={()=>setSyncOpen(true)} />

          <div className="grid grid-4 section-gap">
            {DATA.kpis.map((k,i)=>(<KPICard key={k.id} k={k} idx={i} onOpen={handleKpiOpen} />))}
          </div>

          <AIBriefing onAsk={openAgent} />

          <div className="grid grid-2 section-gap">
            <OperationsCard />
            <ComplianceAlertCard onRenew={()=>setToast("Renewal workflow started — document upload queued.")} />
          </div>

          <div className="grid grid-2 section-gap" id="rooms-section">
            <RoomStatusCard onOpenRoom={setOpenRoom} />
            <ComplianceHealthCard />
          </div>

          <div className="grid grid-3 section-gap">
            <MaintenanceCard tickets={tickets} setTickets={setTickets} />
            <GuestIssuesCard />
            <HousekeepingCard />
          </div>

          <div className="grid grid-2 section-gap">
            <div id="arrivals-section"><ArrivalsTable arrivals={arrivals} setArrivals={setArrivals} /></div>
            <div id="departures-section"><DeparturesCard /></div>
          </div>

          <div className="grid grid-2 section-gap" id="revenue-section">
            <RevenueCard />
            <ServiceQualityCard />
          </div>

          <div className="grid grid-2 section-gap">
            <ReviewIntelCard />
            <PerformanceCard />
          </div>

          <div className="grid grid-2 section-gap" id="notifications-section">
            <NotificationsCard />
            <Card>
              <div className="card-head"><span className="card-title">Sync Status</span></div>
              <div className="row"><span className="label">Local Changes</span><span className="value">{DATA.sync.local}</span></div>
              <div className="row"><span className="label">Uploaded</span><span className="value">{DATA.sync.uploaded}</span></div>
              <div className="row"><span className="label">Pending</span><span className="value">{DATA.sync.pending}</span></div>
              <div className="row"><span className="label">Conflicts</span><span className="value" style={{color:'#fca5a5'}}>{DATA.sync.conflicts}</span></div>
              <button className="btn" style={{width:'100%', marginTop:14}} onClick={()=>setSyncOpen(true)}>Open Sync Center</button>
            </Card>
          </div>
        </div>
      </div>

      {searchOpen && <CommandPalette onClose={()=>setSearchOpen(false)} />}
      {askOpen && <AskAtithiAI onClose={()=>setAskOpen(false)} />}
      {syncOpen && <SyncCenterModal onClose={()=>setSyncOpen(false)} />}
      {openRoom && <RoomDrawer room={openRoom} onClose={()=>setOpenRoom(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

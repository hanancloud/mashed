import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Pencil, Globe, Palette, Download } from 'lucide-react';

const BRANDSMITH_LOGO = "https://i.ibb.co/HDgyv5q6/Add-a-subheading-1.png";

function BrandsmithLogo({ size = 32 }) {
  return <img src={BRANDSMITH_LOGO} width={size} height={size} alt="Brandsmith" style={{ display: "block", objectFit: "contain" }} />;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Supabase REST client
function createSupabaseClient(url, key) {
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
  return {
    auth: {
      async signUp(email, password) {
        const res = await fetch(`${url}/auth/v1/signup`, { method: 'POST', headers, body: JSON.stringify({ email, password }) });
        if (!res.ok) {
          const t = await res.text();
          let err = 'Signup failed';
          try { const j = JSON.parse(t); err = j.message || j.msg || j.error_description || err; } catch (e) { }
          throw new Error(err);
        }
        return res.json();
      },
      async signInWithPassword({ email, password }) {
        const res = await fetch(`${url}/auth/v1/token?grant_type=password`, { method: 'POST', headers, body: JSON.stringify({ email, password }) });
        if (!res.ok) {
          const t = await res.text();
          let err = 'Signin failed';
          try { const j = JSON.parse(t); err = j.message || j.msg || j.error_description || err; } catch (e) { }
          throw new Error(err);
        }
        return res.json();
      },
      async signOut(token) {
        await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: { ...headers, Authorization: `Bearer ${token}` } });
      }
    },
    from: (table) => ({
      async insert(data, token) {
        const res = await fetch(`${url}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}`, 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      async selectWhere(col, match, token) {
        const res = await fetch(`${url}/rest/v1/${table}?${col}=eq.${match}`, {
          method: 'GET',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}` }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      async update(data, col, match, token) {
        const res = await fetch(`${url}/rest/v1/${table}?${col}=eq.${match}`, {
          method: 'PATCH',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}`, 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      },
      async delete(col, match, token) {
        const res = await fetch(`${url}/rest/v1/${table}?${col}=eq.${match}`, {
          method: 'DELETE',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}` }
        });
        if (!res.ok) throw new Error(await res.text());
        return true;
      }
    })
  };
}

// Groq direct stream
async function streamGroq(systemPrompt, userMessage, onChunk) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL, max_tokens: 2000, stream: true,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }]
    })
  });
  if (!res.ok) throw new Error("Groq API error: " + await res.text());

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n');
    while (boundary !== -1) {
      const line = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 1);
      boundary = buffer.indexOf('\n');

      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6);
        if (dataStr === "[DONE]") return fullText;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          fullText += delta;
          onChunk(fullText);
        } catch (e) { }
      }
    }
  }
  return fullText;
}

// AI parse helper
function parseAIJsonStr(text) {
  try {
    let t = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(t); } catch (e) { }
    const startArr = t.indexOf('[');
    const startObj = t.indexOf('{');
    let startIdx = -1;
    let endIdx = -1;
    if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
      startIdx = startArr;
      endIdx = t.lastIndexOf(']');
    } else if (startObj !== -1) {
      startIdx = startObj;
      endIdx = t.lastIndexOf('}');
    }
    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
      t = t.substring(startIdx, endIdx + 1);
    }
    t = t.replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(t);
  } catch (e) {
    throw new Error("AI returned invalid format.");
  }
}

// Components
function ButtonPrimary({ children, onClick, disabled, className = "", fullWidth = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#ffffff] text-[#080808] font-bold text-xs py-2.5 px-6 rounded-sm transition-all hover:bg-[#e8e8e8] disabled:opacity-15 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

function ButtonGhost({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent border border-[#1a1a1a] text-[#5a5a5a] text-xs py-2 px-5 rounded-sm transition-all hover:border-[#2e2e2e] hover:text-[#f5f5f5] disabled:opacity-15 ${className}`}
    >
      {children}
    </button>
  );
}

function ButtonText({ children, onClick, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent text-[#5a5a5a] text-xs py-1 transition-all hover:text-[#f5f5f5] disabled:opacity-15 ${className}`}
    >
      {children}
    </button>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={`mb-8 ${className}`}>
      {label && <label className="block text-[10px] font-bold text-[#5a5a5a] mb-6">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-[#252525] pb-3 text-sm text-[#f5f5f5] outline-none transition-all focus:border-white placeholder:text-[#252525]"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 4, className = "" }) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && <label className="block text-[10px] font-bold text-[#5a5a5a] mb-2">{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#101010] border border-[#1a1a1a] p-4 text-sm text-[#f5f5f5] outline-none transition-all focus:border-[#2e2e2e] placeholder:text-[#5a5a5a] resize-none"
      />
    </div>
  );
}

export default function Brandsmith() {
  const [screen, setScreen] = useState("auth");
  const [supabase] = useState(() => createSupabaseClient(SUPABASE_URL, SUPABASE_KEY));
  const [session, setSession] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  const initStepData = () => ({
    idea: { raw: '', questions: [], answers: {}, research: '', recommendation: '', locked: false, chosenIdea: '' },
    name: { names: [], selectedName: null, locked: false, refinement: '' },
    availability: { handle: '', ext: '', checked: false },
    identity: { answers: { personality: '', audience: '', competitors: '', colorMood: '', style: '', values: '' }, kit: null, logoStyle: 'modern', logoColor: '#f5f5f5', logoAccent: '#5a5a5a', svg: '' },
    export: { done: false }
  });

  const [stepData, setStepData] = useState(initStepData());

  // Restore session from localStorage on load
  useEffect(() => {
    const savedSession = localStorage.getItem('brandsmith_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed?.access_token) {
          setSession(parsed);
          setScreen("dashboard");
        }
      } catch (e) {
        localStorage.removeItem('brandsmith_session');
      }
    }
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      localStorage.setItem('brandsmith_session', JSON.stringify(session));
      loadProjects();
    } else {
      localStorage.removeItem('brandsmith_session');
    }
  }, [session]);

  const loadProjects = async () => {
    try {
      const res = await supabase.from('projects').selectWhere('user_id', session.user.id, session.access_token);
      setProjects(Array.isArray(res) ? res.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)) : []);
    } catch (e) { }
  };

  const createBrand = async () => {
    try {
      const res = await supabase.from('projects').insert([{ user_id: session.user.id, title: 'Untitled Brand', status: 'draft' }], session.access_token);
      if (res && res[0]) {
        setCurrentProject(res[0]);
        setStepData(initStepData());
        setScreen('builder');
      }
    } catch (e) { }
  };

  const loadProject = async (proj) => {
    setCurrentProject(proj);
    setScreen("builder");
    try {
      const data = await supabase.from('project_data').selectWhere('project_id', proj.id, session.access_token);
      let newStepData = initStepData();
      for (let row of data) {
        if (newStepData[row.step]) {
          newStepData[row.step] = { ...newStepData[row.step], ...row.data };
        }
      }
      setStepData(newStepData);
    } catch (e) { }
  };

  const saveStepData = async (step, dataSubset) => {
    const updatedStep = { ...stepData[step], ...dataSubset };
    setStepData(prev => ({ ...prev, [step]: updatedStep }));
    if (!currentProject) return;
    try {
      const rows = await supabase.from('project_data').selectWhere('project_id', currentProject.id, session.access_token);
      const existing = rows.find(r => r.step === step);
      if (existing) {
        await supabase.from('project_data').update({ data: updatedStep, updated_at: new Date().toISOString() }, 'id', existing.id, session.access_token);
      } else {
        await supabase.from('project_data').insert([{ project_id: currentProject.id, step, data: updatedStep }], session.access_token);
      }
    } catch (e) { }
  };

  if (screen === 'auth') return <AuthScreen setScreen={setScreen} setSession={setSession} supabase={supabase} />;
  if (screen === 'dashboard') return <DashboardScreen session={session} setSession={setSession} supabase={supabase} setScreen={setScreen} projects={projects} loadProjects={loadProjects} createBrand={createBrand} loadProject={loadProject} />;
  if (screen === 'builder') return <BuilderScreen session={session} supabase={supabase} currentProject={currentProject} setCurrentProject={setCurrentProject} stepData={stepData} setStepData={setStepData} saveStepData={saveStepData} setScreen={setScreen} loadProjects={loadProjects} />;

  return null;
}

function AuthScreen({ setScreen, setSession, supabase }) {
  const [mode, setMode] = useState("Sign In");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      let res;
      if (mode === "Sign In") res = await supabase.auth.signInWithPassword({ email, password });
      else res = await supabase.auth.signUp(email, password);

      if (res?.access_token) {
        setSession(res);
        setScreen("dashboard");
      } else {
        setErr("Authentication failed.");
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#080808]">
      <div className="w-full md:w-[45%] border-b md:border-b-0 md:border-r border-[#1a1a1a] p-8 md:p-16 flex flex-col justify-between">
        <div className="flex items-center gap-4">
          <BrandsmithLogo size={36} />
          <h1 className="text-xl font-bold">Brandsmith</h1>
        </div>
        <div className="mt-12 md:mt-0">
          <h2 className="text-[32px] md:text-[48px] leading-[1] mb-6 md:mb-12 max-w-[400px]">Forge your brand from idea to identity.</h2>
          <p className="hidden md:block text-[#5a5a5a] text-sm max-w-[280px] leading-relaxed">From raw idea to complete brand kit — name, logo, colors, voice, and more.</p>
        </div>
        <div className="hidden md:block text-[10px] text-[#5a5a5a]">
          © 2025 Brandsmith
        </div>
      </div>
      <div className="w-full md:w-[55%] flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 md:mb-16 text-center md:text-left">
            <h3 className="text-[20px] md:text-[24px] mb-2">Welcome back</h3>
            <p className="text-[#5a5a5a] text-sm">Sign in to your workspace</p>
          </div>

          <div className="flex gap-8 md:gap-12 mb-10 md:mb-12 border-b border-[#1a1a1a]">
            {["Sign In", "Sign Up"].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-xs font-bold pb-4 transition-all border-b-2 whitespace-nowrap ${mode === m ? 'text-white border-white' : 'text-[#3a3a3a] border-transparent'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit}>
            {err && <div className="text-xs text-white/50 border border-[#1a1a1a] p-3 mb-6">{err}</div>}
            <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

            <button
              disabled={loading || password.length < 6}
              className={`w-full font-bold text-xs py-4 rounded-sm transition-all duration-300 mt-4 ${password.length >= 6
                  ? "bg-white text-black hover:bg-[#e8e8e8]"
                  : "bg-[#1e1e1e] text-[#5a5a5a] opacity-50 cursor-not-allowed"
                }`}
            >
              {loading ? "Pending..." : `${mode} →`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DashboardScreen({ session, setSession, supabase, setScreen, projects, loadProjects, createBrand, loadProject }) {
  const deleteProject = async (id) => {
    if (!confirm("Delete this brand?")) return;
    try {
      // Deep delete: remove project data first
      await supabase.from('project_data').delete('project_id', id, session.access_token);
      // Then remove the project itself
      await supabase.from('projects').delete('id', id, session.access_token);
      loadProjects();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete project: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="h-[56px] border-b border-[#1a1a1a] px-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <BrandsmithLogo size={20} />
          <h1 className="text-xs md:text-sm font-bold">Brandsmith</h1>
        </div>
        <div className="flex gap-2 md:gap-6">
          <ButtonPrimary onClick={createBrand} className="text-[9px] md:text-[10px] py-1 px-3 md:py-1.5 md:px-4 font-bold">New brand</ButtonPrimary>
          <ButtonText onClick={() => { setSession(null); setScreen('auth'); }} className="text-[9px] md:text-xs">Logout</ButtonText>
        </div>
      </div>

      <div className="max-w-[960px] mx-auto py-10 md:py-20 px-6 md:px-12">
        <div className="mb-10 md:mb-16">
          <label className="text-[9px] md:text-[10px] text-[#5a5a5a] block mb-2">Workspace</label>
          <h2 className="text-2xl md:text-3xl">Active Brands</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-1">
          <div
            onClick={createBrand}
            className="h-[180px] bg-[#080808] border border-dashed border-[#1a1a1a] rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#2e2e2e] group"
          >
            <span className="text-2xl text-[#5a5a5a] group-hover:text-white transition-all">+</span>
            <span className="text-[10px] text-[#5a5a5a] mt-2 group-hover:text-white transition-all">Start new</span>
          </div>

          {projects.map(p => (
            <div
              key={p.id}
              className="h-[180px] bg-[#101010] border border-[#1a1a1a] rounded-sm p-6 flex flex-col justify-between transition-all hover:border-[#2e2e2e] group"
            >
              <div className="flex justify-between items-start">
                <div className={`w-2 h-2 rounded-full mt-1 ${p.status === 'complete' ? 'bg-white' : 'bg-[#2e2e2e]'}`} />
                <ButtonText onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="text-lg opacity-0 group-hover:opacity-100 transition-all">×</ButtonText>
              </div>
              <div>
                <h3 className="text-lg mb-1">{p.title}</h3>
                <p className="text-[10px] text-[#5a5a5a]">{p.status}</p>
              </div>
              <ButtonGhost onClick={() => loadProject(p)} className="text-[10px] py-1.5 w-full">Open Dossier →</ButtonGhost>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-12">
            <div className="h-[1px] bg-[#1a1a1a] w-full mb-12" />
            <p className="text-center text-[#5a5a5a] text-sm italic">Workspace is empty. Initiate a brand forge to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BuilderScreen({ session, supabase, currentProject, setCurrentProject, stepData, saveStepData, setScreen, loadProjects }) {
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { id: 1, icon: Lightbulb, title: "Idea Lab", key: "idea" },
    { id: 2, icon: Pencil, title: "Name Gen", key: "name" },
    { id: 3, icon: Globe, title: "Availability", key: "availability" },
    { id: 4, icon: Palette, title: "Identity", key: "identity" },
    { id: 5, icon: Download, title: "Export", key: "export" },
  ];

  const goNext = () => setCurrentStep(prev => prev < 5 ? prev + 1 : prev);
  const goPrev = () => setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
  const backToDash = () => { loadProjects(); setScreen("dashboard"); };

  const isStepDone = (key) => {
    if (key === 'idea') return !!stepData.idea.locked;
    if (key === 'name') return !!stepData.name.selectedName;
    if (key === 'availability') return !!stepData.availability.checked;
    if (key === 'identity') return !!stepData.identity.kit;
    if (key === 'export') return currentProject?.status === 'complete';
    return false;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#080808] text-[#f5f5f5] overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:flex w-[228px] border-r border-[#1a1a1a] flex-col shrink-0">
        <div className="h-[56px] border-b border-[#1a1a1a] px-6 flex items-center gap-3 cursor-pointer" onClick={backToDash}>
          <BrandsmithLogo size={20} />
          <span className="text-xs font-bold">Brandsmith</span>
        </div>
        <div className="flex-1 p-4 space-y-1">
          {steps.map(s => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className={`w-full flex items-center gap-4 p-3 text-left transition-all border-l-2 ${currentStep === s.id ? 'bg-[#101010] text-[#f5f5f5] border-white' : 'text-[#5a5a5a] border-transparent hover:bg-[#101010]'}`}
            >
              <s.icon size={16} className={currentStep === s.id ? 'text-white' : 'text-[#5a5a5a]'} />
              <span className="text-xs flex-1">{s.title}</span>
              {isStepDone(s.key) && <span className="text-[#5a5a5a] text-xs">✓</span>}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-[#3a3a3a] font-mono mb-4">Forge v.0.8</p>
          <ButtonText onClick={backToDash} className="text-[10px]">← Back to hub</ButtonText>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden h-[56px] border-b border-[#1a1a1a] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3" onClick={backToDash}>
            <BrandsmithLogo size={18} />
            <span className="text-xs font-bold">Brandsmith</span>
          </div>
          <ButtonText onClick={backToDash} className="text-[10px]">EXIT</ButtonText>
        </div>

        <div className="flex-1 p-4 md:p-12 md:pl-24 relative">
          <div className="absolute top-4 right-4 md:top-12 md:right-12 text-[48px] md:text-[180px] font-bold text-[#101010] select-none z-0">
            0{currentStep}
          </div>
          <div className="relative z-10 max-w-[800px]">
            {currentStep === 1 && <IdeaLab data={stepData.idea} onSave={(d) => saveStepData('idea', d)} goNext={goNext} />}
            {currentStep === 2 && <NameStudio data={stepData.name} idea={stepData.idea.chosenIdea} onSave={(d) => saveStepData('name', d)} goNext={goNext} />}
            {currentStep === 3 && <AvailabilityStep data={stepData.availability} domainSeed={stepData.name.selectedName} onSave={(d) => saveStepData('availability', d)} goNext={goNext} />}
            {currentStep === 4 && <IdentityStep data={stepData.identity} name={stepData.name.selectedName} idea={stepData.idea.chosenIdea} onSave={(d) => saveStepData('identity', d)} goNext={goNext} />}
            {currentStep === 5 && <ExportStep stepData={stepData} currentProject={currentProject} supabase={supabase} session={session} setCurrentProject={setCurrentProject} />}
          </div>
        </div>

        {/* Bottom Bar - Mobile Only */}
        <div className="md:hidden h-[64px] border-t border-[#1a1a1a] bg-[#0c0c0c] flex items-center justify-around px-2 shrink-0">
          {steps.map(s => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              className={`flex flex-col items-center gap-1 transition-all ${currentStep === s.id ? 'text-white' : 'text-[#3a3a3a]'}`}
            >
              <s.icon size={18} />
              <span className="text-[8px]">{s.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── STEP 01: IDEA LAB ──
function IdeaLab({ data, onSave, goNext }) {
  const [loading, setLoading] = useState(false);
  const [streamData, setStreamData] = useState("");

  const analyzeIdea = async () => {
    setLoading(true);
    setStreamData("");
    try {
      const prompt = "Research analyst mode. Analyze: market, competition, trends, monetization. GIVE ONE final recommendation. Use ### headers. Be sharp.";
      const fullContext = `Raw idea: ${data.raw}`;
      const res = await streamGroq(prompt, fullContext, (chunk) => setStreamData(chunk));
      onSave({ recommendation: res });
    } catch (e) {
      console.error("Error analyzing idea:", e);
    }
    setLoading(false);
  };

  if (data.locked) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-[#101010] border border-[#1a1a1a] p-6 md:p-8 space-y-6">
        <label className="text-[10px] text-[#5a5a5a] block font-bold">Core value proposition</label>
        <p className="text-sm leading-relaxed">{data.chosenIdea}</p>
        <ButtonGhost onClick={goNext} fullWidth>Proceed to naming →</ButtonGhost>
      </div>
      <div className="bg-[#101010] border border-[#1a1a1a] p-6 md:p-8">
        <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold">Market analysis</label>
        <div className="text-xs text-[#5a5a5a] leading-relaxed whitespace-pre-wrap">{data.recommendation}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="mb-10">
        <h2 className="text-xl md:text-2xl mb-2">Refine your vision</h2>
        <p className="text-[#5a5a5a] text-xs leading-relaxed max-w-lg">What problem are you solving? Be specific about the core friction you want to remove from the world.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        <div className="space-y-4">
          <TextAreaField
            label="ELEVATOR PITCH"
            placeholder="A platform that connects coffee roasters with direct farmers..."
            value={data.raw}
            onChange={e => onSave({ raw: e.target.value })}
            rows={6}
          />
          <ButtonPrimary onClick={analyzeIdea} disabled={!data.raw || loading}>
            {loading ? 'Researching...' : 'Research market →'}
          </ButtonPrimary>
        </div>

        <div className="bg-[#101010] border border-[#1a1a1a] p-6 md:p-8 flex items-center justify-center">
          {loading ? (
            <div className="text-center">
              <div className="mono text-[10px] text-white animate-pulse">ANALYZING TRENDS</div>
            </div>
          ) : (
            <p className="text-[#5a5a5a] text-[10px] text-center italic">Market intelligence will be displayed here.</p>
          )}
        </div>
      </div>

      {(streamData || data.recommendation) && (
        <div className="bg-[#101010] border border-[#1a1a1a] p-8">
          <label className="text-[10px] text-[#5a5a5a] block mb-6">Intelligence report</label>
          <div className="text-[#5a5a5a] text-[13.5px] leading-[1.9] whitespace-pre-wrap">
            {(data.recommendation || streamData).split('\n').map((line, k) => {
              if (line.startsWith('###')) {
                return <h3 key={k} className="text-[#f5f5f5] text-sm font-bold mt-6 mb-2">{line.replace('###', '').trim()}</h3>;
              }
              return <p key={k}>{line}</p>;
            })}
          </div>

          <div className="mt-12 pt-12 border-t border-[#1a1a1a]">
            <InputField label="Final consolidated idea" value={data.chosenIdea || ''} onChange={e => onSave({ chosenIdea: e.target.value })} placeholder="State the final vision clearly..." />
            <ButtonPrimary onClick={() => data.chosenIdea && onSave({ locked: true })} className="mt-4">Lock protocol ✓</ButtonPrimary>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STEP 02: NAME STUDIO ──
function NameStudio({ data, idea, onSave, goNext }) {
  const [loading, setLoading] = useState(false);

  const generateNames = async () => {
    setLoading(true);
    try {
      const prompt = "Generate 20 brand names for: " + idea + ". Consider the refinement: " + data.refinement + ". Return ONLY JSON array string[].";
      const res = await streamGroq(prompt, "Return JSON [\"name1\", \"name2\", ...]", () => { });
      const names = parseAIJsonStr(res);
      if (Array.isArray(names)) onSave({ names });
    } catch (e) {
      console.error("Error generating names:", e);
    }
    setLoading(false);
  };

  if (data.locked) return (
    <div className="border-l-2 border-white bg-[#101010] p-8 animate-in fade-in slide-in-from-bottom-4">
      <label className="text-[10px] text-[#5a5a5a] block mb-4">Selected identity</label>
      <h2 className="text-4xl mb-6">{data.selectedName}</h2>
      <div className="flex gap-2">
        <ButtonGhost onClick={() => onSave({ locked: false })}>Abandon name</ButtonGhost>
        <ButtonPrimary onClick={goNext}>Proceed to availability →</ButtonPrimary>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="mb-10">
        <h2 className="text-xl md:text-2xl mb-2">The Name Gen</h2>
        <p className="text-[#5a5a5a] text-xs leading-relaxed max-w-lg">We'll craft names that resonate with your vision. Select your definitive brand handle.</p>
      </div>

      <div className="bg-[#101010] border border-[#1a1a1a] p-6 md:p-10 text-center">
        {!data.names.length && (
          <div className="max-w-xs mx-auto space-y-6">
            <TextAreaField label="Additional context" placeholder="Tech-focused, short, abstract..." value={data.refinement} onChange={e => onSave({ refinement: e.target.value })} rows={3} />
            <ButtonPrimary onClick={generateNames} disabled={loading} fullWidth>{loading ? 'Styling nomenclature...' : 'Generate identities →'}</ButtonPrimary>
          </div>
        )}

        {data.names.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a] overflow-hidden">
            {data.names.map(n => (
              <button
                key={n}
                onClick={() => onSave({ selectedName: n, locked: true })}
                className={`p-6 md:p-10 text-xl transition-all ${data.selectedName === n ? 'bg-white text-black' : 'bg-[#080808] hover:bg-[#101010]'}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 03: AVAILABILITY HUB ──
function AvailabilityStep({ data, domainSeed, onSave, goNext }) {
  useEffect(() => {
    if (domainSeed && !data.handle) {
      const derived = domainSeed.toLowerCase().replace(/[^a-z0-9]/g, '');
      onSave({ handle: derived });
    }
  }, [domainSeed]);

  const exts = ['.com', '.io', '.co', '.ai', '.app'];
  const socials = ['X', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook'];

  return (
    <div className="space-y-12">
      <div className="mb-10">
        <h2 className="text-xl md:text-2xl mb-2">Map the Presence</h2>
        <p className="text-[#5a5a5a] text-xs leading-relaxed max-w-lg">Verify the digital footprint of your brand name across domains and social media.</p>
      </div>

      <div className="bg-[#101010] border border-[#1a1a1a] p-8">
        <InputField label="Base handle protocol" value={data.handle} onChange={e => onSave({ handle: e.target.value })} />
        <p className="mono text-[10px] text-[#5a5a5a]">Handle verified against @{data.handle}</p>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] text-[#5a5a5a] font-bold">Domain presence</label>
        <div className="space-y-1">
          {exts.map(ext => (
            <a key={ext} href={`https://www.namecheap.com/domains/registration/results/?domain=${data.handle}${ext}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-between p-4 bg-[#101010] border border-[#1a1a1a] hover:border-[#2e2e2e] transition-all group">
              <span className="mono text-sm">{data.handle}{ext}</span>
              <span className="text-[#5a5a5a] group-hover:text-white transition-all text-xs">Check →</span>
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] text-[#5a5a5a] font-bold">Social channels</label>
        <div className="grid grid-cols-2 gap-1">
          {socials.map(s => (
            <div key={s} className="flex items-center justify-between p-4 bg-[#101010] border border-[#1a1a1a] hover:border-[#2e2e2e] transition-all group">
              <span className="text-xs font-bold">{s}</span>
              <span className="mono text-[10px] text-[#5a5a5a]">@{data.handle}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8">
        <label className="flex items-center gap-4 cursor-pointer">
          <input type="checkbox" checked={data.checked} onChange={e => onSave({ checked: e.target.checked })} className="w-5 h-5 bg-[#161616] border border-[#1a1a1a] rounded-none accent-white" />
          <span className="text-[11px] text-white">I have secured all primary digital handles.</span>
        </label>
        <ButtonPrimary onClick={goNext} disabled={!data.checked} className="mt-4">Proceed to identity →</ButtonPrimary>
      </div>
    </div>
  );
}

// ── STEP 04: IDENTITY STUDIO ──
function IdentityStep({ data, onSave, name, idea, goNext }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("VIBE");

  const buildKit = async () => {
    setLoading(true);
    try {
      const prompt = "Expert branding agent. Build kit for: " + name + ". Needs: colors, typography, taglines, brand voice. Return JSON.";
      const msg = `Name: ${name}\nIdea: ${idea}\nDetails: ${JSON.stringify(data.answers)}`;
      const res = await streamGroq(prompt, msg, () => { });
      const kit = parseAIJsonStr(res);
      if (kit) onSave({ kit, logoColor: kit.colors?.primary || '#f5f5f5', logoAccent: kit.colors?.accent || '#5a5a5a' });
    } catch (e) { }
    setLoading(false);
  };

  const generateSVG = () => {
    const { logoStyle: style, logoColor: c1, logoAccent: c2 } = data;
    const initial = name ? name.charAt(0).toUpperCase() : "B";
    let svg = `<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">`;
    if (style === 'modern') svg += `<rect width="150" height="150" rx="4" fill="#080808"/><text x="75" y="105" font-family="Syne" font-weight="800" font-size="90" fill="${c1}" text-anchor="middle">${initial}</text><rect x="55" y="115" width="40" height="4" fill="${c2}"/>`;
    else if (style === 'playful') svg += `<rect width="150" height="150" rx="4" fill="${c1}"/><circle cx="90" cy="90" r="40" fill="${c2}" opacity="0.6"/><text x="75" y="105" font-family="Syne" font-weight="800" font-size="80" fill="#fff" text-anchor="middle">${initial}</text>`;
    else if (style === 'luxury') svg += `<rect width="150" height="150" rx="4" fill="#101010"/><rect x="20" y="20" width="110" height="110" stroke="${c1}" stroke-width="1" fill="none"/><text x="75" y="95" font-family="serif" font-size="60" fill="${c1}" text-anchor="middle">${initial}</text>`;
    else if (style === 'bold') svg += `<rect width="150" height="150" rx="4" fill="${c1}"/><rect x="30" y="30" width="90" height="90" fill="${c2}" opacity="0.4"/><text x="75" y="105" font-family="Syne" font-weight="900" font-size="100" fill="#080808" text-anchor="middle">${initial}</text>`;
    else if (style === 'minimal') svg += `<rect width="150" height="150" rx="4" fill="#f5f5f5"/><text x="75" y="105" font-family="Syne" font-weight="300" font-size="100" fill="#080808" text-anchor="middle">${initial}</text>`;
    else if (style === 'geometric') svg += `<rect width="150" height="150" rx="4" fill="#080808"/><polygon points="75,20 130,50 130,110 75,140 20,110 20,50" fill="none" stroke="${c1}" stroke-width="2"/><text x="75" y="100" font-family="monospace" font-size="60" fill="${c1}" text-anchor="middle">${initial}</text>`;
    svg += `</svg>`;
    onSave({ svg });
  };

  useEffect(() => { if (activeTab === 'LOGO' && name) generateSVG(); }, [data.logoStyle, data.logoColor, data.logoAccent, activeTab]);

  const tabs = ["Vibe", "Kit", "Logo"];

  return (
    <div className="space-y-12">
      <div className="mb-10">
        <h2 className="text-xl md:text-2xl mb-2">Draw the Soul</h2>
        <p className="text-[#5a5a5a] text-xs leading-relaxed max-w-lg">Define the aesthetic and voice that will resonate with your audience.</p>
      </div>

      <div className="flex gap-12 border-b border-[#1a1a1a]">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t.toUpperCase())} className={`text-xs py-3 border-b-2 transition-all ${activeTab === t.toUpperCase() ? 'text-white border-white' : 'text-[#5a5a5a] border-transparent'}`}>{t}</button>
        ))}
      </div>

      {activeTab === 'VIBE' && (
        <div className="space-y-8 bg-[#101010] p-8 border border-[#1a1a1a]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputField label="Personality" placeholder="eg. Rogue / Academic / Brutalist" value={data.answers.personality} onChange={e => onSave({ answers: { ...data.answers, personality: e.target.value } })} />
            <InputField label="Audience" placeholder="eg. Elite developers / Streetwear collectors" value={data.answers.audience} onChange={e => onSave({ answers: { ...data.answers, audience: e.target.value } })} />
            <InputField label="Color mood" placeholder="eg. Deep obsidian / Cold sterile / Vintage grain" value={data.answers.colorMood} onChange={e => onSave({ answers: { ...data.answers, colorMood: e.target.value } })} />
            <InputField label="Style" placeholder="eg. Swiss grid / Bauhaus / Digital nomad" value={data.answers.style} onChange={e => onSave({ answers: { ...data.answers, style: e.target.value } })} />
          </div>
          <ButtonPrimary onClick={buildKit} disabled={loading} className="w-full mt-6">{loading ? "Analyst pending..." : "Build Brand Kit →"}</ButtonPrimary>
        </div>
      )}

      {activeTab === 'KIT' && data.kit && (
        <div className="space-y-12 animate-fade-in">
          <section>
            <label className="text-[10px] text-[#5a5a5a] block mb-6">Color spectrum</label>
            <div className="flex flex-wrap gap-4">
              {['primary', 'accent', 'neutral', 'dark'].map(c => data.kit.colors?.[c] && (
                <div key={c} className="bg-[#101010] border border-[#1a1a1a] p-4 text-center">
                  <div className="w-14 h-14 rounded-sm mb-3 mx-auto" style={{ backgroundColor: data.kit.colors[c] }} />
                  <div className="text-[9px] text-[#5a5a5a] mb-1">{c}</div>
                  <div className="mono text-[10px]">{data.kit.colors[c].toUpperCase()}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <label className="text-[10px] text-[#5a5a5a] block mb-6">Typography protocol</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div className="bg-[#101010] border border-[#1a1a1a] p-8">
                <p className="text-[10px] text-[#5a5a5a] mb-4">Display</p>
                <p className="text-3xl font-bold mb-2">{data.kit.fonts?.display}</p>
                <p className="text-xs text-[#5a5a5a] leading-relaxed">{data.kit.fonts?.displayDesc}</p>
              </div>
              <div className="bg-[#101010] border border-[#1a1a1a] p-8">
                <p className="text-[10px] text-[#5a5a5a] mb-4">Body</p>
                <p className="text-3xl mb-2">{data.kit.fonts?.body}</p>
                <p className="text-xs text-[#5a5a5a] leading-relaxed">{data.kit.fonts?.bodyDesc}</p>
              </div>
            </div>
          </section>

          <section>
            <label className="text-[10px] text-[#5a5a5a] block mb-6">Nomenclature taglines</label>
            <div className="space-y-4">
              {data.kit.taglines?.map((t, i) => (
                <div key={i} className="border-l-2 border-[#2e2e2e] p-6 text-xl italic text-[#e8e8e8]">"{t}"</div>
              ))}
            </div>
          </section>

          <section className="bg-[#101010] border border-[#1a1a1a] p-8">
            <label className="text-[10px] text-[#5a5a5a] block mb-6">Voice architecture</label>
            <h4 className="text-xl mb-4">{data.kit.voice?.tone}</h4>
            <div className="grid grid-cols-2 gap-12">
              <div><p className="text-[10px] font-bold text-[#5a5a5a] mb-4">Protocol DO</p><ul className="space-y-3">{(data.kit.voice?.dos || []).map((d, i) => <li key={i} className="text-sm text-[#5a5a5a]">/ {d}</li>)}</ul></div>
              <div><p className="text-[10px] font-bold text-[#5a5a5a] mb-4">Protocol DON'T</p><ul className="space-y-3">{(data.kit.voice?.donts || []).map((d, i) => <li key={i} className="text-sm text-[#5a5a5a]">/ {d}</li>)}</ul></div>
            </div>
          </section>
          <ButtonPrimary onClick={goNext} disabled={!data.kit} className="mt-4">Proceed to export →</ButtonPrimary>
        </div>
      )}

      {activeTab === 'LOGO' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <div className="bg-[#101010] border border-[#1a1a1a] p-6 md:p-8">
            <label className="text-[10px] text-[#5a5a5a] block mb-6">Visual symbolism</label>
            <div className="flex flex-wrap gap-2 mb-8">
              {['modern', 'playful', 'luxury', 'bold', 'minimal', 'geometric'].map(s => (
                <button key={s} onClick={() => onSave({ logoStyle: s })}
                  className={`text-[9px] md:text-[10px] px-3 md:px-4 py-1.5 md:py-2 border transition-all ${data.logoStyle === s ? 'bg-white text-black border-white' : 'bg-transparent text-[#5a5a5a] border-[#1a1a1a] hover:border-[#2e2e2e]'}`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <label className="text-[10px] text-[#5a5a5a] font-bold">Primary</label>
                <div className="flex gap-2">
                  <input type="color" value={data.logoColor} onChange={e => onSave({ logoColor: e.target.value })} className="h-10 w-10 bg-transparent border border-[#1a1a1a] p-1 cursor-pointer" />
                  <input type="text" value={data.logoColor} onChange={e => onSave({ logoColor: e.target.value })} className="mono text-[10px] w-full bg-transparent border-b border-[#252525] outline-none" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-[#5a5a5a] font-bold">Accent</label>
                <div className="flex gap-2">
                  <input type="color" value={data.logoAccent} onChange={e => onSave({ logoAccent: e.target.value })} className="h-10 w-10 bg-transparent border border-[#1a1a1a] p-1 cursor-pointer" />
                  <input type="text" value={data.logoAccent} onChange={e => onSave({ logoAccent: e.target.value })} className="mono text-[10px] w-full bg-transparent border-b border-[#252525] outline-none" />
                </div>
              </div>
            </div>

            <ButtonPrimary onClick={() => {
              const blob = new Blob([data.svg], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `${name}-logo.svg`; a.click();
            }} fullWidth className="text-[10px] py-3">Export SVG symbol</ButtonPrimary>
          </div>
          <div className="bg-[#080808] border border-[#1a1a1a] p-8 md:p-12 flex items-center justify-center min-h-[300px]">
            {data.svg ? <div dangerouslySetInnerHTML={{ __html: data.svg }} className="w-48 h-48 md:w-64 md:h-64" /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STEP 05: EXPORT ──
function ExportStep({ stepData, currentProject, supabase, session, setCurrentProject }) {
  const [success, setSuccess] = useState('');

  const checks = [
    { n: "Idea verification", d: stepData.idea.locked },
    { n: "Nomenclature lock", d: stepData.name.locked },
    { n: "Digital presence map", d: stepData.availability.checked },
    { n: "Identity architecture", d: !!stepData.identity.kit }
  ];
  const progress = (checks.filter(c => c.d).length / checks.length) * 100;

  const generateHTML = () => {
    const d = stepData;
    const kit = d.identity.kit || {};
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${d.name.selectedName} - Brand Kit</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Syne:wght@800&display=swap');
    :root {
      --bg: #080808;
      --card: #101010;
      --border: #1a1a1a;
      --text: #f5f5f5;
      --muted: #5a5a5a;
      --accent: #ffffff;
      --border-hover: #2e2e2e;
    }
    body {
      font-family: 'Syne', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      margin: 0;
      padding: 60px 20px;
    }
    .container { max-w: 800px; margin: 0 auto; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      padding: 40px;
      margin-bottom: 2px;
    }
    h1, h2, h3 { font-family: 'Syne', sans-serif; font-weight: 800; margin-top: 0; }
    h2 { 
      font-size: 14px; 
      text-transform: uppercase; 
      letter-spacing: 4px; 
      color: #ffffff; 
      border-bottom: 1px solid var(--border);
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
    .cover { text-align: center; padding: 120px 0; }
    .logo-box { width: 120px; height: 120px; margin: 0 auto 40px; }
    .logo-box svg, .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .brand-name { font-size: 64px; margin: 0; color: #fff; letter-spacing: -2px; }
    .swatch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 20px; }
    .swatch { width: 60px; height: 60px; border-radius: 4px; border: 1px solid var(--border); margin-bottom: 10px; }
    .tagline { 
      border-left: 2px solid var(--border-hover); 
      padding: 20px 30px; 
      font-style: italic; 
      font-size: 20px; 
      margin: 20px 0; 
      color: #e8e8e8;
    }
    .voice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .voice-do { color: #e8e8e8; }
    .voice-dont { color: var(--muted); }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 10px; display: flex; align-items: center; gap: 15px; }
    li:before { content: "■"; color: #ffffff; font-size: 10px; }
    .footer { text-align: center; margin-top: 100px; color: var(--border-hover); font-size: 10px; }
    @media print {
      body { background: #ffffff !important; color: #000000 !important; }
      .card { border: 1px solid #eee; background: #fff !important; }
      h2 { color: #000; border-bottom: 1px solid #eee; }
      .tagline, .voice-do, .voice-dont { color: #000 !important; }
      li:before { color: #000 !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="cover">
      <div className="logo-box">${d.identity.svg || `<img src="${BRANDSMITH_LOGO}" />`}</div>
      <h1 class="brand-name">${d.name.selectedName}</h1>
      <p style="color: var(--muted); font-size: 12px; font-weight: bold; margin-top: 20px;">Brand Dossier</p>
    </div>

    <div class="card">
      <h2>The Vision</h2>
      <p>${d.idea.chosenIdea}</p>
    </div>

    <div class="card">
      <h2>Color Palette</h2>
      <div class="swatch-grid">
        ${Object.entries(kit.colors || {}).map(([name, hex]) => `
          <div>
            <div class="swatch" style="background: ${hex};"></div>
            <p class="mono" style="margin:0; text-transform: uppercase;">${name}</p>
            <p class="mono" style="margin:0; color: var(--muted);">${hex}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <h2>Typography</h2>
      <div style="margin-bottom: 30px;">
        <p class="mono" style="color: var(--muted); margin-bottom: 5px;">DISPLAY</p>
        <h3 style="font-size: 32px; margin: 0;">${kit.fonts?.display || 'Syne 800'}</h3>
        <p style="font-size: 14px; color: var(--muted);">${kit.fonts?.displayDesc || ''}</p>
      </div>
      <div>
        <p class="mono" style="color: var(--muted); margin-bottom: 5px;">BODY</p>
        <h3 style="font-size: 32px; margin: 0;">${kit.fonts?.body || 'Inter'}</h3>
        <p style="font-size: 14px; color: var(--muted);">${kit.fonts?.bodyDesc || ''}</p>
      </div>
    </div>

    <div class="card">
      <h2>Nomenclature</h2>
      ${(kit.taglines || []).map(t => `<div class="tagline">"${t}"</div>`).join('')}
    </div>

    <div class="card">
      <h2>Voice Architecture</h2>
      <div class="voice-grid">
        <div class="voice-do">
          <p class="mono" style="color: var(--muted); margin-bottom: 20px;">PROTOCOL DO</p>
          <ul>${(kit.voice?.dos || []).map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
        <div class="voice-dont">
          <p class="mono" style="color: var(--muted); margin-bottom: 20px;">PROTOCOL DON'T</p>
          <ul>${(kit.voice?.donts || []).map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
      </div>
    </div>

    <div class="footer">Forged with Brandsmith</div>
  </div>
</body>
</html>`;
  };

  const handleExport = async (type) => {
    const html = generateHTML();
    if (currentProject.status !== 'complete') {
      await supabase.from('projects').update({ status: 'complete' }, 'id', currentProject.id, session.access_token);
      setCurrentProject(prev => ({ ...prev, status: 'complete' }));
    }
    setSuccess('DOSSIER EXPORTED TO DISK.');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    if (type === 'dl') {
      const a = document.createElement('a'); a.href = url; a.download = `${stepData.name.selectedName}-BrandKit.html`; a.click();
    } else {
      const win = window.open(url, '_blank');
      setTimeout(() => win.print(), 1000);
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-[#101010] border border-[#1a1a1a] p-8">
        <label className="text-[10px] text-[#5a5a5a] block mb-8 font-bold">Forge completion protocol</label>

        <div className="w-full bg-[#1a1a1a] h-[2px] mb-10 overflow-hidden">
          <div className="bg-white h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>

        <ul className="space-y-6 mb-12">
          {checks.map(c => (
            <li key={c.n} className="flex items-center gap-6">
              <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] transition-all ${c.d ? 'bg-white text-black' : 'bg-[#161616] border border-[#1a1a1a]'}`}>
                {c.d ? '✓' : ''}
              </span>
              <span className={`text-[10px] transition-all font-bold ${c.d ? 'text-white' : 'text-[#5a5a5a]'}`}>{c.n}</span>
            </li>
          ))}
        </ul>

        {success && <div className="text-xs text-white border border-[#1a1a1a] p-4 mb-8 text-center bg-[#080808]">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <ButtonPrimary disabled={progress < 100} onClick={() => handleExport('dl')} className="h-20 text-sm">Download Brand Kit</ButtonPrimary>
          <button
            disabled={progress < 100}
            onClick={() => handleExport('print')}
            className="bg-[#101010] border border-[#1a1a1a] text-[#5a5a5a] font-bold text-xs hover:border-[#2e2e2e] hover:text-white transition-all disabled:opacity-15"
          >
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

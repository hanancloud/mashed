import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Pencil, Globe, Palette, Briefcase, Download, Trash2, Plus } from 'lucide-react';

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
    idea: { raw: '', questions: [], answers: {}, research: '', recommendation: '', locked: false, chosenIdea: '', validation: null },
    name: { names: [], selectedName: null, locked: false, refinement: '' },
    availability: { handle: '', ext: '', checked: false },
    identity: { answers: { personality: '', audience: '', competitors: '', colorMood: '', style: '', values: '' }, kit: null, selectedTagline: null, logoStyle: 'modern', logoColor: '#f5f5f5', logoAccent: '#5a5a5a', svg: '' },
    bizplan: { data: null },
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
      if (Array.isArray(res)) {
        // Fetch identity rows to get colors for previews
        const identityData = await supabase.from('project_data').selectWhere('step', 'identity', session.access_token);

        const enriched = res.map(p => {
          const identityRow = identityData.find(d => d.project_id === p.id);
          const colors = identityRow?.data?.kit?.colors;
          const previewColors = colors ? [colors.background, colors.surface, colors.primary, colors.text, colors.accent] : null;
          return { ...p, previewColors };
        });

        setProjects(enriched.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
      }
    } catch (e) { }
  };

  const [creating, setCreating] = useState(false);

  const createBrand = async () => {
    console.log("--- CREATE BRAND DEBUG ---");
    console.log("Full Session Object:", session);

    if (!session || !session.user || !session.access_token) {
      console.error("DEBUG: Invalid session state. session.user.id:", session?.user?.id);
      return;
    }

    const userId = session.user.id;
    console.log("Target User ID:", userId);

    try {
      console.log("Attempting insert...");
      // Simplified insert as requested
      const res = await supabase.from('projects').insert([{
        user_id: userId,
        title: 'New Brand'
      }], session.access_token);

      console.log("Insert Response:", res);

      // Handle array or object return
      const newProject = Array.isArray(res) ? res[0] : res;

      if (newProject && newProject.id) {
        console.log("SUCCESS: Project created:", newProject.id);
        setCurrentProject(newProject);
        setStepData(initStepData());
        setScreen('builder');
      } else {
        console.error("ERROR: No project ID in response. Full response:", res);
      }
    } catch (err) {
      console.error("--- INSERT FAILED ---");
      console.error("Error Message:", err.message);
      console.error("Full Error Object:", err);
      alert("Create failed. See browser console for details.");
    }
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

      // ── Auto-update project title ────────────────────────────────
      // Priority: selected brand name > locked idea > nothing
      let newTitle = null;
      if (step === 'name' && dataSubset.selectedName) {
        newTitle = dataSubset.selectedName;
      } else if (step === 'idea' && dataSubset.locked && updatedStep.chosenIdea) {
        // Only use idea text if no brand name has been chosen yet
        const alreadyNamed = stepData.name?.selectedName;
        if (!alreadyNamed) newTitle = updatedStep.chosenIdea.slice(0, 60);
      }
      if (newTitle && newTitle !== currentProject.title) {
        await supabase.from('projects').update({ title: newTitle }, 'id', currentProject.id, session.access_token);
        setCurrentProject(prev => ({ ...prev, title: newTitle }));
      }
    } catch (e) { }
  };

  if (screen === 'auth') return <AuthScreen setScreen={setScreen} setSession={setSession} supabase={supabase} />;
  if (screen === 'dashboard') return <DashboardScreen session={session} setSession={setSession} supabase={supabase} setScreen={setScreen} projects={projects} loadProjects={loadProjects} createBrand={createBrand} loadProject={loadProject} creating={creating} />;
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
          <h1 className="text-xl font-bold">Brandsmith AI</h1>
        </div>
        <div className="mt-12 md:mt-0">
          <h2 className="text-[32px] md:text-[48px] leading-[1] mb-6 md:mb-12 max-w-[400px]">Forge your brand from idea to identity.</h2>
          <p className="hidden md:block text-[#5a5a5a] text-sm max-w-[280px] leading-relaxed">From raw idea to complete brand kit — name, logo, colors, voice, and more.</p>
        </div>
        <div className="hidden md:block text-[10px] text-[#5a5a5a]">
          © 2025 Brandsmith AI
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
      await supabase.from('project_data').delete('project_id', id, session.access_token);
      await supabase.from('projects').delete('id', id, session.access_token);
      loadProjects();
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Failed to delete project: " + e.message);
    }
  };

  const total = projects.length;
  const completed = projects.filter(p => p.status === 'complete').length;
  const inProgress = total - completed;

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="h-[56px] border-b border-[#1a1a1a] px-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <BrandsmithLogo size={20} />
          <h1 className="text-xs md:text-sm font-bold">Brandsmith AI</h1>
        </div>
        <div className="flex gap-2 md:gap-6">
          <ButtonPrimary onClick={createBrand} className="text-[9px] md:text-[10px] py-1 px-3 md:py-1.5 md:px-4 font-bold">New brand</ButtonPrimary>
          <ButtonText onClick={() => { setSession(null); setScreen('auth'); }} className="text-[9px] md:text-xs">Logout</ButtonText>
        </div>
      </div>

      <div className="max-w-[960px] mx-auto py-10 md:py-20 px-6 md:px-12">
        <div className="mb-12">
          <label className="text-[9px] md:text-[10px] text-[#5a5a5a] block mb-2 font-bold uppercase tracking-widest">Workspace</label>
          <h2 className="text-3xl md:text-4xl mb-12">Active Brands</h2>

          <div className="grid grid-cols-3 gap-1 mb-16">
            <div className="bg-[#101010] border border-[#1a1a1a] p-6 text-center">
              <p className="text-[10px] text-[#5a5a5a] font-bold uppercase tracking-widest mb-2">Total</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <div className="bg-[#101010] border border-[#1a1a1a] p-6 text-center">
              <p className="text-[10px] text-[#5a5a5a] font-bold uppercase tracking-widest mb-2">Completed</p>
              <p className="text-2xl font-bold">{completed}</p>
            </div>
            <div className="bg-[#101010] border border-[#1a1a1a] p-6 text-center">
              <p className="text-[10px] text-[#5a5a5a] font-bold uppercase tracking-widest mb-2">In Progress</p>
              <p className="text-2xl font-bold">{inProgress}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-1">
          <div
            onClick={createBrand}
            className="h-[220px] bg-[#080808] border border-dashed border-[#1a1a1a] rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#2e2e2e] group"
          >
            <Plus size={32} className="text-[#5a5a5a] group-hover:text-white transition-all mb-4" />
            <span className="text-[10px] text-[#5a5a5a] font-bold uppercase tracking-widest group-hover:text-white transition-all">Start a new brand</span>
          </div>

          {projects.map(p => (
            <div
              key={p.id}
              className="h-[220px] bg-[#101010] border border-[#1a1a1a] rounded-sm p-8 flex flex-col justify-between transition-all hover:border-[#2e2e2e] group relative"
            >
              <button
                onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                className="absolute top-6 right-6 text-[#3a3a3a] hover:text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.status === 'complete' ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-[#2e2e2e]'}`} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#5a5a5a]">
                    {p.status === 'complete' ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl leading-tight mb-2 line-clamp-2 pr-6 h-[3.5rem]">{p.title || 'Untitled Brand'}</h3>
                  <p className="text-[10px] text-[#3a3a3a] mono">{new Date(p.updated_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-1">
                  {p.previewColors ? (
                    p.previewColors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-sm border border-white/5" style={{ backgroundColor: c }} />
                    ))
                  ) : (
                    [1, 2, 3, 4, 5].map(i => <div key={i} className="w-4 h-4 bg-[#1a1a1a] rounded-sm" />)
                  )}
                </div>
                <ButtonGhost onClick={() => loadProject(p)} className="text-[10px] py-1.5 w-full uppercase tracking-widest font-bold">Open Brand →</ButtonGhost>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-20 py-20 border border-dashed border-[#1a1a1a] text-center">
            <p className="text-[#5a5a5a] text-sm italic mb-6">No brands yet. Create your first one →</p>
            <ButtonPrimary onClick={createBrand}>Start Forging</ButtonPrimary>
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
    { id: 5, icon: Briefcase, title: "Business Plan", key: "bizplan" },
    { id: 6, icon: Download, title: "Export", key: "export" },
  ];

  const goNext = () => setCurrentStep(prev => prev < 6 ? prev + 1 : prev);
  const goPrev = () => setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
  const backToDash = () => { loadProjects(); setScreen("dashboard"); };

  const isStepDone = (key) => {
    if (key === 'idea') return !!stepData.idea.locked;
    if (key === 'name') return !!stepData.name.selectedName;
    if (key === 'availability') return !!stepData.availability.checked;
    if (key === 'identity') return !!stepData.identity.kit;
    if (key === 'bizplan') return !!stepData.bizplan.data;
    if (key === 'export') return currentProject?.status === 'complete';
    return false;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#080808] text-[#f5f5f5] overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:flex w-[228px] border-r border-[#1a1a1a] flex-col shrink-0">
        <div className="h-[56px] border-b border-[#1a1a1a] px-6 flex items-center gap-3 cursor-pointer" onClick={backToDash}>
          <BrandsmithLogo size={20} />
          <span className="text-xs font-bold">Brandsmith AI</span>
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
          <ButtonText onClick={backToDash} className="text-[10px]">← Back to dashboard</ButtonText>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden h-[56px] border-b border-[#1a1a1a] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3" onClick={backToDash}>
            <BrandsmithLogo size={18} />
            <span className="text-xs font-bold">Brandsmith AI</span>
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
            {currentStep === 5 && <BizPlanStep ideaData={stepData.idea} nameData={stepData.name} identityData={stepData.identity} data={stepData.bizplan} onSave={(d) => saveStepData('bizplan', d)} goNext={goNext} />}
            {currentStep === 6 && <ExportStep stepData={stepData} currentProject={currentProject} supabase={supabase} session={session} setCurrentProject={setCurrentProject} />}
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
  const [valLoading, setValLoading] = useState(false);
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

  const validateIdea = async () => {
    setValLoading(true);
    try {
      const prompt = `You are a venture capital analyst. Validate this business idea based on the provided market research. 
      Return ONLY a JSON object with: 
      {
        "viabilityScore": number (0-100),
        "marketOpportunity": "High" | "Medium" | "Low",
        "competitionLevel": "High" | "Medium" | "Low",
        "executionDifficulty": "Easy" | "Medium" | "Hard",
        "verdict": "string",
        "risks": ["risk1", "risk2", "risk3"],
        "strengths": ["strength1", "strength2", "strength3"]
      }`;
      const context = `Market Research: ${data.recommendation}`;
      const res = await streamGroq(prompt, context, () => { });
      const validation = parseAIJsonStr(res);
      onSave({ validation });
    } catch (e) {
      console.error("Validation error:", e);
    }
    setValLoading(false);
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
      {data.validation && (
        <div className="md:col-span-2 bg-[#101010] border border-[#1a1a1a] p-8 border-t-0 -mt-1">
          <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Validation Record</label>
          <div className="text-3xl font-bold mb-2">SCORE: {data.validation.viabilityScore}%</div>
          <p className="text-sm text-[#5a5a5a] italic">{data.validation.verdict}</p>
        </div>
      )}
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
            label="Brand pitch"
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

          {!data.validation && !valLoading && (
            <div className="mt-12 flex justify-center">
              <ButtonGhost onClick={validateIdea} className="px-12 py-3 border-[#2e2e2e]">Validate My Idea</ButtonGhost>
            </div>
          )}

          {valLoading && (
            <div className="mt-12 text-center py-10 border border-dashed border-[#1a1a1a]">
              <div className="mono text-[10px] animate-pulse">RUNNING SIMULATIONS...</div>
            </div>
          )}

          {data.validation && (
            <div className="mt-16 space-y-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-8 text-center flex flex-col justify-center">
                  <label className="text-[9px] text-[#444] block mb-2 font-bold uppercase tracking-widest">Viability</label>
                  <div className={`text-5xl font-bold ${data.validation.viabilityScore > 70 ? 'text-[#00ff9d]' : data.validation.viabilityScore > 40 ? 'text-[#ffcc00]' : 'text-[#ff3d3d]'}`}>
                    {data.validation.viabilityScore}
                  </div>
                </div>
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-8 text-center">
                  <label className="text-[9px] text-[#444] block mb-2 font-bold uppercase tracking-widest">Opportunity</label>
                  <div className="text-xl font-bold uppercase tracking-tighter">{data.validation.marketOpportunity}</div>
                </div>
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-8 text-center">
                  <label className="text-[9px] text-[#444] block mb-2 font-bold uppercase tracking-widest">Competition</label>
                  <div className="text-xl font-bold uppercase tracking-tighter">{data.validation.competitionLevel}</div>
                </div>
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-8 text-center">
                  <label className="text-[9px] text-[#444] block mb-2 font-bold uppercase tracking-widest">Difficulty</label>
                  <div className="text-xl font-bold uppercase tracking-tighter">{data.validation.executionDifficulty}</div>
                </div>
              </div>

              <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-8">
                <label className="text-[9px] text-[#444] block mb-4 font-bold uppercase tracking-widest">Market Verdict</label>
                <p className="text-sm leading-relaxed text-[#f5f5f5]">{data.validation.verdict}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-8">
                  <label className="text-[9px] text-[#444] block mb-6 font-bold uppercase tracking-widest text-emerald-500">Core Strengths</label>
                  <ul className="space-y-4">
                    {data.validation.strengths.map((s, i) => (
                      <li key={i} className="text-xs flex gap-3"><span className="text-emerald-500">↑</span> {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-8">
                  <label className="text-[9px] text-[#444] block mb-6 font-bold uppercase tracking-widest text-rose-500">Critical Risks</label>
                  <ul className="space-y-4">
                    {data.validation.risks.map((r, i) => (
                      <li key={i} className="text-xs flex gap-3"><span className="text-rose-500">↓</span> {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 pt-12 border-t border-[#1a1a1a]">
            <InputField label="Your Final Vision" value={data.chosenIdea || ''} onChange={e => onSave({ chosenIdea: e.target.value })} placeholder="State the final vision clearly..." />
            <ButtonPrimary onClick={() => data.chosenIdea && onSave({ locked: true })} className="mt-4">Lock & Continue →</ButtonPrimary>
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
      // ── 1. Fetch colors from Huemint ──────────────────────────────
      const moodSettings = {
        "clean blues and whites": { temperature: "0.8", palette: ["#ffffff", "-", "#4a90d9", "-", "-"] },
        "dark and bold": { temperature: "1.0", palette: ["#111111", "-", "-", "#ffffff", "-"] },
        "warm and earthy": { temperature: "1.2", palette: ["-", "-", "#c8763a", "-", "-"] },
        "vibrant and colorful": { temperature: "1.8", palette: ["-", "-", "-", "-", "-"] },
        "minimal and neutral": { temperature: "0.5", palette: ["#f5f5f5", "-", "#333333", "-", "-"] },
        "default": { temperature: "1.2", palette: ["-", "-", "-", "-", "-"] },
      };

      const colorMoodInput = (data.answers.colorMood || "").toLowerCase().trim();
      const moodKey = Object.keys(moodSettings).find(k =>
        k !== "default" && colorMoodInput.includes(k)
      ) || "default";
      const mood = moodSettings[moodKey];

      let palette = ["#080808", "#101010", "#4a90d9", "#f5f5f5", "#5a5a5a"]; // safe fallback
      try {
        const huemintRes = await fetch("https://api.huemint.com/color", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "transformer",
            num_colors: 5,
            temperature: mood.temperature,
            num_results: 5,
            adjacency: ["0", "65", "45", "35", "25", "65", "0", "35", "65", "45", "45", "35", "0", "35", "65", "35", "65", "35", "0", "35", "25", "45", "65", "35", "0"],
            palette: mood.palette,
          }),
        });
        if (huemintRes.ok) {
          const huemintData = await huemintRes.json();
          const raw = huemintData?.results?.[0]?.palette;
          if (Array.isArray(raw) && raw.length === 5) palette = raw;
        }
      } catch (colorErr) {
        console.warn("Huemint API failed, using fallback palette:", colorErr);
      }

      // Map palette indices to semantic roles
      const colors = {
        background: palette[0],
        surface: palette[1],
        primary: palette[2],
        text: palette[3],
        accent: palette[4],
        // keep legacy keys so logo + export still work
        dark: palette[0],
        neutral: palette[1],
      };

      // ── 2. Fetch fonts + taglines + voice from Groq ───────────────
      const prompt = `You are an expert branding strategist. Generate a complete brand identity kit and return ONLY a valid JSON object with EXACTLY this structure:
{
  "fonts": { "display": "Font Name", "displayDesc": "one-line description", "body": "Font Name", "bodyDesc": "one-line description" },
  "taglines": ["tagline 1", "tagline 2", "tagline 3"],
  "voice": { "tone": "overall tone description", "dos": ["do 1", "do 2", "do 3"], "donts": ["dont 1", "dont 2", "dont 3"] }
}
Return ONLY the JSON object. No markdown, no explanation.`;
      const msg = `Brand Name: ${name}\nBrand Idea: ${idea}\nBrand Details: ${JSON.stringify(data.answers)}`;
      const res = await streamGroq(prompt, msg, () => { });
      const kit = parseAIJsonStr(res);

      if (kit) {
        kit.colors = colors;
        // Normalize: support both 'typography' and 'fonts' keys from the AI
        if (!kit.fonts && kit.typography) {
          kit.fonts = {
            display: kit.typography.display || kit.typography.displayFont || '',
            displayDesc: kit.typography.displayDesc || '',
            body: kit.typography.body || kit.typography.bodyFont || '',
            bodyDesc: kit.typography.bodyDesc || '',
          };
        }
        // Normalize voice dos/donts
        if (kit.voice) {
          kit.voice.donts = kit.voice.donts || kit.voice.dont || kit.voice["don'ts"] || [];
          kit.voice.dos = kit.voice.dos || kit.voice.do || [];
        }
        onSave({ kit, logoColor: colors.primary, logoAccent: colors.accent });
      }
    } catch (e) { console.error('buildKit error:', e); }
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
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'background', label: 'Background' },
                { key: 'surface', label: 'Surface' },
                { key: 'primary', label: 'Primary' },
                { key: 'text', label: 'Text' },
                { key: 'accent', label: 'Accent' },
              ].map(({ key, label }) => {
                const hex = data.kit.colors?.[key];
                if (!hex) return null;
                // pick a readable label color based on perceived lightness
                const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
                const light = (r * 299 + g * 587 + b * 114) / 1000 > 128;
                return (
                  <div key={key} className="flex-1 min-w-[80px] border border-[#1a1a1a] overflow-hidden">
                    <div className="h-20 w-full" style={{ backgroundColor: hex }} />
                    <div className="bg-[#101010] p-3 text-center">
                      <div className="text-[9px] text-[#5a5a5a] mb-1">{label}</div>
                      <div className="mono text-[10px] text-[#f5f5f5]">{hex.toUpperCase()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <label className="text-[10px] text-[#5a5a5a] block mb-6">Typography protocol</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <div className="bg-[#101010] border border-[#1a1a1a] p-8">
                <p className="text-[10px] text-[#5a5a5a] mb-4">Display</p>
                <p className="text-3xl font-bold mb-2">
                  {data.kit.fonts?.display || data.kit.typography?.display || data.kit.typography?.displayFont || '—'}
                </p>
                <p className="text-xs text-[#5a5a5a] leading-relaxed">
                  {data.kit.fonts?.displayDesc || data.kit.typography?.displayDesc || ''}
                </p>
              </div>
              <div className="bg-[#101010] border border-[#1a1a1a] p-8">
                <p className="text-[10px] text-[#5a5a5a] mb-4">Body</p>
                <p className="text-3xl mb-2">
                  {data.kit.fonts?.body || data.kit.typography?.body || data.kit.typography?.bodyFont || '—'}
                </p>
                <p className="text-xs text-[#5a5a5a] leading-relaxed">
                  {data.kit.fonts?.bodyDesc || data.kit.typography?.bodyDesc || ''}
                </p>
              </div>
            </div>
          </section>

          <section>
            <label className="text-[10px] text-[#5a5a5a] block mb-2">Nomenclature taglines</label>
            <p className="text-[10px] text-[#3a3a3a] mb-6">Select one to use as your primary tagline.</p>
            <div className="space-y-2">
              {data.kit.taglines?.map((t, i) => {
                const selected = data.selectedTagline === t;
                return (
                  <button
                    key={i}
                    onClick={() => onSave({ selectedTagline: selected ? null : t })}
                    className={`w-full text-left p-6 border-l-2 transition-all ${selected
                      ? 'border-white bg-[#141414] text-white'
                      : 'border-[#2e2e2e] bg-transparent text-[#888888] hover:border-[#4a4a4a] hover:text-[#c8c8c8] hover:bg-[#0d0d0d]'
                      }`}
                  >
                    <span className="text-xl italic">"{t}"</span>
                    {selected && (
                      <span className="ml-4 text-[9px] font-bold text-[#5a5a5a] align-middle not-italic">SELECTED</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-[#101010] border border-[#1a1a1a] p-8">
            <label className="text-[10px] text-[#5a5a5a] block mb-6">Voice architecture</label>
            <h4 className="text-xl mb-4">{data.kit.voice?.tone || '—'}</h4>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-[10px] font-bold text-[#5a5a5a] mb-4">Protocol DO</p>
                <ul className="space-y-3">
                  {(data.kit.voice?.dos || data.kit.voice?.do || []).map((d, i) => (
                    <li key={i} className="text-sm text-[#5a5a5a]">/ {d}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5a5a5a] mb-4">Protocol DON'T</p>
                <ul className="space-y-3">
                  {(data.kit.voice?.donts || data.kit.voice?.dont || data.kit.voice?.["don'ts"] || []).map((d, i) => (
                    <li key={i} className="text-sm text-[#5a5a5a]">/ {d}</li>
                  ))}
                </ul>
              </div>
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

// ── STEP 05: BUSINESS PLAN ──
function BizPlanStep({ ideaData, nameData, identityData, data, onSave, goNext }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const renderField = (val) => {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      // If the AI still returns an object, try to reconstruct a descriptive sentence
      const values = Object.values(val);
      if (values.length > 0) {
        return values.join('. ') + '.';
      }
      return JSON.stringify(val);
    }
    return val;
  };

  const generatePlan = async () => {
    console.log("BizPlanStep: Starting generation...");
    setLoading(true);
    setError(null);
    try {
      const systemPrompt = `You are a world-class business plan writer. Generate a comprehensive investor-ready business plan. Return a JSON object with: {executiveSummary, problemSolution, targetMarket, productDescription, revenueModel, marketingStrategy, competitorAnalysis, financialProjections (array of 12 months with {month, revenue, expenses, profit}), milestones (array of {month, goal})}. 

IMPORTANT: Every single field must be a plain human-readable paragraph string. Never use nested objects or key-value pairs. 
For example, targetMarket should be: 'We target busy professionals and families aged 25-45 in urban areas who want healthy homemade food.' 
NOT an object with location/demographics/psychographics keys. 
Same for revenueModel, marketingStrategy and all other fields.
Return ONLY valid JSON.`;
      const userMessage = `Business: ${ideaData?.chosenIdea}, Brand: ${nameData?.selectedName}, Audience: ${identityData?.answers?.audience}, Values: ${identityData?.answers?.values}`;

      console.log("BizPlanStep: Calling Groq API...");
      const res = await streamGroq(systemPrompt, userMessage, () => { });
      console.log("BizPlanStep: API response received. Length:", res?.length);

      try {
        const plan = parseAIJsonStr(res);
        console.log("BizPlanStep: JSON parsed successfully.");
        if (plan && typeof plan === 'object') {
          onSave({ data: plan });
        } else {
          throw new Error("Invalid plan format returned from AI.");
        }
      } catch (jsonErr) {
        console.error("BizPlanStep: JSON parse failed:", jsonErr);
        setError("The AI generated an invalid plan format. Please try again.");
      }
    } catch (e) {
      console.error("BizPlanStep: Generation error:", e);
      setError("Failed to generate plan. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const plan = data?.data;

  return (
    <div className="space-y-12">
      <div className="mb-10">
        <h2 className="text-xl md:text-2xl mb-2">Business Architecture</h2>
        <p className="text-[#5a5a5a] text-xs leading-relaxed max-w-lg">Forge the commercial foundation of your brand with an investor-ready roadmap.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 text-center animate-in fade-in">
          <p className="text-red-500 text-xs mb-4">{error}</p>
          <ButtonPrimary onClick={generatePlan} disabled={loading}>
            {loading ? "Constructing Roadmap..." : "Try again →"}
          </ButtonPrimary>
        </div>
      )}

      {!plan && !error && (
        <div className="bg-[#101010] border border-[#1a1a1a] p-12 text-center">
          <ButtonPrimary onClick={generatePlan} disabled={loading} className="w-64">
            {loading ? "Constructing Roadmap..." : "Generate Business Plan →"}
          </ButtonPrimary>
        </div>
      )}

      {plan && typeof plan === 'object' && (
        <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[#101010] border border-[#1a1a1a] p-8">
            <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Executive Summary</label>
            <p className="text-sm leading-relaxed text-[#f5f5f5] whitespace-pre-wrap">{renderField(plan.executiveSummary) || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="bg-[#101010] border border-[#1a1a1a] p-8">
              <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Problem / Solution</label>
              <p className="text-sm leading-relaxed text-[#f5f5f5] whitespace-pre-wrap">{renderField(plan.problemSolution) || 'N/A'}</p>
            </div>
            <div className="bg-[#101010] border border-[#1a1a1a] p-8">
              <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Target Market</label>
              <p className="text-sm leading-relaxed text-[#f5f5f5] whitespace-pre-wrap">{renderField(plan.targetMarket) || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-[#101010] border border-[#1a1a1a] p-8">
            <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Product Description</label>
            <p className="text-sm leading-relaxed text-[#f5f5f5] whitespace-pre-wrap">{renderField(plan.productDescription) || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="bg-[#101010] border border-[#1a1a1a] p-8">
              <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Revenue Model</label>
              <p className="text-sm leading-relaxed text-[#f5f5f5] whitespace-pre-wrap">{renderField(plan.revenueModel) || 'N/A'}</p>
            </div>
            <div className="bg-[#101010] border border-[#1a1a1a] p-8">
              <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Marketing Strategy</label>
              <p className="text-sm leading-relaxed text-[#f5f5f5] whitespace-pre-wrap">{renderField(plan.marketingStrategy) || 'N/A'}</p>
            </div>
          </div>

          <div className="bg-[#101010] border border-[#1a1a1a] p-8">
            <label className="text-[10px] text-[#5a5a5a] block mb-4 font-bold uppercase tracking-widest">Growth Milestones</label>
            <div className="space-y-4">
              {plan.milestones && Array.isArray(plan.milestones) ? (
                (() => {
                  console.log("BizPlanStep: Raw milestones:", plan.milestones);
                  return plan.milestones.map((m, i) => {
                    let month, goal;
                    if (typeof m === 'string') {
                      month = `Month ${i + 1}`;
                      goal = m;
                    } else {
                      month = m.month || m.date || m.timeframe || m.period || `Month ${i + 1}`;
                      goal = m.goal || m.milestone || m.description || m.objective || m.achievement || '';
                    }
                    const cleanGoal = goal.replace(/^Month\s+\d+:\s*/i, '');
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="mono text-[10px] text-[#5a5a5a] min-w-[80px] shrink-0">{month}</span>
                        <span className="text-xs text-[#f5f5f5]">{cleanGoal}</span>
                      </div>
                    );
                  });
                })()
              ) : <p className="text-[#5a5a5a] text-xs">No milestones generated.</p>}
            </div>
          </div>

          <div className="pt-8">
            <ButtonPrimary onClick={goNext}>Proceed to export →</ButtonPrimary>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STEP 06: EXPORT ──
function ExportStep({ stepData, currentProject, supabase, session, setCurrentProject }) {
  const [success, setSuccess] = useState('');

  const checks = [
    { n: "Idea verification", d: stepData.idea.locked },
    { n: "Nomenclature lock", d: stepData.name.locked },
    { n: "Digital presence map", d: stepData.availability.checked },
    { n: "Identity architecture", d: !!stepData.identity.kit },
    { n: "Business roadmap", d: !!stepData.bizplan.data }
  ];
  const progress = (checks.filter(c => c.d).length / checks.length) * 100;

  const generateHTML = () => {
    const d = stepData;
    const kit = d.identity.kit || {};
    const plan = d.bizplan.data || {};
    const brandName = d.name.selectedName || 'Brand';
    const colors = kit.colors || {};
    const fonts = kit.fonts || kit.typography || {};
    const displayFont = fonts.display || 'Syne';
    const bodyFont = fonts.body || 'Inter';
    const voice = kit.voice || {};
    const dos = voice.dos || voice.do || [];
    const donts = voice.donts || voice.dont || voice["don'ts"] || [];
    const selectedTagline = d.identity.selectedTagline || '';

    const renderField = (val) => {
      if (!val) return '';
      if (typeof val === 'object' && !Array.isArray(val)) {
        return Object.entries(val).map(([k, v]) => `${v}`).join('. ');
      }
      return val;
    };

    const paletteRows = [
      { key: 'background', label: 'Background' },
      { key: 'surface', label: 'Surface' },
      { key: 'primary', label: 'Primary' },
      { key: 'text', label: 'Text' },
      { key: 'accent', label: 'Accent' },
    ].map(({ key, label }) => {
      const hex = colors[key];
      if (!hex) return '';
      return `<div class="swatch-item"><div class="swatch-block" style="background:${hex};"></div><p class="swatch-label">${label}</p><p class="swatch-hex">${hex.toUpperCase()}</p></div>`;
    }).join('');

    const gFonts = [...new Set([displayFont, bodyFont])].map(f => f.replace(/ /g, '+')).join('&family=');
    const gFontsUrl = `https://fonts.googleapis.com/css2?family=${gFonts}:ital,wght@0,400;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${brandName} — Brand Kit</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${gFontsUrl}" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080808; --card: #101010; --border: #1e1e1e;
      --text: #f0f0f0; --muted: #5a5a5a; --dim: #2e2e2e;
      --primary: ${colors.primary || '#ffffff'};
      --accent:  ${colors.accent || '#5a5a5a'};
    }
    body { background: var(--bg); color: var(--text); font-family: '${bodyFont}', 'Inter', sans-serif; font-size: 14px; line-height: 1.7; }
    .page { max-width: 900px; margin: 0 auto; padding: 60px 40px 100px; }
    /* Cover */
    .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 260px; max-height: 300px; border-bottom: 1px solid var(--border); padding: 60px 40px; margin-bottom: 60px; }
    .logo-wrap { width: 80px; height: 80px; margin-bottom: 24px; }
    .logo-wrap svg, .logo-wrap img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .cover-name { font-family: '${displayFont}', 'Syne', sans-serif; font-weight: 800; font-size: 52px; letter-spacing: -2px; line-height: 1; color: #fff; margin-bottom: 12px; }
    .cover-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 4px; color: var(--muted); text-transform: uppercase; }
    /* Sections */
    .section { margin-bottom: 48px; }
    .section-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .card { background: var(--card); border: 1px solid var(--border); padding: 32px; margin-bottom: 2px; }
    /* Color palette */
    .palette { display: flex; gap: 2px; }
    .swatch-item { flex: 1; min-width: 0; }
    .swatch-block { height: 80px; width: 100%; border: 1px solid var(--border); }
    .swatch-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
    .swatch-hex { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text); margin-top: 3px; }
    /* Typography */
    .type-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
    .type-card { background: var(--card); border: 1px solid var(--border); padding: 32px; }
    .type-role { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
    .type-name { font-size: 26px; font-weight: 700; color: #fff; margin-bottom: 12px; }
    .type-sample { font-size: 13px; color: #888; line-height: 1.6; font-style: italic; }
    .type-desc { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--dim); margin-top: 10px; }
    /* Tagline */
    .tagline-hero { border-left: 3px solid var(--primary); border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 28px 36px; background: var(--card); font-style: italic; font-size: 22px; color: #f0f0f0; line-height: 1.4; }
    /* Voice */
    .voice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
    .voice-card { background: var(--card); border: 1px solid var(--border); padding: 32px; }
    .voice-head { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; }
    .voice-tone { font-size: 16px; color: #e0e0e0; font-style: italic; margin-bottom: 20px; }
    .vlist { list-style: none; }
    .vlist li { font-size: 13px; color: #c0c0c0; padding: 9px 0; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; gap: 12px; }
    .vlist li:last-child { border-bottom: none; }
    .vlist .bul { color: var(--primary); flex-shrink: 0; font-size: 14px; line-height: 1.5; }
    .vlist.dont .bul { color: var(--muted); }
    /* Biz */
    .biz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
    .biz-card { background: var(--card); border: 1px solid var(--border); padding: 28px; }
    .biz-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
    .biz-txt { font-size: 13px; color: #c0c0c0; line-height: 1.7; }
    .mrow { display: flex; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--border); align-items: baseline; }
    .mrow:last-child { border-bottom: none; }
    .mmonth { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); min-width: 80px; }
    .mgoal { font-size: 13px; color: #c0c0c0; }
    /* Footer */
    .footer { margin-top: 80px; padding-top: 28px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-family: '${displayFont}', 'Syne', sans-serif; font-weight: 800; font-size: 13px; color: var(--dim); }
    .footer-credit { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; }
    @media print {
      body { background: #fff !important; color: #111 !important; }
      .card, .type-card, .voice-card, .biz-card { background: #fff !important; border-color: #ddd !important; }
      .section-label, .type-role, .voice-head, .biz-lbl { color: #999 !important; }
      .cover-name, .type-name { color: #111 !important; }
      .tagline-hero { background: #fff !important; border-color: #ddd !important; color: #111 !important; }
      .footer { border-color: #ddd !important; }
      .swatch-hex { color: #333 !important; }
      .vlist li { border-color: #ddd !important; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Cover -->
    <div class="cover">
      <div class="logo-wrap">${d.identity.svg || `<img src="${BRANDSMITH_LOGO}" alt="${brandName}" />`}</div>
      <h1 class="cover-name">${brandName}</h1>
      <p class="cover-sub">Brand Identity Kit &middot; ${new Date().getFullYear()}</p>
    </div>

    <!-- Vision -->
    <div class="section">
      <p class="section-label">The Vision</p>
      <div class="card">
        <p style="font-size:15px;line-height:1.8;color:#c8c8c8;">${d.idea.chosenIdea || ''}</p>
      </div>
    </div>

    <!-- Color Palette -->
    <div class="section">
      <p class="section-label">Color Palette</p>
      <div class="palette">${paletteRows}</div>
    </div>

    <!-- Typography -->
    <div class="section">
      <p class="section-label">Typography</p>
      <div class="type-row">
        <div class="type-card">
          <p class="type-role">Display Typeface</p>
          <p class="type-name" style="font-family:'${displayFont}',sans-serif;">${displayFont}</p>
          <p class="type-sample" style="font-family:'${displayFont}',sans-serif;">The quick brown fox jumps over the lazy dog.</p>
          <p class="type-desc">${fonts.displayDesc || ''}</p>
        </div>
        <div class="type-card">
          <p class="type-role">Body Typeface</p>
          <p class="type-name" style="font-family:'${bodyFont}',sans-serif;">${bodyFont}</p>
          <p class="type-sample" style="font-family:'${bodyFont}',sans-serif;">The quick brown fox jumps over the lazy dog.</p>
          <p class="type-desc">${fonts.bodyDesc || ''}</p>
        </div>
      </div>
    </div>

    <!-- Tagline -->
    ${selectedTagline ? `
    <div class="section">
      <p class="section-label">Primary Tagline</p>
      <div class="tagline-hero">&ldquo;${selectedTagline}&rdquo;</div>
    </div>` : ''}

    <!-- Voice -->
    <div class="section">
      <p class="section-label">Brand Voice</p>
      ${voice.tone ? `<p class="voice-tone">${voice.tone}</p>` : ''}
      <div class="voice-grid">
        <div class="voice-card">
          <p class="voice-head">&#10003;&nbsp;&nbsp;Do</p>
          <ul class="vlist">
            ${dos.map(item => `<li><span class="bul">&#8599;</span><span>${item}</span></li>`).join('')}
          </ul>
        </div>
        <div class="voice-card">
          <p class="voice-head">&#10005;&nbsp;&nbsp;Don&rsquo;t</p>
          <ul class="vlist dont">
            ${donts.map(item => `<li><span class="bul">&#8600;</span><span>${item}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    ${plan.executiveSummary ? `
    <!-- Business Strategy -->
    <div class="section">
      <p class="section-label">Business Strategy</p>
      <div class="card" style="margin-bottom:2px;">
        <p class="biz-lbl">Executive Summary</p>
        <p class="biz-txt">${renderField(plan.executiveSummary)}</p>
      </div>
      <div class="biz-grid">
        <div class="biz-card"><p class="biz-lbl">Problem / Solution</p><p class="biz-txt">${renderField(plan.problemSolution || '')}</p></div>
        <div class="biz-card"><p class="biz-lbl">Target Market</p><p class="biz-txt">${renderField(plan.targetMarket || '')}</p></div>
        <div class="biz-card"><p class="biz-lbl">Revenue Model</p><p class="biz-txt">${renderField(plan.revenueModel || '')}</p></div>
        <div class="biz-card"><p class="biz-lbl">Marketing Strategy</p><p class="biz-txt">${renderField(plan.marketingStrategy || '')}</p></div>
      </div>
    </div>

    ${(plan.milestones || []).length ? `
    <div class="section">
      <p class="section-label">Growth Milestones</p>
      <div class="card">
        ${(plan.milestones || []).map((m, i) => {
      let month, goal;
      if (typeof m === 'string') {
        month = `Month ${i + 1}`;
        goal = m;
      } else {
        month = m.month || m.date || m.timeframe || m.period || `Month ${i + 1}`;
        goal = m.goal || m.milestone || m.description || m.objective || m.achievement || '';
      }
      const cleanGoal = goal.replace(/^Month\s+\d+:\s*/i, '');
      return `<div class="mrow"><span class="mmonth">${month}</span><span class="mgoal">${cleanGoal}</span></div>`;
    }).join('')}
      </div>
    </div>` : ''}
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <span class="footer-brand">${brandName}</span>
      <span class="footer-credit">Created with Brandsmith AI</span>
    </div>

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
    setSuccess('Brand Kit Downloaded Successfully ✓');
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
        <label className="text-[10px] text-[#5a5a5a] block mb-8 font-bold">Brand complete ✓</label>

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

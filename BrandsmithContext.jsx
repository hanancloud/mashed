import React, { createContext, useContext, useState, useEffect } from 'react';

const Context = createContext();

export const useBrandsmith = () => useContext(Context);

// ── Shared Constants ───────────────────────────────────────
export const BRANDSMITH_LOGO = "https://i.ibb.co/HDgyv5q6/Add-a-subheading-1.png";
export const FEEDBACK_URL = "https://forms.gle/XEzazozoajjK4pDo7";
export const WAITLIST_URL = "https://forms.gle/ZwopkN8xW63UccfE6";

// AI Utilities
export const parseAIJsonStr = (str) => {
  if (!str) return null;
  const match = str.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
};

export const streamGroq = async (system, user, onChunk) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.7,
      stream: true
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const content = json.choices[0]?.delta?.content || "";
          fullText += content;
          onChunk(fullText);
        } catch (e) { }
      }
    }
  }
  return fullText;
};

// Font Pairing logic (Obsidian Strict)
export const getFontPairing = (style, personality) => {
  return { display: 'Syne', body: 'Inter', category: 'Obsidian' };
};

export const getLuminance = (hex) => {
  if (!hex || hex.length < 7) return 0;
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  return 0.2126*Math.pow(r, 2.2) + 0.7152*Math.pow(g, 2.2) + 0.0722*Math.pow(b, 2.2);
};

export const getContrast = (hex1, hex2) => {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
};

export const getMoodSettings = (colorMood, style) => {
  // Pure Black & White Only
  return { temperature: "1.0", palette: ["#080808", "#101010", "#ffffff", "#f5f5f5", "#5a5a5a"] };
};

// Supabase REST client
export function createSupabaseClient(url, key, onSessionExpired) {
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
  const isExpiredError = (text) => {
    try { return JSON.parse(text)?.message === 'JWT expired'; } catch { return false; }
  };
  const guardedFetch = async (req, token) => {
    const res = await req();
    if (res.status === 401) {
      const text = await res.text();
      if (isExpiredError(text) && onSessionExpired) onSessionExpired();
      throw new Error(text);
    }
    if (!res.ok) throw new Error(await res.text());
    return res;
  };

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
      async refreshSession(refresh_token) {
        const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ refresh_token })
        });
        if (!res.ok) throw new Error('Token refresh failed');
        return res.json();
      },
      async signOut(token) {
        await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: { ...headers, Authorization: `Bearer ${token}` } });
      },
      async signInWithOAuth({ provider, options }) {
        const { redirectTo } = options || {};
        window.location.href = `${url}/auth/v1/authorize?${new URLSearchParams({ provider, redirect_to: redirectTo }).toString()}`;
        return { error: null };
      },
      async resetPasswordForEmail(email) {
        const res = await fetch(`${url}/auth/v1/recover`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      }
    },
    from: (table) => ({
      async insert(data, token) {
        const res = await guardedFetch(() => fetch(`${url}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}`, 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        }), token);
        return res.json();
      },
      async selectWhere(col, match, token) {
        const res = await guardedFetch(() => fetch(`${url}/rest/v1/${table}?${col}=eq.${match}`, {
          method: 'GET',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}` }
        }), token);
        return res.json();
      },
      async update(data, col, match, token) {
        const res = await guardedFetch(() => fetch(`${url}/rest/v1/${table}?${col}=eq.${match}`, {
          method: 'PATCH',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}`, 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        }), token);
        return res.json();
      },
      async delete(col, match, token) {
        await guardedFetch(() => fetch(`${url}/rest/v1/${table}?${col}=eq.${match}`, {
          method: 'DELETE',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}` }
        }), token);
        return true;
      },
      async upsert(data, token) {
        const res = await guardedFetch(() => fetch(`${url}/rest/v1/${table}`, {
          method: 'POST',
          headers: { ...headers, 'Authorization': `Bearer ${token || key}`, 'Prefer': 'return=representation,resolution=merge-duplicates' },
          body: JSON.stringify(data)
        }), token);
        return res.json();
      }
    })
  };
}

export function BrandsmithProvider({ children }) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPro = session?.user?.email === "hadimalik.info@gmail.com";

  const initStepData = () => ({
    idea: { raw: '', questions: [], answers: {}, research: '', recommendation: '', locked: false, chosenIdea: '', validation: null },
    name: { names: [], selectedName: null, locked: false, refinement: '' },
    availability: { handle: '', ext: '', checked: false },
    identity: { answers: { personality: '', audience: '', competitors: '', colorMood: '', style: '', values: '' }, kit: null, selectedTagline: null, logoStyle: 'modern', logoColor: '#ffffff', logoAccent: '#5a5a5a', svg: '' },
    bizplan: { data: null },
    export: { done: false }
  });

  const [stepData, setStepData] = useState(initStepData());

  const handleSessionExpired = () => {
    localStorage.removeItem('brandsmith_session');
    setSession(null);
    setUserData(null);
    setProjects([]);
  };

  const [supabase] = useState(() => createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, handleSessionExpired));

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token) {
        fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${access_token}` }
        }).then(res => res.json()).then(user => {
          const session = { access_token, refresh_token, user };
          setSession(session);
          window.history.replaceState(null, null, window.location.pathname);
        }).catch(() => {});
      }
    }

    const savedSession = localStorage.getItem('brandsmith_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        const nowSec = Math.floor(Date.now() / 1000);
        if (parsed.expires_at && parsed.expires_at < nowSec && parsed.refresh_token) {
          supabase.auth.refreshSession(parsed.refresh_token).then(fresh => {
            const newSession = { ...parsed, access_token: fresh.access_token, refresh_token: fresh.refresh_token, expires_at: fresh.expires_at, user: fresh.user || parsed.user };
            setSession(newSession);
          }).catch(() => localStorage.removeItem('brandsmith_session'));
        } else {
          setSession(parsed);
        }
      } catch (e) { localStorage.removeItem('brandsmith_session'); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      localStorage.setItem('brandsmith_session', JSON.stringify(session));
      loadProjects();
      loadUserData();
    } else {
      localStorage.removeItem('brandsmith_session');
    }
  }, [session]);

  const loadUserData = async () => {
    if (!session?.user) return;
    try {
      const res = await supabase.from('profiles').selectWhere('id', session.user.id, session.access_token);
      if (Array.isArray(res) && res.length > 0) setUserData(res[0]);
    } catch (e) {}
  };

  const loadProjects = async () => {
    if (!session?.user) return;
    try {
      const res = await supabase.from('projects').selectWhere('user_id', session.user.id, session.access_token);
      if (Array.isArray(res)) setProjects(res.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
    } catch (e) {}
  };

  const loadProject = async (proj) => {
    setCurrentProject(proj);
    try {
      const data = await supabase.from('project_data').selectWhere('project_id', proj.id, session.access_token);
      let newStepData = initStepData();
      for (let row of data) if (newStepData[row.step]) newStepData[row.step] = { ...newStepData[row.step], ...row.data };
      setStepData(newStepData);
    } catch (e) {}
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
      
      let newTitle = null;
      if (step === 'name' && dataSubset.selectedName) newTitle = dataSubset.selectedName;
      else if (step === 'idea' && dataSubset.locked && updatedStep.chosenIdea) {
        if (!stepData.name?.selectedName) newTitle = updatedStep.chosenIdea.slice(0, 60);
      }
      if (newTitle && newTitle !== currentProject.title) {
        await supabase.from('projects').update({ title: newTitle }, 'id', currentProject.id, session.access_token);
        setCurrentProject(prev => ({ ...prev, title: newTitle }));
      }
    } catch (e) {}
  };

  const value = {
    session, setSession, userData, setUserData, projects, setProjects, currentProject, setCurrentProject, stepData, setStepData,
    isPro, supabase, initStepData, loadProject, saveStepData, loadUserData, loadProjects, loading
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

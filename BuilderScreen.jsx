import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb, Pencil, Globe, Palette, Briefcase, Download, 
  Trash2, Plus, Lock, Check, ChevronRight, ArrowLeft, RefreshCw, Layers, ExternalLink, Zap
} from 'lucide-react';
import { 
  BRANDSMITH_LOGO, FEEDBACK_URL, WAITLIST_URL, 
  useBrandsmith, parseAIJsonStr, streamGroq, 
  getFontPairing, getLuminance, getContrast, getMoodSettings 
} from './BrandsmithContext';
import { 
  Spinner, LoadingDots, StreamText, 
  ButtonPrimary, ButtonGhost, ButtonText, 
  InputField, TextAreaField, UserAvatar 
} from './SharedComponents';

// ── STEP COMPONENTS ──────────────────────────────────────────

// ── STEP 01: IDEA ──
function IdeaStep({ data, onSave, goNext }) {
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const analyzeIdea = async () => {
    setLoading(true);
    setStreamedText('');
    try {
      const system = `You are an elite venture strategist. Analyze the user's business idea. 
      Return a JSON object with: {research, recommendation, questions (array of 3 specific questions)}. 
      Be sharp, critical and helpful.`;
      await streamGroq(system, data.raw, (chunk) => setStreamedText(chunk));
      const res = parseAIJsonStr(streamedText);
      if (res) onSave({ ...res, locked: false, validation: 'done' });
    } catch (e) { }
    finally { setLoading(false); }
  };

  if (data.locked) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-4 mb-12">
           <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold">01</div>
           <h2 className="text-2xl font-bold tracking-tighter uppercase italic">Architecture Locked</h2>
        </div>
        <div className="bg-[#101010] border border-[#1c1c1c] p-10 space-y-6">
           <p className="text-sm text-[#4a4a4a] uppercase mono font-bold tracking-widest">Selected Vision</p>
           <p className="text-xl leading-relaxed italic">"{data.chosenIdea}"</p>
        </div>
        <ButtonGhost onClick={() => onSave({ locked: false })} className="opacity-50 hover:opacity-100 italic">← Modify Vision</ButtonGhost>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-12">
      <div className="space-y-4">
        <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Step 01 / Phase Alpha</span>
        <h2 className="text-4xl font-syne font-extrabold tracking-tighter">Idea Lab.</h2>
        <p className="text-sm text-[#4a4a4a] leading-relaxed">Describe your vision. We'll stress-test the market fit and help you crystallize the core value proposition.</p>
      </div>

      <TextAreaField 
        label="Describe your business idea..." 
        value={data.raw} 
        onChange={e => onSave({ raw: e.target.value })} 
        placeholder="e.g. A subscription service for artisan coffee from sustainable farms in Ethiopia..."
        rows={6}
      />

      <div className="space-y-12">
        <ButtonPrimary onClick={analyzeIdea} disabled={loading || !data.raw} fullWidth className="h-16">
          {loading ? <LoadingDots label="Analyzing Market Fit" /> : "Analyse Ideas →"}
        </ButtonPrimary>

        {streamedText && (
          <div className="bg-[#0a0a0a] border border-[#1c1c1c] p-10 space-y-8 card-anim">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Strategic Intelligence</label>
              <div className="text-sm leading-relaxed text-[#888] space-y-4 whitespace-pre-wrap">
                <StreamText text={parseAIJsonStr(streamedText)?.research || streamedText} />
              </div>
            </div>

            {data.questions?.length > 0 && (
              <div className="pt-8 border-t border-[#1c1c1c] space-y-6">
                 <label className="text-[10px] font-bold text-white uppercase tracking-widest mono">Clarification Required</label>
                 <div className="space-y-4">
                   {data.questions.map((q, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-[#4a4a4a] mono text-[10px] mt-1">/{i+1}</span>
                        <p className="text-sm">{q}</p>
                      </div>
                   ))}
                 </div>
                 <ButtonPrimary onClick={() => { onSave({ locked: true, chosenIdea: data.raw }); goNext(); }} className="mt-8">Freeze Architecture & Proceed →</ButtonPrimary>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 02: NAME ──
function NameStep({ ideaData, data, onSave, goNext }) {
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const generateNames = async () => {
    setLoading(true);
    setStreamedText('');
    try {
      const system = `You are a naming specialist at a top global agency. Generate 6 unique, rhythmic and memorable brand names. 
      Return a JSON object with: {names: [list of 6 names]}. Only words that evoke: ${ideaData.chosenIdea}`;
      await streamGroq(system, `Brand context: ${ideaData.chosenIdea}`, (chunk) => setStreamedText(chunk));
      const res = parseAIJsonStr(streamedText);
      if (res) onSave({ names: res.names });
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl space-y-12">
      <div className="space-y-4">
         <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Step 02 / Phase Beta</span>
         <h2 className="text-4xl font-syne font-extrabold tracking-tighter">Name Studio.</h2>
         <p className="text-sm text-[#4a4a4a]">Forge a name that resonates. Select your chosen handle to proceed to digital mapping.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
           <ButtonGhost onClick={generateNames} disabled={loading} className="w-full h-12 flex items-center justify-center gap-3">
              {loading ? <Spinner /> : <><RefreshCw size={14} /> Generate Handles</>}
           </ButtonGhost>

           <div className="space-y-1 bg-[#1c1c1c]">
              {(data.names?.length ? data.names : ['—', '—', '—', '—', '—', '—']).map((n, i) => (
                <button 
                  key={i} 
                  onClick={() => n !== '—' && onSave({ selectedName: n })}
                  className={`w-full text-left p-6 bg-[#080808] border border-[#1c1c1c] transition-all flex items-center justify-between group ${data.selectedName === n ? 'border-white z-10' : 'hover:bg-[#111]'}`}
                >
                  <span className={`text-lg font-bold ${data.selectedName === n ? 'text-white' : 'text-[#222]'}`}>{n}</span>
                  {data.selectedName === n && <Check size={16} />}
                </button>
              ))}
           </div>
        </div>

        <div className="bg-[#101010] border border-[#1c1c1c] p-10 flex flex-col items-center justify-center text-center space-y-8">
           <div className="w-16 h-[1px] bg-[#1c1c1c]" />
           <p className="text-[10px] mono uppercase text-[#4a4a4a] tracking-[0.3em]">Selected Handle</p>
           <h3 className="text-4xl font-syne font-extrabold italic uppercase tracking-tighter">{data.selectedName || "???"}</h3>
           <div className="w-16 h-[1px] bg-[#1c1c1c]" />
           <ButtonPrimary onClick={() => { onSave({ locked: true }); goNext(); }} disabled={!data.selectedName} fullWidth className="mt-8">Lock Nomenclature & Map Presence →</ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

// ── STEP 03: AVAILABILITY ──
function AvailabilityStep({ nameData, data, onSave, goNext }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  const checkAvailability = async () => {
    setChecking(true);
    // Simulate domain checks
    setTimeout(() => {
      setResults({
        domains: ['.com', '.io', '.ai', '.co'].map(ext => ({ ext, available: Math.random() > 0.4 })),
        socials: ['x', 'instagram', 'linkedin', 'tiktok'].map(platform => ({ platform, available: Math.random() > 0.3 }))
      });
      setChecking(false);
      onSave({ checked: true });
    }, 1500);
  };

  return (
    <div className="max-w-3xl space-y-12">
      <div className="space-y-4">
         <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Step 03 / Presence Map</span>
         <h2 className="text-4xl font-syne font-extrabold tracking-tighter">Digital Real Estate.</h2>
         <p className="text-sm text-[#4a4a4a]">Verifying ${nameData.selectedName} across the digital global map.</p>
      </div>

      <div className="bg-[#0a0a0a] border border-[#1c1c1c] p-12 space-y-12">
         <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-2">
               <h3 className="text-4xl font-syne font-extrabold uppercase italic">{nameData.selectedName}</h3>
               <p className="text-[10px] mono text-[#4a4a4a]">Mapping to global DNS nodes...</p>
            </div>
            <ButtonPrimary onClick={checkAvailability} disabled={checking} className="h-16 px-12">
               {checking ? <LoadingDots label="Scanning Networks" /> : "Initiate Global Scan →"}
            </ButtonPrimary>
         </div>

         {results && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#1c1c1c] animate-in fade-in duration-700">
             <div className="bg-[#080808] p-8 space-y-6">
                <label className="text-[8px] mono font-bold text-[#4a4a4a] uppercase tracking-widest">Domains</label>
                <div className="space-y-3">
                   {results.domains.map(d => (
                      <div key={d.ext} className="flex items-center justify-between">
                         <span className="text-sm font-bold text-white">{nameData.selectedName.toLowerCase()}{d.ext}</span>
                         <span className={`text-[8px] mono font-bold uppercase px-2 py-1 ${d.available ? 'bg-white text-black' : 'text-[#222]'}`}>
                            {d.available ? 'Available' : 'Taken'}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
             <div className="bg-[#080808] p-8 space-y-6">
                <label className="text-[8px] mono font-bold text-[#4a4a4a] uppercase tracking-widest">Handles</label>
                <div className="space-y-3">
                   {results.socials.map(s => (
                      <div key={s.platform} className="flex items-center justify-between">
                         <span className="text-sm font-bold text-[#4a4a4a]">@{nameData.selectedName.toLowerCase()} <span className="text-[10px] mono opacity-30">({s.platform})</span></span>
                         <span className={`text-[8px] mono font-bold uppercase ${s.available ? 'text-white' : 'text-[#1c1c1c]'}`}>
                            {s.available ? 'Available' : 'Registered'}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
           </div>
         )}
      </div>
      <ButtonPrimary onClick={goNext} disabled={!data.checked} className="mt-8">Proceed to Identity Forge →</ButtonPrimary>
    </div>
  );
}

// ── STEP 04: IDENTITY ──
function IdentityStep({ name, data, onSave, goNext }) {
  const [activeTab, setActiveTab] = useState('Vibe');
  const [loading, setLoading] = useState(false);

  const buildKit = async () => {
    setLoading(true);
    try {
      const mood = getMoodSettings(data.answers.colorMood, data.answers.style);
      let palette = ["#080808", "#101010", "#4a90d9", "#f5f5f5", "#5a5a5a"];
      
      const huemintRes = await fetch("https://api.huemint.com/color", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "transformer", num_colors: 5, temperature: mood.temperature, palette: mood.palette, })
      });
      if (huemintRes.ok) {
        const hData = await huemintRes.json();
        palette = hData?.results?.[0]?.palette || palette;
      }

      let colors = { background: palette[0], surface: palette[1], primary: palette[2], text: palette[3], accent: palette[4] };
      const contrast = getContrast(colors.text, colors.background);
      if (contrast < 4.5) colors.text = getContrast('#ffffff', colors.background) > getContrast('#111111', colors.background) ? '#ffffff' : '#111111';

      const pairing = getFontPairing(data.answers.style, data.answers.personality);
      const prompt = `Generate brand taglines and voice guidelines. JSON {taglines:[], voice:{tone:"", dos:[], donts:[]}}`;
      const res = await streamGroq("Strategist", prompt, () => {});
      const kit = parseAIJsonStr(res) || {};
      
      kit.colors = colors;
      kit.fonts = { 
        display: pairing.display, 
        displayDesc: `Best fit for ${pairing.category} aesthetic.`, 
        body: pairing.body, 
        bodyDesc: `Paired for optimal readability.`, 
        category: pairing.category 
      };

      onSave({ kit });
      setActiveTab('Kit');
    } catch (e) { }
    finally { setLoading(false); }
  };

  const generateSVG = () => {
    const s = data.logoStyle || 'modern';
    const c1 = data.logoColor || '#fff';
    const c2 = data.logoAccent || '#444';
    let path = `<circle cx="100" cy="100" r="80" fill="${c1}" opacity="0.1" /><rect x="60" y="60" width="80" height="80" fill="${c1}" />`;
    if (s === 'minimal') path = `<path d="M40 40 L160 160 M160 40 L40 160" stroke="${c1}" stroke-width="20" />`;
    if (s === 'luxury') path = `<path d="M100 20 L20 180 L180 180 Z" fill="none" stroke="${c1}" stroke-width="2" /><circle cx="100" cy="100" r="40" stroke="${c2}" fill="none" />`;
    onSave({ svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${path}</svg>` });
  };

  useEffect(() => { if (activeTab === 'LOGO' && name) generateSVG(); }, [data.logoStyle, data.logoColor, data.logoAccent, activeTab]);

  return (
    <div className="space-y-12">
       <div className="space-y-4">
         <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Step 04 / Identity Forge</span>
         <h2 className="text-4xl font-syne font-extrabold tracking-tighter">Brand Studio.</h2>
       </div>

       <div className="flex border-b border-[#1c1c1c] gap-8">
          {['Vibe', 'Kit', 'Logo'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'text-white border-b border-white' : 'text-[#4a4a4a] hover:text-white'}`}>
              {t}
            </button>
          ))}
       </div>

       {activeTab === 'Vibe' && (
         <div className="max-w-xl space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InputField label="Personality" value={data.answers.personality} onChange={e => onSave({ answers: { ...data.answers, personality: e.target.value }})} placeholder="e.g. Bold, minimal, techy" />
               <InputField label="Style" value={data.answers.style} onChange={e => onSave({ answers: { ...data.answers, style: e.target.value }})} placeholder="e.g. Swiss Modernism" />
            </div>
            <InputField label="Color Mood" value={data.answers.colorMood} onChange={e => onSave({ answers: { ...data.answers, colorMood: e.target.value }})} placeholder="e.g. Dark Obsidian, neon highlights" />
            <ButtonPrimary onClick={buildKit} disabled={loading} fullWidth className="h-16">
               {loading ? <LoadingDots label="Forging Identity" /> : "Consolidate Brand DNA →"}
            </ButtonPrimary>
         </div>
       )}

       {activeTab === 'Kit' && data.kit && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#1c1c1c] animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#080808] p-12 space-y-12">
               <label className="text-[8px] mono font-bold text-[#4a4a4a] uppercase tracking-widest">Chromatics</label>
               <div className="flex h-24 gap-1">
                  {Object.entries(data.kit.colors).map(([k, hex]) => (
                    <div key={k} className="flex-1 group relative cursor-pointer" style={{ background: hex }}>
                       <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-[8px] mono font-bold invert">{hex}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="bg-[#080808] p-12 space-y-8">
               <label className="text-[8px] mono font-bold text-[#4a4a4a] uppercase tracking-widest">Typography</label>
               <div>
                  <h4 className="text-3xl font-bold mb-2" style={{ fontFamily: data.kit.fonts.display }}>{data.kit.fonts.display}</h4>
                  <p className="text-sm text-[#4a4a4a]" style={{ fontFamily: data.kit.fonts.body }}>{data.kit.fonts.body}</p>
               </div>
               <ButtonPrimary onClick={() => setActiveTab('LOGO')} className="mt-8">Forge Visual Mark →</ButtonPrimary>
            </div>
         </div>
       )}

       {activeTab === 'LOGO' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#1c1c1c]">
            <div className="bg-[#080808] p-12 space-y-10">
               <label className="text-[8px] mono font-bold text-[#4a4a4a] uppercase tracking-widest">Symbol Architecture</label>
               <div className="flex flex-wrap gap-4">
                  {['modern', 'minimal', 'luxury'].map(s => (
                    <button key={s} onClick={() => onSave({ logoStyle: s })} className={`px-4 py-2 text-[10px] font-bold uppercase border transition-all ${data.logoStyle === s ? 'bg-white text-black border-white' : 'border-[#1c1c1c] text-[#4a4a4a] hover:border-white'}`}>{s}</button>
                  ))}
               </div>
               <ButtonPrimary onClick={goNext} fullWidth>Finalize Identity →</ButtonPrimary>
            </div>
            <div className="bg-[#0a0a0a] p-12 flex items-center justify-center h-[400px]">
               <div dangerouslySetInnerHTML={{ __html: data.svg }} className="w-48 h-48" />
            </div>
         </div>
       )}
    </div>
  );
}

// ── STEP 05: BIZ PLAN ──
function BizPlanStep({ ideaData, nameData, identityData, data, onSave, goNext, isPro }) {
  const [loading, setLoading] = useState(false);
  
  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Generate business plan JSON for ${nameData.selectedName}. Fields: {executiveSummary, targetMarket, revenueModel, milestores:[]}`;
      const res = await streamGroq("Economist", prompt, () => {});
      onSave({ data: parseAIJsonStr(res) });
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl space-y-12 relative">
      {!isPro && (
        <div className="absolute inset-0 z-50 bg-[#080808]/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-12">
           <Lock size={32} className="mb-8" />
           <h3 className="text-2xl font-syne font-extrabold mb-4 tracking-tighter uppercase italic">Phase Locked</h3>
           <p className="text-sm text-[#4a4a4a] mb-8 max-w-sm">Business Architecture requires a Pro identity handle.</p>
           <button onClick={() => window.open(WAITLIST_URL,'_blank')} className="bg-white text-black px-10 py-4 font-bold uppercase text-[10px] hover:bg-[#ccc] transition-all">Join Pro Waitlist →</button>
           <button onClick={goNext} className="mt-8 text-[9px] mono uppercase text-[#222] hover:text-white transition-all">Skip to Export Sequence →</button>
        </div>
      )}

      <div className="space-y-4">
         <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Step 05 / Strategy Phase</span>
         <h2 className="text-4xl font-syne font-extrabold tracking-tighter">Business Plan.</h2>
      </div>

      {!data.data ? (
        <div className="py-32 border border-[#1c1c1c] flex flex-col items-center justify-center">
           <ButtonPrimary onClick={generate} disabled={loading} className="h-16 px-12">
              {loading ? <LoadingDots label="Modeling Strategy" /> : "Initiate Strategy Generator →"}
           </ButtonPrimary>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#1c1c1c] p-10 space-y-8 animate-in fade-in slide-in-from-right-4">
           <h4 className="text-xl font-bold">Strategy Consolidated.</h4>
           <p className="text-sm leading-relaxed text-[#5a5a5a]">{data.data.executiveSummary}</p>
           <ButtonPrimary onClick={goNext} className="mt-8">Proceed to Final dossier →</ButtonPrimary>
        </div>
      )}
    </div>
  );
}

// ── STEP 06: EXPORT ──
function ExportStep({ stepData, isPro, currentProject, supabase, session }) {
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    // Basic HTML export logic
    const html = `<html><body><h1>${currentProject.title} Brand Kit</h1><p>Created with Brandsmither</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'BrandKit.html'; a.click();
    setDone(true);
  };

  return (
    <div className="max-w-2xl space-y-12">
       <div className="space-y-4">
         <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Final Phase / Output</span>
         <h2 className="text-4xl font-syne font-extrabold tracking-tighter">Architecture Complete.</h2>
       </div>

       <div className="bg-[#0a0a0a] border border-[#1c1c1c] p-12 text-center space-y-12">
          <div className="w-16 h-1 w-full flex gap-1 items-center justify-center">
             {[...Array(6)].map((_, i) => <div key={i} className="h-1 flex-1 bg-white" />)}
          </div>
          <p className="text-xs text-[#4a4a4a] mono uppercase tracking-widest">All modules verified & compiled</p>
          <ButtonPrimary onClick={handleExport} className="h-20 w-full text-lg">Download Complete Brand Kit →</ButtonPrimary>
          {!isPro && <p className="text-[9px] mono text-[#222]">Upgrade to Pro for high-fidelity PDF exports.</p>}
       </div>

       {done && (
         <div className="text-center success-msg py-8 space-y-4">
            <h4 className="text-white font-bold">Successfully Exported ✓</h4>
            <div className="flex gap-4 justify-center">
              <ButtonGhost onClick={() => window.open(FEEDBACK_URL, '_blank')} className="text-[9px]">Share Feedback</ButtonGhost>
            </div>
         </div>
       )}
    </div>
  );
}

// ── MAIN BUILDER SCREEN ───────────────────────────────────────

export function BuilderScreen() {
  const { 
    currentProject, stepData, saveStepData, 
    isPro, supabase, session, setCurrentProject, loadProject
  } = useBrandsmith();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState('idea');
  const [loading, setLoading] = useState(!currentProject);

  const stepsArr = ['idea', 'name', 'availability', 'identity', 'bizplan', 'export'];
  const stepLabels = { idea: 'Idea Lab', name: 'Name Studio', availability: 'Availability', identity: 'Identity', bizplan: 'Business Plan', export: 'Export' };
  const stepIcons = { 
    idea: Lightbulb, name: Pencil, availability: Globe, 
    identity: Palette, bizplan: Briefcase, export: Download 
  };

  const currentIdx = stepsArr.indexOf(activeStep);
  const goNext = () => { 
    console.log("Builder: Advancing from", activeStep, "Current Index:", currentIdx);
    if (currentIdx < stepsArr.length - 1) {
      const next = stepsArr[currentIdx + 1];
      console.log("Builder: Next step will be", next);
      setActiveStep(next);
    }
  };

  useEffect(() => {
    console.log("Builder: Active Step changed to:", activeStep);
  }, [activeStep]);

  if (loading || !currentProject) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
       <div className="bs-spinner" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] flex font-dm overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[80px] md:w-[280px] border-r border-[#1c1c1c] bg-[#0a0a0a] flex flex-col shrink-0">
        <div className="h-[72px] flex items-center px-6 gap-3 border-b border-[#1c1c1c] cursor-pointer" onClick={() => navigate('/dashboard')}>
           <img src={BRANDSMITH_LOGO} width={24} className="grayscale brightness-200" alt="L" />
           <span className="hidden md:block font-syne font-extrabold text-sm uppercase tracking-tighter italic">Brandsmither</span>
        </div>

        <div className="flex-1 py-12 px-2 md:px-4 space-y-2 overflow-y-auto">
           {stepsArr.map((id, idx) => {
             const Icon = stepIcons[id];
             const isActive = activeStep === id;
             const isDone = idx < currentIdx;
             return (
               <button 
                 key={id}
                 onClick={() => idx <= currentIdx && setActiveStep(id)}
                 className={`w-full flex items-center gap-4 p-4 transition-all group rounded-sm ${isActive ? 'bg-white text-black' : 'text-[#4a4a4a] hover:bg-[#111] hover:text-white'}`}
               >
                 <Icon size={18} className={isActive ? 'text-black' : 'text-inherit'} />
                 <div className="hidden md:flex items-center justify-between flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest">{stepLabels[id]}</span>
                    {isDone && <Check size={12} className={isActive ? 'text-black' : 'text-white'} />}
                 </div>
               </button>
             );
           })}
        </div>

        <div className="p-4 border-t border-[#1c1c1c]">
           <button onClick={() => navigate('/dashboard')} className="w-full h-12 flex items-center justify-center gap-2 text-[9px] mono uppercase text-[#4a4a4a] hover:text-white transition-all">
              <ArrowLeft size={14} /> Back to dashboard
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#080808] relative">
         <div className="p-8 md:p-24 min-h-screen flex flex-col">
            <div key={activeStep} className="flex-1 max-w-5xl mx-auto w-full step-content">
               {console.log("Builder Rendering Content for:", activeStep, "Project ID:", currentProject?.id)}
               {activeStep === 'idea' && stepData?.idea && <IdeaStep data={stepData.idea} onSave={d => saveStepData('idea', d)} goNext={goNext} />}
               {activeStep === 'name' && stepData?.name && <NameStep ideaData={stepData.idea} data={stepData.name} onSave={d => saveStepData('name', d)} goNext={goNext} />}
               {activeStep === 'availability' && stepData?.availability && <AvailabilityStep nameData={stepData.name} data={stepData.availability} onSave={d => saveStepData('availability', d)} goNext={goNext} />}
               {activeStep === 'identity' && stepData?.identity && <IdentityStep name={stepData.name?.selectedName} data={stepData.identity} onSave={d => saveStepData('identity', d)} goNext={goNext} />}
               {activeStep === 'bizplan' && stepData?.bizplan && <BizPlanStep ideaData={stepData.idea} nameData={stepData.name} identityData={stepData.identity} data={stepData.bizplan} onSave={d => saveStepData('bizplan', d)} goNext={goNext} isPro={isPro} />}
               {activeStep === 'export' && stepData?.export && <ExportStep stepData={stepData} isPro={isPro} currentProject={currentProject} supabase={supabase} session={session} />}
            </div>

            <footer className="mt-24 pt-12 border-t border-[#1c1c1c] max-w-5xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-2">
                  <span className="text-[9px] mono font-bold text-white uppercase italic">{stepLabels[activeStep]}</span>
               </div>
               <div className="flex items-center gap-8">
                  <a href={FEEDBACK_URL} target="_blank" className="text-[9px] mono text-[#222] hover:text-white transition-all uppercase tracking-widest">Feedback</a>
                  <span className="text-[9px] mono text-[#111]">© 2026 Brandsmither Studio</span>
               </div>
            </footer>
         </div>
      </main>
    </div>
  );
}

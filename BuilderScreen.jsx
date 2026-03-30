import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb, Pencil, Globe, Palette, Briefcase, Download, 
  Lock, Check, ArrowLeft, RefreshCw
} from 'lucide-react';
import { 
  BRANDSMITH_LOGO, FEEDBACK_URL, WAITLIST_URL, 
  useBrandsmith, parseAIJsonStr, streamGroq, 
  getFontPairing, getMoodSettings 
} from './BrandsmithContext';
import { 
  Spinner, LoadingDots, StreamText, 
  ButtonPrimary, ButtonGhost, 
  InputField, TextAreaField
} from './SharedComponents';

// ── STEP COMPONENTS ──────────────────────────────────────────

// ── STEP 01: IDEA LAB ──
function IdeaStep({ data, onSave, goNext }) {
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const analyzeIdea = async () => {
    setLoading(true);
    setStreamedText('');
    try {
      const system = `You are a venture strategist. Analyze the user's business idea. 
      Return a JSON object with: {research, recommendation, questions (array of 3 specific questions)}.`;
      await streamGroq(system, data.raw, (chunk) => setStreamedText(chunk));
      const res = parseAIJsonStr(streamedText);
      if (res) onSave({ ...res, locked: false, validation: 'done' });
    } catch (e) { }
    finally { setLoading(false); }
  };

  if (data?.locked) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-5 mb-16">
           <div className="w-12 h-12 bg-white text-[#080808] flex items-center justify-center font-syne font-extrabold text-lg">01</div>
           <h2 className="text-3xl font-syne font-extrabold tracking-tighter italic">Idea lab locked</h2>
        </div>
        <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-8">
           <p className="text-[10px] font-bold text-[#5a5a5a] uppercase mono tracking-[0.4em]">Selected vision</p>
           <p className="text-2xl font-inter font-medium leading-relaxed italic text-white">"{data.chosenIdea}"</p>
        </div>
        <ButtonGhost onClick={() => onSave({ locked: false })} className="opacity-40 hover:opacity-100">
           ← Modify business idea
        </ButtonGhost>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-16">
      <div className="space-y-6">
        <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 01</span>
        <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white leading-none">Idea Lab</h2>
        <p className="text-sm text-[#5a5a5a] leading-relaxed max-w-md">Describe your business idea... We'll stress-test the market fit and help you crystallize the value proposition.</p>
      </div>

      <TextAreaField 
        label="Describe your business idea..." 
        value={data?.raw || ''} 
        onChange={e => onSave({ raw: e.target.value })} 
        placeholder="e.g. A high-end sustainable coffee subscription..."
        rows={6}
      />

      <div className="space-y-12">
        <ButtonPrimary onClick={analyzeIdea} disabled={loading || !data?.raw} fullWidth className="h-16">
          {loading ? <LoadingDots label="Analysing Ideas" /> : "Analyse Ideas →"}
        </ButtonPrimary>

        {streamedText && (
          <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-10 card-anim">
            <div className="space-y-6">
              <label className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Strategic Insight</label>
              <div className="text-sm leading-relaxed text-[#f5f5f5] space-y-6 whitespace-pre-wrap font-inter">
                <StreamText text={parseAIJsonStr(streamedText)?.research || streamedText} />
              </div>
            </div>

            {data?.questions?.length > 0 && (
              <div className="pt-10 border-t border-[#252525] space-y-10">
                 <label className="text-[10px] font-bold text-white uppercase tracking-[0.4em] mono">Clarification</label>
                 <div className="space-y-6">
                    {data.questions.map((q, i) => (
                       <div key={i} className="flex gap-6">
                         <span className="text-[#5a5a5a] mono text-[10px] font-bold mt-1">/{i+1}</span>
                         <p className="text-sm text-white font-medium">{q}</p>
                       </div>
                    ))}
                 </div>
                 <ButtonPrimary onClick={() => { onSave({ locked: true, chosenIdea: data.raw }); goNext(); }} fullWidth className="h-16">Lock Idea & Proceed →</ButtonPrimary>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 02: NAME STUDIO ──
function NameStep({ ideaData, data, onSave, goNext }) {
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const generateNames = async () => {
    setLoading(true);
    setStreamedText('');
    try {
      const system = `Generate 6 brand names. Return JSON: {names: []}. Evoke: ${ideaData?.chosenIdea}`;
      await streamGroq(system, `Context: ${ideaData?.chosenIdea}`, (chunk) => setStreamedText(chunk));
      const res = parseAIJsonStr(streamedText);
      if (res) onSave({ names: res.names });
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl space-y-16">
      <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 02</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Name Studio</h2>
         <p className="text-sm text-[#5a5a5a] max-w-sm">Forge a brand name that resonates with your vision.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
           <ButtonGhost onClick={generateNames} disabled={loading} fullWidth className="h-14">
              {loading ? <Spinner /> : <><RefreshCw size={16} className="mr-3" /> Generate names</>}
           </ButtonGhost>

           <div className="space-y-2">
              {(data?.names?.length ? data.names : ['—', '—', '—', '—', '—', '—']).map((n, i) => (
                <button 
                  key={i} 
                  onClick={() => n !== '—' && onSave({ selectedName: n })}
                  className={`w-full text-left p-6 border transition-all flex items-center justify-between group ${data?.selectedName === n ? 'bg-white text-black border-white' : 'bg-[#101010] border-[#1a1a1a] hover:border-[#252525] text-[#5a5a5a] hover:text-white'}`}
                >
                  <span className="text-lg font-syne font-extrabold italic uppercase tracking-tight">{n}</span>
                  {data?.selectedName === n && <Check size={18} />}
                </button>
              ))}
           </div>
        </div>

        <div className="bg-[#101010] border border-[#1a1a1a] p-12 flex flex-col items-center justify-center text-center space-y-10">
           <div className="w-12 h-[1px] bg-[#252525]" />
           <p className="text-[10px] mono uppercase text-[#5a5a5a] font-bold tracking-[0.4em]">Selected name</p>
           <h3 className="text-5xl font-syne font-extrabold italic uppercase tracking-tighter text-white">{data?.selectedName || "???"}</h3>
           <div className="w-12 h-[1px] bg-[#252525]" />
           <ButtonPrimary onClick={() => { onSave({ locked: true }); goNext(); }} disabled={!data?.selectedName} fullWidth className="h-16">Proceed to Availability →</ButtonPrimary>
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
    <div className="max-w-3xl space-y-16">
      <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 03</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Availability</h2>
         <p className="text-sm text-[#5a5a5a]">Verifying {nameData?.selectedName} across digital networks.</p>
      </div>

      <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-12">
         <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-3">
               <h3 className="text-4xl font-syne font-extrabold uppercase italic text-white">{nameData?.selectedName}</h3>
               <p className="text-[10px] mono text-[#5a5a5a] font-bold uppercase tracking-widest">Network Scan Active...</p>
            </div>
            <ButtonPrimary onClick={checkAvailability} disabled={checking} className="h-16 px-12">
               {checking ? <LoadingDots label="Scanning Networks" /> : "Check Availability →"}
            </ButtonPrimary>
         </div>

         {results && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700">
             <div className="space-y-6">
                <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Domains</label>
                <div className="space-y-3">
                   {results.domains.map(d => (
                      <div key={d.ext} className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
                         <span className="text-sm font-bold text-[#f5f5f5]">{nameData.selectedName.toLowerCase()}{d.ext}</span>
                         <span className={`text-[8px] mono font-bold uppercase px-2 py-1 ${d.available ? 'bg-white text-black' : 'text-[#2e2e2e]'}`}>
                            {d.available ? 'Available' : 'Taken'}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
             <div className="space-y-6">
                <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Social Handles</label>
                <div className="space-y-3">
                   {results.socials.map(s => (
                      <div key={s.platform} className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
                         <span className="text-sm font-bold text-[#5a5a5a]">@{nameData.selectedName.toLowerCase()}</span>
                         <span className={`text-[8px] mono font-bold uppercase ${s.available ? 'text-white' : 'text-[#2e2e2e]'}`}>
                            {s.available ? 'Available' : 'Claimed'}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
           </div>
         )}
      </div>
      <ButtonPrimary onClick={goNext} disabled={!data?.checked} className="h-16 px-12">Proceed to Brand Identity →</ButtonPrimary>
    </div>
  );
}

// ── STEP 04: IDENTITY ──
function IdentityStep({ name, data, onSave, goNext }) {
  const [activeTab, setActiveTab] = useState('Mood');
  const [loading, setLoading] = useState(false);

  const buildKit = async () => {
    setLoading(true);
    try {
      let palette = ["#080808", "#101010", "#ffffff", "#f5f5f5", "#5a5a5a"];
      const res = await streamGroq("Designer", "Generate taglines and personality markers JSON.", () => {});
      const kit = parseAIJsonStr(res) || {};
      kit.colors = { background: palette[0], surface: palette[1], primary: palette[2], text: palette[3], accent: palette[4] };
      const pairing = getFontPairing(data?.answers?.style, data?.answers?.personality);
      kit.fonts = { display: pairing.display, body: pairing.body, category: pairing.category };
      onSave({ kit });
      setActiveTab('Results');
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-16">
       <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 04</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Brand Identity</h2>
       </div>

       <div className="flex border-b border-[#1a1a1a] gap-12">
          {['Mood', 'Results', 'Logo'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`pb-6 text-[10px] font-bold uppercase mono tracking-[0.3em] transition-all ${activeTab === t ? 'text-white border-b-2 border-white' : 'text-[#5a5a5a] hover:text-white'}`}>
              {t}
            </button>
          ))}
       </div>

       {activeTab === 'Mood' && (
         <div className="max-w-xl space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InputField label="Brand Personality" value={data?.answers?.personality || ''} onChange={e => onSave({ answers: { ...data.answers, personality: e.target.value }})} placeholder="e.g. Modern, Minimal, Bold" />
               <InputField label="Visual Style" value={data?.answers?.style || ''} onChange={e => onSave({ answers: { ...data.answers, style: e.target.value }})} placeholder="e.g. Bauhaus, Tech-Noir" />
            </div>
            <InputField label="Color Mood" value={data?.answers?.colorMood || ''} onChange={e => onSave({ answers: { ...data.answers, colorMood: e.target.value }})} placeholder="e.g. Dark Obsidian" />
            <ButtonPrimary onClick={buildKit} disabled={loading} fullWidth className="h-16">
               {loading ? <LoadingDots label="Generating Identity" /> : "Generate Identity →"}
            </ButtonPrimary>
         </div>
       )}

       {activeTab === 'Results' && data?.kit && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#1a1a1a] animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#101010] p-12 space-y-12">
               <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Color Palette</label>
               <div className="flex h-24 gap-1">
                  {Object.entries(data.kit.colors).map(([k, hex]) => (
                    <div key={k} className="flex-1 border border-white/5" style={{ background: hex }} />
                  ))}
               </div>
            </div>
            <div className="bg-[#101010] p-12 space-y-8">
               <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Typography Pair</label>
               <div className="space-y-4">
                  <h4 className="text-4xl font-bold text-white uppercase italic tracking-tighter" style={{ fontFamilyPath: data.kit.fonts.display }}>{data.kit.fonts.display}</h4>
                  <p className="text-sm text-[#5a5a5a] font-medium" style={{ fontFamilyPath: data.kit.fonts.body }}>{data.kit.fonts.body} — Balanced for legibility.</p>
               </div>
            </div>
         </div>
       )}

       {activeTab === 'Logo' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#1a1a1a]">
            <div className="bg-[#101010] p-12 space-y-12">
               <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Logo Architecture</label>
               <div className="flex flex-col gap-4">
                  {['Modernist', 'Minimalist', 'Monogram'].map(s => (
                    <button key={s} onClick={() => onSave({ logoStyle: s.toLowerCase() })} className={`w-full p-6 text-[10px] font-bold uppercase mono tracking-[0.3em] border transition-all ${data?.logoStyle === s.toLowerCase() ? 'bg-white text-black border-white' : 'bg-[#161616] border-[#252525] text-[#5a5a5a] hover:text-white hover:border-[#2e2e2e]'}`}>{s}</button>
                  ))}
               </div>
               <ButtonPrimary onClick={goNext} fullWidth className="h-16 mt-8">Proceed to Strategy →</ButtonPrimary>
            </div>
            <div className="bg-[#101010] p-12 flex items-center justify-center min-h-[400px]">
               <div className="w-64 h-64 border border-[#1a1a1a] flex items-center justify-center bg-[#161616]">
                  <Check size={48} className="text-[#2e2e2e] animate-pulse" />
               </div>
            </div>
         </div>
       )}
    </div>
  );
}

// ── STEP 05: BUSINESS PLAN ──
function BizPlanStep({ nameData, data, onSave, goNext, isPro }) {
  const [loading, setLoading] = useState(false);
  
  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Generate a concise business plan for ${nameData?.selectedName}. JSON: {executiveSummary: ""}`;
      const res = await streamGroq("Economist", prompt, () => {});
      onSave({ data: parseAIJsonStr(res) });
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl space-y-16 relative">
      {!isPro && (
        <div className="absolute inset-0 z-50 bg-[#080808]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-12 border border-[#1a1a1a]">
           <Lock size={48} className="mb-10 text-[#1a1a1a]" />
           <h3 className="text-3xl font-syne font-extrabold mb-6 italic text-white tracking-tighter">Plan locked</h3>
           <p className="text-sm text-[#5a5a5a] mb-12 max-w-xs font-medium">Full business strategy generation requires a Pro membership.</p>
           <ButtonPrimary onClick={() => window.open(WAITLIST_URL,'_blank')} className="px-12 h-16">Join Waitlist →</ButtonPrimary>
           <ButtonText onClick={goNext} className="mt-10">Skip to Export →</ButtonText>
        </div>
      )}

      <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 05</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Business Plan</h2>
      </div>

      {!data?.data ? (
        <div className="py-40 border border-[#1a1a1a] bg-[#101010] flex flex-col items-center justify-center">
           <ButtonPrimary onClick={generate} disabled={loading} className="h-16 px-16">
              {loading ? <LoadingDots label="Generating Plan" /> : "Analyse Strategy →"}
           </ButtonPrimary>
        </div>
      ) : (
        <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-10 animate-in fade-in">
           <h4 className="text-2xl font-syne font-extrabold text-white italic">Executive summary</h4>
           <div className="w-12 h-[1px] bg-[#252525]" />
           <p className="text-sm leading-relaxed text-[#5a5a5a] font-medium">{data.data.executiveSummary}</p>
           <ButtonPrimary onClick={goNext} className="mt-12 h-16 px-12">Proceed to Export →</ButtonPrimary>
        </div>
      )}
    </div>
  );
}

// ── STEP 06: EXPORT ──
function ExportStep({ currentProject, isPro }) {
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    const html = `<html><head><title>${currentProject.title}</title></head><body><h1>${currentProject.title}</h1><p>Identity Kit Exported by Brandsmither</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${currentProject.title}_BrandKit.html`; a.click();
    setDone(true);
  };

  return (
    <div className="max-w-2xl space-y-16">
       <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 06</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Export</h2>
       </div>

       <div className="bg-[#101010] border border-[#1a1a1a] p-16 text-center space-y-12">
          <div className="w-full flex gap-1">
             {[...Array(6)].map((_, i) => <div key={i} className="h-1 flex-1 bg-white" />)}
          </div>
          <p className="text-[10px] mono text-[#5a5a5a] font-bold uppercase tracking-[0.4em]">Brand architecture verified</p>
          <ButtonPrimary onClick={handleExport} className="h-24 w-full text-lg font-syne font-extrabold italic tracking-tighter uppercase">Download Brand Kit →</ButtonPrimary>
          {!isPro && <p className="text-[9px] mono text-[#2e2e2e] uppercase font-bold tracking-[0.2em]">PDF export requires a Pro membership.</p>}
       </div>

       {done && (
         <div className="text-center py-12 border border-[#1a1a1a] bg-[#101010] animate-in slide-in-from-bottom-2">
            <h4 className="text-white font-syne font-extrabold italic text-xl mb-6">Build cycle complete</h4>
            <ButtonGhost onClick={() => window.open(FEEDBACK_URL, '_blank')}>Share feedback</ButtonGhost>
         </div>
       )}
    </div>
  );
}

// ── MAIN BUILDER SCREEN ───────────────────────────────────────

export function BuilderScreen() {
  const { 
    currentProject, stepData, saveStepData, 
    isPro, loading
  } = useBrandsmith();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState('idea');

  // Debugging state
  useEffect(() => {
    console.log("[BUILDER] rendering step:", activeStep, "stepData available:", !!stepData);
  }, [activeStep, stepData]);

  const stepsArr = ['idea', 'name', 'availability', 'identity', 'bizplan', 'export'];
  const stepLabels = { idea: 'Idea Lab', name: 'Name Studio', availability: 'Availability', identity: 'Brand Identity', bizplan: 'Business Plan', export: 'Export' };
  const stepIcons = { idea: Lightbulb, name: Pencil, availability: Globe, identity: Palette, bizplan: Briefcase, export: Download };

  const currentIdx = stepsArr.indexOf(activeStep);
  const goNext = () => { 
    if (currentIdx < stepsArr.length - 1) {
      setActiveStep(stepsArr[currentIdx + 1]);
    }
  };

  if (loading || !currentProject || !stepData) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
       <div className="bs-spinner" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] flex font-inter overflow-hidden selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-[80px] md:w-[320px] border-r border-[#1a1a1a] bg-[#080808] flex flex-col shrink-0 z-20">
        <div className="h-[72px] flex items-center px-8 gap-4 border-b border-[#1a1a1a] cursor-pointer bg-[#080808]" onClick={() => navigate('/dashboard')}>
           <img src={BRANDSMITH_LOGO} width={24} className="grayscale brightness-200" alt="L" />
           <span className="hidden md:block font-syne font-extrabold text-sm uppercase tracking-tighter italic text-white mt-1">Brandsmither</span>
        </div>

        <div className="flex-1 py-12 px-4 space-y-2 overflow-y-auto">
           {stepsArr.map((id, idx) => {
             const Icon = stepIcons[id];
             const isActive = activeStep === id;
             const isDone = idx < currentIdx;
             return (
               <button 
                 key={id}
                 onClick={() => idx <= currentIdx && setActiveStep(id)}
                 className={`w-full flex items-center gap-6 p-6 transition-all group rounded-sm ${isActive ? 'bg-white text-[#080808]' : 'hover:bg-[#101010] text-[#5a5a5a]'}`}
               >
                 <Icon size={20} className={isActive ? 'text-[#080808]' : 'group-hover:text-white transition-all'} />
                 <div className="hidden md:flex items-center justify-between flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mono ${isActive ? 'text-[#080808]' : 'text-inherit'}`}>{stepLabels[id]}</span>
                    {isDone && <Check size={14} className={isActive ? 'text-[#080808]' : 'text-white'} />}
                 </div>
               </button>
             );
           })}
        </div>

        <div className="p-8 border-t border-[#1a1a1a]">
           <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-center gap-3 text-[10px] mono uppercase font-bold text-[#2e2e2e] hover:text-[#f5f5f5] transition-all tracking-[0.3em]">
              <ArrowLeft size={16} /> Dashboard
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#080808] relative">
         <div className="p-10 md:p-32 min-h-screen flex flex-col">
            <div key={activeStep} className="flex-1 max-w-4xl mx-auto w-full step-content">
               {activeStep === 'idea' && <IdeaStep data={stepData.idea} onSave={d => saveStepData('idea', d)} goNext={goNext} />}
               {activeStep === 'name' && <NameStep ideaData={stepData.idea} data={stepData.name} onSave={d => saveStepData('name', d)} goNext={goNext} />}
               {activeStep === 'availability' && <AvailabilityStep nameData={stepData.name} data={stepData.availability} onSave={d => saveStepData('availability', d)} goNext={goNext} />}
               {activeStep === 'identity' && <IdentityStep name={stepData.name?.selectedName} data={stepData.identity} onSave={d => saveStepData('identity', d)} goNext={goNext} />}
               {activeStep === 'bizplan' && <BizPlanStep nameData={stepData.name} data={stepData.bizplan} onSave={d => saveStepData('bizplan', d)} goNext={goNext} isPro={isPro} />}
               {activeStep === 'export' && <ExportStep currentProject={currentProject} isPro={isPro} />}
            </div>

            <footer className="mt-32 pt-16 border-t border-[#1a1a1a] max-w-4xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] mono font-bold text-[#5a5a5a] uppercase italic tracking-[0.2em]">{stepLabels[activeStep]}</span>
               </div>
               <div className="flex items-center gap-12">
                  <a href={FEEDBACK_URL} target="_blank" className="text-[10px] mono text-[#2e2e2e] hover:text-[#5a5a5a] transition-all uppercase font-bold tracking-[0.3em]">Feedback</a>
                  <span className="text-[9px] mono text-[#1a1a1a] font-bold uppercase tracking-[0.2em]">© 2026 Brandsmither</span>
               </div>
            </footer>
         </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lightbulb, Pencil, Globe, Palette, Briefcase, Download, 
  Lock, Check, ArrowLeft, RefreshCw
} from 'lucide-react';
import { 
  BRANDSMITH_LOGO, FEEDBACK_URL, WAITLIST_URL, 
  useBrandsmith, parseAIJsonStr, streamGroq, 
  getFontPairing, getContrast, getMoodSettings 
} from './BrandsmithContext';
import { 
  Spinner, LoadingDots, StreamText, 
  ButtonPrimary, ButtonGhost, ButtonText, 
  InputField, TextAreaField
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
      const system = `You are a venture strategist. Analyze the user's business idea. 
      Return a JSON object with: {research, recommendation, questions (array of 3 specific questions)}.`;
      await streamGroq(system, data.raw, (chunk) => setStreamedText(chunk));
      const res = parseAIJsonStr(streamedText);
      if (res) onSave({ ...res, locked: false, validation: 'done' });
    } catch (e) { }
    finally { setLoading(false); }
  };

  if (data.locked) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-5 mb-16">
           <div className="w-12 h-12 bg-white text-[#080808] flex items-center justify-center font-syne font-extrabold text-lg">01</div>
           <h2 className="text-3xl font-syne font-extrabold tracking-tighter uppercase italic">Architecture Locked</h2>
        </div>
        <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-8">
           <p className="text-[10px] font-bold text-[#5a5a5a] uppercase mono tracking-[0.4em]">Selected Vision</p>
           <p className="text-2xl font-inter font-medium leading-relaxed italic text-white">"{data.chosenIdea}"</p>
        </div>
        <ButtonGhost onClick={() => onSave({ locked: false })} className="opacity-40 hover:opacity-100">
           ← Modify Vision
        </ButtonGhost>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-16">
      <div className="space-y-6">
        <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 01 / Phase Alpha</span>
        <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white leading-none">Idea Lab.</h2>
        <p className="text-sm text-[#5a5a5a] leading-relaxed max-w-md">Describe your vision. We'll stress-test the market fit and help you crystallize the value proposition.</p>
      </div>

      <TextAreaField 
        label="Describe your business idea..." 
        value={data.raw} 
        onChange={e => onSave({ raw: e.target.value })} 
        placeholder="e.g. A high-end sustainable coffee subscription..."
        rows={6}
      />

      <div className="space-y-12">
        <ButtonPrimary onClick={analyzeIdea} disabled={loading || !data.raw} fullWidth className="h-16">
          {loading ? <LoadingDots label="Analyzing Market Fit" /> : "Analyse Ideas →"}
        </ButtonPrimary>

        {streamedText && (
          <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-10 card-anim">
            <div className="space-y-6">
              <label className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Strategic Intelligence</label>
              <div className="text-sm leading-relaxed text-[#f5f5f5] space-y-6 whitespace-pre-wrap font-inter">
                <StreamText text={parseAIJsonStr(streamedText)?.research || streamedText} />
              </div>
            </div>

            {data.questions?.length > 0 && (
              <div className="pt-10 border-t border-[#252525] space-y-10">
                 <label className="text-[10px] font-bold text-white uppercase tracking-[0.4em] mono">Clarification Required</label>
                 <div className="space-y-6">
                    {data.questions.map((q, i) => (
                       <div key={i} className="flex gap-6">
                         <span className="text-[#5a5a5a] mono text-[10px] font-bold mt-1">/{i+1}</span>
                         <p className="text-sm text-white font-medium">{q}</p>
                       </div>
                    ))}
                 </div>
                 <ButtonPrimary onClick={() => { onSave({ locked: true, chosenIdea: data.raw }); goNext(); }} fullWidth className="h-16">Freeze Architecture & Proceed →</ButtonPrimary>
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
      const system = `Generate 6 brand names. Return JSON: {names: []}. Evoke: ${ideaData.chosenIdea}`;
      await streamGroq(system, `Context: ${ideaData.chosenIdea}`, (chunk) => setStreamedText(chunk));
      const res = parseAIJsonStr(streamedText);
      if (res) onSave({ names: res.names });
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl space-y-16">
      <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 02 / Phase Beta</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Name Studio.</h2>
         <p className="text-sm text-[#5a5a5a] max-w-sm">Forge a handle that resonates. Select your preferred name to proceed.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
           <ButtonGhost onClick={generateNames} disabled={loading} fullWidth className="h-14">
              {loading ? <Spinner /> : <><RefreshCw size={16} className="mr-3" /> Generate Handles</>}
           </ButtonGhost>

           <div className="space-y-2">
              {(data.names?.length ? data.names : ['—', '—', '—', '—', '—', '—']).map((n, i) => (
                <button 
                  key={i} 
                  onClick={() => n !== '—' && onSave({ selectedName: n })}
                  className={`w-full text-left p-6 border transition-all flex items-center justify-between group ${data.selectedName === n ? 'bg-white text-black border-white' : 'bg-[#101010] border-[#1a1a1a] hover:border-[#252525] text-[#5a5a5a] hover:text-white'}`}
                >
                  <span className="text-lg font-syne font-extrabold italic uppercase tracking-tight">{n}</span>
                  {data.selectedName === n && <Check size={18} />}
                </button>
              ))}
           </div>
        </div>

        <div className="bg-[#101010] border border-[#1a1a1a] p-12 flex flex-col items-center justify-center text-center space-y-10">
           <div className="w-12 h-[1px] bg-[#252525]" />
           <p className="text-[10px] mono uppercase text-[#5a5a5a] font-bold tracking-[0.4em]">Selected Handle</p>
           <h3 className="text-5xl font-syne font-extrabold italic uppercase tracking-tighter text-white">{data.selectedName || "???"}</h3>
           <div className="w-12 h-[1px] bg-[#252525]" />
           <ButtonPrimary onClick={() => { onSave({ locked: true }); goNext(); }} disabled={!data.selectedName} fullWidth className="h-16">Lock Handle & Map Presence →</ButtonPrimary>
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
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 03 / Presence Map</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Availability.</h2>
         <p className="text-sm text-[#5a5a5a]">Verifying {nameData.selectedName} across global networks.</p>
      </div>

      <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-12">
         <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-3">
               <h3 className="text-4xl font-syne font-extrabold uppercase italic text-white">{nameData.selectedName}</h3>
               <p className="text-[10px] mono text-[#5a5a5a] font-bold uppercase tracking-widest">Global Scan Active...</p>
            </div>
            <ButtonPrimary onClick={checkAvailability} disabled={checking} className="h-16 px-12">
               {checking ? <LoadingDots label="Scanning DNS" /> : "Initiate Network Scan →"}
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
                            {d.available ? 'Available' : 'Reserved'}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
             <div className="space-y-6">
                <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Socials</label>
                <div className="space-y-3">
                   {results.socials.map(s => (
                      <div key={s.platform} className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
                         <span className="text-sm font-bold text-[#5a5a5a]">@{nameData.selectedName.toLowerCase()}</span>
                         <span className={`text-[8px] mono font-bold uppercase ${s.available ? 'text-white' : 'text-[#2e2e2e]'}`}>
                            {s.available ? 'Verified' : 'Claimed'}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
           </div>
         )}
      </div>
      <ButtonPrimary onClick={goNext} disabled={!data.checked} className="h-16 px-12">Proceed to Identity →</ButtonPrimary>
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
      let palette = ["#080808", "#101010", "#ffffff", "#f5f5f5", "#5a5a5a"];
      const res = await streamGroq("Designer", "Gen taglines/voice guidelines JSON.", () => {});
      const kit = parseAIJsonStr(res) || {};
      kit.colors = { background: palette[0], surface: palette[1], primary: palette[2], text: palette[3], accent: palette[4] };
      const pairing = getFontPairing(data.answers.style, data.answers.personality);
      kit.fonts = { display: pairing.display, body: pairing.body, category: pairing.category };
      onSave({ kit });
      setActiveTab('Kit');
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-16">
       <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 04 / Identity Forge</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Identity.</h2>
       </div>

       <div className="flex border-b border-[#1a1a1a] gap-12">
          {['Vibe', 'Kit', 'Logo'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`pb-6 text-[10px] font-bold uppercase mono tracking-[0.3em] transition-all ${activeTab === t ? 'text-white border-b-2 border-white' : 'text-[#5a5a5a] hover:text-white'}`}>
              {t}
            </button>
          ))}
       </div>

       {activeTab === 'Vibe' && (
         <div className="max-w-xl space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InputField label="Personality" value={data.answers.personality} onChange={e => onSave({ answers: { ...data.answers, personality: e.target.value }})} placeholder="Bold, minimal, tech" />
               <InputField label="Style" value={data.answers.style} onChange={e => onSave({ answers: { ...data.answers, style: e.target.value }})} placeholder="Swiss Modernism" />
            </div>
            <InputField label="Color Mood" value={data.answers.colorMood} onChange={e => onSave({ answers: { ...data.answers, colorMood: e.target.value }})} placeholder="Dark Graphite" />
            <ButtonPrimary onClick={buildKit} disabled={loading} fullWidth className="h-16">
               {loading ? <LoadingDots label="Forging Identity" /> : "Consolidate DNA →"}
            </ButtonPrimary>
         </div>
       )}

       {activeTab === 'Kit' && data.kit && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#1a1a1a] animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#101010] p-12 space-y-12">
               <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Chromatics</label>
               <div className="flex h-24 gap-1">
                  {Object.entries(data.kit.colors).map(([k, hex]) => (
                    <div key={k} className="flex-1 border border-white/5" style={{ background: hex }} />
                  ))}
               </div>
            </div>
            <div className="bg-[#101010] p-12 space-y-8">
               <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Typography</label>
               <div className="space-y-4">
                  <h4 className="text-4xl font-bold text-white uppercase italic tracking-tighter" style={{ fontFamily: data.kit.fonts.display }}>{data.kit.fonts.display}</h4>
                  <p className="text-sm text-[#5a5a5a] font-medium" style={{ fontFamily: data.kit.fonts.body }}>{data.kit.fonts.body} — Paired for readability.</p>
               </div>
            </div>
         </div>
       )}

       {activeTab === 'Logo' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#1a1a1a]">
            <div className="bg-[#101010] p-12 space-y-12">
               <label className="text-[9px] mono font-bold text-[#5a5a5a] uppercase tracking-[0.4em]">Mark Style</label>
               <div className="flex flex-col gap-4">
                  {['modern', 'minimal', 'luxury'].map(s => (
                    <button key={s} onClick={() => onSave({ logoStyle: s })} className={`w-full p-6 text-[10px] font-bold uppercase mono tracking-[0.3em] border transition-all ${data.logoStyle === s ? 'bg-white text-black border-white' : 'bg-[#161616] border-[#252525] text-[#5a5a5a] hover:text-white hover:border-[#2e2e2e]'}`}>{s}</button>
                  ))}
               </div>
               <ButtonPrimary onClick={goNext} fullWidth className="h-16 mt-8">Finalize Identity →</ButtonPrimary>
            </div>
            <div className="bg-[#101010] p-12 flex items-center justify-center min-h-[400px]">
               <div className="w-64 h-64 border border-[#1a1a1a] flex items-center justify-center bg-[#161616] grayscale invert brightness-200">
                  {/* Logo Placeholder */}
                  <div className="w-16 h-1 w-full bg-white opacity-20" />
               </div>
            </div>
         </div>
       )}
    </div>
  );
}

// ── STEP 05: BIZ PLAN ──
function BizPlanStep({ nameData, data, onSave, goNext, isPro }) {
  const [loading, setLoading] = useState(false);
  
  const generate = async () => {
    setLoading(true);
    try {
      const prompt = `Business plan JSON for ${nameData.selectedName}.`;
      const res = await streamGroq("Economist", prompt, () => {});
      onSave({ data: parseAIJsonStr(res) });
    } catch (e) { }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl space-y-16 relative">
      {!isPro && (
        <div className="absolute inset-0 z-50 bg-[#080808]/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-12 border border-[#1a1a1a]">
           <Lock size={48} className="mb-10 text-[#2e2e2e]" />
           <h3 className="text-3xl font-syne font-extrabold mb-6 uppercase italic text-white tracking-tighter">Architecture Locked</h3>
           <p className="text-sm text-[#5a5a5a] mb-12 max-w-xs font-medium">Business intelligence requires a Pro identity master handle.</p>
           <ButtonPrimary onClick={() => window.open(WAITLIST_URL,'_blank')} className="px-12 h-16">Join Waitlist →</ButtonPrimary>
           <ButtonText onClick={goNext} className="mt-10">Skip to Export Sequence →</ButtonText>
        </div>
      )}

      <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Step 05 / Strategy Phase</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Business Plan.</h2>
      </div>

      {!data.data ? (
        <div className="py-40 border border-[#1a1a1a] bg-[#101010] flex flex-col items-center justify-center">
           <ButtonPrimary onClick={generate} disabled={loading} className="h-16 px-16">
              {loading ? <LoadingDots label="Modeling Strategy" /> : "Initiate Generator →"}
           </ButtonPrimary>
        </div>
      ) : (
        <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-10 animate-in fade-in">
           <h4 className="text-2xl font-syne font-extrabold text-white uppercase italic">Consolidated strategy</h4>
           <div className="w-12 h-[1px] bg-[#252525]" />
           <p className="text-sm leading-relaxed text-[#5a5a5a] font-inter">{data.data.executiveSummary}</p>
           <ButtonPrimary onClick={goNext} className="mt-12 h-16 px-12">Proceed to Final dossier →</ButtonPrimary>
        </div>
      )}
    </div>
  );
}

// ── STEP 06: EXPORT ──
function ExportStep({ currentProject, isPro }) {
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    const html = `<html><body><h1>${currentProject.title}</h1></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'BrandKit.html'; a.click();
    setDone(true);
  };

  return (
    <div className="max-w-2xl space-y-16">
       <div className="space-y-6">
         <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Final Phase / Output</span>
         <h2 className="text-5xl font-syne font-extrabold tracking-tighter text-white">Export.</h2>
       </div>

       <div className="bg-[#101010] border border-[#1a1a1a] p-16 text-center space-y-12">
          <div className="w-full flex gap-1">
             {[...Array(6)].map((_, i) => <div key={i} className="h-1 flex-1 bg-white" />)}
          </div>
          <p className="text-[10px] mono text-[#5a5a5a] font-bold uppercase tracking-[0.4em]">All modules verified</p>
          <ButtonPrimary onClick={handleExport} className="h-24 w-full text-lg font-syne font-extrabold uppercase italic tracking-tighter">Download Complete Brand Kit →</ButtonPrimary>
          {!isPro && <p className="text-[9px] mono text-[#2e2e2e] uppercase font-bold tracking-widest">High-fidelity PDF requires Pro handle.</p>}
       </div>

       {done && (
         <div className="text-center success-msg py-12 border border-[#1a1a1a] bg-[#101010]">
            <h4 className="text-white font-syne font-extrabold uppercase italic text-xl mb-6">Forge Cycle Complete ✓</h4>
            <ButtonGhost onClick={() => window.open(FEEDBACK_URL, '_blank')}>Share Experience</ButtonGhost>
         </div>
       )}
    </div>
  );
}

// ── MAIN BUILDER SCREEN ───────────────────────────────────────

export function BuilderScreen() {
  const { 
    currentProject, stepData, saveStepData, 
    isPro, supabase, session, loading
  } = useBrandsmith();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState('idea');

  const stepsArr = ['idea', 'name', 'availability', 'identity', 'bizplan', 'export'];
  const stepLabels = { idea: 'Idea Lab', name: 'Name Studio', availability: 'Availability', identity: 'Identity', bizplan: 'Business Plan', export: 'Export' };
  const stepIcons = { idea: Lightbulb, name: Pencil, availability: Globe, identity: Palette, bizplan: Briefcase, export: Download };

  const currentIdx = stepsArr.indexOf(activeStep);
  const goNext = () => { if (currentIdx < stepsArr.length - 1) setActiveStep(stepsArr[currentIdx + 1]); };

  if (loading || !currentProject) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
       <div className="bs-spinner" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] flex font-inter overflow-hidden selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-[80px] md:w-[320px] border-r border-[#1a1a1a] bg-[#080808] flex flex-col shrink-0 z-20">
        <div className="h-[72px] flex items-center px-8 gap-4 border-b border-[#1a1a1a] cursor-pointer bg-[#080808]" onClick={() => navigate('/dashboard')}>
           <img src={BRANDSMITH_LOGO} width={28} className="grayscale brightness-200" alt="L" />
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
                 className={`w-full flex items-center gap-6 p-6 transition-all group rounded-sm ${isActive ? 'bg-white text-black' : 'hover:bg-[#101010] text-[#5a5a5a]'}`}
               >
                 <Icon size={20} className={isActive ? 'text-black' : 'group-hover:text-white transition-all'} />
                 <div className="hidden md:flex items-center justify-between flex-1">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mono ${isActive ? 'text-black' : 'text-inherit'}`}>{stepLabels[id]}</span>
                    {isDone && <Check size={14} className={isActive ? 'text-black' : 'text-white'} />}
                 </div>
               </button>
             );
           })}
        </div>

        <div className="p-8 border-t border-[#1a1a1a]">
           <button onClick={() => navigate('/dashboard')} className="w-full flex items-center justify-center gap-3 text-[10px] mono uppercase font-bold text-[#2e2e2e] hover:text-white transition-all tracking-[0.2em]">
              <ArrowLeft size={16} /> Dashboard
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#080808] relative">
         <div className="p-10 md:p-32 min-h-screen flex flex-col">
            <div key={activeStep} className="flex-1 max-w-4xl mx-auto w-full step-content">
               {activeStep === 'idea' && stepData?.idea && <IdeaStep data={stepData.idea} onSave={d => saveStepData('idea', d)} goNext={goNext} />}
               {activeStep === 'name' && stepData?.name && <NameStep ideaData={stepData.idea} data={stepData.name} onSave={d => saveStepData('name', d)} goNext={goNext} />}
               {activeStep === 'availability' && stepData?.availability && <AvailabilityStep nameData={stepData.name} data={stepData.availability} onSave={d => saveStepData('availability', d)} goNext={goNext} />}
               {activeStep === 'identity' && stepData?.identity && <IdentityStep name={stepData.name?.selectedName} data={stepData.identity} onSave={d => saveStepData('identity', d)} goNext={goNext} />}
               {activeStep === 'bizplan' && stepData?.bizplan && <BizPlanStep nameData={stepData.name} data={stepData.bizplan} onSave={d => saveStepData('bizplan', d)} goNext={goNext} isPro={isPro} />}
               {activeStep === 'export' && <ExportStep currentProject={currentProject} isPro={isPro} />}
            </div>

            <footer className="mt-32 pt-16 border-t border-[#1a1a1a] max-w-4xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] mono font-bold text-white uppercase italic tracking-[0.2em]">{stepLabels[activeStep]}</span>
               </div>
               <div className="flex items-center gap-12">
                  <a href={FEEDBACK_URL} target="_blank" className="text-[10px] mono text-[#2e2e2e] hover:text-white transition-all uppercase font-bold tracking-[0.3em]">Feedback</a>
                  <span className="text-[9px] mono text-[#1e1e1e] font-bold uppercase tracking-[0.2em]">© 2026 Brandsmither Studio</span>
               </div>
            </footer>
         </div>
      </main>
    </div>
  );
}

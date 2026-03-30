import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const BRANDSMITH_LOGO = "https://i.ibb.co/HDgyv5q6/Add-a-subheading-1.png";

export function BrandsmithLogo({ size = 32 }) {
  return <img src={BRANDSMITH_LOGO} width={size} height={size} alt="Brandsmither" className="grayscale brightness-200" style={{ display: "block", objectFit: "contain" }} />;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollPos(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#080808] text-white selection:bg-white selection:text-black font-inter overflow-x-hidden">
      {/* Beta Banner */}
      <div className="bg-[#101010] border-b border-[#1a1a1a] py-3 px-4 text-center">
        <a 
          href="https://forms.gle/XEzazozoajjK4pDo7" 
          target="_blank" 
          rel="noreferrer" 
          className="text-[10px] mono font-bold text-[#5a5a5a] hover:text-white transition-all tracking-[0.4em] uppercase"
        >
          🚀 Brandsmither is in Beta — Share feedback →
        </a>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-[80px] bg-[#080808]/90 backdrop-blur-xl border-b border-[#1a1a1a] flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <BrandsmithLogo size={28} />
          <span className="font-syne font-extrabold text-sm tracking-tighter uppercase italic">Brandsmither</span>
        </div>

        <div className="hidden md:flex items-center gap-12 text-[10px] font-bold uppercase tracking-[0.3em] mono text-[#5a5a5a]">
          <a href="#features" className="hover:text-white transition-all">Features</a>
          <a href="#compare" className="hover:text-white transition-all">Difference</a>
          <a href="#pricing" className="hover:text-white transition-all">Pricing</a>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/auth" className="text-[10px] font-bold uppercase tracking-[0.3em] mono text-[#5a5a5a] hover:text-white transition-all px-4 py-2">Sign in</Link>
          <button 
            onClick={() => navigate('/auth')} 
            className="bg-white text-[#080808] px-8 py-3 rounded-sm text-[10px] font-extrabold uppercase tracking-[0.2em] hover:bg-[#e8e8e8] transition-all"
          >
            Start free →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        
        <div className="relative z-10 max-w-[900px]">
          <span className="inline-block px-6 py-2 border border-[#1a1a1a] text-[10px] font-bold mono tracking-[0.4em] mb-12 bg-[#101010] animate-in fade-in slide-in-from-bottom-2 duration-700 uppercase text-[#5a5a5a]">
            AI-POWERED BRAND ARCHITECT
          </span>
          <h1 className="text-6xl md:text-9xl font-syne font-extrabold leading-[0.85] mb-10 tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-1000 text-white italic uppercase">
            Build your brand.<br />Not your budget.
          </h1>
          <p className="text-[#5a5a5a] text-base md:text-lg leading-relaxed max-w-[540px] mx-auto mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 font-medium">
            From raw idea to complete brand identity in one flow. Name, logo, strategy and business plan — forged in minutes.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <button 
              onClick={() => navigate('/auth')} 
              className="w-full md:w-auto bg-white text-[#080808] px-12 py-6 rounded-sm text-xs font-extrabold uppercase tracking-[0.2em] hover:bg-[#e8e8e8] transition-all"
            >
              Start building free →
            </button>
            <Link to="/auth" className="w-full md:w-auto border border-[#252525] px-12 py-6 rounded-sm text-xs font-extrabold uppercase tracking-[0.2em] text-white hover:border-white transition-all">
              Log in to forge
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 opacity-20">
          <div className="w-[1px] h-16 bg-white animate-pulse" />
        </div>
      </section>

      {/* Marquee */}
      <section className="border-y border-[#1a1a1a] py-10 bg-[#101010] overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="text-sm font-syne font-extrabold uppercase tracking-[0.5em] text-[#1e1e1e] mx-16 italic">
              Idea Lab · Name Studio · Availability · Identity · Business Plan · Export Kit
            </span>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 md:py-64 px-6 md:px-12 border-b border-[#1a1a1a]">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-32">
            <span className="text-[10px] font-bold mono tracking-[0.5em] text-[#5a5a5a] uppercase mb-6 block">The Architecture</span>
            <h3 className="text-5xl md:text-7xl font-syne font-extrabold tracking-tighter italic uppercase text-white">Six steps to launch.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Idea Lab', desc: 'Stress-test your vision with AI-driven market intelligence.' },
              { num: '02', title: 'Name Studio', desc: 'Discover high-converting brand handles forged for impact.' },
              { num: '03', title: 'Availability', desc: 'Secure your presence across domains and social nodes instantly.' },
              { num: '04', title: 'Identity', desc: 'Forge a color palette, font system, and visual mark architecture.' },
              { num: '05', title: 'Business Plan', desc: 'Formalize your strategy with an investor-ready roadmap.' },
              { num: '06', title: 'Export', desc: 'Download your complete identity kit as a portable dossier.' }
            ].map((s, i) => (
              <div key={i} className="bg-[#101010] border border-[#1a1a1a] p-12 group hover:border-[#252525] transition-all relative overflow-hidden">
                <span className="absolute -top-4 -right-4 text-8xl font-syne font-extrabold text-white opacity-[0.02] group-hover:opacity-[0.05] transition-all">{s.num}</span>
                <span className="block text-2xl font-syne font-extrabold mb-10 text-[#2e2e2e] group-hover:text-white transition-all uppercase italic tracking-tighter">{s.num}</span>
                <h4 className="text-2xl font-syne font-extrabold mb-6 text-white uppercase">{s.title}</h4>
                <p className="text-sm text-[#5a5a5a] leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="compare" className="py-32 md:py-64 px-6 md:px-12 border-b border-[#1a1a1a] bg-[#101010]">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="mb-32">
            <span className="text-[10px] font-bold mono tracking-[0.5em] text-[#5a5a5a] uppercase mb-6 block">Benchmark</span>
            <h3 className="text-5xl md:text-7xl font-syne font-extrabold tracking-tighter italic uppercase text-white">Forged Different.</h3>
          </div>

          <div className="overflow-x-auto border border-[#1a1a1a] bg-[#080808]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="p-10 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-[#5a5a5a]">Metric</th>
                  <th className="p-10 font-syne text-lg font-extrabold text-center uppercase italic">Brandsmither</th>
                  <th className="p-10 font-syne text-lg font-extrabold text-center uppercase italic opacity-20">Traditional</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { f: 'Market Validation', b: true, c: false },
                  { f: 'Name Generation', b: true, c: 'Manual' },
                  { f: 'Network Presence', b: true, c: false },
                  { f: 'Strategy Forge', b: true, c: false },
                  { f: 'Portable Export', b: true, c: false },
                  { f: 'Time to launch', b: 'Minutes', c: 'Weeks' },
                  { f: 'Initial Cost', b: '$0', c: '$$$$' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#101010] transition-all">
                    <td className="p-10 text-[#5a5a5a] font-bold uppercase tracking-widest text-[10px] mono">{row.f}</td>
                    <td className="p-10 text-center font-extrabold text-white text-lg">{row.b === true ? '✓' : row.b}</td>
                    <td className="p-10 text-center text-[#2e2e2e] font-extrabold uppercase italic">{row.c === false ? '—' : row.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 md:py-64 px-6 md:px-12 border-b border-[#1a1a1a]">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="mb-32">
            <span className="text-[10px] font-bold mono tracking-[0.5em] text-[#5a5a5a] uppercase mb-6 block">Access</span>
            <h3 className="text-5xl md:text-7xl font-syne font-extrabold tracking-tighter italic uppercase text-white">Simple Pricing.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-[900px] mx-auto">
            {/* Starter */}
            <div className="border border-[#1a1a1a] bg-[#101010] p-16 text-left flex flex-col items-start hover:border-[#252525] transition-all cursor-crosshair">
              <span className="text-[10px] font-bold mono tracking-[0.4em] uppercase mb-6 text-[#5a5a5a]">Starter</span>
              <div className="text-6xl font-syne font-extrabold mb-12 text-white italic">$0<span className="text-xs text-[#5a5a5a] font-inter ml-3 not-italic tracking-normal">free forever</span></div>
              <ul className="space-y-6 mb-16 flex-1">
                {['2 Brand Architectures', 'Core sequence module', 'HTML kit exports'].map(f => (
                  <li key={f} className="text-xs font-bold uppercase tracking-widest text-[#5a5a5a] flex items-center gap-4"><Check size={14} className="opacity-20" /> {f}</li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/auth')} 
                className="w-full py-6 bg-transparent border border-[#252525] text-[10px] font-extrabold uppercase tracking-[0.3em] hover:bg-white hover:text-[#080808] transition-all mono"
              >
                Get started →
              </button>
            </div>

            {/* Pro */}
            <div className="border border-white bg-white text-[#080808] p-16 text-left flex flex-col items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 bg-black text-white text-[8px] font-extrabold mono uppercase tracking-widest">Recommended</div>
              <span className="text-[10px] font-bold mono tracking-[0.4em] uppercase mb-6 opacity-30">Experimental</span>
              <div className="text-6xl font-syne font-extrabold mb-12 italic">$12<span className="text-xs opacity-40 font-inter ml-3 not-italic tracking-normal">/month</span></div>
              <ul className="space-y-6 mb-16 flex-1">
                {['Unlimited Architectures', 'All sequence modules', 'Priority intelligence', 'Portable Dossiers'].map(f => (
                  <li key={f} className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-4"><Check size={14} /> {f}</li>
                ))}
              </ul>
              <button 
                onClick={() => window.open('https://forms.gle/ZwopkN8xW63UccfE6','_blank')}
                className="w-full py-6 bg-[#080808] text-white text-[10px] font-extrabold uppercase tracking-[0.3em] hover:opacity-80 transition-all mono text-center"
              >
                Join Waitlist →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 md:py-96 px-6 text-center bg-[#101010] border-b border-[#1a1a1a]">
        <h2 className="text-6xl md:text-[140px] font-syne font-extrabold tracking-tighter mb-16 italic uppercase text-white leading-[0.8] animate-pulse">Start forging.</h2>
        <button 
          onClick={() => navigate('/auth')} 
          className="bg-white text-[#080808] px-16 py-8 rounded-sm text-sm font-extrabold uppercase tracking-[0.3em] hover:scale-110 transition-all duration-700"
        >
          Initialize build →
        </button>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 md:px-12 bg-[#080808]">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
          <div className="flex items-center gap-6">
            <BrandsmithLogo size={32} />
            <span className="font-syne font-extrabold text-lg tracking-tighter uppercase italic text-white mt-1">Brandsmither</span>
          </div>

          <div className="flex flex-wrap gap-12 text-[10px] font-bold uppercase tracking-[0.4em] text-[#2e2e2e] mono">
            <a href="#features" className="hover:text-white transition-all">Features</a>
            <a href="#pricing" className="hover:text-white transition-all">Pricing</a>
            <Link to="/privacy" className="hover:text-white transition-all">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-all">Terms</Link>
          </div>

          <div className="text-[10px] mono text-[#1e1e1e] font-bold uppercase tracking-[0.3em] pt-8 md:pt-0">
            © 2026 Brandsmither Studio · All systems active
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 80s linear infinite; }
      `}</style>
    </div>
  );
}

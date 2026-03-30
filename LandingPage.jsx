import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const BRANDSMITH_LOGO = "https://i.ibb.co/HDgyv5q6/Add-a-subheading-1.png";

export function BrandsmithLogo({ size = 32 }) {
  return <img src={BRANDSMITH_LOGO} width={size} height={size} alt="Brandsmither" style={{ display: "block", objectFit: "contain" }} />;
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
    <div className="bg-[#080808] text-white selection:bg-white selection:text-black font-dm overflow-x-hidden">
      {/* Beta Banner */}
      <div className="bg-[#111] border-b border-[#1c1c1c] py-2 px-4 text-center">
        <a 
          href="https://forms.gle/XEzazozoajjK4pDo7" 
          target="_blank" 
          rel="noreferrer" 
          className="text-[10px] mono font-bold text-[#4a4a4a] hover:text-white transition-all tracking-widest"
        >
          🚀 Brandsmither is in Beta — Share feedback →
        </a>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-[72px] bg-[#080808]/80 backdrop-blur-md border-b border-[#1c1c1c] flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <BrandsmithLogo size={24} />
          <span className="font-syne font-extrabold text-sm tracking-tighter uppercase">Brandsmither</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-[#4a4a4a]">
          <a href="#features" className="hover:text-white transition-all">Features</a>
          <a href="#compare" className="hover:text-white transition-all">Difference</a>
          <a href="#pricing" className="hover:text-white transition-all">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-[10px] font-bold uppercase tracking-widest text-[#4a4a4a] hover:text-white transition-all px-4 py-2">Sign in</Link>
          <button 
            onClick={() => navigate('/auth')} 
            className="bg-white text-black px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-[#e0e0e0] transition-all"
          >
            Start free →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10 max-w-[800px]">
          <span className="inline-block px-4 py-1.5 border border-[#1c1c1c] text-[10px] font-bold mono tracking-[0.2em] mb-8 bg-[#111] animate-in fade-in slide-in-from-bottom-2 duration-700">
            AI-POWERED BRAND BUILDER
          </span>
          <h1 className="text-5xl md:text-8xl font-syne font-extrabold leading-[0.9] mb-8 tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Build your brand.<br />Not your budget.
          </h1>
          <p className="text-[#4a4a4a] text-sm md:text-base leading-relaxed max-w-[500px] mx-auto mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            From raw idea to complete brand identity in minutes. Name, logo, colors, voice and business plan — all in one flow.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <button 
              onClick={() => navigate('/auth')} 
              className="w-full md:w-auto bg-white text-black px-10 py-5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#e0e0e0] transition-all"
            >
              Start building free →
            </button>
            <Link to="/auth" className="w-full md:w-auto border border-[#1c1c1c] px-10 py-5 rounded-sm text-xs font-bold uppercase tracking-widest text-[#4a4a4a] hover:text-white hover:border-[#4a4a4a] transition-all">
              See how it works
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <div className="w-px h-12 bg-white" />
        </div>
      </section>

      {/* Marquee */}
      <section className="border-y border-[#1c1c1c] py-8 bg-[#0a0a0a] overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(20)].map((_, i) => (
            <span key={i} className="text-sm font-syne font-bold uppercase tracking-[0.3em] text-[#222] mx-12">
              Idea Validation · Brand Names · Domain Check · Color Palette · Logo Generator · Brand Voice · Business Plan · Brand Kit Export
            </span>
          ))}
        </div>
      </section>

      {/* Parallax Band 1 */}
      <div className="py-24 border-b border-[#1c1c1c] relative overflow-hidden h-[200px] flex items-center">
        <h2 className="absolute whitespace-nowrap text-[120px] md:text-[200px] font-syne font-extrabold text-[#111] leading-none select-none transition-transform duration-75"
            style={{ transform: `translateX(${scrollPos * 0.2 - 200}px)` }}>
          BRAND IDENTITY BRAND IDENTITY BRAND IDENTITY
        </h2>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-48 px-6 md:px-12 border-b border-[#1c1c1c]">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-24">
            <span className="text-[10px] font-bold mono tracking-[0.4em] text-[#4a4a4a] uppercase mb-4 block">The Process</span>
            <h3 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tighter">Six steps to a complete brand.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-[#1c1c1c]">
            {[
              { num: '01', title: 'Idea Lab', desc: 'Stress-test your business idea with our AI-driven market intelligence engine.' },
              { num: '02', title: 'Name Studio', desc: 'Discover high-converting brand handles that vibrate with your core vision.' },
              { num: '03', title: 'Availability', desc: 'Secure your digital presence across domain extensions and social handles instantly.' },
              { num: '04', title: 'Brand Identity', desc: 'Generate a professional color palette, font system, and logo architecture.' },
              { num: '05', title: 'Business Plan', desc: 'Formalize your commercial strategy with an investor-ready roadmap.' },
              { num: '06', title: 'Brand Kit Export', desc: 'Download your complete identity as a portable HTML dossier for instant launch.' }
            ].map((s, i) => (
              <div key={i} className="bg-[#080808] p-10 group hover:bg-[#0a0a0a] transition-all">
                <span className="block text-2xl font-syne font-bold mb-8 text-[#1c1c1c] group-hover:text-white transition-all">{s.num}</span>
                <h4 className="text-xl font-bold mb-4">{s.title}</h4>
                <p className="text-sm text-[#4a4a4a] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features 2 Section */}
      <section className="py-24 md:py-48 px-6 md:px-12 bg-[#0a0a0a] border-b border-[#1c1c1c]">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-24 text-center">
            <span className="text-[10px] font-bold mono tracking-[0.4em] text-[#4a4a4a] uppercase mb-4 block">Why Brandsmither</span>
            <h3 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tighter">Everything in one place.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { title: 'End-to-end Flow', desc: 'No more jumping between 10 tools to start a business.' },
              { title: 'AI Branding', desc: 'Powered by Llama-3 and Groq for razor-sharp intelligence.' },
              { title: 'Idea Validation', desc: 'Venture Capital level analysis of your market fit.' },
              { title: 'Real Exports', desc: 'High-quality HTML kits you can actually use.' },
              { title: 'Business Strategy', desc: 'Automatic generation of monetization models.' },
              { title: 'Solo-Founder Ready', desc: 'Built for precision and speed for individuals.' }
            ].map((f, i) => (
              <div key={i} className="space-y-4">
                <div className="w-8 h-[1px] bg-white opacity-20" />
                <h4 className="text-lg font-bold">{f.title}</h4>
                <p className="text-sm text-[#4a4a4a] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parallax Band 2 */}
      <div className="py-24 border-b border-[#1c1c1c] relative overflow-hidden h-[200px] flex items-center">
        <h2 className="absolute whitespace-nowrap text-[120px] md:text-[200px] font-syne font-extrabold text-[#111] leading-none select-none transition-transform duration-75"
            style={{ transform: `translateX(${200 - scrollPos * 0.2}px)` }}>
          NO DESIGNER NEEDED NO DESIGNER NEEDED NO DESIGNER NEEDED
        </h2>
      </div>

      {/* Comparison Section */}
      <section id="compare" className="py-24 md:py-48 px-6 md:px-12 border-b border-[#1c1c1c]">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="mb-24">
            <span className="text-[10px] font-bold mono tracking-[0.4em] text-[#4a4a4a] uppercase mb-4 block">The Difference</span>
            <h3 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tighter">We do what they can't.</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1c1c1c]">
                  <th className="py-8 font-syne text-[10px] uppercase tracking-widest text-[#4a4a4a]">Feature</th>
                  <th className="py-8 font-syne text-sm font-bold text-center">Brandsmither</th>
                  <th className="py-8 font-syne text-sm font-bold text-center opacity-30">Competitors</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { f: 'Idea validation', b: true, c: false },
                  { f: 'Brand name generator', b: true, c: 'Some' },
                  { f: 'Domain + social checks', b: true, c: false },
                  { f: 'Identity architecture', b: true, c: 'Some' },
                  { f: 'Business plan generation', b: true, c: false },
                  { f: 'HTML + PDF exports', b: true, c: false },
                  { f: 'Single-session flow', b: true, c: false },
                  { f: 'Starting price', b: '$0 free', c: '$20-50/mo' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[#1c1c1c] hover:bg-[#0a0a0a] transition-all">
                    <td className="py-6 text-[#4a4a4a] font-bold">{row.f}</td>
                    <td className="py-6 text-center font-bold">{row.b === true ? <Check size={16} className="mx-auto" /> : row.b}</td>
                    <td className="py-6 text-center text-[#222] font-bold">{row.c === false ? '—' : row.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-48 px-6 md:px-12 border-b border-[#1c1c1c] bg-[#0a0a0a]">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="mb-24">
            <span className="text-[10px] font-bold mono tracking-[0.4em] text-[#4a4a4a] uppercase mb-4 block">Pricing</span>
            <h3 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tighter">Simple, honest pricing.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px] mx-auto">
            {/* Starter */}
            <div className="border border-[#1c1c1c] bg-[#080808] p-12 text-left flex flex-col items-start hover:border-[#4a4a4a] transition-all">
              <span className="text-[10px] font-bold mono tracking-widest uppercase mb-4 text-[#4a4a4a]">Starter</span>
              <div className="text-5xl font-syne font-bold mb-8">$0<span className="text-xs text-[#4a4a4a] font-dm ml-2">free forever</span></div>
              <ul className="space-y-4 mb-12 flex-1">
                {['2 active brands', '4 core architecture steps', 'HTML kit exports', 'Basic idea validation', 'Community support'].map(f => (
                  <li key={f} className="text-sm text-[#4a4a4a] flex items-center gap-2"><Check size={14} className="opacity-30" /> {f}</li>
                ))}
              </ul>
              <button onClick={() => navigate('/auth')} className="w-full py-4 border border-[#1c1c1c] text-[10px] font-extrabold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                Get started free →
              </button>
            </div>

            {/* Pro */}
            <div className="border border-white bg-white text-black p-12 text-left flex flex-col items-start relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 text-[8px] font-bold mono uppercase tracking-widest">Recommended</div>
              <span className="text-[10px] font-bold mono tracking-widest uppercase mb-4 opacity-50">Experimental</span>
              <div className="text-5xl font-syne font-bold mb-1">$12<span className="text-xs opacity-50 font-dm ml-2">/month</span></div>
              <div className="text-[10px] mono font-bold uppercase mb-8 opacity-40">or $99/year (Save 30%)</div>
              <ul className="space-y-4 mb-12 flex-1">
                {['Unlimited active brands', 'All 6 architecture steps', 'HTML & PDF exports', 'Full market validation', 'Business Plan Generator', 'Remove watermarks', 'Priority AI access'].map(f => (
                  <li key={f} className="text-sm font-bold flex items-center gap-2"><Check size={14} /> {f}</li>
                ))}
              </ul>
              <a href="https://forms.gle/ZwopkN8xW63UccfE6" target="_blank" rel="noreferrer" className="w-full py-4 bg-black text-white text-[10px] font-extrabold uppercase tracking-widest text-center hover:opacity-80 transition-all">
                Join Pro Waitlist →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 px-6 text-center">
        <h2 className="text-5xl md:text-8xl font-syne font-extrabold tracking-tighter mb-8 italic">Your brand starts here.</h2>
        <p className="text-[#4a4a4a] text-sm md:text-base mb-12 font-bold max-w-sm mx-auto">Join founders and entrepreneurs building with Brandsmither.</p>
        <button 
          onClick={() => navigate('/auth')} 
          className="bg-white text-black px-12 py-5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#e0e0e0] transition-all"
        >
          Start building free →
        </button>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 md:px-12 border-t border-[#1c1c1c] bg-[#0a0a0a]">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="flex items-center gap-4">
            <BrandsmithLogo size={24} />
            <span className="font-syne font-extrabold text-sm tracking-tighter uppercase italic">Brandsmither</span>
          </div>

          <div className="flex flex-wrap gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a4a4a] mono">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="https://instagram.com/yourbrandsmith" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
            <a href="https://x.com/brandsmither" target="_blank" rel="noreferrer" className="hover:text-white">Twitter</a>
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
          </div>

          <div className="text-[9px] mono text-[#222]">
            © 2026 Brandsmither · brandsmither.vercel.app
          </div>
        </div>
      </footer>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
      `}</style>
    </div>
  );
}

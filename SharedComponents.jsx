import React from 'react';
import { BRANDSMITH_LOGO } from './BrandsmithContext';

export function BrandsmithLogo({ size = 24, className = "" }) {
  return <img src={BRANDSMITH_LOGO} width={size} height={size} alt="Brandsmither Logo" className={`grayscale brightness-200 ${className}`} />;
}

export function Spinner() {
  return <span className="bs-spinner" />;
}

export function LoadingDots({ label = '' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {label && <span className="mono text-[10px] uppercase font-bold tracking-[0.2em] text-[#5a5a5a]">{label}</span>}
      <span className="bs-dots text-white"><span /><span /><span /></span>
    </span>
  );
}

export function StreamText({ text, speed = 8 }) {
  const [displayed, setDisplayed] = React.useState('');
  React.useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text]);
  return <>{displayed}</>;
}

export function ButtonPrimary({ children, onClick, disabled, className = "", fullWidth = false, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-white text-[#080808] font-bold text-xs py-3 px-8 rounded-sm transition-all hover:bg-[#e8e8e8] disabled:opacity-20 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonGhost({ children, onClick, disabled, className = "", type = "button", fullWidth = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent border border-[#252525] text-white font-bold text-xs py-3 px-8 rounded-sm transition-all hover:border-[#2e2e2e] hover:bg-[#101010] disabled:opacity-20 ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonText({ children, onClick, disabled, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent text-[#5a5a5a] text-xs py-1 transition-all hover:text-white disabled:opacity-20 font-bold uppercase tracking-widest ${className}`}
    >
      {children}
    </button>
  );
}

export function InputField({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={`mb-8 ${className}`}>
      {label && <label className="block text-[10px] font-bold text-[#5a5a5a] uppercase tracking-widest mono mb-4">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#161616] border border-[#252525] p-4 text-sm text-white outline-none transition-all focus:border-[#2e2e2e] placeholder:text-[#2e2e2e]"
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 4, className = "" }) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && <label className="block text-[10px] font-bold text-[#5a5a5a] uppercase tracking-widest mono mb-4">{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#161616] border border-[#252525] p-4 text-sm text-white outline-none transition-all focus:border-[#2e2e2e] placeholder:text-[#2e2e2e] resize-none"
      />
    </div>
  );
}

export function UserAvatar({ name, size = 32, onClick }) {
  const initials = (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      onClick={onClick}
      className="bg-[#101010] border border-[#1a1a1a] rounded-sm flex items-center justify-center cursor-pointer hover:border-[#252525] transition-all"
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] font-bold mono text-[#5a5a5a]">{initials || '?'}</span>
    </div>
  );
}

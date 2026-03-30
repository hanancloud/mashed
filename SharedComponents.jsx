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
      {label && <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>{label}</span>}
      <span className="bs-dots"><span /><span /><span /></span>
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
      className={`bg-[#ffffff] text-[#080808] font-bold text-xs py-2.5 px-6 rounded-sm transition-all hover:bg-[#e8e8e8] disabled:opacity-15 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonGhost({ children, onClick, disabled, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent border border-[#1a1a1a] text-[#5a5a5a] text-xs py-2 px-5 rounded-sm transition-all hover:border-[#2e2e2e] hover:text-[#f5f5f5] disabled:opacity-15 ${className}`}
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
      className={`bg-transparent text-[#5a5a5a] text-xs py-1 transition-all hover:text-[#f5f5f5] disabled:opacity-15 ${className}`}
    >
      {children}
    </button>
  );
}

export function InputField({ label, value, onChange, placeholder, type = "text", className = "" }) {
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

export function TextAreaField({ label, value, onChange, placeholder, rows = 4, className = "" }) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && <label className="block text-[10px] font-bold text-[#5a5a5a] mb-2">{label}</label>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#101010] border border-[#1a1a1a] p-4 text-sm text-[#f5f5f5] outline-none transition-all focus:border-[#2e2e2e] placeholder:text-[#5a5a5a] resize-none font-dm"
      />
    </div>
  );
}

export function UserAvatar({ name, size = 32, onClick }) {
  const initials = (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      onClick={onClick}
      className="bg-[#121212] border border-[#1c1c1c] rounded-full flex items-center justify-center cursor-pointer hover:border-[#4a4a4a] transition-all"
      style={{ width: size, height: size }}
    >
      <span className="text-[10px] font-bold mono text-[#4a4a4a]">{initials || '?'}</span>
    </div>
  );
}

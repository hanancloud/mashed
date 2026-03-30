import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBrandsmith, BRANDSMITH_LOGO } from './BrandsmithContext';
import { ButtonPrimary, ButtonGhost, ButtonText, InputField, Spinner } from './SharedComponents';

export function AuthScreen() {
  const { setSession, supabase } = useBrandsmith();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isSignUp) {
        await supabase.auth.signUp(email, password);
        setMessage('Check your email for a verification link.');
      } else {
        const data = await supabase.auth.signInWithPassword({ email, password });
        setSession(data);
        navigate('/dashboard');
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleOAuth = (provider) => {
    supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 md:p-12 font-inter">
      <div className="w-full max-w-[420px] bg-[#101010] border border-[#1a1a1a] p-10 md:p-16 card-anim">
        <div className="flex flex-col items-center justify-center mb-16">
          <img src={BRANDSMITH_LOGO} width={42} height={42} alt="Logo" className="mb-8" />
          <h1 className="text-3xl font-syne font-extrabold tracking-tighter italic text-white">Brandsmither</h1>
        </div>

        {message ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-syne font-extrabold mb-4 italic">Success</h2>
            <p className="text-sm text-[#5a5a5a] mb-8">{message}</p>
            <ButtonGhost onClick={() => setMessage('')} fullWidth>Back up</ButtonGhost>
          </div>
        ) : (
          <form onSubmit={handleAuth}>
            {error && (
              <div className="bg-white text-[#080808] text-[10px] uppercase font-bold mono p-4 mb-10 text-center">
                {error}
              </div>
            )}
            
            <InputField 
              label="Email" 
              type="email" 
              placeholder="founder@brandsmither.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <InputField 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <ButtonPrimary type="submit" fullWidth disabled={loading} className="mt-4">
              {loading ? <Spinner /> : (isSignUp ? "Sign up →" : "Sign In →")}
            </ButtonPrimary>

            <div className="flex flex-col items-center mt-12 gap-8">
              <div className="w-full h-px bg-[#1a1a1a]" />
              
              <div className="w-full">
                <ButtonGhost onClick={() => handleOAuth('google')} fullWidth>Continue with Google</ButtonGhost>
              </div>

              <div className="flex flex-col items-center gap-6">
                <ButtonText onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </ButtonText>
                
                <div className="flex items-center gap-6 text-[#2e2e2e] font-bold mono text-[8px] tracking-[0.2em] uppercase">
                   <Link to="/privacy" className="hover:text-white transition-all">Privacy</Link>
                   <Link to="/terms" className="hover:text-white transition-all">Terms</Link>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

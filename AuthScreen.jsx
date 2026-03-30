import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrandsmith, BRANDSMITH_LOGO } from './BrandsmithContext';
import { ButtonPrimary, ButtonGhost, ButtonText, InputField, Spinner } from './SharedComponents';

export function AuthScreen() {
  const { session, setSession, supabase } = useBrandsmith();
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
        setMessage('Registration successful! Please check your email for a verification link.');
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
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 md:p-12 font-dm">
      <div className="w-full max-w-[420px] bg-[#0a0a0a] border border-[#1c1c1c] p-10 md:p-16 card-anim">
        <div className="flex flex-col items-center justify-center mb-16">
          <img src={BRANDSMITH_LOGO} width={42} height={42} alt="Logo" className="mb-8" />
          <h1 className="text-3xl font-syne font-extrabold tracking-tighter uppercase italic">Brandsmither</h1>
        </div>

        {message ? (
          <div className="text-center success-msg py-12">
            <h2 className="text-xl mb-4">Welcome to the forge</h2>
            <p className="text-sm text-[#5a5a5a]">{message}</p>
            <ButtonGhost onClick={() => setMessage('')} className="mt-8">Back to login</ButtonGhost>
          </div>
        ) : (
          <form onSubmit={handleAuth}>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase font-bold mono p-4 mb-8 text-center">{error}</div>}
            
            <InputField 
              label="Email Address" 
              type="email" 
              placeholder="e.g. founder@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-10"
            />
            
            <InputField 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-12"
            />

            <ButtonPrimary type="submit" fullWidth disabled={loading}>
              {loading ? <Spinner /> : (isSignUp ? "Create account →" : "Sign In →")}
            </ButtonPrimary>

            <div className="flex flex-col items-center mt-12 gap-8">
              <div className="w-full h-px bg-[#1c1c1c]" />
              
              <div className="w-full">
                <ButtonGhost onClick={() => handleOAuth('google')} fullWidth>Continue with Google</ButtonGhost>
              </div>

              <div className="flex flex-col items-center gap-4">
                <ButtonText onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? "Already a forge master? Log in" : "New founder? Create an account"}
                </ButtonText>
                <div className="flex items-center gap-6 text-[#222]">
                   <Link to="/privacy" className="text-[9px] mono hover:text-white transition-all">Privacy</Link>
                   <Link to="/terms" className="text-[9px] mono hover:text-white transition-all">Terms</Link>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

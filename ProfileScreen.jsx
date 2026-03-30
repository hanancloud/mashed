import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBrandsmith, BRANDSMITH_LOGO } from './BrandsmithContext';
import { ButtonPrimary, ButtonGhost, ButtonText, InputField, Spinner, UserAvatar } from './SharedComponents';
import { ArrowLeft, LogOut, Trash2, CreditCard, User, Settings } from 'lucide-react';

export function ProfileScreen() {
  const { session, userData, setSession, setUserData, supabase, isPro } = useBrandsmith();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(userData?.full_name || '');
  const [success, setSuccess] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('profiles').update({ full_name: name }, 'id', session.user.id, session.access_token);
      setUserData({ ...userData, full_name: name });
      setSuccess('Identity updated ✓');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) { }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    supabase.auth.signOut(session.access_token);
    setSession(null);
    setUserData(null);
    localStorage.removeItem('brandsmith_session');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('This action is irreversible. All brand architectures will be purged. Proceed?')) return;
    try {
      await supabase.from('profiles').delete('id', session.user.id, session.access_token);
      handleLogout();
    } catch (e) { }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col font-inter selection:bg-white selection:text-black">
      {/* Header */}
      <header className="h-[72px] border-b border-[#1a1a1a] bg-[#080808] sticky top-0 z-50 px-6 md:px-12 flex justify-center">
        <div className="max-w-[800px] w-full h-full flex items-center justify-between">
          <ButtonText onClick={() => navigate('/dashboard')} className="flex items-center gap-3">
            <ArrowLeft size={16} /> Return to Dashboard
          </ButtonText>
          <div className="flex items-center gap-3">
             <img src={BRANDSMITH_LOGO} width={18} height={18} alt="Logo" className="grayscale brightness-200" />
             <span className="font-syne font-extrabold text-[10px] uppercase tracking-tighter italic text-white">Brandsmither</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto flex justify-center">
        <div className="max-w-[800px] w-full space-y-20 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Identity Section */}
          <section className="space-y-6">
             <div className="flex items-center gap-4">
               <User size={18} className="text-[#2e2e2e]" />
               <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">User Identity</span>
             </div>
             
             <div className="bg-[#101010] border border-[#1a1a1a] p-12 space-y-12">
               <div className="flex items-center gap-8">
                 <UserAvatar name={userData?.full_name || session?.user?.email} size={80} />
                 <div className="space-y-2">
                   <h3 className="text-2xl font-syne font-extrabold text-white">{userData?.full_name || 'Unnamed Founder'}</h3>
                   <p className="text-[10px] mono font-bold uppercase tracking-widest text-[#5a5a5a]">{session?.user?.email}</p>
                 </div>
               </div>

               <form onSubmit={handleUpdate} className="space-y-10">
                 <InputField 
                   label="Profile Name" 
                   value={name} 
                   onChange={e => setName(e.target.value)} 
                   placeholder="Enter identity handle"
                 />
                 
                 <div className="flex items-center gap-6">
                   <ButtonPrimary type="submit" disabled={loading} className="px-12">
                     {loading ? <Spinner /> : 'Update Handle'}
                   </ButtonPrimary>
                   {success && <span className="text-[10px] text-white mono font-bold uppercase tracking-widest success-msg">{success}</span>}
                 </div>
               </form>
             </div>
          </section>

          {/* Subscription Section */}
          <section className="space-y-6">
             <div className="flex items-center gap-4">
               <CreditCard size={18} className="text-[#2e2e2e]" />
               <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">Forge tier</span>
             </div>
             
             <div className="bg-[#101010] border border-[#1a1a1a] p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-12">
               <div className="space-y-4">
                 <div className="flex items-center gap-4">
                   <h3 className="text-3xl font-syne font-extrabold text-white uppercase italic">{isPro ? 'Pro Master' : 'Starter'}</h3>
                   <span className="px-3 py-1 bg-white text-black text-[8px] font-bold mono uppercase tracking-[0.2em]">Active</span>
                 </div>
                 <p className="text-sm text-[#5a5a5a] max-w-sm leading-relaxed font-medium">
                   {isPro 
                     ? 'Full architecture access enabled. High-fidelity PDF exports and business modeling prioritized.' 
                     : 'Limited sequence access. Business planning and PDF exports require a Pro master handle.'}
                 </p>
               </div>
               
               {isPro ? (
                 <ButtonGhost className="w-full md:w-auto h-16">Manage Subscription</ButtonGhost>
               ) : (
                 <ButtonPrimary onClick={() => window.open("https://forms.gle/ZwopkN8xW63UccfE6", '_blank')} className="w-full md:w-auto px-12 h-16">
                    Unlock Pro →
                 </ButtonPrimary>
               )}
             </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-6 pt-16 border-t border-[#1a1a1a]">
             <div className="flex items-center gap-4">
               <Settings size={18} className="text-[#2e2e2e]" />
               <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.4em] mono">System Controls</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <button onClick={handleLogout} className="group p-8 border border-[#1a1a1a] bg-[#101010] hover:bg-white transition-all text-left flex flex-col gap-6">
                  <LogOut size={20} className="text-[#5a5a5a] group-hover:text-black transition-all" />
                  <div>
                    <span className="block text-[10px] font-extrabold mono uppercase tracking-[0.4em] mb-2 group-hover:text-black">Exit Forge</span>
                    <span className="text-xs text-[#5a5a5a] group-hover:text-[#2e2e2e] font-medium">Logout of current sequence.</span>
                  </div>
               </button>

               <button onClick={handleDeleteAccount} className="group p-8 border border-[#1a1a1a] bg-[#101010] hover:bg-white transition-all text-left flex flex-col gap-6">
                  <Trash2 size={20} className="text-[#5a5a5a] group-hover:text-black transition-all" />
                  <div>
                    <span className="block text-[10px] font-extrabold mono uppercase tracking-[0.4em] mb-2 group-hover:text-black">Purge identity</span>
                    <span className="text-xs text-[#5a5a5a] group-hover:text-[#2e2e2e] font-medium font-bold italic">Irreversible data purge.</span>
                  </div>
               </button>
             </div>

             <div className="flex justify-center gap-12 pt-20">
                <Link to="/privacy" className="text-[10px] mono text-[#2e2e2e] hover:text-white transition-all uppercase font-bold tracking-[0.3em]">Privacy</Link>
                <Link to="/terms" className="text-[10px] mono text-[#2e2e2e] hover:text-white transition-all uppercase font-bold tracking-[0.3em]">Terms</Link>
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}

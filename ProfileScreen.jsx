import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrandsmith, BRANDSMITH_LOGO } from './BrandsmithContext';
import { ButtonPrimary, ButtonGhost, ButtonText, InputField, Spinner, UserAvatar } from './SharedComponents';
import { ArrowLeft, LogOut, Trash2, CreditCard, User, Settings, Check } from 'lucide-react';

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
      setSuccess('Profile updated successfully ✓');
      setTimeout(() => setSuccess(''), 2000);
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
    if (!confirm('This action is permanent and will delete all your branding architectures. Continue?')) return;
    try {
      await supabase.from('profiles').delete('id', session.user.id, session.access_token);
      handleLogout();
    } catch (e) { }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col font-dm">
      {/* Header */}
      <header className="h-[72px] border-b border-[#1c1c1c] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 flex justify-center">
        <div className="max-w-[800px] w-full h-full flex items-center justify-between">
          <ButtonText onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-[#4a4a4a] hover:text-white">
            <ArrowLeft size={16} /> Dashboard
          </ButtonText>
          <div className="flex items-center gap-4">
             <img src={BRANDSMITH_LOGO} width={18} height={18} alt="L" />
             <span className="font-syne font-extrabold text-[10px] uppercase tracking-tighter italic">Brandsmither</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto flex justify-center">
        <div className="max-w-[800px] w-full space-y-16 py-12">
          {/* Identity Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <User size={16} className="text-[#4a4a4a]" />
               <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">User Identity</span>
             </div>
             
             <div className="bg-[#0a0a0a] border border-[#1c1c1c] p-10 space-y-8">
               <div className="flex items-center gap-6">
                 <UserAvatar name={userData?.full_name || session?.user?.email} size={64} />
                 <div className="space-y-1">
                   <h3 className="text-xl font-bold">{userData?.full_name || 'Unnamed Founder'}</h3>
                   <p className="text-[10px] mono text-[#4a4a4a]">{session?.user?.email}</p>
                 </div>
               </div>

               <form onSubmit={handleUpdate} className="space-y-8">
                 <InputField 
                   label="Display Name" 
                   value={name} 
                   onChange={e => setName(e.target.value)} 
                   placeholder="Your Name"
                 />
                 
                 <div className="flex items-center gap-4">
                   <ButtonPrimary type="submit" disabled={loading}>{loading ? <Spinner /> : 'Update Identity'}</ButtonPrimary>
                   {success && <span className="text-xs text-white mono font-bold success-msg">{success}</span>}
                 </div>
               </form>
             </div>
          </div>

          {/* Subscription Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <CreditCard size={16} className="text-[#4a4a4a]" />
               <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Forge Subscription</span>
             </div>
             
             <div className="bg-[#0a0a0a] border border-[#1c1c1c] p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
               <div className="space-y-2">
                 <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-bold">{isPro ? 'Pro Forge' : 'Starter Forge'}</h3>
                   <span className="px-3 py-1 bg-white text-black text-[8px] font-extrabold mono uppercase tracking-widest">Active</span>
                 </div>
                 <p className="text-xs text-[#4a4a4a] max-w-sm">
                   {isPro ? 'You have full access to all architecture steps and high-quality exports.' : 'You are currently on the free version. Unlock business planning and PDF exports by joining the Pro waitlist.'}
                 </p>
               </div>
               
               {isPro ? (
                 <ButtonGhost className="w-full md:w-auto">Manage Subscription</ButtonGhost>
               ) : (
                 <ButtonPrimary onClick={() => window.open("https://forms.gle/ZwopkN8xW63UccfE6", '_blank')} className="w-full md:w-auto px-8 h-12">Join Pro Waitlist →</ButtonPrimary>
               )}
             </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4 pt-12 border-t border-[#1c1c1c]">
             <div className="flex items-center gap-3">
               <Settings size={16} className="text-[#4a4a4a]" />
               <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">System & Privacy</span>
             </div>

             <div className="flex flex-col md:flex-row gap-4">
               <button onClick={handleLogout} className="flex-1 p-6 border border-[#1c1c1c] hover:bg-white hover:text-black transition-all group flex flex-col items-start gap-4 text-left">
                  <LogOut size={16} className="text-[#4a4a4a] group-hover:text-black" />
                  <div>
                    <span className="block text-[10px] font-bold mono uppercase tracking-widest mb-1">Exit Forge</span>
                    <span className="text-xs opacity-50">Log out of your current session.</span>
                  </div>
               </button>

               <button onClick={handleDeleteAccount} className="flex-1 p-6 border border-[#1c1c1c] group hover:border-red-500/50 hover:bg-red-500/10 transition-all text-left flex flex-col items-start gap-4">
                  <Trash2 size={16} className="text-[#4a4a4a] group-hover:text-red-500" />
                  <div>
                    <span className="block text-[10px] font-bold mono uppercase tracking-widest mb-1 text-red-500/50">Purge Data</span>
                    <span className="text-xs text-[#4a4a4a]">Permanently delete your account and all architectures.</span>
                  </div>
               </button>
             </div>

             <div className="flex justify-center gap-8 pt-12">
                <Link to="/privacy" className="text-[9px] mono text-[#222] hover:text-white transition-all uppercase tracking-widest">Privacy Policy</Link>
                <Link to="/terms" className="text-[9px] mono text-[#222] hover:text-white transition-all uppercase tracking-widest">Terms of Service</Link>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { Link } from 'react-router-dom';

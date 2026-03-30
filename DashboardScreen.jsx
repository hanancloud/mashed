import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrandsmith, BRANDSMITH_LOGO } from './BrandsmithContext';
import { ButtonPrimary, ButtonGhost, ButtonText, Spinner, UserAvatar } from './SharedComponents';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export function DashboardScreen() {
  const { 
    session, userData, projects, setProjects, 
    supabase, initStepData, loadProject, setStepData, setCurrentProject
  } = useBrandsmith();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    setLoading(true);
    try {
      const p = await supabase.from('projects').insert([{ user_id: session.user.id, title: 'Unfounded Vision' }], session.access_token);
      setProjects([p[0], ...projects]);
      setCurrentProject(p[0]);
      setStepData(initStepData());
      navigate('/studio');
    } catch (e) { }
    finally { setLoading(false); }
  };

  const openProject = async (p) => {
    setLoading(true);
    await loadProject(p);
    setLoading(false);
    navigate('/studio');
  };

  const deleteProject = async (id) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    try {
      await supabase.from('projects').delete('id', id, session.access_token);
      setProjects(projects.filter(p => p.id !== id));
    } catch (e) { }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col font-inter selection:bg-white selection:text-black">
      {/* Header */}
      <header className="h-[72px] border-b border-[#1a1a1a] bg-[#080808] sticky top-0 z-50 px-6 md:px-12">
        <div className="max-w-[1240px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={BRANDSMITH_LOGO} width={28} height={28} alt="Logo" className="grayscale brightness-200" />
            <span className="font-syne font-extrabold text-sm uppercase tracking-tighter italic text-white">Brandsmither</span>
          </div>

          <div className="flex items-center gap-4">
            <UserAvatar name={userData?.full_name || session?.user?.email} onClick={() => navigate('/profile')} />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-[0.3em] mono">Active Brands</span>
              <h2 className="text-5xl md:text-6xl font-syne font-extrabold tracking-tighter text-white">Your Brands.</h2>
              <p className="text-sm text-[#5a5a5a] max-w-sm font-medium">Manage your brand architectures and forge new identities.</p>
            </div>
            <ButtonPrimary onClick={createProject} disabled={loading} className="w-full md:w-auto h-16 px-10 flex items-center justify-center gap-4">
              {loading ? <Spinner /> : <><Plus size={18} /> New Brand</>}
            </ButtonPrimary>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            {projects.map((p, i) => (
              <div key={p.id} className="bg-[#101010] border border-[#1a1a1a] p-10 flex flex-col items-start gap-12 group hover:border-[#252525] transition-all card-anim cursor-pointer" onClick={() => openProject(p)}>
                <div className="flex justify-between items-start w-full">
                  <div className="space-y-3">
                    <span className="block text-[8px] mono font-bold text-[#2e2e2e] uppercase tracking-[0.4em] group-hover:text-[#5a5a5a] transition-all">Arch. {p.id.slice(0, 8)}</span>
                    <h3 className="text-2xl font-syne font-extrabold text-[#f5f5f5] group-hover:text-white transition-all truncate max-w-[220px]">
                      {p.title || 'Blank Architecture'}
                    </h3>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} 
                    className="p-2 text-[#2e2e2e] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex gap-1 h-12 w-full bg-[#080808] p-1 border border-[#1a1a1a]">
                   {p.previewColors ? p.previewColors.map((c, i) => (
                      <div key={i} className="flex-1 h-full grayscale opacity-50 group-hover:opacity-100 transition-all" style={{ background: c }} />
                   )) : <div className="flex-1 bg-[#161616] h-full" />}
                </div>

                <div className="flex items-center justify-between w-full pt-8 border-t border-[#1a1a1a]/50">
                   <span className="text-[10px] mono text-[#2e2e2e] font-bold">{new Date(p.updated_at).toLocaleDateString()}</span>
                   <div className="flex items-center gap-2 text-[#5a5a5a] group-hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest">
                      Enter Studio <ArrowRight size={14} className="group-hover:translate-x-1 transition-all" />
                   </div>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full py-32 md:py-64 flex flex-col items-center justify-center border border-[#1a1a1a] bg-[#101010]">
                <div className="w-16 h-[1px] bg-[#1a1a1a] mb-12" />
                <p className="text-[#5a5a5a] text-xs uppercase mono tracking-[0.4em] font-bold">No active brand sequences</p>
                <ButtonGhost onClick={createProject} className="mt-12">
                   Initiate your first brand →
                </ButtonGhost>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrandsmith, BRANDSMITH_LOGO } from './BrandsmithContext';
import { ButtonPrimary, ButtonGhost, ButtonText, InputField, Spinner, UserAvatar } from './SharedComponents';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export function DashboardScreen() {
  const { 
    session, userData, projects, setProjects, 
    supabase, initStepData, loadProject, setStepData, setCurrentProject, loadProjects
  } = useBrandsmith();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    setLoading(true);
    try {
      const p = await supabase.from('projects').insert([{ user_id: session.user.id, title: 'Blank Brand' }], session.access_token);
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
    if (!confirm('Are you sure you want to delete this brand architecture?')) return;
    try {
      await supabase.from('projects').delete('id', id, session.access_token);
      setProjects(projects.filter(p => p.id !== id));
    } catch (e) { }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col font-dm">
      {/* Header */}
      <header className="h-[72px] border-b border-[#1c1c1c] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12">
        <div className="max-w-[1240px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={BRANDSMITH_LOGO} width={24} height={24} alt="L" />
            <span className="font-syne font-extrabold text-[12px] uppercase tracking-tighter italic">Brandsmither</span>
          </div>

          <div className="flex items-center gap-4">
            <UserAvatar name={userData?.full_name || session?.user?.email} onClick={() => navigate('/profile')} />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-16 md:mb-24 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">Active Brands</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Your Brands.</h2>
              <p className="text-sm text-[#464646] max-w-sm">Manage your brand architectures and initiate new brand sequences.</p>
            </div>
            <ButtonPrimary onClick={createProject} disabled={loading} className="w-full md:w-auto h-16 px-8 flex items-center gap-4">
              {loading ? <Spinner /> : <><Plus size={16} /> New Brand</>}
            </ButtonPrimary>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-[#1c1c1c]">
            {projects.map((p, i) => (
              <div key={p.id} className="bg-[#0a0a0a] p-10 border border-[#1c1c1c] flex flex-col items-start gap-12 group hover:bg-[#101010] transition-all card-anim" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex justify-between items-start w-full">
                  <div className="space-y-3">
                    <span className="block text-[8px] mono font-extrabold text-[#4a4a4a] uppercase tracking-widest">Brand Arch. {p.id.slice(0, 5)}</span>
                    <h3 className="text-xl font-bold group-hover:text-white transition-all truncate max-w-[200px]">{p.title}</h3>
                  </div>
                  <button onClick={() => deleteProject(p.id)} className="p-2 text-[#222] hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex gap-2 h-8 w-full">
                   {p.previewColors ? p.previewColors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ background: c }} />
                   )) : <div className="flex-1 bg-[#121212] border border-[#1c1c1c] h-full" />}
                </div>

                <div className="flex items-center justify-between w-full pt-4 border-t border-[#1c1c1c]">
                   <span className="text-[9px] mono text-[#222]">{new Date(p.updated_at).toLocaleDateString()}</span>
                   <ButtonText onClick={() => openProject(p)} className="flex items-center gap-2 group-hover:text-white">
                      Enter Studio <ArrowRight size={12} />
                   </ButtonText>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full py-32 md:py-48 flex flex-col items-center justify-center border-2 border-dashed border-[#1c1c1c]">
                <div className="w-12 h-[1px] bg-[#1c1c1c] mb-8" />
                <p className="text-[#4a4a4a] text-sm uppercase mono tracking-widest font-extrabold">No forge sequences found.</p>
                <ButtonText onClick={createProject} className="mt-8 text-white underline underline-offset-4">Initiate your first brand →</ButtonText>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

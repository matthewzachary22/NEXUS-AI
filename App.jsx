import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CheckCircle2, ChevronDown,
  CircleHelp, Code2, Command, FolderKanban, Gamepad2, Globe2,
  GraduationCap, LayoutDashboard, LoaderCircle, Plus, Search,
  Settings2, ShieldCheck, Sparkles, WandSparkles, Zap
} from 'lucide-react';

const MODULES = [
  { id: 'game', label: 'Game Studio', desc: 'Worlds, gameplay, characters, and interactive experiences.', icon: Gamepad2, color: 'violet', prompt: 'Create a 3D exploration game with a large world, responsive controls, and a clean interface.' },
  { id: 'code', label: 'Code Studio', desc: 'Plan applications, APIs, tools, and full-stack systems.', icon: Code2, color: 'blue', prompt: 'Create a full-stack task manager with accounts, projects, and a clean dashboard.' },
  { id: 'web', label: 'Web Studio', desc: 'Design and plan modern, responsive websites.', icon: Globe2, color: 'cyan', prompt: 'Create a modern website for a creative studio with a portfolio and contact page.' },
  { id: 'cyber', label: 'Cyber Lab', desc: 'Defensive security learning with safe, authorized labs.', icon: ShieldCheck, color: 'green', prompt: 'Design a beginner-friendly defensive cybersecurity lab using a toy network and safe exercises.' },
  { id: 'learn', label: 'Learn / ICT', desc: 'Build learning tools, explainers, and classroom projects.', icon: GraduationCap, color: 'amber', prompt: 'Create an interactive ICT learning module with short lessons, examples, and quizzes.' }
];

const NAV = [
  ['overview', 'Overview', LayoutDashboard],
  ['game', 'Game Studio', Gamepad2],
  ['code', 'Code Studio', Code2],
  ['web', 'Web Studio', Globe2],
  ['cyber', 'Cyber Lab', ShieldCheck],
  ['learn', 'Learn / ICT', GraduationCap],
  ['projects', 'My projects', FolderKanban]
];

export default function App() {
  const [view, setView] = useState('overview');
  const [mode, setMode] = useState('game');
  const [prompt, setPrompt] = useState('');
  const [health, setHealth] = useState({ status: 'checking', aiConfigured: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexus-projects') || '[]'); }
    catch { return []; }
  });

  const selected = useMemo(() => MODULES.find((item) => item.id === mode) || MODULES[0], [mode]);
  const pageTitle = view === 'overview' ? 'Overview' : view === 'projects' ? 'My projects' : MODULES.find((item) => item.id === view)?.label || 'Overview';

  useEffect(() => {
    fetch('/api/health')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setHealth({ status: 'online', aiConfigured: Boolean(data.aiConfigured) }))
      .catch(() => setHealth({ status: 'offline', aiConfigured: false }));
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus-projects', JSON.stringify(projects));
  }, [projects]);

  function newWorkspace() {
    const item = { id: Date.now().toString(), title: selected.label + ' workspace', mode, status: 'Draft workspace', updatedAt: 'Just now' };
    setProjects((old) => [item, ...old]);
    setView('projects'); setPlan(''); setError('');
  }

  async function buildPlan() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError('');
    setPlan('');

    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), mode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'NEXUS could not create a plan.');
      }

      setPlan(data.plan);
      setPlanTitle(data.title || 'New project');

      setProjects((old) => [{
        id: Date.now().toString(),
        title: data.title || 'New project',
        mode,
        status: 'Plan generated',
        updatedAt: 'Just now'
      }, ...old]);

    } catch {
      const title = prompt.trim().slice(0, 60) || selected.label + ' project';

      const features = {
        game: [
          'Define the game objective and progression.',
          'Plan player movement and camera controls.',
          'Design levels, obstacles, and checkpoints.',
          'Add menus, settings, and saving.'
        ],
        code: [
          'Design the user interface.',
          'Plan the data structure.',
          'Build core features and API routes.',
          'Test and document the application.'
        ],
        web: [
          'Create a responsive homepage.',
          'Add navigation and content sections.',
          'Design mobile-friendly layouts.',
          'Add accessible forms and interactions.'
        ],
        cyber: [
          'Create an isolated practice lab.',
          'Set defensive learning objectives.',
          'Study configurations and security logs.',
          'Document findings and protections.'
        ],
        learn: [
          'Define learning objectives.',
          'Create short lessons and examples.',
          'Add interactive quizzes.',
          'Track learning progress.'
        ]
      };

      const offlinePlan = [
        'NEXUS OFFLINE PLANNER',
        'This is a built-in template, not a live AI response.',
        '',
        'PROJECT: ' + title,
        '',
        'PROJECT IDEA',
        prompt.trim(),
        '',
        'CORE FEATURES',
        ...(features[mode] || features.game),
        '',
        'BUILD MILESTONES',
        '1. Plan the design.',
        '2. Build the first working version.',
        '3. Test and improve it.',
        '4. Polish and prepare to share.',
        '',
        'NEXT STEP',
        'Start by building the smallest working feature.'
      ].join('\n');

      setPlan(offlinePlan);
      setPlanTitle(title);

      setProjects((old) => [{
        id: Date.now().toString(),
        title,
        mode,
        status: 'Offline plan generated',
        updatedAt: 'Just now'
      }, ...old]);

      setError('Live AI unavailable. Built-in offline planner was used.');
    } finally {
      setLoading(false);
    }
  }

  function sample(item) {
    setMode(item.id);
    setView('overview');
    setPrompt(item.prompt);
    setPlan('');
    setError('');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setView('overview'); }}>
          <span className="brand-mark"><Command size={21} /></span>
          <span><b>NEXUS</b><small>AI WORKSPACE</small></span>
        </a>
        <div className="workspace"><div className="workspace-avatar">N</div><div><b>Personal workspace</b><small>Free workspace</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {NAV.map(([id, label, Icon]) => (
            <button key={id} className={'nav-item ' + (view === id ? 'active' : '')} onClick={() => { setView(id); if (id !== 'overview' && id !== 'projects') setMode(id); }}>
              <Icon size={17} /><span>{label}</span>{id === 'projects' && projects.length > 0 && <em>{projects.length}</em>}
            </button>
          ))}
        </nav>
        <div className="side-spacer" />
        <div className="side-promo"><div className="promo-icon"><Zap size={17} /></div><b>Make your ideas real.</b><p>NEXUS is growing. Your next build starts with one prompt.</p><button onClick={() => setView('overview')}>Explore workspace <ArrowUpRight size={14} /></button></div>
        <div className="side-bottom">
          <button className="nav-item"><Settings2 size={17} /><span>Settings</span></button>
          <button className="nav-item"><CircleHelp size={17} /><span>Help & feedback</span></button>
          <div className="profile"><div className="profile-avatar">N</div><div><b>My account</b><small>NEXUS creator</small></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumb"><span>Workspace</span><i>/</i><b>{pageTitle}</b></div>
          <div className="top-actions">
            <div className={'status-pill ' + (health.aiConfigured ? 'ready' : '')}><span />{health.status === 'checking' ? 'Checking system' : health.status === 'offline' ? 'Server offline' : health.aiConfigured ? 'AI connected' : 'AI not configured'}</div>
            <button className="icon-btn" aria-label="Search"><Search size={17} /></button>
            <button className="icon-btn" aria-label="Notifications"><Bell size={17} /></button>
            <button className="new-btn" onClick={newWorkspace}><Plus size={16} /> New workspace</button>
          </div>
        </header>

        <div className="content">
          {view === 'projects' ? (
            <section className="projects-page">
              <div className="page-heading"><div><span className="eyebrow">YOUR WORK</span><h1>My projects</h1><p>Every idea gets a place to grow.</p></div><button className="primary" onClick={() => setView('overview')}><Plus size={16} /> Create project</button></div>
              {projects.length === 0 ? (
                <div className="empty"><div className="empty-icon"><FolderKanban size={25} /></div><h2>Your workspace is ready.</h2><p>Start with a prompt or create a blank workspace. Your projects will appear here.</p><button className="primary" onClick={() => setView('overview')}>Start building <ArrowRight size={16} /></button></div>
              ) : (
                <div className="project-grid">{projects.map((project) => {
                  const item = MODULES.find((module) => module.id === project.mode) || MODULES[0];
                  const Icon = item.icon;
                  return <article className="project-card" key={project.id}><div className={'project-icon ' + item.color}><Icon size={19} /></div><div className="project-meta"><span>{item.id.toUpperCase()}</span><span>{project.updatedAt}</span></div><h3>{project.title}</h3><p>{project.status}</p><button onClick={() => { setMode(project.mode); setView('overview'); }}>Open workspace <ArrowUpRight size={14} /></button></article>;
                })}</div>
              )}
            </section>
          ) : (
            <>
              <section className="hero">
                <div className="hero-copy"><span className="eyebrow"><i /> THE CREATION ENGINE</span><h1>Big ideas.<br /><span>Built with NEXUS.</span></h1><p>Describe what you want to create. NEXUS turns the idea into a clear plan you can build on.</p><div className="proof"><span><CheckCircle2 size={14} /> One workspace</span><span><CheckCircle2 size={14} /> Multiple disciplines</span><span><CheckCircle2 size={14} /> Built to grow</span></div></div>
                <div className="hero-art" aria-hidden="true"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="core"><Command size={42} /></div><div className="float float-a"><Sparkles size={13} /> IDEA → BUILD</div><div className="float float-b"><Activity size={13} /> SYSTEM ONLINE</div></div>
              </section>

              <section className="builder">
                <div className="builder-heading"><div><span className="eyebrow">START SOMETHING NEW</span><h2>What are we building today?</h2></div><span className="builder-tag">YOUR NEXT PROJECT</span></div>
                <div className="module-grid">
                  {MODULES.map((item) => {
                    const Icon = item.icon;
                    return <button key={item.id} className={'module ' + (mode === item.id ? 'chosen ' : '') + item.color} onClick={() => setMode(item.id)}><span className="module-icon"><Icon size={18} /></span><span className="module-copy"><b>{item.label}</b><small>{item.desc}</small></span>{mode === item.id && <CheckCircle2 className="chosen-check" size={16} />}</button>;
                  })}
                </div>
                <div className="prompt-box">
                  <div className="prompt-label"><span><WandSparkles size={14} /> PROJECT PROMPT</span><small>Be as detailed as you like</small></div>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows="4" maxLength="4000" placeholder="Describe your idea, who it is for, and what it should do..." />
                  <div className="prompt-footer"><small>{prompt.length.toLocaleString()} / 4,000</small><button className="primary build-btn" onClick={buildPlan} disabled={!prompt.trim() || loading}>{loading ? <><LoaderCircle className="spin" size={16} /> Planning...</> : <><Sparkles size={16} /> Build with NEXUS <ArrowRight size={16} /></>}</button></div>
                </div>
                {error && <div className="error-box"><Zap size={17} /><div><b>Build engine needs attention</b><p>{error}</p></div></div>}
                {plan && <div className="plan"><div className="plan-head"><div><span className="eyebrow">NEXUS PROJECT PLAN</span><h3>{planTitle}</h3></div><span><CheckCircle2 size={14} /> Plan generated</span></div><pre>{plan}</pre></div>}
              </section>

              <section className="quick-start"><div className="section-heading"><div><span className="eyebrow">QUICK START</span><h2>Pick a starting point</h2></div><button className="text-btn" onClick={() => setView('projects')}>View my projects <ArrowRight size={14} /></button></div>
                <div className="starter-grid">{MODULES.slice(0, 3).map((item, index) => { const Icon = item.icon; const titles = ['Create a game world', 'Build an application', 'Launch a website']; const desc = ['Plan scenes, mechanics, and player systems.', 'Shape the architecture and key features.', 'Map pages, content, and user journeys.']; return <button className="starter" key={item.id} onClick={() => sample(item)}><span className={'starter-icon ' + item.color}><Icon size={19} /></span><span><b>{titles[index]}</b><small>{desc[index]}</small></span><ArrowUpRight className="starter-arrow" size={16} /></button>; })}</div>
              </section>
            </>
          )}
          <footer><span>© 2026 NEXUS AI <i>•</i> Early access foundation</span><span><i className="footer-dot" /> {health.status === 'online' ? 'API server reachable' : 'Waiting for API server'}</span></footer>
        </div>
      </main>
    </div>
  );
        }

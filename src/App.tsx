import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Instagram,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Twitter,
  X,
} from 'lucide-react';
import { Post, PostDraft, supabase } from '@/lib/supabase';

type View = 'home' | 'post' | 'admin';
type AuthMode = 'login' | 'signup';

const categories = ['Noticias', 'Análisis', 'Opinión', 'Exclusivo', 'Reality'];
const fallbackImage = '/images/La_casa.png';

const socialLinks = [
  { label: 'Instagram', url: 'https://www.youtube.com/channel/UCKiaGZWoBZdW-kAGZzNiTVg', Icon: Instagram },
  { label: 'Twitter', url: 'https://x.com/lacasadegh_', Icon: Twitter },
  { label: 'TikTok', url: 'https://www.tiktok.com/@lacasadegh_ok?lang=es', Icon: TikTokIcon },
];

const emptyDraft: PostDraft = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  category: 'Noticias',
  image_url: '',
  featured: false,
  published_at: new Date().toISOString(),
};

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.04.88.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.12z" />
    </svg>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatInputDate(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function App() {
  const [view, setView] = useState<View>(window.location.pathname === '/admin' ? 'admin' : 'home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error: postsError } = await supabase.from('posts').select('*').order('published_at', { ascending: false });
    if (postsError) setError('No pudimos cargar las notas. Revisá la conexión e intentá nuevamente.');
    else setPosts((data ?? []) as Post[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadPosts();
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
      if (data.session) void checkAdmin(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
      if (session) void checkAdmin(session.user.id);
      else setIsAdmin(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
    setIsAdmin(Boolean(data));
  };

  const openPost = (post: Post) => {
    setSelectedPost(post);
    setView('post');
    window.history.pushState({}, '', `/?nota=${post.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setView('home');
    setSelectedPost(null);
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAdmin = () => {
    setView('admin');
    window.history.pushState({}, '', '/admin');
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter((post) => `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(term));
  }, [posts, search]);

  const featuredPost = posts.find((post) => post.featured) ?? posts[0];
  const latestPosts = visiblePosts.filter((post) => post.id !== featuredPost?.id);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="topline"><span>LA CASA DE GRAN HERMANO</span><span>Información, análisis y todo lo que pasa dentro de la casa</span><span className="topline-date">Buenos Aires · {new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date())}</span></div>
        <div className="nav-wrap">
          <button className="brand" onClick={goHome} aria-label="Ir al inicio"><span className="brand-text">LA CASA DE GH</span></button>
          <nav className={mobileMenu ? 'main-nav is-open' : 'main-nav'}>
            <button className={view === 'home' ? 'nav-link active' : 'nav-link'} onClick={goHome}>Inicio</button>
            <button className="nav-link admin-link" onClick={openAdmin}><ShieldCheck size={15} /> Administración</button>
            <div className="nav-social">
              {socialLinks.map(({ label, url, Icon }) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="nav-social-link"><Icon size={18} /></a>)}
            </div>
          </nav>
          <div className="header-actions">
            <button className="icon-button" onClick={() => document.getElementById('search')?.focus()} aria-label="Buscar"><Search size={19} /></button>
            <button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú">{mobileMenu ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
      </header>

      {view === 'admin' ? <AdminView email={sessionEmail} isAdmin={isAdmin} onAdminChange={() => { if (sessionEmail) void checkAdmin(sessionEmail); }} posts={posts} onRefresh={loadPosts} onHome={goHome} /> : view === 'post' && selectedPost ? <PostView post={selectedPost} onBack={goHome} onOpenPost={openPost} /> : <main><HomeView featuredPost={featuredPost} latestPosts={latestPosts} visiblePosts={visiblePosts} search={search} setSearch={setSearch} loading={loading} error={error} onOpenPost={openPost} /></main>}

      <footer className="site-footer">
        <div className="footer-grid">
          <div><p className="footer-brand">LA CASA DE GRAN HERMANO</p><p>El pulso independiente de la casa más famosa de la televisión.</p></div>
          <div><p className="footer-label">Explorá</p><button onClick={goHome}>Últimas noticias</button><button onClick={openAdmin}>Administración</button></div>
          <div><p className="footer-label">Seguinos</p><div className="footer-social">{socialLinks.map(({ label, url, Icon }) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="footer-social-link"><Icon size={20} /></a>)}</div><p className="footer-label disclaimer-label">La Casa de GH</p><p className="disclaimer">Sitio independiente. No es la página oficial de Gran Hermano ni está afiliado oficialmente al programa.</p></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} La Casa de Gran Hermano</span></div>
      </footer>
    </div>
  );
}

function HomeView({ featuredPost, latestPosts, visiblePosts, search, setSearch, loading, error, onOpenPost }: { featuredPost?: Post; latestPosts: Post[]; visiblePosts: Post[]; search: string; setSearch: (value: string) => void; loading: boolean; error: string; onOpenPost: (post: Post) => void }) {
  return <>
    <section className="hero-intro"><div className="eyebrow"><span className="eyebrow-line" /> El diario de la casa <span className="eyebrow-line" /></div><h1>Todo lo que pasa<br /><em>adentro,</em> afuera.</h1><p>Noticias, análisis y la conversación que Gran Hermano deja en cada rincón.</p></section>
    <section className="content-wrap">
      <div className="toolbar"><div className="section-heading-inline"><span className="section-kicker">La conversación de hoy</span><h2>Últimas noticias</h2></div><label className="search-box"><Search size={17} /><input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en La Casa..." /></label></div>
      {error && <div className="notice error-notice">{error}</div>}
      {loading ? <div className="loading-state">Cargando las últimas novedades...</div> : !visiblePosts.length ? <div className="empty-state"><Search size={30} /><h2>No encontramos esa nota</h2><p>Probá con otra palabra.</p></div> : <>
        {featuredPost && !search && <button className="featured-story" onClick={() => onOpenPost(featuredPost)}><div className="featured-image-wrap"><img src={featuredPost.image_url || fallbackImage} alt="" /><div className="featured-tag"><Star size={14} fill="currentColor" /> Nota destacada</div></div><div className="featured-copy"><div className="post-meta"><span>{featuredPost.category}</span><span className="meta-dot" />{formatDate(featuredPost.published_at)}</div><h2>{featuredPost.title}</h2><p>{featuredPost.excerpt}</p><span className="read-link">Leer nota completa <ArrowRight size={17} /></span></div></button>}
        <div className="post-grid">{(!search ? latestPosts : visiblePosts).map((post) => <PostCard key={post.id} post={post} onOpenPost={onOpenPost} />)}</div>
      </>}
    </section>
  </>;
}

function PostCard({ post, onOpenPost }: { post: Post; onOpenPost: (post: Post) => void }) {
  return <button className="post-card" onClick={() => onOpenPost(post)}><div className="card-image"><img src={post.image_url || fallbackImage} alt="" /><span>{post.category}</span></div><div className="card-copy"><div className="post-meta"><span>{formatDate(post.published_at)}</span><span className="meta-dot" /><span><Clock3 size={13} /> 4 min</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><span className="card-arrow"><ArrowRight size={16} /></span></div></button>;
}

function PostView({ post, onBack, onOpenPost }: { post: Post; onBack: () => void; onOpenPost: (post: Post) => void }) {
  return <main className="post-page"><div className="article-wrap"><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Volver a todas las notas</button><div className="article-header"><div className="post-meta"><span className="category-highlight">{post.category}</span><span className="meta-dot" />{formatDate(post.published_at)}<span className="meta-dot" /><Clock3 size={14} /> 4 min de lectura</div><h1>{post.title}</h1><p className="article-excerpt">{post.excerpt}</p></div><img className="article-image" src={post.image_url || fallbackImage} alt="" /><div className="article-layout"><article className="article-body">{post.body.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article><aside className="article-aside"><div className="aside-card"><span className="aside-kicker">La Casa recomienda</span><h3>Seguí el minuto a minuto</h3><p>Todo lo que pasa en Gran Hermano, contado desde una mirada independiente.</p><button onClick={onBack}>Ver más notas <ChevronRight size={16} /></button></div></aside></div></div></main>;
}

function AdminView({ email, isAdmin, onAdminChange, posts, onRefresh, onHome }: { email: string | null; isAdmin: boolean; onAdminChange: () => void; posts: Post[]; onRefresh: () => Promise<void>; onHome: () => void }) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setAuthLoading(true); setAuthError('');
    const result = authMode === 'login' ? await supabase.auth.signInWithPassword({ email: authEmail, password }) : await supabase.auth.signUp({ email: authEmail, password });
    if (result.error) setAuthError(authMode === 'login' ? 'El correo o la contraseña no son correctos.' : result.error.message);
    else if (authMode === 'signup') setAuthError('Cuenta creada. Ya podés ingresar con tus datos.');
    setAuthLoading(false);
  };

  const claimAdmin = async () => {
    const { error: claimError } = await supabase.from('admin_users').insert({ user_id: (await supabase.auth.getUser()).data.user?.id });
    if (claimError) setAuthError('La cuenta de administrador ya fue asignada a otra persona.');
    else onAdminChange();
  };

  const startNew = () => { setDraft({ ...emptyDraft }); setEditingId(null); setShowEditor(true); setMessage(''); };
  const startEdit = (post: Post) => { setDraft({ title: post.title, slug: post.slug, excerpt: post.excerpt, body: post.body, category: post.category, image_url: post.image_url, featured: post.featured, published_at: post.published_at }); setEditingId(post.id); setShowEditor(true); setMessage(''); };
  const savePost = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('');
    const payload = { ...draft, slug: draft.slug || slugify(draft.title), published_at: new Date(draft.published_at).toISOString(), updated_at: new Date().toISOString() };
    const result = editingId ? await supabase.from('posts').update(payload).eq('id', editingId) : await supabase.from('posts').insert(payload);
    if (result.error) setMessage('No pudimos guardar la nota. Revisá que el título sea único.'); else { setMessage('Nota guardada correctamente.'); setShowEditor(false); await onRefresh(); }
    setSaving(false);
  };
  const deletePost = async (post: Post) => { if (!window.confirm(`¿Eliminar "${post.title}"?`)) return; const { error: deleteError } = await supabase.from('posts').delete().eq('id', post.id); if (deleteError) setMessage('No pudimos eliminar la nota.'); else { setMessage('Nota eliminada.'); await onRefresh(); } };

  if (!email) return <main className="admin-page"><div className="auth-card"><div className="auth-mark"><ShieldCheck size={24} /></div><span className="section-kicker">Espacio privado</span><h1>Administración</h1><p>Ingresá para gestionar las notas de La Casa de Gran Hermano.</p><form onSubmit={signIn}><label>Correo electrónico<input type="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="tu@email.com" /></label><label>Contraseña<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" /></label>{authError && <div className="form-message">{authError}</div>}<button className="primary-button" disabled={authLoading}>{authLoading ? 'Ingresando...' : authMode === 'login' ? <><LogIn size={17} /> Ingresar</> : 'Crear cuenta'}</button></form><button className="switch-auth" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}>{authMode === 'login' ? '¿Primera vez? Crear cuenta' : 'Ya tengo una cuenta · Ingresar'}</button><button className="back-link center-link" onClick={onHome}><ArrowLeft size={15} /> Volver al sitio</button></div></main>;
  if (!isAdmin) return <main className="admin-page"><div className="auth-card"><div className="auth-mark"><ShieldCheck size={24} /></div><span className="section-kicker">Cuenta conectada</span><h1>Activar administración</h1><p>Esta cuenta todavía no tiene permisos editoriales. Si sos la primera persona responsable del sitio, podés reclamar el acceso inicial.</p>{authError && <div className="form-message">{authError}</div>}<button className="primary-button" onClick={claimAdmin}><ShieldCheck size={17} /> Reclamar acceso inicial</button><button className="back-link center-link" onClick={onHome}><ArrowLeft size={15} /> Volver al sitio</button></div></main>;
  return <main className="admin-page"><div className="admin-wrap"><div className="admin-top"><div><span className="section-kicker">Panel editorial</span><h1>Gestionar publicaciones</h1><p>Hola, {email}. Mantené viva la conversación de la casa.</p></div><div className="admin-top-actions"><button className="secondary-button" onClick={onHome}><Eye size={16} /> Ver sitio</button><button className="secondary-button" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Salir</button></div></div>{message && <div className="notice success-notice"><Check size={17} /> {message}</div>}{showEditor ? <form className="editor-card" onSubmit={savePost}><div className="editor-heading"><div><span className="section-kicker">{editingId ? 'Editar nota' : 'Nueva nota'}</span><h2>{editingId ? 'Actualizar publicación' : 'Contar lo que pasa'}</h2></div><button type="button" className="icon-button" onClick={() => setShowEditor(false)} aria-label="Cerrar editor"><X size={20} /></button></div><div className="form-grid"><label className="wide-field">Título<input required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value, slug: editingId ? draft.slug : slugify(event.target.value) })} placeholder="Ej: La gala que cambió todo" /></label><label>Categoría<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Fecha de publicación<input type="datetime-local" required value={formatInputDate(draft.published_at)} onChange={(event) => setDraft({ ...draft, published_at: new Date(event.target.value).toISOString() })} /></label><label className="wide-field">Imagen de portada (URL)<input value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} placeholder="https://..." /></label><label className="wide-field">Bajada o resumen<textarea required rows={3} value={draft.excerpt} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} placeholder="Una frase que invite a seguir leyendo" /></label><label className="wide-field">Texto de la nota<textarea required rows={12} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Escribí la nota. Separá los párrafos con una línea en blanco." /></label><label className="checkbox-label"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /> Marcar como nota destacada</label></div><div className="editor-actions"><button type="button" className="secondary-button" onClick={() => setShowEditor(false)}>Cancelar</button><button className="primary-button" disabled={saving}>{saving ? 'Guardando...' : <><Check size={17} /> Guardar nota</>}</button></div></form> : <><div className="admin-toolbar"><div className="admin-stat"><strong>{posts.length}</strong><span>notas en total</span></div><button className="primary-button" onClick={startNew}><Plus size={18} /> Nueva nota</button></div><div className="admin-list">{posts.map((post) => <div className="admin-row" key={post.id}><img src={post.image_url || fallbackImage} alt="" /><div className="admin-row-copy"><div className="post-meta"><span>{post.category}</span><span className="meta-dot" />{formatDate(post.published_at)}{post.featured && <><span className="meta-dot" /><Star size={13} fill="currentColor" /></>}</div><h3>{post.title}</h3><p>{post.excerpt}</p></div><div className="row-actions"><button className="icon-button" onClick={() => startEdit(post)} aria-label="Editar nota"><Edit3 size={18} /></button><button className="icon-button danger" onClick={() => void deletePost(post)} aria-label="Eliminar nota"><Trash2 size={18} /></button></div></div>)}{!posts.length && <div className="empty-state"><Plus size={30} /><h2>Tu archivo está vacío</h2><p>Creá la primera nota para empezar a publicar.</p></div>}</div></>}</div></main>;
}

export default App;

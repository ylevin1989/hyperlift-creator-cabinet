'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Eye, ThumbsUp, MessageCircle, ExternalLink, RefreshCw, Check, X,
    ChevronDown, Plus, Users, FolderOpen, Inbox, Shield,
    Target, Trash2, Video, Loader2, UserCheck, UserX, Clock,
    BookOpen, Edit3, Save, Image, Type, FileText, ToggleLeft, ToggleRight, Upload
} from 'lucide-react';
import clsx from 'clsx';
import { useGlobalStore } from '@/store/global';
import { supabase } from '@/lib/supabase';
import { PLATFORMS, formatNumber, getYouTubeThumbnail, getProjectThumbnail, transliterate } from '@/lib/utils';

type AdminTab = 'projects' | 'creators' | 'applications' | 'articles';

const KPI_METRICS = [
    { key: 'views', label: 'Просмотры' },
    { key: 'likes', label: 'Лайки' },
    { key: 'comments', label: 'Комментарии' },
    { key: 'reach', label: 'Охват' },
    { key: 'shares', label: 'Репосты' },
    { key: 'saves', label: 'Сохранения' },
];

export default function AdminPage() {
    const userId = useGlobalStore((s) => s.userId);
    const [authorized, setAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<AdminTab>('projects');
    const [loading, setLoading] = useState(true);

    // Data states
    const [projects, setProjects] = useState<any[]>([]);
    const [creators, setCreators] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);

    // Articles state
    const [articles, setArticles] = useState<any[]>([]);
    const [editingArticle, setEditingArticle] = useState<any>(null);
    const [articleForm, setArticleForm] = useState({ title: '', slug: '', excerpt: '', category: 'content', read_time: 5, cover_image: '', content: '', published: true });
    const [savingArticle, setSavingArticle] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // UI states
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '', brand_id: '', reward: '', deadline: '' });
    const [creating, setCreating] = useState(false);
    const [syncingAssetId, setSyncingAssetId] = useState<string | null>(null);

    // KPI form
    const [kpiForm, setKpiForm] = useState({ creatorId: '', metric: 'views', rate: '', target: '' });

    // Auth check
    useEffect(() => {
        if (!userId) return;
        (async () => {
            const { data } = await supabase.from('cr_creators').select('role').eq('id', userId).single();
            if (data?.role === 'admin') setAuthorized(true);
            setLoading(false);
        })();
    }, [userId]);

    // Fetch based on tab
    const fetchData = useCallback(async () => {
        if (!userId || !authorized) return;

        if (activeTab === 'projects') {
            const res = await fetch(`/api/projects?userId=${userId}&mode=admin`);
            const data = await res.json();
            if (res.ok) setProjects(data.projects || []);
            // Load creators for assignment dropdown
            const { data: creatorsData } = await supabase
                .from('cr_creators')
                .select('*')
                .eq('approval_status', 'approved')
                .order('created_at', { ascending: false });
            setCreators(creatorsData || []);
            // Load brands
            const brandsRes = await fetch('/api/brands');
            const brandsData = await brandsRes.json();
            if (brandsRes.ok) setBrands(brandsData.brands || []);
        } else if (activeTab === 'creators') {
            const { data } = await supabase.from('cr_creators').select('*').order('created_at', { ascending: false });
            setCreators(data || []);
        } else if (activeTab === 'applications') {
            const res = await fetch(`/api/applications?userId=${userId}`);
            const data = await res.json();
            if (res.ok) setApplications(data.applications || []);
        }
    }, [userId, authorized, activeTab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Actions
    const createProject = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', title: newProject.title, description: newProject.description, brand_id: newProject.brand_id || undefined, reward: newProject.reward, deadline: newProject.deadline, userId })
            });
            if (res.ok) {
                setShowCreateProject(false);
                setNewProject({ title: '', description: '', brand_id: '', reward: '', deadline: '' });
                await fetchData();
            }
        } finally { setCreating(false); }
    };

    const assignCreator = async (projectId: string, creatorId: string) => {
        await fetch(`/api/projects/${projectId}/creators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'assign', userId, creatorId })
        });
        await fetchData();
    };

    const removeCreator = async (projectId: string, creatorId: string) => {
        await fetch(`/api/projects/${projectId}/creators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'remove', userId, creatorId })
        });
        await fetchData();
    };

    const setKpi = async (projectId: string) => {
        if (!kpiForm.creatorId || !kpiForm.metric) return;
        await fetch(`/api/projects/${projectId}/creators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'set_kpi',
                userId,
                creatorId: kpiForm.creatorId,
                metric: kpiForm.metric,
                rate: parseFloat(kpiForm.rate) || 0,
                target: parseInt(kpiForm.target) || null
            })
        });
        setKpiForm({ creatorId: '', metric: 'views', rate: '', target: '' });
        await fetchData();
    };

    const handleApplication = async (appId: string, action: 'approve' | 'reject') => {
        await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, applicationId: appId, userId })
        });
        await fetchData();
    };

    // Video moderation actions (now inside projects)
    const handleAssetAction = async (assetId: string, action: string) => {
        if (action === 'sync') setSyncingAssetId(assetId);
        await fetch(`/api/admin/assets?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId, action })
        });
        setSyncingAssetId(null);
        await fetchData();
    };

    // Creator approval actions
    const handleCreatorApproval = async (creatorId: string, status: 'approved' | 'blocked') => {
        await supabase.from('cr_creators').update({ approval_status: status }).eq('id', creatorId);
        await fetchData();
    };

    // Articles CRUD
    const fetchArticles = useCallback(async () => {
        const res = await fetch('/api/articles');
        const d = await res.json();
        setArticles(d.articles || []);
    }, []);

    useEffect(() => { if (authorized) fetchArticles(); }, [authorized, fetchArticles]);

    const startEditArticle = (article: any) => {
        setEditingArticle(article);
        setArticleForm({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || '',
            category: article.category || 'content',
            read_time: article.read_time || 5,
            cover_image: article.cover_image || '',
            content: article.content || '',
            published: article.published ?? true,
        });
    };

    const startNewArticle = () => {
        setEditingArticle({ id: null });
        setArticleForm({ title: '', slug: '', excerpt: '', category: 'content', read_time: 5, cover_image: '', content: '', published: true });
    };

    const saveArticle = async () => {
        setSavingArticle(true);
        try {
            if (editingArticle?.id) {
                await fetch('/api/articles', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingArticle.id, ...articleForm })
                });
            } else {
                await fetch('/api/articles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(articleForm)
                });
            }
            setEditingArticle(null);
            await fetchArticles();
        } catch(e) { console.error(e); }
        setSavingArticle(false);
    };

    const deleteArticle = async (id: string) => {
        if (!confirm('Удалить статью?')) return;
        await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
        await fetchArticles();
    };

    const toggleArticlePublished = async (article: any) => {
        await fetch('/api/articles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: article.id, published: !article.published })
        });
        await fetchArticles();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // generate unique name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `articles/${fileName}`;

        setUploadingImage(true);
        try {
            const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
            setArticleForm({ ...articleForm, cover_image: data.publicUrl });
        } catch (err) {
            console.error('Error uploading image:', err);
            alert('Ошибка при загрузке изображения');
        }
        setUploadingImage(false);
    };

    if (loading) return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка...</div>;
    if (!authorized) return <div className="p-8 text-red-400 text-center">Доступ запрещён</div>;

    const pendingCreators = creators.filter(c => c.approval_status === 'pending');
    const pendingApps = applications.filter(a => a.status === 'pending');
    const pendingVideos = projects.reduce((sum, p) => sum + (p.video_assets || []).filter((a: any) => a.status === 'pending_review').length, 0);

    const TABS: { key: AdminTab; label: string; icon: any; count?: number }[] = [
        { key: 'projects', label: 'Проекты', icon: FolderOpen, count: pendingVideos > 0 ? pendingVideos : undefined },
        { key: 'creators', label: 'Креаторы', icon: Users, count: pendingCreators.length > 0 ? pendingCreators.length : undefined },
        { key: 'applications', label: 'Заявки', icon: Inbox, count: pendingApps.length > 0 ? pendingApps.length : undefined },
        { key: 'articles', label: 'Статьи', icon: BookOpen, count: articles.length > 0 ? articles.length : undefined },
    ];

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="pt-2 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">Админ-панель</h1>
                    <p className="text-neutral-500 font-medium mt-1">Управление проектами и креаторами</p>
                </div>
                {activeTab === 'projects' && (
                    <button onClick={() => setShowCreateProject(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-bold text-sm transition-all flex items-center gap-2 shrink-0">
                        <Plus size={16} /> Проект
                    </button>
                )}
                {activeTab === 'articles' && !editingArticle && (
                    <button onClick={startNewArticle} className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 font-bold text-sm transition-all flex items-center gap-2 shrink-0">
                        <Plus size={16} /> Статья
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex bg-neutral-900 p-1 rounded-xl">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={clsx("flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
                            activeTab === tab.key ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                        )}
                    >
                        <tab.icon size={16} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ====== PROJECTS TAB ====== */}
            {activeTab === 'projects' && (
                <div className="space-y-3">
                    {projects.map(project => {
                        const isExpanded = expandedProjectId === project.id;
                        const pAssets = project.video_assets || [];
                        const pCreators = project.assignments || [];
                        const totalViews = pAssets.reduce((s: number, a: any) => s + (a.views || 0), 0);
                        const pendingCount = pAssets.filter((a: any) => a.status === 'pending_review').length;
                        const brandLogo = project.brand_ref?.logo_url;
                        const thumb = brandLogo || getProjectThumbnail(project);
                        const brandName = project.brand_ref?.name || project.brand || 'Без бренда';

                        return (
                            <div key={project.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                                <button onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors text-left">
                                    {/* Project thumbnail */}
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-neutral-700"
                                        style={{ backgroundColor: project.brand_ref?.color || '#262626' }}>
                                        {thumb ? (
                                            <img src={thumb} alt="" className="w-full h-full object-contain p-1.5"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                            />
                                        ) : null}
                                        <span className={clsx("text-white font-black text-lg", thumb && "hidden")}>
                                            {brandName.charAt(0)}
                                        </span>
                                    </div>

                                    <ChevronDown size={14} className={clsx("text-neutral-500 transition-transform shrink-0", !isExpanded && "-rotate-90")} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{brandName}</div>
                                        <div className="font-bold text-white truncate">{project.title || 'Без названия'}</div>
                                    </div>
                                    <div className="hidden md:flex items-center gap-3 text-xs text-neutral-500">
                                        <span className="flex items-center gap-1"><Users size={12} /> {pCreators.length}</span>
                                        <span className="flex items-center gap-1"><Video size={12} /> {pAssets.length}</span>
                                        <span className="flex items-center gap-1"><Eye size={12} /> {formatNumber(totalViews)}</span>
                                    </div>
                                    {pendingCount > 0 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse">
                                            ⏳ {pendingCount}
                                        </span>
                                    )}
                                    <span className={clsx("text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap",
                                        project.status === 'Закрыто' ? 'text-neutral-500 bg-neutral-800/10 border-neutral-700/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                                    )}>{project.status}</span>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-neutral-800 p-4 space-y-5 animate-fade-in">
                                        {/* Description */}
                                        {project.description && <p className="text-sm text-neutral-400 bg-neutral-950 p-3 rounded-xl">{project.description}</p>}

                                        {/* Assigned Creators */}
                                        <div>
                                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Креаторы</h4>
                                            <div className="space-y-2">
                                                {pCreators.map((a: any) => (
                                                    <div key={a.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                                                            {a.creator?.avatar_url ? <img src={a.creator.avatar_url} className="w-full h-full object-cover" /> : (a.creator?.full_name?.charAt(0) || '?')}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex items-center gap-4 justify-between">
                                                            <div className="text-sm font-medium text-white truncate">{a.creator?.full_name || a.creator?.username || '—'}</div>
                                                            <div className="shrink-0 flex items-center">
                                                                {(!a.kpi_metric || (a.kpi_rate === 0 && !a.kpi_target)) ? (
                                                                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 uppercase whitespace-nowrap">Нет KPI</span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1 whitespace-nowrap">
                                                                        KPI: {KPI_METRICS.find(m => m.key === a.kpi_metric)?.label || a.kpi_metric} <span className="text-blue-300">{a.kpi_rate}₽</span> {a.kpi_target ? `/ цель ${a.kpi_target}` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button onClick={() => removeCreator(project.id, a.creator_id)} className="text-red-400 hover:text-red-300 p-1 shrink-0"><Trash2 size={14} /></button>
                                                    </div>
                                                ))}
                                                <select
                                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
                                                    value=""
                                                    onChange={async (e) => { if (e.target.value) await assignCreator(project.id, e.target.value); }}
                                                >
                                                    <option value="">+ Назначить креатора...</option>
                                                    {creators.filter(c => !pCreators.some((a: any) => a.creator_id === c.id) && c.role !== 'admin').map(c => (
                                                        <option key={c.id} value={c.id}>{c.full_name || c.username}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* KPI Config */}
                                        {pCreators.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Настроить KPI</h4>
                                                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                        <select value={kpiForm.creatorId} onChange={e => setKpiForm({...kpiForm, creatorId: e.target.value})}
                                                            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-xs text-white">
                                                            <option value="">Креатор...</option>
                                                            {pCreators.map((a: any) => <option key={a.creator_id} value={a.creator_id}>{a.creator?.full_name || '—'}</option>)}
                                                        </select>
                                                        <select value={kpiForm.metric} onChange={e => setKpiForm({...kpiForm, metric: e.target.value})}
                                                            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-xs text-white">
                                                            {KPI_METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                                                        </select>
                                                        <input type="number" placeholder="₽/шт" value={kpiForm.rate} onChange={e => setKpiForm({...kpiForm, rate: e.target.value})}
                                                            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-xs text-white" />
                                                        <input type="number" placeholder="Цель" value={kpiForm.target} onChange={e => setKpiForm({...kpiForm, target: e.target.value})}
                                                            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-2 text-xs text-white" />
                                                    </div>
                                                    <button onClick={() => setKpi(project.id)} disabled={!kpiForm.creatorId}
                                                        className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                                                        Сохранить KPI
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* ====== VIDEOS WITH MODERATION ====== */}
                                        {pAssets.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                                    Материалы ({pAssets.length})
                                                    {pendingCount > 0 && <span className="text-orange-400 ml-1">• {pendingCount} на проверке</span>}
                                                </h4>
                                                <div className="space-y-2">
                                                    {pAssets.map((asset: any) => {
                                                        const plat = PLATFORMS.find(p => p.key === asset.platform);
                                                        const thumb = asset.thumbnail_url || (asset.video_url?.includes('youtu') ? getYouTubeThumbnail(asset.video_url) : '');
                                                        const isPending = asset.status === 'pending_review';
                                                        const isSyncing = syncingAssetId === asset.id;

                                                        // Find creator for this asset
                                                        const assetCreator = pCreators.find((a: any) => a.creator_id === asset.creator_id);

                                                        return (
                                                            <div key={asset.id} className={clsx(
                                                                "bg-neutral-950 border rounded-xl p-3 transition-all",
                                                                isPending ? "border-orange-500/30 ring-1 ring-orange-500/10" : "border-neutral-800"
                                                            )}>
                                                                <div className="flex gap-3 items-start">
                                                                    {/* Thumbnail */}
                                                                    <div className="w-20 aspect-video bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-neutral-800">
                                                                        {thumb ? <img src={thumb} className="w-full h-full object-cover" /> : <Video size={14} className="text-neutral-700" />}
                                                                    </div>

                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-white text-sm truncate mb-0.5">{asset.title || 'Без названия'}</div>
                                                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                                            <a href={asset.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-[10px] flex items-center gap-0.5">
                                                                                <ExternalLink size={8} /> Ссылка
                                                                            </a>
                                                                            {plat && <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-full", plat.color)}>{plat.label}</span>}
                                                                            {assetCreator && (
                                                                                <span className="text-[10px] text-neutral-500">
                                                                                    👤 {assetCreator.creator?.full_name || '—'}
                                                                                </span>
                                                                            )}
                                                                            <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                                                                                asset.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                                asset.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                                'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                                            )}>
                                                                                {asset.status === 'approved' ? '✓ Одобрено' : asset.status === 'rejected' ? '✗ Отклонено' : '⏳ На проверке'}
                                                                            </span>
                                                                        </div>

                                                                        {/* Metrics row */}
                                                                        <div className="flex items-center gap-3 text-xs text-neutral-400">
                                                                            <span className="flex items-center gap-0.5"><Eye size={10} /> {formatNumber(asset.views)}</span>
                                                                            <span className="flex items-center gap-0.5"><ThumbsUp size={10} /> {formatNumber(asset.likes)}</span>
                                                                            <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {formatNumber(asset.comments)}</span>
                                                                            {asset.kpi_bonus > 0 && <span className="text-green-400 font-bold">+{Math.floor(asset.kpi_bonus)}₽</span>}
                                                                        </div>
                                                                    </div>

                                                                    {/* Action buttons */}
                                                                    <div className="flex flex-col gap-1 shrink-0">
                                                                        <button onClick={() => handleAssetAction(asset.id, 'sync')}
                                                                            disabled={isSyncing}
                                                                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                                                                            title="Sync метрики">
                                                                            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                                                                        </button>
                                                                        {asset.status !== 'approved' && (
                                                                            <button onClick={() => handleAssetAction(asset.id, 'approve')}
                                                                                className="p-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors"
                                                                                title="Одобрить">
                                                                                <Check size={12} />
                                                                            </button>
                                                                        )}
                                                                        {asset.status !== 'rejected' && (
                                                                            <button onClick={() => handleAssetAction(asset.id, 'reject')}
                                                                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                                                                                title="Отклонить">
                                                                                <X size={12} />
                                                                            </button>
                                                                        )}
                                                                        <button onClick={() => { if (confirm('Удалить видео навсегда?')) handleAssetAction(asset.id, 'delete'); }}
                                                                            className="p-1.5 bg-neutral-700/30 hover:bg-red-600/40 text-neutral-500 hover:text-red-400 rounded-lg transition-colors"
                                                                            title="Удалить">
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {projects.length === 0 && <div className="text-center py-8 text-neutral-600">Нет проектов</div>}
                </div>
            )}

            {/* ====== CREATORS TAB ====== */}
            {activeTab === 'creators' && (
                <div className="space-y-2">
                    {/* Pending approval section */}
                    {pendingCreators.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Clock size={12} /> Ожидают одобрения ({pendingCreators.length})
                            </h3>
                            <div className="space-y-2">
                                {pendingCreators.map(c => (
                                    <div key={c.id} className="bg-neutral-900 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4 ring-1 ring-orange-500/10">
                                        <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center font-bold text-sm text-white shrink-0">
                                            {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : c.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white">{c.full_name || c.username || '—'}</div>
                                            <div className="text-xs text-neutral-500">@{c.username || '—'} • {new Date(c.created_at).toLocaleDateString('ru-RU')}</div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => handleCreatorApproval(c.id, 'approved')}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                                                <UserCheck size={12} /> Одобрить
                                            </button>
                                            <button onClick={() => handleCreatorApproval(c.id, 'blocked')}
                                                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                                                <UserX size={12} /> Откл.
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All creators */}
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Все креаторы</h3>
                    {creators.filter(c => c.approval_status !== 'pending').map(c => (
                        <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center font-bold text-sm text-white shrink-0">
                                {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : c.full_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white">{c.full_name || c.username || '—'}</div>
                                <div className="text-xs text-neutral-500">@{c.username || '—'} • {c.role || 'creator'}</div>
                            </div>
                            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                c.approval_status === 'approved' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                c.approval_status === 'blocked' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                'text-orange-400 border-orange-500/20 bg-orange-500/10'
                            )}>
                                {c.approval_status === 'approved' ? '✓ Активен' : c.approval_status === 'blocked' ? '✗ Заблокирован' : '⏳'}
                            </span>
                            {c.approval_status === 'blocked' && (
                                <button onClick={() => handleCreatorApproval(c.id, 'approved')}
                                    className="text-xs text-blue-400 hover:text-blue-300 underline">Разблокировать</button>
                            )}
                            {c.approval_status === 'approved' && c.role !== 'admin' && (
                                <button onClick={() => handleCreatorApproval(c.id, 'blocked')}
                                    className="text-xs text-red-400 hover:text-red-300">Блок</button>
                            )}
                        </div>
                    ))}
                    {creators.length === 0 && <div className="text-center py-8 text-neutral-600">Нет креаторов</div>}
                </div>
            )}

            {/* ====== APPLICATIONS TAB ====== */}
            {activeTab === 'applications' && (
                <div className="space-y-2">
                    {applications.map(app => (
                        <div key={app.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center font-bold text-xs text-white shrink-0">
                                    {app.creator?.avatar_url ? <img src={app.creator.avatar_url} className="w-full h-full object-cover" /> : app.creator?.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm">{app.creator?.full_name || '—'}</div>
                                    <div className="text-xs text-neutral-500">→ {app.brief?.title || '—'}</div>
                                </div>
                                <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                    app.status === 'approved' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                    app.status === 'rejected' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                    'text-orange-400 border-orange-500/20 bg-orange-500/10'
                                )}>
                                    {app.status === 'approved' ? 'Одобрено' : app.status === 'rejected' ? 'Отклонено' : 'Ожидает'}
                                </span>
                            </div>
                            {app.message && <p className="text-sm text-neutral-400 mb-3 bg-neutral-950 p-2 rounded-lg">{app.message}</p>}
                            {app.status === 'pending' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleApplication(app.id, 'approve')} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                                        <Check size={14} /> Одобрить
                                    </button>
                                    <button onClick={() => handleApplication(app.id, 'reject')} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                                        <X size={14} /> Отклонить
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {applications.length === 0 && <div className="text-center py-8 text-neutral-600">Нет заявок</div>}
                </div>
            )}

            {/* Create Project Modal */}
            {showCreateProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Новый проект</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Название *</label>
                                <input type="text" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Спонсорская интеграция" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Бренд</label>
                                <select value={newProject.brand_id} onChange={e => setNewProject({...newProject, brand_id: e.target.value})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                                    <option value="">Без бренда</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Описание</label>
                                <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none h-24"
                                    placeholder="Подробное описание проекта..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">Бюджет (₽)</label>
                                    <input type="number" value={newProject.reward} onChange={e => setNewProject({...newProject, reward: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="50000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">Дедлайн</label>
                                    <input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCreateProject(false)} className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors">Отмена</button>
                            <button onClick={createProject} disabled={creating || !newProject.title}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors">
                                {creating ? 'Создаём...' : 'Создать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== TAB: ARTICLES ====== */}
            {activeTab === 'articles' && (
                <div className="space-y-4">
                    {editingArticle ? (
                        /* Article Editor */
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Edit3 size={18} />
                                    {editingArticle.id ? 'Редактировать статью' : 'Новая статья'}
                                </h3>
                                <button onClick={() => setEditingArticle(null)} className="text-neutral-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Заголовок</label>
                                    <input value={articleForm.title}
                                        onChange={e => {
                                            const title = e.target.value;
                                            const slug = editingArticle.id ? articleForm.slug : transliterate(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                            setArticleForm({...articleForm, title, slug});
                                        }}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="Название статьи" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Slug (URL)</label>
                                    <input value={articleForm.slug}
                                        onChange={e => setArticleForm({...articleForm, slug: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none font-mono text-sm"
                                        placeholder="my-article-slug" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Краткое описание</label>
                                <textarea value={articleForm.excerpt}
                                    onChange={e => setArticleForm({...articleForm, excerpt: e.target.value})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none h-16"
                                    placeholder="Короткое описание для карточки..." />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Категория</label>
                                    <select value={articleForm.category}
                                        onChange={e => setArticleForm({...articleForm, category: e.target.value})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3 text-white focus:border-blue-500 focus:outline-none text-sm">
                                        <option value="production">Продакшен</option>
                                        <option value="platforms">Платформы</option>
                                        <option value="monetization">Монетизация</option>
                                        <option value="content">Контент</option>
                                        <option value="legal">Юридическое</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Время чтения (мин)</label>
                                    <input type="number" value={articleForm.read_time}
                                        onChange={e => setArticleForm({...articleForm, read_time: parseInt(e.target.value) || 5})}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                        min={1} max={60} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">URL обложки</label>
                                    <div className="flex gap-2">
                                        <input value={articleForm.cover_image}
                                            onChange={e => setArticleForm({...articleForm, cover_image: e.target.value})}
                                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none text-sm"
                                            placeholder="https://images.unsplash.com/..." />
                                        <label className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl px-4 py-3 text-sm font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 shrink-0">
                                            {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {articleForm.cover_image && (
                                <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
                                    <img src={articleForm.cover_image} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1 flex items-center gap-2">
                                    <FileText size={12} /> Контент (Markdown)
                                </label>
                                <textarea value={articleForm.content}
                                    onChange={e => setArticleForm({...articleForm, content: e.target.value})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-y font-mono text-sm leading-relaxed"
                                    style={{minHeight: '300px'}}
                                    placeholder="# Заголовок&#10;&#10;Текст статьи в формате Markdown...&#10;&#10;## Подзаголовок&#10;&#10;- Пункт 1&#10;- Пункт 2" />
                            </div>

                            <div className="flex items-center justify-between">
                                <button onClick={() => setArticleForm({...articleForm, published: !articleForm.published})}
                                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${articleForm.published ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                                    {articleForm.published ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    {articleForm.published ? 'Опубликована' : 'Черновик'}
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingArticle(null)} className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-sm transition-colors">Отмена</button>
                                    <button onClick={saveArticle} disabled={savingArticle || !articleForm.title || !articleForm.slug}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                                        <Save size={14} /> {savingArticle ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Articles List */
                        articles.length === 0 ? (
                            <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl">
                                <BookOpen size={40} className="mx-auto text-neutral-600 mb-3" />
                                <p className="text-neutral-400">Нет статей</p>
                                <button onClick={startNewArticle} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium">Создать первую статью</button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {articles.map((article: any) => (
                                    <div key={article.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4 hover:border-neutral-700 transition-all">
                                        {article.cover_image && (
                                            <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-800">
                                                <img src={article.cover_image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-white truncate">{article.title}</h3>
                                                {!article.published && (
                                                    <span className="text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full border border-yellow-400/20 uppercase">Черновик</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                                                <span className="capitalize">{article.category}</span>
                                                <span>{article.read_time} мин</span>
                                                <span>/{article.slug}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => toggleArticlePublished(article)}
                                                className={`p-2 rounded-lg transition-colors ${article.published ? 'text-green-400 hover:bg-green-500/10' : 'text-neutral-500 hover:bg-neutral-800'}`}
                                                title={article.published ? 'Снять с публикации' : 'Опубликовать'}>
                                                {article.published ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                            </button>
                                            <button onClick={() => startEditArticle(article)} className="text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors" title="Редактировать">
                                                <Edit3 size={14} />
                                            </button>
                                            <button onClick={() => deleteArticle(article.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors" title="Удалить">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

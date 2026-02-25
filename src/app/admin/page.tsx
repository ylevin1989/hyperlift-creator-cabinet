'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Eye, ThumbsUp, MessageCircle, ExternalLink, RefreshCw, Check, X,
    ChevronDown, Plus, Users, FolderOpen, Inbox, Shield,
    Target, Trash2, UserPlus, Video, Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { useGlobalStore } from '@/store/global';
import { supabase } from '@/lib/supabase';

type AdminTab = 'projects' | 'creators' | 'applications' | 'moderation';

const PLATFORMS = [
    { key: 'youtube', label: 'YouTube', color: 'text-red-400 bg-red-500/10' },
    { key: 'tiktok', label: 'TikTok', color: 'text-violet-400 bg-violet-500/10' },
    { key: 'instagram', label: 'Instagram', color: 'text-pink-400 bg-pink-500/10' },
    { key: 'vk', label: 'ВК', color: 'text-blue-400 bg-blue-500/10' },
    { key: 'threads', label: 'Threads', color: 'text-neutral-300 bg-neutral-500/10' },
    { key: 'telegram', label: 'Telegram', color: 'text-sky-400 bg-sky-500/10' },
    { key: 'max', label: 'Макс', color: 'text-cyan-400 bg-cyan-500/10' },
    { key: 'likee', label: 'Лайки', color: 'text-orange-400 bg-orange-500/10' },
];

const KPI_METRICS = [
    { key: 'views', label: 'Просмотры' },
    { key: 'likes', label: 'Лайки' },
    { key: 'comments', label: 'Комментарии' },
    { key: 'reach', label: 'Охват' },
    { key: 'shares', label: 'Репосты' },
    { key: 'saves', label: 'Сохранения' },
];

const formatNumber = (n: number) => {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
};

const getYouTubeThumbnail = (url: string) => {
    const m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : '';
};

export default function AdminPage() {
    const userId = useGlobalStore((s) => s.userId);
    const [authorized, setAuthorized] = useState(false);
    const [activeTab, setActiveTab] = useState<AdminTab>('projects');
    const [loading, setLoading] = useState(true);

    // Data states
    const [projects, setProjects] = useState<any[]>([]);
    const [creators, setCreators] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);

    // UI states
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '', brand: '', reward: '', deadline: '' });
    const [creating, setCreating] = useState(false);

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
        } else if (activeTab === 'creators') {
            const { data } = await supabase.from('cr_creators').select('*').order('created_at', { ascending: false });
            setCreators(data || []);
        } else if (activeTab === 'applications') {
            const res = await fetch(`/api/applications?userId=${userId}`);
            const data = await res.json();
            if (res.ok) setApplications(data.applications || []);
        } else if (activeTab === 'moderation') {
            const res = await fetch(`/api/admin/assets?userId=${userId}`);
            const data = await res.json();
            if (res.ok) setAssets(data.assets || []);
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
                body: JSON.stringify({ action: 'create', ...newProject, userId })
            });
            if (res.ok) {
                setShowCreateProject(false);
                setNewProject({ title: '', description: '', brand: '', reward: '', deadline: '' });
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

    const handleAssetAction = async (assetId: string, action: string, body?: any) => {
        await fetch(`/api/admin/assets?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId, action, ...body })
        });
        await fetchData();
    };

    if (loading) return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка...</div>;
    if (!authorized) return <div className="p-8 text-red-400 text-center">Доступ запрещён</div>;

    const TABS: { key: AdminTab; label: string; icon: any; count?: number }[] = [
        { key: 'projects', label: 'Проекты', icon: FolderOpen, count: projects.length },
        { key: 'creators', label: 'Креаторы', icon: Users, count: creators.length },
        { key: 'applications', label: 'Заявки', icon: Inbox, count: applications.filter(a => a.status === 'pending').length },
        { key: 'moderation', label: 'Модерация', icon: Shield, count: assets.filter(a => a.status === 'pending_review').length },
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
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-full">{tab.count}</span>
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

                        return (
                            <div key={project.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                                <button onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors text-left">
                                    <ChevronDown size={16} className={clsx("text-neutral-500 transition-transform", !isExpanded && "-rotate-90")} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold">{project.brand || 'Без бренда'}</div>
                                        <div className="font-bold text-white truncate">{project.title || 'Без названия'}</div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                                        <span className="flex items-center gap-1"><Users size={12} /> {pCreators.length}</span>
                                        <span className="flex items-center gap-1"><Video size={12} /> {pAssets.length}</span>
                                        <span className="flex items-center gap-1"><Eye size={12} /> {formatNumber(totalViews)}</span>
                                    </div>
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
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Креаторы</h4>
                                            </div>
                                            <div className="space-y-2">
                                                {pCreators.map((a: any) => (
                                                    <div key={a.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0">
                                                            {a.creator?.avatar_url ? <img src={a.creator.avatar_url} className="w-full h-full object-cover" /> : (a.creator?.full_name?.charAt(0) || '?')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-white">{a.creator?.full_name || a.creator?.username || '—'}</div>
                                                        </div>
                                                        <button onClick={() => removeCreator(project.id, a.creator_id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                                                    </div>
                                                ))}

                                                {/* Add creator dropdown */}
                                                <div className="flex gap-2">
                                                    <select
                                                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
                                                        value=""
                                                        onChange={async (e) => {
                                                            if (e.target.value) {
                                                                await assignCreator(project.id, e.target.value);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">+ Назначить креатора...</option>
                                                        {creators.filter(c => !pCreators.some((a: any) => a.creator_id === c.id) && c.role !== 'admin').map(c => (
                                                            <option key={c.id} value={c.id}>{c.full_name || c.username}</option>
                                                        ))}
                                                    </select>
                                                </div>
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

                                        {/* Videos summary */}
                                        {pAssets.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Материалы ({pAssets.length})</h4>
                                                <div className="space-y-1.5">
                                                    {pAssets.slice(0, 5).map((a: any) => {
                                                        const plat = PLATFORMS.find(p => p.key === a.platform);
                                                        const thumb = a.thumbnail_url || (a.video_url?.includes('youtu') ? getYouTubeThumbnail(a.video_url) : '');
                                                        return (
                                                            <div key={a.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 flex items-center gap-2 text-xs">
                                                                <div className="w-14 aspect-video bg-neutral-900 rounded overflow-hidden flex items-center justify-center shrink-0">
                                                                    {thumb ? <img src={thumb} className="w-full h-full object-cover" /> : <Video size={12} className="text-neutral-700" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-white truncate font-medium">{a.title || 'Без названия'}</div>
                                                                    <div className="flex items-center gap-2 text-neutral-500">
                                                                        {plat && <span className={clsx("text-[9px] px-1 rounded-full", plat.color)}>{plat.label}</span>}
                                                                        <span className="flex items-center gap-0.5"><Eye size={8} /> {formatNumber(a.views)}</span>
                                                                        <span className="flex items-center gap-0.5"><ThumbsUp size={8} /> {formatNumber(a.likes)}</span>
                                                                    </div>
                                                                </div>
                                                                <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0",
                                                                    a.status === 'approved' ? 'text-green-400 border-green-500/20' :
                                                                    a.status === 'rejected' ? 'text-red-400 border-red-500/20' : 'text-orange-400 border-orange-500/20'
                                                                )}>
                                                                    {a.status === 'approved' ? '✓' : a.status === 'rejected' ? '✗' : '⏳'}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    {pAssets.length > 5 && <div className="text-xs text-neutral-500 text-center py-1">+ещё {pAssets.length - 5}</div>}
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
                    {creators.map(c => (
                        <div key={c.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center font-bold text-sm text-white shrink-0">
                                {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : c.full_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-white">{c.full_name || c.username || '—'}</div>
                                <div className="text-xs text-neutral-500">@{c.username || '—'} • {c.role || 'creator'}</div>
                            </div>
                            <div className="text-xs text-neutral-500">{new Date(c.created_at).toLocaleDateString('ru-RU')}</div>
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

            {/* ====== MODERATION TAB ====== */}
            {activeTab === 'moderation' && (
                <div className="space-y-3">
                    {assets.map((asset: any) => {
                        const plat = PLATFORMS.find(p => p.key === asset.platform);
                        const thumb = asset.thumbnail_url || (asset.video_url?.includes('youtu') ? getYouTubeThumbnail(asset.video_url) : '');

                        return (
                            <div key={asset.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                                {/* Creator + status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center font-bold text-xs text-white shrink-0">
                                            {asset.creator?.avatar_url ? <img src={asset.creator.avatar_url} className="w-full h-full object-cover" /> : asset.creator?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <span className="text-sm font-medium text-white">{asset.creator?.full_name || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {plat && <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", plat.color)}>{plat.label}</span>}
                                        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                            asset.status === 'approved' ? 'text-green-400 border-green-500/20 bg-green-500/10' :
                                            asset.status === 'rejected' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                            'text-orange-400 border-orange-500/20 bg-orange-500/10'
                                        )}>
                                            {asset.status === 'approved' ? '✓ ОК' : asset.status === 'rejected' ? '✗ Откл.' : '⏳ Проверка'}
                                        </span>
                                    </div>
                                </div>

                                {/* Thumbnail + video */}
                                <div className="flex gap-3 items-center">
                                    <div className="w-24 aspect-video bg-neutral-950 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-neutral-800">
                                        {thumb ? <img src={thumb} className="w-full h-full object-cover" /> : <Eye size={16} className="text-neutral-700" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white text-sm mb-1 line-clamp-2">{asset.title || 'Без названия'}</div>
                                        <a href={asset.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 truncate">
                                            <ExternalLink size={10} /> <span className="truncate">{asset.video_url?.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                        </a>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-neutral-950 rounded-lg p-2 text-center"><div className="text-[9px] text-neutral-500 mb-0.5">Просмотры</div><div className="text-sm font-bold text-white">{formatNumber(asset.views)}</div></div>
                                    <div className="bg-neutral-950 rounded-lg p-2 text-center"><div className="text-[9px] text-neutral-500 mb-0.5">Лайки</div><div className="text-sm font-bold text-white">{formatNumber(asset.likes)}</div></div>
                                    <div className="bg-neutral-950 rounded-lg p-2 text-center"><div className="text-[9px] text-neutral-500 mb-0.5">Комменты</div><div className="text-sm font-bold text-white">{formatNumber(asset.comments)}</div></div>
                                    <div className="bg-neutral-950 rounded-lg p-2 text-center border border-green-500/20"><div className="text-[9px] text-green-500 mb-0.5">KPI</div><div className="text-sm font-bold text-green-400">+{asset.kpi_bonus || 0}₽</div></div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button onClick={() => handleAssetAction(asset.id, 'sync')} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                                        <RefreshCw size={12} /> Sync
                                    </button>
                                    {asset.status !== 'approved' && (
                                        <button onClick={() => handleAssetAction(asset.id, 'approve')} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                                            <Check size={12} /> ОК
                                        </button>
                                    )}
                                    {asset.status !== 'rejected' && (
                                        <button onClick={() => handleAssetAction(asset.id, 'reject')} className="flex-1 py-2 bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                                            <X size={12} /> Откл.
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {assets.length === 0 && <div className="text-center py-8 text-neutral-600">Нет видео для модерации</div>}
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
                                <input type="text" value={newProject.brand} onChange={e => setNewProject({...newProject, brand: e.target.value})}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Nike" />
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
        </div>
    );
}

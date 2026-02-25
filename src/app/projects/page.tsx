'use client';

import { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Video,
    Eye,
    ThumbsUp,
    MessageCircle,
    PlaySquare,
    Clock,
    Target,
    ExternalLink,
    Loader2,
    Send
} from 'lucide-react';
import clsx from 'clsx';
import { useGlobalStore } from '@/store/global';

interface KpiConfig {
    metric: string;
    rate: number;
    target: number | null;
}

interface VideoAsset {
    id: string;
    title: string;
    video_url: string;
    views: number;
    likes: number;
    comments: number;
    status: string;
    platform: string;
    thumbnail_url?: string;
    kpi_bonus: number;
    last_stats_update?: string;
    created_at: string;
}

interface Project {
    id: string;
    title?: string;
    brand?: string;
    description?: string;
    status: string;
    reward: string;
    deadline?: string;
    brief?: { brand?: string; title?: string; description?: string };
    video_assets?: VideoAsset[];
    kpi_configs?: KpiConfig[];
}

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

const STATUS_COLORS: Record<string, string> = {
    'Ожидание товара': 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20',
    'ТЗ': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Съемка': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Модерация': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Правки': 'text-red-400 bg-red-500/10 border-red-500/20',
    'Утверждено': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Закрыто': 'text-neutral-500 bg-neutral-800/10 border-neutral-700/20'
};

const formatNumber = (n: number) => {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString('ru-RU');
};

const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const userId = useGlobalStore((s) => s.userId);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`/api/projects?userId=${userId}`);
            const data = await res.json();
            if (res.ok) setProjects(data.projects || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        fetchProjects();
    }, [userId]);

    const handleSubmitUrl = async (projectId: string) => {
        if (!videoUrl || !userId) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    userId,
                    videoUrl,
                    platform: selectedPlatform || undefined
                })
            });
            if (res.ok) {
                setVideoUrl('');
                setSelectedPlatform('');
                await fetchProjects();
            } else {
                const data = await res.json();
                alert(data.error || 'Ошибка');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleProject = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
        setVideoUrl('');
        setSelectedPlatform('');
    };

    if (loading) {
        return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка проектов...</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="pt-2">
                <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                    Мои проекты
                </h1>
                <p className="text-neutral-500 font-medium mt-1">
                    {projects.length > 0 ? `${projects.length} проект${projects.length > 4 ? 'ов' : projects.length > 1 ? 'а' : ''}` : 'Нет назначенных проектов'}
                </p>
            </div>

            {/* Accordion List */}
            <div className="flex flex-col gap-3">
                {projects.map((project) => {
                    const isExpanded = expandedId === project.id;
                    const assets = project.video_assets || [];
                    const totalViews = assets.reduce((s, a) => s + (a.views || 0), 0);
                    const totalLikes = assets.reduce((s, a) => s + (a.likes || 0), 0);
                    const colorClass = STATUS_COLORS[project.status] || STATUS_COLORS['Ожидание товара'];

                    return (
                        <div key={project.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden transition-all">
                            {/* Collapsed Header */}
                            <button
                                onClick={() => toggleProject(project.id)}
                                className="w-full p-4 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors text-left"
                            >
                                {/* Expand icon */}
                                <div className="shrink-0 text-neutral-500 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                    <ChevronDown size={18} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
                                        {project.brand || project.brief?.brand || 'Без бренда'}
                                    </div>
                                    <div className="font-bold text-white text-base truncate">
                                        {project.title || project.brief?.title || 'Без названия'}
                                    </div>
                                </div>

                                {/* Quick stats */}
                                <div className="hidden md:flex items-center gap-3">
                                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                                        <Video size={12} /> {assets.length}
                                    </div>
                                    {totalViews > 0 && (
                                        <div className="text-xs text-neutral-500 flex items-center gap-1">
                                            <Eye size={12} /> {formatNumber(totalViews)}
                                        </div>
                                    )}
                                </div>

                                {/* Status badge */}
                                <span className={clsx("text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0", colorClass)}>
                                    {project.status}
                                </span>
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t border-neutral-800 p-4 space-y-4 animate-fade-in">
                                    {/* Description */}
                                    {(project.description || project.brief?.description) && (
                                        <div className="text-sm text-neutral-400 bg-neutral-950 p-3 rounded-xl">
                                            {project.description || project.brief?.description}
                                        </div>
                                    )}

                                    {/* KPI Targets */}
                                    {project.kpi_configs && project.kpi_configs.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">KPI цели</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {project.kpi_configs.map((kpi) => {
                                                    const metricLabel = kpi.metric === 'views' ? 'Просмотры' :
                                                        kpi.metric === 'likes' ? 'Лайки' :
                                                        kpi.metric === 'comments' ? 'Комментарии' :
                                                        kpi.metric === 'reach' ? 'Охват' :
                                                        kpi.metric === 'shares' ? 'Репосты' : kpi.metric;

                                                    const currentValue = kpi.metric === 'views' ? totalViews :
                                                        kpi.metric === 'likes' ? totalLikes :
                                                        kpi.metric === 'comments' ? assets.reduce((s, a) => s + (a.comments || 0), 0) : 0;

                                                    const progress = kpi.target ? Math.min(100, (currentValue / kpi.target) * 100) : 0;

                                                    return (
                                                        <div key={kpi.metric} className="bg-neutral-950 rounded-xl p-3 border border-neutral-800">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                                                                    <Target size={10} /> {metricLabel}
                                                                </span>
                                                                <span className="text-[10px] text-green-400 font-bold">
                                                                    {kpi.rate > 0 && `${kpi.rate}₽/шт`}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-sm font-bold text-white">{formatNumber(currentValue)}</span>
                                                                {kpi.target && <span className="text-xs text-neutral-500">/ {formatNumber(kpi.target)}</span>}
                                                            </div>
                                                            {kpi.target && (
                                                                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                                                                    <div
                                                                        className={clsx("h-1.5 rounded-full transition-all", progress >= 100 ? 'bg-green-500' : 'bg-blue-500')}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload Area */}
                                    {project.status !== 'Закрыто' && (
                                        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Загрузить материал</h4>
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {PLATFORMS.map(p => (
                                                    <button
                                                        key={p.key}
                                                        onClick={() => setSelectedPlatform(selectedPlatform === p.key ? '' : p.key)}
                                                        className={clsx(
                                                            "text-[10px] font-bold px-2.5 py-1 rounded-full transition-all border",
                                                            selectedPlatform === p.key
                                                                ? p.color + ' border-current'
                                                                : 'text-neutral-500 bg-neutral-900 border-neutral-800 hover:border-neutral-600'
                                                        )}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    value={videoUrl}
                                                    onChange={(e) => setVideoUrl(e.target.value)}
                                                    placeholder="https://..."
                                                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                                    disabled={submitting}
                                                />
                                                <button
                                                    onClick={() => handleSubmitUrl(project.id)}
                                                    disabled={submitting || !videoUrl}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                                                >
                                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                    Отправить
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Uploaded Videos */}
                                    {assets.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                                Загруженные материалы ({assets.length})
                                            </h4>
                                            {assets.map((asset) => {
                                                const plat = PLATFORMS.find(p => p.key === asset.platform);
                                                const thumb = asset.thumbnail_url || (asset.video_url.includes('youtu') ? getYouTubeThumbnail(asset.video_url) : '');

                                                return (
                                                    <div key={asset.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex gap-3 items-center">
                                                        {/* Thumbnail */}
                                                        <div className="shrink-0 w-20 aspect-video bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center">
                                                            {thumb ? (
                                                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Video size={16} className="text-neutral-700" />
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-white text-sm truncate mb-0.5">
                                                                {asset.title || 'Без названия'}
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <a href={asset.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-[10px] flex items-center gap-0.5">
                                                                    <ExternalLink size={8} /> Ссылка
                                                                </a>
                                                                {plat && <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-full", plat.color)}>{plat.label}</span>}
                                                                <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                                                                    asset.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                    asset.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                                )}>
                                                                    {asset.status === 'approved' ? '✓ ОК' : asset.status === 'rejected' ? '✗ Откл.' : '⏳'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Metrics */}
                                                        <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400">
                                                            <div className="flex items-center gap-1"><Eye size={10} /> {formatNumber(asset.views)}</div>
                                                            <div className="flex items-center gap-1"><ThumbsUp size={10} /> {formatNumber(asset.likes)}</div>
                                                            <div className="flex items-center gap-1"><MessageCircle size={10} /> {formatNumber(asset.comments)}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    {project.deadline && (
                                        <div className="flex items-center gap-1 text-xs text-red-400 font-medium">
                                            <Clock size={12} /> Дедлайн: {new Date(project.deadline).toLocaleDateString('ru-RU')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {projects.length === 0 && (
                <div className="text-center py-16 text-neutral-600">
                    <Video size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Нет назначенных проектов</p>
                    <p className="text-sm mt-1">Подайте заявку в разделе «Кастинг» или дождитесь назначения администратором.</p>
                </div>
            )}
        </div>
    );
}

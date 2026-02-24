'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    RefreshCw,
    Eye,
    ThumbsUp,
    MessageCircle,
    Edit3,
    ExternalLink,
    Save,
    X,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { useGlobalStore } from '@/store/global';

interface Asset {
    id: string;
    title: string;
    video_url: string;
    views: number;
    likes: number;
    comments: number;
    kpi_bonus: number;
    status: string;
    created_at: string;
    last_stats_update: string | null;
    thumbnail_url?: string;
    project?: { title?: string; brief?: { title?: string } };
    creator?: { full_name?: string; username?: string; avatar_url?: string };
}

const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
};

export default function AdminPage() {
    const userId = useGlobalStore((s) => s.userId);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editMetrics, setEditMetrics] = useState({ views: 0, likes: 0, comments: 0 });

    const fetchAssets = async () => {
        try {
            const res = await fetch(`/api/admin/assets?userId=${userId}`);
            const data = await res.json();
            if (res.ok) setAssets(data.assets || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        fetchAssets();
    }, [userId]);

    const handleAction = async (assetId: string, action: string, extra?: any) => {
        setActionLoading(assetId + action);
        try {
            const res = await fetch(`/api/admin/assets?userId=${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId, action, ...extra })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Ошибка');
            }
            await fetchAssets();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSaveMetrics = async (assetId: string) => {
        await handleAction(assetId, 'update_metrics', editMetrics);
        setEditingId(null);
    };

    const startEditing = (asset: Asset) => {
        setEditingId(asset.id);
        setEditMetrics({ views: asset.views || 0, likes: asset.likes || 0, comments: asset.comments || 0 });
    };

    if (loading) {
        return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка...</div>;
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="bg-green-500/10 text-green-400 border-green-500/20 border text-[10px] font-bold px-2 py-0.5 rounded-full">✓ ОК</span>;
            case 'rejected':
                return <span className="bg-red-500/10 text-red-400 border-red-500/20 border text-[10px] font-bold px-2 py-0.5 rounded-full">✗ Откл.</span>;
            default:
                return <span className="bg-orange-500/10 text-orange-400 border-orange-500/20 border text-[10px] font-bold px-2 py-0.5 rounded-full">⏳ Ожид.</span>;
        }
    };

    const getPlatformLabel = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return { label: 'YouTube', color: 'bg-red-500/20 text-red-400' };
        if (url.includes('tiktok.com')) return { label: 'TikTok', color: 'bg-violet-500/20 text-violet-400' };
        if (url.includes('instagram.com')) return { label: 'Instagram', color: 'bg-pink-500/20 text-pink-400' };
        return { label: 'Ссылка', color: 'bg-neutral-500/20 text-neutral-400' };
    };

    const formatNumber = (n: number) => {
        if (!n) return '0';
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return n.toLocaleString('ru-RU');
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="pt-2 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Админ-панель
                    </h1>
                    <p className="text-neutral-500 font-medium mt-1">Модерация видео и метрики.</p>
                </div>
                <div className="text-sm text-neutral-500">
                    Всего: {assets.length} • На проверке: {assets.filter(a => a.status === 'pending_review').length}
                </div>
            </div>

            {/* Card-based layout for responsiveness */}
            <div className="flex flex-col gap-3">
                {assets.length === 0 ? (
                    <div className="text-neutral-500 text-center py-12">Нет загруженных видео</div>
                ) : assets.map((asset) => {
                    const platform = getPlatformLabel(asset.video_url);
                    const isEditing = editingId === asset.id;
                    const isLoading = actionLoading?.startsWith(asset.id);

                    return (
                        <div key={asset.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 hover:border-neutral-700 transition-colors">
                            {/* Row 1: Creator + Status + Platform */}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white uppercase overflow-hidden shrink-0">
                                        {asset.creator?.avatar_url ? (
                                            <img src={asset.creator.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            asset.creator?.full_name?.charAt(0) || '?'
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{asset.creator?.full_name || asset.creator?.username || '—'}</div>
                                        <div className="text-xs text-neutral-500">
                                            {asset.project?.title || asset.project?.brief?.title || '—'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full", platform.color)}>{platform.label}</span>
                                    {getStatusBadge(asset.status)}
                                </div>
                            </div>

                            {/* Row 2: Video URL + Title */}
                            <div className="flex gap-4 items-center">
                                {/* Thumbnail */}
                                <div className="shrink-0 w-[120px] aspect-video bg-neutral-950 rounded-lg overflow-hidden relative flex items-center justify-center border border-neutral-800">
                                    {asset.thumbnail_url || (asset.video_url && asset.video_url.includes('youtu') && getYouTubeThumbnail(asset.video_url)) ? (
                                        <img
                                            src={asset.thumbnail_url || getYouTubeThumbnail(asset.video_url)}
                                            alt={asset.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-neutral-700">
                                            <Eye size={20} />
                                        </div>
                                    )}
                                </div>
                                {/* Title and URL */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm mb-1 line-clamp-2" title={asset.title || ''}>
                                        {asset.title || 'Без названия'}
                                    </div>
                                    <a href={asset.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs truncate max-w-full flex items-center gap-1">
                                        <ExternalLink size={10} className="shrink-0" />
                                        <span className="truncate">{asset.video_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                    </a>
                                </div>
                            </div>

                            {/* Row 3: Metrics */}
                            {isEditing ? (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[10px] text-neutral-500 uppercase font-medium mb-1 block"><Eye size={10} className="inline mr-1" />Просмотры</label>
                                        <input
                                            type="number"
                                            value={editMetrics.views}
                                            onChange={e => setEditMetrics(p => ({ ...p, views: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-neutral-500 uppercase font-medium mb-1 block"><ThumbsUp size={10} className="inline mr-1" />Лайки</label>
                                        <input
                                            type="number"
                                            value={editMetrics.likes}
                                            onChange={e => setEditMetrics(p => ({ ...p, likes: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-neutral-500 uppercase font-medium mb-1 block"><MessageCircle size={10} className="inline mr-1" />Комменты</label>
                                        <input
                                            type="number"
                                            value={editMetrics.comments}
                                            onChange={e => setEditMetrics(p => ({ ...p, comments: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-neutral-950 rounded-xl p-2.5 text-center">
                                        <div className="text-[10px] text-neutral-500 uppercase font-medium mb-0.5 flex items-center justify-center gap-1"><Eye size={10} />Просм.</div>
                                        <div className="text-base font-black text-white">{formatNumber(asset.views)}</div>
                                    </div>
                                    <div className="bg-neutral-950 rounded-xl p-2.5 text-center">
                                        <div className="text-[10px] text-neutral-500 uppercase font-medium mb-0.5 flex items-center justify-center gap-1"><ThumbsUp size={10} />Лайки</div>
                                        <div className="text-base font-black text-white">{formatNumber(asset.likes)}</div>
                                    </div>
                                    <div className="bg-neutral-950 rounded-xl p-2.5 text-center">
                                        <div className="text-[10px] text-neutral-500 uppercase font-medium mb-0.5 flex items-center justify-center gap-1"><MessageCircle size={10} />Комм.</div>
                                        <div className="text-base font-black text-white">{formatNumber(asset.comments)}</div>
                                    </div>
                                </div>
                            )}

                            {/* Row 4: Actions */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/50">
                                {asset.last_stats_update && (
                                    <span className="text-[10px] text-neutral-600 whitespace-nowrap">
                                        {new Date(asset.last_stats_update).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {!asset.last_stats_update && <span />}

                                <div className="flex items-center gap-1.5 ml-auto">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => handleSaveMetrics(asset.id)}
                                                disabled={!!isLoading}
                                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <Save size={12} /> Сохранить
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-2 py-1.5 rounded-lg transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEditing(asset)}
                                                title="Редактировать метрики"
                                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleAction(asset.id, 'sync')}
                                                disabled={!!isLoading}
                                                title="Синхронизировать метрики"
                                                className="bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                {actionLoading === asset.id + 'sync' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                                Sync
                                            </button>
                                            {asset.status === 'pending_review' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(asset.id, 'approve')}
                                                        disabled={!!isLoading}
                                                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <CheckCircle2 size={12} /> Ок
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(asset.id, 'reject')}
                                                        disabled={!!isLoading}
                                                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <XCircle size={12} /> Откл
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

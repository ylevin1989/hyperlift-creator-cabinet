'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Eye,
    Flame,
    MousePointerClick,
    Share2,
    ThumbsUp,
    Activity
} from 'lucide-react';
import { Flexbox } from '@lobehub/ui';
import { useGlobalStore } from '@/store/global';
import { PLATFORMS, detectPlatform, getYouTubeThumbnail } from '@/lib/utils';

interface VideoStat {
    id: string;
    video_url: string;
    views: number;
    likes: number;
    comments: number;
    cpv: number;
    er: number;
    created_at: string;
    thumbnail_url?: string;
    platform?: string;
    title?: string;
}

interface StatsData {
    profile: {
        trust_score: number;
        available_balance: number;
        holding_balance: number;
    };
    metrics: {
        totalViews: number;
        avgER: string;
        totalVideos: number;
    };
    videos: VideoStat[];
}

export default function StatsPage() {
    const userId = useGlobalStore((s) => s.userId);
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'videos' | 'instagram' | 'posts'>('videos');

    useEffect(() => {
        if (!userId) return;
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/stats?userId=${userId}`);
                const json = await res.json();
                if (res.ok) setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [userId]);

    if (loading) {
        return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка статистики...</div>;
    }

    if (!data) {
        return <div className="p-8 text-red-400 text-center">Ошибка загрузки статистики</div>;
    }

    const displayedVideos = data.videos.filter(v => {
        const plat = v.platform || detectPlatform(v.video_url);
        if (activeTab === 'videos') return ['youtube', 'tiktok', 'likee', 'max'].includes(plat);
        if (activeTab === 'instagram') return plat === 'instagram';
        if (activeTab === 'posts') return ['telegram', 'vk', 'threads'].includes(plat);
        return false;
    });

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-8">

            {/* Header */}
            <div className="pt-2">
                <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                    Аналитика
                </h1>
                <p className="text-neutral-500 font-medium mt-1">Как работает ваш контент.</p>
            </div>

            {/* Trust Score Area */}
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-orange-900/20 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full"></div>
                <Flexbox horizontal align="center" gap={16}>
                    <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-800" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * data.profile.trust_score) / 100} className="text-orange-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">{data.profile.trust_score}</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">Trust Score <Flame size={20} className="text-orange-500" /></h2>
                        <p className="text-sm text-neutral-400 mt-1 max-w-xs">Отличный показатель! Вы сдаете работу в срок без правок. Вам доступны премиум-проекты.</p>
                    </div>
                </Flexbox>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">Просмотры</h3>
                        <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg"><Eye size={16} /></div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{data.metrics.totalViews >= 1000000 ? (data.metrics.totalViews / 1000000).toFixed(1) + 'M' : data.metrics.totalViews >= 1000 ? (data.metrics.totalViews / 1000).toFixed(1) + 'K' : data.metrics.totalViews}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">ER (Вовлеченность)</h3>
                        <div className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg"><Activity size={16} /></div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{data.metrics.avgER}%</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">Баланс Холд</h3>
                        <div className="bg-orange-500/20 text-orange-400 p-1.5 rounded-lg"><TrendingUp size={16} /></div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{data.profile.holding_balance} ₽</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">Всего роликов</h3>
                        <div className="bg-green-500/20 text-green-400 p-1.5 rounded-lg"><MousePointerClick size={16} /></div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{data.metrics.totalVideos}</p>
                </div>
            </div>

            {/* Top Videos */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="text-xl font-bold text-white">Детализация по материалам</h2>
                    <div className="flex bg-neutral-900 p-1 rounded-xl">
                        {['videos', 'instagram', 'posts'].map(tabKey => (
                            <button
                                key={tabKey}
                                onClick={() => setActiveTab(tabKey as any)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tabKey ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                {tabKey === 'videos' ? 'Видеоролики' : tabKey === 'instagram' ? 'Instagram' : 'Текстовые посты'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {displayedVideos.length === 0 ? (
                        <div className="text-neutral-500 text-sm py-4 text-center">Нет материалов в этой категории.</div>
                    ) : displayedVideos.map(video => {
                        const plat = PLATFORMS.find(p => p.key === (video.platform || detectPlatform(video.video_url)));
                        const thumb = video.thumbnail_url || (video.video_url?.includes('youtu') ? getYouTubeThumbnail(video.video_url) : '');
                        return (
                        <div key={video.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                            {/* Thumbnail */}
                            <a href={video.video_url} target="_blank" rel="noreferrer" className="w-full md:w-32 aspect-video bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-neutral-700 relative group block">
                                {thumb ? (
                                    <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                    />
                                ) : null}
                                <span className={`text-white font-black text-xs ${thumb && 'hidden'}`}>
                                    {plat?.label || 'Link'}
                                </span>
                                {plat && (
                                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${plat.color} backdrop-blur-md border border-white/10`}>
                                        {plat.label}
                                    </div>
                                )}
                            </a>

                            <div className="flex-1 w-full flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-white text-sm md:text-base truncate max-w-full md:max-w-[200px]" title={video.title || video.video_url}>{video.title || video.video_url}</h3>
                                    <span className="text-xs text-neutral-500 font-medium">Обновлено: {new Date(video.created_at).toLocaleDateString('ru-RU')}</span>
                                </div>

                                <div className="flex items-center gap-4 md:gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><Eye size={12} /> Просмотры</div>
                                        <div className="font-bold text-white text-base md:text-lg">{video.views >= 1000 ? (video.views / 1000).toFixed(1) + 'K' : video.views}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><ThumbsUp size={12} /> Лайки</div>
                                        <div className="font-bold text-white text-base md:text-lg">{video.likes >= 1000 ? (video.likes / 1000).toFixed(1) + 'K' : video.likes}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><Activity size={12} /> ER</div>
                                        <div className="font-bold text-white text-base md:text-lg">{video.er || 0}%</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><MousePointerClick size={12} /> CPV</div>
                                        <div className="font-bold text-white text-base md:text-lg text-green-400">{video.cpv || 0} ₽</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
}

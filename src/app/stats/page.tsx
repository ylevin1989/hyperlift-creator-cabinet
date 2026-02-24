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

interface VideoStat {
    id: string;
    video_url: string;
    views: number;
    likes: number;
    comments: number;
    cpv: number;
    er: number;
    created_at: string;
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
                <h2 className="text-xl font-bold text-white mb-4">Детализация по роликам</h2>
                <div className="flex flex-col gap-3">
                    {data.videos.length === 0 ? (
                        <div className="text-neutral-500 text-sm">Нет утвержденных роликов с собранной статистикой.</div>
                    ) : data.videos.map(video => (
                        <div key={video.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                                <Share2 className="text-neutral-500" />
                            </div>
                            <div className="flex-1 w-full flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg truncate max-w-[200px]">{video.video_url}</h3>
                                    <span className="text-xs text-neutral-500 font-medium">Обновлено: {new Date(video.created_at).toLocaleDateString('ru-RU')}</span>
                                </div>

                                <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><Eye size={12} /> Просмотры</div>
                                        <div className="font-bold text-white text-lg">{video.views >= 1000 ? (video.views / 1000).toFixed(1) + 'K' : video.views}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><ThumbsUp size={12} /> Лайки</div>
                                        <div className="font-bold text-white text-lg">{video.likes >= 1000 ? (video.likes / 1000).toFixed(1) + 'K' : video.likes}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><Activity size={12} /> ER</div>
                                        <div className="font-bold text-white text-lg">{video.er}%</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><MousePointerClick size={12} /> CPV</div>
                                        <div className="font-bold text-white text-lg text-green-400">{video.cpv} ₽</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

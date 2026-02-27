'use client';

import { useState, useEffect } from 'react';
import {
    BellRing,
    TrendingUp,
    CheckCircle2,
    Eye,
    Wallet,
    Clock,
    MessageSquareWarning,
    ChevronRight,
    Flame,
    ArrowUpRight
} from 'lucide-react';
import { Flexbox, ActionIcon, Avatar } from '@lobehub/ui';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useGlobalStore } from '@/store/global';
import { formatNumber } from '@/lib/utils';

export default function DashboardPage() {
    const router = useRouter();
    const userId = useGlobalStore((s) => s.userId);

    const [stats, setStats] = useState<any>(null);
    const [activeProjects, setActiveProjects] = useState<any[]>([]);
    const [suggestedBriefs, setSuggestedBriefs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                const [statsRes, projectsRes, briefsRes] = await Promise.all([
                    fetch(`/api/stats?userId=${userId}`),
                    fetch(`/api/projects?userId=${userId}`),
                    fetch(`/api/briefs`)
                ]);

                if (statsRes.ok) {
                    const d = await statsRes.json();
                    setStats(d);
                }
                if (projectsRes.ok) {
                    const d = await projectsRes.json();
                    // Just take top 2 active
                    setActiveProjects((d.projects || []).filter((p: any) => p.status !== 'Утверждено').slice(0, 2));
                }
                if (briefsRes.ok) {
                    const d = await briefsRes.json();
                    // top 2 latest briefs
                    setSuggestedBriefs((d.briefs || []).slice(0, 2));
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка дашборда...</div>;
    }

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-8">

            {/* Header */}
            <Flexbox horizontal justify={'space-between'} align={'center'} className="pt-2">
                <div>
                    <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Привет, креатор! 👋
                    </h1>
                    <p className="text-neutral-500 font-medium mt-1">Вот твоя сводка на сегодня.</p>
                </div>
                <ActionIcon icon={BellRing} size="large" title="Уведомления" className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800" />
            </Flexbox>

            {/* Alerts / Notifications */}
            {activeProjects.some(p => p.status === 'Правки') && (
                <div className="flex flex-col gap-3">
                    <div className="flex bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl gap-4 items-start">
                        <div className="bg-amber-500 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                            <MessageSquareWarning size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-500">Правки от модератора</h4>
                            <p className="text-sm text-amber-200/70 mt-0.5">У вас есть проекты на доработке (&quot;Правки&quot;).</p>
                        </div>
                        <ActionIcon icon={ChevronRight} className="text-amber-400" />
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Balance */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                        <div className="absolute -right-6 -top-6 text-white/10">
                            <Wallet size={120} />
                        </div>
                        <h3 className="text-blue-200 font-medium text-sm">Доступно</h3>
                        <p className="text-3xl font-black text-white mt-1">{Math.floor(stats.profile?.available_balance || 0)} ₽</p>
                        {stats.metrics?.totalKpi > 0 && (
                            <p className="text-xs text-blue-200 mt-1">Из них по KPI: +{Math.floor(stats.metrics.totalKpi)} ₽</p>
                        )}
                    </div>

                    {/* Views */}
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-neutral-400 font-medium text-sm">Охват</h3>
                            <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg"><Eye size={16} /></div>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatNumber(stats.metrics?.totalViews || 0)}</p>
                    </div>

                    {/* Approved */}
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-neutral-400 font-medium text-sm">Утверждено</h3>
                            <div className="bg-green-500/20 text-green-400 p-1.5 rounded-lg"><CheckCircle2 size={16} /></div>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.metrics?.totalVideos || 0} <span className="text-sm font-normal text-neutral-500">роликов</span></p>
                    </div>

                    {/* Trust Score */}
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
                        <div className="text-orange-500 mb-1"><Flame size={24} className="drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] fill-orange-500/20" /></div>
                        <p className="text-2xl font-black text-white">{stats.profile?.trust_score || 0}</p>
                        <h3 className="text-neutral-500 font-medium text-xs mt-1 uppercase tracking-wider">Рейтинг доверия</h3>
                    </div>
                </div>
            )}

            {/* Active Projects */}
            <div>
                <Flexbox horizontal justify={'space-between'} align={'center'} className="mb-4 mt-2">
                    <h2 className="text-xl font-bold text-white">В работе</h2>
                    <button onClick={() => router.push('/projects')} className="text-sm text-blue-500 hover:text-blue-400 font-medium">Все проекты</button>
                </Flexbox>

                <div className="flex flex-col gap-3">
                    {activeProjects.length === 0 ? (
                        <div className="text-neutral-500 text-sm">Нет текущих задач. Выберите новый бриф на витрине!</div>
                    ) : activeProjects.map(project => (
                        <div key={project.id} onClick={() => router.push('/projects')} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-neutral-700 transition-colors cursor-pointer group">
                            <div className="w-16 h-16 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0">
                                <Clock className="text-neutral-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded-md font-medium border border-neutral-700">{project.status}</span>
                                    {project.deadline && <span className="text-xs text-red-500 font-medium">Дедлайн: {new Date(project.deadline).toLocaleDateString()}</span>}
                                </div>
                                <h3 className="font-bold text-white text-lg">{project.title || project.brief?.title}</h3>
                                <p className="text-sm text-neutral-400">Бренд: {project.brief?.brand || 'Без бренда'}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-white">{project.reward} ₽</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Suggested Briefs */}
            <div>
                <Flexbox horizontal justify={'space-between'} align={'center'} className="mb-4 mt-2">
                    <h2 className="text-xl font-bold text-white">Подобрано для вас</h2>
                    <button onClick={() => router.push('/briefs')} className="text-sm text-neutral-400 hover:text-white font-medium flex items-center gap-1">На витрину <ChevronRight size={14} /></button>
                </Flexbox>

                <div className="grid md:grid-cols-2 gap-4">
                    {suggestedBriefs.length === 0 ? (
                        <div className="text-neutral-500 text-sm col-span-2">Нет новых брифов</div>
                    ) : suggestedBriefs.map(brief => (
                        <div key={brief.id} onClick={() => router.push('/briefs')} className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md font-medium border border-white/10">{brief.format}</span>
                            </div>
                            <h3 className="font-bold text-xl text-white mt-8 mb-2">{brief.title}</h3>
                            <p className="text-sm text-neutral-400 line-clamp-2 mb-4">{brief.description}</p>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="font-black text-blue-400 text-lg">от {brief.reward} ₽</div>
                                <button className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">Смотреть</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

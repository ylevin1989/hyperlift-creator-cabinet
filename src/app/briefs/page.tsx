'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Target, Wallet, ArrowRight, Video, CheckCircle2 } from 'lucide-react';
import { ActionIcon } from '@lobehub/ui';
import clsx from 'clsx';
import { useGlobalStore } from '@/store/global';
import { useRouter } from 'next/navigation';

interface Brief {
    id: string;
    brand: string;
    title: string;
    format: string;
    niche: string;
    reward: number;
    description: string;
    requirements: string;
    cover_url?: string;
    status: string;
}

const CATEGORIES = ['Все', 'Beauty', 'Apps', 'Gadgets', 'Лайфстайл', 'Одежда'];

export default function BriefsPage() {
    const [activeTab, setActiveTab] = useState('Все');
    const [briefs, setBriefs] = useState<Brief[]>([]);
    const [loading, setLoading] = useState(true);
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const userId = useGlobalStore((s) => s.userId);
    const router = useRouter();

    useEffect(() => {
        const fetchBriefs = async () => {
            try {
                const nicheParam = activeTab !== 'Все' ? `?niche=${activeTab}` : '';
                const res = await fetch(`/api/briefs${nicheParam}`);
                const data = await res.json();
                if (res.ok) setBriefs(data.briefs || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBriefs();
    }, [activeTab]);

    // Load existing applications
    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const res = await fetch(`/api/applications?userId=${userId}`);
                const data = await res.json();
                if (res.ok && data.applications) {
                    const ids = new Set<string>(data.applications.map((a: any) => a.brief_id));
                    setAppliedIds(ids);
                }
            } catch (e) { console.error(e); }
        })();
    }, [userId]);

    const handleApply = async (briefId: string) => {
        if (!userId) {
            router.push('/login');
            return;
        }
        setApplyingId(briefId);
        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'apply', briefId, userId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAppliedIds(prev => new Set(prev).add(briefId));
            } else {
                alert(data.error || 'Ошибка отклика');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setApplyingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка брифов...</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">

            {/* Header */}
            <div className="pt-2">
                <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                    Кастинг
                </h1>
                <p className="text-neutral-500 font-medium mt-1">Откликайся на брифы и зарабатывай.</p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <ActionIcon icon={Search} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" disabled />
                    <input
                        type="text"
                        placeholder="Поиск брендов, форматов..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    />
                </div>
                <button className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-6 py-3 font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors">
                    <SlidersHorizontal size={18} />
                    Фильтры
                </button>
            </div>

            {/* Categories Horizontal Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={clsx(
                            'whitespace-nowrap px-5 py-2 rounded-full font-medium text-sm transition-all border',
                            activeTab === cat
                                ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Brief Cards Grid */}
            <div className="grid md:grid-cols-2 gap-5 mt-2">
                {briefs.length === 0 ? (
                    <div className="text-neutral-500 text-sm col-span-2 text-center py-12">Нет доступных брифов в категории «{activeTab}».</div>
                ) : briefs.map(brief => (
                    <div key={brief.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col group hover:border-neutral-700 transition-colors">
                        {/* Card Header */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center ring-2 ring-neutral-700 text-white font-black text-lg uppercase">
                                {brief.brand?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg leading-tight">{brief.brand}</h3>
                                <p className="text-neutral-400 text-sm font-medium">{brief.title}</p>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {brief.format && (
                                <span className="flex items-center gap-1 bg-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded-lg font-medium">
                                    <Video size={12} /> {brief.format}
                                </span>
                            )}
                            {brief.niche && (
                                <span className="flex items-center gap-1 bg-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded-lg font-medium">
                                    <Target size={12} /> {brief.niche}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-neutral-400 text-sm mb-4 line-clamp-2">{brief.description}</p>

                        {/* Requirements line */}
                        {brief.requirements && (
                            <div className="bg-neutral-950/50 rounded-xl p-3 mb-5 border border-neutral-800/50">
                                <p className="text-xs text-neutral-500 leading-relaxed"><span className="text-white/70 font-medium">Кого ищем:</span> {brief.requirements}</p>
                            </div>
                        )}

                        {/* Footer with Action */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-800">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
                                    <Wallet size={16} />
                                </div>
                                <div className="font-black text-white">от {brief.reward} ₽</div>
                            </div>

                            {appliedIds.has(brief.id) ? (
                                <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                    <CheckCircle2 size={18} /> Вы откликнулись
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleApply(brief.id)}
                                    disabled={applyingId === brief.id}
                                    className="bg-white text-black hover:bg-neutral-200 disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(255,255,255,0.1)]"
                                >
                                    {applyingId === brief.id ? 'Отправка...' : 'Откликнуться'} <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

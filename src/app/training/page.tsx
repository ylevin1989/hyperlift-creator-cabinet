'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    BookOpen, Search, Clock, ChevronRight, LifeBuoy,
    MessageCircleQuestion, Scale, BookMarked, ArrowRight
} from 'lucide-react';
import { CATEGORIES, ArticleCategory } from '@/data/articles';

interface DBArticle {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    category: ArticleCategory;
    read_time: number;
    cover_image: string;
    content: string;
    published: boolean;
}

const CATEGORY_COLORS: Record<ArticleCategory, { bg: string; text: string; border: string }> = {
    production: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    platforms: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    monetization: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    content: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    legal: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

export default function TrainingPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<ArticleCategory | 'all'>('all');
    const [articles, setArticles] = useState<DBArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/articles')
            .then(r => r.json())
            .then(d => { setArticles(d.articles || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        let list = articles.filter(a => a.published);
        if (activeCategory !== 'all') list = list.filter(a => a.category === activeCategory);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q));
        }
        return list;
    }, [search, activeCategory, articles]);

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-8">
            {/* Hero */}
            <div className="relative pt-2 pb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 rounded-3xl -m-4 pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl">
                            <BookOpen size={22} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                            Обучение
                        </h1>
                    </div>
                    <p className="text-neutral-400 font-medium mt-1 max-w-lg">
                        {articles.length} статей по продакшену, платформам, монетизации и юридическим вопросам для креаторов.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative -mt-2">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Поиск по урокам и статьям..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mt-2 scrollbar-hide">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                            activeCategory === cat.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                        }`}
                    >
                        <span>{cat.emoji}</span>
                        {cat.label}
                        {cat.key !== 'all' && (
                            <span className="text-[10px] opacity-60">
                                {articles.filter(a => a.category === cat.key).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Featured */}
            {activeCategory === 'all' && !search.trim() && (
                <div className="grid md:grid-cols-2 gap-4 -mt-2">
                    <div className="bg-gradient-to-br from-blue-900/40 to-neutral-900 border border-blue-500/20 p-6 rounded-3xl flex flex-col justify-between">
                        <div>
                            <div className="bg-blue-500/20 text-blue-400 p-2 rounded-xl w-fit mb-4"><LifeBuoy size={24} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Нужна помощь?</h3>
                            <p className="text-sm text-neutral-400">Создайте тикет в службу технической поддержки.</p>
                        </div>
                        <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2">
                            <MessageCircleQuestion size={18} /> Поддержка
                        </button>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/40 to-neutral-900 border border-purple-500/20 p-6 rounded-3xl flex flex-col justify-between">
                        <div>
                            <div className="bg-purple-500/20 text-purple-400 p-2 rounded-xl w-fit mb-4"><Scale size={24} /></div>
                            <h3 className="text-xl font-bold text-white mb-2">Юридический блок</h3>
                            <p className="text-sm text-neutral-400">Маркировка рекламы, авторские права, ОРД.</p>
                        </div>
                        <button onClick={() => setActiveCategory('legal')} className="mt-6 bg-purple-600/80 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2">
                            <BookMarked size={18} /> Перейти к статьям
                        </button>
                    </div>
                </div>
            )}

            {/* Articles Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                        {activeCategory === 'all' ? 'Все статьи' : CATEGORIES.find(c => c.key === activeCategory)?.label}
                    </h2>
                    <span className="text-sm text-neutral-500">{filtered.length} {filtered.length === 1 ? 'статья' : filtered.length < 5 ? 'статьи' : 'статей'}</span>
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden animate-pulse">
                                <div className="aspect-[16/9] bg-neutral-800" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-neutral-800 rounded w-3/4" />
                                    <div className="h-3 bg-neutral-800 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-2xl">
                        <Search size={36} className="mx-auto text-neutral-600 mb-3" />
                        <p className="text-neutral-400">Ничего не найдено{search ? ` по запросу «${search}»` : ''}</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((article, i) => {
                            const colors = CATEGORY_COLORS[article.category];
                            const catLabel = CATEGORIES.find(c => c.key === article.category);
                            return (
                                <div
                                    key={article.slug}
                                    onClick={() => router.push(`/training/${article.slug}`)}
                                    className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group cursor-pointer hover:border-neutral-700 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                                >
                                    <div className="relative aspect-[16/9] overflow-hidden">
                                        <img src={article.cover_image} alt={article.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                                        <div className="absolute top-3 left-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} backdrop-blur-sm`}>
                                                {catLabel?.emoji} {catLabel?.label}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] text-neutral-300 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                            <Clock size={10} /> {article.read_time} мин
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-white text-sm leading-snug mb-2 group-hover:text-blue-400 transition-colors">{article.title}</h3>
                                        <p className="text-xs text-neutral-500 leading-relaxed flex-1">{article.excerpt}</p>
                                        <div className="flex items-center gap-1 mt-3 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            Читать <ArrowRight size={12} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

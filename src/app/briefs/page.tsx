'use client';

import { Flexbox, ActionIcon } from '@lobehub/ui';
import { Search, Filter, SlidersHorizontal, MapPin, Target, Wallet, ArrowRight, Video } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const MOCK_BRIEFS = [
    {
        id: 1,
        brand: 'GlowUp Cosmetics',
        logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=100&h=100&fit=crop',
        title: 'Набор для ухода за лицом',
        format: 'Testimonial',
        niche: 'Beauty',
        reward: '8 000 ₽ + Товар',
        kpi: false,
        description: 'Нужен честный отзыв на новую линейку сывороток после 7 дней использования.',
        requirements: 'Девушки 18-35 лет, чистая кожа.',
    },
    {
        id: 2,
        brand: 'FitApp',
        logo: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop',
        title: 'Подписка на фитнес-трекер',
        format: 'Sketch',
        niche: 'Apps',
        reward: 'Фикс 12 000 ₽ + 15% CPA',
        kpi: true,
        description: 'Смешной скетч про попытки начать бегать с понедельника. Интеграция приложения в развязке.',
        requirements: 'Любой пол, наличие кроссовок.',
    },
    {
        id: 3,
        brand: 'TechGear',
        logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
        title: 'TWS Наушники SoundPro',
        format: 'Unboxing',
        niche: 'Gadgets',
        reward: '15 000 ₽',
        kpi: false,
        description: 'ASMR распаковка наушников. Акцент на премиальный дизайн кейса и звук щёлканья.',
        requirements: 'Эстетичный фон (минимализм), хороший свет.',
    }
];

const CATEGORIES = ['Все', 'Beauty', 'Apps', 'Gadgets', 'Лайфстайл', 'Одежда'];

export default function BriefsPage() {
    const [activeTab, setActiveTab] = useState('Все');

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
                {MOCK_BRIEFS.filter(b => activeTab === 'Все' || b.niche === activeTab).map(brief => (
                    <div key={brief.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col group hover:border-neutral-700 transition-colors">
                        {/* Card Header */}
                        <div className="flex items-start gap-4 mb-4">
                            <img src={brief.logo} alt={brief.brand} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-neutral-800" />
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg leading-tight">{brief.brand}</h3>
                                <p className="text-neutral-400 text-sm font-medium">{brief.title}</p>
                            </div>
                            {brief.kpi && (
                                <div className="bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg">CPA + %</div>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="flex items-center gap-1 bg-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded-lg font-medium">
                                <Video size={12} /> {brief.format}
                            </span>
                            <span className="flex items-center gap-1 bg-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded-lg font-medium">
                                <Target size={12} /> {brief.niche}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-neutral-400 text-sm mb-4 line-clamp-2">{brief.description}</p>

                        {/* Requirements line */}
                        <div className="bg-neutral-950/50 rounded-xl p-3 mb-5 border border-neutral-800/50">
                            <p className="text-xs text-neutral-500 leading-relaxed"><span className="text-white/70 font-medium">Кого ищем:</span> {brief.requirements}</p>
                        </div>

                        {/* Footer with Action */}
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-800">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
                                    <Wallet size={16} />
                                </div>
                                <div className="font-black text-white">{brief.reward}</div>
                            </div>

                            <button className="bg-white text-black hover:bg-neutral-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-[0_4px_14px_0_rgba(255,255,255,0.1)]">
                                Откликнуться <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

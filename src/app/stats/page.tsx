'use client';

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

const MOCK_VIDEOS_STATS = [
    { id: 1, name: 'Polaroid Распаковка', date: '12 Апр', views: '124K', likes: '12.4K', er: '11.5%', cpv: '0.12 ₽', thumbnail: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&h=100&fit=crop' },
    { id: 2, name: 'Скетч FitApp', date: '05 Апр', views: '450K', likes: '55K', er: '14.2%', cpv: '0.08 ₽', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop' },
    { id: 3, name: 'Обзор мыши TechGear', date: '28 Мар', views: '89K', likes: '5.1K', er: '8.1%', cpv: '0.15 ₽', thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop' },
];

export default function StatsPage() {
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
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="5" className="text-orange-500" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">98</span>
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
                    <p className="text-3xl font-bold text-white mb-2">1.2M</p>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-md font-medium">+15.2% к прошлому</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">ER (Вовлеченность)</h3>
                        <div className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg"><Activity size={16} /></div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">12.4%</p>
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-md font-medium">-1.2% к прошлому</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">Средний CPV</h3>
                        <div className="bg-green-500/20 text-green-400 p-1.5 rounded-lg"><MousePointerClick size={16} /></div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">0.10 ₽</p>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-md font-medium">+0.02 ₽ к прошлому</span>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">Конверсии (CPA)</h3>
                        <div className="bg-orange-500/20 text-orange-400 p-1.5 rounded-lg"><TrendingUp size={16} /></div>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">142</p>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-md font-medium">+42 к прошлому</span>
                </div>
            </div>

            {/* Top Videos */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Детализация по роликам</h2>
                <div className="flex flex-col gap-3">
                    {MOCK_VIDEOS_STATS.map(video => (
                        <div key={video.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
                            <img src={video.thumbnail} alt={video.name} className="w-16 h-16 rounded-xl object-cover" />
                            <div className="flex-1 w-full flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{video.name}</h3>
                                    <span className="text-xs text-neutral-500 font-medium">Опубликовано: {video.date}</span>
                                </div>

                                <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar">
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><Eye size={12} /> Просмотры</div>
                                        <div className="font-bold text-white text-lg">{video.views}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><ThumbsUp size={12} /> Лайки</div>
                                        <div className="font-bold text-white text-lg">{video.likes}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><Activity size={12} /> ER</div>
                                        <div className="font-bold text-white text-lg">{video.er}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-medium flex items-center gap-1 mb-1"><MousePointerClick size={12} /> CPV</div>
                                        <div className="font-bold text-white text-lg text-green-400">{video.cpv}</div>
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

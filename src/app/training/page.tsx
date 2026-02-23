'use client';

import {
    BookOpen,
    Video,
    FileText,
    LifeBuoy,
    ChevronRight,
    MessageCircleQuestion,
    Search,
    BookMarked
} from 'lucide-react';
import { ActionIcon } from '@lobehub/ui';

export default function TrainingPage() {
    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-8">

            {/* Header */}
            <div className="pt-2">
                <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                    Обучение
                </h1>
                <p className="text-neutral-500 font-medium mt-1">База знаний и поддержка креатора.</p>
            </div>

            <div className="relative">
                <ActionIcon icon={Search} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" disabled />
                <input
                    type="text"
                    placeholder="Поиск по урокам и статьям..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl py-3 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4 -mt-2">
                {/* Support Block */}
                <div className="bg-gradient-to-br from-blue-900/40 to-neutral-900 border border-blue-500/20 p-6 rounded-3xl flex flex-col justify-between">
                    <div>
                        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-xl w-fit mb-4">
                            <LifeBuoy size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Нужна помощь?</h3>
                        <p className="text-sm text-neutral-400">Создайте тикет в службу технической поддержки (проблемы с загрузкой, блокировки, споры).</p>
                    </div>

                    <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2">
                        <MessageCircleQuestion size={18} /> Связаться с поддержкой
                    </button>
                </div>

                {/* Legal Guide Block */}
                <div className="bg-gradient-to-br from-purple-900/40 to-neutral-900 border border-purple-500/20 p-6 rounded-3xl flex flex-col justify-between">
                    <div>
                        <div className="bg-purple-500/20 text-purple-400 p-2 rounded-xl w-fit mb-4">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Юридический блок</h3>
                        <p className="text-sm text-neutral-400">Работа в рамках закона: маркировка рекламы, авторские права на музыку и интеграция Консоль.Про.</p>
                    </div>

                    <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-800">
                            <div className="flex items-center gap-2 text-sm text-white font-medium">
                                <BookMarked size={16} className="text-purple-400" /> Основы маркировки (erid)
                            </div>
                            <ChevronRight size={16} className="text-neutral-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Guides */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Гайды по продакшену</h2>
                <div className="grid md:grid-cols-3 gap-4">

                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group cursor-pointer hover:border-neutral-700 transition-colors">
                        <div className="relative aspect-video">
                            <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=225&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center pl-1">
                                    <Video size={20} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white text-sm">Идеальный свет дома</h3>
                            <p className="text-xs text-neutral-500 mt-1">Как снять кино на телефон с 1 кольцевой лампой.</p>
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group cursor-pointer hover:border-neutral-700 transition-colors">
                        <div className="relative aspect-video">
                            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=225&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center pl-1">
                                    <Video size={20} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white text-sm">ASMR Распаковка</h3>
                            <p className="text-xs text-neutral-500 mt-1">Правильная запись звука без студии.</p>
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden group cursor-pointer hover:border-neutral-700 transition-colors">
                        <div className="relative aspect-video">
                            <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=225&fit=crop" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center pl-1">
                                    <Video size={20} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-white text-sm">Скетчи и Юмор</h3>
                            <p className="text-xs text-neutral-500 mt-1">Как нативно интегрировать продукт в сюжет.</p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
